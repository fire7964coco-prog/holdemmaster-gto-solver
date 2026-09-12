<template>
  <nav
    class="app-nav sticky flex top-0 z-30 w-full h-10 px-3 justify-center bg-neutral-800 text-gray-50 border-b border-neutral-700"
  >
    <div class="flex relative w-full">
      <div class="hidden md:flex items-center z-10">
        <span class="pl-4 pr-1.5 text-lg silver-spade select-none" aria-hidden="true"
          >♠</span
        >
        <span class="pr-4 text-lg font-semibold">{{ brandName }}</span>
      </div>

      <!-- 모바일: 일반 플로우(왼쪽 정렬), md+: 기존처럼 절대배치 중앙
           ⚠ 모바일(390px)에서는 탭 아이콘을 숨긴다 — 탭 폭이 w-20(80px)로 고정이라
           라벨이 긴 언어(es «Resultados» · pt · de «Ergebnisse»)에서 아이콘이 0px로
           찌그러지고 글자가 버튼 밖으로 4px 넘쳐 옆 탭과 붙어 보였다
           (2026-08-21 독일어 UX 검수에서 발견 — es·pt는 이미 라이브에서 그 상태였다) -->
      <div
        class="flex md:absolute md:w-full md:h-full md:left-0 md:top-0 gap-1 md:gap-3 md:justify-center"
      >
        <button
          :class="
            'flex relative w-20 md:w-32 items-center justify-center font-semibold ' +
            'transition-colors hover:bg-neutral-700 hover:text-brand ' +
            (store.navView === 'solver' ? 'app-nav-active bg-neutral-700 text-brand' : '')
          "
          @click="store.navView = 'solver'"
        >
          <ComputerDesktopIcon class="hidden md:block shrink-0 w-6 h-6" />
          <span class="text-sm md:text-base md:pl-3">{{ L.solver }}</span>
        </button>
        <button
          :class="
            'flex relative w-20 md:w-32 items-center justify-center font-semibold ' +
            'transition-colors hover:bg-neutral-700 hover:text-brand ' +
            (store.navView === 'results' ? 'app-nav-active bg-neutral-700 text-brand' : '')
          "
          :disabled="!store.isSolverFinished"
          :aria-disabled="!store.isSolverFinished"
          :title="!store.isSolverFinished ? L.resultsDisabledHint : undefined"
          :aria-describedby="!store.isSolverFinished ? 'results-disabled-hint' : undefined"
          data-testid="nav-results"
          @click="store.navView = 'results'"
        >
          <ChartBarIcon class="hidden md:block shrink-0 w-6 h-6" />
          <span class="text-sm md:text-base md:pl-3">{{ L.results }}</span>
        </button>
        <span v-if="!store.isSolverFinished" id="results-disabled-hint" class="sr-only">{{ L.resultsDisabledHint }}</span>
      </div>

      <div class="flex ml-auto h-full items-center z-10">
        <!-- 언어 선택 — 🔴 npokers(독립 앱) 빌드에만 둔다 (사용자 결정 2026-08-27).
             트레이너 빌드는 본진(holdemmaster.com)이 언어별 랜딩에서 «?lang=xx»를 붙여 보낸다.
             여기서 언어를 또 고르면 그 값이 localStorage를 덮어써서 네비바의 본진 링크까지
             그 언어로 끌려갔다 — 사용자가 지적한 «다른 언어를 고르면 본진도 바뀐다» 현상.
             → 트레이너는 본진 언어에 «페깅»한다. 되돌릴 길은 본진에서 다시 들어오는 것 +
                설치 앱의 경우 매니페스트 start_url에 박아 둔 &lang=xx(설치 시점 언어로 고정).
             ⚠ npokers는 페깅할 본진이 없다(스토어에서 바로 설치). 여기서 지우면 사용자가
                폰 언어에 영구히 갇힌다 — 양쪽 빌드에서 무작정 지우지 말 것.
             ⚠ 항목을 늘리면 상자가 넓어져 «다른 언어» 화면이 밀린다 — select-fit-verify.js 필수 -->
        <select
          v-if="showLangSelect"
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
          <option value="de">Deutsch</option>
          <option value="fr">Français</option>
          <option value="id">Bahasa Indonesia</option>
          <option value="ms">Bahasa Melayu</option>
          <option value="hi">हिन्दी</option>
          <!-- ⚠ 간체·번체는 «별개 언어»다 (용어 자체가 다르다 — 기계 변환 금지).
               두 이름 모두 «자기 글자»로 적어야 그 언어 사용자가 알아본다 -->
          <option value="zh">简体中文</option>
          <option value="zh-hant">繁體中文</option>
        </select>
        <a
          :href="communityUrl"
          class="flex px-2 md:px-4 h-full items-center font-semibold hover:bg-neutral-700 text-brand text-sm"
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
import { BRAND_NAME, IS_NPOKERS } from "../brand";
import { i18n, setLocale } from "../i18n";
import { navResults } from "../nav-labels";

