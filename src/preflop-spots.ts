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
  gridFor,
  defendGridsFor,
  vs3betGridsFor,
  vs4betGridsFor,
  VS3BET_SCENARIOS,
  VS4BET_SCENARIOS,
  handLabelAt,
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
  /** 3벳 팟이면 3벳한 자리 */
  caller: Caller | ThreeBettor;
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

// ─── 핸드 복기 전용: 3벳 팟 (2026-10-05 · 10-09 11조합으로 일반화) ─────────
// 오픈 → 3벳 → 오픈한 쪽 콜. 차트에 «vs 3벳» 응답이 있는 11조합(VS3BET_SCENARIOS)만 싣는다.
// 레인지는 차트에서 곱해 만든다: 3벳 쪽 = 3벳 빈도 · 오픈한 쪽 = 오픈 빈도 × «3벳에 콜» 빈도.
// 3벳 크기(판정 참고자료/3벳팟_단계2_판정_2026-10-09.md §2): BB 11bb(SB 오픈 상대는 9bb) · SB 10bb · CO·BTN 7.5bb.
// 사전 계산 도구(main.rs의 3bp-*)와 글자까지 같아야 한다 (검사: spot-picker-verify.js).
export type ThreeBettor = "CO" | "BTN" | "SB" | "BB";
export const THREE_BETTORS: ThreeBettor[] = ["CO", "BTN", "SB", "BB"];

/** 169칸 가중치(0~1) → "AKs,A5s:0.5" 꼴. 순서는 차트 격자 순 */
const weightedText = (weights: number[]): string =>
  weights
    .map((w, i) => [handLabelAt(i), +w.toFixed(4)] as const)
    .filter(([, w]) => w > 0)
    .map(([hand, w]) => (w === 1 ? hand : `${hand}:${w}`))
    .join(",");

/** 오픈·3벳 자리 조합의 3벳 팟. 차트에 vs 3벳 응답이 없는 조합은 null */
export const threeBetSpot = (opener: Position, threeBettor: ThreeBettor): SrpSpot | null => {
  const scenario = VS3BET_SCENARIOS.find((s) => s.opener === opener && s.villain === threeBettor);
  if (!scenario) return null;

  const threeBet =
    threeBettor === "BB" ? (opener === "SB" ? 90 : 110) : threeBettor === "SB" ? 100 : 75;
  // 죽은 블라인드: 3벳이 BB면 SB 0.5bb(오픈이 SB면 없음) · SB면 BB 1bb · 뒤 포지션이면 SB+BB 1.5bb
  const dead = threeBettor === "BB" ? (opener === "SB" ? 0 : 5) : threeBettor === "SB" ? 10 : 15;
  const rfi = gridFor(opener);
  const call = vs3betGridsFor(scenario.id).call;
  const raise = defendGridsFor(`${threeBettor}-vs-${opener}`.toLowerCase() as ScenarioId).threeBet;
  const openerRange = weightedText(call.map((c, i) => (rfi[i] * c) / 10000));
  const threeBetRange = weightedText(raise.map((v) => v / 100));
  const openerIsOop = FLOP_ORDER.indexOf(opener) < FLOP_ORDER.indexOf(threeBettor);

  return {
    id: `3bp-${opener}-${threeBettor}`.toLowerCase(),
    opener,
    caller: threeBettor,
    oop: openerIsOop ? opener : threeBettor,
    ip: openerIsOop ? threeBettor : opener,
    oopRange: openerIsOop ? openerRange : threeBetRange,
    ipRange: openerIsOop ? threeBetRange : openerRange,
    startingPot: threeBet * 2 + dead,
    effectiveStack: 1000 - threeBet,
  };
};

/** 3벳 팟 11개 — 차트의 vs 3벳 탭 순서 */
export const THREE_BET_SPOTS: SrpSpot[] = VS3BET_SCENARIOS.map(
  (s) => threeBetSpot(s.opener, s.villain as ThreeBettor) as SrpSpot
);

