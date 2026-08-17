/*
 * 프리플랍 오픈 레인지(RFI) 차트 데이터 — T36 1단계 (2026-08-17)
 *
 * 데이터 방식 (사용자 승인 2026-08-17):
 * - 유료 솔버 차트를 복제하지 않는다. 공개 무료 GTO 자료 여러 개를 교차 검증해
 *   «합의 레인지»를 만들고, 출처가 갈리는 핸드는 혼합 빈도(75/50/25%)로 표기한다.
 * - 출처와 대조 결과는 `참고자료/프리플랍차트_출처검증.md`에 기록.
 *   BTN·SB는 presets.ts의 검증된 레인지(BTN_OPEN·SB_OPEN)와 대조했다.
 * - 전제: 6맥스 캐시 100bb, 오픈 2.5bb, 앞 사람 전원 폴드(RFI). SB는 레이즈-온리
 *   (림프 혼합 전략은 교육용 1단계 범위에서 제외).
 *
 * 표기 규칙: 각 핸드는 정확히 한 티어에만 속한다. 티어 = 오픈 빈도 %.
 *   100 = 모든 출처가 오픈 (합의 코어)
 *   75/50/25 = 출처가 갈리는 경계 핸드 (다수결 가중 — 클수록 오픈 쪽 다수)
 */

export type Position = "UTG" | "HJ" | "CO" | "BTN" | "SB";

export const POSITIONS: Position[] = ["UTG", "HJ", "CO", "BTN", "SB"];

type TierMap = { [freq: number]: string };

// ─── 합의 레인지 (교차 검증 결과) ────────────────────────────
// 검증 앵커(공개 자료 오픈 빈도): UTG 15~17.6% · HJ 19~22% · CO 26~28% ·
// BTN 42~45% · SB 44~46.6%(자체 SB_OPEN 실측). 아래 티어 합계가 이 창 안에
// 들어가는지 preflop-verify.js가 검사한다.
const RFI: Record<Position, TierMap> = {
  UTG: {
    100: "66+,ATs+,A5s,KTs+,QTs+,JTs,T9s,AJo+,ATo,KQo",
    75: "55,A9s,A4s,98s",
    50: "44-22,K9s,Q9s,J9s,87s,KJo",
    25: "A8s-A6s,A3s-A2s,76s,65s,54s,QJo",
  },
  HJ: {
    100: "22+,A8s+,A5s-A2s,K9s+,Q9s+,J9s+,T9s,98s,87s,ATo+,KJo+,QJo",
    75: "A7s-A6s,K8s,76s,KTo",
    50: "T8s,65s,54s,QTo",
    25: "K7s-K6s,Q8s,J8s,97s,JTo,A9o",
  },
  CO: {
    100: "22+,A2s+,K8s+,Q9s+,J9s+,T8s+,97s+,87s,76s,A9o+,KTo+,QTo+,JTo",
    75: "K7s-K6s,Q8s,J8s,T7s,86s,65s",
    50: "K5s,Q7s,75s,64s,54s,A8o",
    25: "K4s-K3s,Q6s,J7s,96s,85s,53s,K9o,T9o",
  },
  BTN: {
    100:
      "22+,A2s+,K5s+,Q6s+,J7s+,T7s+,97s+,86s+,75s+,64s+,54s," +
      "A2o+,K9o+,Q9o+,J9o+,T8o+,98o",
    75: "K4s-K2s,Q5s-Q4s,J6s,96s,85s,53s",
    50: "J5s,T6s,K8o,87o",
    25: "Q3s-Q2s,J4s,K7o,Q8o,J8o",
  },
  SB: {
    100:
      "22+,A2s+,K2s+,Q4s+,J6s+,T6s+,96s+,86s+,75s+,64s+,54s," +
      "A2o+,K8o+,Q9o+,J9o+,T9o,98o",
    75: "85s",
    50: "53s,87o,K7o,Q8o,J8o,T8o",
    25: "43s",
  },
};

// ─── 레인지 문자열 → 169핸드 빈도 ────────────────────────────

const RANKS = "23456789TJQKA"; // 인덱스 0=2 … 12=A (utils.ts의 ranks와 동일 순서)

const rankIndex = (ch: string) => RANKS.indexOf(ch);

/** "AKs" 같은 핸드 라벨 → 169칸 격자 인덱스 (RangeEditor와 같은 관례: (0,0)=AA, 우상단 s / 좌하단 o) */
const gridIndexOf = (hi: number, lo: number, suited: boolean) => {
  // 행·열은 A가 0. 수트는 행<열(우상단), 오프수트는 행>열(좌하단)
  const rowRank = suited ? hi : lo;
  const colRank = suited ? lo : hi;
  return (12 - rowRank) * 13 + (12 - colRank);
};

