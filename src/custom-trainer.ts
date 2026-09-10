import { reactive } from "vue";
import {
  BEST_LOSS_FLOOR_BB,
  BEST_LOSS_RATIO,
  GOOD_LOSS_FLOOR_BB,
  GOOD_LOSS_RATIO,
  makeTrainerQuestion,
} from "./trainer";
import type { TrainerDecision, TrainerHistoryAction, TrainerQuestion } from "./trainer";

/** This module is reachable only through the trainer feature build. */
export const customTrainerState = reactive({
  active: false,
  selectedBankId: null as string | null,
});

export type CustomTrainerCapture = {
  configSnapshot: unknown;
  locks: unknown[];
  unitScale: number;
  targetExploitabilityPct: number;
  achievedExploitabilityPct: number;
  exportAt: (path: number[]) => Promise<TrainerDecision | null>;
  restore: () => Promise<void>;
};

export type CustomTrainerBank = {
  id: string;
  createdAt: number;
  board: number[];
  startingPot: number;
  effectiveStack: number;
  unitScale: number;
  lockCount: number;
  targetExploitabilityPct: number;
  achievedExploitabilityPct: number;
  configSnapshot: unknown;
  locks: unknown[];
  nodes: TrainerDecision[];
};

export type CustomTrainerQuestion = Omit<TrainerQuestion, "category"> & {
  category: "custom";
};

export type CustomTrainerAttempt = {
  id?: number;
  clientId: string;
  timestamp: number;
  questionId: string;
  presetId: string;
  category: "custom";
  bankCreatedAt: number;
  handPair: number;
  selectedAction: number;
  bestAction: number;
  /** Legacy evaluation field name: the value is chips when unitScale is 1. */
  evLossBb: number;
};

// Saved config and solver exports contain only JSON data. Copy them before
// awaiting a worker so later Pinia edits cannot change an existing question.
const copyJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map(key =>
      `${JSON.stringify(key)}:${canonicalJson(record[key])}`
    ).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function playableHand(node: TrainerDecision, hand: number): boolean {
  const side = node.selectedSpot.player === "oop" ? 0 : 1;
  const pair = node.cards[side][hand];
  return hand >= 0 && Number.isInteger(pair) &&
    node.results.normalizer[side][hand] > 0 &&
    node.results.weights[side][hand] > 0 &&
    !node.currentBoard.includes(pair & 0xff) &&
    !node.currentBoard.includes(pair >>> 8);
}

function reachableHands(node: TrainerDecision): boolean {
  const side = node.selectedSpot.player === "oop" ? 0 : 1;
  return node.cards[side].some((_, hand) => playableHand(node, hand));
}

