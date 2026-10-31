// 플랍 보드 묶기 — 트레이너 보드 고르기가 쓴다. 플랍 통계 자체는 /study/ 앱으로 옮겼다.
// 화면 없는 순수 함수: Vue·DOM·앱 런타임 import 금지 → Node에서 그대로 검사한다.

// ── 보드 묶기 (축마다 모든 플랍이 정확히 한 칸) ──
export type GroupAxis = "high" | "suits" | "pairing" | "connect";
export const GROUP_AXES: readonly GroupAxis[] = ["high", "suits", "pairing", "connect"];
/** 칸 순서 = 화면 순서. high 는 랭크 문자. */
export const GROUP_KEYS: Readonly<Record<GroupAxis, readonly string[]>> = {
  high: ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"],
  suits: ["rainbow", "two-tone", "monotone"],
  pairing: ["unpaired", "paired", "trips"],
  connect: ["connected", "semi", "disconnected"],
};
const RANKS = "23456789TJQKA";

/** 연결성: connected = 서로 다른 3장이 5칸 창 안(스트레이트 완성 가능 · board-type-aggregate.js 와 같은 정의)
 *  · semi = 서로 다른 2장의 간격 2 이하(오픈엔드·거트샷이 많은 보드) · 그 밖 disconnected. A는 14와 1 둘 다 본다. */
export function boardClass(cards: readonly number[]): Record<GroupAxis, string> {
  const ranks = cards.map((c) => (c >> 2) + 2);
  const distinct = [...new Set(ranks)];
  const suits = new Set(cards.map((c) => c & 3)).size;
  const span = (rs: number[]) => {
    const lo = rs.map((r) => (r === 14 ? 1 : r));
    return Math.min(Math.max(...rs) - Math.min(...rs), Math.max(...lo) - Math.min(...lo));
  };
  let connect = "disconnected";
  if (distinct.length === 3 && span(distinct) <= 4) connect = "connected";
  else if (
    distinct.some((a, i) => distinct.some((b, j) => j > i && span([a, b]) <= 2))
  )
    connect = "semi";
  return {
    high: RANKS[Math.max(...ranks) - 2],
    suits: suits === 3 ? "rainbow" : suits === 2 ? "two-tone" : "monotone",
    pairing: distinct.length === 3 ? "unpaired" : distinct.length === 2 ? "paired" : "trips",
    connect,
  };
}
