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
import { MAIN_SITE_CONFIG } from "../main-site";

const NOTICE_URL = "https://holdem-review-data.review-data-worker.workers.dev/notice.json";

type Notice = { text: Record<string, string>; href?: string };

/* 걸러 내기(MB-399 · astra GZ1-01·02) — 값은 src/main-site.ts(기본 빌드는 빈 목록 = 거르지 않음).
 * 링크는 글자가 아니라 해석된 호스트로 본다(%-인코딩 우회 차단) · 해석 실패는 거부. */
const { noticeHrefHosts, noticeBlockedWords } = MAIN_SITE_CONFIG;
const blockedText = (s: string) => {
  const lower = s.toLowerCase();
  return noticeBlockedWords.some((w) => lower.includes(w));
};
const allowedHref = (h: string) => {
  if (!noticeHrefHosts.length) return true;
  try {
    return noticeHrefHosts.includes(new URL(h).hostname.toLowerCase());
  } catch {
    return false;
  }
};

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
      if (typeof value !== "string") return "";
      // 공지는 두 주소가 같이 받는다 — 다른 사이트를 말하는 공지는 띄우지 않는다(MB-399)
      if (blockedText(value)) return "";
      return value.trim().slice(0, 200);
    });
    // 바깥 링크는 https만 · 허용 호스트가 정해져 있으면 그 밖은 링크를 달지 않는다
    const href = computed(() => {
      const h = notice.value?.href;
      if (typeof h !== "string" || !h.startsWith("https://")) return "";
      return allowedHref(h) ? h : "";
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