/** Reject incomplete/local-corrupt snapshots before they can reach a question UI. */
export function isCustomTrainerBank(value: unknown): value is CustomTrainerBank {
  try {
    const bank = value as CustomTrainerBank;
    if (!/^custom:[a-f0-9]{12}$/.test(bank.id) ||
      !Number.isFinite(bank.createdAt) || bank.createdAt <= 0 ||
      ![1, 10].includes(bank.unitScale) ||
      !Number.isFinite(bank.startingPot) || bank.startingPot <= 0 ||
      !Number.isFinite(bank.effectiveStack) || bank.effectiveStack <= 0 ||
      !Number.isFinite(bank.targetExploitabilityPct) || bank.targetExploitabilityPct < 0 ||
      !Number.isFinite(bank.achievedExploitabilityPct) || bank.achievedExploitabilityPct < 0 ||
      !Array.isArray(bank.locks) || bank.lockCount !== bank.locks.length ||
      !Array.isArray(bank.board) || bank.board.length < 3 || bank.board.length > 5 ||
      bank.board.some(card => !Number.isInteger(card) || card < 0 || card > 51) ||
      new Set(bank.board).size !== bank.board.length ||
      !Array.isArray(bank.nodes) || !bank.nodes.length || bank.nodes.length > 3) return false;
    return bank.nodes.every(node => {
      if (node.selectedSpot.type !== "player" ||
        !["oop", "ip"].includes(node.selectedSpot.player) ||
        node.unitScale !== bank.unitScale || node.startingPot !== bank.startingPot ||
        node.effectiveStack !== bank.effectiveStack ||
        !Array.isArray(node.path) || node.path.some(action => !Number.isInteger(action) || action < 0) ||
        node.nodeId !== (node.path.length ? node.path.join("-") : "root") ||
        !Array.isArray(node.history) || node.history.length !== node.path.length ||
        node.history.some(action => !["oop", "ip"].includes(action.player) ||
          typeof action.name !== "string" || typeof action.amount !== "string") ||
        node.currentBoard.join(",") !== bank.board.join(",") ||
        node.selectedSpot.actions.length < 2 ||
        node.results.numActions !== node.selectedSpot.actions.length ||
        node.selectedSpot.actions.some(action => typeof action.name !== "string" ||
          typeof action.amount !== "string")) return false;
      const pot = node.selectedSpot.pot ?? node.startingPot;
      if (!Number.isFinite(pot) || pot <= 0 || ![0, 1].every(side =>
        Array.isArray(node.cards[side]) &&
        node.results.weights[side].length === node.cards[side].length &&
        node.results.normalizer[side].length === node.cards[side].length)) return false;
      const side = node.selectedSpot.player === "oop" ? 0 : 1;
      const hands = node.cards[side].length;
      if (node.results.strategy.length !== hands * node.results.numActions ||
        node.results.actionEv.length !== hands * node.results.numActions ||
        !reachableHands(node)) return false;
      return node.cards[side].every((pair, hand) => {
        if (!Number.isInteger(pair) || (pair & 0xff) > 51 || (pair >>> 8) > 51 ||
          (pair & 0xff) === (pair >>> 8)) return false;
        if (!playableHand(node, hand)) return true;
        return node.selectedSpot.actions.every((_, action) => {
          const offset = action * hands + hand;
          return Number.isFinite(node.results.strategy[offset]) &&
            node.results.strategy[offset] >= 0 && Number.isFinite(node.results.actionEv[offset]);
        });
      });
    });
  } catch {
    return false;
  }
}

/** Normalizer weighting matches the existing preset exporter. */
export function chooseCustomTrainerAction(node: TrainerDecision): number | null {
  const side = node.selectedSpot.player === "oop" ? 0 : 1;
  const hands = node.cards[side].length;
  const normalizer = node.results.normalizer[side];
  const rates = node.selectedSpot.actions.map((action, index) => ({
    index,
    name: action.name,
    mass: normalizer.reduce((sum, weight, hand) =>
      sum + weight * (node.results.strategy[index * hands + hand] ?? 0), 0),
  })).filter(action => Number.isFinite(action.mass) && action.mass > 0);
  const aggressive = rates.filter(action =>
    ["Bet", "Raise", "Allin", "All-in"].includes(action.name));
  const candidates = aggressive.length
    ? aggressive
    : rates.filter(action => action.name !== "Fold");
  candidates.sort((a, b) => b.mass - a.mass || a.index - b.index);
  return candidates[0]?.index ?? null;
}

/** At most three player decisions; never traverse a chance or terminal node. */
export async function collectCustomTrainerNodes(
  exportAt: CustomTrainerCapture["exportAt"]
): Promise<TrainerDecision[]> {
  const nodes: TrainerDecision[] = [];
  let path: number[] = [];
  const history: TrainerHistoryAction[] = [];
  for (let depth = 0; depth < 3; depth++) {
    const exported = await exportAt([...path]);
    if (!exported || exported.selectedSpot.type !== "player") break;
    const node = copyJson(exported);
    node.path = [...path];
    node.nodeId = path.length ? path.join("-") : "root";
    node.history = history.map(action => ({ ...action }));
    if (!reachableHands(node)) break;
    if (node.selectedSpot.actions.length >= 2) nodes.push(node);
    const next = chooseCustomTrainerAction(node);
    if (next === null) break;
    const action = node.selectedSpot.actions[next];
    history.push({ player: node.selectedSpot.player, name: action.name, amount: action.amount });
    path = [...path, next];
  }
  return nodes;
}

