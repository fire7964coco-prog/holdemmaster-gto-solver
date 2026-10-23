import type {
  BEST_LOSS_RATIO, GOOD_LOSS_RATIO, BEST_LOSS_FLOOR_BB, GOOD_LOSS_FLOOR_BB,
} from "../trainer";
import { ReviewError } from "./errors";
import { assertDistinctCards, handIndex } from "./flop-canon";
import { ActualAction, flopLine, matchAction } from "./flop-line";
import { getNode, Hmr1File } from "./hmr1";
import { rangeAt } from "./reach";

/** Caller imports these four values from trainer.ts. No numeric defaults or browser imports. */
export type TrainerLossPolicy = {
  BEST_LOSS_RATIO: typeof BEST_LOSS_RATIO;
  GOOD_LOSS_RATIO: typeof GOOD_LOSS_RATIO;
  BEST_LOSS_FLOOR_BB: typeof BEST_LOSS_FLOOR_BB;
  GOOD_LOSS_FLOOR_BB: typeof GOOD_LOSS_FLOOR_BB;
};

/** Hand is in the file's canonical suit space. Frequencies are fractions, EV and loss are bb. */
export function evaluateFlopDecision(
  file: Hmr1File, path: readonly number[], hand: readonly [number, number],
  selected: number | ActualAction, policy: TrainerLossPolicy,
) {
  assertDistinctCards(hand, 2);
  assertDistinctCards([...file.header.flopCards, ...hand], 5);
  if (file.header.targetPct <= 0 || file.header.targetPct > 1 || file.header.exploitPct > file.header.targetPct) {
    throw new ReviewError("UNSUPPORTED_ACCURACY", "Review requires a converged file with target at most one percent");
  }
  const state = flopLine(file, path);
  if (state.kind !== "decision" || state.player === null) throw new ReviewError("NOT_DECISION", "Verdict requires a decision node");
  const node = getNode(file, path);
  const player = node.player;
  const index = handIndex(hand[0], hand[1]);
  const hands = file.players[player].hands;
  const h = hands.findIndex(([a, b]) => handIndex(a, b) === index);
  if (h < 0 || file.players[player].weights[h] === 0) throw new ReviewError("HAND_NOT_IN_RANGE", "Hand absent from root range", { hand, player });
  const unavailableActions = node.actions.flatMap((action, a) => node.evAvailable[a * hands.length + h] ? [] : [{ index: a, action }]);
  if (unavailableActions.length > 0) {
    throw new ReviewError("EV_MISSING", "Action EV is unavailable", {
      hand, path, unavailableActions, source: node.evAvailabilitySource,
      legacyZeroAmbiguity: file.header.version === 1,
    });
  }
  // v2 availability comes from the engine's unquantized compatible opponent mass.
  // Rechecking u8 reach can erase tiny positive support and contradict that signal.
  if (file.header.version === 1) {
    const opponent = (player ^ 1) as 0 | 1;
    const other = rangeAt(file, path, opponent);
    if (!file.players[opponent].hands.some(([a, b]) =>
      !hand.includes(a) && !hand.includes(b) && other[handIndex(a, b)] > 0)) {
      throw new ReviewError("NO_COMPATIBLE_HANDS", "No reached opponent hand is compatible", { hand, path });
    }
  }
  const match = typeof selected === "number" ? null : matchAction(file, path, selected);
  const selectedAction = typeof selected === "number" ? selected : match!.actionIndex;
  if (!Number.isSafeInteger(selectedAction) || selectedAction < 0 || selectedAction >= node.actions.length) {
    throw new ReviewError("UNSUPPORTED_ACTION", "Selected action index outside node", { selectedAction });
  }
  const keys = ["BEST_LOSS_RATIO", "GOOD_LOSS_RATIO", "BEST_LOSS_FLOOR_BB", "GOOD_LOSS_FLOOR_BB"] as const;
  if (!policy || keys.some((key) => !Number.isFinite(policy[key]) || policy[key] < 0) ||
    policy.BEST_LOSS_RATIO > policy.GOOD_LOSS_RATIO || policy.BEST_LOSS_FLOOR_BB > policy.GOOD_LOSS_FLOOR_BB) {
    throw new ReviewError("INVALID_POLICY", "Trainer loss policy is required");
  }
  let sum = 0;
  for (let a = 0; a < node.actions.length; a++) sum += node.strategy[a * hands.length + h];
  if (sum === 0) throw new ReviewError("INVALID_STRATEGY", "Zero strategy on verdict hand");
  const actions = node.actions.map((action, a) => {
    const offset = a * hands.length + h;
    // HMR1 saturates at ±32767, so the true EV cannot be reconstructed at that boundary.
    if (Math.abs(node.ev[offset]) >= 32767) throw new ReviewError("EV_SATURATED", "Quantized EV may be clipped", { path, action, hand });
    return { index: a, action, frequency: node.strategy[offset] / sum,
      evBb: node.ev[offset] / file.header.evScale / file.header.unit, isBest: false };
  });
  const best = actions.reduce((a, b) => b.evBb > a.evBb ? b : a);
  actions.forEach((action) => { action.isBest = action.evBb === best.evBb; });
  const evLossBb = Math.max(0, best.evBb - actions[selectedAction].evBb);
  const potBb = state.pot / file.header.unit;
  const limits = { bestBb: Math.max(potBb * policy.BEST_LOSS_RATIO, policy.BEST_LOSS_FLOOR_BB),
    goodBb: Math.max(potBb * policy.GOOD_LOSS_RATIO, policy.GOOD_LOSS_FLOOR_BB) };
  const grade: "best" | "good" | "bad" = evLossBb <= limits.bestBb ? "best" : evLossBb <= limits.goodBb ? "good" : "bad";
  return { actions, evLossBb, grade, potBb, limits, selectedAction, bestAction: best.index, match,
    evAvailabilitySource: node.evAvailabilitySource,
    // Each stored action EV has a rounding uncertainty of half a stored unit.
    evResolutionBb: 1 / file.header.evScale / file.header.unit };
}
