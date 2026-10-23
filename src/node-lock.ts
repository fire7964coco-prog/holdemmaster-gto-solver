import { defineStore } from "pinia";
import type * as Comlink from "comlink";
import type { Handler } from "./worker";
import type { Results } from "./result-types";
import { decodeResults } from "./results-decode";

export type NodeLock = {
  history: number[];
  player: "oop" | "ip";
  label: string;
  actions: { name: string; amount: string; color: string }[];
  numHands: number;
  percentages: number[];
  // Canonical action-major vector. Future hand-specific editing can populate
  // this directly without changing the engine application or snapshot paths.
  strategy: number[];
};

export type NodeSummary = {
  history: number[];
  label: string;
  player: "oop" | "ip";
  actions: { name: string; frequency: number; ev: number }[];
  ev: number[];
};

export type LockSnapshot = {
  nodes: NodeSummary[];
  exploitability: number;
  lockCount: number;
};

export class NodeLockError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "NodeLockError";
  }
}

export function sameHistory(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((action, index) => action === b[index]);
}

function historyBuffer(history: number[]): Uint32Array {
  if (!Array.isArray(history) || history.some(action =>
    !Number.isInteger(action) || action < 0 || action > 0xffffffff)) {
    // Reject skipped chance cards (-1) before Uint32Array can wrap them.
    throw new NodeLockError("LOCK_INVALID_HISTORY");
  }
  return Uint32Array.from(history);
}

export function expandUniform(percentages: number[], numHands: number): number[] {
  if (!Number.isSafeInteger(numHands) || numHands <= 0 || percentages.length === 0 ||
    percentages.some(value => !Number.isFinite(value) || value < 0 || value > 100) ||
    Math.abs(percentages.reduce((sum, value) => sum + value, 0) - 100) > 1e-6) {
    throw new NodeLockError("LOCK_INVALID_PERCENTAGES");
  }
  // A zero action is locked to 0% because another action has a positive value.
  // An entirely nonpositive hand is unlocked under the engine's vector rules.
  return percentages.flatMap(value => Array<number>(numHands).fill(value / 100));
}

function copyLock(lock: NodeLock): NodeLock {
  return {
    history: [...lock.history],
    player: lock.player,
    label: lock.label,
    actions: lock.actions.map(action => ({ ...action })),
    numHands: lock.numHands,
    percentages: [...lock.percentages],
    strategy: [...lock.strategy],
  };
}

export const useNodeLockStore = defineStore("node-lock", {
  state: () => ({
    locks: [] as NodeLock[],
    appliedLocks: [] as NodeLock[],
    busy: false,
    error: "",
    solveRequest: 0,
    before: null as LockSnapshot | null,
    after: null as LockSnapshot | null,
    resultLockCount: 0,
    currentExploitability: null as number | null,
    epoch: 0,
  }),
  actions: {
    reset() {
      this.locks = [];
      this.appliedLocks = [];
      this.busy = false;
      this.error = "";
      this.solveRequest = 0;
      this.before = null;
      this.after = null;
      this.resultLockCount = 0;
      this.currentExploitability = null;
      this.epoch++;
    },
    upsert(lock: NodeLock) {
      if (this.busy) return;
      historyBuffer(lock.history);
      const index = this.locks.findIndex(item => sameHistory(item.history, lock.history));
      const saved = copyLock(lock);
      if (index === -1) this.locks.push(saved);
      else this.locks.splice(index, 1, saved);
      this.error = "";
    },
    remove(history: number[]) {
      if (this.busy) return;
      this.locks = this.locks.filter(lock => !sameHistory(lock.history, history));
      this.error = "";
    },
    requestSolve() {
      if (this.busy) return;
      this.busy = true;
      this.error = "";
      this.solveRequest++;
    },
  },
});

// ResultTable excludes zero-weight/zero-normalizer hands, then averages by
// normalizer. Keep unreachable or invalid summaries as NaN, never as 0%/0 EV.
function normalizedMean(values: number[], results: Results, player: number): number {
  const weights = results.weights[player];
  const normalizer = results.normalizer[player];
  if (values.length !== normalizer.length || weights.length !== normalizer.length) {
    return Number.NaN;
  }
  let sum = 0;
  let mass = 0;
  for (let hand = 0; hand < normalizer.length; hand++) {
    const weight = weights[hand];
    const n = normalizer[hand];
    if (!Number.isFinite(weight) || weight < 0 || !Number.isFinite(n) || n < 0) {
      return Number.NaN;
    }
    if (weight === 0 || n === 0) continue;
    if (!Number.isFinite(values[hand])) return Number.NaN;
    sum += values[hand] * n;
    mass += n;
  }
  const mean = sum / mass;
  return mass > 0 && Number.isFinite(mean) ? mean : Number.NaN;
}

export async function captureSnapshot(
  remote: Comlink.Remote<Handler>,
  locks: NodeLock[],
  exploitability: number,
  lockCount: number
): Promise<LockSnapshot> {
  const nodes: NodeSummary[] = [];
  try {
    const targets: { history: number[]; label: string }[] = [{ history: [], label: "" }];
    for (const lock of locks) {
      historyBuffer(lock.history);
      if (!targets.some(target => sameHistory(target.history, lock.history))) {
        targets.push({ history: [...lock.history], label: lock.label });
      }
    }
    const lengths = [
      (await remote.privateCards(0)).length,
      (await remote.privateCards(1)).length,
    ];
    for (const target of targets) {
      const history = historyBuffer(target.history);
      // strategyAt validates the entire path without a WASM panic and returns
      // to root. Only then may the unguarded legacy applyHistory traverse it.
      if ((await remote.strategyAt(history)).length === 0) {
        throw new NodeLockError("LOCK_INVALID_HISTORY");
      }
      await remote.applyHistory(history);
      const player = await remote.currentPlayer();
      if (player !== "oop" && player !== "ip") {
        throw new NodeLockError("LOCK_INVALID_HISTORY");
      }
      const numActions = await remote.numActions();
      const actionNames = (await remote.actionsAfter(new Uint32Array())).split("/");
      const results = decodeResults(await remote.getResults(), lengths, player, numActions);
      const playerIndex = player === "oop" ? 0 : 1;
      const numHands = lengths[playerIndex];
      nodes.push({
        history: [...target.history],
        label: target.label || player.toUpperCase(),
        player,
        actions: Array.from({ length: numActions }, (_, action) => {
          const start = action * numHands;
          return {
            name: actionNames[action],
            frequency: normalizedMean(results.strategy.slice(start, start + numHands), results, playerIndex),
            ev: normalizedMean(results.actionEv.slice(start, start + numHands), results, playerIndex),
          };
        }),
        ev: [0, 1].map(side => normalizedMean(results.ev[side], results, side)),
      });
    }
    return { nodes, exploitability, lockCount };
  } finally {
    await remote.applyHistory(new Uint32Array());
  }
}
