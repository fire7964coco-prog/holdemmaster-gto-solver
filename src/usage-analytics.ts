/*
 * 이용 계측 (본체 MB-477 · 2026-10-31) — solver.holdemmaster.com 빌드 전용.
 * 다른 빌드는 webpack이 이 모듈을 src/usage-analytics-off.ts(빈 함수)로 바꿔 문다(build/variants.js).
 *
 * 🔴 금지선: 카드·보드·레인지·핸드·스택·액션, 사용자 ID·이메일·닉네임·공유 ID·자유 입력 글자를 보내지 않는다.
 *    속성은 이벤트당 2개 · 값은 아래의 고정 값만. 슬라이더·반복 진행률·트레이너 문제별 기록처럼 잦은 동작은 보내지 않는다.
 * 호출은 메인 스레드에서만(워커 금지). 수집 실패가 앱을 막으면 안 되므로 모든 호출을 try로 감싼다.
 */
import { inject, track } from "@vercel/analytics";
import { i18n } from "./i18n";
import { countUsage, setExitKey, setupUsageDb } from "./usage-db";

export type UsageFeature =
  | "custom"
  | "hand_review"
  | "trainer"
  | "presets"
  | "preflop"
  | "equity";

// 소개·사용법은 기능이 아니라 안내라서 보내지 않는다
const FEATURE_OF_VIEW: Partial<Record<string, UsageFeature>> = {
  "oop-range": "custom",
  "ip-range": "custom",
  board: "custom",
  "tree-config": "custom",
  "run-solver": "custom",
  trainer: "trainer",
  presets: "presets",
  preflop: "preflop",
  equity: "equity",
};

const SCRIPT_PATH = "/_vercel/insights/script.js";
const VIEW_VALUE = /^[a-z-]{1,32}$/;
const REASON_VALUE = /^[a-z0-9_]{1,40}$/;

/** 쿼리는 view만 남기고 전부 지운다 — ?spot= 등 공유 값이 분석 데이터로 나가면 안 된다 */
const cleanUrl = (raw: string, entryView: string | null) => {
  const url = new URL(raw);
  const view = url.searchParams.get("view") ?? entryView;
  url.search = view && VIEW_VALUE.test(view) ? `?view=${view}` : "";
  url.hash = "";
  return url.toString();
};

/* ── 우리 DB에만 적는 «개선용» 열쇠(본체 MB-587·588) — 전부 내용 없는 고정 코드 · 숫자는 구간 이름으로만 · 조각당 32자 ── */
const PART = /^[a-z0-9_]{1,32}$/;
const viewKey = (view: string) => {
  const key = view.replace(/-/g, "_");
  return PART.test(key) ? key : "other";
};
/** 고정 식별자(카테고리·탭 이름) → 열쇠 조각. 형식에 안 맞으면 other */
const codeKey = (code: string) => {
  const key = code.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return PART.test(key) ? key : "other";
};

/** 탭 세션에 이름별로 cap번까지만(true = 이번에 세도 된다) — 저장소를 못 쓰면 이 페이지 메모리로만 막는다 */
const SESSION_COUNTS_KEY = "usage.session_counts";
const sessionCounts = new Map<string, number>();
const underSessionCap = (name: string, cap = 1) => {
  try {
    let stored: Record<string, number> = {};
    try {
      stored = JSON.parse(sessionStorage.getItem(SESSION_COUNTS_KEY) ?? "{}") ?? {};
    } catch {
      // 저장소를 못 쓰면 메모리 기록만
    }
    const used = Math.max(sessionCounts.get(name) ?? 0, Number(stored[name]) || 0);
    if (used >= cap) return false;
    sessionCounts.set(name, used + 1);
    try {
      sessionStorage.setItem(SESSION_COUNTS_KEY, JSON.stringify({ ...stored, [name]: used + 1 }));
    } catch {
      // 저장소를 못 쓰면 메모리 기록만
    }
    return true;
  } catch {
    return false;
  }
};

/** 걸린 시간 구간(앱 첫 화면 · 계산 엔진 준비) */
const loadBucket = (ms: number) => (ms < 1000 ? "lt1s" : ms < 3000 ? "1_3s" : ms < 6000 ? "3_6s" : "6splus");

