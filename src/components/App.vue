<template>
  <div class="md:min-w-[1080px]" :style="{ height: clientHeight + 'px' }">
    <NavBar />

    <div
      v-show="store.navView === 'solver'"
      class="flex flex-col md:flex-row w-full mx-auto max-w-screen-xl"
      style="height: calc(100% - 2.5rem)"
    >
      <SideBar class="md:h-[calc(100%-2rem)]" />

      <div
        class="flex-grow min-h-0 my-2 md:my-4 px-3 md:px-6 pt-2 overflow-y-auto md:h-[calc(100%-2rem)]"
      >
        <div class="flex">
          <div
            :class="
              'mb-3 md:mb-5 pl-2 pr-3 pb-0.5 text-base md:text-lg font-bold border-l-8 border-b-2 ' +
              'border-blue-600 rounded rounded-br-none'
            "
          >
            {{ header }}
          </div>
        </div>

        <div v-if="store.sideView === 'about'">
          <AboutPage />
        </div>
        <div v-if="store.sideView === 'guide'">
          <GuidePage />
        </div>
        <div v-if="store.sideView === 'presets'">
          <PresetsPage />
        </div>
        <div v-if="store.sideView === 'trainer'">
          <TrainerPage />
        </div>
        <div v-if="store.sideView === 'preflop'">
          <PreflopChartPage />
        </div>
        <div v-show="store.sideView === 'oop-range'">
          <RangeEditor :player="0" />
        </div>
        <div v-show="store.sideView === 'ip-range'">
          <RangeEditor :player="1" />
        </div>
        <div v-show="store.sideView === 'board'">
          <BoardSelector />
        </div>
        <div v-show="store.sideView === 'tree-config'">
          <TreeConfig />
        </div>
        <div v-show="store.sideView === 'run-solver'">
          <RunSolver />
        </div>
      </div>
    </div>

    <InstallBanner />
    <LaunchScreen />
    <ErrorToast />

    <div
      v-show="store.navView === 'results'"
      class="overflow-y-auto"
      style="height: calc(100% - 2.5rem)"
    >
      <ResultViewer style="height: calc(max(100%, 720px - 2.5rem))" />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { useStore } from "../store";
import { applySpotFromUrl } from "../spot-share";
import { viewFromUrl } from "../pwa";
import { bootstrapAccount } from "../account";
import { i18n } from "../i18n";

import NavBar from "./NavBar.vue";
import SideBar from "./SideBar.vue";
import AboutPage from "./AboutPage.vue";
import GuidePage from "./GuidePage.vue";
import PresetsPage from "./PresetsPage.vue";
import TrainerPage from "./TrainerPage.vue";
import PreflopChartPage from "./PreflopChartPage.vue";
import RangeEditor from "./RangeEditor.vue";
import BoardSelector from "./BoardSelector.vue";
import TreeConfig from "./TreeConfig.vue";
import RunSolver from "./RunSolver.vue";
import ResultViewer from "./ResultViewer.vue";
import InstallBanner from "./InstallBanner.vue";
import LaunchScreen from "./LaunchScreen.vue";
import ErrorToast from "./ErrorToast.vue";

export default defineComponent({
  components: {
    NavBar,
    SideBar,
    AboutPage,
    GuidePage,
    PresetsPage,
    TrainerPage,
    PreflopChartPage,
    RangeEditor,
    BoardSelector,
    TreeConfig,
    RunSolver,
    ResultViewer,
    InstallBanner,
    LaunchScreen,
    ErrorToast,
  },

  setup() {
    const store = useStore();
    const HEADERS = {
      ko: {
        about: "소개",
        guide: "사용법 — 순서대로 따라하기",
        presets: "교육 예제 — 원클릭 스팟",
        trainer: "GTO 트레이너 — 선택의 EV를 확인하세요",
        preflop: "프리플랍 차트 — 오픈 & 수비 레인지",
        "oop-range": "OOP 레인지",
        "ip-range": "IP 레인지",
        board: "보드",
        "tree-config": "트리 설정",
        "run-solver": "솔버 실행",
        treeEdit: "트리 미리보기 & 편집",
      },
      en: {
        about: "About",
        guide: "How to Use — Step by Step",
        presets: "Study Spots — One-Click Examples",
        trainer: "GTO Trainer — See the EV of Every Decision",
        preflop: "Preflop Charts — Opening & Defense Ranges",
        "oop-range": "OOP Range",
        "ip-range": "IP Range",
        board: "Board",
        "tree-config": "Tree Settings",
        "run-solver": "Run Solver",
        treeEdit: "Tree Preview & Edit",
      },
    } as const;
    const header = computed(() => {
      const messages = HEADERS[i18n.locale];
      const base = messages[store.sideView];
      return store.sideView === "tree-config" && store.treeEditOpen
        ? `${base} > ${messages.treeEdit}`
        : base;
    });

    // 로그인에서 돌아온 경우: 세션을 먼저 회수하고 주소를 정리한 뒤 트레이너로 복귀.
    // (앱 진입 화면은 소개라, 트레이너 화면에서만 처리하면 인증 코드를 놓친다)
    void bootstrapAccount().then((returned) => {
      if (returned) store.sideView = "trainer";
    });

    // 공유 링크(?spot=)로 들어온 경우 설정을 적용하고 실행 화면으로
    if (applySpotFromUrl()) {
      store.sideView = "run-solver";
      store.sharedSpotLoaded = true;
      history.replaceState(null, "", location.pathname);
    } else {
      // 홈 화면 아이콘·바로가기(?view=trainer 등)로 들어온 경우 그 화면부터 연다.
      // 공유 링크가 우선이므로 없을 때만 본다.
      const view = viewFromUrl();
      if (view) {
        store.sideView = view;
        history.replaceState(null, "", location.pathname);
      } else if (new URLSearchParams(location.search).has("lang")) {
        // ?lang=은 i18n.ts가 이미 읽어 저장했다 — 주소만 정리
        history.replaceState(null, "", location.pathname);
      }
    }

    const clientHeight = ref(0);

    const updateClientHeight = () => {
      clientHeight.value = Math.min(
        document.documentElement.clientHeight - 0.01,
        Math.max(document.documentElement.clientWidth, 1080) * 0.8
      );
    };

    updateClientHeight();
    window.addEventListener("resize", updateClientHeight);

    return {
      store,
      header,
      clientHeight,
    };
  },
});
</script>
