/*
 * 에퀴티(승률) 계산 코어 — T38.
 *
 * 카드 표기는 앱 전체와 같다: 0~51 정수, rank = card >>> 2 (0=2 … 12=A), suit = card & 3.
 *
 * 하는 일 3가지
 *   ① evaluate7 — 7장 중 최선 5장 족보를 «비교 가능한 단일 정수»로 (룩업테이블 없음)
 *   ② computeEquity — 히어로 2장 vs 상대(2장 또는 가중 레인지)의 승/무/패
 *      · 전수(정확)와 몬테카를로(근사)를 평가 수 예산으로 자동 선택
 *   ③ parseRangeText — 앱의 [레인지 복사] 출력("K8s:0.75" 표기)을 콤보 목록으로
 *
 * 무거운 계산은 equity-worker.ts가 이 모듈을 워커에서 돌린다(화면이 멈추지 않게).
 */
import { expandClass } from "./preflop-charts";

/** 상대 레인지의 한 콤보. c1 < c2, w는 0~1 가중치 */
export type Combo = { c1: number; c2: number; w: number };

export type EquityResult = {
  /** 히어로 기준 % */
  win: number;
  tie: number;
  lose: number;
  /** win + tie/2 (2인 기준) */
  equity: number;
  method: "exact" | "mc";
  /** 전수: 실제로 비교한 (보드 × 콤보) 수 / MC: 표본 수 */
  evaluations: number;
  /** 카드 제거 후 남은 상대 콤보 수 */
  villainCombos: number;
};

/**
 * 전수 계산 예산. (남은 보드 조합 수) × (상대 콤보 수)가 이 값을 넘으면 몬테카를로로 간다.
 * 프리플랍 핸드 vs 핸드 = C(50,5) × 1 = 212만 → 전수.
 * 프리플랍 vs 넓은 레인지 = 212만 × 1200여 → 근사.
 */
export const EXACT_BUDGET = 20_000_000;
export const MC_SAMPLES = 200_000;

/** 169핸드 전부 = 랜덤 핸드(1326 콤보) */
export const ALL_HANDS_RANGE =
  "22+,A2s+,A2o+,K2s+,K2o+,Q2s+,Q2o+,J2s+,J2o+,T2s+,T2o+,92s+,92o+," +
  "82s+,82o+,72s+,72o+,62s+,62o+,52s+,52o+,42s+,42o+,32s+,32o+";

/* ── ① 7장 족보 평가 ──────────────────────────────────────── */

/*
 * 반환값 구성(비교만 하면 되므로 절대값에 의미는 없다):
 *   (족보등급 << 20) | 대표랭크5개를 4비트씩
 * 등급: 0 하이카드 · 1 원페어 · 2 투페어 · 3 트립스 · 4 스트레이트
 *       5 플러시 · 6 풀하우스 · 7 포카드 · 8 스트레이트 플러시
 */
const rankCount = new Int8Array(13);
const suitRankMask = new Int32Array(4);
const suitCount = new Int8Array(4);

/** 13비트 랭크 마스크에서 스트레이트 최상단 랭크. 없으면 -1 (휠 A2345는 3 = «5하이») */
const straightHigh = (mask: number): number => {
  for (let hi = 12; hi >= 4; hi--) {
    if (((mask >>> (hi - 4)) & 31) === 31) return hi;
  }
  // 휠: A(12) + 5,4,3,2(비트 3,2,1,0). A를 «1»로 쓰는 유일한 예외라 따로 본다
  if ((mask & (1 << 12)) !== 0 && (mask & 15) === 15) return 3;
  return -1;
};

const pack = (cat: number, a: number, b = 0, c = 0, d = 0, e = 0) =>
  (cat << 20) | (a << 16) | (b << 12) | (c << 8) | (d << 4) | e;

