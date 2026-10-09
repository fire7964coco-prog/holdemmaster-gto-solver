import { ReviewError } from "./errors";
import { applyPerm, assertDistinctCards, canonicalizeFlop, handIndex } from "./flop-canon";
import { flopLine } from "./flop-line";
import { Hmr1File } from "./hmr1";
import { rangeAt } from "./reach";

/** Supplied by the caller AFTER solving/following the turn to a non-all-in chance node.
 * All cards/ranges must retain the flop's canonical suit mapping. HMR1 has no turn strategy.
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

/** HMR1 omits these settings. This function only supports its known precompute2 producer profile. */
function requireProducerProfile(file: Hmr1File) {
  const h = file.header;
  if (h.targetPct <= 0 || h.targetPct > 1 || h.exploitPct > h.targetPct) {
    throw new ReviewError("UNSUPPORTED_ACCURACY", "Review requires a converged file with target at most one percent");
  }
  // [pot, stack] per precompute3 scenario (main.rs SCENARIOS).
  const scenarios: Record<string, readonly [number, number]> = {
    "srp-btn-bb": [55, 975], "srp-sb-bb": [60, 970], "srp-co-bb": [55, 975], "srp-hj-bb": [55, 975],
    "srp-utg-bb": [55, 975], "srp-co-btn": [65, 975], "srp-hj-btn": [65, 975], "srp-utg-btn": [65, 975],
    "srp-hj-co": [65, 975], "3bp-btn-bb": [225, 890], "3bp-btn-sb": [210, 900],
    "3bp-co-bb": [225, 890], "3bp-hj-bb": [225, 890], "3bp-utg-bb": [225, 890], "3bp-sb-bb": [180, 910],
    "3bp-co-btn": [165, 925], "3bp-hj-co": [165, 925], "3bp-hj-btn": [165, 925], "3bp-utg-co": [165, 925], "3bp-utg-btn": [165, 925],
  };
  const profile = Object.prototype.hasOwnProperty.call(scenarios, h.scenario) ? scenarios[h.scenario] : null;
  if (!profile || h.pot !== profile[0] || h.stack !== profile[1] ||
    h.unit !== 10 || h.flopBet.replace(/\s/g, "") !== "33%,75%" ||
    h.laterBet.replace(/\s/g, "") !== "60%" || h.raise.replace(/\s/g, "") !== "60%") {
    throw new ReviewError("UNSUPPORTED_TREE_CONFIG", "Unrecognized HMR1 producer settings");
  }
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

/** Builds a solver request, without invoking a worker. actualBoard is in the user's suit space.
 * For a river request an explicit solved-turn continuation is mandatory; appending a river to
 * flop-only reach would silently erase every turn decision. Amounts describe the PREPARED line.
 */
export function buildTurnInput(
  file: Hmr1File, flopPath: readonly number[], actualBoard: readonly number[],
  riverContinuation?: RiverContinuation,
) {
  if (!Array.isArray(actualBoard) || (actualBoard.length !== 4 && actualBoard.length !== 5)) {
    throw new ReviewError("INVALID_BOARD", "A turn or river board is required");
  }
  assertDistinctCards(actualBoard);
  requireProducerProfile(file);
  const mapping = canonicalizeFlop(actualBoard.slice(0, 3));
  if (!same(mapping.canonical, file.header.flopCards)) {
    throw new ReviewError("FLOP_MISMATCH", "File does not match the board", { expected: mapping.fileName, actual: file.header.flop });
  }
  const state = flopLine(file, flopPath);
  if (state.kind !== "chance") {
    throw new ReviewError("NOT_CHANCE", "A completed non-all-in flop is required", { flopPath, kind: state.kind });
  }
  const board = [...mapping.canonical, ...actualBoard.slice(3).map((c) => applyPerm(c, mapping.perm))];
  const flopRanges: [Float32Array, Float32Array] = [rangeAt(file, flopPath, 0), rangeAt(file, flopPath, 1)];
  let pot = state.pot;
  let effectiveStack = state.effectiveStack;
  let ranges = flopRanges;
  if (board.length === 5) {
    if (!riverContinuation) throw new ReviewError("MISSING_TURN_RESULT", "River requires the solved turn's reached ranges and state");
    const continuation = riverContinuation;
    assertDistinctCards(continuation.board, 4);
    if (!Array.isArray(continuation.flopPath)) throw new ReviewError("TURN_RESULT_MISMATCH", "Missing source flop path");
    if (!same(continuation.board, board.slice(0, 4)) || !same(continuation.flopPath, flopPath)) {
      throw new ReviewError("TURN_RESULT_MISMATCH", "Turn result uses another board or flop path");
    }
    if (!Number.isSafeInteger(continuation.pot) || !Number.isSafeInteger(continuation.effectiveStack) ||
      continuation.pot < pot || continuation.effectiveStack <= 0 || continuation.effectiveStack > effectiveStack ||
      continuation.pot + 2 * continuation.effectiveStack !== pot + 2 * effectiveStack) {
      throw new ReviewError("INVALID_TURN_STATE", "Turn must end with equal positive stacks and conserved chips");
    }
    ranges = checkedRanges(continuation.ranges, board);
    for (const player of [0, 1] as const) {
      if (ranges[player].some((weight, h) => weight > flopRanges[player][h])) {
        throw new ReviewError("INVALID_TURN_RANGE", "Turn reach cannot exceed flop reach", { player });
      }
    }
    pot = continuation.pot;
    effectiveStack = continuation.effectiveStack;
  } else if (riverContinuation) {
    throw new ReviewError("INVALID_TURN_STATE", "Turn result supplied for a turn request");
  }
  ranges = checkedRanges(ranges, board);
  return {
    initialState: board.length === 4 ? "turn" as const : "river" as const,
    board, ranges, startingPot: pot, effectiveStack, unit: file.header.unit,
    perm: mapping.perm, inversePerm: mapping.inversePerm,
    source: { scenario: file.header.scenario, flop: file.header.flop, flopPath: [...flopPath],
      treeProfile: "precompute2-2026-09-28" as const, reach: "normalized-u8" as const },
    bet: file.header.laterBet, raise: file.header.raise,
    turnBet: [file.header.laterBet, file.header.laterBet] as [string, string],
    riverBet: [file.header.laterBet, file.header.laterBet] as [string, string],
    turnRaise: [file.header.raise, file.header.raise] as [string, string],
    riverRaise: [file.header.raise, file.header.raise] as [string, string],
    turnDonk: null, riverDonk: null,
    addAllinThreshold: 1.5, forceAllinThreshold: 0.2, mergingThreshold: 0.1,
    rakeRate: 0, rakeCap: 0, targetExploitabilityPct: file.header.targetPct,
  };
}
