<template>
  <div v-if="!store.isSolverFinished">
    <div class="flex w-full max-w-screen-xl mx-auto px-4 py-6 items-center">
      <span
        v-if="store.isSolverRunning || store.isFinalizing"
        class="spinner inline-block mr-3"
      ></span>
      {{
        !store.hasSolverRun
          ? "솔버가 실행되지 않았습니다."
          : store.isSolverRunning
          ? "솔버 실행 중..."
          : store.isFinalizing
          ? "마무리 중..."
          : "솔버가 일시정지되었습니다."
      }}
    </div>
  </div>

  <div v-else class="flex flex-col h-full">
    <ResultNav
      ref="resultNav"
      :is-handler-updated="isHandlerUpdated"
      :is-locked="isLocked"
      :cards="cards"
      :dealt-card="dealtCard"
      @update:is-handler-updated="(value) => (isHandlerUpdated = value)"
      @update:is-locked="(value) => (isLocked = value)"
      @trigger-update="onUpdateSpot"
    />

    <ResultMiddle
      :display-mode="displayMode"
      :chance-mode="chanceMode"
      :auto-player-basics="autoPlayerBasics"
      :auto-player-chance="autoPlayerChance"
      :copy-success="copySuccess"
      @update:display-mode="updateDisplayMode"
      @update:display-options="updateDisplayOptions"
      @copy-to-clipboard="copyRangeTextToClipboard"
      @reset-copy-success="resetCopySuccess"
    />

    <div
      v-if="store.navView === 'results' && selectedSpot && results"
      class="flex flex-col md:flex-row flex-grow min-h-0 overflow-y-auto md:overflow-y-visible"
    >
      <template v-if="displayMode === 'basics'">
        <ResultBasics
          class="shrink-0 h-[24rem] md:h-auto md:shrink md:[flex:11]"
          :cards="cards"
          :selected-spot="selectedSpot"
          :selected-chance="selectedChance"
          :current-board="currentBoard"
          :total-bet-amount="totalBetAmount"
          :results="results"
          :display-options="displayOptions"
          :display-player="displayPlayerBasics"
          :is-compare-mode="false"
          @update-hover-content="onUpdateHoverContent"
        />

        <!-- GTO Wizard식 우측 스택: 액션 빈도 타일 → 핸드/드로우 분류 → 상세 표 -->
        <div class="flex flex-col shrink-0 md:shrink md:[flex:9] md:min-h-0 min-w-0 my-2 mx-2 md:ml-0 gap-2">
          <ActionSummary
            :results="results"
            :selected-spot="selectedSpot"
            :display-player="displayPlayerBasics"
          />

          <HandBreakdown
            class="shrink-0"
            :cards="cards[displayPlayerBasics === 'oop' ? 0 : 1]"
            :weights="results.weights[displayPlayerBasics === 'oop' ? 0 : 1]"
            :board="currentBoard"
          />

          <ResultTable
            class="flex-grow min-h-[20rem] md:min-h-0"
            table-mode="basics"
            :cards="cards"
            :selected-spot="selectedSpot"
            :results="results"
            :display-player="displayPlayerBasics"
            :hover-content="basicsHoverContent"
          />
        </div>
      </template>

      <template v-else-if="displayMode === 'graphs'">
        <ResultGraphs
          :cards="cards"
          :selected-spot="selectedSpot"
          :selected-chance="selectedChance"
          :results="results"
          :chance-reports="chanceReports"
          :display-options="displayOptions"
          :display-player="displayPlayerBasics"
        />
      </template>

      <template v-else-if="displayMode === 'compare'">
        <ResultBasics
          class="shrink-0 h-[24rem] md:h-auto md:shrink md:[flex:5]"
          :cards="cards"
          :selected-spot="selectedSpot"
          :selected-chance="selectedChance"
          :current-board="currentBoard"
          :total-bet-amount="totalBetAmount"
          :results="results"
          :display-options="displayOptions"
          display-player="oop"
          :is-compare-mode="true"
        />

        <ResultCompare
          class="shrink-0 md:shrink md:[flex:2]"
          :selected-spot="selectedSpot"
          :selected-chance="selectedChance"
          :results="results"
        />

        <ResultBasics
          class="shrink-0 h-[24rem] md:h-auto md:shrink md:[flex:5]"
          :cards="cards"
          :selected-spot="selectedSpot"
          :selected-chance="selectedChance"
          :current-board="currentBoard"
          :total-bet-amount="totalBetAmount"
          :results="results"
          :display-options="displayOptions"
          display-player="ip"
          :is-compare-mode="true"
        />
      </template>

      <template v-else-if="displayMode === 'chance' && selectedChance">
        <ResultChance
          :selected-spot="selectedSpot"
          :selected-chance="selectedChance"
          :chance-reports="chanceReports"
          :display-options="displayOptions"
          :display-player="displayPlayerChance"
          @deal-card="onDealCard"
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, ref } from "vue";
import { useSavedConfigStore, useStore } from "../store";
import { handler } from "../global-worker";

