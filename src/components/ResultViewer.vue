<template>
  <div v-if="!store.isSolverFinished">
    <div class="flex w-full max-w-screen-xl mx-auto px-4 py-6 items-center">
      <span
        v-if="store.isSolverRunning || store.isFinalizing"
        class="spinner inline-block mr-3"
      ></span>
      {{
        !store.hasSolverRun
          ? L.notRun
          : store.isSolverRunning
          ? L.running
          : store.isFinalizing
          ? L.finalizing
          : L.paused
      }}
    </div>
    <ResultLock
      v-if="lockStore.busy || lockStore.error || lockStore.locks.length"
      :selected-spot="null"
      :history="[]"
      path-label="ROOT"
      :results="null"
      :cards="cards"
      :navigation-busy="false"
    />
  </div>

  <div v-else class="result-viewer flex flex-col h-full min-w-0">
    <div
      v-if="lockStore.resultLockCount > 0"
      data-testid="nodelock-banner"
      role="status"
      class="result-lock-banner shrink-0 px-3 py-2 text-sm text-amber-200 bg-amber-950 border-b border-amber-700 break-words"
    >
      {{ lockLabels.banner.replace('{count}', String(lockStore.resultLockCount)) }}
      <span data-testid="nodelock-exploitability-qualifier" class="block mt-1">
        {{ lockLabels.exploitability }}: {{ lockExploitabilityText }} · {{ lockLabels.assumption }}
      </span>
    </div>
    <ResultNav
      ref="resultNav"
      :inert="isCapturing || undefined"
      :is-handler-updated="isHandlerUpdated"
      :is-locked="isLocked || lockStore.busy"
      :cards="cards"
      :dealt-card="dealtCard"
      @update:is-handler-updated="(value) => (isHandlerUpdated = value)"
      @update:is-locked="(value) => (isLocked = value)"
      @trigger-update="onUpdateSpot"
    />

    <div class="result-toolbar">
      <ResultLock
        :selected-spot="selectedSpot"
        :history="selectedHistory"
        :path-label="selectedPathLabel"
        :results="results"
        :cards="cards"
        :navigation-busy="isLocked || isCapturing"
      />
      <CustomTrainerEntry
        v-if="FEATURE_TRAINER"
        :capture="captureForPractice"
        :disabled="isLocked || lockStore.busy || isCapturing || !store.solverResultMeta || !results"
      />
      <div
        v-if="resultNav?.navigationPath.length"
        ref="pathDiv"
        class="result-current-path"
        tabindex="0"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <template v-for="(part, index) in resultNav.navigationPath" :key="index">
          <span v-if="index" class="result-path-arrow" aria-hidden="true">→</span>
          <span :class="{ 'result-path-current': index === resultNav.navigationPath.length - 1 }">{{ part }}</span>
        </template>
      </div>
    </div>

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
      class="result-body flex flex-col md:flex-row flex-grow min-h-0 overflow-y-auto md:overflow-y-visible"
    >
      <template v-if="displayMode === 'basics'">
        <ResultBasics
          class="result-matrix shrink-0 md:shrink md:[flex:11]"
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
        <div class="result-details flex flex-col shrink-0 md:shrink md:[flex:9] md:min-h-0 min-w-0 gap-2">
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
          class="result-matrix shrink-0 md:shrink md:[flex:5]"
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
          class="result-matrix shrink-0 md:shrink md:[flex:5]"
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
import { computed, defineComponent, nextTick, ref, watch } from "vue";
import { useSavedConfigStore, useStore } from "../store";
import { handler } from "../global-worker";
import { i18n, localizeNumber } from "../i18n";
import { useNodeLockStore } from "../node-lock";
import { nodeLockLabels } from "../node-lock-labels";
import { CustomTrainerEntry, createCustomTrainerCapture, FEATURE_TRAINER } from "@features";

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
import ResultLock from "./ResultLock.vue";
import ResultMiddle from "./ResultMiddle.vue";
import ResultBasics from "./ResultBasics.vue";
import ResultTable from "./ResultTable.vue";
import ResultCompare from "./ResultCompare.vue";
import ResultGraphs from "./ResultGraphs.vue";
import ResultChance from "./ResultChance.vue";
import HandBreakdown from "./HandBreakdown.vue";
import ActionSummary from "./ActionSummary.vue";

