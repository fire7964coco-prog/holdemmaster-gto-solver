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
              'mb-5 pl-2 pr-3 pb-0.5 text-lg font-bold border-l-8 border-b-2 ' +
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

import NavBar from "./NavBar.vue";
import SideBar from "./SideBar.vue";
import AboutPage from "./AboutPage.vue";
import GuidePage from "./GuidePage.vue";
import PresetsPage from "./PresetsPage.vue";
import TrainerPage from "./TrainerPage.vue";
import RangeEditor from "./RangeEditor.vue";
import BoardSelector from "./BoardSelector.vue";
import TreeConfig from "./TreeConfig.vue";
import RunSolver from "./RunSolver.vue";
import ResultViewer from "./ResultViewer.vue";

export default defineComponent({
  components: {
    NavBar,
    SideBar,
    AboutPage,
    GuidePage,
    PresetsPage,
    TrainerPage,
    RangeEditor,
    BoardSelector,
    TreeConfig,
    RunSolver,
    ResultViewer,
  },

  setup() {
    const store = useStore();
    const header = computed(() => store.headers[store.sideView].join(" > "));

    // 공유 링크(?spot=)로 들어온 경우 설정을 적용하고 실행 화면으로
    if (applySpotFromUrl()) {
      store.sideView = "run-solver";
      store.sharedSpotLoaded = true;
      history.replaceState(null, "", location.pathname);
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