const M = {
  ko: {
    resultsDisabledHint: "⑤ 계산 실행이 끝나면 열립니다",
    solver: "솔버",
    community: "홀덤마스터",
    communitySuffix: " 커뮤니티",
    langSwitchLabel: "언어 선택",
  },
  en: {
    resultsDisabledHint: "Opens when ⑤ Run Solver is finished",
    solver: "Solver",
    community: "HoldemMaster",
    communitySuffix: " Community",
    langSwitchLabel: "Select language",
  },
  ja: {
    resultsDisabledHint: "⑤「ソルバーを実行」が完了すると開きます",
    solver: "ソルバー",
    community: "HoldemMaster",
    communitySuffix: " コミュニティ",
    langSwitchLabel: "言語を選択",
  },
  es: {
    resultsDisabledHint: "Se abre cuando termina ⑤ Calcular",
    solver: "Solver",
    community: "Comunidad",
    // ⚠ 앞의 공백은 U+00A0 — 이 자리는 flex라 일반 공백이 잘린다 (ko/en/ja도 동일)
    communitySuffix: " HoldemMaster",
    langSwitchLabel: "Seleccionar idioma",
  },
  pt: {
    resultsDisabledHint: "Abre quando ⑤ Calcular termina",
    solver: "Solver",
    community: "Comunidade",
    // ⚠ 앞의 공백은 U+00A0 — 이 자리는 flex라 일반 공백이 잘린다 (ko/en/ja도 동일)
    communitySuffix: " HoldemMaster",
    langSwitchLabel: "Selecionar idioma",
  },
  de: {
    resultsDisabledHint: "Öffnet sich, sobald ⑤ Berechnen abgeschlossen ist",
    solver: "Solver",
    community: "HoldemMaster",
    // ⚠ 앞의 공백은 U+00A0 — 이 자리는 flex라 일반 공백이 잘린다 (ko/en/ja도 동일)
    communitySuffix: " Community",
    langSwitchLabel: "Sprache wählen",
  },
  zh: {
    resultsDisabledHint: "⑤ 运行求解器完成后即可打开",
    // 「求解器」= solver의 중국어 정착역 (dpskill·中扑网 실사용 — 리서치 §2)
    solver: "求解器",
    community: "HoldemMaster",
    // ⚠ 앞의 공백은 U+00A0 — 이 자리는 flex라 일반 공백이 잘린다 (ko/en/ja도 동일).
    //   중국어 조판에서도 한자와 라틴문자 사이는 띄우는 것이 표준이다
    communitySuffix: " 社区",
    langSwitchLabel: "选择语言",
  },
  "zh-hant": {
    resultsDisabledHint: "⑤ 執行解算器完成後即可開啟",
    // 「解算器」= solver의 대만 정착역 (본체 브리프 §7-C. 본체 번체 포스팅 42편에서 解算器 25회 ·
    // 求解器 0회 — 간체의 「求解器」와 «일부러» 다르다)
    solver: "解算器",
    community: "HoldemMaster",
    // ⚠ 앞의 공백은 U+00A0 — 이 자리는 flex라 일반 공백이 잘린다 (ko/en/ja도 동일)
    //   「社群」= 대만·홍콩 표기. 본체 /zh-hant 페이지도 「德州撲克大師社群」이다(社區 0회)
    communitySuffix: " 社群",
    langSwitchLabel: "選擇語言",
  },
  fr: {
    resultsDisabledHint: "S’ouvre une fois ⑤ Calculer terminé",
    // «solver»는 프랑스 포커 매체의 지배적 표기다 (le solver — 리서치 §1-1. solveur는 안 쓴다)
    solver: "Solver",
    community: "Communauté",
    // ⚠ 앞의 공백은 U+00A0 — 이 자리는 flex라 일반 공백이 잘린다 (ko/en/ja도 동일)
    communitySuffix: " HoldemMaster",
    langSwitchLabel: "Choisir la langue",
  },
  id: {
    resultsDisabledHint: "Terbuka setelah ⑤ Hitung selesai",
    // «solver»는 본체 id 코퍼스가 영어 그대로 쓴다(26회 — 리서치 §1-1)
    solver: "Solver",
    community: "Komunitas",
    // ⚠ 앞의 공백은 U+00A0 — 이 자리는 flex라 일반 공백이 잘린다 (ko/en/ja도 동일)
    communitySuffix: " HoldemMaster",
    langSwitchLabel: "Pilih bahasa",
  },
  ms: {
    resultsDisabledHint: "Dibuka selepas ⑤ Kira selesai",
    // «solver»는 말레이시아 GTO 매체도 영어 그대로 쓴다 (리서치 §1-3)
    solver: "Solver",
    community: "Komuniti",
    // ⚠ 앞의 공백은 U+00A0 — 이 자리는 flex라 일반 공백이 잘린다 (ko/en/ja도 동일)
    communitySuffix: " HoldemMaster",
    langSwitchLabel: "Pilih bahasa",
  },
  hi: {
    resultsDisabledHint: "⑤ गणना करें पूरा होने पर खुलेगा",
    solver: "सॉल्वर",
    community: "HoldemMaster",
    communitySuffix: " कम्युनिटी",
    langSwitchLabel: "भाषा चुनें",
  },
} as const;

