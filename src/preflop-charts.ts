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
      "A2o+,K8o+,Q9o+,J9o+,T9o-T8o,98o",
    75: "85s,53s",
    50: "Q3s-Q2s,J5s,87o,K7o,Q8o,J8o",
    25: "J4s,43s",
  },
};

// ─── 2단계: vs 오픈 (수비) — 자주 나오는 5개 조합 ─────────────
// 방식은 1단계와 동일(공개 자료 교차 → 합의 코어 + 혼합 티어).
// 각 핸드는 3벳·콜 티어에 따로 실리며, 두 빈도 합이 100을 넘으면 검증이 잡는다.
// 앵커·출처·대조 결과는 참고자료/프리플랍차트_출처검증.md 2단계 절 참조.

export type ScenarioId =
  | "bb-vs-utg"
  | "bb-vs-hj"
  | "bb-vs-co"
  | "bb-vs-btn"
  | "bb-vs-sb"
  | "btn-vs-utg"
  | "btn-vs-hj"
  | "btn-vs-co"
  | "co-vs-utg"
  | "co-vs-hj"
  | "sb-vs-btn"
  | "sq-bb-co-btn"
  | "sq-sb-co-btn";

export type Scenario = {
  id: ScenarioId;
  /** 내 포지션 */
  hero: string;
  /** 오픈한 상대 */
  villain: string;
};

export const SCENARIOS: Scenario[] = [
  { id: "bb-vs-utg", hero: "BB", villain: "UTG" },
  { id: "bb-vs-hj", hero: "BB", villain: "HJ" },
  { id: "bb-vs-co", hero: "BB", villain: "CO" },
  { id: "bb-vs-btn", hero: "BB", villain: "BTN" },
  { id: "bb-vs-sb", hero: "BB", villain: "SB" },
  { id: "btn-vs-utg", hero: "BTN", villain: "UTG" },
  { id: "btn-vs-hj", hero: "BTN", villain: "HJ" },
  { id: "btn-vs-co", hero: "BTN", villain: "CO" },
  { id: "co-vs-utg", hero: "CO", villain: "UTG" },
  { id: "co-vs-hj", hero: "CO", villain: "HJ" },
  { id: "sb-vs-btn", hero: "SB", villain: "BTN" },
  // 스퀴즈 (확장 ③) — 오픈 + 콜러가 있는 상태에서의 3벳. 구조(3벳/콜/폴드)가
  // 같아 수비 모드에 함께 싣는다. villain 표기 "CO+BTN" = CO 오픈 + BTN 콜
  { id: "sq-bb-co-btn", hero: "BB", villain: "CO+BTN" },
  { id: "sq-sb-co-btn", hero: "SB", villain: "CO+BTN" },
];

type DefendTiers = { threeBet: TierMap; call: TierMap };

