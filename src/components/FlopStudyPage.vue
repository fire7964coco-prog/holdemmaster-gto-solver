<template>
  <!-- 플랍 조회 1단계 자리표시 — 실제 화면은 2단계 (참고자료/플랍조회_설계안_2026-10-10.md §7) -->
  <div data-testid="flop-study-page">
    <h2 class="text-lg font-semibold">{{ L.title }}</h2>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { i18n } from "../i18n";
import { flopStudyLabels } from "../flop-study-labels";

export default defineComponent({
  setup() {
    const L = computed(() => flopStudyLabels(i18n.locale));
    return { L };
  },
});
</script>
