/** Independent launch switches: enable each only after its main-site API opens. */
declare const __F1_TEST_BUILD__: boolean;
declare const __APP_TARGET__: "trainer" | "npokers";

const LAUNCHED = {
  feedback: false,
  share: false,
  summary: false,
} as const;

/** Normal production builds cannot enable F1 with a query parameter. */
export const isFeedbackTestHost = (): boolean =>
  __F1_TEST_BUILD__ && typeof location !== "undefined" &&
  ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);

const testSwitch = (name: string): boolean =>
  isFeedbackTestHost() && new URLSearchParams(location.search).get(name) === "1";

export const feedbackFeatures = Object.freeze({
  feedback: __APP_TARGET__ === "trainer" && (LAUNCHED.feedback || testSwitch("feedback")),
  share: __APP_TARGET__ === "trainer" && (LAUNCHED.share || testSwitch("feedbackShare")),
  summary: __APP_TARGET__ === "trainer" && (LAUNCHED.summary || testSwitch("feedbackSummary")),
});
