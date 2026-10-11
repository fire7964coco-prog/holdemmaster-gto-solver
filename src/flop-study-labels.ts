import type { Locale, LocaleDict } from "./i18n";

// 플랍 조회 문구 (2단계: PC 화면 · ko·en). 나머지 언어는 5단계 문구 회차 전까지 영어로 대체한다.
// 상황·액션 이름(오픈한 자리·체크·벳 …)은 hand-review-labels `M`을 그대로 쓴다.
const ko = {
  title: "플랍 조회", navTitle: "플랍 조회",
  precomputedAccuracy: "미리 계산한 결과 · 정밀도 {pct}",
  board: "보드", pickBoard: "보드 고르기", closePicker: "닫기", randomFlop: "무작위",
  pickPrompt: "카드 3장을 고르세요 ({count}/3)",
  start: "처음", notReady: "준비 중",
  notReadyNote: "이 상황은 아직 미리 계산되지 않았습니다.",
  actions: "{seat}의 액션", combos: "콤보 {count}",
  strategyGrid: "{seat}의 전략",
  gridHelp: "칸 색 = 액션 빈도 · 채운 높이 = 이 자리까지 남은 비중",
  handDetail: "핸드 상세", chooseCell: "표에서 핸드를 누르면 무늬별 빈도와 EV가 나옵니다.",
  combo: "콤보", weight: "비중", frequency: "빈도", ev: "EV",
  notInRange: "이 자리까지 오는 콤보가 없습니다.",
  turnNotStored: "여기서 플랍이 끝납니다. 턴부터는 미리 계산하지 않았습니다.",
  handOverFold: "폴드로 핸드가 끝났습니다.", handOverAllIn: "올인 · 콜로 더 행동할 것이 없습니다.",
};
const en: typeof ko = {
  title: "Flop study", navTitle: "Flop study",
  precomputedAccuracy: "Precomputed result · accuracy {pct}",
  board: "Board", pickBoard: "Choose board", closePicker: "Close", randomFlop: "Random",
  pickPrompt: "Choose 3 cards ({count}/3)",
  start: "Start", notReady: "Coming soon",
  notReadyNote: "This situation has not been precomputed yet.",
  actions: "{seat} actions", combos: "{count} combos",
  strategyGrid: "{seat} strategy",
  gridHelp: "Cell colour = action frequency · fill height = share of the hand that reaches this spot",
  handDetail: "Hand details", chooseCell: "Tap a hand in the grid to see each suit combo's frequency and EV.",
  combo: "Combo", weight: "Weight", frequency: "Frequency", ev: "EV",
  notInRange: "No combos of this hand reach this spot.",
  turnNotStored: "The flop ends here. Turn play is not precomputed.",
  handOverFold: "The hand ended with a fold.", handOverAllIn: "All-in and call — no more decisions.",
};
export type FlopStudyLabels = Record<keyof typeof ko, string>;
// This assignment checks both the locale set and every required key at build time.
const checkedLabels: LocaleDict<FlopStudyLabels> = {
  ko, en, ja: en, es: en, pt: en, de: en, zh: en, "zh-hant": en,
  fr: en, id: en, ms: en, hi: en, tr: en, vi: en, ru: en,
};
export const flopStudyLabels = (locale: Locale): FlopStudyLabels => checkedLabels[locale];
