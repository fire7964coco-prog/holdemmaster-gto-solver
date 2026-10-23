import * as Comlink from "comlink";
import type { Handler, SolverMode, WorkerApi } from "./worker";
import type { Results } from "./result-types";
import { decodeResults } from "./results-decode";
import { assertDistinctCards, handIndex } from "./review/flop-canon";
import type { ActualAction } from "./review/flop-line";
import { ReviewError } from "./review/errors";
import type { buildTurnInput, RiverContinuation } from "./review/turn-input";

/** Only mobileTurn may be relaxed after measurements on the owner's phone. */
export const HAND_REVIEW_ACCURACY = Object.freeze({ turn: 0.3, mobileTurn: 0.3, river: 0.3 });
export const HAND_REVIEW_HERO_EPSILON = 1e-8;
const MAX_THREADS = 4;
const MAX_MEMORY_BYTES = 512 * 1024 * 1024;
const MAX_ITERATIONS = 10_000;

export type HandReviewSolverInput = ReturnType<typeof buildTurnInput>;
export type ReviewPrivateCards = [Array<readonly [number, number]>, Array<readonly [number, number]>];
export type ReviewSolveProgress = {
  phase: "initializing" | "building" | "solving" | "finalizing" | "finished";
  iterations: number;
  targetPct: number;
  achievedPct: number | null;
};
export type ReviewSolveOptions = {
  heroPlayer: 0 | 1;
  canonicalHero: readonly [number, number];
  mobile?: boolean;
  forceSingleThread?: boolean;
  onProgress?: (progress: ReviewSolveProgress) => void;
};
export type ReviewEpsilonEvidence = {
  originalWeight: number;
  solverWeight: number;
  addedWeight: number;
  originalJointMass: number;
  addedJointMass: number;
  jointMassFraction: number;
  /** Fixed-strategy expectation bound, NOT a bound on equilibrium strategy changes. */
  fixedStrategyPayoffBoundBb: number;
  privateCardsIncluded: boolean;
};
export type ReviewSolveResult = {
  mode: SolverMode;
  threads: number;
  iterations: number;
  targetPct: number;
  achievedPct: number;
  elapsedMs: number;
  memoryBytes: number;
  epsilon: ReviewEpsilonEvidence;
};
export type ReviewSolverSnapshot = {
  history: number[];
  kind: "decision" | "chance" | "terminal";
  player: 0 | 1 | null;
  /** Same action notation as HMR1: Check, Bet(33), AllIn(975), ... */
  actions: string[];
  actionDetails: ActualAction[];
  privateCards: ReviewPrivateCards;
  results: Results;
  /** Unrounded, normalized, action-major probabilities in privateCards[player] order. */
  frequencies: number[];
  /** Action-major bb values; unavailable values are NaN and evAvailable is 0. */
  evBb: number[];
  evAvailable: Uint8Array;
  pot: number;
  committed: [number, number];
  stacks: [number, number];
  effectiveStack: number;
  /** Original, non-injected reach. Use this for frequencies, rare-line rules and river input. */
  reachedRanges: [Float32Array, Float32Array];
};

type ReachPair = [Float32Array, Float32Array];
const copyRanges = (ranges: readonly [Float32Array, Float32Array]): ReachPair => [ranges[0].slice(), ranges[1].slice()];
const compatible = (a: readonly number[], b: readonly number[]) => !a.includes(b[0]) && !a.includes(b[1]);

/** Tiny mass exists only inside the local solver. Public reach and river provenance stay exact. */
function injectHero(input: HandReviewSolverInput, options: ReviewSolveOptions) {
  assertDistinctCards([...input.board, ...options.canonicalHero]);
  const ranges = copyRanges(input.ranges);
  const heroIndex = handIndex(...options.canonicalHero);
  const originalWeight = ranges[options.heroPlayer][heroIndex];
  ranges[options.heroPlayer][heroIndex] = Math.max(originalWeight, HAND_REVIEW_HERO_EPSILON);
  const solverWeight = ranges[options.heroPlayer][heroIndex];
  const addedWeight = solverWeight - originalWeight;
  const hands: Array<{ cards: [number, number]; weights: [number, number] }> = [];
  for (let a = 0; a < 52; a++) for (let b = a + 1; b < 52; b++) {
    const index = handIndex(a, b);
    if (input.ranges[0][index] > 0 || input.ranges[1][index] > 0) {
      hands.push({ cards: [a, b], weights: [input.ranges[0][index], input.ranges[1][index]] });
    }
  }
  const oop = hands.filter(hand => hand.weights[0] > 0);
  const ip = hands.filter(hand => hand.weights[1] > 0);
  let originalJointMass = 0;
  for (const a of oop) for (const b of ip) {
    if (compatible(a.cards, b.cards)) originalJointMass += a.weights[0] * b.weights[1];
  }
  let compatibleOpponentMass = 0;
  const opponent = (options.heroPlayer ^ 1) as 0 | 1;
  for (const hand of hands) if (compatible(options.canonicalHero, hand.cards)) {
    compatibleOpponentMass += hand.weights[opponent];
  }
  if (!(compatibleOpponentMass > 0)) {
    throw new ReviewError("NO_COMPATIBLE_HANDS", "No reached opponent hand is compatible with hero");
  }
  const addedJointMass = addedWeight * compatibleOpponentMass;
  const jointMassFraction = addedJointMass / (originalJointMass + addedJointMass);
  const evidence: ReviewEpsilonEvidence = {
    originalWeight, solverWeight, addedWeight, originalJointMass, addedJointMass, jointMassFraction,
    fixedStrategyPayoffBoundBb: jointMassFraction * (input.startingPot + 2 * input.effectiveStack) / input.unit,
    privateCardsIncluded: false,
  };
  return { ranges, heroIndex, evidence };
}