const M = {
  ko: {
    notRun: "솔버가 실행되지 않았습니다.",
    running: "솔버 실행 중...",
    finalizing: "마무리 중...",
    paused: "솔버가 일시정지되었습니다.",
  },
  en: {
    notRun: "Solver not run yet.",
    running: "Running the solver…",
    finalizing: "Finalizing…",
    paused: "Solver paused.",
  },
  ja: {
    notRun: "ソルバーはまだ実行されていません。",
    running: "ソルバーを実行中…",
    finalizing: "仕上げ処理中…",
    paused: "ソルバーは一時停止中です。",
  },
  es: {
    notRun: "El solver aún no se ha ejecutado.",
    running: "Ejecutando el solver…",
    finalizing: "Finalizando…",
    paused: "El solver está en pausa.",
  },
  pt: {
    notRun: "O solver ainda não foi executado.",
    running: "Executando o solver…",
    finalizing: "Finalizando…",
    paused: "O solver está pausado.",
  },
  de: {
    notRun: "Der Solver wurde noch nicht gestartet.",
    running: "Der Solver rechnet…",
    finalizing: "Wird abgeschlossen…",
    paused: "Der Solver ist pausiert.",
  },
  zh: {
    notRun: "求解器还没有运行。",
    running: "求解器计算中…",
    finalizing: "即将完成…",
    paused: "求解器已暂停。",
  },
  "zh-hant": {
    notRun: "解算器還沒有執行。",
    running: "解算器計算中…",
    finalizing: "即將完成…",
    paused: "解算器已暫停。",
  },
  fr: {
    notRun: "Le solver n'a pas encore été lancé.",
    running: "Calcul en cours…",
    finalizing: "Finalisation…",
    paused: "Solver en pause.",
  },
  id: {
    notRun: "Solver belum dijalankan.",
    running: "Menghitung…",
    finalizing: "Menyelesaikan…",
    paused: "Solver dijeda.",
  },
  ms: {
    notRun: "Solver belum dijalankan.",
    running: "Sedang mengira…",
    finalizing: "Sedang menyelesaikan…",
    paused: "Solver dijeda.",
  },
  hi: {
    notRun: "अभी तक सॉल्वर नहीं चलाया गया है।",
    running: "सॉल्वर चल रहा है…",
    finalizing: "अंतिम चरण पूरा हो रहा है…",
    paused: "सॉल्वर रुका हुआ है।",
  },
} as const;

