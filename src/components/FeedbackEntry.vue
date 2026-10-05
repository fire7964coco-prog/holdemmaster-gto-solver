<template>
  <div ref="entry" class="feedback-result-entries" :style="{ marginBottom: `${bannerInset}px` }">
    <button type="button" data-testid="feedback-fixed-prompt" @click="openFeedback">{{ labels.resultPrompt }}</button>
    <button v-if="feedbackThirdSolve && !compact" type="button" data-testid="feedback-third-prompt" @click="openFeedback">{{ labels.thirdSolvePrompt }}</button>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { i18n } from "../i18n";
import { appLabels } from "../solver-feedback-labels";
import { feedbackThirdSolve, openFeedback } from "../solver-feedback";
import { pwa } from "../pwa";
import { useStore } from "../store";
export default defineComponent({
  props: { compact: { type: Boolean, default: false } },
  setup() {
    const entry = ref<HTMLElement | null>(null);
    const bannerInset = ref(0);
    let observer: ResizeObserver | null = null;
    let disposed = false;
    const store = useStore();
    const measure = () => {
      const banner = document.querySelector<HTMLElement>("[data-feedback-install]");
      const result = entry.value?.parentElement;
      bannerInset.value = banner && result
        ? Math.max(0, result.getBoundingClientRect().bottom - banner.getBoundingClientRect().top + 4) : 0;
    };
    watch(() => [pwa.showBanner, store.navView], async () => {
      observer?.disconnect();
      await nextTick();
      if (disposed) return;
      measure();
      const banner = document.querySelector("[data-feedback-install]");
      if (banner && typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(measure); observer.observe(banner);
      }
    }, { immediate: true, flush: "post" });
    window.addEventListener("resize", measure);
    onBeforeUnmount(() => { disposed = true; observer?.disconnect(); window.removeEventListener("resize", measure); });
    return { entry, bannerInset, labels: computed(() => (appLabels[i18n.locale] ?? appLabels.en)), feedbackThirdSolve, openFeedback };
  },
});
</script>
<style scoped>
.feedback-result-entries {
  flex: 0 0 auto; padding: 2px 10px max(2px, env(safe-area-inset-bottom));
  border-top: 1px solid rgb(var(--c-line)); background: rgb(var(--c-bg-1));
  text-align: center; font-size: 12px; line-height: 1.4;
}
.feedback-result-entries button { display: block; width: 100%; padding: 5px 0; color: rgb(var(--c-text-secondary)); }
.feedback-result-entries button:hover { color: rgb(var(--c-brand)); }
.feedback-result-entries button:focus-visible { outline: 2px solid rgb(var(--c-brand)); outline-offset: -2px; }
</style>
<style>
.feedback-enabled-result.result-workspace-content { height: 100%; min-height: 0; }
.feedback-enabled-result > .result-body { flex: 1 1 0%; overflow-y: auto; }
.feedback-enabled-result > .result-toolbar,
.feedback-enabled-result > .result-middle,
.feedback-enabled-result > .result-nav { flex-shrink: 0; }
</style>
