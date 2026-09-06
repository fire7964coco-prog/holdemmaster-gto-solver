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
export type Locale = "ko" | "en" | "ja" | "es" | "pt" | "de" | "zh" | "zh-hant" | "fr" | "id" | "ms" | "hi";

/* 🔴 2026-08-27에 키를 갈았다 — «solver.locale» → «solver.locale.pegged».
 *
 * 왜: 언어 셀렉터를 없애고 본진(holdemmaster.com) 언어에 페깅하면서, 예전 셀렉터로 고른 값이
 * localStorage에 그대로 남아 **브라우저 언어보다 세게 이겨 버렸다.** 셀렉터가 없으니 되돌릴
 * 길도 같이 사라졌다 — 사용자가 실제로 여기 걸렸다(영어 브라우저인데 좌측 상단이 한글).
 *
 * 셀렉터 시대의 저장값은 이제 «사용자가 고른 언어»가 아니라 **찌꺼기**다. 키를 갈면 그 값들이
 * 한 번에 무시되고, 각자 브라우저 언어(또는 본진이 보내는 ?lang=)로 정상 복귀한다.
 * 새 키에 쓰이는 값은 **오직 ?lang=**뿐이다 — 즉 저장값 = 본진이 정한 언어다. 뜻이 일관된다.
 *
 * ⚠ 옛 키는 읽지 않고 지운다(마이그레이션하지 않는다). 옮겨 오면 고치려던 그 찌꺼기를
 *   그대로 물려받는다. */
const KEY = "solver.locale.pegged";
const LEGACY_KEY = "solver.locale";