// ─── 핸드 복기 전용: 4벳 팟 (2026-10-11) ─────────────────────────────
// 오픈 → 3벳 → 오픈한 쪽 4벳 → 3벳한 쪽 콜. 차트에 «vs 4벳» 응답이 있는 11조합(VS4BET_SCENARIOS)만 싣는다.
// 레인지: 4벳 쪽 = 오픈 빈도 × «3벳에 4벳» 빈도 · 3벳 쪽 = 3벳 빈도 × «4벳에 콜» 빈도.
// 4벳 크기(판정 참고자료/4벳림프팟_판정_2026-10-10.md §2): BB 3벳 상대 24bb(SB 오픈이면 22bb) · SB 3벳 상대 22bb · CO·BTN 3벳 상대 19bb.
// 사전 계산 도구(main.rs의 4bp-*)와 글자까지 같아야 한다 (검사: spot-picker-verify.js).
export const fourBetSpot = (opener: Position, threeBettor: ThreeBettor): SrpSpot | null => {
  const scenario = VS4BET_SCENARIOS.find((s) => s.villain === opener && s.hero === threeBettor);
  if (!scenario) return null;

  const fourBet =
    threeBettor === "BB" ? (opener === "SB" ? 220 : 240) : threeBettor === "SB" ? 220 : 190;
  // 죽은 블라인드는 3벳 팟과 같다
  const dead = threeBettor === "BB" ? (opener === "SB" ? 0 : 5) : threeBettor === "SB" ? 10 : 15;
  const rfi = gridFor(opener);
  const raise = vs3betGridsFor(scenario.vs3bet).fourBet;
  const threeBet = defendGridsFor(scenario.base).threeBet;
  const call = vs4betGridsFor(scenario.id).call;
  const openerRange = weightedText(raise.map((r, i) => (rfi[i] * r) / 10000));
  const threeBettorRange = weightedText(call.map((c, i) => (threeBet[i] * c) / 10000));
  const openerIsOop = FLOP_ORDER.indexOf(opener) < FLOP_ORDER.indexOf(threeBettor);

  return {
    id: `4bp-${opener}-${threeBettor}`.toLowerCase(),
    opener,
    caller: threeBettor,
    oop: openerIsOop ? opener : threeBettor,
    ip: openerIsOop ? threeBettor : opener,
    oopRange: openerIsOop ? openerRange : threeBettorRange,
    ipRange: openerIsOop ? threeBettorRange : openerRange,
    startingPot: fourBet * 2 + dead,
    effectiveStack: 1000 - fourBet,
  };
};

/** 4벳 팟 11개 — 차트의 vs 4벳 탭 순서 */
export const FOUR_BET_SPOTS: SrpSpot[] = VS4BET_SCENARIOS.map(
  (s) => fourBetSpot(s.villain as Position, s.hero as ThreeBettor) as SrpSpot
);

