import { ReviewError } from "./errors";

export type SuitPermutation = readonly [number, number, number, number];
export type Flop = readonly [number, number, number];

const RANKS = "23456789TJQKA";
const SUITS = "cdhs";

function assertCard(card: number): void {
  if (!Number.isInteger(card) || card < 0 || card >= 52) {
    throw new ReviewError("INVALID_CARD", "Card must be an integer from 0 to 51", { card });
  }
}

export function assertDistinctCards(cards: readonly number[], expectedLength?: number): void {
  if (!Array.isArray(cards) || (expectedLength !== undefined && cards.length !== expectedLength)) {
    throw new ReviewError("INVALID_CARD", "Unexpected card count", { expectedLength });
  }
  const seen = new Set<number>();
  for (const card of cards) {
    assertCard(card);
    if (seen.has(card)) throw new ReviewError("CARD_OVERLAP", "Card occurs more than once", { card });
    seen.add(card);
  }
}

function assertPerm(perm: SuitPermutation): void {
  if (!Array.isArray(perm) || perm.length !== 4 || new Set(perm).size !== 4 ||
      perm.some(s => !Number.isInteger(s) || s < 0 || s > 3)) {
    throw new ReviewError("INVALID_PERMUTATION", "Suit mapping must be a permutation of 0,1,2,3");
  }
}

export function cardName(card: number): string {
  assertCard(card);
  return RANKS[card >> 2] + SUITS[card & 3];
}

export function cardFromName(name: string): number {
  if (typeof name !== "string" || name.length !== 2 || !RANKS.includes(name[0]) || !SUITS.includes(name[1])) {
    throw new ReviewError("INVALID_CARD", "Expected a rank and suit, for example Ah", { name });
  }
  return 4 * RANKS.indexOf(name[0]) + SUITS.indexOf(name[1]);
}

/** Engine range index, independent of card argument order. */
export function handIndex(a: number, b: number): number {
  assertDistinctCards([a, b], 2);
  const c1 = Math.min(a, b);
  const c2 = Math.max(a, b);
  return c1 * (101 - c1) / 2 + c2 - 1;
}

export function applyPerm(card: number, perm: SuitPermutation): number {
  assertCard(card);
  assertPerm(perm);
  return (card & ~3) | perm[card & 3];
}