const readStored = (): Locale | null => {
  try {
    // 셀렉터 시대의 찌꺼기를 한 번 걷어낸다 (위 KEY 주석 참조)
    if (localStorage.getItem(LEGACY_KEY) !== null) localStorage.removeItem(LEGACY_KEY);
    const value = localStorage.getItem(KEY);
    return value === "ko" ||
      value === "en" ||
      value === "ja" ||
      value === "es" ||
      value === "pt" ||
      value === "de" ||
      value === "zh" ||
      value === "zh-hant" ||
      value === "fr" ||
      value === "id" ||
      value === "ms" ||
      value === "hi"
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
    fromUrl === "zh-hant" ||
    fromUrl === "fr" ||
    fromUrl === "id" ||
    fromUrl === "ms" ||
    fromUrl === "hi"
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
  if (lang.startsWith("fr")) return "fr"; // 프랑스·벨기에·스위스·퀘벡·아프리카 프랑코폰 전부 fr
  // 인도네시아어. ⚠ 구형 안드로이드·자바 계열은 옛 ISO 코드 «in»(in-ID)을 보낸다 — 둘 다 받는다.
  //   «in»으로 시작하는 다른 언어 코드는 없다(BCP-47 기본 태그 기준)라 오탐이 없다.
  if (lang.startsWith("id") || lang.startsWith("in")) return "id";
  // 말레이어(ms-MY·ms-BN·ms-SG). 인니어와 어휘가 겹치지만 «별개 언어»다 — id로 보내지 않는다(리서치 §0).
  if (lang.startsWith("ms")) return "ms";
  if (lang === "hi" || lang.startsWith("hi-")) return "hi";
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
 * ko 값은 index.html의 <title>·description과 글자까지 같아야 한다.
 * 간판 교체(2026-08-24, «트레이너») 반영 — ⚠ "GTO 솔버/GTO Solver" 키워드는 검색
 * 자산이므로 제목·설명에서 빼면 안 된다 (작업계획.md 가드레일 G3). */
const TRAINER_DOC_META: Record<Locale, { title: string; description: string }> = {
  ko: {
    title: "홀덤마스터 트레이너 — 무료 GTO 솔버·트레이너",
    description:
      "설치 없이 브라우저에서 실행하는 무료 GTO 솔버. 텍사스 홀덤 포스트플랍 전략을 레인지·보드·벳 사이즈별로 계산합니다. 홀덤마스터 커뮤니티 제공.",
  },
  en: {
    title: "HoldemMaster GTO Trainer — Free GTO Solver & Trainer for Texas Hold'em",
    description:
      "Free GTO solver that runs right in your browser — nothing to install. Solve Texas Hold'em postflop strategy by range, board, and bet size. By HoldemMaster.",
  },
  ja: {
    title: "HoldemMaster GTOトレーナー — 無料GTOソルバー・トレーナー",
    description:
      "インストール不要、ブラウザで動く無料GTOソルバー。テキサスホールデムのポストフロップ戦略をレンジ・ボード・ベットサイズ別に計算します。HoldemMaster提供。",
  },
  es: {
    title: "HoldemMaster GTO Trainer — Solver y entrenador GTO gratis en el navegador",
    description:
      "Solver GTO gratis que funciona directamente en tu navegador, sin instalar nada. Calcula la estrategia postflop de Texas Hold'em por rango, board y tamaño de apuesta. De HoldemMaster.",
  },
  pt: {
    title: "HoldemMaster GTO Trainer — Solver e treinador GTO grátis no navegador",
    description:
      "Solver GTO grátis que roda direto no seu navegador, sem instalar nada. Calcule a estratégia pós-flop de Texas Hold'em por range, board e tamanho de aposta. Da HoldemMaster.",
  },
  de: {
    // 독일 조판은 Halbgeviertstrich «–» (본체 §7-10) — 다른 언어의 «—»와 일부러 다르다
    title: "HoldemMaster GTO Trainer – Kostenloser GTO-Solver & Trainer für Texas Hold\u2019em",
    description:
      "Kostenloser GTO-Solver, der direkt im Browser läuft – ohne Installation. Berechne die Postflop-Strategie in Texas Hold’em nach Range, Board und Bet Size. Von HoldemMaster.",
  },
  // 중국어(간체). 문장부호는 전각(，。)이 중국어 표준이다 (본체 브리프 §6).
  // 「求解器」=solver ·「翻后」=postflop ·「下注尺寸」=bet size ·「公共牌」=board 는
  // 중국 德扑 매체(dpskill·中扑网)의 실사용어다 — 리서치 문서 §2에 출처를 적어 뒀다
  zh: {
    title: "HoldemMaster GTO 训练器 — 免费在线德州扑克 GTO Solver 与训练器",
    description:
      "免费 GTO 求解器，打开浏览器就能用，无需安装。按手牌范围、公共牌和下注尺寸计算德州扑克（德扑）翻后策略。由 HoldemMaster 提供。",
  },
  // 중국어(번체). ⚠ 간체를 글자만 바꾼 것이 아니다 — 용어 자체가 다르다.
  // 「解算器」=solver(본체 브리프 §7-C · 본체 zh-hant 포스팅 42편에서 解算器 25회 / 求解器 0회) ·
  // 「翻牌後」=postflop(§7-A) ·「範圍」=range ·「下注尺寸」=bet size ·「德撲」=고빈도 약칭(플랜 §3).
  // 문장부호는 전각(，。)이 중국어 공통 표준이지만 인용부호는 대만·홍콩 관습인 「 」다(§8-4).
  "zh-hant": {
    title: "HoldemMaster GTO 訓練器 —— 免費線上德州撲克 GTO Solver 與訓練器",
    description:
      "免費 GTO 解算器，打開瀏覽器就能用，不用安裝。依手牌範圍、公共牌與下注尺寸計算德州撲克（德撲）翻牌後策略。由 HoldemMaster 提供。",
  },
  // 프랑스어. «solver»·«trainer»는 프랑스 포커 매체가 영어 그대로 쓴다(le solver·PA Trainer —
  // 리서치 문서 §1-1·§1-2에 출처). 문체는 tu체(ton navigateur — es tú·de du와 일관).
  fr: {
    title: "HoldemMaster GTO Trainer — Solver et trainer GTO gratuits pour le Texas Hold'em",
    description:
      "Solver GTO gratuit qui tourne directement dans ton navigateur, rien à installer. Calcule la stratégie postflop du Texas Hold'em à partir de tes ranges, du board et des bet sizes. Par HoldemMaster.",
  },
  // 인도네시아어. «solver»·«trainer»·«range»·«board»는 본체 id 코퍼스(43편)가 영어 그대로 쓴다
  // (solver 26회·range 215회·board 380회 — 리서치 §2). 문체는 Anda체(본체 브리프 확정 — es tú·fr tu와 다르다).
  id: {
    title: "HoldemMaster GTO Trainer — Solver & Trainer GTO Gratis untuk Texas Hold'em",
    description:
      "Solver GTO gratis yang langsung berjalan di browser Anda, tanpa instal apa pun. Hitung strategi postflop Texas Hold'em berdasarkan range, board, dan bet size. Dari HoldemMaster.",
  },
  // 말레이어. 말레이시아 포커 매체는 GTO 도구명·range·board·equity를 영어로 쓴다(리서치 §1-3·§1-4).
  // 문체는 소문자 anda체(본체 브리프 — 인니 Anda 대문자와 다르다). 무료=percuma(인니 gratis 아님).
  ms: {
    title: "HoldemMaster GTO Trainer — Solver & Trainer GTO Percuma untuk Texas Hold'em",
    description:
      "Solver GTO percuma yang terus berjalan dalam pelayar anda, tiada apa yang perlu dipasang. Kira strategi postflop Texas Hold'em berdasarkan range, board dan bet size. Daripada HoldemMaster.",
  },
  hi: {
    title: "HoldemMaster GTO Trainer — टेक्सस होल्डम के लिए मुफ़्त GTO सॉल्वर और ट्रेनर",
    description: "बिना इंस्टॉल किए अपने ब्राउज़र में मुफ़्त GTO सॉल्वर चलाएँ। Range, board और bet size के आधार पर टेक्सस होल्डम की postflop रणनीति की गणना करें। HoldemMaster की पेशकश।",
  },
};

/* npokers 빌드(스토어용 순수 솔버)의 탭 제목·메타 설명 — 빌드 2벌 분기(2026-08-24).
 * 위 트레이너 사전에서 상표만 바꾸고 «홀덤마스터 제공» 문구를 뺀 것이다(법인 분리 취지).
 * ⚠ en 값은 index-npokers.html의 <title>·description과 글자까지 같아야 한다
 *   (npokers 정적 대체 본문은 영어가 기본이다 — 스토어 유통은 글로벌이 우선).
 * 죽은 쪽 사전은 압축 단계에서 번들에서 빠진다. */
const NPOKERS_DOC_META: Record<Locale, { title: string; description: string }> = {
  ko: {
    title: "npokers — 무료 브라우저 GTO 솔버",
    description:
      "설치 없이 브라우저에서 실행하는 무료 GTO 솔버. 텍사스 홀덤 포스트플랍 전략을 레인지·보드·벳 사이즈별로 계산합니다.",
  },
  en: {
    title: "npokers — Free Online GTO Solver for Texas Hold'em",
    description:
      "Free GTO solver that runs right in your browser — nothing to install. Solve Texas Hold'em postflop strategy by range, board, and bet size.",
  },
  ja: {
    title: "npokers — 無料ブラウザGTOソルバー",
    description:
      "インストール不要、ブラウザで動く無料GTOソルバー。テキサスホールデムのポストフロップ戦略をレンジ・ボード・ベットサイズ別に計算します。",
  },
  es: {
    title: "npokers — Solver GTO gratis en el navegador",
    description:
      "Solver GTO gratis que funciona directamente en tu navegador, sin instalar nada. Calcula la estrategia postflop de Texas Hold'em por rango, board y tamaño de apuesta.",
  },
  pt: {
    title: "npokers — Solver de poker GTO grátis no navegador",
    description:
      "Solver GTO grátis que roda direto no seu navegador, sem instalar nada. Calcule a estratégia pós-flop de Texas Hold'em por range, board e tamanho de aposta.",
  },
  de: {
    // 독일 조판은 Halbgeviertstrich «–» (트레이너 사전과 같은 규칙)
    title: "npokers – Kostenloser Online-Solver für Texas Hold’em",
    description:
      "Kostenloser GTO-Solver, der direkt im Browser läuft – ohne Installation. Berechne die Postflop-Strategie in Texas Hold’em nach Range, Board und Bet Size.",
  },
  zh: {
    title: "npokers — 免费在线德州扑克 GTO Solver",
    description:
      "免费 GTO 求解器，打开浏览器就能用，无需安装。按手牌范围、公共牌和下注尺寸计算德州扑克（德扑）翻后策略。",
  },
  "zh-hant": {
    title: "npokers —— 免費線上德州撲克 GTO Solver",
    description:
      "免費 GTO 解算器，打開瀏覽器就能用，不用安裝。依手牌範圍、公共牌與下注尺寸計算德州撲克（德撲）翻牌後策略。",
  },
  fr: {
    title: "npokers — Solver GTO gratuit dans le navigateur",
    description:
      "Solver GTO gratuit qui tourne directement dans ton navigateur, rien à installer. Calcule la stratégie postflop du Texas Hold'em à partir de tes ranges, du board et des bet sizes.",
  },
  id: {
    title: "npokers — Solver GTO Gratis untuk Texas Hold'em di Browser",
    description:
      "Solver GTO gratis yang langsung berjalan di browser Anda, tanpa instal apa pun. Hitung strategi postflop Texas Hold'em berdasarkan range, board, dan bet size.",
  },
  ms: {
    title: "npokers — Solver GTO Percuma untuk Texas Hold'em dalam Pelayar",
    description:
      "Solver GTO percuma yang terus berjalan dalam pelayar anda, tiada apa yang perlu dipasang. Kira strategi postflop Texas Hold'em berdasarkan range, board dan bet size.",
  },
  hi: {
    title: "npokers — टेक्सस होल्डम के लिए मुफ़्त ऑनलाइन GTO सॉल्वर",
    description: "बिना इंस्टॉल किए अपने ब्राउज़र में मुफ़्त GTO सॉल्वर चलाएँ। Range, board और bet size के आधार पर टेक्सस होल्डम की postflop रणनीति की गणना करें।",
  },
};

/* 빌드 2벌 분기 — 어느 사전을 쓸지는 빌드 타임에 정해진다 (webpack DefinePlugin) */
declare const __APP_TARGET__: "trainer" | "npokers";
const DOC_META = __APP_TARGET__ === "npokers" ? NPOKERS_DOC_META : TRAINER_DOC_META;

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
  fr: "fr",
  id: "id",
  ms: "ms",
  hi: "hi",
};

/* 설치된 앱의 이름(창 제목·홈 화면 라벨)은 «매니페스트»가 정한다 — 문서 제목이 아니다.
 * 언어별 파일이 public/manifest-<locale>.webmanifest로 있고, 첫 로드는 index.html의
 * 인라인 스크립트가, 이후 전환은 이 함수가 담당한다.
 * ⚠ 9개 파일의 id가 전부 "/"라 브라우저는 «같은 앱»으로 본다(다르면 앱이 갈라진다).
 * ⚠ 이미 설치된 사용자는 재설치 전까지 예전 이름을 유지한다 — 정상이다. */
const applyManifestLocale = (locale: Locale) => {
  const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) return;
  // 기본 파일(manifest.webmanifest)의 언어가 빌드마다 다르다 — 트레이너 빌드는 한국어
  // (우리 커뮤니티가 출발점), npokers 빌드는 영어(글로벌 스토어 유통이 우선).
  // index.html / index-npokers.html의 인라인 스크립트와 짝을 이룬다.
  const defaultLocale: Locale = __APP_TARGET__ === "npokers" ? "en" : "ko";
  const href =
    locale === defaultLocale ? "/manifest.webmanifest" : `/manifest-${locale}.webmanifest`;
  if (!link.href.endsWith(href)) link.href = href;
};