/** 7장(또는 5·6장) 중 최선의 5장 족보를 비교 가능한 정수로 */
export const evaluate7 = (cards: ArrayLike<number>): number => {
  rankCount.fill(0);
  suitRankMask.fill(0);
  suitCount.fill(0);
  let rankMask = 0;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const rank = card >>> 2;
    const suit = card & 3;
    rankCount[rank]++;
    rankMask |= 1 << rank;
    suitRankMask[suit] |= 1 << rank;
    suitCount[suit]++;
  }

  let flushSuit = -1;
  for (let s = 0; s < 4; s++) {
    if (suitCount[s] >= 5) {
      flushSuit = s;
      break;
    }
  }

  // 스트레이트 플러시 (같은 무늬 안에서만 성립)
  if (flushSuit >= 0) {
    const sf = straightHigh(suitRankMask[flushSuit]);
    if (sf >= 0) return pack(8, sf);
  }

  // 랭크별 개수 훑기 (내림차순이라 quad/trip1/pair1이 항상 가장 높은 것)
  let quad = -1;
  let trip1 = -1;
  let trip2 = -1;
  let pair1 = -1;
  let pair2 = -1;
  for (let r = 12; r >= 0; r--) {
    const n = rankCount[r];
    if (n === 4) {
      if (quad < 0) quad = r;
    } else if (n === 3) {
      if (trip1 < 0) trip1 = r;
      else if (trip2 < 0) trip2 = r;
    } else if (n === 2) {
      if (pair1 < 0) pair1 = r;
      else if (pair2 < 0) pair2 = r;
    }
  }

  // 포카드
  if (quad >= 0) {
    let kicker = -1;
    for (let r = 12; r >= 0; r--) {
      if (r !== quad && rankCount[r] > 0) {
        kicker = r;
        break;
      }
    }
    return pack(7, quad, kicker);
  }

  // 풀하우스 (트립스 두 벌이면 낮은 쪽을 페어로 쓴다)
  if (trip1 >= 0 && (trip2 >= 0 || pair1 >= 0)) {
    const pair = Math.max(trip2, pair1);
    return pack(6, trip1, pair);
  }

  // 플러시 — 같은 무늬 상위 5장
  if (flushSuit >= 0) {
    const fm = suitRankMask[flushSuit];
    let value = 5 << 20;
    let shift = 16;
    for (let r = 12; r >= 0 && shift >= 0; r--) {
      if ((fm >>> r) & 1) {
        value |= r << shift;
        shift -= 4;
      }
    }
    return value;
  }

  // 스트레이트
  const st = straightHigh(rankMask);
  if (st >= 0) return pack(4, st);

  // 트립스 (여기까지 왔으면 페어는 없다 — 있었으면 풀하우스)
  if (trip1 >= 0) {
    let k1 = -1;
    let k2 = -1;
    for (let r = 12; r >= 0; r--) {
      if (r === trip1 || rankCount[r] === 0) continue;
      if (k1 < 0) k1 = r;
      else {
        k2 = r;
        break;
      }
    }
    return pack(3, trip1, k1, k2);
  }

  // 투페어 (세 벌이면 위 두 벌 + 최고 킥커. 남은 페어도 킥커 후보다)
  if (pair2 >= 0) {
    let kicker = -1;
    for (let r = 12; r >= 0; r--) {
      if (r !== pair1 && r !== pair2 && rankCount[r] > 0) {
        kicker = r;
        break;
      }
    }
    return pack(2, pair1, pair2, kicker);
  }

  // 원페어
  if (pair1 >= 0) {
    let k1 = -1;
    let k2 = -1;
    let k3 = -1;
    for (let r = 12; r >= 0; r--) {
      if (r === pair1 || rankCount[r] === 0) continue;
      if (k1 < 0) k1 = r;
      else if (k2 < 0) k2 = r;
      else {
        k3 = r;
        break;
      }
    }
    return pack(1, pair1, k1, k2, k3);
  }

  // 하이카드 — 상위 5랭크
  let value = 0;
  let shift = 16;
  for (let r = 12; r >= 0 && shift >= 0; r--) {
    if ((rankMask >>> r) & 1) {
      value |= r << shift;
      shift -= 4;
    }
  }
  return value;
};

/* ── ③ 레인지 문자열 파서 ─────────────────────────────────── */

/** "AKs" 같은 핸드 종류 → 실제 카드 콤보 목록 (페어 6 · 수딧 4 · 오프수트 12) */
export const combosOfClass = (
  hi: number,
  lo: number,
  suited: boolean
): [number, number][] => {
  const out: [number, number][] = [];
  if (hi === lo) {
    for (let s1 = 0; s1 < 4; s1++)
      for (let s2 = s1 + 1; s2 < 4; s2++) out.push([4 * hi + s1, 4 * hi + s2]);
    return out;
  }
  if (suited) {
    for (let s = 0; s < 4; s++) out.push([4 * lo + s, 4 * hi + s]);
    return out;
  }
  for (let s1 = 0; s1 < 4; s1++)
    for (let s2 = 0; s2 < 4; s2++) {
      if (s1 === s2) continue;
      const a = 4 * hi + s1;
      const b = 4 * lo + s2;
      out.push(a < b ? [a, b] : [b, a]);
    }
  return out;
};

export type ParsedRange = {
  combos: Combo[];
  /** 해석 실패한 토큰 (없으면 null) */
  error: string | null;
  /** 가중치를 반영한 콤보 수 (1326 대비 %를 낼 때 쓴다) */
  weighted: number;
};

