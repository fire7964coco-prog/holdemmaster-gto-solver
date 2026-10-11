import type { Locale, LocaleDict } from "./i18n";

// 저장 목록 계정 동기화 한 줄 문구 (2단계: ko·en). 나머지 언어는 15언어 문구 회차 전까지 영어로 대체한다.
// 동작 대조: 기기 저장은 언제나 먼저 됨(saved-sync-run.ts) · 실패분은 다음 동기화(화면을 열거나 저장할 때)에 다시 올림 ·
// 한도 = 본체 상한 «살아 있는 항목 1,000»(MB-244).
const ko = {
  invite: "로그인하면 저장한 목록을 폰·PC 어디서나 불러올 수 있어요",
  google: "구글로 계속하기",
  kakao: "카카오로 계속하기",
  syncing: "계정과 맞추는 중…",
  ok: "계정에 보관 중 · 마지막 동기화 {time}",
  kept: "계정에 보관 중",
  pending: "아직 계정에 올리지 못했어요 — 다음에 이 화면을 열거나 저장할 때 다시 올립니다",
  limit: "계정 보관 한도(1,000개)에 닿았어요 — 이 기기에는 계속 저장됩니다",
};
const en: typeof ko = {
  invite: "Sign in to open your saved list on any phone or PC",
  google: "Continue with Google",
  kakao: "Continue with Kakao",
  syncing: "Syncing with your account…",
  ok: "Kept in your account · last synced {time}",
  kept: "Kept in your account",
  pending: "Not uploaded yet — we'll retry next time you open this screen or save",
  limit: "Account limit reached (1,000 items) — still saving on this device",
};
export type SavedSyncLabels = Record<keyof typeof ko, string>;
// This assignment checks both the locale set and every required key at build time.
const checkedLabels: LocaleDict<SavedSyncLabels> = {
  ko, en, ja: en, es: en, pt: en, de: en, zh: en, "zh-hant": en,
  fr: en, id: en, ms: en, hi: en, tr: en, vi: en, ru: en,
};
export const savedSyncLabels = (locale: Locale): SavedSyncLabels => checkedLabels[locale];
