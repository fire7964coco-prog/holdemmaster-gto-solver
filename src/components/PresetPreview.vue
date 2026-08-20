<template>
  <div>
    <!-- 상단 바: 돌아가기 + 스팟 정보 + 직접 계산 -->
    <div class="flex flex-wrap items-center gap-2">
      <button class="button-base button-blue" @click="$emit('close')">
        {{ L.backToList }}
      </button>
      <span class="font-bold text-lg ml-1">{{ presetTitleOf(preset) }}</span>
      <span class="font-bold tracking-wide">
        <span
          v-for="(c, i) in boardTexts"
          :key="i"
          :class="'mr-0.5 ' + c.colorClass"
        >
          {{ c.rank }}{{ c.suit }}
        </span>
      </span>
      <!-- 스팟 정보는 칩으로 — 트레이너와 같은 눈금을 쓴다 -->
      <span class="stat-chip">
        {{ L.pot }} <b>{{ preset.startingPot / preset.unitScale }}</b>bb
      </span>
      <span class="stat-chip">
        {{ L.stack }} <b>{{ preset.effectiveStack / preset.unitScale }}</b>bb
      </span>
    </div>

    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm">
      <span class="text-neutral-400">
        {{ L.flopOnlyNote }}
      </span>
      <button
        class="button-base button-green shrink-0"
        @click="$emit('load')"
      >
        {{ L.solveThisSpot }}
      </button>
      <a
        v-if="articleUrl"
        :href="articleUrl"
        target="_blank"
        class="px-1 text-blue-400 hover:underline shrink-0"
      >
        {{ L.readArticle }}
      </a>
    </div>

    <div v-if="error" class="mt-4 text-red-400">
      {{ L.loadError(error) }}
    </div>
    <div v-else-if="!data" class="mt-4">
      <span class="spinner inline-block mr-3"></span>{{ L.loading }}
    </div>

    <template v-else>
      <!-- 플레이어 전환 -->
      <!-- 모바일에서는 선택 상자가 눌려 «OOP (BB (클러...»로 잘렸다 -->
      <div class="flex flex-wrap items-center gap-2 mt-3">
        <span class="text-sm">{{ L.playerLabel }}</span>
        <select
          v-model="displayPlayer"
          class="w-40 md:w-28 px-2 py-1 rounded-lg text-sm"
        >
          <option value="oop">OOP ({{ oopLabelOf(preset) }})</option>
          <option value="ip">IP ({{ ipLabelOf(preset) }})</option>
        </select>
        <span
          v-if="displayPlayer === 'oop'"
          class="basis-full md:basis-auto text-xs text-neutral-400"
        >
          {{ L.oopHint }}
        </span>
      </div>

      <!-- 본문: 결과 화면과 동일한 구도 (모바일 세로 스택 / 데스크톱 좌우) -->
      <div class="flex flex-col md:flex-row mt-3 gap-2">
        <!-- ResultBasics 루트가 h-full이라 높이는 래퍼에서 지정해야 함 -->
        <div class="shrink-0 h-[24rem] md:h-[36rem] md:[flex:11]">
          <ResultBasics
            :cards="data.cards"
            :selected-spot="data.selectedSpot"
            :selected-chance="null"
            :current-board="data.currentBoard"
            :total-bet-amount="data.totalBetAmount"
            :results="data.results"
            :display-options="displayOptions"
            :display-player="displayPlayer"
            :is-compare-mode="false"
          />
        </div>

        <div class="flex flex-col md:[flex:9] min-w-0 gap-2">
          <ActionSummary
            :results="data.results"
            :selected-spot="data.selectedSpot"
            :display-player="displayPlayer"
            :unit-scale="preset.unitScale"
            :pot="preset.startingPot"
          />

          <HandBreakdown
            class="shrink-0"
            :cards="data.cards[displayPlayer === 'oop' ? 0 : 1]"
            :weights="data.results.weights[displayPlayer === 'oop' ? 0 : 1]"
            :board="data.currentBoard"
          />

          <ResultTable
            class="h-[24rem] md:h-[24rem]"
            table-mode="basics"
            :cards="data.cards"
            :selected-spot="data.selectedSpot"
            :results="data.results"
            :display-player="displayPlayer"
            :unit-scale="preset.unitScale"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import {
  ARTICLE_URLS,
  Preset,
  presetTitleOf,
  oopLabelOf,
  ipLabelOf,
} from "../presets";
import { trackOutbound } from "../outbound";
import { Results, Spot, DisplayOptions } from "../result-types";
import { cardText, parseCardString } from "../utils";
import { i18n } from "../i18n";

import ResultBasics from "./ResultBasics.vue";
import ResultTable from "./ResultTable.vue";
import HandBreakdown from "./HandBreakdown.vue";
import ActionSummary from "./ActionSummary.vue";

const M = {
  ko: {
    backToList: "← 목록",
    pot: "팟",
    stack: "스택",
    flopOnlyNote: "플랍 전략입니다. 턴·리버까지 눌러보며 탐색하려면 →",
    solveThisSpot: "이 스팟 직접 계산하기",
    readArticle: "이 스팟 해설 읽기",
    loadError: (e: string) => `미리 계산된 결과를 불러오지 못했습니다: ${e}`,
    loading: "결과 불러오는 중...",
    playerLabel: "플레이어:",
    oopHint: "첫 액션 차례인 플레이어의 전략입니다",
  },
  en: {
    backToList: "← Back",
    pot: "Pot",
    stack: "Stack",
    flopOnlyNote: "Flop strategy only. Want to click through turn and river? →",
    solveThisSpot: "Solve this spot yourself",
    readArticle: "Read the article",
    loadError: (e: string) => `Couldn't load the precomputed results: ${e}`,
    loading: "Loading results...",
    playerLabel: "Player:",
    oopHint: "Strategy for the player who acts first",
  },
  ja: {
    backToList: "← 一覧へ",
    pot: "ポット",
    stack: "スタック",
    flopOnlyNote: "フロップ戦略です。ターン・リバーまでクリックして探索するには →",
    solveThisSpot: "このスポットを自分で計算する",
    readArticle: "このスポットの解説を読む",
    loadError: (e: string) => `計算済みの結果を読み込めませんでした: ${e}`,
    loading: "結果を読み込み中...",
    playerLabel: "プレイヤー:",
    oopHint: "最初にアクションするプレイヤーの戦略です",
  },
  es: {
    backToList: "← Lista",
    pot: "Bote",
    stack: "Stack",
    flopOnlyNote: "Solo estrategia de flop. ¿Quieres explorar turn y river? →",
    solveThisSpot: "Resolver este spot tú mismo",
    readArticle: "Leer el análisis",
    loadError: (e: string) => `No se pudieron cargar los resultados precalculados: ${e}`,
    loading: "Cargando resultados...",
    playerLabel: "Jugador:",
    oopHint: "Estrategia del jugador que actúa primero",
  },
} as const;

type PreviewData = {
  cards: number[][];
  selectedSpot: Spot;
  currentBoard: number[];
  results: Results;
  totalBetAmount: number[];
};

export default defineComponent({
  components: { ResultBasics, ResultTable, HandBreakdown, ActionSummary },

  props: {
    preset: {
      type: Object as () => Preset,
      required: true,
    },
  },

  emits: ["close", "load"],

  setup(props) {
    const data = ref<PreviewData | null>(null);
    const error = ref("");
    const displayPlayer = ref<"oop" | "ip">("oop");

    const displayOptions = ref<DisplayOptions>({
      playerBasics: "oop",
      playerChance: "auto",
      barHeight: "normalized",
      suit: "grouped",
      strategy: "show",
      contentBasics: "default",
      contentGraphs: "eq",
      chartChance: "strategy-combos",
    });

    const fetchData = async () => {
      data.value = null;
      error.value = "";
      displayPlayer.value = "oop";
      try {
        const res = await fetch(`preset-results/${props.preset.id}.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data.value = await res.json();
      } catch (e) {
        error.value = e instanceof Error ? e.message : String(e);
      }
    };

    fetchData();
    watch(() => props.preset.id, fetchData);

    const boardTexts = computed(() =>
      props.preset.board
        .split(" ")
        .map(parseCardString)
        .filter((c): c is number => c !== null)
        .map(cardText)
    );

    // EN posts don't exist yet — return "" so the v-if hides the link in English
    const articleUrl = computed(() =>
      i18n.locale !== "ko"
        ? ""
        : trackOutbound(ARTICLE_URLS[props.preset.id] ?? "", "preset-preview")
    );

    const L = computed(() => M[i18n.locale]);

    return {
      data,
      error,
      displayPlayer,
      displayOptions,
      boardTexts,
      articleUrl,
      L,
      presetTitleOf,
      oopLabelOf,
      ipLabelOf,
    };
  },
});
</script>