export async function createCustomTrainerBank(
  capture: CustomTrainerCapture
): Promise<CustomTrainerBank> {
  try {
    const configSnapshot = copyJson(capture.configSnapshot);
    const locks = copyJson(capture.locks);
    // Lock insertion order is UI history, not a change to the solved tree.
    const lockIdentity = locks.map(canonicalJson).sort();
    const identity = canonicalJson({
      config: configSnapshot,
      locks: lockIdentity,
      unitScale: capture.unitScale,
    });
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(identity));
    const hash12 = Array.from(new Uint8Array(hash), byte =>
      byte.toString(16).padStart(2, "0")).join("").slice(0, 12);
    const nodes = await collectCustomTrainerNodes(capture.exportAt);
    if (!nodes.length) throw new Error("CUSTOM_TRAINER_NO_DECISIONS");
    const root = nodes[0];
    return {
      id: `custom:${hash12}`,
      createdAt: Date.now(),
      board: [...root.currentBoard],
      startingPot: root.startingPot,
      effectiveStack: root.effectiveStack,
      unitScale: capture.unitScale,
      lockCount: locks.length,
      targetExploitabilityPct: capture.targetExploitabilityPct,
      achievedExploitabilityPct: capture.achievedExploitabilityPct,
      configSnapshot,
      locks,
      nodes,
    };
  } finally {
    await capture.restore();
  }
}

/** Reuse the original weighted hand draw without extending preset categories. */
export function makeCustomTrainerQuestion(
  bank: CustomTrainerBank,
  avoidId?: string,
  random: () => number = Math.random
): CustomTrainerQuestion | null {
  for (let draw = 0; draw < 10; draw++) {
    const question = makeTrainerQuestion({
      version: 1,
      generatedAt: new Date(bank.createdAt).toISOString(),
      targetExploitabilityPct: bank.targetExploitabilityPct,
      presets: [{ presetId: bank.id, nodes: bank.nodes }],
    }, "all", () => Math.max(Number.EPSILON, Math.min(1 - Number.EPSILON, random())));
    if (!question) return null;
    if (question.id !== avoidId || draw === 9) return { ...question, category: "custom" };
  }
  return null;
}

export function restoreCustomTrainerQuestion(
  bank: CustomTrainerBank,
  attempt: CustomTrainerAttempt
): CustomTrainerQuestion | null {
  if (attempt.category !== "custom" || attempt.presetId !== bank.id ||
    attempt.bankCreatedAt !== bank.createdAt) return null;
  for (const node of bank.nodes) {
    if (attempt.questionId !== `${bank.id}:${node.nodeId}:${attempt.handPair}`) continue;
    const side = node.selectedSpot.player === "oop" ? 0 : 1;
    const handIndex = node.cards[side].indexOf(attempt.handPair);
    if (!playableHand(node, handIndex)) return null;
    return {
      id: attempt.questionId,
      presetId: bank.id,
      presetTitle: bank.id,
      category: "custom",
      node,
      handIndex,
      handPair: attempt.handPair,
      player: node.selectedSpot.player,
    };
  }
  return null;
}

/** The current decision pot includes earlier bets. Never use the preset fallback. */
export function customLossLimits(node: TrainerDecision) {
  const scale = node.unitScale || 1;
  const pot = (node.selectedSpot.pot ?? node.startingPot) / scale;
  // Arbitrary chips have no known bb conversion. The bb noise floors apply only
  // to explicit bb spots; both units keep exactly the original pot ratios.
  const inBb = scale === 10;
  return {
    potBb: pot,
    bestBb: Math.max(pot * BEST_LOSS_RATIO, inBb ? BEST_LOSS_FLOOR_BB : 0),
    goodBb: Math.max(pot * GOOD_LOSS_RATIO, inBb ? GOOD_LOSS_FLOOR_BB : 0),
  };
}

export function classifyCustomTrainerLoss(node: TrainerDecision, loss: number) {
  const limits = customLossLimits(node);
  return loss <= limits.bestBb ? "best" : loss <= limits.goodBb ? "good" : "bad";
}
