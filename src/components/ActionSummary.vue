<template>
  <div v-if="tiles.length > 0" class="w-full grid grid-cols-4 gap-1.5">
    <div
      v-for="tile in tiles"
      :key="tile.index"
      class="rounded-md px-2.5 py-1.5 border border-black/30 leading-tight"
      :style="{ 'background-color': tile.bg }"
    >
      <div class="text-xs font-semibold text-white/90 truncate">
        {{ tile.label }}
      </div>
      <div class="flex items-end justify-between mt-0.5">
        <span class="text-lg font-bold text-white tabular-nums">
          {{ $n(tile.freq.toFixed(1)) }}%
        </span>
        <span class="text-[0.65rem] text-white/70 tabular-nums">
          {{ $n(tile.combos.toFixed(1)) }}<br />{{ L.combos }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { Results, Spot, SpotPlayer } from "../result-types";
import { useStore } from "../store";
import { formatAmount } from "../utils";
import { i18n, pick, localizeNumber } from "../i18n";

const M = {
  ko: {
    combos: "콤보",
  },
  en: {
    combos: "combos",
  },
  ja: {
    combos: "コンボ",
  },
  es: {
    combos: "combos",
  },
  pt: {
    combos: "combos",
  },
  de: {
    combos: "Combos",
  },
} as const;

const actionLabel = (
  name: string,
  amount: string,
  unitScale: number,
  pot: number
) => {
  const map: Record<string, string> = pick(
    {
      Fold: "폴드",
      Check: "체크",
      Call: "콜",
      Bet: "벳",
      Raise: "레이즈",
      Allin: "올인",
      "All-in": "올인",
    },
    {
      Fold: "Fold",
      Check: "Check",
      Call: "Call",
      Bet: "Bet",
      Raise: "Raise",
      Allin: "All-in",
      "All-in": "All-in",
    },
    {
      Fold: "フォールド",
      Check: "チェック",
      Call: "コール",
      Bet: "ベット",
      Raise: "レイズ",
      Allin: "オールイン",
      "All-in": "オールイン",
    }
  );
  const label = map[name] ?? name;
  if (!amount || amount === "0") return label;
  const value = Number(amount);
  const shown = `${formatAmount(value, unitScale)}${unitScale === 10 ? "bb" : ""}`;
  if (name === "Bet" && pot > 0) {
    return localizeNumber(`${label} ${shown} (${Math.round((value * 100) / pot)}% ${pick(
      "팟",
      "pot",
      "ポット",
      "del bote",
      "do pote",
      "vom Pot"
    )})`);
  }
  return localizeNumber(`${label} ${shown}`);
};

// 타일 배경: 액션 색을 어두운 배경 위 타일 톤으로 (원색 그대로는 눈부심 → 70% 어둡게 혼합)
const dimColor = (color: string) => {
  const m = color.match(/^#?([0-9a-f]{6})$/i) ?? color.match(/rgb\((\d+), ?(\d+), ?(\d+)\)/);
  let r = 128, g = 128, b = 128;
  if (m && m[1] && m[1].length === 6) {
    r = parseInt(m[1].slice(0, 2), 16);
    g = parseInt(m[1].slice(2, 4), 16);
    b = parseInt(m[1].slice(4, 6), 16);
  } else if (m && m.length === 4) {
    r = +m[1];
    g = +m[2];
    b = +m[3];
  }
  const mix = (v: number) => Math.round(v * 0.45 + 23 * 0.55);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};

export default defineComponent({
  props: {
    results: {
      type: Object as () => Results,
      required: true,
    },
    selectedSpot: {
      type: Object as () => Spot,
      required: true,
    },
    displayPlayer: {
      type: String as () => "oop" | "ip",
      required: true,
    },
    unitScale: {
      type: Number,
      default: 0,
    },
    pot: {
      type: Number,
      default: 0,
    },
  },

  setup(props) {
    const store = useStore();
    const L = computed(() => M[i18n.locale]);
    const tiles = computed(() => {
      const spot = props.selectedSpot;
      const results = props.results;
      if (
        spot.type !== "player" ||
        results.numActions === 0 ||
        spot.player !== props.displayPlayer
      ) {
        return [];
      }

      const playerIndex = spot.player === "oop" ? 0 : 1;
      const weights = results.weights[playerIndex];
      const normalizer = results.normalizer[playerIndex];
      const numHands = weights.length;

      let normalizerSum = 0;
      for (let h = 0; h < numHands; h++) normalizerSum += normalizer[h];
      if (normalizerSum === 0) return [];

      const actions = (spot as SpotPlayer).actions;
      const ret = actions.map((action, i) => {
        let freqSum = 0;
        let combos = 0;
        for (let h = 0; h < numHands; h++) {
          const s = results.strategy[i * numHands + h];
          freqSum += s * normalizer[h];
          combos += s * weights[h];
        }
        return {
          index: action.index,
          label: actionLabel(
            action.name,
            action.amount,
            props.unitScale || store.displayUnitScale,
            props.pot || (spot as SpotPlayer).pot || 0
          ),
          freq: (freqSum * 100) / normalizerSum,
          combos,
          bg: dimColor(action.color),
        };
      });

      // 영상(GTO Wizard)처럼 공격적인 액션(큰 벳)부터 표시
      return ret.reverse();
    });

    return { tiles, L };
  },
});
</script>
