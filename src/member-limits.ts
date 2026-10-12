// 회원 전용 (설계 참고자료/회원전용_설계안_2026-10-12.md §2·§3 · 확정_결정.md «회원 전용»).
// ① 비회원 저장 = 레인지·벳 설정 각 SAVE_LIMIT개(폴더 제외) — 앱 안의 권유 장치(잠금 아님)
// ② 회원 전용 상황 = 자료 Worker가 로그인 토큰을 확인해 잠근다 — 앱은 토큰을 붙이고, 없으면 그 자리 한 줄만 보인다
// 트레이너 빌드 전용 — npokers(gtozero) 빌드에는 @features 이음새로 들어가지 않는다(계정 기능이 없다).
import { isAccountEnabled } from "./account";
import type { Locale } from "./i18n";

/** 출시 스위치 — 15언어 문구 판정(3단계) 뒤 사장님 ○로 켠다. 켜기 전엔 저장 제한·회원 상황 모두 없다. */
export const MEMBER_LIMITS_LAUNCHED = false;
/** localhost 검사용: localStorage `solver.memberLimits.test` = "1"이면 스위치가 꺼져 있어도 켠다. */
const TEST_KEY = "solver.memberLimits.test";
/** localhost 검사용: 이 키에 상황 id(쉼표 구분)를 넣으면 그 상황도 회원 전용으로 다룬다(림프 자리표가 앱에 오기 전 확인용). */
const TEST_SCENARIOS_KEY = "solver.memberLimits.testScenarios";

const isTestHost = () => {
  try {
    return ["localhost", "127.0.0.1"].includes(location.hostname);
  } catch {
    return false;
  }
};

export const memberLimitsEnabled = () => {
  if (!isAccountEnabled) return false;
  if (MEMBER_LIMITS_LAUNCHED) return true;
  try {
    return isTestHost() && localStorage.getItem(TEST_KEY) === "1";
  } catch {
    return false;
  }
};

/** 비회원이 이 기기에 저장할 수 있는 레인지·벳 설정 수(각각 · 폴더는 세지 않는다). 이미 넘은 항목은 지우지 않는다. */
export const SAVE_LIMIT = 10;

/** 회원 전용 상황 — Worker `MEMBER_PREFIXES`(`limp-`)와 같게. 맛보기 파일은 Worker `FREE_SAMPLES`가 토큰 없이 준다. */
const MEMBER_PREFIXES = ["limp-"];
const MEMBER_FREE_SAMPLES = ["limp-sb-bb/QdTd7c.bin"];

export const isMemberScenario = (scenario: string) => {
  if (!memberLimitsEnabled()) return false;
  if (MEMBER_PREFIXES.some((p) => scenario.startsWith(p))) return true;
  if (!isTestHost()) return false;
  try {
    return (localStorage.getItem(TEST_SCENARIOS_KEY) ?? "").split(",").includes(scenario);
  } catch {
    return false;
  }
};

/** 로그인 없이 받을 수 있는 회원 상황 파일(맛보기)인가 */
export const isMemberFreeSample = (scenario: string, fileName: string) =>
  MEMBER_FREE_SAMPLES.includes(`${scenario}/${fileName}`);

// 문구 — 2단계는 ko·en만. 3단계에서 15언어로 채우고 `typeof ko`로 묶는다(그 전엔 스위치가 꺼져 있어 화면에 안 나온다).
const ko = {
  saveFull: "로그인하면 개수 제한 없이 저장하고 폰·PC에서 불러올 수 있어요",
  importOver: "가져오면 이 기기 저장이 10개를 넘어요 — 로그인하면 전부 가져올 수 있어요",
  memberScenario: "이 상황은 무료 회원 전용이에요 — 로그인하면 바로 볼 수 있어요",
};
const en: typeof ko = {
  saveFull: "Sign in to save without a limit and open your list on any phone or PC",
  importOver: "This import would take this device past 10 saved items — sign in to import all of it",
  memberScenario: "This spot is for free members — sign in to open it right away",
};
export type MemberLabels = typeof ko;
export const memberLabels = (locale: Locale): MemberLabels => (locale === "ko" ? ko : en);
