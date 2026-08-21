// 핸드 분류(오버페어/탑페어/드로우 등) — GTO Wizard식 브레이크다운 패널용
// 카드 인코딩: id = 4*rank + suit (rank 0=2 .. 12=A, suit 0=♣ 1=♦ 2=♥ 3=♠)
import { i18n } from "./i18n";

export type MadeKey =
  | "straight_flush"
  | "quads"
  | "full_house"
  | "flush"
  | "straight"
  | "trips"
  | "two_pair"
  | "overpair"
  | "top_pair"
  | "second_pair"
  | "weak_pair"
  | "underpair"
  | "ace_high"
  | "king_high"
  | "nothing";

export type DrawKey =
  | "combo_draw"
  | "flush_draw"
  | "oesd"
  | "gutshot"
  | "backdoor_fd"
  | "no_draw";

export const MADE_LABELS: Record<MadeKey, string> = {
  straight_flush: "스트레이트 플러시",
  quads: "포카드",
  full_house: "풀하우스",
  flush: "플러시",
  straight: "스트레이트",
  trips: "트리플",
  two_pair: "투 페어",
  overpair: "오버 페어",
  top_pair: "탑 페어",
  second_pair: "2번째 페어",
  weak_pair: "3번째 이하 페어",
  underpair: "언더 페어",
  ace_high: "A 하이",
  king_high: "K 하이",
  nothing: "미완성 핸드",
};

export const DRAW_LABELS: Record<DrawKey, string> = {
  combo_draw: "콤보 드로우",
  flush_draw: "플러시 드로우",
  oesd: "양방 스트레이트 드로우",
  gutshot: "거트샷",
  backdoor_fd: "백도어 플러시 드로우",
  no_draw: "드로우 없음",
};

export const MADE_LABELS_EN: Record<MadeKey, string> = {
  straight_flush: "Straight Flush",
  quads: "Quads",
  full_house: "Full House",
  flush: "Flush",
  straight: "Straight",
  trips: "Set/Trips",
  two_pair: "Two Pair",
  overpair: "Overpair",
  top_pair: "Top Pair",
  second_pair: "Second Pair",
  weak_pair: "Weak Pair",
  underpair: "Underpair",
  ace_high: "Ace-High",
  king_high: "King-High",
  nothing: "No Made Hand",
};

export const DRAW_LABELS_EN: Record<DrawKey, string> = {
  combo_draw: "Combo Draw",
  flush_draw: "Flush Draw",
  oesd: "OESD",
  gutshot: "Gutshot",
  backdoor_fd: "Backdoor FD",
  no_draw: "No Draw",
};

export const MADE_LABELS_JA: Record<MadeKey, string> = {
  straight_flush: "ストレートフラッシュ",
  quads: "フォーカード",
  full_house: "フルハウス",
  flush: "フラッシュ",
  straight: "ストレート",
  trips: "スリーカード",
  two_pair: "ツーペア",
  overpair: "オーバーペア",
  top_pair: "トップペア",
  second_pair: "セカンドペア",
  weak_pair: "ローペア",
  underpair: "アンダーペア",
  ace_high: "Aハイ",
  king_high: "Kハイ",
  nothing: "役なし",
};

export const DRAW_LABELS_JA: Record<DrawKey, string> = {
  combo_draw: "コンボドロー",
  flush_draw: "フラッシュドロー",
  oesd: "オープンエンド",
  gutshot: "ガットショット",
  backdoor_fd: "バックドアFD",
  no_draw: "ドローなし",
};

export const MADE_LABELS_ES: Record<MadeKey, string> = {
  straight_flush: "Escalera de color",
  quads: "Quads",
  full_house: "Full house",
  flush: "Color",
  straight: "Escalera",
  trips: "Trío",
  two_pair: "Doble pareja",
  overpair: "Overpair",
  top_pair: "Top pair",
  second_pair: "Segunda pareja",
  weak_pair: "Pareja débil",
  underpair: "Underpair",
  ace_high: "A-high",
  king_high: "K-high",
  nothing: "Sin jugada",
};

export const DRAW_LABELS_ES: Record<DrawKey, string> = {
  combo_draw: "Proyecto combinado",
  flush_draw: "Proyecto de color",
  oesd: "Proyecto a dos puntas",
  gutshot: "Gutshot",
  backdoor_fd: "Proyecto backdoor",
  no_draw: "Sin proyecto",
};

export const MADE_LABELS_PT: Record<MadeKey, string> = {
  straight_flush: "Straight flush",
  quads: "Quadra",
  full_house: "Full house",
  flush: "Flush",
  straight: "Straight",
  // 「Trinca」는 포켓페어 세트·보드 트립스를 함께 가리키는 총칭 (pokernobrasil·MegaJogos 용어집)
  trips: "Set/Trinca",
  two_pair: "Dois pares",
  overpair: "Overpair",
  top_pair: "Top pair",
  second_pair: "Segundo par",
  weak_pair: "Par fraco",
  underpair: "Underpair",
  ace_high: "A-high",
  king_high: "K-high",
  nothing: "Sem mão feita",
};