export default defineComponent({
  components: {
    CustomTrainerEntry,
    ResultNav,
    ResultLock,
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
    const lockStore = useNodeLockStore();
    const lockLabels = computed(nodeLockLabels);
    const lockExploitabilityText = computed(() => {
      const value = lockStore.currentExploitability;
      if (value === null || !Number.isFinite(value)) return "—";
      const scale = store.displayUnitScale;
      return localizeNumber((value / scale).toPrecision(4) + (scale > 1 ? "bb" : ""));
    });
    const savedConfig = useSavedConfigStore();
    const L = computed(() => M[i18n.locale]);
    const resultNav = ref<{
      playPath: (path: number[]) => Promise<boolean>;
      navigationPath: string[];
    } | null>(
      null
    );
    const pathDiv = ref<HTMLDivElement | null>(null);
    watch(() => resultNav.value?.navigationPath.join(" → "), () => {
      if (pathDiv.value) pathDiv.value.scrollLeft = pathDiv.value.scrollWidth;
    }, { flush: "post" });

    /* Navigation */

    const isHandlerUpdated = ref(false);
    const isLocked = ref(false);
    const isCapturing = ref(false);

    const cards = ref<number[][]>([[], []]);
    const dealtCard = ref(-1);

    const selectedSpot = ref<Spot | null>(null);
    const selectedHistory = ref<number[]>([]);
    const selectedPathLabel = ref("ROOT");
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
      selectedHistory.value = [];
      selectedPathLabel.value = "ROOT";
      isLocked.value = false;
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

    const captureForPractice = async () => {
      const meta = store.solverResultMeta;
      const remote = handler;
      if (!FEATURE_TRAINER || !remote || !meta || !store.isSolverFinished ||
        isLocked.value || lockStore.busy || isCapturing.value || !results.value) {
        throw new Error("SNAPSHOT_UNAVAILABLE");
      }
      const epoch = lockStore.epoch;
      const frozenConfig = JSON.parse(JSON.stringify(savedConfig.$state,
        (_key, value) => value instanceof Float32Array ? Array.from(value) : value));
      const originalHistory = selectedChance.value
        ? selectedHistory.value.slice(0, selectedChance.value.index - 1)
        : [...selectedHistory.value];
      const capture = createCustomTrainerCapture({
        remote,
        configSnapshot: frozenConfig,
        locks: JSON.parse(JSON.stringify(lockStore.appliedLocks)),
        ...meta,
        cards: cards.value.map(side => [...side]),
        startingPot: savedConfig.startingPot,
        effectiveStack: savedConfig.effectiveStack,
        board: [...savedConfig.board],
        originalHistory,
        assertCurrent: () => {
          if (handler !== remote || lockStore.epoch !== epoch ||
            !store.isSolverFinished || store.solverResultMeta !== meta) {
            throw new Error("SNAPSHOT_INVALIDATED");
          }
        },
        release: () => { isCapturing.value = false; },
      });
      isCapturing.value = true;
      return capture;
    };

    const onUpdateSpot = (
      newSelectedSpot: Spot | null,
      newSelectedChance: SpotChance | null,
      newCurrentBoard: number[],
      newResults: Results,
      newChanceReports: ChanceReports | null,
      newTotalBetAmount: number[],
      newHistory: number[],
      newPathLabel: string
    ) => {
      dealtCard.value = -1;
      selectedSpot.value = newSelectedSpot;
      selectedChance.value = newSelectedChance;
      currentBoard.value = newCurrentBoard;
      results.value = newResults;
      chanceReports.value = newChanceReports;
      totalBetAmount.value = newTotalBetAmount;
      selectedHistory.value = newHistory;
      selectedPathLabel.value = newPathLabel;
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
      if (isCapturing.value) return;
      dealtCard.value = card;
    };

    return {
      FEATURE_TRAINER,
      captureForPractice,
      isCapturing,
      store,
      lockStore,
      lockLabels,
      lockExploitabilityText,
      L,
      resultNav,
      pathDiv,
      isHandlerUpdated,
      isLocked,
      cards,
      dealtCard,
      selectedSpot,
      selectedHistory,
      selectedPathLabel,
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

<style scoped>
.result-current-path {
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  align-items: center;
  gap: 7px;
  margin-left: auto;
  overflow-x: auto;
  white-space: nowrap;
  color: rgb(var(--c-text-secondary));
  scrollbar-width: thin;
  overscroll-behavior-x: contain;
}
.result-current-path > span { flex-shrink: 0; }
.result-current-path:focus-visible { outline: 2px solid rgb(var(--c-brand)); outline-offset: 2px; }
.result-path-arrow { color: rgb(var(--c-text-muted)); }
.result-path-current { color: rgb(var(--c-brand)); font-weight: 700; }
@media (max-width: 767px) {
  .result-current-path { flex-basis: 100%; min-height: 24px; margin-left: 0; }
  /* One summary instance, moved ahead of the matrix only at mobile widths. */
  .result-details { display: contents; }
  .result-details > * { width: calc(100% - 12px); margin: 0 6px; }
  .result-details > .action-summary { order: -1; margin-top: 6px; }
  .result-details > .result-table { margin-bottom: 10px; }
}
</style>
