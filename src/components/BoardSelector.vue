<template>
  <!--
    모바일에서는 카드 폭을 화면에 맞춰 13열이 한 화면에 들어오게 한다.
    고정 40px일 때는 판이 624px라 옆으로 스크롤해야 했다(아래는 400px가 비어 있는데도).
  -->
  <div class="max-w-full md:overflow-x-auto">
    <div v-for="suit in 4" :key="suit" class="flex md:min-w-max">
      <BoardSelectorCard
        v-for="rank in 13"
        :key="rank"
        class="m-0.5 md:m-1"
        :width="cardWidth"
        :font-size="cardFontSize"
        :ratio="cardRatio"
        :card-id="56 - 4 * rank - suit"
        :is-selected="config.board.includes(56 - 4 * rank - suit)"
        @click="toggleCard(56 - 4 * rank - suit)"
      />
    </div>
  </div>

  <div class="flex flex-wrap mt-4 mx-1 gap-3">
    <input
      v-model="boardText"
      type="text"
      :placeholder="L.placeholder"
      class="w-40 px-2 py-1 rounded-lg text-sm"
      @focus="($event.target as HTMLInputElement).select()"
      @change="onBoardTextChange"
    />
    <button class="button-base button-blue" @click="clearBoard">
      {{ L.clear }}
    </button>
    <button class="button-base button-blue" @click="generateRandomBoard">
      {{ L.randomFlop }}
    </button>
  </div>

  <div
    v-if="
      config.board.length >= 3 &&
      config.expectedBoardLength > 0 &&
      config.board.length !== config.expectedBoardLength
    "
    class="mt-5 text-orange-400 font-semibold"
  >
    <span class="underline">{{ L.warnLabel }}</span>
    {{ L.warnBody(config.expectedBoardLength) }}
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onUnmounted, ref } from "vue";
import { useConfigStore } from "../store";
import { cardText, parseCardString } from "../utils";
import { i18n } from "../i18n";

import BoardSelectorCard from "./BoardSelectorCard.vue";

const M = {
  ko: {
    placeholder: "예: AsKd7c",
    clear: "초기화",
    randomFlop: "랜덤 플랍",
    warnLabel: "주의:",
    warnBody: (n: number) =>
      `편집된 트리는 보드 카드 ${n}장을 전제로 합니다.`,
  },
  en: {
    placeholder: "e.g., AsKd7c",
    clear: "Clear",
    randomFlop: "Random Flop",
    warnLabel: "Warning:",
    warnBody: (n: number) =>
      `The edited tree assumes a ${n}-card board.`,
  },
  ja: {
    placeholder: "例: AsKd7c",
    clear: "クリア",
    randomFlop: "ランダムフロップ",
    warnLabel: "注意:",
    warnBody: (n: number) =>
      `編集されたツリーはボードカード${n}枚を前提としています。`,
  },
  es: {
    placeholder: "ej. AsKd7c",
    clear: "Borrar",
    randomFlop: "Flop aleatorio",
    warnLabel: "Atención:",
    warnBody: (n: number) =>
      `El árbol editado asume un board de ${n} carta${n === 1 ? "" : "s"}.`,
  },
} as const;

export default defineComponent({
  components: {
    BoardSelectorCard,
  },

  setup() {
    const config = useConfigStore();
    const boardText = ref("");
    const L = computed(() => M[i18n.locale]);

    // 좁은 화면이면 13열이 폭에 맞게 줄어든다 (데스크톱은 기존 40px 그대로)
    const isNarrow = ref(false);
    const updateNarrow = () => {
      isNarrow.value = window.innerWidth < 768;
    };
    updateNarrow();
    window.addEventListener("resize", updateNarrow);
    onUnmounted(() => window.removeEventListener("resize", updateNarrow));

    const cardWidth = computed(() =>
      isNarrow.value ? "calc((100vw - 2rem) / 13 - 0.25rem)" : "40px"
    );
    const cardFontSize = computed(() => (isNarrow.value ? "0.6rem" : "1rem"));
    // 폭이 좁아진 만큼 세로로 늘려 손가락이 닿는 높이를 확보한다
    const cardRatio = computed(() => (isNarrow.value ? 1.9 : 1.4));

    const toggleCard = (cardId: number, updateText = true) => {
      if (config.board.includes(cardId)) {
        config.board = config.board.filter((card) => card !== cardId);
      } else if (config.board.length < 5) {
        config.board.push(cardId);
        if (config.board.length <= 3) {
          config.board.sort((a, b) => b - a);
        }
      }

      if (updateText) {
        setBoardTextFromButtons();
      }
    };

    const setBoardTextFromButtons = () => {
      boardText.value = config.board
        .map(cardText)
        .map(({ rank, suitLetter }) => rank + suitLetter)
        .join(", ");
    };

    const onBoardTextChange = () => {
      config.board = [];

      const cardIds = boardText.value
        // Allow pasting in things like [Ah Kd Qc], by reformatting to Ah,Kd,Qc
        .trim()
        .replace(/[^A-Za-z0-9\s,]/g, "")
        .replace(/\s+/g, ",")
        .split(",")
        .map(parseCardString)
        .filter((cardId): cardId is number => cardId !== null);

      new Set(cardIds).forEach((cardId) => toggleCard(cardId, false));
      setBoardTextFromButtons();
    };

    const clearBoard = () => {
      config.board = [];
      setBoardTextFromButtons();
    };

    const generateRandomBoard = () => {
      config.board = [];

      while (config.board.length < 3) {
        const randomCard = Math.floor(Math.random() * 52);
        if (!config.board.includes(randomCard)) {
          config.board.push(randomCard);
        }
      }

      config.board.sort((a, b) => b - a);
      setBoardTextFromButtons();
    };

    return {
      L,
      config,
      boardText,
      cardWidth,
      cardFontSize,
      cardRatio,
      toggleCard,
      onBoardTextChange,
      clearBoard,
      generateRandomBoard,
    };
  },
});
</script>