const applyDocumentLocale = (locale: Locale) => {
  document.documentElement.lang = DOC_LANG[locale];
  applyManifestLocale(locale);
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
 *   (본체 브리프 §3: 1,326 · 0.003% · 2.7:1 · 천단위 콤마). pt·de·fr·id 전용이다.
 * id(인도네시아)는 pt·de와 같은 계열(소수점 «,» · 천단위 «.») — % 앞 공백은 없다(«35,4%»).
 *
 * fr은 여기에 «% 앞 좁은 공백»(U+202F, 프랑스 조판 관습 35 %)이 더해진다.
 * ⚠ 일부러 «문자열 안에 이미 %가 있는 경우»에만 걸리게 했다 — 조밀 UI(13×13 격자·액션
 *   타일·결과 표 셀)는 %를 $n() 바깥 템플릿에 두므로 자동으로 제외된다. 이 제외는 결정이다:
 *   조판 규칙보다 정보 잘림이 더 나쁘다 (프랑스어화_리서치 §1-3).
 * 템플릿에서는 전역 속성 `$n(...)`으로 쓴다 (index.ts에서 등록).
 */
export const localizeNumber = (text: string) => {
  // ⚠ 아래 fr 치환문의 "$1…%" 공백은 «U+202F 리터럴»이다 — 일반 공백으로 «고치면» 깨진다
  if (i18n.locale === "fr")
    return text.replace(/(\d)\.(\d)/g, "$1,$2").replace(/(\d)\s?%/g, "$1 %");
  return i18n.locale === "pt" || i18n.locale === "de" || i18n.locale === "id"
    ? text.replace(/(\d)\.(\d)/g, "$1,$2")
    : text;
};

/** 정수부·소수부를 나눠 그리는 화면(결과 표·13×13 격자)에서 쓰는 소수점 문자 */
export const decimalMark = () =>
  i18n.locale === "pt" || i18n.locale === "de" || i18n.locale === "fr" || i18n.locale === "id"
    ? ","
    : ".";

/** 언어별 값 중 현재 언어 것을 고른다 (문장 조립이 아닌 짧은 선택용).
 * ja·es·pt·de·zh·zhHant·fr·id·ms를 생략하면 영어로 폴백한다 — 새 문구는 반드시 hi까지 채울 것.
 * ⚠ zhHant를 비우면 «간체»가 아니라 «영어»로 떨어진다. 중국어끼리 폴백하지 않는 것은
 *   일부러다 — 번체 화면에 간체가 섞이면 «틀린 언어»로 읽히기 때문이다.
 * ⚠ fr이 Locale 유니온 순서(de 다음)가 아니라 «맨 끝»인 것도 일부러다 — 중간에 끼우면
 *   기존 8인자 호출의 zh·zhHant가 한 칸씩 밀려 조용히 틀린 언어가 나온다.
 *   id(2026-09-02)도 같은 이유로 fr 뒤 «맨 끝»이다 — 기존 9인자 호출 전수에 10번째 값을 붙였다.
 *   hi(2026-09-06)는 12번째 인자로 마지막에 추가한다.
 *   ms(2026-09-03)도 같은 이유로 id 뒤 «맨 끝»이다 — 기존 10인자 호출 전수에 11번째 값을 붙였다. */
export const pick = <T>(
  ko: T,
  en: T,
  ja: T = en,
  es: T = en,
  pt: T = en,
  de: T = en,
  zh: T = en,
  zhHant: T = en,
  fr: T = en,
  id: T = en,
  ms: T = en,
  hi: T = en
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
    : i18n.locale === "fr"
    ? fr
    : i18n.locale === "id"
    ? id
    : i18n.locale === "ms"
    ? ms
    : i18n.locale === "hi"
    ? hi
    : en;