const VS_OPEN: Record<ScenarioId, DefendTiers> = {
  // BB가 UTG 2.5bb 오픈을 수비 — 가장 타이트한 수비. 3벳 밸류는 QQ+/AK 중심
  "bb-vs-utg": {
    threeBet: {
      100: "QQ+,AKs,AKo",
      75: "JJ,AQs",
      50: "TT,AQo,A5s-A4s",
      25: "99,AJs,KQs,76s,65s",
    },
    call: {
      100: "88-22,ATs,A9s-A6s,KTs-K8s,KJs,QJs-QTs,JTs,T9s,98s,87s,AJo,KQo",
      75: "99,AJs,KQs,76s,65s,Q9s,J9s,T8s,54s,ATo,KJo,QJo",
      50: "TT,AQo,A5s-A4s,A3s-A2s,K7s-K6s,Q8s,J8s,97s,86s,75s,64s,KTo,QTo,JTo",
      25: "JJ,AQs,K5s,T7s,96s,85s,53s,A9o-A8o,T9o",
    },
  },
  // BB가 HJ 2.5bb 오픈을 수비 — UTG보다 넓고 CO보다 좁다
  "bb-vs-hj": {
    threeBet: {
      100: "JJ+,AQs+,AKo",
      75: "TT,AQo",
      50: "99,AJs,A5s-A4s,KQs",
      25: "ATs,A3s-A2s,KJs,76s,65s",
    },
    call: {
      100:
        "88-22,A9s-A6s,KTs,K9s-K6s,QJs-Q9s,JTs-J9s,T9s-T8s,98s,87s,54s," +
        "AJo-ATo,KQo-KJo,QJo",
      75: "ATs,A3s-A2s,KJs,76s,65s",
      50:
        "99,AJs,KQs,A5s-A4s,K5s-K3s,Q8s-Q6s,J8s-J6s,T7s-T6s,97s,86s,75s," +
        "64s,53s,KTo,QTo,JTo,A9o",
      25: "TT,AQo,K2s,Q5s-Q4s,J5s,96s,85s,74s,43s,A8o,K9o,Q9o,J9o,T9o",
    },
  },
  // BB가 BTN 2.5bb 오픈을 수비 — 3벳은 폴라(프리미엄 + 휠 에이스·수딧 커넥터 블러프).
  // 혼합 핸드는 콜 티어가 3벳의 나머지(100−3벳)를 채워 «수비는 전량» 원칙을 지킨다
  "bb-vs-btn": {
    threeBet: {
      100: "TT+,AQs+,AKo",
      75: "AQo,AJs",
      50: "99,ATs,A5s-A4s,T8s,97s,86s",
      25: "88-77,A3s-A2s,KQs,KJs,QJs,JTs,76s,65s,AJo,KQo",
    },
    call: {
      100:
        "66-22,A9s-A6s,KTs-K2s,QTs-Q2s,J9s-J4s,T9s,T7s-T6s,98s,96s,87s,85s," +
        "75s,64s,54s,ATo-A2o,KJo-K9o,QJo-Q9o,JTo-J9o,T9o-T8o,98o",
      75: "88-77,A3s-A2s,KQs,KJs,QJs,JTs,76s,65s,AJo,KQo,53s",
      50: "99,ATs,A5s-A4s,T8s,97s,86s,J3s-J2s,T5s-T4s,95s,74s,43s,K8o,Q8o,J8o,87o",
      25: "AQo,AJs",
    },
  },
  // BB가 CO 2.5bb 오픈을 수비 — BTN 오픈보다 전반적으로 타이트
  "bb-vs-co": {
    threeBet: {
      100: "JJ+,AQs+,AKo",
      75: "TT,AQo",
      50: "99,AJs,A5s-A4s,KQs",
      25: "ATs,A3s-A2s,KJs,76s,65s",
    },
    call: {
      100:
        "88-22,A9s-A6s,KTs,K9s-K5s,QJs-Q8s,JTs-J8s,T9s-T8s,98s,87s,54s," +
        "AJo-ATo,KQo-KTo,QJo-QTo,JTo",
      75: "ATs,A3s-A2s,KJs,76s,65s",
      50:
        "99,AJs,KQs,A5s-A4s,K4s-K2s,Q7s-Q4s,J7s-J5s,T7s-T6s,97s,86s,75s," +
        "64s,53s,A9o-A8o,K9o,Q9o,J9o,T9o",
      25: "TT,AQo,96s,85s,74s,43s,A7o-A5o,T8o,98o,87o",
    },
  },
  // BB가 SB 3bb 오픈을 수비 — 포지션이 있어 넓게 콜, 3벳은 머지드(밸류 중심)
  "bb-vs-sb": {
    threeBet: {
      100: "TT+,AQs+,AJs,AQo+,KQs",
      75: "99,ATs,KJs,AJo",
      50: "88-77,A9s,KTs,QTs,QJs,JTs,T9s,98s,ATo,KJo,KQo",
      25: "66,A8s,K9s,QJo",
    },
    call: {
      100:
        "55-22,A7s-A2s,K8s-K2s,Q9s-Q2s,J9s-J5s,T8s-T6s,97s-95s,87s-85s," +
        "76s-74s,65s-64s,54s-53s,43s,A9o-A2o,KTo-K8o,QTo-Q8o,JTo-J7o,T9o-T7o,98o-97o,87o,76o",
      75: "66,A8s,K9s,QJo",
      50: "88-77,A9s,KTs,QTs,QJs,JTs,T9s,98s,ATo,KJo,KQo,J4s-J2s,T5s-T4s,84s,63s",
      25: "99,ATs,KJs,AJo",
    },
  },
  // BTN이 UTG 오픈을 만남 (확장 ②) — 가장 강한 오픈 상대. 3벳 밸류는 QQ+/AK 코어,
  // 콜은 셋마인 페어 + 최상위 수딧. IP 수비 사슬(vs UTG ⊆ vs HJ ⊆ vs CO)의 바닥
  "btn-vs-utg": {
    threeBet: {
      100: "QQ+,AKs,AKo",
      75: "JJ,AQs",
      50: "A5s-A4s",
      25: "TT,AQo,KQs,65s",
    },
    call: {
      100: "99-44,AJs-ATs,JTs",
      75: "TT,33-22,KQs,T9s",
      50: "KJs,QJs,98s",
      25: "JJ,AQs,AQo,KTs,QTs,87s,76s",
    },
  },
  // BTN이 HJ 오픈을 만남 (확장 ②) — vs UTG보다 넓고 vs CO보다 좁다
  "btn-vs-hj": {
    threeBet: {
      100: "JJ+,AQs+,AKo",
      75: "TT",
      50: "AQo,A5s-A4s",
      25: "AJs,KQs,A3s-A2s,65s",
    },
    call: {
      100: "99-22,ATs,JTs,T9s",
      75: "AJs,KQs,KJs,QJs,98s",
      50: "KTs,QTs,87s",
      25: "TT,AQo,AJo,KQo,A9s,76s",
    },
  },
  // BTN이 CO 오픈을 만남 — 3벳 중심 + 포지션 프리미엄 콜 소량
  "btn-vs-co": {
    threeBet: {
      100: "JJ+,AQs+,AKo",
      75: "TT,AQo",
      50: "AJs,A5s-A4s",
      25: "KQs,A3s-A2s,76s,65s",
    },
    call: {
      100: "99-22,ATs,JTs,T9s",
      75: "KQs,KJs,QJs,98s",
      50: "AJs,A9s,KTs,QTs,KQo,87s",
      25: "TT,AQo,ATo,AJo,KJo,QJo,76s,65s",
    },
  },
  // CO가 UTG 오픈을 만남 (확장 ②) — 뒤에 3명이 남아 스퀴즈 위험까지 있어 가장 좁다.
  // 3벳-오어-폴드 성향 + 프리미엄 페어·수딧만 소량 콜. 같은 상대의 BTN 수비보다 좁다(사슬 검증)
  "co-vs-utg": {
    threeBet: {
      100: "QQ+,AKs,AKo",
      75: "JJ,AQs",
      50: "A5s-A4s",
      25: "TT,AQo,KQs",
    },
    call: {
      100: "99-77",
      75: "TT,ATs,AJs,JTs",
      50: "66-55,KQs",
      25: "JJ,44,AQs,QJs,KJs,T9s,98s",
    },
  },
  // CO가 HJ 오픈을 만남 (확장 ②) — vs UTG보다 넓지만 여전히 3벳 중심
  "co-vs-hj": {
    threeBet: {
      100: "JJ+,AQs+,AKo",
      75: "TT",
      50: "AQo,A5s-A4s",
      25: "KQs,AJs",
    },
    call: {
      100: "99-77,ATs,JTs",
      75: "AJs,66-55,KQs,T9s",
      50: "44-22,QJs,98s",
      25: "TT,KJs,KTs,QTs,87s",
    },
  },
  // SB가 BTN 오픈을 만남 — 사실상 3벳 아니면 폴드 (콜 없음)
  "sb-vs-btn": {
    threeBet: {
      100: "99+,ATs+,A5s-A4s,KQs,KJs,QJs,AJo+,KQo",
      75: "88,A9s,KTs,A3s-A2s",
      50: "77,K9s,QTs,JTs,T9s,98s,87s,76s,ATo,KJo",
      25: "66-55,A8s-A6s,Q9s,J9s,65s,54s,QJo,KTo",
    },
    call: {},
  },
  // BB가 CO 오픈(2.5bb) + BTN 콜을 만남 (확장 ③ 스퀴즈, ~11-12bb) — 콜러가 있어
  // 헤즈업(bb-vs-co)보다 전체 수비가 좁고(사슬 검증), 스퀴즈는 밸류 중심 리니어.
  // 오버콜은 수딧·커넥티드(멀티웨이에서 너트를 만드는 핸드) 위주, 오프수트 정크는 폴드
  "sq-bb-co-btn": {
    threeBet: {
      100: "TT+,AQs+,AKo",
      75: "AQo,AJs",
      50: "99,KQs,A5s-A4s",
      25: "88,ATs,KJs,QJs,JTs",
    },
    call: {
      100: "77-22,A9s-A6s,KTs,QTs,J9s,T9s,98s,87s,76s,65s,54s",
      75: "88,ATs,KJs,QJs,JTs,K9s-K5s,Q9s,J8s,T8s,AJo,KQo",
      50: "99,KQs,A5s-A4s,A3s-A2s,Q8s,ATo,KJo,QJo,JTo",
      25: "AJs,K4s-K2s,Q7s-Q4s,J7s-J5s,T7s-T6s,97s,96s,86s,85s,75s,64s,53s,KTo,QTo",
    },
  },
  // SB가 CO 오픈 + BTN 콜을 만남 (확장 ③ 스퀴즈) — SB 원칙 그대로 3벳 아니면 폴드.
  // 두 레인지를 상대하므로 sb-vs-btn(13.5%)보다 훨씬 좁다(사슬 검증)
  "sq-sb-co-btn": {
    threeBet: {
      100: "JJ+,AQs+,AKo",
      75: "TT,AQo,AJs",
      50: "99,ATs,KQs,A5s-A4s",
      25: "88,A9s,KJs,QJs,JTs,T9s,98s,87s,AJo",
    },
    call: {},
  },
};