// ─── 림프 팟 HRC 판 (2026-11-11 · 사장님 11-10 «하자» · main.rs limp-sb-bb-hrc · 참고자료/hrc-200bb/레인지/100bb_limp_limp.json) ───
// 출시 스위치 — 서버 계산 → R2 업로드(v1/limp-sb-bb-hrc · flop-reports/limp-sb-bb-hrc.json) → Worker 배포 뒤에 켠다.
// 켜면 상황 id는 그대로(«limp-sb-bb» · 지난 기록·회원 판정·부류가 안 바뀐다) 레인지만 HRC 값으로, 자료는 limpDataId()의 폴더에서 받는다.
// 끄면 지금 라이브 그대로(실전형 근사 레인지 + «근사 레인지» 안내 줄).
export const LIMP_HRC_LAUNCHED = false;
/** localhost 검사용: localStorage `solver.limpHrc.test` = "1"이면 꺼져 있어도 켠다. */
const LIMP_HRC_TEST_KEY = "solver.limpHrc.test";
export const limpHrcEnabled = (): boolean => {
  if (LIMP_HRC_LAUNCHED) return true;
  try {
    return ["localhost", "127.0.0.1"].includes(location.hostname) && localStorage.getItem(LIMP_HRC_TEST_KEY) === "1";
  } catch {
    return false;
  }
};
/** 사전 계산 도구(main.rs limp-sb-bb-hrc)의 문자열 그대로 — SB = HRC 림프 비율 · BB = 림프 받고 체크 비율(1% 미만 버림). */
export const LIMP_HRC_RANGES = {
  oopRange:
    "AA:0.47,KK:0.41,QQ:0.15,JJ:0.38,TT:0.28,99:0.3,88:0.18,77:0.77,66:0.42,55:0.23,44:0.99,33:0.61,22:0.23,AKs:0.7,ATs:0.1,A8s:0.36,A7s:0.08,A6s:0.88,A5s:0.27,A4s:0.35,A3s:0.26,A2s:0.98,KQs:0.05,K9s:0.5,K8s:0.58,K7s:0.63,K6s:0.97,K5s:0.38,K4s:0.7,K3s:0.64,K2s:0.43,Q9s:0.73,Q8s:0.85,Q7s:0.67,Q6s:0.35,Q5s:0.7,Q4s:0.14,Q3s:0.71,JTs:0.1,J9s:0.6,J8s:0.72,J7s:0.18,J6s:0.18,J5s:0.59,J3s:0.1,J2s:0.91,T9s:0.62,T8s:0.93,T7s:0.17,T6s:0.02,T5s:0.13,T4s:0.88,T3s:0.97,T2s:0.97,98s,97s:0.81,96s:0.09,95s:0.37,94s:0.99,93s,92s:0.28,87s:0.97,86s:0.19,85s:0.05,84s:0.97,83s:0.06,76s:0.61,75s:0.52,73s:0.14,65s:0.5,63s:0.62,54s:0.54,52s:0.98,43s:0.01,42s:0.34,AKo:0.06,AQo:0.7,AJo:0.83,ATo:0.49,A9o:0.2,A8o:0.47,A7o:0.22,A6o:0.04,A5o:0.59,A4o:0.09,A3o:0.91,A2o,KQo:0.38,KJo:0.43,KTo:0.78,K9o:0.11,K8o:0.06,K7o:0.53,K6o:0.82,K5o,K4o,K3o:0.61,K2o:0.04,QJo:0.42,QTo:0.64,Q9o:0.01,Q8o:0.61,Q7o,Q6o,Q5o:0.87,Q4o:0.01,JTo:0.66,J9o:0.36,J8o:0.93,J7o,T9o:0.52,T8o:0.38,T7o,T6o:0.02,98o:0.1,97o,96o:0.03,87o:0.74,86o:0.59,76o:0.58,65o,54o:0.07",
  ipRange:
    "44:0.02,22:0.44,A8s:0.03,A7s:0.39,A6s:0.76,A4s:0.07,A3s:0.02,K9s:0.06,K8s:0.02,K7s:0.44,K6s:0.78,K5s:0.1,K3s:0.54,K2s:0.67,Q8s:0.22,Q7s:0.76,Q6s:0.96,Q5s:0.79,Q4s:0.84,Q3s,Q2s:0.88,J8s:0.02,J7s:0.55,J6s:0.99,J5s,J4s,J3s,J2s,T8s:0.03,T7s:0.12,T6s:0.98,T5s:0.99,T4s:0.99,T3s:0.91,T2s,97s:0.07,96s:0.07,95s:0.18,94s,93s:0.76,92s:0.99,86s:0.01,85s:0.09,84s:0.53,83s:0.56,82s,73s:0.82,72s,65s:0.01,63s:0.07,62s,53s:0.01,52s:0.1,43s:0.04,42s:0.98,32s:0.91,ATo:0.12,A9o:0.27,A8o:0.92,A7o,A6o:0.99,A5o:0.53,A4o,A3o,A2o:0.73,KQo:0.18,KJo:0.48,KTo:0.72,K9o,K8o:0.98,K7o,K6o:0.97,K5o,K4o:0.62,K3o:0.33,K2o:0.58,QJo:0.96,QTo:0.81,Q9o:0.85,Q8o:0.99,Q7o:0.98,Q6o:0.27,Q5o:0.4,Q4o:0.74,Q3o:0.35,Q2o:0.18,JTo:0.3,J9o:0.99,J8o:0.83,J7o:0.5,J6o:0.09,J5o:0.75,J4o:0.89,J3o:0.6,J2o:0.58,T9o,T8o:0.78,T7o:0.93,T6o:0.17,T5o:0.8,T4o:0.58,T3o:0.68,T2o:0.96,98o:0.97,97o:0.66,96o:0.78,95o:0.38,94o:0.59,93o:0.9,92o:0.98,87o:0.98,86o:0.95,85o:0.52,84o:0.86,83o:0.97,82o:0.36,76o,75o:0.34,74o:0.54,73o:0.49,72o:0.92,65o:0.97,64o,63o:0.98,62o,54o:0.98,53o:0.97,52o:0.99,43o:0.45,42o:0.99,32o",
} as const;
/** 자료 폴더 id — HRC 판이 켜졌으면 림프 상황은 limp-sb-bb-hrc 폴더(파일 머리 scenario도 같다). 나머지는 상황 id 그대로. */
export const limpDataId = (id: string): string => (id === "limp-sb-bb" && limpHrcEnabled() ? "limp-sb-bb-hrc" : id);

