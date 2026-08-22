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

export const MADE_LABELS_DE: Record<MadeKey, string> = {
  // 족보만 독일어, 나머지는 영어 유지 (본체 브리프 §1)
  straight_flush: "Straight Flush",
  quads: "Vierling",
  full_house: "Full House",
  flush: "Flush",
  straight: "Straße",
  // 이 칸은 «포켓페어 세트»와 «보드 트립스»를 함께 담는다. 독일어는 Set과 Drilling을
  // 구분해 쓰므로 둘 다 적는다 (en 「Set/Trips」·pt 「Set/Trinca」와 같은 처리)
  trips: "Set/Drilling",
  two_pair: "Zwei Paare",
  overpair: "Overpair",
  top_pair: "Top Pair",
  second_pair: "Second Pair",
  // 이 목록에서 Overpair·Top Pair·Second Pair·Underpair가 영어라 여기만 독일어면 튄다
  weak_pair: "Weak Pair",
  underpair: "Underpair",
  ace_high: "A-High",
  king_high: "K-High",
  nothing: "Keine Made Hand",
};

export const DRAW_LABELS_DE: Record<DrawKey, string> = {
  combo_draw: "Combo Draw",
  flush_draw: "Flushdraw",
  oesd: "OESD",
  gutshot: "Gutshot",
  // 「Backdoor」만 쓰면 완성 플러시로 읽힌다 — FD(=Flushdraw)를 반드시 남길 것
  backdoor_fd: "Backdoor-FD",
  no_draw: "Kein Draw",
};

export const MADE_LABELS_ZH: Record<MadeKey, string> = {
  // ⚠ 족보는 «전부» 중국어다 (본체 브리프 §2 — 대륙 唯一形). 독일어처럼 일부를 영어로
  //   남기면 안 된다. 금지역: 铁支(粤/구칭·四条로) · 满堂红(비유일 뿐·葫芦로) · 两队(오타·两对로)
  straight_flush: "同花顺",
  quads: "四条",
  full_house: "葫芦",
  flush: "同花",
  straight: "顺子",
  // 이 칸은 «포켓페어 세트»와 «보드 트립스»를 함께 담는다. 본체 브리프 §1D가
  // 「暗三条(set)/明三条(trips)」로 반드시 구분하라고 못박은 자리다
  // (en 「Set/Trips」·de 「Set/Drilling」과 같은 처리)
  trips: "暗三条/明三条",
  two_pair: "两对",
  // 「超对」는 중문 매체 실사용 확인 («没有超对、同花或顺子听牌的翻牌面» — 리서치 §2)
  overpair: "超对",
  top_pair: "顶对",
  // 「次顶对」= 顶对 다음 — 코드의 pos===1(정렬 후 두 번째로 높은 공공패와 맞춘 페어)과
  // 글자 뜻이 그대로 맞고, 공공패가 5장이어도 성립한다 (摩十客 a/716).
  // ⚠ 「中对」는 3장 보드에서만 맞고, 「第二对」는 «두 페어 중 작은 쪽»으로 읽힌다
  second_pair: "次顶对",
  weak_pair: "弱对",
  // 「低对（Underpair）」가 정착역이다 (德扑GOD teach/155가 그대로 정의한다).
  // ⚠ 「口袋小对」로 쓰면 안 된다 — 그 말은 «翻前 22-55»를 가리키는 자리를 이미 차지했다
  //   (传奇扑克 xw/jx/2301). 超对/低对가 짝을 이뤄 코드의 overpair/underpair와 그대로 맞는다
  underpair: "低对",
  ace_high: "A 高牌",
  king_high: "K 高牌",
  nothing: "未成牌",
};

export const DRAW_LABELS_ZH: Record<DrawKey, string> = {
  // draw = 「听牌」. 两头顺·卡顺·后门花 모두 중문 매체 실사용어다 (리서치 §2 출처).
  // 「组合听牌」도 정착역이 맞다 — 德扑技巧 chuji/714가 同花听牌·两头顺子听牌·卡顺听牌·
  // 组合听牌·后门同花听牌을 한 세트로 묶어 쓴다 (2026-08-22 원어민 검수에서 확인)
  combo_draw: "组合听牌",
  flush_draw: "同花听牌",
  oesd: "两头顺听牌",
  gutshot: "卡顺听牌",
  // 「后门」만 쓰면 완성 플러시로 읽힌다 — 同花听牌를 반드시 남길 것 (de와 같은 이유)
  backdoor_fd: "后门同花听牌",
  // 같은 조의 나머지 다섯이 명사구이므로 여기도 명사구로 (MADE의 「未成牌」과 같은 결)
  no_draw: "无听牌",
};