// ─── 3단계: vs 3벳 (확장 ③) — 내가 오픈한 뒤 3벳을 받았을 때 ─────
// 히어로의 레인지가 이미 오픈 레인지로 제한돼 있어 별도 모드로 표시한다.
// 빈도는 «오픈했다면»의 조건부 — 오픈하지 않는 핸드는 응답이 없어야 하고(검증),
// 통계는 전체 1326콤보가 아니라 «오픈 레인지 대비» %로 계산한다.
// 전제: 오픈 2.5bb, 3벳 약 10~11bb. 내부 앵커: presets BTN_CALL_3BET(3벳팟 프리셋).

export type Vs3BetId = "btn-vs-bb-3bet" | "btn-vs-sb-3bet";

export type Vs3BetScenario = {
  id: Vs3BetId;
  /** 오픈한 내 포지션 */
  hero: string;
  /** 3벳한 상대 */
  villain: string;
};

export const VS3BET_SCENARIOS: Vs3BetScenario[] = [
  { id: "btn-vs-bb-3bet", hero: "BTN", villain: "BB" },
  { id: "btn-vs-sb-3bet", hero: "BTN", villain: "SB" },
];

type Vs3BetTiers = { fourBet: TierMap; call: TierMap };

const VS_3BET: Record<Vs3BetId, Vs3BetTiers> = {
  // BTN 2.5bb 오픈 → BB ~11bb 3벳. 4벳 밸류는 QQ+/AK 중심 + A5s-A4s 블러프,
  // 콜은 페어·수딧 브로드웨이·커넥터(BTN_CALL_3BET 전부 포함 — 검증)
  "btn-vs-bb-3bet": {
    fourBet: {
      100: "KK+",
      75: "QQ,AKs,AKo",
      50: "JJ,AQs,A5s-A2s",
      25: "TT,AQo",
    },
    call: {
      100: "99-44,AJs-A6s,KQs-KTs,QJs-QTs,JTs,J9s,T9s,98s,87s",
      75: "TT,33-22,76s,65s,T8s",
      50: "JJ,AQs,AQo,A5s-A4s,AJo,ATo,KQo,KJo,K9s,Q9s,54s",
      25: "QQ,AKs,AKo,A3s-A2s,97s,86s",
    },
  },
  // BTN 오픈 → SB ~10bb 3벳. SB의 3벳이 더 넓고(머지드) BTN이 포지션을 가지므로
  // vs BB보다 조금 넓게 계속한다(사슬: vs BB ⊆ vs SB). 4벳도 약간 공격적
  "btn-vs-sb-3bet": {
    fourBet: {
      100: "KK+",
      75: "QQ,AKs,AKo",
      50: "JJ,AQs,A5s-A2s",
      25: "TT,AQo,KQs",
    },
    call: {
      100: "99-22,AJs-A6s,KJs-KTs,QJs-QTs,JTs,J9s,T9s-T8s,98s,87s,76s",
      75: "TT,AJo,ATo,KQo,KJo,KQs,K9s,Q9s,54s,65s",
      50: "JJ,AQs,AQo,A5s-A4s,97s,86s",
      25: "QQ,AKs,AKo,QJo,A3s-A2s",
    },
  },
};

