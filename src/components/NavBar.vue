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
        <!-- 언어 선택 — 5개 언어(ko/en/ja/es/pt)라 토글 대신 선택 상자.
             닫힌 상태에는 현재 언어의 이름만 보이므로 화면에 외국어가 남지 않는다 -->
        <select
          class="lang-select"
          :aria-label="L.langSwitchLabel"
          :value="locale"
          @change="onLocaleChange"
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="es">Español</option>
          <option value="pt">Português</option>
        </select>
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
    langSwitchLabel: "언어 선택",
  },
  en: {
    brand: "HoldemMaster GTO Solver",
    solver: "Solver",
    results: "Results",
    community: "HoldemMaster",
    communitySuffix: " Community",
    langSwitchLabel: "Select language",
  },
  ja: {
    brand: "HoldemMaster GTOソルバー",
    solver: "ソルバー",
    results: "結果",
    community: "HoldemMaster",
    communitySuffix: " コミュニティ",
    langSwitchLabel: "言語を選択",
  },
  es: {
    brand: "HoldemMaster GTO Solver",
    solver: "Solver",
    results: "Resultados",
    community: "Comunidad",
    // ⚠ 앞의 공백은 U+00A0 — 이 자리는 flex라 일반 공백이 잘린다 (ko/en/ja도 동일)
    communitySuffix: " HoldemMaster",
    langSwitchLabel: "Seleccionar idioma",
  },
  pt: {
    brand: "HoldemMaster GTO Solver",
    solver: "Solver",
    results: "Resultados",
    community: "Comunidade",
    // ⚠ 앞의 공백은 U+00A0 — 이 자리는 flex라 일반 공백이 잘린다 (ko/en/ja도 동일)
    communitySuffix: " HoldemMaster",
    langSwitchLabel: "Selecionar idioma",
  },
} as const;

export default defineComponent({
  components: {
    ComputerDesktopIcon,
    ChartBarIcon,
  },
  setup() {
    const L = computed(() => M[i18n.locale]);
    const onLocaleChange = (event: Event) => {
      const value = (event.target as HTMLSelectElement).value;
      if (
        value === "ko" ||
        value === "en" ||
        value === "ja" ||
        value === "es" ||
        value === "pt"
      )
        setLocale(value);
    };
    return {
      store: useStore(),
      // 언어 전환 시 그 언어의 본체 홈(/en 등)으로 갈아타야 하므로 computed
      communityUrl: computed(() => mainSiteUrl("", "navbar")),
      locale: computed(() => i18n.locale),
      L,
      onLocaleChange,
    };
  },
});
</script>

<style scoped>
/* 전역 select 스타일(어두운 상자 + 테두리)을 네비바용으로 무력화 — 글자만 보이게 */
.lang-select {
  @apply h-full cursor-pointer text-xs md:text-sm font-semibold;
  @apply !border-0 !bg-transparent text-neutral-400 hover:text-neutral-200;
  /* ⚠ 상자 폭은 «가장 긴 항목»(Português)이 정한다 — 포르투갈어를 넣자 390px에서
     네비바가 10px 넘쳤다(en·ja). 모바일에서만 글자를 한 단계 줄여 자리를 만든다.
     왼쪽 여백(pl-2)은 건드리지 말 것 — 줄이면 «ResultadosPortuguês»로 붙어 보인다. */
  @apply !py-0 !pl-2 !pr-6 md:!pr-7;
}
.lang-select:focus {
  @apply !ring-0;
}

.silver-spade {
  background-image: linear-gradient(180deg,rgb(var(--c-metal-1)) 0%,rgb(var(--c-metal-3)) 45%,rgb(var(--c-metal-5)) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