/**
 * 앱의 [레인지 복사] 출력과 같은 부분집합을 해석한다.
 *   "22+,AQs+,K8s:0.75,A5s-A4s:0.5"
 * 겹치는 표기는 «나중에 쓴 것이 이긴다» (복사 출력은 티어가 겹치지 않는다).
 */
export const parseRangeText = (text: string): ParsedRange => {
  const weights = new Map<number, number>();
  const cleaned = text.replace(/[\r\n\t;]+/g, ",").replace(/\s+/g, "");
  if (cleaned.replace(/,/g, "") === "") {
    return { combos: [], error: null, weighted: 0 };
  }

  for (const token of cleaned.split(",")) {
    if (!token) continue;
    let className = token;
    let weight = 1;

    const colon = token.indexOf(":");
    if (colon >= 0) {
      className = token.slice(0, colon);
      const raw = Number(token.slice(colon + 1));
      // 0.75와 75를 둘 다 받는다 (앱 출력은 0.75 표기)
      const value = !isFinite(raw) ? NaN : raw > 1 ? raw / 100 : raw;
      if (!isFinite(value) || value <= 0 || value > 1) {
        return { combos: [], error: token, weighted: 0 };
      }
      weight = value;
    }

    // 대소문자 혼용 허용 — 랭크는 대문자, s/o는 소문자로 맞춘다
    const normalized = className.toUpperCase().replace(/S/g, "s").replace(/O/g, "o");
    let expanded: [number, number, boolean][];
    try {
      expanded = expandClass(normalized);
    } catch {
      return { combos: [], error: token, weighted: 0 };
    }

    for (const [hi, lo, suited] of expanded) {
      for (const [c1, c2] of combosOfClass(hi, lo, suited)) {
        weights.set(c1 * 52 + c2, weight);
      }
    }
  }

  const combos: Combo[] = [];
  let weighted = 0;
  for (const [key, w] of weights) {
    combos.push({ c1: Math.floor(key / 52), c2: key % 52, w });
    weighted += w;
  }
  return { combos, error: null, weighted };
};

/** 카드 2장 → 콤보 하나짜리 목록 */
export const comboOfCards = (cards: number[]): Combo[] => {
  const [a, b] = cards;
  return [{ c1: Math.min(a, b), c2: Math.max(a, b), w: 1 }];
};

/* ── ② 에퀴티 계산 ────────────────────────────────────────── */

const choose = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 1; i <= k; i++) result = (result * (n - k + i)) / i;
  return Math.round(result);
};

export type EquityOptions = {
  /** 전수/MC 자동 선택을 무시하고 강제 (검증 스크립트가 두 방식을 비교할 때 쓴다) */
  force?: "exact" | "mc";
  budget?: number;
  samples?: number;
  /** 0~1 진행률 */
  onProgress?: (fraction: number) => void;
};

/**
 * 히어로 2장 vs 상대(콤보 목록)의 에퀴티.
 * 오류는 코드 문자열을 담은 Error로 던진다 (화면이 언어별 문구로 바꿔 보여준다):
 *   need-hero · bad-board · bad-card · duplicate · empty-range · no-combos
 */
