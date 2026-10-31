// 플랍 글자·/study/ 앱 주소 — 화면 없는 순수 함수. 플랍 조회 자체는 /study/ 앱으로 옮겼다.
// src/review 와 같은 규칙: Vue·DOM·앱 런타임 import 금지 → Node에서 그대로 검사한다.
import { cardFromName, cardName, assertDistinctCards } from "./review/flop-canon";

export const FLOP_STUDY_VIEW = "flop-study";
/** 실제 플랍 수 C(52,3) */
export const REAL_FLOP_COUNT = 22100;

/** 실제 22,100 플랍에서 균등 — 서로 다른 3장 (rng는 [0,1) 균등). */
export function randomFlop(rng: () => number = Math.random): number[] {
  const deck = Array.from({ length: 52 }, (_, i) => i);
  for (let i = 0; i < 3; i++) {
    const j = i + Math.floor(rng() * (52 - i));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, 3).sort((a, b) => b - a);
}

/** 실제 플랍 → «Ah7d2c» (카드 번호 내림차순). */
export function flopText(cards: readonly number[]) {
  assertDistinctCards(cards, 3);
  return [...cards].sort((a, b) => b - a).map(cardName).join("");
}

/** «Ah7d2c» / «ah 7d 2c» → 카드 3장, 잘못되면 null. */
export function parseFlopText(text: string): number[] | null {
  const compact = String(text ?? "").replace(/[\s,]/g, "");
  if (compact.length !== 6) return null;
  try {
    const cards = [0, 2, 4].map((i) =>
      cardFromName(compact[i].toUpperCase() + compact[i + 1].toLowerCase())
    );
    assertDistinctCards(cards, 3);
    return cards.sort((a, b) => b - a);
  } catch {
    return null;
  }
}

export function buildFlopStudyLink(link: {
  spot: string;
  flop: readonly number[];
  line?: readonly number[];
  turn?: number | null;
  turnLine?: readonly number[];
  turnView?: boolean;
}) {
  const q = new URLSearchParams({
    view: FLOP_STUDY_VIEW,
    spot: link.spot,
    flop: flopText(link.flop),
  });
  if (link.line?.length) q.set("line", link.line.join("."));
  if (link.turn !== undefined && link.turn !== null) {
    q.set("turn", cardName(link.turn));
    if (link.turnLine?.length) q.set("tline", link.turnLine.join("."));
    if (link.turnView) q.set("tview", "1");
  }
  return "?" + q.toString();
}