// ─── 핸드 복기 전용: SB 림프 팟 (2026-10-18 · 판정 참고자료/4벳림프팟_판정_2026-10-10.md §8) ───
// SB 림프 → BB 체크. GTO 차트(SB 레이즈-온리) 밖의 «실전형 근사 레인지»라 차트에서 만들지 않는다 —
// 사전 계산 도구(main.rs의 limp-sb-bb)의 문자열을 그대로 옮겼다(검사: spot-picker-verify.js가 글자 대조).
// 플랍 벳은 이 상황만 50%·100%(main.rs LIMP_FLOP_BET) — 화면은 결과 파일 머리의 flopBet을 쓴다.
export const LIMP_SPOTS: SrpSpot[] = [
  {
    id: "limp-sb-bb",
    opener: "SB",
    caller: "BB",
    oop: "SB",
    ip: "BB",
    oopRange: limpHrcEnabled()
      ? LIMP_HRC_RANGES.oopRange
      : "AA:0.25,AQo:0.5,AJs:0.5,AJo,ATs,ATo,A9s,A9o,A8s,A8o,A7s,A7o,A6s,A6o,A5s,A5o,A4s,A4o,A3s,A3o,A2s,A2o,KK:0.25,KQs,KQo,KJs,KJo,KTs,KTo,K9s,K9o,K8s,K8o,K7s,K7o:0.5,K6s,K6o:0.5,K5s,K5o:0.5,K4s,K4o:0.5,K3s,K3o:0.5,K2s,K2o:0.5,QJs,QJo,QTs,QTo,Q9s,Q9o,Q8s,Q8o:0.5,Q7s,Q7o:0.5,Q6s,Q6o:0.5,Q5s,Q5o:0.5,Q4s,Q4o:0.5,Q3s:0.5,Q3o:0.5,Q2s:0.5,JTs,JTo,J9s,J9o,J8s,J8o:0.5,J7s,J7o:0.5,J6s,J6o:0.5,J5s:0.5,J5o:0.5,J4s:0.5,J3s:0.5,J2s:0.5,TT:0.5,T9s,T9o,T8s,T8o,T7s,T7o:0.5,T6s,T6o:0.5,T5s:0.5,T5o:0.5,T4s:0.5,T3s:0.5,T2s:0.5,99,98s,98o,97s,97o:0.5,96s,96o:0.5,95s:0.5,94s:0.5,93s:0.5,92s:0.5,88,87s,87o:0.5,86s,86o:0.5,85s:0.75,85o:0.5,84s:0.5,83s:0.5,82s:0.5,77,76s,76o:0.5,75s,75o:0.5,74s:0.5,74o:0.5,73s:0.5,72s:0.5,66,65s,65o:0.5,64s,64o:0.5,63s:0.5,62s:0.5,55,54s,54o:0.5,53s:0.75,53o:0.5,52s:0.5,44,43s:0.5,42s:0.5,33,32s:0.5,22",
    ipRange: limpHrcEnabled()
      ? LIMP_HRC_RANGES.ipRange
      : "AJo:0.5,ATs:0.5,ATo,A9s,A9o,A8s,A8o,A7s,A7o,A6s,A6o,A5s,A5o,A4s,A4o,A3s,A3o,A2s,A2o,KQo:0.5,KJs:0.5,KJo,KTs,KTo,K9s,K9o,K8s,K7s,K6s,K5s:0.5,K4s:0.5,K3s:0.5,K2s:0.5,QJs,QJo,QTs,QTo,Q9s,Q9o,Q8s,Q7s,Q6s,Q5s:0.5,Q4s:0.5,Q3s:0.5,Q2s:0.5,JTs,JTo,J9s,J9o,J8s,J7s,J6s,J5s:0.5,J4s:0.5,J3s:0.5,J2s:0.5,T9s,T9o,T8s,T8o,T7s,T6s,T5s:0.5,T4s:0.5,T3s:0.5,T2s:0.5,98s,98o,97s,97o,96s,96o,95s:0.5,95o:0.5,94s:0.5,94o:0.5,93s:0.5,93o:0.5,92s:0.5,92o:0.5,88:0.5,87s,87o,86s,86o,85s,85o,84s:0.5,84o,83s:0.5,83o,82s:0.5,82o,77:0.5,76s,76o,75s,75o,74s,74o,73s:0.5,73o,72s:0.5,72o,66:0.5,65s,65o,64s,64o,63s,63o,62s:0.5,62o,55,54s,54o,53s,53o,52s:0.5,52o,44,43s,43o,42s:0.5,42o,33,32s:0.5,32o,22",
    startingPot: 20,
    effectiveStack: 990,
  },
];