export default defineComponent({
  components: {
    ComputerDesktopIcon,
    ChartBarIcon,
  },
  setup() {
    // 왼쪽 탭 이름은 nav-labels.ts가 정본 — 계산 완료 뒤 RunSolver의 이동 버튼과 글자가 같아야 한다
    const L = computed(() => ({ ...M[i18n.locale], results: navResults[i18n.locale] }));
    const onLocaleChange = (event: Event) => {
      const value = (event.target as HTMLSelectElement).value;
      if (
        value === "ko" ||
        value === "en" ||
        value === "ja" ||
        value === "es" ||
        value === "pt" ||
        value === "de" ||
        value === "zh" ||
        value === "zh-hant" ||
        value === "fr" ||
        value === "id" ||
        value === "ms"
      )
        setLocale(value);
    };
    return {
      store: useStore(),
      // 간판은 빌드별로 다르다 (src/brand.ts — 트레이너 빌드/우리 커뮤니티용 vs npokers 빌드)
      brandName: computed(() => BRAND_NAME[i18n.locale]),
      // 언어 셀렉터는 npokers 빌드 전용 — 트레이너는 본진 언어에 페깅한다(위 템플릿 주석)
      showLangSelect: IS_NPOKERS,
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
  background-image: linear-gradient(
    180deg,
    rgb(var(--c-metal-1)) 0%,
    rgb(var(--c-metal-3)) 45%,
    rgb(var(--c-metal-5)) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
