import { ReviewError } from "./errors";

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
export function parseAction(text: string): ActualAction {
  if (text === "Fold" || text === "Check" || text === "Call") return { kind: text };
  const match = /^(Bet|Raise|AllIn)\(([1-9][0-9]*)\)$/.exec(text);
  if (!match || !Number.isSafeInteger(Number(match[2]))) {
    throw new ReviewError("UNSUPPORTED_ACTION", "Unsupported action", { action: text });
  }
  return { kind: match[1] as ActionKind, amount: Number(match[2]) };
}