export const DRAW_LABELS_PT: Record<DrawKey, string> = {
  combo_draw: "Combo draw",
  flush_draw: "Flush draw",
  oesd: "OESD",
  gutshot: "Gutshot",
  backdoor_fd: "Backdoor FD",
  no_draw: "Sem draw",
};

/* 현재 언어의 라벨 — 화면에서는 상수 대신 이걸 쓸 것 */
export const madeLabels = () =>
  i18n.locale === "ko"
    ? MADE_LABELS
    : i18n.locale === "ja"
    ? MADE_LABELS_JA
    : i18n.locale === "es"
    ? MADE_LABELS_ES
    : i18n.locale === "pt"
    ? MADE_LABELS_PT
    : MADE_LABELS_EN;
export const drawLabels = () =>
  i18n.locale === "ko"
    ? DRAW_LABELS
    : i18n.locale === "ja"
    ? DRAW_LABELS_JA
    : i18n.locale === "es"
    ? DRAW_LABELS_ES
    : i18n.locale === "pt"
    ? DRAW_LABELS_PT
    : DRAW_LABELS_EN;

export const MADE_ORDER: MadeKey[] = [
  "straight_flush",
  "quads",
  "full_house",
  "flush",
  "straight",
  "trips",
  "two_pair",
  "overpair",
  "top_pair",
  "second_pair",
  "weak_pair",
  "underpair",
  "ace_high",
  "king_high",
  "nothing",
];

export const DRAW_ORDER: DrawKey[] = [
  "combo_draw",
  "flush_draw",
  "oesd",
  "gutshot",
  "backdoor_fd",
  "no_draw",
];

const rankOf = (c: number) => c >>> 2;
const suitOf = (c: number) => c & 3;

// 카테고리 랭크: 0=하이카드 1=페어 2=투페어 3=트립 4=스트레이트 5=플러시 6=풀하우스 7=포카드 8=스티플
const evalCategory = (cards: number[]): number => {
  const rankCnt = new Array<number>(13).fill(0);
  const suitCnt = new Array<number>(4).fill(0);
  const suitRanks: number[][] = [[], [], [], []];
  for (const c of cards) {
    rankCnt[rankOf(c)]++;
    suitCnt[suitOf(c)]++;
    suitRanks[suitOf(c)].push(rankOf(c));
  }

  const hasStraight = (ranksArr: number[]): boolean => {
    const set = new Set(ranksArr);
    if (set.has(12)) set.add(-1); // wheel: A=1
    for (let hi = 12; hi >= 3; hi--) {
      let ok = true;
      for (let r = hi; r > hi - 5; r--) {
        if (!set.has(r)) {
          ok = false;
          break;
        }
      }
      if (ok) return true;
    }
    return false;
  };

  let flushSuit = -1;
  for (let s = 0; s < 4; s++) if (suitCnt[s] >= 5) flushSuit = s;

  if (flushSuit >= 0 && hasStraight(suitRanks[flushSuit])) return 8;

  const counts = rankCnt.filter((n) => n > 0).sort((a, b) => b - a);
  if (counts[0] === 4) return 7;
  if (counts[0] === 3 && counts[1] >= 2) return 6;
  if (flushSuit >= 0) return 5;
  if (hasStraight(cards.map(rankOf))) return 4;
  if (counts[0] === 3) return 3;
  if (counts[0] === 2 && counts[1] === 2) return 2;
  if (counts[0] === 2) return 1;
  return 0;
};

const CAT_TO_KEY: Record<number, MadeKey> = {
  8: "straight_flush",
  7: "quads",
  6: "full_house",
  5: "flush",
  4: "straight",
  3: "trips",
  2: "two_pair",
};

export const classifyMade = (hole: [number, number], board: number[]): MadeKey => {
  const combined = [...hole, ...board];
  const catCombined = evalCategory(combined);
  const catBoard = evalCategory(board);

  // 홀 카드가 보드를 개선하지 못하면 노메이드 취급 → 하이카드 분류
  if (catCombined <= catBoard) {
    const hr = Math.max(rankOf(hole[0]), rankOf(hole[1]));
    if (hr === 12) return "ace_high";
    if (hr === 11) return "king_high";
    return "nothing";
  }

  if (catCombined >= 2) return CAT_TO_KEY[catCombined];

  // 원 페어 세분화
  const boardRanks = [...new Set(board.map(rankOf))].sort((a, b) => b - a);
  const r0 = rankOf(hole[0]);
  const r1 = rankOf(hole[1]);

  if (r0 === r1) {
    // 포켓 페어 (보드 매칭이면 위에서 트립 처리됨)
    return r0 > boardRanks[0] ? "overpair" : "underpair";
  }

  // 홀 카드 하나가 보드 랭크와 매칭
  const matched = boardRanks.includes(r0) ? r0 : r1;
  const pos = boardRanks.indexOf(matched);
  if (pos === 0) return "top_pair";
  if (pos === 1) return "second_pair";
  return "weak_pair";
};