/** 공유 링크로 들어온 탭인가(첫 주소 기준) — ?spot= = 직접 계산 · ?daily=1 = 오늘의 문제(트레이너) */
const SHARED_KEY = "usage.shared";
const sharedOfEntry = (() => {
  try {
    const params = new URLSearchParams(location.search);
    return params.has("spot") ? "custom" : params.get("daily") === "1" ? "trainer" : null;
  } catch {
    return null;
  }
})();
const sharedFeature = () => {
  try {
    return sessionStorage.getItem(SHARED_KEY);
  } catch {
    return null;
  }
};
/** 공유로 온 뒤 첫 계산(트레이너는 첫 답) — 그 탭 세션 1회 */
const countSharedCalc = (feature: string) => {
  if (sharedFeature() === feature && underSessionCap(`shared_calc:${feature}`)) countUsage(`shared_calc:${feature}`);
};
let lastView = "start";
// 직접 계산의 다섯 화면 — 어느 단계까지 갔는지(세션당 단계별 1회)
const STEP_VIEWS = ["oop-range", "ip-range", "board", "tree-config", "run-solver"];
const FAIL_KIND = /^(?:solve|finalize)_(memory|oob|crash|worker_lost|init_timeout|replaced|other)(?:_m\d_(?:st|mt))?$/;
/** Vercel reason(solve_memory_m3_mt · review_worker_timeout …) → fail_memory · fail_worker_timeout. 멈춤 버튼은 실패와 따로 stop */
const failKey = (reason: string) => {
  if (reason === "user_stop") return "stop";
  const kind = FAIL_KIND.exec(reason)?.[1] ?? reason.replace(/^review_/, "");
  const code = kind.replace(/[^a-z0-9_]/g, "").slice(0, 27);
  return code ? `fail_${code}` : "fail_other";
};
const DONE_KEY: Record<string, string> = {
  "<10": "done_lt10",
  "10-60": "done_10_60",
  "60-300": "done_60_300",
  "300+": "done_300plus",
};
const ERROR_CAP = 20; // 같은 오류가 되풀이돼도 탭당 이만큼만
let errorCount = 0;
const countAppError = () => {
  if (errorCount++ < ERROR_CAP) countUsage(`app_error:${lastView}`);
};

export const setupAnalytics = () => {
  setupUsageDb();
  setExitKey(() => `exit:${lastView}`);
  try {
    // 스크립트 오류만 센다(메시지는 안 보낸다) — 이미지·스크립트 로딩 실패는 error 객체가 없어 빠진다
    window.addEventListener("error", (event) => event.error && countAppError());
    window.addEventListener("unhandledrejection", countAppError);
  } catch {
    // 수집 실패는 앱과 무관하다
  }
  try {
    // App.vue가 마운트하며 주소에서 ?view=를 지우므로, 첫 페이지뷰에 쓸 값을 먼저 잡아 둔다
    let entryView = new URLSearchParams(location.search).get("view");

    // errors.ts의 로딩 실패 기록보다 먼저 받아 끊는다 — 광고 차단으로 이 스크립트만 막혀도
    // 사용자에게 오류 안내가 뜨면 안 된다. index.ts에서 setupErrorCapture보다 먼저 불러야 한다.
    window.addEventListener(
      "error",
      (event) => {
        const target = event.target as HTMLScriptElement | null;
        if (target?.tagName === "SCRIPT" && target.src.includes(SCRIPT_PATH)) {
          event.stopImmediatePropagation();
        }
      },
      true
    );

    inject({
      mode: "production",
      beforeSend: (event) => {
        try {
          const url = cleanUrl(event.url, event.type === "pageview" ? entryView : null);
          if (event.type === "pageview") entryView = null;
          return { ...event, url };
        } catch {
          return null; // 정리하지 못한 주소는 보내지 않는다
        }
      },
    });
  } catch {
    // 수집 실패는 앱과 무관하다
  }
};

