<template>
  <nav
    class="sticky flex top-0 z-30 w-full h-10 shadow-lg px-4 justify-center bg-neutral-800 text-gray-50 border-b border-neutral-700"
  >
    <div class="flex relative w-full">
      <div class="hidden md:flex items-center z-10">
        <span class="pl-4 pr-1.5 text-lg silver-spade select-none" aria-hidden="true"
          >♠</span
        >
        <span class="pr-4 text-lg font-semibold">{{ L.brand }}</span>
      </div>

      <!-- 모바일: 일반 플로우(왼쪽 정렬), md+: 기존처럼 절대배치 중앙 -->
      <div
        class="flex md:absolute md:w-full md:h-full md:left-0 md:top-0 gap-1 md:gap-3 md:justify-center"
      >
        <button
          :class="
            'flex relative w-20 md:w-32 items-center justify-center font-semibold ' +
            'transition-colors hover:bg-neutral-700 hover:text-blue-200 ' +
            (store.navView === 'solver' ? 'bg-neutral-700 text-blue-200' : '')
          "
          @click="store.navView = 'solver'"
        >
          <ComputerDesktopIcon class="w-6 h-6" />
          <span class="pl-1.5 md:pl-3">{{ L.solver }}</span>
        </button>
        <button
          :class="
            'flex relative w-20 md:w-32 items-center justify-center font-semibold ' +
            'transition-colors hover:bg-neutral-700 hover:text-blue-200 ' +
            (store.navView === 'results' ? 'bg-neutral-700 text-blue-200' : '')
          "
          @click="store.navView = 'results'"
        >
          <ChartBarIcon class="w-6 h-6" />
          <span class="pl-1.5 md:pl-3">{{ L.results }}</span>
        </button>
      </div>

      <div class="flex ml-auto h-full items-center z-10">
        <!-- 언어 전환 — 현재 언어가 아닌 쪽을 보여준다 (누르면 그 언어로) -->
        <button
          class="flex px-2 md:px-3 h-full items-center text-sm font-semibold text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
          :aria-label="L.langSwitchLabel"
          @click="toggleLocale"
        >
          {{ L.langSwitch }}
        </button>
        <a
          :href="communityUrl"
          class="flex px-2 md:px-4 h-full items-center font-semibold hover:bg-neutral-700 text-yellow-300 text-sm md:text-base"
          target="_blank"
        >
          {{ L.community }}<span class="hidden md:inline">{{ L.communitySuffix }}</span>
        </a>
        <!-- 소스코드 공개(AGPL) 링크는 소개 페이지 하단 크레딧으로 일원화됨 -->
      </div>
    </div>
  </nav>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { useStore } from "../store";

import { ComputerDesktopIcon, ChartBarIcon } from "@heroicons/vue/24/solid";
import { mainSiteUrl } from "../outbound";
import { i18n, setLocale } from "../i18n";

const M = {
  ko: {
    brand: "홀덤마스터 GTO 솔버",
    solver: "솔버",
    results: "결과",
    community: "홀덤마스터",
    communitySuffix: " 커뮤니티",
    langSwitch: "EN",
    langSwitchLabel: "Switch to English",
  },
  en: {
    brand: "HoldemMaster GTO Solver",
    solver: "Solver",
    results: "Results",
    community: "HoldemMaster",
    communitySuffix: " Community",
    langSwitch: "한국어",
    langSwitchLabel: "한국어로 전환",
  },
} as const;

export default defineComponent({
  components: {
    ComputerDesktopIcon,
    ChartBarIcon,
  },
  setup() {
    const L = computed(() => M[i18n.locale]);
    const toggleLocale = () => setLocale(i18n.locale === "ko" ? "en" : "ko");
    return {
      store: useStore(),
      communityUrl: mainSiteUrl("", "navbar"),
      L,
      toggleLocale,
    };
  },
});
</script>

<style scoped>
.silver-spade {
  background-image: linear-gradient(180deg, #ffffff 0%, #d4d4d4 45%, #8a8a8a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
