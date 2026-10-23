/** Only imported by the dedicated F1_TEST_BUILD build; never by the shipping build. */
import { isFeedbackTestHost } from "./solver-feedback-features";
import { beginFeedbackSolve, recordFeedbackSolve } from "./solver-feedback";
import type { useStore } from "./store";
import { pwa } from "./pwa";
export function installFeedbackTestHooks(store: ReturnType<typeof useStore>) {
  if (!isFeedbackTestHost()) return;
  (window as any).__F1_TEST__ = { store, pwa, beginSolve: beginFeedbackSolve, recordSolve: recordFeedbackSolve };
}