import {
  Results,
  ChanceReports,
  Spot,
  SpotChance,
  SpotPlayer,
  DisplayMode,
  DisplayOptions,
  HoverContent,
} from "../result-types";

import ResultNav from "./ResultNav.vue";
import ResultMiddle from "./ResultMiddle.vue";
import ResultBasics from "./ResultBasics.vue";
import ResultTable from "./ResultTable.vue";
import ResultCompare from "./ResultCompare.vue";
import ResultGraphs from "./ResultGraphs.vue";
import ResultChance from "./ResultChance.vue";
import HandBreakdown from "./HandBreakdown.vue";
import ActionSummary from "./ActionSummary.vue";

export default defineComponent({
  components: {
    ResultNav,
    ResultMiddle,
    ResultBasics,
    ResultTable,
    ResultCompare,
    ResultGraphs,
    ResultChance,
    HandBreakdown,
    ActionSummary,
  },

  setup() {
    const store = useStore();
    const savedConfig = useSavedConfigStore();
    const resultNav = ref<{ playPath: (path: number[]) => Promise<boolean> } | null>(
      null
    );

    /* Navigation */

    const isHandlerUpdated = ref(false);
    const isLocked = ref(false);

    const cards = ref<number[][]>([[], []]);
    const dealtCard = ref(-1);

    const selectedSpot = ref<Spot | null>(null);
    const selectedChance = ref<SpotChance | null>(null);
    const currentBoard = ref<number[]>([]);
    const results = ref<Results | null>(null);
    const chanceReports = ref<ChanceReports | null>(null);
    const totalBetAmount = ref([0, 0]);

    const isSolverFinished = ref(false);
    store.$subscribe(async (_, store) => {
      if (isSolverFinished.value !== store.isSolverFinished) {
        if ((isSolverFinished.value = store.isSolverFinished)) {
          await init();
        } else {
          clear();
        }
      }
    });

    const init = async () => {
      if (!handler) return;

      const cardsBuffer = [
        await handler.privateCards(0),
        await handler.privateCards(1),
      ];

      cards.value = Array.from({ length: 2 }, (_, player) => {
        return Array.from(cardsBuffer[player]);
      });

      isHandlerUpdated.value = true;
    };

    const clear = () => {
      cards.value = [[], []];
      selectedSpot.value = null;
      selectedChance.value = null;
      results.value = null;
      chanceReports.value = null;
    };

    // 프리셋 미리보기 데이터 추출용 훅 (도구/e2e/preset-export.js가 사용).
    // 결과 화면의 현재 노드 표시 데이터를 JSON으로 직렬화한다.
    const exportCurrent = () =>
      JSON.stringify({
        cards: cards.value,
        selectedSpot: selectedSpot.value,
        currentBoard: currentBoard.value,
        results: results.value,
        totalBetAmount: totalBetAmount.value,
        startingPot: savedConfig.startingPot,
        effectiveStack: savedConfig.effectiveStack,
        unitScale: store.displayUnitScale,
      });
    const exportHooks = window as unknown as Record<string, unknown>;
    exportHooks.__exportPreview = exportCurrent;
    exportHooks.__exportTrainerDecision = async (path: number[]) => {
      if (!resultNav.value || !(await resultNav.value.playPath(path))) return null;
      await nextTick();
      return exportCurrent();
    };

    const onUpdateSpot = (
      newSelectedSpot: Spot | null,
      newSelectedChance: SpotChance | null,
      newCurrentBoard: number[],
      newResults: Results,
      newChanceReports: ChanceReports | null,
      newTotalBetAmount: number[]
    ) => {
      dealtCard.value = -1;
      selectedSpot.value = newSelectedSpot;
      selectedChance.value = newSelectedChance;
      currentBoard.value = newCurrentBoard;
      results.value = newResults;
      chanceReports.value = newChanceReports;
      totalBetAmount.value = newTotalBetAmount;
      isLocked.value = false;

      chanceMode.value = newSelectedChance?.player ?? "";
    };

    /* Middle Bar */

    const displayMode = ref<DisplayMode>("basics");
    const chanceMode = ref("");

    const displayOptions = ref<DisplayOptions>({
      playerBasics: "auto",
      playerChance: "auto",
      barHeight: "normalized",
      suit: "grouped",
      strategy: "show",
      contentBasics: "default",
      contentGraphs: "eq",
      chartChance: "strategy-combos",
    });

    const copySuccess = ref(0);

    const updateDisplayMode = (mode: DisplayMode) => {
      displayMode.value = mode;
    };

    const updateDisplayOptions = (options: DisplayOptions) => {
      displayOptions.value = options;
    };

    const copyRangeTextToClipboard = async () => {
      const text = "Hello World";
      navigator.clipboard
        .writeText(text)
        .then(() => (copySuccess.value = 1))
        .catch(() => (copySuccess.value = -1));
    };

    const resetCopySuccess = () => {
      copySuccess.value = 0;
    };

    /* Computed */

    const autoPlayerBasics = computed(() => {
      const spot = selectedSpot.value;
      const chance = selectedChance.value;
      if (!spot) return "oop";

      if (chance) {
        return chance.prevPlayer;
      } else if (spot.type === "terminal") {
        return spot.prevPlayer;
      } else {
        return (spot as SpotPlayer).player;
      }
    });

    const autoPlayerChance = computed(() => {
      const spot = selectedSpot.value;
      if (!spot) return "oop";
      if (spot.type === "terminal") {
        return spot.prevPlayer;
      } else {
        return (spot as SpotPlayer).player;
      }
    });

    const displayPlayerBasics = computed(() => {
      const optionPlayer = displayOptions.value.playerBasics;
      if (optionPlayer === "auto") {
        return autoPlayerBasics.value;
      } else {
        return optionPlayer;
      }
    });

    const displayPlayerChance = computed(() => {
      const optionPlayer = displayOptions.value.playerChance;
      if (optionPlayer === "auto") {
        return autoPlayerChance.value;
      } else {
        return optionPlayer;
      }
    });

    /* Results */

    const basicsHoverContent = ref<HoverContent | null>(null);

    const onUpdateHoverContent = (content: HoverContent | null) => {
      basicsHoverContent.value = content;
    };

    const onDealCard = (card: number) => {
      dealtCard.value = card;
    };

    return {
      store,
      resultNav,
      isHandlerUpdated,
      isLocked,
      cards,
      dealtCard,
      selectedSpot,
      selectedChance,
      currentBoard,
      results,
      chanceReports,
      totalBetAmount,
      onUpdateSpot,
      displayMode,
      chanceMode,
      displayOptions,
      updateDisplayMode,
      updateDisplayOptions,
      copySuccess,
      copyRangeTextToClipboard,
      resetCopySuccess,
      autoPlayerBasics,
      autoPlayerChance,
      displayPlayerBasics,
      displayPlayerChance,
      basicsHoverContent,
      onUpdateHoverContent,
      onDealCard,
    };
  },
});
</script>
