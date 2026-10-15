<template>
  <!-- 사이드바 하단 공지(10-15 사장님 ○ · 흐르는 글 아님 · PC만). 문구는 앱에 두지 않고 자료 Worker의 notice.json에서 읽는다 —
       앱 배포 없이 바꾸려고. 파일이 없거나 이 언어·영어 문구가 둘 다 없으면 칸째 안 보인다. -->
  <div v-if="text" class="site-notice" data-testid="site-notice" role="note">
    <a v-if="href" :href="href" target="_blank" rel="noopener">{{ text }}</a>
    <template v-else>{{ text }}</template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import { i18n } from "../i18n";

const NOTICE_URL = "https://holdem-review-data.review-data-worker.workers.dev/notice.json";

type Notice = { text: Record<string, string>; href?: string };

const isNotice = (d: unknown): d is Notice =>
  !!d && typeof d === "object" && !!(d as Notice).text && typeof (d as Notice).text === "object";

export default defineComponent({
  setup() {
    const notice = ref<Notice | null>(null);

    onMounted(async () => {
      try {
        const res = await fetch(NOTICE_URL);
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (isNotice(data)) notice.value = data;
      } catch {
        // 오프라인·차단이면 공지 없이 간다
      }
    });

    const text = computed(() => {
      const t = notice.value?.text;
      const value = t?.[i18n.locale] || t?.en;
      return typeof value === "string" ? value.trim().slice(0, 200) : "";
    });
    // 바깥 링크는 https만
    const href = computed(() => {
      const h = notice.value?.href;
      return typeof h === "string" && h.startsWith("https://") ? h : "";
    });

    return { text, href };
  },
});
</script>

<style scoped>
.site-notice {
  @apply hidden md:block mx-1 mt-1 px-3 py-2 rounded-lg border text-sm leading-snug;
  border-color: rgb(var(--c-brand) / 0.45);
  background: rgb(var(--c-brand) / 0.08);
  color: rgb(var(--c-text-secondary));
  overflow-wrap: anywhere;
}
.site-notice a {
  @apply underline underline-offset-2 hover:text-brand;
}
</style>