/** 한 클래스 표기("66+", "K8s-K5s", "AJo+", "54s")를 [hi, lo, suited][] 목록으로 */
const expandClass = (cls: string): [number, number, boolean][] => {
  const out: [number, number, boolean][] = [];
  const m = cls.match(/^([2-9TJQKA])([2-9TJQKA])([so]?)(\+?)$/);
  const range = cls.match(/^([2-9TJQKA])([2-9TJQKA])([so]?)-([2-9TJQKA])([2-9TJQKA])([so]?)$/);
  if (range) {
    const hi = rankIndex(range[1]);
    const from = rankIndex(range[2]);
    const to = rankIndex(range[5]);
    const suited = range[3] === "s";
    if (rankIndex(range[4]) !== hi) {
      // 페어 구간 "44-22"
      for (let r = Math.min(hi, rankIndex(range[4])); r <= Math.max(hi, rankIndex(range[4])); r++)
        out.push([r, r, false]);
      return out;
    }
    for (let lo = Math.min(from, to); lo <= Math.max(from, to); lo++)
      out.push([hi, lo, suited]);
    return out;
  }
  if (!m) throw new Error(`레인지 표기 해석 불가: ${cls}`);
  const hi = rankIndex(m[1]);
  const lo = rankIndex(m[2]);
  const suited = m[3] === "s";
  if (hi === lo) {
    // 페어 ("66", "66+")
    const top = m[4] ? 12 : hi;
    for (let r = hi; r <= top; r++) out.push([r, r, false]);
    return out;
  }
  if (m[4]) {
    // "A9s+" = 킥커를 hi 바로 아래까지 올림
    for (let k = lo; k < hi; k++) out.push([hi, k, suited]);
    return out;
  }
  out.push([hi, lo, suited]);
  return out;
};

const gridCache = new Map<Position, number[]>();

/** 포지션의 169칸 오픈 빈도(0~100). 인덱스 관례는 RangeEditor와 동일 */
export const gridFor = (position: Position): number[] => {
  const cached = gridCache.get(position);
  if (cached) return cached;
  const grid = Array.from({ length: 169 }, () => 0);
  for (const [freqKey, text] of Object.entries(RFI[position])) {
    const freq = Number(freqKey);
    for (const cls of text.split(",")) {
      for (const [hi, lo, suited] of expandClass(cls.trim())) {
        grid[gridIndexOf(hi, lo, suited)] = freq;
      }
    }
  }
  gridCache.set(position, grid);
  return grid;
};

/** 격자 인덱스 → "AKs" 라벨 */
export const handLabelAt = (index: number): string => {
  const row = Math.floor(index / 13);
  const col = index % 13;
  const r1 = RANKS[12 - Math.min(row, col)];
  const r2 = RANKS[12 - Math.max(row, col)];
  return r1 + r2 + (row === col ? "" : row < col ? "s" : "o");
};

const combosAt = (index: number): number => {
  const row = Math.floor(index / 13);
  const col = index % 13;
  return row === col ? 6 : row < col ? 4 : 12;
};

export type PositionStats = {
  /** 전체 1326콤보 대비 오픈 % (혼합 빈도 가중) */
  percent: number;
  /** 가중 오픈 콤보 수 */
  combos: number;
  /** 조금이라도 오픈하는 핸드 종류 수 (169 중) */
  hands: number;
  /** 혼합 빈도(100% 미만) 핸드 종류 수 */
  mixedHands: number;
};

export const statsFor = (position: Position): PositionStats => {
  const grid = gridFor(position);
  let combos = 0;
  let hands = 0;
  let mixedHands = 0;
  grid.forEach((freq, i) => {
    if (freq <= 0) return;
    combos += (combosAt(i) * freq) / 100;
    hands += 1;
    if (freq < 100) mixedHands += 1;
  });
  return {
    percent: (combos / 1326) * 100,
    combos,
    hands,
    mixedHands,
  };
};

/**
 * 솔버(레인지 입력)에 붙여넣을 수 있는 가중 레인지 문자열.
 * 혼합 핸드는 "K8s:0.75"처럼 가중치를 붙인다 (wasm-postflop 표기).
 */
export const rangeTextFor = (position: Position): string => {
  const tiers = RFI[position];
  const parts: string[] = [];
  for (const freq of [100, 75, 50, 25]) {
    const text = tiers[freq];
    if (!text) continue;
    if (freq === 100) parts.push(text);
    else
      parts.push(
        text
          .split(",")
          .map((cls) => `${cls.trim()}:${freq / 100}`)
          .join(",")
      );
  }
  return parts.join(",");
};

/** 검증 스크립트용 훅 — preflop-verify.js가 데이터 무결성을 검사할 때 쓴다 */
declare global {
  interface Window {
    __preflop?: {
      positions: Position[];
      gridFor: typeof gridFor;
      statsFor: typeof statsFor;
      rangeTextFor: typeof rangeTextFor;
      handLabelAt: typeof handLabelAt;
    };
  }
}
if (typeof window !== "undefined") {
  window.__preflop = { positions: POSITIONS, gridFor, statsFor, rangeTextFor, handLabelAt };
}
