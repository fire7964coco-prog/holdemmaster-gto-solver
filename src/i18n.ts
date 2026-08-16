/*
 * 언어 전환 (한국어/영어) — 2026-08-17, 글로벌 앱 등록 준비.
 *
 * 구조 원칙:
 * - 주소는 하나. 언어별 URL을 만들지 않는다(앱은 noindex — 검색 노출은 본체 랜딩 담당).
 * - 언어 결정 순서: ?lang= 파라미터(광고·공유 링크용) → 저장된 선택 → 브라우저 언어.
 *   한국어 브라우저만 한국어, 나머지는 전부 영어(포커 공용어).
 * - 문구 사전은 «각 컴포넌트 파일 안»에 둔다(const M = { ko, en }). 파일 하나에 모으면
 *   화면 작업마다 두 파일을 오가야 하고, 병렬 작업 시 충돌한다.
 *   컴포넌트에서: const L = computed(() => M[i18n.locale]);
 * - E2E 스크립트는 한국어 문구를 검사하므로 페이지 생성 시
 *   localStorage.setItem("solver.locale", "ko")를 미리 심는다 (헤드리스 크롬은 영어 브라우저다).
 */
import { reactive } from "vue";

export type Locale = "ko" | "en";

const KEY = "solver.locale";

const readStored = (): Locale | null => {
  try {
    const value = localStorage.getItem(KEY);
    return value === "ko" || value === "en" ? value : null;
  } catch {
    return null;
  }
};

const detect = (): Locale => {
  // 광고·공유 링크(?lang=en)가 최우선 — 명시적 의도이므로 저장까지 한다
  const fromUrl = new URLSearchParams(location.search).get("lang");
  if (fromUrl === "ko" || fromUrl === "en") {
    try {
      localStorage.setItem(KEY, fromUrl);
    } catch {
      /* 저장 불가 환경이면 이번 접속만 적용 */
    }
    return fromUrl;
  }
  const stored = readStored();
  if (stored) return stored;
  return navigator.language?.toLowerCase().startsWith("ko") ? "ko" : "en";
};

export const i18n = reactive({ locale: detect() });
document.documentElement.lang = i18n.locale;

export const setLocale = (locale: Locale) => {
  i18n.locale = locale;
  document.documentElement.lang = locale;
  try {
    localStorage.setItem(KEY, locale);
  } catch {
    /* 무시 */
  }
};

/** 언어별 값 중 현재 언어 것을 고른다 (문장 조립이 아닌 짧은 선택용) */
export const pick = <T>(ko: T, en: T): T => (i18n.locale === "ko" ? ko : en);