const send = (name: string, data: Record<string, string>) => {
  // 우리 DB에는 «이벤트:기능» 횟수만(usage-db.ts) — Vercel과 같은 이름이라 두 통계를 대조할 수 있다
  countUsage(name === "item_save" ? `item_save:${data.kind}` : data.feature ? `${name}:${data.feature}` : name);
  try {
    track(name, data);
  } catch {
    // 수집 실패는 앱과 무관하다
  }
};

const OPENED_KEY = "usage.opened";
const opened = new Set<string>();

const alreadyOpened = (feature: string) => {
  if (opened.has(feature)) return true;
  opened.add(feature);
  try {
    const stored: string[] = JSON.parse(sessionStorage.getItem(OPENED_KEY) ?? "[]");
    if (stored.includes(feature)) return true;
    sessionStorage.setItem(OPENED_KEY, JSON.stringify([...stored, feature]));
  } catch {
    // 저장소를 못 쓰면 이 탭의 메모리 기록만으로 1회를 지킨다
  }
  return false;
};

/** 기능 화면에 처음 들어갈 때(세션당 기능별 1회) */
export const trackFeatureOpen = (view: string) => {
  lastView = viewKey(view);
  if (underSessionCap("entry")) countUsage(`entry:${lastView}`); // 탭 세션의 첫 화면
  if (view === "guide") trackHelpOpen("guide");
  if (STEP_VIEWS.includes(view) && !alreadyOpened(`step:${view}`)) countUsage(`step:${lastView}`);
  const feature = FEATURE_OF_VIEW[view];
  if (!feature || alreadyOpened(feature)) return;
  send("feature_open", { feature, locale: i18n.locale });
};

/** 기능 화면 안의 갈래(오늘의 문제·내 스팟) — 우리 DB에만 적는다(Vercel 이벤트 값은 그대로) · 세션당 1회 */
const subOpened = new Set<string>();
export const trackSubFeatureOpen = (feature: "daily" | "my_spots") => {
  if (subOpened.has(feature)) return;
  subOpened.add(feature);
  countUsage(`feature_open:${feature}`);
};

/* 로그인 — 누른 순간 방식을 적어 두었다가(탭 저장소 · 공개 앱 ↔ /study/ 같은 탭) 돌아와서 읽는다. 계정 내용은 보내지 않는다 */
const LOGIN_METHOD_KEY = "usage.login_method";
const LOGIN_METHODS = ["google", "kakao", "telegram"];
const loginMethod = (provider: string) => {
  const method = provider.replace(/^custom:/, "");
  return LOGIN_METHODS.includes(method) ? method : "unknown";
};
/** 로그인 버튼을 눌러 공급자 창으로 떠나는 순간(signIn) */
export const trackLoginStart = (provider: string) => {
  try {
    const method = loginMethod(provider);
    try {
      sessionStorage.setItem(LOGIN_METHOD_KEY, method);
    } catch {
      // 저장소를 못 쓰면 돌아와서 unknown으로 센다
    }
    countUsage(`login_start:${method}`);
    // 로그인을 누른 그 순간의 화면(본체 MB-592 ①) — 탭 세션 1회
    if (underSessionCap("login_from")) countUsage(`login_from:${lastView}`);
  } catch {
    // 수집 실패는 앱과 무관하다
  }
};
/** 로그인에서 돌아와 세션을 받은 순간 */
export const trackLogin = () => {
  let method = "unknown";
  try {
    const stored = sessionStorage.getItem(LOGIN_METHOD_KEY);
    sessionStorage.removeItem(LOGIN_METHOD_KEY);
    if (stored && LOGIN_METHODS.includes(stored)) method = stored;
  } catch {
    // 저장소를 못 쓰면 unknown
  }
  countUsage(`login:${method}`);
};

/**
 * 트레이너 답 한 번 + 결과 등급(최선·허용·검토)을 문제 종류별로 — 문제·정답 내용은 보내지 않는다.
 * kind = 문제의 카테고리 고정 값(srp·3bp·4bp·blind) · daily · my_spots · flop_<카테고리>
 */
export const trackTrainerAnswer = (grade: "best" | "good" | "miss", kind: string) => {
  countUsage("trainer_answer");
  try {
    countUsage(`trainer_${grade}:${codeKey(kind)}`);
  } catch {
    // 수집 실패는 앱과 무관하다
  }
  countSharedCalc("trainer");
};

