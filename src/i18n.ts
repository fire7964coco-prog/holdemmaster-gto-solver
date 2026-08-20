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

export type Locale = "ko" | "en" | "ja" | "es";

const KEY = "solver.locale";

const readStored = (): Locale | null => {
  try {
    const value = localStorage.getItem(KEY);
    return value === "ko" || value === "en" || value === "ja" || value === "es"
      ? value
      : null;
  } catch {
    return null;
  }
};

const detect = (): Locale => {
  // 광고·공유 링크(?lang=en)가 최우선 — 명시적 의도이므로 저장까지 한다
  const fromUrl = new URLSearchParams(location.search).get("lang");
  if (
    fromUrl === "ko" ||
    fromUrl === "en" ||
    fromUrl === "ja" ||
    fromUrl === "es"
  ) {
    try {
      localStorage.setItem(KEY, fromUrl);
    } catch {
      /* 저장 불가 환경이면 이번 접속만 적용 */
    }
    return fromUrl;
  }
  const stored = readStored();
  if (stored) return stored;
  const lang = navigator.language?.toLowerCase() || "";
  if (lang.startsWith("ko")) return "ko";
  if (lang.startsWith("ja")) return "ja";
  if (lang.startsWith("es")) return "es";
  return "en";
};

/* 문서 자체(탭 제목·메타 설명)도 언어를 따라간다 — index.html은 한국어로 배포되므로
 * EN 진입 시 여기서 바꿔 준다 (탭에 한국어가 남아 있던 문제, 2026-08-19 사용자 발견).
 * ko 값은 index.html의 <title>·description과 글자까지 같아야 한다. */
const DOC_META: Record<Locale, { title: string; description: string }> = {
  ko: {
    title: "홀덤마스터 GTO 솔버 — 무료 브라우저 GTO 솔버",
    description:
      "설치 없이 브라우저에서 실행하는 무료 GTO 솔버. 텍사스 홀덤 포스트플랍 전략을 레인지·보드·벳 사이즈별로 계산합니다. 홀덤마스터 커뮤니티 제공.",
  },
  en: {
    title: "HoldemMaster GTO Solver — Free Browser GTO Solver",
    description:
      "Free GTO solver that runs right in your browser — nothing to install. Solve Texas Hold'em postflop strategy by range, board, and bet size. By HoldemMaster.",
  },
  ja: {
    title: "HoldemMaster GTOソルバー — 無料ブラウザGTOソルバー",
    description:
      "インストール不要、ブラウザで動く無料GTOソルバー。テキサスホールデムのポストフロップ戦略をレンジ・ボード・ベットサイズ別に計算します。HoldemMaster提供。",
  },
  es: {
    title: "HoldemMaster GTO Solver — Solver GTO gratis en el navegador",
    description:
      "Solver GTO gratis que corre directo en tu navegador, sin instalar nada. Calcula la estrategia postflop de Texas Hold'em por rango, board y tamaño de apuesta. De HoldemMaster.",
  },
};

const applyDocumentLocale = (locale: Locale) => {
  document.documentElement.lang = locale;
  document.title = DOC_META[locale].title;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", DOC_META[locale].description);
};

export const i18n = reactive({ locale: detect() });
applyDocumentLocale(i18n.locale);

export const setLocale = (locale: Locale) => {
  i18n.locale = locale;
  applyDocumentLocale(locale);
  try {
    localStorage.setItem(KEY, locale);
  } catch {
    /* 무시 */
  }
};

/** 언어별 값 중 현재 언어 것을 고른다 (문장 조립이 아닌 짧은 선택용).
 * ja·es를 생략하면 영어로 폴백한다 — 새 문구는 반드시 ja·es까지 채울 것. */
export const pick = <T>(ko: T, en: T, ja: T = en, es: T = en): T =>
  i18n.locale === "ko"
    ? ko
    : i18n.locale === "ja"
    ? ja
    : i18n.locale === "es"
    ? es
    : en;