export const computeEquity = (
  hero: number[],
  villainInput: Combo[],
  board: number[],
  options: EquityOptions = {}
): EquityResult => {
  if (hero.length !== 2) throw new Error("need-hero");
  if (board.length !== 0 && (board.length < 3 || board.length > 5)) {
    throw new Error("bad-board");
  }

  const used = new Uint8Array(52);
  for (const card of [...hero, ...board]) {
    if (!Number.isInteger(card) || card < 0 || card > 51) throw new Error("bad-card");
    if (used[card]) throw new Error("duplicate");
    used[card] = 1;
  }

  if (villainInput.length === 0) throw new Error("empty-range");
  // 카드 제거(card removal): 히어로·보드와 겹치는 상대 콤보는 존재할 수 없다
  const villain = villainInput.filter(
    (v) => v.w > 0 && v.c1 !== v.c2 && !used[v.c1] && !used[v.c2]
  );
  if (villain.length === 0) throw new Error("no-combos");

  const deck: number[] = [];
  for (let card = 0; card < 52; card++) if (!used[card]) deck.push(card);

  const boardLen = board.length;
  const need = 5 - boardLen;
  const deckSize = deck.length;
  const runouts = choose(deckSize, need);

  const useMc =
    options.force === "mc" ||
    (options.force !== "exact" && runouts * villain.length > (options.budget ?? EXACT_BUDGET));

  // 7장 버퍼는 미리 만들어 두고 재사용한다 (수백만 번 도는 자리라 할당이 비싸다)
  const heroCards = new Int32Array(7);
  const villCards = new Int32Array(7);
  heroCards[0] = hero[0];
  heroCards[1] = hero[1];
  for (let i = 0; i < boardLen; i++) {
    heroCards[2 + i] = board[i];
    villCards[2 + i] = board[i];
  }

  let winWeight = 0;
  let tieWeight = 0;
  let loseWeight = 0;
  let totalWeight = 0;
  let evaluations = 0;
  const onProgress = options.onProgress;

  if (!useMc) {
    const inRunout = new Uint8Array(52);
    const idx = new Int32Array(Math.max(need, 1));
    for (let i = 0; i < need; i++) idx[i] = i;
    let done = 0;

    for (;;) {
      for (let i = 0; i < need; i++) {
        const card = deck[idx[i]];
        heroCards[2 + boardLen + i] = card;
        villCards[2 + boardLen + i] = card;
        inRunout[card] = 1;
      }

      const heroValue = evaluate7(heroCards);
      for (let k = 0; k < villain.length; k++) {
        const combo = villain[k];
        if (inRunout[combo.c1] || inRunout[combo.c2]) continue;
        villCards[0] = combo.c1;
        villCards[1] = combo.c2;
        const villainValue = evaluate7(villCards);
        totalWeight += combo.w;
        evaluations++;
        if (heroValue > villainValue) winWeight += combo.w;
        else if (heroValue < villainValue) loseWeight += combo.w;
        else tieWeight += combo.w;
      }

      for (let i = 0; i < need; i++) inRunout[deck[idx[i]]] = 0;

      done++;
      if (onProgress && (done & 4095) === 0) onProgress(done / runouts);

      if (need === 0) break;
      let i = need - 1;
      while (i >= 0 && idx[i] === deckSize - need + i) i--;
      if (i < 0) break;
      idx[i]++;
      for (let j = i + 1; j < need; j++) idx[j] = idx[j - 1] + 1;
    }
  } else {
    // 상대 콤보를 가중치대로 뽑고, 남은 덱에서 런아웃을 무작위로 깐다
    const cumulative = new Float64Array(villain.length);
    let accumulated = 0;
    for (let i = 0; i < villain.length; i++) {
      accumulated += villain[i].w;
      cumulative[i] = accumulated;
    }

    const samples = options.samples ?? MC_SAMPLES;
    const work = Int32Array.from(deck);

    for (let s = 0; s < samples; s++) {
      const target = Math.random() * accumulated;
      let lo = 0;
      let hi = villain.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (cumulative[mid] < target) lo = mid + 1;
        else hi = mid;
      }
      const combo = villain[lo];

      // 부분 셔플로 need장을 뽑는다. 상대 카드가 걸리면 버리고 계속 (덱은 순서만 섞인다)
      let remaining = deckSize;
      let picked = 0;
      while (picked < need) {
        const j = (Math.random() * remaining) | 0;
        const card = work[j];
        remaining--;
        work[j] = work[remaining];
        work[remaining] = card;
        if (card === combo.c1 || card === combo.c2) continue;
        heroCards[2 + boardLen + picked] = card;
        villCards[2 + boardLen + picked] = card;
        picked++;
      }

      villCards[0] = combo.c1;
      villCards[1] = combo.c2;
      const heroValue = evaluate7(heroCards);
      const villainValue = evaluate7(villCards);
      totalWeight += 1;
      evaluations++;
      if (heroValue > villainValue) winWeight += 1;
      else if (heroValue < villainValue) loseWeight += 1;
      else tieWeight += 1;

      if (onProgress && (s & 4095) === 0) onProgress(s / samples);
    }
  }

  if (totalWeight === 0) throw new Error("no-combos");
  const win = (winWeight / totalWeight) * 100;
  const tie = (tieWeight / totalWeight) * 100;
  const lose = (loseWeight / totalWeight) * 100;

  return {
    win,
    tie,
    lose,
    equity: win + tie / 2,
    method: useMc ? "mc" : "exact",
    evaluations,
    villainCombos: villain.length,
  };
};

/** 검증 스크립트용 훅 — equity-verify.js가 실제 번들의 코어를 직접 부른다 */
declare global {
  interface Window {
    __equity?: {
      evaluate7: typeof evaluate7;
      computeEquity: typeof computeEquity;
      parseRangeText: typeof parseRangeText;
      comboOfCards: typeof comboOfCards;
      ALL_HANDS_RANGE: string;
      EXACT_BUDGET: number;
    };
  }
}
if (typeof window !== "undefined") {
  window.__equity = {
    evaluate7,
    computeEquity,
    parseRangeText,
    comboOfCards,
    ALL_HANDS_RANGE,
    EXACT_BUDGET,
  };
}
