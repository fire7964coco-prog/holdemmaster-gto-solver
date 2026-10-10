/** Independent launch switches: enable each only after its main-site API opens. */
import { i18n } from "./i18n";

declare const __F1_TEST_BUILD__: boolean;
declare const __APP_TARGET__: "trainer" | "npokers";

const LAUNCHED = {
  feedback: true, // 본체 코드 1 라이브 5ac5d755 (10-09)
  share: true, // 본체 코드 2 라이브 1b097803 (MB-215 · 10-10 실제 API 확인)
  summary: true, // 같은 회차 · 후기 3개 미만이면 text "" → 화면에 안 나온다
} as const;

/** Normal production builds cannot enable F1 with a query parameter. */
export const isFeedbackTestHost = (): boolean =>
  __F1_TEST_BUILD__ && typeof location !== "undefined" &&
  ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);

const testSwitch = (name: string): boolean =>
  isFeedbackTestHost() && new URLSearchParams(location.search).get(name) === "1";

/** 본체 후기창 서버가 받지 않는 로케일 — 저장하면 locale 오류가 난다. 본체가 사전에 넣으면 뺀다
 *  (ru: 본체 회신 10-09 «/ru/solver 회차에서 사전에 넣고 다시 알림») */
const FEEDBACK_UNSUPPORTED_LOCALES: readonly string[] = []; // ru: MB-218(10-10) 사전·Supabase 제약 등재로 해제
const feedbackOn = __APP_TARGET__ === "trainer" && (LAUNCHED.feedback || testSwitch("feedback"));

export const feedbackFeatures = Object.freeze({
  /** getter라 화면이 i18n.locale을 따라 다시 그린다(언어를 바꾸면 메뉴가 같이 숨는다) */
  get feedback(): boolean {
    return feedbackOn && !FEEDBACK_UNSUPPORTED_LOCALES.includes(i18n.locale);
  },
  share: __APP_TARGET__ === "trainer" && (LAUNCHED.share || testSwitch("feedbackShare")),
  summary: __APP_TARGET__ === "trainer" && (LAUNCHED.summary || testSwitch("feedbackSummary")),
});
