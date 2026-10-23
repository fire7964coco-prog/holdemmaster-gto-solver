import { parseCardString } from "./utils";

/** Parse atomically. null means the caller must keep its existing board. */
export const parseBoardInput = (input: string): number[] | null => {
  let text = input.trim();
  if (text.startsWith("[") && text.endsWith("]")) {
    text = text.slice(1, -1).trim();
  }
  if (!text) return [];

  const tokens = text.match(/(?:10|[2-9tjqka])[cdhs]|[\s,]+/gi);
  if (!tokens || tokens.join("") !== text) return null;

  const board: number[] = [];
  for (const token of tokens) {
    if (/^[\s,]+$/.test(token)) continue;
    const normalized = token.toLowerCase().replace(/^10/, "t");
    const card = parseCardString(normalized);
    if (card === null) return null;
    // Preserve the old duplicate-removal and first-three-card ordering rules.
    if (board.includes(card)) continue;
    if (board.length === 5) return null;
    board.push(card);
    if (board.length <= 3) board.sort((a, b) => b - a);
  }
  return board.length ? board : null;
};
