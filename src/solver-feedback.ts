/** F1: app-owned draft/state; all review reads/writes go through the main-site API. */
import { ref } from "vue";
import { getSupabase, hasStoredSession, isClientLoaded, takeLoginPurpose } from "./account";
import { setLocale, type Locale } from "./i18n";
import { solverReviewsUrl } from "./outbound";
import { feedbackFeatures } from "./solver-feedback-features";

const API = "https://www.holdemmaster.com/api/solver-feedback";
export const FEEDBACK_DRAFT_KEY = "solver.feedback.draft.v1";
export const FEEDBACK_SOLVES_KEY = "solver.feedback.solves.v1";
const LOCALES: readonly string[] = ["ko", "en", "ja", "es", "pt", "de", "zh", "zh-hant", "fr", "id", "ms", "hi", "tr", "vi", "ru"];
export type FeedbackDraft = {
  locale: Locale;
  body: string;
  downside: string;
  rating: number | null;
  nickname?: string;
  nicknameUserId?: string;
  pendingSubmit: boolean;
};
export type FeedbackInput = {
  locale: Locale; kind: "review"; body: string; downside?: string;
  rating?: number | null; nickname?: string;
};
export type FeedbackResult = { ok: boolean; error?: string };
export type FeedbackContext = FeedbackResult & {
  nickname: string | null;
  nicknameNeedsConfirm: boolean;
  nicknameLooksLikeEmail: boolean;
  myReview: null | { body: string; downside?: string | null; rating?: number | null };
};
export const feedbackOpen = ref(false);
export const feedbackResumePending = ref(false);
export const feedbackThirdSolve = ref(false);
export const openFeedback = () => { if (feedbackFeatures.feedback) feedbackOpen.value = true; };
export const closeFeedback = () => { feedbackOpen.value = false; feedbackResumePending.value = false; };
export const feedbackLandingUrl = (locale: Locale) => solverReviewsUrl(locale);

export function loadFeedbackDraft(): FeedbackDraft | null {
  if (!feedbackFeatures.feedback) return null;
  try {
    const d = JSON.parse(localStorage.getItem(FEEDBACK_DRAFT_KEY) ?? "null");
    if (!d || !LOCALES.includes(d.locale) || typeof d.body !== "string" ||
      typeof d.downside !== "string" || d.body.length > 20000 || d.downside.length > 20000 ||
      (d.rating !== null && (!Number.isInteger(d.rating) || d.rating < 1 || d.rating > 5)) ||
      (d.nickname !== undefined && typeof d.nickname !== "string") ||
      (d.nicknameUserId !== undefined && typeof d.nicknameUserId !== "string")) return null;
    return { locale: d.locale, body: d.body, downside: d.downside, rating: d.rating,
      ...(d.nickname !== undefined ? { nickname: d.nickname } : {}),
      ...(d.nicknameUserId !== undefined ? { nicknameUserId: d.nicknameUserId } : {}),
      pendingSubmit: d.pendingSubmit === true };
  } catch { return null; }
}
export function saveFeedbackDraft(draft: FeedbackDraft): boolean {
  if (!feedbackFeatures.feedback) return false;
  try { localStorage.setItem(FEEDBACK_DRAFT_KEY, JSON.stringify(draft)); return true; }
  catch { return false; }
}
export function clearFeedbackDraft(): void {
  try { localStorage.removeItem(FEEDBACK_DRAFT_KEY); } catch { /* storage may be unavailable */ }
}

async function accessToken(): Promise<string | null> {
  if (!feedbackFeatures.feedback || (!hasStoredSession() && !isClientLoaded())) return null;
  try {
    const client = await getSupabase();
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    return error ? null : data.session?.access_token ?? null;
  } catch { return null; }
}
export async function getFeedbackSession(): Promise<boolean> { return !!(await accessToken()); }

async function request(token: string, locale: Locale, input?: FeedbackInput): Promise<any> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(input ? API : `${API}?locale=${encodeURIComponent(locale)}`, {
      method: input ? "POST" : "GET", credentials: "omit", signal: controller.signal,
      headers: { Authorization: `Bearer ${token}`, ...(input ? { "Content-Type": "application/json" } : {}) },
      ...(input ? { body: JSON.stringify(input) } : {}),
    });
    const result = await response.json();
    if (!response.ok || result?.ok !== true) return { ok: false,
      error: typeof result?.error === "string" ? result.error : "unavailable" };
    return result;
  } catch { return { ok: false, error: "unavailable" }; }
  finally { window.clearTimeout(timer); }
}
export async function getFeedbackContext(locale: Locale): Promise<FeedbackContext> {
  const empty: FeedbackContext = { ok: false, nickname: null, nicknameNeedsConfirm: false,
    nicknameLooksLikeEmail: false, myReview: null };
  const token = await accessToken();
  if (!token) return { ...empty, error: "login" };
  const result = await request(token, locale);
  if (!result.ok) return { ...empty, error: result.error };
  const review = result.myReview;
  return { ok: true, nickname: typeof result.nickname === "string" ? result.nickname : null,
    nicknameNeedsConfirm: result.nicknameNeedsConfirm === true,
    nicknameLooksLikeEmail: result.nicknameLooksLikeEmail === true,
    myReview: review && typeof review.body === "string" ? {
      body: review.body, downside: typeof review.downside === "string" ? review.downside : null,
      rating: Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5 ? review.rating : null,
    } : null };
}
export async function postFeedback(input: FeedbackInput): Promise<FeedbackResult> {
  const token = await accessToken();
  if (!token) return { ok: false, error: "login" };
  // Explicit allowlist: no device/user metadata, no direct Supabase insert or RPC.
  return request(token, input.locale, { locale: input.locale, kind: "review", body: input.body,
    downside: input.downside, rating: input.rating, nickname: input.nickname });
}

/** Called only after bootstrapAccount has recovered the existing OAuth session. */
export async function resumeFeedbackDraft(): Promise<void> {
  // Only the login round trip started from the feedback form may resume its draft.
  const fromFeedbackLogin = takeLoginPurpose() === "feedback";
  const draft = loadFeedbackDraft();
  if (!fromFeedbackLogin || !draft?.pendingSubmit || !(await getFeedbackSession())) return;
  setLocale(draft.locale);
  feedbackResumePending.value = true;
  openFeedback();
}

/** A new direct solve clears the previous result's one-time prompt. Pause/resume does not. */
export function beginFeedbackSolve(): void { feedbackThirdSolve.value = false; }
export function recordFeedbackSolve(): void {
  feedbackThirdSolve.value = false;
  if (!feedbackFeatures.feedback) return;
  try {
    const raw = localStorage.getItem(FEEDBACK_SOLVES_KEY);
    const state = raw === null ? { count: 0, prompted: false } : JSON.parse(raw);
    if (!Number.isSafeInteger(state.count) || state.count < 0 || typeof state.prompted !== "boolean") return;
    const count = Math.min(state.count + 1, Number.MAX_SAFE_INTEGER);
    const show = count === 3 && !state.prompted;
    // Persist before showing; blocked/corrupt storage errs toward no request.
    localStorage.setItem(FEEDBACK_SOLVES_KEY, JSON.stringify({ count, prompted: state.prompted || show }));
    feedbackThirdSolve.value = show;
  } catch { /* no prompt if persistence cannot guarantee one-time behavior */ }
}
