import type { Locale, LocaleDict } from "./i18n";

// 플랍 조회 문구 (1단계: 제목만 · ko·en). 나머지 언어는 5단계 문구 회차 전까지 영어로 대체한다.
const ko = { title: "플랍 조회", navTitle: "플랍 조회" };
const en: typeof ko = { title: "Flop study", navTitle: "Flop study" };
export type FlopStudyLabels = Record<keyof typeof ko, string>;
// This assignment checks both the locale set and every required key at build time.
const checkedLabels: LocaleDict<FlopStudyLabels> = {
  ko, en, ja: en, es: en, pt: en, de: en, zh: en, "zh-hant": en,
  fr: en, id: en, ms: en, hi: en, tr: en, vi: en, ru: en,
};
export const flopStudyLabels = (locale: Locale): FlopStudyLabels => checkedLabels[locale];