// ─── 4단계: vs 4벳 (확장 ④) — 내가 3벳한 뒤 4벳을 받았을 때 ─────
// 히어로가 «3벳한 사람»(BB/SB)이라 조건부 모집단이 3벳 레인지다. 빈도는 «3벳했다면»
// 기준이고, 통계도 전체 1326콤보가 아니라 «3벳 레인지 대비» %로 계산한다.
// 액션은 5벳(올인)/콜 — 100bb에서 5벳은 사실상 올인 단일 사이즈(출처검증.md 8절 결정 2).
// 전제: 오픈 2.5bb, BB 3벳 11bb → 4벳 24bb / SB 3벳 10bb → 4벳 22bb, 5벳 올인.
// 값은 공개 출처가 얇아(핸드별 표는 유료 도구 안에만 있음) 내부 유도로 채웠다:
// 에퀴티 실측(vs4벳_에퀴티실측표.md) + 팟 오즈 + 자동수익 하한(BB 39.4%/SB 40.9%) +
// S17~S20 핸드군. 3인 페르소나 검수 완료 — 판정 전체는 출처검증.md 확장 4(10·11절).

export type Vs4BetId = "bb-vs-btn-4bet" | "sb-vs-btn-4bet";

export type Vs4BetScenario = {
  id: Vs4BetId;
  /** 3벳한 내 포지션 */
  hero: string;
  /** 4벳한 상대 */
  villain: string;
  /** 히어로의 3벳 레인지가 있는 수비 조합 (조건부 모집단) */
  base: ScenarioId;
};

