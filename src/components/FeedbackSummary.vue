<template>
  <p v-if="text" data-feedback-summary class="mt-1 text-xs text-neutral-300 break-words">{{ text }}</p>
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, ref, watch } from "vue";
import { i18n } from "../i18n";
import { feedbackFeatures } from "../solver-feedback-features";

export default defineComponent({
  setup() {
    const text = ref("");
    let activeRequest: AbortController | null = null;
    let requestNumber = 0;
    watch(() => i18n.locale, async (locale) => {
      const current = ++requestNumber;
      activeRequest?.abort();
      text.value = "";
      if (!feedbackFeatures.summary) return;
      const controller = new AbortController();
      activeRequest = controller;
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        const response = await fetch(
          `https://www.holdemmaster.com/api/solver-reviews/summary?locale=${encodeURIComponent(locale)}`,
          { credentials: "omit", signal: controller.signal }
        );
        if (!response.ok) return;
        const result: unknown = await response.json();
        if (current !== requestNumber || !result || typeof result !== "object") return;
        const value = (result as { text?: unknown }).text;
        // Main site supplies the complete localized string; do not add copy or numbers.
        if (typeof value === "string" && value.trim()) text.value = value;
      } catch {
        // Unavailable summaries have no visible placeholder or error state.
      } finally {
        clearTimeout(timeout);
      }
    }, { immediate: true });
    onBeforeUnmount(() => {
      requestNumber++;
      activeRequest?.abort();
    });
    return { text };
  },
});
</script>
