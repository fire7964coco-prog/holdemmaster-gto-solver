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

// ⚠ "zh"(간체)와 "zh-hant"(번체)는 «별개 언어»다 — 용어 자체가 다르므로 기계 변환 금지
// (德州扑克/德州撲克 · 求解器/解算器 · 概率/機率 · 弃牌/蓋牌).
export type Locale = "ko" | "en" | "ja" | "es" | "pt" | "de" | "zh" | "zh-hant";

const KEY = "solver.locale";

const readStored = (): Locale | null => {
  try {
    const value = localStorage.getItem(KEY);
    return value === "ko" ||
      value === "en" ||
      value === "ja" ||
      value === "es" ||
      value === "pt" ||
      value === "de" ||
      value === "zh" ||
      value === "zh-hant"
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
    fromUrl === "es" ||
    fromUrl === "pt" ||
    fromUrl === "de" ||
    fromUrl === "zh" ||
    fromUrl === "zh-hant"
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
  if (lang.startsWith("pt")) return "pt";
  if (lang.startsWith("de")) return "de";
  // ⚠ 중국어는 간체(zh-CN)와 번체(zh-hant)가 별개 언어다. **번체 판정이 «먼저» 와야 한다** —
  //   startsWith("zh")를 앞에 두면 zh-TW·zh-HK가 전부 간체로 새어 나간다(2026-08-22까지 실제로 그랬다).
  //   번체권 = 대만(zh-TW)·홍콩(zh-HK)·마카오(zh-MO), 그리고 명시적 문자표기 zh-Hant-*.
  //   간체권 = 중국 대륙(zh-CN)·싱가포르(zh-SG)·zh-Hans-*, 그리고 지역 없는 「zh」.
  if (lang.startsWith("zh")) {
    if (/^zh-(tw|hk|mo)($|[-_])/.test(lang) || lang.includes("hant")) return "zh-hant";
    return "zh";
  }
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
    title: "HoldemMaster GTO Solver — Free Online Solver for Texas Hold'em",
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
      "Solver GTO gratis que funciona directamente en tu navegador, sin instalar nada. Calcula la estrategia postflop de Texas Hold'em por rango, board y tamaño de apuesta. De HoldemMaster.",
  },
  pt: {
    title: "HoldemMaster GTO Solver — Solver de poker GTO grátis no navegador",
    description:
      "Solver GTO grátis que roda direto no seu navegador, sem instalar nada. Calcule a estratégia pós-flop de Texas Hold'em por range, board e tamanho de aposta. Da HoldemMaster.",
  },
  de: {
    // 독일 조판은 Halbgeviertstrich «–» (본체 §7-10) — 다른 언어의 «—»와 일부러 다르다
    title: "HoldemMaster GTO Solver – Kostenloser Online-Solver für Texas Hold\u2019em",
    description:
      "Kostenloser GTO-Solver, der direkt im Browser läuft – ohne Installation. Berechne die Postflop-Strategie in Texas Hold’em nach Range, Board und Bet Size. Von HoldemMaster.",
  },
  // 중국어(간체). 문장부호는 전각(，。)이 중국어 표준이다 (본체 브리프 §6).
  // 「求解器」=solver ·「翻后」=postflop ·「下注尺寸」=bet size ·「公共牌」=board 는
  // 중국 德扑 매체(dpskill·中扑网)의 실사용어다 — 리서치 문서 §2에 출처를 적어 뒀다
  zh: {
    title: "HoldemMaster GTO 求解器 — 免费在线德州扑克 GTO Solver",
    description:
      "免费 GTO 求解器，打开浏览器就能用，无需安装。按手牌范围、公共牌和下注尺寸计算德州扑克（德扑）翻后策略。由 HoldemMaster 提供。",
  },
  // 중국어(번체). ⚠ 간체를 글자만 바꾼 것이 아니다 — 용어 자체가 다르다.
  // 「解算器」=solver(본체 브리프 §7-C · 본체 zh-hant 포스팅 42편에서 解算器 25회 / 求解器 0회) ·
  // 「翻牌後」=postflop(§7-A) ·「範圍」=range ·「下注尺寸」=bet size ·「德撲」=고빈도 약칭(플랜 §3).
  // 문장부호는 전각(，。)이 중국어 공통 표준이지만 인용부호는 대만·홍콩 관습인 「 」다(§8-4).
  "zh-hant": {
    title: "HoldemMaster GTO 解算器 —— 免費線上德州撲克 GTO Solver",
    description:
      "免費 GTO 解算器，打開瀏覽器就能用，不用安裝。依手牌範圍、公共牌與下注尺寸計算德州撲克（德撲）翻牌後策略。由 HoldemMaster 提供。",
  },
};

