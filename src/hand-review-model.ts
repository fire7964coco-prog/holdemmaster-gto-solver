import { Hmr1File, Hmr1Hand, getNode } from "./review/hmr1";
import {
  ActionMatch,
  ActualAction,
  flopLine,
  matchAction,
  parseAction,
} from "./review/flop-line";
import { handIndex } from "./review/flop-canon";
import { evaluateFlopDecision, TrainerLossPolicy } from "./review/flop-verdict";
import { ReviewError } from "./review/errors";

// Confirmed 2026-10-03. These are review-only additions, never trainer thresholds.
export const REVIEW_FREQUENCY_FLOOR = 0.035;
export const REVIEW_REACH_FLOOR = 0.05;
export type ReviewGrade = "best" | "good" | "bad";
export type ReviewVerdict = {
  grade: ReviewGrade | null;
  rawGrade: ReviewGrade | null;
  lossBb: number | null;
  frequency: number;
  frequencies: number[];
  nodeProb: number;
  referenceOnly: boolean;
  mixedAction: boolean;
  errorCode: string | null;
};
export type ReviewNode = {
  kind: "decision" | "chance" | "terminal";
  player: 0 | 1 | null;
  actions: readonly string[];
  hands: readonly [readonly Hmr1Hand[], readonly Hmr1Hand[]];
  strategy: ArrayLike<number>;
  evBb: ArrayLike<number>;
  available: ArrayLike<number>;
  ranges: readonly [ArrayLike<number>, ArrayLike<number>];
  pot: number;
  committed: readonly [number, number];
  stacks: readonly [number, number];
};

/** Identical arithmetic/order to review-grade-boundary-measure.stateAt:
 * per-player sum(reach)/sum(root), multiplied, WITHOUT hero blockers.
 * Keep Float64 until the final quotient; rangeAt's Float32 return is for wasm input. */
export function flopReach(file: Hmr1File, path: readonly number[]) {
  const reach = file.players.map((p) => Float64Array.from(p.weights)) as [
    Float64Array,
    Float64Array,
  ];
  for (let depth = 0; depth < path.length; depth++) {
    const node = getNode(file, path.slice(0, depth));
    const p = node.player,
      n = reach[p].length;
    for (let h = 0; h < n; h++) {
      let sum = 0;
      for (let a = 0; a < node.actions.length; a++)
        sum += node.strategy[a * n + h];
      reach[p][h] =
        sum === 0
          ? 0
          : (reach[p][h] * node.strategy[path[depth] * n + h]) / sum;
    }
  }
  const shares = reach.map(
    (r, p) =>
      r.reduce((s, v) => s + v, 0) /
      file.players[p].weights.reduce((s, v) => s + v, 0)
  );
  return { reach, nodeProb: shares[0] * shares[1] };
}

export function flopNode(file: Hmr1File, path: readonly number[]): ReviewNode {
  const state = flopLine(file, path),
    { reach } = flopReach(file, path);
  const node = state.kind === "decision" ? getNode(file, path) : null;
  return {
    ...state,
    actions: node?.actions ?? [],
    hands: [file.players[0].hands, file.players[1].hands],
    strategy: node?.strategy ?? [],
    available: node?.evAvailable ?? [],
    evBb: node
      ? Float64Array.from(
          node.ev,
          (v) => v / file.header.evScale / file.header.unit
        )
      : [],
    ranges: reach,
  };
}

export function handFrequencies(node: ReviewNode, hand: Hmr1Hand) {
  const p = node.player;
  if (p === null) return [];
  const h = node.hands[p].findIndex(
    ([a, b]) => handIndex(a, b) === handIndex(...hand)
  );
  if (h < 0) return [];
  const n = node.hands[p].length;
  const values = node.actions.map((_, a) => node.strategy[a * n + h]);
  const sum = values.reduce((s, v) => s + v, 0);
  return sum > 0 ? values.map((v) => v / sum) : [];
}

