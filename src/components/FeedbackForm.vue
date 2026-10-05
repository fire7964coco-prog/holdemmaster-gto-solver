<template>
  <Teleport to="body">
    <div
      v-if="feedbackOpen"
      class="feedback-overlay"
      :style="viewportStyle"
      @click.self="dismiss"
      @keydown="trapKeys"
    >
      <section
        ref="panel"
        data-feedback-form
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        class="feedback-panel"
        :aria-busy="busy || loading"
      >
        <header class="feedback-header">
          <h2 id="feedback-title">{{ L.formTitle }}</h2>
          <button type="button" data-feedback-close class="feedback-close" :aria-label="A.close" @click="dismiss">×</button>
        </header>

        <div v-if="saved" data-feedback-saved class="feedback-success" role="status">
          <p>{{ L.saved }}</p>
          <a :href="landingUrl" target="_blank" rel="noopener noreferrer">{{ A.viewReviews }}</a>
        </div>

        <template v-else>
          <form id="feedback-editor" class="feedback-content" novalidate @submit.prevent="submit">
            <div v-if="loginStage" data-feedback-login class="feedback-login">
              <p>{{ L.loginTitle }}</p>
              <p class="feedback-draft-preview">{{ body }}</p>
              <button type="button" data-feedback-google class="feedback-secondary" :disabled="busy" @click="login('google')">{{ L.loginGoogle }}</button>
              <button v-if="locale === 'ko'" type="button" data-feedback-kakao class="feedback-secondary" :disabled="busy" @click="login('kakao')">{{ L.loginKakao }}</button>
              <button type="button" class="feedback-text-button" :disabled="busy" @click="cancelLogin">{{ L.nicknameCancel }}</button>
            </div>
            <template v-else>
              <fieldset class="feedback-rating">
                <legend>{{ L.ratingLabel }}</legend>
                <div class="feedback-stars">
                  <button
                    v-for="star in 5"
                    :key="star"
                    type="button"
                    :data-feedback-star="star"
                    :aria-label="`${L.ratingLabel}: ${star}`"
                    :aria-pressed="rating === star"
                    :class="{ chosen: rating !== null && star <= rating }"
                    :disabled="busy"
                    @click="rating = rating === star ? null : star"
                  ><span aria-hidden="true">★</span></button>
                </div>
              </fieldset>

              <label class="feedback-field" for="feedback-body">
                <span class="feedback-field-heading"><span>{{ L.tabReview }}</span><span :class="{ 'feedback-invalid-count': bodyCount > 600 }">{{ bodyCount }} / 600</span></span>
                <textarea
                  id="feedback-body"
                  ref="bodyInput"
                  v-model="body"
                  data-feedback-body
                  rows="4"
                  :placeholder="L.placeholderReview"
                  :disabled="busy"
                  :aria-invalid="bodyCount > 600 || hasLink"
                  :aria-describedby="hasLink ? 'feedback-link-warning' : undefined"
                  @input="markEdited"
                />
              </label>

              <button type="button" data-feedback-downside-toggle class="feedback-text-button feedback-downside-toggle" :aria-expanded="downsideOpen" aria-controls="feedback-downside" :disabled="busy" @click="downsideOpen = !downsideOpen">{{ L.downsideToggle }}</button>
              <label v-if="downsideOpen" class="feedback-field" for="feedback-downside">
                <span class="feedback-field-heading"><span>{{ L.downsidePlaceholder }}</span><span :class="{ 'feedback-invalid-count': downsideCount > 200 }">{{ downsideCount }} / 200</span></span>
                <textarea id="feedback-downside" v-model="downside" data-feedback-downside rows="2" :placeholder="L.downsidePlaceholder" :disabled="busy" :aria-invalid="downsideCount > 200 || hasLink" @input="markEdited" />
              </label>

              <p v-if="hasLink" id="feedback-link-warning" data-feedback-link-warning class="feedback-warning" role="status">{{ L.linkWarn }}</p>

              <div v-if="authenticated && contextReady" class="feedback-name">
                <p v-if="emailNameNeedsChange" class="feedback-warning">{{ L.nicknameEmailWarn }}</p>
                <template v-if="nicknameEditing">
                  <label class="feedback-field" for="feedback-nickname">
                    <span>{{ A.nicknameLabel }}</span>
                    <input id="feedback-nickname" ref="nicknameInput" v-model="nicknameEdit" data-feedback-nickname type="text" autocomplete="nickname" :disabled="busy" @keydown.enter.prevent="saveNickname" />
                  </label>
                  <div class="feedback-name-actions">
                    <button type="button" data-feedback-nickname-save class="feedback-text-button" :disabled="busy" @click="saveNickname">{{ L.nicknameSave }}</button>
                    <button v-if="!emailNameNeedsChange && nickname" type="button" data-feedback-nickname-cancel class="feedback-text-button" :disabled="busy" @click="nicknameEditing = false">{{ L.nicknameCancel }}</button>
                  </div>
                </template>
                <div v-else class="feedback-posting-as">
                  <span>{{ L.postingAs(nickname) }}</span>
                  <button type="button" data-feedback-nickname-change class="feedback-text-button" :disabled="busy" @click="editNickname">{{ L.change }}</button>
                </div>
              </div>
            </template>

            <p v-if="error" data-feedback-error class="feedback-warning" role="alert">{{ errorText }}</p>
          </form>
          <footer v-if="!loginStage" class="feedback-footer">
            <button type="submit" form="feedback-editor" data-feedback-submit class="feedback-primary" :disabled="busy || loading">{{ editing ? L.submitEdit : L.submit }}<span v-if="busy" aria-hidden="true"> …</span></button>
          </footer>
        </template>
      </section>
    </div>
  </Teleport>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { getCurrentUser, signIn } from "../account";