export const classifyDraw = (hole: [number, number], board: number[]): DrawKey => {
  if (board.length >= 5) return "no_draw";

  const combined = [...hole, ...board];
  const catCombined = evalCategory(combined);

  // 플러시 드로우: 같은 수트 4장 + 홀 카드 기여
  let flushDraw = false;
  if (catCombined < 5) {
    for (let s = 0; s < 4; s++) {
      const total = combined.filter((c) => suitOf(c) === s).length;
      const fromHole = hole.filter((c) => suitOf(c) === s).length;
      if (total === 4 && fromHole >= 1) flushDraw = true;
    }
  }

  // 스트레이트 드로우: 한 장 추가로 완성되는 랭크 수 (홀 카드 포함 조건)
  let completingRanks = 0;
  if (catCombined < 4) {
    const rankSet = new Set(combined.map(rankOf));
    const holeRanks = new Set(hole.map(rankOf));
    for (let cand = 0; cand < 13; cand++) {
      if (rankSet.has(cand)) continue;
      const s = new Set(rankSet);
      s.add(cand);
      if (s.has(12)) s.add(-1);
      let completes = false;
      for (let hi = 12; hi >= 3 && !completes; hi--) {
        let ok = true;
        let usesHole = false;
        let usesCand = false;
        for (let r = hi; r > hi - 5; r--) {
          const rr = r === -1 ? -1 : r;
          if (!s.has(rr)) {
            ok = false;
            break;
          }
          const asRank = rr === -1 ? 12 : rr;
          if (asRank === cand) usesCand = true;
          if (holeRanks.has(asRank) && asRank !== cand) usesHole = true;
        }
        if (ok && usesCand && usesHole) completes = true;
      }
      if (completes) completingRanks++;
    }
  }

  const straightDraw: DrawKey | null =
    completingRanks >= 2 ? "oesd" : completingRanks === 1 ? "gutshot" : null;

  if (flushDraw && straightDraw) return "combo_draw";
  if (flushDraw) return "flush_draw";
  if (straightDraw) return straightDraw;

  // 백도어 플러시 (플랍 한정): 같은 수트 3장 + 홀 기여
  // 원페어 이하일 때만 표시 — 트리플+ 핸드에 백도어 표시는 노이즈
  if (board.length === 3 && catCombined <= 1) {
    for (let s = 0; s < 4; s++) {
      const total = combined.filter((c) => suitOf(c) === s).length;
      const fromHole = hole.filter((c) => suitOf(c) === s).length;
      if (total === 3 && fromHole >= 1) return "backdoor_fd";
    }
  }

  return "no_draw";
};

export type BreakdownRow = { key: string; label: string; pct: number };

/** 레인지 전체를 비중 가중으로 집계. cardsPacked[i] = card1 | card2 << 8 */
export const aggregateBreakdown = (
  cardsPacked: number[],
  weights: number[],
  board: number[]
): { made: BreakdownRow[]; draws: BreakdownRow[] } => {
  const madeSum = new Map<MadeKey, number>();
  const drawSum = new Map<DrawKey, number>();
  let total = 0;

  const deadMask = new Array<boolean>(52).fill(false);
  for (const b of board) deadMask[b] = true;

  for (let i = 0; i < cardsPacked.length; i++) {
    const w = weights[i];
    if (!w || w <= 0) continue;
    const c1 = cardsPacked[i] & 0xff;
    const c2 = cardsPacked[i] >>> 8;
    if (deadMask[c1] || deadMask[c2]) continue;

    const hole: [number, number] = [c1, c2];
    total += w;
    const mk = classifyMade(hole, board);
    madeSum.set(mk, (madeSum.get(mk) ?? 0) + w);
    const dk = classifyDraw(hole, board);
    drawSum.set(dk, (drawSum.get(dk) ?? 0) + w);
  }

  const toRows = <K extends string>(
    order: readonly K[],
    labels: Record<K, string>,
    sums: Map<K, number>
  ): BreakdownRow[] =>
    order
      .map((key) => ({
        key,
        label: labels[key],
        pct: total > 0 ? ((sums.get(key) ?? 0) * 100) / total : 0,
      }))
      .filter((row) => row.pct > 0.05);

  return {
    made: toRows(MADE_ORDER, madeLabels(), madeSum),
    draws: toRows(DRAW_ORDER, drawLabels(), drawSum),
  };
};