export function applyReviewPolicy(
  rawGrade: ReviewGrade,
  lossBb: number,
  frequencies: number[],
  selected: number,
  nodeProb: number
): ReviewVerdict {
  const frequency = frequencies[selected];
  const mixedAction = frequency >= REVIEW_FREQUENCY_FLOOR;
  return {
    rawGrade,
    grade: rawGrade === "bad" && mixedAction ? "good" : rawGrade,
    lossBb,
    frequencies,
    frequency,
    nodeProb,
    referenceOnly: nodeProb < REVIEW_REACH_FLOOR,
    mixedAction,
    errorCode: null,
  };
}

export function flopVerdict(
  file: Hmr1File,
  path: readonly number[],
  hand: Hmr1Hand,
  selected: number,
  policy: TrainerLossPolicy
): ReviewVerdict {
  const { nodeProb } = flopReach(file, path);
  const frequencies = handFrequencies(flopNode(file, path), hand);
  try {
    const result = evaluateFlopDecision(file, path, hand, selected, policy);
    return applyReviewPolicy(
      result.grade,
      result.evLossBb,
      result.actions.map((a) => a.frequency),
      selected,
      nodeProb
    );
  } catch (error) {
    if (!(error instanceof ReviewError)) throw error;
    return {
      grade: null,
      rawGrade: null,
      lossBb: null,
      frequencies,
      frequency: frequencies[selected] ?? 0,
      nodeProb,
      referenceOnly: nodeProb < REVIEW_REACH_FLOOR,
      mixedAction: false,
      errorCode: error.code,
    };
  }
}

export function laterVerdict(
  node: ReviewNode,
  hand: Hmr1Hand,
  selected: number,
  nodeProb: number,
  unit: number,
  policy: TrainerLossPolicy
): ReviewVerdict {
  const frequencies = handFrequencies(node, hand);
  const p = node.player!;
  const h = node.hands[p].findIndex(
    ([a, b]) => handIndex(a, b) === handIndex(...hand)
  );
  const n = node.hands[p].length;
  const missing =
    h < 0 ||
    !frequencies.length ||
    node.actions.some(
      (_, a) =>
        !node.available[a * n + h] || !Number.isFinite(node.evBb[a * n + h])
    );
  if (missing)
    return {
      grade: null,
      rawGrade: null,
      lossBb: null,
      frequencies,
      frequency: frequencies[selected] ?? 0,
      nodeProb,
      referenceOnly: nodeProb < REVIEW_REACH_FLOOR,
      mixedAction: false,
      errorCode: "EV_MISSING",
    };
  const evs = node.actions.map((_, a) => node.evBb[a * n + h]);
  const loss = Math.max(0, Math.max(...evs) - evs[selected]);
  const best = Math.max(
    (node.pot / unit) * policy.BEST_LOSS_RATIO,
    policy.BEST_LOSS_FLOOR_BB
  );
  const good = Math.max(
    (node.pot / unit) * policy.GOOD_LOSS_RATIO,
    policy.GOOD_LOSS_FLOOR_BB
  );
  return applyReviewPolicy(
    loss <= best ? "best" : loss <= good ? "good" : "bad",
    loss,
    frequencies,
    selected,
    nodeProb
  );
}