import { i18n, type Locale } from "../i18n";
import { appLabels, feedbackLabels } from "../solver-feedback-labels";
import {
  feedbackOpen, feedbackResumePending, closeFeedback, getFeedbackSession,
  getFeedbackContext, postFeedback, loadFeedbackDraft, saveFeedbackDraft,
  clearFeedbackDraft, feedbackLandingUrl,
} from "../solver-feedback";

// Verbatim value from Holdem_Project/lib/solver-feedback-config.ts LINK_PATTERN
// (same value in lib/participation-config.ts). Final validation belongs to the API.
const LINK_PATTERN = /(https?:\/\/|www\.|\.(com|net|org|kr|io|me|xyz|gg|ly|link|site|shop|top)([/?#]|$|[^a-z0-9]))/i;
const normalized = (value: string) => value.replace(/\r\n/g, "\n").trim();
const charCount = (value: string) => [...normalized(value)].length;

export default defineComponent({
  name: "FeedbackForm",
  setup() {
    const locale = ref<Locale>(i18n.locale);
    const L = computed(() => feedbackLabels[locale.value] ?? feedbackLabels.en);
    const A = computed(() => appLabels[locale.value] ?? appLabels.en);
    const body = ref("");
    const downside = ref("");
    const rating = ref<number | null>(null);
    const nickname = ref("");
    const nicknameEdit = ref("");
    const nicknameWasEdited = ref(false);
    const nicknameOwner = ref<string | undefined>(undefined);
    const originalNickname = ref("");
    const nicknameConfirmed = ref(false);
    const nicknameEditing = ref(false);
    const nicknameRequired = ref(false);
    const looksLikeEmail = ref(false);
    const editing = ref(false);
    const authenticated = ref(false);
    const contextReady = ref(false);
    const loginStage = ref(false);
    const downsideOpen = ref(false);
    const busy = ref(false);
    const loading = ref(false);
    const saved = ref(false);
    const error = ref("");
    const panel = ref<HTMLElement | null>(null);
    const bodyInput = ref<HTMLTextAreaElement | null>(null);
    const nicknameInput = ref<HTMLInputElement | null>(null);
    const viewportHeight = ref(0);
    const viewportTop = ref(0);
    const bodyCount = computed(() => charCount(body.value));
    const downsideCount = computed(() => charCount(downside.value));
    const hasLink = computed(() => LINK_PATTERN.test(body.value) || LINK_PATTERN.test(downside.value));
    const errorText = computed(() => L.value.errors[error.value] || L.value.errors.unavailable);
    const emailNameNeedsChange = computed(() => nicknameRequired.value && looksLikeEmail.value && (!nicknameConfirmed.value || nickname.value === originalNickname.value));
    const landingUrl = computed(() => feedbackLandingUrl(locale.value));
    const viewportStyle = computed(() => viewportHeight.value ? { height: `${viewportHeight.value}px`, top: `${viewportTop.value}px` } : {});
    let initializing = false;
    let changed = false;
    let generation = 0;
    let previousFocus: HTMLElement | null = null;
    let previousOverflow = "";
    let documentLocked = false;
    let accountId: string | null = null;

    const persist = (pendingSubmit = false) => saveFeedbackDraft({
      locale: locale.value, body: body.value, downside: downside.value,
      rating: rating.value, nickname: nicknameWasEdited.value ? nickname.value : undefined,
      nicknameUserId: nicknameWasEdited.value ? nicknameOwner.value : undefined, pendingSubmit,
    });
    const markEdited = () => { changed = true; error.value = ""; };
    watch([body, downside, rating, nickname], () => {
      if (feedbackOpen.value && !initializing && !saved.value) persist(false);
    });
    watch([body, downside, rating], () => { if (!initializing) changed = true; });

    const updateViewport = () => {
      viewportHeight.value = window.visualViewport?.height || window.innerHeight;
      viewportTop.value = window.visualViewport?.offsetTop || 0;
    };
    const lockDocument = () => {
      if (documentLocked) return;
      documentLocked = true;
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      updateViewport();
      window.visualViewport?.addEventListener("resize", updateViewport);
      window.visualViewport?.addEventListener("scroll", updateViewport);
      window.addEventListener("resize", updateViewport);
    };
    const unlockDocument = () => {
      if (!documentLocked) return;
      documentLocked = false;
      document.body.style.overflow = previousOverflow;
      window.visualViewport?.removeEventListener("resize", updateViewport);
      window.visualViewport?.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
      previousFocus?.focus({ preventScroll: true });
    };
    const dismiss = () => {
      if (busy.value) return;
      if (!saved.value) persist(false);
      closeFeedback();
    };
    const trapKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); dismiss(); return; }
      if (event.key !== "Tab") return;
      const nodes = Array.from(panel.value?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled)') || []).filter(node => node.offsetParent !== null);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || !panel.value?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };

    const editNickname = async () => {
      nicknameEdit.value = nickname.value;
      nicknameEditing.value = true;
      await nextTick();
      nicknameInput.value?.focus({ preventScroll: true });
    };
    const saveNickname = () => {
      const candidate = nicknameEdit.value.replace(/\s+/g, " ").trim();
      const size = [...candidate].length;
      if (size < 2) { error.value = "nickname_short"; return false; }
      if (size > 20) { error.value = "nickname_long"; return false; }
      if (LINK_PATTERN.test(candidate) || candidate.includes("@")) { error.value = "nickname_link"; return false; }
      if (nicknameRequired.value && looksLikeEmail.value && candidate === originalNickname.value) { error.value = "nickname_confirm"; return false; }
      nickname.value = candidate;
      nicknameWasEdited.value = true;
      nicknameOwner.value = accountId || undefined;
      nicknameConfirmed.value = true;
      nicknameEditing.value = false;
      error.value = "";
      return true;
    };
    const validate = () => {
      if (rating.value !== null && bodyCount.value === 0) error.value = "rating_needs_body";
      else if (bodyCount.value < 2) error.value = "body_short";
      else if (bodyCount.value > 600) error.value = "body_long";
      else if (downsideCount.value > 200) error.value = "downside_long";
      else if (hasLink.value) error.value = "link";
      else { error.value = ""; return true; }
      return false;
    };

    const loadContext = async (keepDraft: boolean, currentGeneration: number) => {
      const expectedAccountId = accountId;
      const context = await getFeedbackContext(locale.value);
      const currentUser = await getCurrentUser();
      if (!feedbackOpen.value || generation !== currentGeneration) return false;
      if (currentUser?.id !== expectedAccountId) {
        contextReady.value = false;
        authenticated.value = !!currentUser;
        error.value = currentUser ? "unavailable" : "login";
        return false;
      }
      if (!context.ok) {
        if (context.error === "login") authenticated.value = false;
        else error.value = context.error || "unavailable";
        return false;
      }
      contextReady.value = true;
      originalNickname.value = context.nickname || "";
      if (nicknameOwner.value !== accountId) nicknameWasEdited.value = false;
      if (!nicknameWasEdited.value) nickname.value = originalNickname.value;
      nicknameRequired.value = context.nicknameNeedsConfirm;
      looksLikeEmail.value = context.nicknameLooksLikeEmail;
      nicknameConfirmed.value = !!nickname.value && nickname.value !== originalNickname.value;
      editing.value = !!context.myReview;
      if (context.myReview && !keepDraft && !changed) {
        initializing = true;
        body.value = context.myReview.body;
        downside.value = context.myReview.downside || "";
        rating.value = context.myReview.rating ?? null;
        downsideOpen.value = !!downside.value;
        await nextTick();
        initializing = false;
      }
      if (emailNameNeedsChange.value || (nicknameRequired.value && !nickname.value)) {
        nicknameEdit.value = nickname.value;
        nicknameEditing.value = true;
      }
      return true;
    };

    const submit = async () => {
      if (busy.value || loading.value || saved.value || !validate()) return;
      busy.value = true;
      try {
        authenticated.value = await getFeedbackSession();
        if (!authenticated.value) {
          if (!persist(true)) { error.value = "unavailable"; return; }
          loginStage.value = true;
          return;
        }
        const currentUser = await getCurrentUser();
        if (currentUser?.id !== accountId) {
          accountId = currentUser?.id || null;
          contextReady.value = false;
          nicknameWasEdited.value = false;
          nicknameOwner.value = undefined;
          nickname.value = "";
          nicknameEditing.value = false;
        }
        if (!contextReady.value && !(await loadContext(true, generation))) {
          if (!authenticated.value) {
            if (persist(true)) loginStage.value = true;
            else error.value = "unavailable";
          }
          return;
        }
        if (nicknameEditing.value && !saveNickname()) return;
        if (emailNameNeedsChange.value || (nicknameRequired.value && !nickname.value)) {
          error.value = "nickname_confirm";
          await editNickname();
          return;
        }
        persist(false);
        const result = await postFeedback({
          locale: locale.value, kind: "review", body: body.value, downside: downside.value,
          rating: rating.value, nickname: nickname.value,
        });
        if (result.ok) {
          saved.value = true;
          clearFeedbackDraft();
        } else {
          error.value = result.error || "unavailable";
          if (error.value === "login") {
            authenticated.value = false;
            contextReady.value = false;
            if (persist(true)) loginStage.value = true;
            else error.value = "unavailable";
          }
          else if (error.value.startsWith("nickname_")) await editNickname();
        }
      } catch {
        error.value = "unavailable";
      } finally { busy.value = false; }
    };
    const login = async (provider: "google" | "kakao") => {
      if (busy.value || (provider === "kakao" && locale.value !== "ko")) return;
      if (!persist(true)) { error.value = "unavailable"; return; }
      busy.value = true;
      try { await signIn(provider, "feedback"); }
      catch { error.value = "unavailable"; }
      finally { busy.value = false; }
    };
    const cancelLogin = async () => {
      loginStage.value = false;
      persist(false);
      await nextTick();
      bodyInput.value?.focus({ preventScroll: true });
    };

    const initialize = async () => {
      const currentGeneration = ++generation;
      initializing = true;
      changed = false;
      saved.value = false;
      error.value = "";
      busy.value = false;
      loading.value = true;
      loginStage.value = false;
      contextReady.value = false;
      editing.value = false;
      authenticated.value = false;
      accountId = null;
      nicknameRequired.value = false;
      looksLikeEmail.value = false;
      nicknameConfirmed.value = false;
      nicknameEditing.value = false;
      const draft = loadFeedbackDraft();
      const resume = feedbackResumePending.value && !!draft?.pendingSubmit;
      feedbackResumePending.value = false;
      locale.value = resume && draft ? draft.locale : i18n.locale;
      const usableDraft = draft?.locale === locale.value ? draft : null;
      const keepDraft = !!usableDraft && (usableDraft.body.length > 0 || usableDraft.downside.length > 0 || usableDraft.rating !== null || usableDraft.pendingSubmit);
      body.value = usableDraft?.body || "";
      downside.value = usableDraft?.downside || "";
      rating.value = usableDraft?.rating ?? null;
      nickname.value = usableDraft?.nickname || "";
      nicknameWasEdited.value = usableDraft?.nickname !== undefined;
      nicknameOwner.value = usableDraft?.nicknameUserId;
      downsideOpen.value = !!downside.value;
      // Claim before any await: reloads or another auth callback cannot auto-post twice.
      const resumeClaimed = !resume || persist(false);
      if (!resumeClaimed) error.value = "unavailable";
      lockDocument();
      await nextTick();
      initializing = false;
      bodyInput.value?.focus({ preventScroll: true });
      try {
        authenticated.value = await getFeedbackSession();
        if (generation !== currentGeneration || !feedbackOpen.value) return;
        if (authenticated.value) {
          accountId = (await getCurrentUser())?.id || null;
          if (generation !== currentGeneration || !feedbackOpen.value) return;
          await loadContext(keepDraft, currentGeneration);
        }
      } catch { error.value = "unavailable"; }
      finally {
        if (generation === currentGeneration) loading.value = false;
      }
      // A first public name must be seen and confirmed by a click; a draft owned by another account is never sent.
      const sameOwner = !usableDraft?.nicknameUserId || usableDraft.nicknameUserId === accountId;
      if (resume && resumeClaimed && authenticated.value && contextReady.value && sameOwner && !nicknameRequired.value &&
        !emailNameNeedsChange.value && !!nickname.value && !error.value) await submit();
    };

    watch(feedbackOpen, (open) => {
      if (open) void initialize();
      else { generation++; unlockDocument(); }
    }, { immediate: true });
    onBeforeUnmount(() => { generation++; unlockDocument(); });

    return {
      feedbackOpen, locale, L, A, body, downside, rating, nickname, nicknameEdit,
      nicknameEditing, nicknameRequired, emailNameNeedsChange, editing, authenticated, contextReady,
      loginStage, downsideOpen, busy, loading, saved, error, errorText, panel,
      bodyInput, nicknameInput, bodyCount, downsideCount, hasLink,
      landingUrl, viewportStyle, dismiss, trapKeys, markEdited, editNickname,
      saveNickname, submit, login, cancelLogin,
    };
  },
});
</script>

<style scoped>
.feedback-overlay { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgb(0 0 0 / 62%); }
.feedback-panel { width: min(100%, 460px); max-height: 100%; min-height: 0; display: flex; flex-direction: column; color: rgb(var(--c-text-primary)); background: rgb(var(--c-bg-1)); border: 1px solid rgb(var(--c-line)); border-radius: 14px; box-shadow: 0 20px 65px rgb(0 0 0 / 35%); overflow: hidden; font-size: 14px; line-height: 1.45; }
.feedback-header { flex: 0 0 auto; display: flex; align-items: center; gap: 8px; padding: 8px 8px 8px 18px; border-bottom: 1px solid rgb(var(--c-line)); }
.feedback-header h2 { flex: 1; min-width: 0; margin: 0; font-size: 17px; font-weight: 650; line-height: 1.4; }
.feedback-close { flex: 0 0 44px; width: 44px; height: 44px; font-size: 27px; color: rgb(var(--c-text-secondary)); border-radius: 8px; }
.feedback-content { min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 14px 18px 12px; }
.feedback-rating { margin: 0 0 8px; padding: 0; border: 0; }
.feedback-rating legend { font-size: 13px; color: rgb(var(--c-text-secondary)); }
.feedback-stars { display: flex; gap: 4px; }
.feedback-stars button { width: 44px; height: 44px; padding: 0; font-size: 29px; line-height: 1; border-radius: 7px; color: rgb(var(--c-text-muted)); }
.feedback-stars button.chosen { color: rgb(var(--c-brand)); }
.feedback-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; min-width: 0; font-size: 13px; color: rgb(var(--c-text-secondary)); }
.feedback-field-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.feedback-field-heading > :last-child { white-space: nowrap; font-size: 12px; }
.feedback-field textarea, .feedback-field input { display: block; width: 100%; margin: 0; border: 1px solid rgb(var(--c-line)); border-radius: 8px; background: rgb(var(--c-bg-0)); color: rgb(var(--c-text-primary)); padding: 10px 11px; font-size: 16px; line-height: 1.5; box-shadow: none; }
.feedback-field textarea { resize: vertical; min-height: 76px; max-height: 210px; }
#feedback-body { height: 112px; }
#feedback-downside { height: 76px; }
.feedback-field textarea::placeholder { color: rgb(var(--c-text-muted)); font-size: 14px; }
.feedback-field textarea:focus, .feedback-field input:focus { outline: 2px solid rgb(var(--c-brand)); outline-offset: 1px; border-color: transparent; }
.feedback-text-button { min-height: 44px; padding: 7px 0; color: rgb(var(--c-text-secondary)); text-decoration: underline; text-underline-offset: 3px; text-align: left; }
.feedback-downside-toggle { display: block; width: 100%; margin-top: -4px; }
.feedback-name { margin-top: 4px; padding-top: 3px; border-top: 1px solid rgb(var(--c-line)); }
.feedback-posting-as { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 13px; color: rgb(var(--c-text-secondary)); }
.feedback-posting-as span { overflow-wrap: anywhere; }
.feedback-posting-as button { flex-shrink: 0; }
.feedback-name-actions { display: flex; gap: 24px; }
.feedback-warning { margin: 5px 0 8px; color: rgb(var(--c-brand)); font-size: 13px; overflow-wrap: anywhere; }
.feedback-invalid-count { color: rgb(var(--c-brand)); }
.feedback-footer { flex: 0 0 auto; padding: 12px 18px max(12px, env(safe-area-inset-bottom)); border-top: 1px solid rgb(var(--c-line)); background: rgb(var(--c-bg-1)); }
.feedback-primary, .feedback-secondary { min-height: 44px; width: 100%; padding: 10px 14px; border-radius: 8px; font-weight: 600; line-height: 1.4; }
.feedback-primary { background: rgb(var(--c-brand)); color: rgb(var(--c-brand-ink)); }
.feedback-secondary { border: 1px solid rgb(var(--c-line)); background: rgb(var(--c-bg-2)); }
.feedback-login { display: flex; flex-direction: column; gap: 12px; }
.feedback-login > p { margin: 0; }
.feedback-draft-preview { max-height: 130px; overflow-y: auto; white-space: pre-wrap; overflow-wrap: anywhere; padding: 10px 12px; border-radius: 8px; background: rgb(var(--c-bg-0)); color: rgb(var(--c-text-secondary)); }
.feedback-success { padding: 26px 18px; }
.feedback-success p { margin: 0 0 15px; }
.feedback-success a { display: inline-flex; align-items: center; min-height: 44px; color: rgb(var(--c-brand)); text-decoration: underline; text-underline-offset: 3px; }
.feedback-panel button:disabled { opacity: .5; cursor: default; }
.feedback-panel button:focus-visible, .feedback-panel a:focus-visible { outline: 2px solid rgb(var(--c-brand)); outline-offset: 2px; }
@media (max-width: 639px) {
  .feedback-overlay { align-items: flex-end; padding: 0; }
  .feedback-panel { width: 100%; max-height: 100%; border-radius: 14px 14px 0 0; border-bottom: 0; }
  .feedback-content { padding-left: 16px; padding-right: 16px; }
  .feedback-header { padding-left: 16px; }
  .feedback-footer { padding-left: 16px; padding-right: 16px; }
}
</style>