export const VS4BET_SCENARIOS: Vs4BetScenario[] = [
  { id: "bb-vs-btn-4bet", hero: "BB", villain: "BTN", base: "bb-vs-btn" },
  { id: "sb-vs-btn-4bet", hero: "SB", villain: "BTN", base: "sb-vs-btn" },
];

type Vs4BetTiers = { fiveBet: TierMap; call: TierMap };

// 5벳 뼈대는 두 조합 공통 — 4벳 레인지 차이(SB 쪽 +KQs:25)가 에퀴티에 만드는 차이가
// 티어 해상도(25%) 미만이라 단일 뼈대가 맞다(11절 검수 판정).
// AA·KK 75 = 트랩 콜 25% (상대 4벳의 가중 8콤보 ≈ 17%가 블러프라 콜로 남기는 값이 있다).
// AKo 75 > AKs 50: 콜당한 에퀴티는 비슷(43.4 vs 46.1)하지만 OOP 콜 플레이어빌리티가
// 나빠 잼(폴드 에퀴티 ~30%) 쪽 값이 크다. A5s-A4s 25 = 블로커 잼(S20).
// QQ·AKs·AKo의 5벳은 콜당한 에퀴티 50% 미달이지만 폴드 에퀴티가 근거 — 검증 화이트리스트.
const VS_4BET: Record<Vs4BetId, Vs4BetTiers> = {
  // BB 3벳 11bb → BTN 4벳 24bb. 모집단 94콤보(29핸드), 계속 55.25콤보 = 58.8%
  // (하한 39.4% ✓, 창 50~62% ✓). 콜은 실현율(OOP·SPR 1.8)이 기준 — 팟 오즈(26.8%)는
  // 전 핸드가 통과해 판별력이 없다. 88-77 콜 25는 99와 실측 에퀴티가 동일(40.3 안팎)해
  // 절벽을 없앤 검수 반영(11절). 폴드: T8s·97s·86s·A3s-A2s·KQs·KJs·QJs·JTs·76s·65s·
  // AJo·KQo — 필요 실현율 0.8+ 미달, 블로커·도미 근거 없음.
  "bb-vs-btn-4bet": {
    fiveBet: {
      75: "AA,KK,AKo",
      50: "QQ,AKs",
      25: "JJ,TT,A5s-A4s",
    },
    call: {
      100: "AQs",
      75: "JJ",
      50: "QQ,AKs,TT,99",
      25: "AA,KK,AKo,88-77,AJs,AQo,ATs",
    },
  },
  // SB 3벳 10bb → BTN 4벳 22bb. 모집단 181.5콤보(45핸드), 계속 76콤보 = 41.9%
  // (하한 40.9% 턱걸이 — 의도된 타이트: 3벳-오어-폴드 레인지라 중간 핸드가 많다).
  // 콜 티어가 존재하는 이유(8절 결정 1): 하한 74콤보를 잼만으로 못 채우고 잼 확장은
  // −EV(AQs 잼 ≈ −3bb). 콜 코어 = JJ-99·AQs, QQ·AK는 잼/콜 혼합. 폴드: 오프수트
  // 브로드웨이(KQo·KJo·KTo·QJo·ATo)와 약한 수딧(K9s·Q9s 이하)·A9s-A6s·A3s-A2s·
  // KJs·QJs·66-55·커넥터 전부 — 필요 실현율 0.9 안팎이라 못 넘는다.
  "sb-vs-btn-4bet": {
    fiveBet: {
      75: "AA,KK,AKo",
      50: "QQ,AKs",
      25: "JJ,TT,A5s-A4s",
    },
    call: {
      100: "AQs,99",
      75: "JJ,TT",
      50: "QQ,AKs,88,AJs,AQo,A5s",
      25: "AA,KK,AKo,77,ATs,KQs,AJo",
    },
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

/**
 * 한 클래스 표기("66+", "K8s-K5s", "AJo+", "54s")를 [hi, lo, suited][] 목록으로.
 * 에퀴티 계산기(equity.ts)의 레인지 파서도 이 함수를 그대로 쓴다 — 문법이 한 곳에만 있어야 한다.
 */
export const expandClass = (cls: string): [number, number, boolean][] => {
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

/** 티어 맵("빈도: 레인지 문자열") → 169칸 빈도 격자 */
const gridOfTiers = (tiers: TierMap): number[] => {
  const grid = Array.from({ length: 169 }, () => 0);
  for (const [freqKey, text] of Object.entries(tiers)) {
    const freq = Number(freqKey);
    if (!text) continue;
    for (const cls of text.split(",")) {
      for (const [hi, lo, suited] of expandClass(cls.trim())) {
        grid[gridIndexOf(hi, lo, suited)] = freq;
      }
    }
  }
  return grid;
};

const gridCache = new Map<Position, number[]>();

/** 포지션의 169칸 오픈 빈도(0~100). 인덱스 관례는 RangeEditor와 동일 */
export const gridFor = (position: Position): number[] => {
  const cached = gridCache.get(position);
  if (cached) return cached;
  const grid = gridOfTiers(RFI[position]);
  gridCache.set(position, grid);
  return grid;
};

const defendCache = new Map<ScenarioId, { threeBet: number[]; call: number[] }>();

/** 수비 조합의 3벳·콜 빈도 격자 (각 0~100, 합은 100 이하 — 검증이 보장) */
export const defendGridsFor = (id: ScenarioId) => {
  const cached = defendCache.get(id);
  if (cached) return cached;
  const grids = {
    threeBet: gridOfTiers(VS_OPEN[id].threeBet),
    call: gridOfTiers(VS_OPEN[id].call),
  };
  defendCache.set(id, grids);
  return grids;
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

export type DefendStats = {
  threeBetPercent: number;
  callPercent: number;
  totalPercent: number;
  /** 조금이라도 수비하는 핸드 종류 수 */
  hands: number;
  /** 3벳·콜이 섞이거나 100% 미만인 핸드 종류 수 */
  mixedHands: number;
};

export const defendStatsFor = (id: ScenarioId): DefendStats => {
  const { threeBet, call } = defendGridsFor(id);
  let threeBetCombos = 0;
  let callCombos = 0;
  let hands = 0;
  let mixedHands = 0;
  for (let i = 0; i < 169; i++) {
    const total = threeBet[i] + call[i];
    if (total <= 0) continue;
    threeBetCombos += (combosAt(i) * threeBet[i]) / 100;
    callCombos += (combosAt(i) * call[i]) / 100;
    hands += 1;
    if (total < 100 || (threeBet[i] > 0 && call[i] > 0)) mixedHands += 1;
  }
  return {
    threeBetPercent: (threeBetCombos / 1326) * 100,
    callPercent: (callCombos / 1326) * 100,
    totalPercent: ((threeBetCombos + callCombos) / 1326) * 100,
    hands,
    mixedHands,
  };
};

/** 티어 맵 → 가중 레인지 문자열 ("K8s:0.75" — wasm-postflop 표기) */
const tiersToRangeText = (tiers: TierMap): string => {
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

/**
 * 솔버(레인지 입력)에 붙여넣을 수 있는 가중 레인지 문자열.
 * 혼합 핸드는 "K8s:0.75"처럼 가중치를 붙인다 (wasm-postflop 표기).
 */
export const rangeTextFor = (position: Position): string =>
  tiersToRangeText(RFI[position]);

export const defendRangeTextFor = (id: ScenarioId, action: "threeBet" | "call"): string =>
  tiersToRangeText(VS_OPEN[id][action]);

// ─── vs 3벳 접근자 ───────────────────────────────────────────

const vs3betCache = new Map<Vs3BetId, { fourBet: number[]; call: number[] }>();

/** vs 3벳 조합의 4벳·콜 빈도 격자 (오픈했다는 전제의 조건부, 각 0~100) */
export const vs3betGridsFor = (id: Vs3BetId) => {
  const cached = vs3betCache.get(id);
  if (cached) return cached;
  const grids = {
    fourBet: gridOfTiers(VS_3BET[id].fourBet),
    call: gridOfTiers(VS_3BET[id].call),
  };
  vs3betCache.set(id, grids);
  return grids;
};

export type Vs3BetStats = {
  /** 오픈 레인지 대비 % (히어로의 RFI 빈도로 가중) */
  fourBetPercent: number;
  callPercent: number;
  continuePercent: number;
  hands: number;
  mixedHands: number;
};

/** 통계는 «오픈 레인지 대비» — 각 핸드를 히어로(BTN)의 RFI 빈도로 가중해 계산 */
export const vs3betStatsFor = (id: Vs3BetId): Vs3BetStats => {
  const { fourBet, call } = vs3betGridsFor(id);
  const rfi = gridFor("BTN"); // 두 조합 모두 히어로가 BTN
  let openCombos = 0;
  let fourBetCombos = 0;
  let callCombos = 0;
  let hands = 0;
  let mixedHands = 0;
  for (let i = 0; i < 169; i++) {
    const opened = (combosAt(i) * rfi[i]) / 100;
    openCombos += opened;
    const total = fourBet[i] + call[i];
    if (total <= 0) continue;
    fourBetCombos += (opened * fourBet[i]) / 100;
    callCombos += (opened * call[i]) / 100;
    hands += 1;
    if (total < 100 || (fourBet[i] > 0 && call[i] > 0)) mixedHands += 1;
  }
  return {
    fourBetPercent: (fourBetCombos / openCombos) * 100,
    callPercent: (callCombos / openCombos) * 100,
    continuePercent: ((fourBetCombos + callCombos) / openCombos) * 100,
    hands,
    mixedHands,
  };
};

export const vs3betRangeTextFor = (id: Vs3BetId, action: "fourBet" | "call"): string =>
  tiersToRangeText(VS_3BET[id][action]);

// ─── vs 4벳 접근자 (vs 3벳의 평행 복제 — 모집단만 오픈→3벳 레인지) ───

const vs4betCache = new Map<Vs4BetId, { fiveBet: number[]; call: number[] }>();

/** vs 4벳 조합의 5벳·콜 빈도 격자 (3벳했다는 전제의 조건부, 각 0~100) */
export const vs4betGridsFor = (id: Vs4BetId) => {
  const cached = vs4betCache.get(id);
  if (cached) return cached;
  const grids = {
    fiveBet: gridOfTiers(VS_4BET[id].fiveBet),
    call: gridOfTiers(VS_4BET[id].call),
  };
  vs4betCache.set(id, grids);
  return grids;
};

export type Vs4BetStats = {
  /** 3벳 레인지 대비 % (히어로의 3벳 빈도로 가중) */
  fiveBetPercent: number;
  callPercent: number;
  continuePercent: number;
  hands: number;
  mixedHands: number;
};

/** 통계는 «3벳 레인지 대비» — 각 핸드를 히어로(BB/SB)의 3벳 빈도로 가중해 계산 */
export const vs4betStatsFor = (id: Vs4BetId): Vs4BetStats => {
  const { fiveBet, call } = vs4betGridsFor(id);
  const scenario = VS4BET_SCENARIOS.find((s) => s.id === id) as Vs4BetScenario;
  const threeBet = defendGridsFor(scenario.base).threeBet;
  let threeBetCombos = 0;
  let fiveBetCombos = 0;
  let callCombos = 0;
  let hands = 0;
  let mixedHands = 0;
  for (let i = 0; i < 169; i++) {
    const threeBetted = (combosAt(i) * threeBet[i]) / 100;
    threeBetCombos += threeBetted;
    const total = fiveBet[i] + call[i];
    if (total <= 0) continue;
    fiveBetCombos += (threeBetted * fiveBet[i]) / 100;
    callCombos += (threeBetted * call[i]) / 100;
    hands += 1;
    if (total < 100 || (fiveBet[i] > 0 && call[i] > 0)) mixedHands += 1;
  }
  return {
    fiveBetPercent: (fiveBetCombos / threeBetCombos) * 100,
    callPercent: (callCombos / threeBetCombos) * 100,
    continuePercent: ((fiveBetCombos + callCombos) / threeBetCombos) * 100,
    hands,
    mixedHands,
  };
};

export const vs4betRangeTextFor = (
  id: Vs4BetId,
  action: "fiveBet" | "call"
): string => tiersToRangeText(VS_4BET[id][action]);

/** 검증 스크립트용 훅 — preflop-verify.js가 데이터 무결성을 검사할 때 쓴다 */
declare global {
  interface Window {
    __preflop?: {
      positions: Position[];
      gridFor: typeof gridFor;
      statsFor: typeof statsFor;
      rangeTextFor: typeof rangeTextFor;
      handLabelAt: typeof handLabelAt;
      scenarios: Scenario[];
      defendGridsFor: typeof defendGridsFor;
      defendStatsFor: typeof defendStatsFor;
      defendRangeTextFor: typeof defendRangeTextFor;
      vs3betScenarios: Vs3BetScenario[];
      vs3betGridsFor: typeof vs3betGridsFor;
      vs3betStatsFor: typeof vs3betStatsFor;
      vs3betRangeTextFor: typeof vs3betRangeTextFor;
      vs4betScenarios: Vs4BetScenario[];
      vs4betGridsFor: typeof vs4betGridsFor;
      vs4betStatsFor: typeof vs4betStatsFor;
      vs4betRangeTextFor: typeof vs4betRangeTextFor;
    };
  }
}
if (typeof window !== "undefined") {
  window.__preflop = {
    positions: POSITIONS,
    gridFor,
    statsFor,
    rangeTextFor,
    handLabelAt,
    scenarios: SCENARIOS,
    defendGridsFor,
    defendStatsFor,
    defendRangeTextFor,
    vs3betScenarios: VS3BET_SCENARIOS,
    vs3betGridsFor,
    vs3betStatsFor,
    vs3betRangeTextFor,
    vs4betScenarios: VS4BET_SCENARIOS,
    vs4betGridsFor,
    vs4betStatsFor,
    vs4betRangeTextFor,
  };
}