/** Later streets use the same size-matching contract, without fabricating an HMR1 file. */
export function matchLaterAction(
  node: ReviewNode,
  actual: ActualAction
): ActionMatch {
  if (node.player === null)
    throw new ReviewError("NOT_DECISION", "No acting player");
  const actions = node.actions.map(parseAction);
  if (actual.amount === undefined) {
    const i = actions.findIndex(
      (a) => a.kind === actual.kind && a.amount === undefined
    );
    if (i < 0) throw new ReviewError("UNSUPPORTED_ACTION", "Action absent");
    return {
      actionIndex: i,
      kind: actual.kind,
      usedKind: actual.kind,
      actual: null,
      used: null,
      approximated: false,
    };
  }
  const family =
    node.committed[node.player ^ 1] > node.committed[node.player]
      ? "Raise"
      : "Bet";
  if (actual.kind !== family && actual.kind !== "AllIn")
    throw new ReviewError("UNSUPPORTED_ACTION", "Wrong action family");
  const options = actions
    .map((a, i) => ({ ...a, i }))
    .filter((a) =>
      actual.kind === "AllIn"
        ? a.kind === "AllIn"
        : a.kind === family || a.kind === "AllIn"
    );
  if (!options.length) throw new ReviewError("UNSUPPORTED_ACTION", "No wager");
  if (
    !Number.isFinite(actual.amount) ||
    actual.amount < Math.min(...options.map((a) => a.amount!)) ||
    actual.amount > Math.max(...options.map((a) => a.amount!))
  )
    throw new ReviewError("SIZE_OUT_OF_RANGE", "Outside menu");
  options.sort(
    (a, b) =>
      Math.abs(a.amount! - actual.amount!) -
        Math.abs(b.amount! - actual.amount!) ||
      a.amount! - b.amount! ||
      a.i - b.i
  );
  const used = options[0];
  return {
    actionIndex: used.i,
    kind: actual.kind,
    usedKind: used.kind,
    actual: actual.amount,
    used: used.amount!,
    approximated: used.amount !== actual.amount,
  };
}

export function responseFor(node: ReviewNode | null, hero: Hmr1Hand) {
  if (!node || node.player === null) return null;
  const p = node.player,
    n = node.hands[p].length,
    totals = node.actions.map(() => 0);
  const foldingHands: { hand: Hmr1Hand; frequency: number; mass: number }[] =
    [];
  let mass = 0;
  for (let h = 0; h < n; h++) {
    const hand = node.hands[p][h];
    if (hand.some((c) => hero.includes(c))) continue;
    const weight = node.ranges[p][h];
    if (!(weight > 0)) continue;
    let sum = 0;
    for (let a = 0; a < totals.length; a++) sum += node.strategy[a * n + h];
    if (sum <= 0) continue;
    mass += weight;
    node.actions.forEach((action, a) => {
      const frequency = node.strategy[a * n + h] / sum;
      totals[a] += weight * frequency;
      if (action === "Fold" && frequency > 0)
        foldingHands.push({ hand, frequency, mass: weight * frequency });
    });
  }
  if (mass <= 0) return null;
  return {
    actions: node.actions.map((action, i) => ({
      action,
      frequency: totals[i] / mass,
    })),
    foldingHands: foldingHands.sort((a, b) => b.mass - a.mass),
  };
}

export function handClass(hand: Hmr1Hand) {
  const ranks = "23456789TJQKA",
    [a, b] = [hand[0] >> 2, hand[1] >> 2].sort((x, y) => y - x);
  return (
    ranks[a] +
    ranks[b] +
    (a === b ? "" : (hand[0] & 3) === (hand[1] & 3) ? "s" : "o")
  );
}

export function gridFor(node: ReviewNode) {
  const ranks = "AKQJT98765432",
    p = node.player,
    groups = new Map<string, { mass: number; values: number[] }>();
  if (p !== null)
    node.hands[p].forEach((hand, h) => {
      const key = handClass(hand),
        n = node.hands[p].length,
        weight = node.ranges[p][h];
      if (!(weight > 0)) return;
      let sum = 0;
      for (let a = 0; a < node.actions.length; a++)
        sum += node.strategy[a * n + h];
      if (!sum) return;
      const g = groups.get(key) ?? {
        mass: 0,
        values: node.actions.map(() => 0),
      };
      g.mass += weight;
      g.values.forEach(
        (_, a) => (g.values[a] += (weight * node.strategy[a * n + h]) / sum)
      );
      groups.set(key, g);
    });
  return [...ranks].flatMap((a, row) =>
    [...ranks].map((b, col) => {
      const key = row === col ? a + b : row < col ? a + b + "s" : b + a + "o",
        g = groups.get(key);
      return { key, frequencies: g ? g.values.map((v) => v / g.mass) : [] };
    })
  );
}

export { matchAction };