/** 그 상황의 미리 계산 플랍 벳 크기 — 림프 팟만 50·100 (결과 파일을 아직 못 받았을 때 화면 안내·[솔버로 열기]에 쓴다) */
export const flopBetFor = (id: string): string =>
  id.startsWith("limp-") ? "50,100" : SPOT_BET_SIZES.flopBet;

/** 상황 id → 화면의 팟 종류 (복기·플랍 조회·플랍 통계가 같이 쓴다) */
export type PotKind = "srp" | "3bet" | "4bet" | "limp";
export const potKindOf = (id: string): PotKind =>
  id.startsWith("limp-") ? "limp" : id.startsWith("4bp-") ? "4bet" : id.startsWith("3bp-") ? "3bet" : "srp";

/** 검증 스크립트용 훅 — spot-picker-verify.js가 사전 계산 도구의 표와 대조한다 */
declare global {
  interface Window {
    __spots?: SrpSpot[];
    __threeBetSpots?: SrpSpot[];
    __fourBetSpots?: SrpSpot[];
    __limpSpots?: SrpSpot[];
  }
}
if (typeof window !== "undefined") {
  window.__spots = SRP_SPOTS;
  window.__threeBetSpots = THREE_BET_SPOTS;
  window.__fourBetSpots = FOUR_BET_SPOTS;
  window.__limpSpots = LIMP_SPOTS;
}
