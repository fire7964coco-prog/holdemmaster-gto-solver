<template>
  <div
    class="w-full px-4 py-3 rounded-lg bg-neutral-800 border border-neutral-700 text-sm"
  >
    <div class="grid grid-cols-2 gap-x-6">
      <div>
        <div class="font-semibold text-neutral-300">{{ L.hands }}</div>
        <div v-if="breakdown.made.length === 0" class="mt-1 text-neutral-500">
          {{ L.noHands }}
        </div>
        <div
          v-for="(row, i) in breakdown.made"
          :key="row.key"
          class="mt-1.5 leading-tight"
        >
          <div class="flex justify-between">
            <span class="text-neutral-200">{{ row.label }}</span>
            <span class="text-neutral-300 tabular-nums">
              {{ $n(row.pct.toFixed(1)) }}%
            </span>
          </div>
          <div class="mt-0.5 h-1.5 w-full rounded-sm bg-neutral-700">
            <div
              class="h-full rounded-sm"
              :style="{
                width: Math.max(row.pct, 1.5) + '%',
                'background-color': madeColor(i),
              }"
            ></div>
          </div>
        </div>
      </div>

      <div>
        <div class="font-semibold text-neutral-300">{{ L.draws }}</div>
        <div v-if="breakdown.draws.length === 0" class="mt-1 text-neutral-500">
          {{ L.noDraws }}
        </div>
        <div
          v-for="(row, i) in breakdown.draws"
          :key="row.key"
          class="mt-1.5 leading-tight"
        >
          <div class="flex justify-between">
            <span class="text-neutral-200">{{ row.label }}</span>
            <span class="text-neutral-300 tabular-nums">
              {{ $n(row.pct.toFixed(1)) }}%
            </span>
          </div>
          <div class="mt-0.5 h-1.5 w-full rounded-sm bg-neutral-700">
            <div
              class="h-full rounded-sm"
              :style="{
                width: Math.max(row.pct, 1.5) + '%',
                'background-color': drawColor(i),
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { aggregateBreakdown } from "../hand-categories";
import { i18n } from "../i18n";

const M = {
  ko: {
    hands: "핸드",
    noHands: "표시할 핸드가 없습니다",
    draws: "드로우",
    noDraws: "드로우 정보 없음",
  },
  en: {
    hands: "Hands",
    noHands: "No hands to display",
    draws: "Draws",
    noDraws: "No draw information",
  },
  ja: {
    hands: "ハンド",
    noHands: "表示するハンドがありません",
    draws: "ドロー",
    noDraws: "ドロー情報なし",
  },
  es: {
    hands: "Manos",
    noHands: "No hay manos para mostrar",
    draws: "Proyectos",
    noDraws: "Sin información de proyectos",
  },
  pt: {
    hands: "Mãos",
    noHands: "Nenhuma mão para mostrar",
    draws: "Draws",
    noDraws: "Sem informações de draws",
  },
  de: {
    hands: "Hände",
    noHands: "Keine Hände vorhanden",
    draws: "Draws",
    noDraws: "Keine Draw-Informationen",
  },
} as const;

// GTO Wizard 풍 카테고리 바 팔레트 (강한 핸드 → 약한 핸드)
const MADE_PALETTE = [
  "#14b8a6", // teal-500
  "#06b6d4", // cyan-500
  "#0ea5e9", // sky-500
  "#3b82f6", // blue-500
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#a855f7", // purple-500
  "#d946ef", // fuchsia-500
  "#ec4899", // pink-500
  "#f43f5e", // rose-500
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#f59e0b", // amber-500
  "#eab308", // yellow-500
  "#737373", // neutral-500 (미완성)
];

const DRAW_PALETTE = [
  "#f97316", // 콤보
  "#f59e0b", // 플러시 드로우
  "#eab308", // OESD
  "#84cc16", // 거트샷
  "#22d3ee", // 백도어
  "#737373", // 없음
];

export default defineComponent({
  props: {
    cards: {
      type: Array as () => number[],
      required: true,
    },
    weights: {
      type: Array as () => number[],
      required: true,
    },
    board: {
      type: Array as () => number[],
      required: true,
    },
  },

  setup(props) {
    const L = computed(() => M[i18n.locale]);
    const breakdown = computed(() =>
      aggregateBreakdown(props.cards, props.weights, props.board)
    );

    return {
      L,
      breakdown,
      madeColor: (i: number) => MADE_PALETTE[i % MADE_PALETTE.length],
      drawColor: (i: number) => DRAW_PALETTE[i % DRAW_PALETTE.length],
    };
  },
});
</script>
