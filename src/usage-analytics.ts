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
  "hand-review": "hand_review",
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

export const setupAnalytics = () => {
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
  try {
    track(name, data);
  } catch {
    // 수집 실패는 앱과 무관하다
  }
};

const OPENED_KEY = "usage.opened";
const opened = new Set<string>();

const alreadyOpened = (feature: UsageFeature) => {
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
  const feature = FEATURE_OF_VIEW[view];
  if (!feature || alreadyOpened(feature)) return;
  send("feature_open", { feature, locale: i18n.locale });
};

export const trackCalcStart = (feature: UsageFeature) => {
  send("calc_start", { feature, locale: i18n.locale });
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
};

/** reason = 짧은 고정 코드 — 형식에 안 맞는 값은 내용을 보내지 않고 other로 */
export const trackCalcFail = (feature: UsageFeature, reason: string) => {
  send("calc_fail", { feature, reason: REASON_VALUE.test(reason) ? reason : "other" });
};

export const trackShare = (feature: UsageFeature) => {
  send("result_share", { feature, locale: i18n.locale });
};

export const trackSave = (kind: "range" | "config") => {
  send("item_save", { kind, locale: i18n.locale });
};