export const MADE_LABELS_ZH_HANT: Record<MadeKey, string> = {
  // ⚠ 족보는 «전부» 중국어이고, 번체는 간체와 «글자가 다르다» — 본체 브리프 §1이
  //   3개 대만 매체 만장일치로 확정한 표다(四條/三條·兩對·葫蘆).
  //   금지역: 鐵支(粵/별칭 — 브리프도 別稱으로만 인정) · 滿堂紅 · 兩隊(오타)
  straight_flush: "同花順",
  quads: "四條",
  full_house: "葫蘆",
  flush: "同花",
  straight: "順子",
  // set/trips 구분은 대만도 같다 — 브리프 §7-E 「暗三條(Set)·明三條(Trips)」
  // (번체 포스팅에서 暗三條 174회 · 明三條 17회)
  trips: "暗三條/明三條",
  two_pair: "兩對",
  // 「超對」= 브리프 §7-E 「超對(Overpair)」 (번체 포스팅 23회)
  overpair: "超對",
  top_pair: "頂對",
  // ⚠ 번체 코퍼스에는 「第二對」도 쓰이지만(2회), 그 말은 «두 페어 중 작은 쪽»으로도 읽힌다.
  //   코드의 pos===1(정렬 후 두 번째로 높은 공공패와 맞춘 페어)과 글자 뜻이 그대로 맞고
  //   바로 위 「頂對」와 짝을 이루는 「次頂對」로 간다 (간체판과 같은 판단 — 검수 대상 ①)
  second_pair: "次頂對",
  weak_pair: "弱對",
  // 「低對」= 超對의 짝. 대만 자료에 정착역이 따로 없어 중문 포커 표준어를 그대로 쓴다
  // (德撲GOD teach/155 「低對（Underpair）」 — 검수 대상 ②)
  underpair: "低對",
  ace_high: "A 高牌",
  king_high: "K 高牌",
  // 「成牌(made hand)」이 대만 실사용어라(번체 포스팅 135회) 그 부정형으로 만든다
  nothing: "未成牌",
};

export const DRAW_LABELS_ZH_HANT: Record<DrawKey, string> = {
  // draw = 「聽牌」 (브리프 §7-B · 번체 포스팅 339회)
  // ⚠ 번체 코퍼스는 「複合聽牌」(4회)와 「組合聽牌」(2회)를 둘 다 쓴다.
  //   나머지 다섯과 어형을 맞추고 간체판(원어민 검수 통과)과도 같은 「組合聽牌」로 간다 (검수 대상 ③)
  combo_draw: "組合聽牌",
  flush_draw: "同花聽牌",
  // OESD = 브리프 §7-B 「兩頭順聽／雙頭聽」·§7-E 「兩頭順/活端順」 (번체 포스팅 兩頭順 31회)
  oesd: "兩頭順聽牌",
  // gutshot = 브리프 §7-E 「卡順/買中洞」 (번체 포스팅 卡順 11회 · 內順聽牌 1회)
  gutshot: "卡順聽牌",
  // 「後門」만 쓰면 완성 플러시로 읽힌다 — 同花聽牌를 반드시 남길 것
  backdoor_fd: "後門同花聽牌",
  no_draw: "無聽牌",
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
    : i18n.locale === "de"
    ? MADE_LABELS_DE
    : i18n.locale === "zh"
    ? MADE_LABELS_ZH
    : i18n.locale === "zh-hant"
    ? MADE_LABELS_ZH_HANT
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
    : i18n.locale === "de"
    ? DRAW_LABELS_DE
    : i18n.locale === "zh"
    ? DRAW_LABELS_ZH
    : i18n.locale === "zh-hant"
    ? DRAW_LABELS_ZH_HANT
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
