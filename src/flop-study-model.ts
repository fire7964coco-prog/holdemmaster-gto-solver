// 플랍 글자·/study/ 앱 주소 — 화면 없는 순수 함수. 플랍 조회 자체는 /study/ 앱으로 옮겼다.
// src/review 와 같은 규칙: Vue·DOM·앱 런타임 import 금지 → Node에서 그대로 검사한다.
import { cardName, assertDistinctCards } from "./review/cards";

export const FLOP_STUDY_VIEW = "flop-study";

/** 실제 플랍 → «Ah7d2c» (카드 번호 내림차순). */
export function flopText(cards: readonly number[]) {
  assertDistinctCards(cards, 3);
  return [...cards].sort((a, b) => b - a).map(cardName).join("");
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
