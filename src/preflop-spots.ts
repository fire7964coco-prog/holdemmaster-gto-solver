/*
 * 자리 조합 → 양쪽 레인지·팟·스택 — «자리만 고르면 레인지 채움» (2026-10-01)
 *
 * 솔버의 레인지 화면(SpotPicker.vue)과 핸드 복기 화면이 같이 쓰는 표다.
 * - 레인지를 여기에 따로 적지 않는다. 프리플랍 차트(preflop-charts.ts)의 문자열을 그대로 쓴다 —
 *   복기용 사전 계산 도구(precompute3 main.rs의 SCENARIOS)도 같은 문자열로 풀었다.
 *   BB 수비 5개(srp-*-bb)는 id·레인지·팟·스택이 그 표와 글자까지 같아야 한다
 *   (검사: 도구/e2e/spot-picker-verify.js).
 * - 전제는 차트와 같다: 6맥스 캐시 100bb · 오픈 2.5bb(SB는 3bb) · 한 명 콜 · 나머지 폴드.
 * - 칩 10 = 1bb (교육 예제·사전 계산과 같은 단위).
 */

import {
  Position,
  POSITIONS,
  ScenarioId,
  rangeTextFor,
  defendRangeTextFor,
} from "./preflop-charts";

export type Seat = Position | "BB";
export type Caller = "CO" | "BTN" | "BB";

export const OPENERS: Position[] = POSITIONS;
export const CALLERS: Caller[] = ["CO", "BTN", "BB"];

/** 화면 환산 단위 — 엔진 10칩을 1bb로 표시 */
export const SPOT_UNIT_SCALE = 10;

/** 벳 사이즈 기본값 — 교육 예제·사전 계산과 같다 (플랍 2종 · 턴/리버 1종 · 레이즈 1종) */
export const SPOT_BET_SIZES = { flopBet: "33,75", laterBet: "60", raise: "60" } as const;

// 차트에 «콜 레인지»가 있는 조합만 싣는다 (SB의 BTN 상대 수비는 3벳 아니면 폴드라 없다)
const CALL_SCENARIO: Record<Position, Partial<Record<Caller, ScenarioId>>> = {
  UTG: { CO: "co-vs-utg", BTN: "btn-vs-utg", BB: "bb-vs-utg" },
  HJ: { CO: "co-vs-hj", BTN: "btn-vs-hj", BB: "bb-vs-hj" },
  CO: { BTN: "btn-vs-co", BB: "bb-vs-co" },
  BTN: { BB: "bb-vs-btn" },
  SB: { BB: "bb-vs-sb" },
};

// 플랍에서 먼저 행동하는 순서 — 앞쪽이 OOP
const FLOP_ORDER: Seat[] = ["SB", "BB", "UTG", "HJ", "CO", "BTN"];

export type SrpSpot = {
  /** "srp-btn-bb" — BB 수비 5개는 사전 계산 결과 파일의 상황 id와 같다 */
  id: string;
  opener: Position;
  caller: Caller;
  oop: Seat;
  ip: Seat;
  oopRange: string;
  ipRange: string;
  /** 칩 (10 = 1bb) */
  startingPot: number;
  effectiveStack: number;
};

export const callersFor = (opener: Position): Caller[] =>
  CALLERS.filter((caller) => CALL_SCENARIO[opener][caller] !== undefined);

/** 오픈·콜 자리 조합의 스팟. 차트에 콜 레인지가 없는 조합은 null */
export const srpSpot = (opener: Position, caller: Caller): SrpSpot | null => {
  const scenario = CALL_SCENARIO[opener][caller];
  if (!scenario) return null;

  const open = opener === "SB" ? 30 : 25;
  // 죽은 블라인드: 콜한 쪽이 BB면 SB 0.5bb(오픈이 SB면 없음), 아니면 SB 0.5bb + BB 1bb
  const dead = caller === "BB" ? (opener === "SB" ? 0 : 5) : 15;
  const openerRange = rangeTextFor(opener);
  const callerRange = defendRangeTextFor(scenario, "call");
  const openerIsOop = FLOP_ORDER.indexOf(opener) < FLOP_ORDER.indexOf(caller);

  return {
    id: `srp-${opener}-${caller}`.toLowerCase(),
    opener,
    caller,
    oop: openerIsOop ? opener : caller,
    ip: openerIsOop ? caller : opener,
    oopRange: openerIsOop ? openerRange : callerRange,
    ipRange: openerIsOop ? callerRange : openerRange,
    startingPot: open * 2 + dead,
    effectiveStack: 1000 - open,
  };
};

/** 차트로 채울 수 있는 스팟 전부 (10개) */
export const SRP_SPOTS: SrpSpot[] = OPENERS.flatMap((opener) =>
  callersFor(opener).map((caller) => srpSpot(opener, caller) as SrpSpot)
);

/** 검증 스크립트용 훅 — spot-picker-verify.js가 사전 계산 도구의 표와 대조한다 */
declare global {
  interface Window {
    __spots?: SrpSpot[];
  }
}
if (typeof window !== "undefined") {
  window.__spots = SRP_SPOTS;
}