/** 사용자가 입력 오류 안내를 본 순간(안내가 새로 뜰 때) — 칸 = 고정 이름 · 탭 세션에 칸별 5회까지 */
export const trackInputError = (field: string) => {
  const key = `input_error:${codeKey(field)}`;
  if (underSessionCap(key, 5)) countUsage(key);
};

/** 도움말(사용법 화면 · 물음표 풀이)을 연 순간 — 탭 세션에 주제별 1회(마우스만 올려도 열려서) */
export const trackHelpOpen = (topic: string) => {
  const key = `help_open:${codeKey(topic)}`;
  if (underSessionCap(key)) countUsage(key);
};

/** 앱이 첫 화면을 그린 순간(페이지 시작부터 · 탭 세션 1회) */
export const trackAppLoad = () => {
  try {
    if (underSessionCap("load_app")) countUsage(`load_app:${loadBucket(performance.now())}`);
  } catch {
    // 수집 실패는 앱과 무관하다
  }
};
/** 계산 엔진(워커+wasm)이 준비되기까지 — 탭 세션 1회 */
export const trackEngineLoad = (ms: number) => {
  try {
    if (Number.isFinite(ms) && underSessionCap("load_engine")) countUsage(`load_engine:${loadBucket(ms)}`);
  } catch {
    // 수집 실패는 앱과 무관하다
  }
};

/** 계산 결과 화면의 보기 전환(누를 때마다) — tab = 코드의 보기 이름(basics·graphs·compare·chance) */
export const trackResultTab = (tab: string) => {
  try {
    countUsage(`result_tab:${codeKey(tab)}`);
  } catch {
    // 수집 실패는 앱과 무관하다
  }
};

/** 공유 링크로 들어와 그 내용이 열린 순간 — 첫 주소가 공유 링크였을 때만 · 탭 세션 1회 */
export const trackSharedOpen = (feature: "custom" | "trainer") => {
  try {
    if (sharedOfEntry !== feature || !underSessionCap(`shared_open:${feature}`)) return;
    try {
      sessionStorage.setItem(SHARED_KEY, feature);
    } catch {
      // 저장소를 못 쓰면 shared_calc는 못 센다
    }
    countUsage(`shared_open:${feature}`);
  } catch {
    // 수집 실패는 앱과 무관하다
  }
};

/** 설치 — prompt = 브라우저 설치 창을 띄움 · accept = 설치함(창의 수락 또는 appinstalled · 한 번만) */
let installAccepted = false;
export const trackInstall = (stage: "prompt" | "accept") => {
  if (stage === "accept") {
    if (installAccepted) return;
    installAccepted = true;
  }
  countUsage(`install_${stage}`);
};

/** 사용자가 앱 안에서 언어를 바꾼 순간(도착 언어 · 하이픈은 밑줄) */
export const trackLocaleSwitch = (locale: string) => {
  try {
    countUsage(`locale_switch:${codeKey(locale)}`);
  } catch {
    // 수집 실패는 앱과 무관하다
  }
};

/*
 * 직접 계산 설정 구간(⑩) — 시작 때 한 번 구간을 정해 두고 완료·실패 때 같은 값으로 적는다.
 * 하루 합계라 cfg_start_* · cfg_done_* · cfg_fail_* 세 짝으로 «어느 설정에서 실패하나»를 본다.
 * 멈춤 버튼(user_stop)과 버려진 계산(interrupted)은 실패에 넣지 않는다.
 */
