import { ReviewError } from "./errors";
import { applyPerm, assertDistinctCards, handIndex } from "./cards";
import type { HandReviewSolverInput } from "../hand-review-solver";

/** Supplied AFTER solving/following the turn to a non-all-in chance node.
 * All cards/ranges must retain the flop's canonical suit mapping.
 */
export type RiverContinuation = {
  board: readonly [number, number, number, number];
  flopPath: readonly number[];
  ranges: readonly [Float32Array, Float32Array];
  pot: number;
  effectiveStack: number;
};

function same(a: readonly number[], b: readonly number[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function checkedRanges(ranges: readonly [Float32Array, Float32Array], board: readonly number[]) {
  if (!Array.isArray(ranges) || ranges.length !== 2) throw new ReviewError("INVALID_RANGE", "Two ranges required");
  const result = ranges.map((range, player) => {
    if (!(range instanceof Float32Array) || range.length !== 1326 ||
      range.some((weight) => !Number.isFinite(weight) || weight < 0 || weight > 1)) {
      throw new ReviewError("INVALID_RANGE", "Expected 1326 finite weights in [0,1]", { player });
    }
    const copy = range.slice();
    for (let a = 0; a < 52; a++) for (let b = a + 1; b < 52; b++) {
      if (board.includes(a) || board.includes(b)) copy[handIndex(a, b)] = 0;
    }
    if (!copy.some((w) => w > 0)) throw new ReviewError("EMPTY_RANGE", "Board leaves an empty range", { player });
    return copy;
  }) as [Float32Array, Float32Array];
  const hands: [number, number, number][] = [];
  for (let a = 0; a < 52; a++) for (let b = a + 1; b < 52; b++) hands.push([a, b, handIndex(a, b)]);
  const opponents = hands.filter(([, , h]) => result[1][h] > 0);
  if (!hands.some(([a, b, h]) => result[0][h] > 0 &&
    opponents.some(([c, d]) => a !== c && a !== d && b !== c && b !== d))) {
    throw new ReviewError("NO_COMPATIBLE_HANDS", "Ranges have no compatible pair of hands");
  }
  return result;
}

/** River request from the turn request it continues. Appending a river to turn-root reach
 * would silently erase every turn decision, so the solved turn's reached ranges are mandatory.
 * actualRiver is in the user's suit space.
 */
export function buildRiverInput(
  turn: HandReviewSolverInput, actualRiver: number, continuation: RiverContinuation,
): HandReviewSolverInput {
  const board = [...turn.board, applyPerm(actualRiver, turn.perm)];
  assertDistinctCards(board, 5);
  assertDistinctCards(continuation.board, 4);
  if (!Array.isArray(continuation.flopPath)) throw new ReviewError("TURN_RESULT_MISMATCH", "Missing source flop path");
  if (!same(continuation.board, turn.board) || !same(continuation.flopPath, turn.source.flopPath)) {
    throw new ReviewError("TURN_RESULT_MISMATCH", "Turn result uses another board or flop path");
  }
  if (!Number.isSafeInteger(continuation.pot) || !Number.isSafeInteger(continuation.effectiveStack) ||
    continuation.pot < turn.startingPot || continuation.effectiveStack <= 0 || continuation.effectiveStack > turn.effectiveStack ||
    continuation.pot + 2 * continuation.effectiveStack !== turn.startingPot + 2 * turn.effectiveStack) {
    throw new ReviewError("INVALID_TURN_STATE", "Turn must end with equal positive stacks and conserved chips");
  }
  const ranges = checkedRanges(continuation.ranges, board);
  for (const player of [0, 1] as const) {
    if (ranges[player].some((weight, h) => weight > turn.ranges[player][h])) {
      throw new ReviewError("INVALID_TURN_RANGE", "Turn reach cannot exceed the turn's starting reach", { player });
    }
  }
  return { ...turn, initialState: "river", board, ranges,
    startingPot: continuation.pot, effectiveStack: continuation.effectiveStack };
}
