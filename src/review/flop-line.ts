import { ReviewError } from "./errors";
import { getNode, Hmr1File } from "./hmr1";

export type ActionKind = "Fold" | "Check" | "Call" | "Bet" | "Raise" | "AllIn";
/** Amount is the player's TOTAL contribution on this street, in engine chips. */
export type ActualAction = { kind: ActionKind; amount?: number };
export type ActionMatch = {
  actionIndex: number;
  kind: ActionKind;
  usedKind: ActionKind;
  approximated: boolean;
  actual: number | null;
  used: number | null;
};
export type FlopLine = {
  path: number[];
  pot: number;
  committed: [number, number];
  stacks: [number, number];
  effectiveStack: number;
  kind: "decision" | "chance" | "terminal";
  player: 0 | 1 | null;
  terminalReason?: "fold" | "all-in";
  steps: {
    path: number[];
    player: 0 | 1;
    actionIndex: number;
    action: ActualAction;
    paid: number;
    potBefore: number;
    potAfter: number;
  }[];
};

export function parseAction(text: string): ActualAction {
  if (text === "Fold" || text === "Check" || text === "Call") return { kind: text };
  const match = /^(Bet|Raise|AllIn)\(([1-9][0-9]*)\)$/.exec(text);
  if (!match || !Number.isSafeInteger(Number(match[2]))) {
    throw new ReviewError("UNSUPPORTED_ACTION", "Unsupported HMR1 action", { action: text });
  }
  return { kind: match[1] as ActionKind, amount: Number(match[2]) };
}

/** State BEFORE any next action. Fold pots include the uncalled wager, before payout. */
export function flopLine(file: Hmr1File, path: readonly number[]): FlopLine {
  if (!Array.isArray(path) || path.some((a) => !Number.isSafeInteger(a) || a < 0)) {
    throw new ReviewError("MISSING_PATH", "Invalid flop path", { path });
  }
  const committed: [number, number] = [0, 0];
  const steps: FlopLine["steps"] = [];
  let kind: FlopLine["kind"] = "decision";
  let terminalReason: FlopLine["terminalReason"];
  let player: 0 | 1 | null = 0;
  for (let depth = 0; depth < path.length; depth++) {
    if (kind !== "decision" || player === null) {
      throw new ReviewError("MISSING_PATH", "Path continues past the flop leaf", { path, depth });
    }
    const prefix = path.slice(0, depth);
    const node = getNode(file, prefix);
    if (node.player !== player) throw new ReviewError("INVALID_FORMAT", "Unexpected acting player", { prefix });
    const actionIndex = path[depth];
    if (actionIndex >= node.actions.length) {
      throw new ReviewError("MISSING_PATH", "Action index outside node", { prefix, actionIndex });
    }
    const action = parseAction(node.actions[actionIndex]);
    const opponent = (player ^ 1) as 0 | 1;
    const facing = committed[opponent] - committed[player];
    const potBefore = file.header.pot + committed[0] + committed[1];
    const before = committed[player];
    if (action.kind === "Fold") {
      if (facing <= 0) throw new ReviewError("INVALID_FORMAT", "Fold without a wager", { prefix });
      kind = "terminal";
      terminalReason = "fold";
    } else if (action.kind === "Check") {
      if (facing !== 0) throw new ReviewError("INVALID_FORMAT", "Check facing a wager", { prefix });
      if (player === 1) kind = "chance";
    } else if (action.kind === "Call") {
      if (facing <= 0) throw new ReviewError("INVALID_FORMAT", "Call without a wager", { prefix });
      committed[player] = committed[opponent];
      kind = committed[player] === file.header.stack ? "terminal" : "chance";
      if (kind === "terminal") terminalReason = "all-in";
    } else {
      const amount = action.amount!;
      if (
        amount <= Math.max(...committed) || amount > file.header.stack ||
        (action.kind === "Bet" && facing !== 0) ||
        (action.kind === "Raise" && facing <= 0) ||
        (action.kind === "AllIn" && amount !== file.header.stack)
      ) throw new ReviewError("INVALID_FORMAT", "Invalid wager in flop tree", { prefix, action });
      committed[player] = amount;
    }
    steps.push({ path: [...prefix], player, actionIndex, action, paid: committed[player] - before,
      potBefore, potAfter: file.header.pot + committed[0] + committed[1] });
    player = kind === "decision" ? opponent : null;
  }
  const stored = file.nodesByPath.get(path.join("/"));
  if (kind === "decision") {
    const node = getNode(file, path);
    if (node.player !== player) throw new ReviewError("INVALID_FORMAT", "Unexpected acting player", { path });
  } else if (stored) {
    throw new ReviewError("INVALID_FORMAT", "Decision stored at a flop leaf", { path });
  }
  const stacks: [number, number] = [file.header.stack - committed[0], file.header.stack - committed[1]];
  return { path: [...path], pot: file.header.pot + committed[0] + committed[1], committed,
    stacks, effectiveStack: Math.min(...stacks), kind, player, terminalReason, steps };
}