export type CalcConfigRaw = {
  boardCards: number;
  effectiveStack: number;
  startingPot: number;
  memoryBytes: number;
  rangePct: number; // 두 레인지 콤보 비중 평균 %
  targetPct: number;
  singleThread: boolean;
  betSizes: number; // 베팅 사이즈 칸에 적힌 크기 개수 합
};
const GB = 1024 * 1024 * 1024;
const configBuckets = (raw: CalcConfigRaw) => {
  const out: string[] = [];
  const add = (axis: string, bucket: string | null) => {
    if (bucket) out.push(`${axis}:${bucket}`);
  };
  add("street", raw.boardCards === 3 ? "flop" : raw.boardCards === 4 ? "turn" : raw.boardCards === 5 ? "river" : null);
  const spr = raw.startingPot > 0 ? raw.effectiveStack / raw.startingPot : NaN;
  add("spr", !Number.isFinite(spr) ? null : spr < 1 ? "lt1" : spr < 3 ? "1_3" : spr < 6 ? "3_6" : spr < 13 ? "6_13" : "13plus");
  const gb = raw.memoryBytes / GB;
  add("mem", !(gb > 0) ? null : gb < 1 ? "lt1g" : gb < 2 ? "1_2g" : gb < 3 ? "2_3g" : "3gplus");
  const r = raw.rangePct;
  add("range", !Number.isFinite(r) ? null : r < 15 ? "lt15" : r < 30 ? "15_30" : r < 50 ? "30_50" : "50plus");
  const t = raw.targetPct;
  add("target", !(t > 0) ? null : t <= 0.3 + 1e-9 ? "le03" : t <= 0.5 + 1e-9 ? "le05" : t <= 1 + 1e-9 ? "le1" : "gt1");
  add("threads", raw.singleThread ? "st" : "mt");
  const s = raw.betSizes;
  add("sizes", !Number.isFinite(s) || s < 0 ? null : s <= 6 ? "le6" : s <= 12 ? "7_12" : s <= 20 ? "13_20" : "21plus");
  return out;
};
let calcConfig: string[] | null = null;
/** 직접 계산을 시작할 때(trackCalcStart("custom") 바로 앞) — read는 여기서만 부른다(실패해도 계산은 그대로) */
export const trackCalcConfigStart = (read: () => CalcConfigRaw) => {
  calcConfig = null;
  try {
    calcConfig = configBuckets(read());
    for (const key of calcConfig) countUsage(`cfg_start_${key}`);
  } catch {
    calcConfig = null;
  }
};
const closeCalcConfig = (stage: "done" | "fail" | null) => {
  const keys = calcConfig;
  calcConfig = null;
  if (!keys || !stage) return;
  for (const key of keys) countUsage(`cfg_${stage}_${key}`);
};

/** 미리 계산한 자료를 한 번 불러 봤다(계산 시작이 없는 화면의 사용량) */
export const trackLookup = (kind: "flop_study" | "turn_pack") => {
  countUsage(`lookup:${kind}`);
};

export const trackCalcStart = (feature: UsageFeature) => {
  send("calc_start", { feature, locale: i18n.locale });
  countSharedCalc(feature);
};

const secondsBucket = (ms: number) => {
  const seconds = ms / 1000;
  if (seconds < 10) return "<10";
  if (seconds < 60) return "10-60";
  if (seconds < 300) return "60-300";
  return "300+";
};

export const trackCalcDone = (feature: UsageFeature, elapsedMs: number) => {
  send("calc_done", { feature, seconds_bucket: secondsBucket(elapsedMs) });
  countUsage(`${DONE_KEY[secondsBucket(elapsedMs)]}:${feature}`);
  if (feature === "custom") closeCalcConfig("done");
};

/** reason = 짧은 고정 코드 — 형식에 안 맞는 값은 내용을 보내지 않고 other로 */
export const trackCalcFail = (feature: UsageFeature, reason: string) => {
  send("calc_fail", { feature, reason: REASON_VALUE.test(reason) ? reason : "other" });
  countUsage(`${failKey(reason)}:${feature}`);
  if (feature === "custom") closeCalcConfig(reason === "user_stop" || reason === "interrupted" ? null : "fail");
};

/** 계산 준비가 멈춰 다시 띄웠다 — 사용자는 실패를 안 봤어도 몇 번이나 나는지 알아야 한다 */
export const trackCalcStall = (feature: UsageFeature) => {
  send("calc_stall", { feature });
};

export const trackShare = (feature: UsageFeature) => {
  send("result_share", { feature, locale: i18n.locale });
};

export const trackSave = (kind: "range" | "config") => {
  send("item_save", { kind, locale: i18n.locale });
};