/* html lang= 값. ⚠ 중국어는 «문자»까지 밝혀야 브라우저가 글꼴을 제대로 고른다 —
 * 번체와 간체는 같은 코드포인트를 쓰면서 자형이 다른 글자가 많아(直·骨·産 등),
 * lang이 zh-Hant인지 zh-Hans인지에 따라 CJK 폴백 글꼴이 갈린다.
 * (BCP-47은 대소문자를 안 가리지만 표준 표기가 zh-Hant이므로 그대로 적는다) */
const DOC_LANG: Record<Locale, string> = {
  ko: "ko",
  en: "en",
  ja: "ja",
  es: "es",
  pt: "pt",
  de: "de",
  zh: "zh-Hans",
  "zh-hant": "zh-Hant",
};

const applyDocumentLocale = (locale: Locale) => {
  document.documentElement.lang = DOC_LANG[locale];
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

/**
 * 화면에 «찍히는» 수치의 소수점을 언어에 맞춘다 — 브라질·독일은 «,»가 소수점이다.
 * 숫자 사이의 점만 바꾸므로 문장 끝 마침표·주소·버전(AGPL-3.0)은 건드리지 않는다.
 *
 * ⚠ 쓰면 안 되는 곳: CSV 내보내기(쉼표가 열 구분자) · style 문자열(width: 50,5%)
 *   · 사용자가 그대로 입력해야 하는 벳 사이즈 문법(«2.5x»).
 * ⚠ 중국어(zh·zh-hant)는 «영어와 같은» 마침표 소수점이다 — 여기에 넣으면 오히려 깨진다
 *   (본체 브리프 §3: 1,326 · 0.003% · 2.7:1 · 천단위 콤마). pt·de 전용이다.
 * 템플릿에서는 전역 속성 `$n(...)`으로 쓴다 (index.ts에서 등록).
 */
export const localizeNumber = (text: string) =>
  i18n.locale === "pt" || i18n.locale === "de"
    ? text.replace(/(\d)\.(\d)/g, "$1,$2")
    : text;

/** 정수부·소수부를 나눠 그리는 화면(결과 표·13×13 격자)에서 쓰는 소수점 문자 */
export const decimalMark = () =>
  i18n.locale === "pt" || i18n.locale === "de" ? "," : ".";

/** 언어별 값 중 현재 언어 것을 고른다 (문장 조립이 아닌 짧은 선택용).
 * ja·es·pt·de·zh·zhHant를 생략하면 영어로 폴백한다 — 새 문구는 반드시 zhHant까지 채울 것.
 * ⚠ zhHant를 비우면 «간체»가 아니라 «영어»로 떨어진다. 중국어끼리 폴백하지 않는 것은
 *   일부러다 — 번체 화면에 간체가 섞이면 «틀린 언어»로 읽히기 때문이다. */
export const pick = <T>(
  ko: T,
  en: T,
  ja: T = en,
  es: T = en,
  pt: T = en,
  de: T = en,
  zh: T = en,
  zhHant: T = en
): T =>
  i18n.locale === "ko"
    ? ko
    : i18n.locale === "ja"
    ? ja
    : i18n.locale === "es"
    ? es
    : i18n.locale === "pt"
    ? pt
    : i18n.locale === "de"
    ? de
    : i18n.locale === "zh"
    ? zh
    : i18n.locale === "zh-hant"
    ? zhHant
    : en;