function workerActions(text: string): { names: string[]; details: ActualAction[] } {
  if (text === "chance" || text === "terminal") return { names: [], details: [] };
  const details = text.split("/").map((raw): ActualAction => {
    const [rawKind, amount] = raw.split(":");
    const kind = rawKind === "Allin" ? "AllIn" : rawKind;
    if (kind === "Fold" || kind === "Check" || kind === "Call") return { kind };
    if ((kind === "Bet" || kind === "Raise" || kind === "AllIn") && Number.isSafeInteger(Number(amount)) && Number(amount) > 0) {
      return { kind, amount: Number(amount) };
    }
    throw new ReviewError("UNSUPPORTED_ACTION", "Unexpected worker action", { raw });
  });
  return { details, names: details.map(action => action.amount === undefined ? action.kind : `${action.kind}(${action.amount})`) };
}

/** Own worker and game. Never imports global-worker, store, or custom-spot configuration. */
export function createHandReviewSolver() {
  let worker: Worker | null = null;
  let api: Comlink.Remote<WorkerApi> | null = null;
  let remote: Comlink.Remote<Handler> | null = null;
  let failure: Error | null = null;
  let ready = false;
  let input: HandReviewSolverInput | null = null;
  let privateCards: ReviewPrivateCards = [[], []];
  let solverRootRanges: ReachPair = [new Float32Array(1326), new Float32Array(1326)];
  const snapshots = new Map<string, ReviewSolverSnapshot>();
  const solverReach = new Map<string, ReachPair>();
  const pending = new Set<(error: Error) => void>();
  let queue: Promise<unknown> = Promise.resolve();

  const guard = <T>(operation: PromiseLike<T>): Promise<T> => new Promise((resolve, reject) => {
    if (failure) {
      Promise.resolve(operation).catch(() => {});
      reject(failure);
      return;
    }
    pending.add(reject);
    Promise.resolve(operation).then(value => { pending.delete(reject); resolve(value); }, error => {
      pending.delete(reject); reject(error);
    });
  });

  const dispose = () => {
    failure = failure ?? new ReviewError("REVIEW_CANCELLED", "Review solver was closed");
    ready = false;
    pending.forEach(reject => reject(failure!));
    pending.clear();
    const stoppedWorker = worker;
    const stoppedApi = api;
    worker = null; api = null; remote = null;
    snapshots.clear(); solverReach.clear();
    if (stoppedWorker && stoppedApi) {
      const deadline = setTimeout(() => stoppedWorker.terminate(), 1000);
      Promise.resolve(stoppedApi.beforeTerminate()).catch(() => {}).finally(() => {
        clearTimeout(deadline); stoppedWorker.terminate();
      });
    } else stoppedWorker?.terminate();
  };

  const solve = async (request: HandReviewSolverInput, options: ReviewSolveOptions): Promise<ReviewSolveResult> => {
    if (worker || ready || failure) throw new ReviewError("INVALID_REVIEW_STATE", "Use one solver instance per street");
    input = request;
    const started = performance.now();
    const targetPct = request.initialState === "river" ? HAND_REVIEW_ACCURACY.river
      : options.mobile ? HAND_REVIEW_ACCURACY.mobileTurn : HAND_REVIEW_ACCURACY.turn;
    let iterations = 0;
    let achievedPct: number | null = null;
    const progress = (phase: ReviewSolveProgress["phase"]) => options.onProgress?.({ phase, iterations, targetPct, achievedPct });
    const injected = injectHero(request, options);
    solverRootRanges = injected.ranges;
    progress("initializing");
    worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    api = Comlink.wrap<WorkerApi>(worker);
    const fail = (error: Error) => { failure = error; dispose(); };
    worker.addEventListener("error", event => { event.preventDefault(); fail(new ReviewError("REVIEW_WORKER_FAILED", event.message)); });
    worker.addEventListener("messageerror", () => fail(new ReviewError("REVIEW_WORKER_FAILED", "Worker message failed")));
    const timer = setTimeout(() => fail(new ReviewError("REVIEW_WORKER_TIMEOUT", "Worker initialization timed out")), 60_000);
    try {
      const requestedThreads = Math.max(1, Math.min(MAX_THREADS, navigator.hardwareConcurrency || 1));
      const handler = await guard(api.initHandler(requestedThreads, options.forceSingleThread));
      remote = handler;
      const mode = await guard(handler.mode);
      clearTimeout(timer);
      progress("building");
      const initError = await guard(handler.init(
        injected.ranges[0], injected.ranges[1], Uint8Array.from(request.board),
        request.startingPot, request.effectiveStack, request.rakeRate, request.rakeCap, false,
        request.bet, request.raise, request.turnBet[0], request.turnRaise[0], "",
        request.riverBet[0], request.riverRaise[0], "", request.bet, request.raise,
        request.turnBet[1], request.turnRaise[1], request.riverBet[1], request.riverRaise[1],
        request.addAllinThreshold, request.forceAllinThreshold, request.mergingThreshold, "", "",
      ));
      if (initError) throw new ReviewError("REVIEW_TREE_FAILED", initError);
      const memoryBytes = await guard(handler.memoryUsage(false));
      if (memoryBytes > MAX_MEMORY_BYTES) throw new ReviewError("REVIEW_MEMORY_LIMIT", "Review tree exceeds memory budget", { memoryBytes });
      privateCards = [[], []];
      for (const player of [0, 1] as const) {
        privateCards[player] = Array.from(await guard(handler.privateCards(player)), encoded => [encoded & 255, encoded >> 8] as const);
      }
      injected.evidence.privateCardsIncluded = privateCards[options.heroPlayer].some(hand => handIndex(...hand) === injected.heroIndex);
      if (!injected.evidence.privateCardsIncluded) throw new ReviewError("REVIEW_HERO_MISSING", "Worker omitted the injected hero hand");
      await guard(handler.allocateMemory(false));
      let exploitability = await guard(handler.exploitability());
      if (!Number.isFinite(exploitability)) throw new ReviewError("REVIEW_NONFINITE_RESULT", "Solver error is nonfinite");
      achievedPct = Math.max(0, exploitability) * 100 / request.startingPot;
      progress("solving");
      while (achievedPct > targetPct && iterations < MAX_ITERATIONS) {
        await guard(handler.iterate(iterations));
        iterations++;
        if (iterations % 10 === 0) {
          exploitability = await guard(handler.exploitability());
          if (!Number.isFinite(exploitability)) throw new ReviewError("REVIEW_NONFINITE_RESULT", "Solver error is nonfinite");
          achievedPct = Math.max(0, exploitability) * 100 / request.startingPot;
          progress("solving");
        }
      }
      if (achievedPct > targetPct) throw new ReviewError("REVIEW_NOT_CONVERGED", "Solver did not reach the required accuracy", { iterations, achievedPct, targetPct });
      progress("finalizing");
      await guard(handler.finalize());
      ready = true;
      progress("finished");
      if (failure) throw failure;
      return { mode, threads: mode === "st" ? 1 : requestedThreads, iterations, targetPct, achievedPct,
        elapsedMs: performance.now() - started, memoryBytes, epsilon: injected.evidence };
    } catch (error) {
      failure = error instanceof Error ? error : new Error(String(error));
      dispose();
      throw error;
    } finally { clearTimeout(timer); }
  };

  const snapshotInternal = async (history: readonly number[]): Promise<ReviewSolverSnapshot> => {
    if (!ready || !remote || !input) throw failure ?? new ReviewError("REVIEW_NOT_SOLVED", "Solve the street first");
    const handler = remote;
    if (!Array.isArray(history) || history.some(value => !Number.isSafeInteger(value) || value < 0)) {
      throw new ReviewError("MISSING_PATH", "Invalid review history");
    }
    const key = history.join("/");
    const cached = snapshots.get(key);
    if (cached) return cached;
    let reachedRanges = copyRanges(input.ranges);
    let actualSolverReach = copyRanges(solverRootRanges);
    if (history.length > 0) {
      const parentPath = history.slice(0, -1);
      const parent = await snapshotInternal(parentPath);
      const action = history[history.length - 1];
      if (parent.kind !== "decision" || parent.player === null || action >= parent.actions.length) {
        throw new ReviewError("MISSING_PATH", "History crosses a street or uses an unavailable action", { history });
      }
      reachedRanges = copyRanges(parent.reachedRanges);
      actualSolverReach = copyRanges(solverReach.get(parentPath.join("/"))!);
      const player = parent.player;
      const length = privateCards[player].length;
      privateCards[player].forEach((cards, h) => {
        const index = handIndex(...cards);
        const frequency = parent.frequencies[action * length + h];
        reachedRanges[player][index] *= frequency;
        actualSolverReach[player][index] *= frequency;
      });
    }
    // Prefix snapshots validate every index before the legacy unchecked wasm traversal.
    await guard(handler.applyHistory(Uint32Array.from(history)));
    const currentPlayer = await guard(handler.currentPlayer());
    const player = currentPlayer === "oop" ? 0 : currentPlayer === "ip" ? 1 : null;
    const kind = player === null ? currentPlayer as "chance" | "terminal" : "decision";
    const actions = workerActions(await guard(handler.actionsAfter(new Uint32Array())));
    const numActions = actions.names.length;
    const results = decodeResults(await guard(handler.getResults()), privateCards.map(cards => cards.length), currentPlayer, numActions);
    const committed = Array.from(await guard(handler.totalBetAmount(new Uint32Array()))) as [number, number];
    let frequencies: number[] = [];
    let evBb: number[] = [];
    let evAvailable = new Uint8Array();
    if (player !== null) {
      const raw = await guard(handler.strategyAt(Uint32Array.from(history)));
      const numHands = privateCards[player].length;
      if (raw.length !== numActions * numHands) throw new ReviewError("INVALID_STRATEGY", "Worker strategy dimensions differ");
      if (raw.some(value => !Number.isFinite(value) || value < 0)) throw new ReviewError("INVALID_STRATEGY", "Worker strategy contains an invalid probability");
      frequencies = Array.from(raw);
      evBb = new Array(raw.length).fill(NaN);
      evAvailable = new Uint8Array(raw.length);
      const opponent = (player ^ 1) as 0 | 1;
      const liveOpponents = privateCards[opponent].filter(cards => actualSolverReach[opponent][handIndex(...cards)] > 0);
      privateCards[player].forEach((cards, h) => {
        let sum = 0;
        for (let a = 0; a < numActions; a++) sum += frequencies[a * numHands + h];
        if (!(sum > 0) || !Number.isFinite(sum)) throw new ReviewError("INVALID_STRATEGY", "Worker has no finite strategy for hand");
        const ownWeight = actualSolverReach[player][handIndex(...cards)];
        const hasOpponent = ownWeight > 0 && liveOpponents.some(other => compatible(cards, other));
        for (let a = 0; a < numActions; a++) {
          const offset = a * numHands + h;
          frequencies[offset] /= sum;
          // The current WASM exports legacy EV, not R1b CFV. Never grade its
          // zero-reach zeros as genuine EV after another zero-frequency choice.
          if (!results.isEmpty && ownWeight > 0 && hasOpponent && Number.isFinite(results.actionEv[offset])) {
            evAvailable[offset] = 1;
            evBb[offset] = results.actionEv[offset] / input!.unit;
          }
        }
      });
    }
    const stacks: [number, number] = [input.effectiveStack - committed[0], input.effectiveStack - committed[1]];
    const snapshot: ReviewSolverSnapshot = {
      history: [...history], kind, player, actions: actions.names, actionDetails: actions.details, privateCards,
      results, frequencies, evBb, evAvailable, pot: input.startingPot + committed[0] + committed[1],
      committed, stacks, effectiveStack: Math.min(...stacks), reachedRanges,
    };
    snapshots.set(key, snapshot); solverReach.set(key, actualSolverReach);
    return snapshot;
  };

  const snapshot = (history: readonly number[] = []) => {
    // UI histories may be reactive arrays. Capture the requested node before queuing.
    const requestedHistory = [...history];
    const operation = queue.then(() => snapshotInternal(requestedHistory));
    queue = operation.catch(() => {});
    return operation;
  };

  const riverContinuation = async (history: readonly number[], flopPath?: readonly number[]): Promise<RiverContinuation> => {
    const node = await snapshot(history);
    if (!input || input.initialState !== "turn" || input.board.length !== 4 || node.kind !== "chance" || node.effectiveStack <= 0) {
      throw new ReviewError("MISSING_TURN_RESULT", "River requires a completed non-all-in turn");
    }
    const sourcePath = input.source.flopPath;
    if (flopPath && (flopPath.length !== sourcePath.length || flopPath.some((value, index) => value !== sourcePath[index]))) {
      throw new ReviewError("TURN_RESULT_MISMATCH", "Turn uses another flop path");
    }
    return { board: [...input.board] as [number, number, number, number], flopPath: [...sourcePath],
      ranges: copyRanges(node.reachedRanges), pot: node.pot, effectiveStack: node.effectiveStack };
  };

  return { solve, snapshot, riverContinuation, dispose };
}