/** Nearest supported size, with lower-size tie break. No extrapolation outside the menu. */
export function matchAction(file: Hmr1File, path: readonly number[], actual: ActualAction): ActionMatch {
  const state = flopLine(file, path);
  if (state.kind !== "decision" || state.player === null) {
    throw new ReviewError("NOT_DECISION", "Action requires a decision node", { path });
  }
  const actions = getNode(file, path).actions.map(parseAction);
  if (!actual || !["Fold", "Check", "Call", "Bet", "Raise", "AllIn"].includes(actual.kind)) {
    throw new ReviewError("UNSUPPORTED_ACTION", "Unsupported action", { actual });
  }
  const sized = actual.kind === "Bet" || actual.kind === "Raise" || actual.kind === "AllIn";
  if (!sized) {
    if (actual.amount !== undefined) throw new ReviewError("INVALID_AMOUNT", "Unsized action has amount");
    const actionIndex = actions.findIndex((a) => a.kind === actual.kind);
    if (actionIndex < 0) throw new ReviewError("UNSUPPORTED_ACTION", "Action absent at node", { actual, path });
    return { actionIndex, kind: actual.kind, usedKind: actual.kind, approximated: false, actual: null, used: null };
  }
  const amount = actual.amount;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || amount > Number.MAX_SAFE_INTEGER) {
    throw new ReviewError("INVALID_AMOUNT", "Wager must be finite positive chips", { actual });
  }
  const facing = state.committed[state.player ^ 1] > state.committed[state.player];
  const family = facing ? "Raise" : "Bet";
  if (actual.kind !== "AllIn" && actual.kind !== family) {
    throw new ReviewError("UNSUPPORTED_ACTION", "Wager kind does not match node", { actual, path });
  }
  if (actual.kind === "AllIn" && amount !== file.header.stack) {
    throw new ReviewError("INVALID_AMOUNT", "All-in must equal the street stack", { actual });
  }
  const candidates = actions.map((a, index) => ({ ...a, index })).filter((a) =>
    actual.kind === "AllIn" ? a.kind === "AllIn" : a.kind === family || a.kind === "AllIn");
  if (!candidates.length) throw new ReviewError("UNSUPPORTED_ACTION", "No supported wager", { actual, path });
  const min = Math.min(...candidates.map((a) => a.amount!));
  const max = Math.max(...candidates.map((a) => a.amount!));
  if (amount < min || amount > max) {
    throw new ReviewError("SIZE_OUT_OF_RANGE", "Wager outside supported sizes", { actual: amount, min, max, path });
  }
  candidates.sort((a, b) => Math.abs(a.amount! - amount) - Math.abs(b.amount! - amount) ||
    a.amount! - b.amount! || a.index - b.index);
  const used = candidates[0];
  return { actionIndex: used.index, kind: actual.kind, usedKind: used.kind,
    approximated: amount !== used.amount, actual: amount, used: used.amount! };
}

/** All later states use the prepared line; every size substitution remains attached. */
export function followFlopActions(file: Hmr1File, actions: readonly ActualAction[]): FlopLine & { matches: ActionMatch[] } {
  if (!Array.isArray(actions)) throw new ReviewError("UNSUPPORTED_ACTION", "Actions must be an array");
  const path: number[] = [];
  const matches: ActionMatch[] = [];
  for (const action of actions) {
    const match = matchAction(file, path, action);
    matches.push(match);
    path.push(match.actionIndex);
  }
  return { ...flopLine(file, path), matches };
}
