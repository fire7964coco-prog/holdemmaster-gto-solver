<template>
  <div class="range-editor flex flex-col md:flex-row md:flex-wrap gap-4 mt-1">
    <div class="shrink-0 w-full md:w-[34rem] max-w-full min-w-0">
      <p data-testid="range-mobile-hint" class="md:hidden mb-2 text-xs text-neutral-500">{{ L.mobileHint }}</p>
      <div class="range-cell-summary md:hidden" aria-live="polite" aria-atomic="true">
        <strong>{{ activeCell ? cellText(activeCell.row, activeCell.col) : '—' }}</strong>
        <span>· {{ L.weight }} {{ activeCell ? $n(cellValue(activeCell.row, activeCell.col).toString()) + '%' : '—' }}</span>
      </div>
      <table class="w-full table-fixed select-none snug" role="grid" :aria-label="player === 0 ? 'OOP' : 'IP'" @mouseleave="dragEnd">
        <tr v-for="row in 13" :key="row" class="h-7 md:h-9" role="row">
          <td
            v-for="col in 13"
            :key="col"
            class="relative md:w-[2.625rem] border border-neutral-700"
            :class="{ 'range-cell-active': activeCell?.row === row && activeCell?.col === col }"
            role="gridcell"
            :tabindex="(activeCell?.row ?? 1) === row && (activeCell?.col ?? 1) === col ? 0 : -1"
            :aria-selected="cellValue(row, col) > 0"
            :aria-label="`${cellText(row, col)} · ${L.weight} ${$n(cellValue(row, col).toString())}%`"
            :data-range-cell="`${row}-${col}`"
            @focus="activeCell = { row, col }"
            @keydown="onCellKeydown($event, row, col)"
            @mousedown="dragStart(row, col)"
            @mouseup="dragEnd"
            @mouseenter="mouseEnter(row, col)"
          >
            <div
              :class="
                'absolute w-full h-full left-0 top-0 ' +
                (row === col ? 'bg-neutral-700' : 'bg-neutral-800')
              "
            >
              <div
                class="absolute w-full h-full left-0 top-0 bg-bottom bg-no-repeat"
                :style="{
                  'background-image': `linear-gradient(${yellow500} 0% 100%)`,
                  'background-size': `100% ${cellValue(row, col)}%`,
                }"
              ></div>
            </div>
            <div
              :class="
                'absolute -top-px left-[0.1875rem] z-10 text-shadow text-xs md:text-base ' +
                (cellValue(row, col) > 0 ? 'text-white' : 'text-neutral-500')
              "
            >
              {{ cellText(row, col) }}
            </div>
            <div
              class="hidden md:block absolute bottom-px right-1 z-10 text-sm text-shadow text-white"
            >
              {{
                cellValue(row, col) > 0 && cellValue(row, col) < 100
                  ? $n(cellValue(row, col).toFixed(1))
                  : ""
              }}
            </div>
          </td>
        </tr>
      </table>

      <div class="mt-3">
        <div class="flex items-start gap-2">
          <input
            v-model="rangeText"
            type="text"
            :name="`range-${player}`"
            :aria-label="player === 0 ? 'OOP' : 'IP'"
            :aria-invalid="!!rangeTextError"
            autocomplete="off"
            :spellcheck="false"
            :class="
              'min-w-0 flex-grow px-2 py-1 rounded-lg text-sm ' +
              (rangeTextError ? 'input-error' : '')
            "
            @focus="($event.target as HTMLInputElement).select()"
            @change="onRangeTextChange"
          />

          <button class="button-base button-blue" @click="clearRange">
            {{ L.clear }}
          </button>
        </div>

        <div v-if="rangeTextError" class="mt-1 text-red-400" role="status">
          {{ L.errorPrefix }} {{ rangeTextError }}
        </div>
      </div>

      <div class="range-weight flex flex-wrap gap-2 mt-3 items-center text-sm tabular-nums">
        <div>
          {{ L.weight }}
          <input
            v-model="weight"
            type="range"
            :aria-label="L.weight"
            class="ml-2 w-28 sm:w-40 align-middle"
            min="0"
            max="100"
            step="5"
            @change="onWeightChange"
          />
          <input
            v-model="weight"
            type="number"
            :aria-label="L.weight"
            :class="
              'w-16 ml-2 px-2 py-1 rounded-lg text-sm text-center ' +
              (weight < 0 || weight > 100 ? 'input-error' : '')
            "
            min="0"
            max="100"
            step="5"
            @change="onWeightChange"
          />
          %
        </div>

        <span class="inline-block ml-auto">
          {{ $n(numCombos.toFixed(1)) }} {{ L.combos }} ({{
            $n(((numCombos * 100) / ((52 * 51) / 2)).toFixed(1))
          }}%)
        </span>
      </div>
    </div>

    <div class="flex-grow min-w-0 w-full md:w-[15rem] max-w-full md:max-w-[18rem]">
      <DbItemPicker
        store-name="ranges"
        :index="player"
        :value="rangeText"
        :allow-save="rangeText !== '' && rangeTextError === ''"
        @load-item="loadRange"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import { useStore, useConfigStore } from "../store";
import { ranks, rankPat } from "../utils";
import { RangeManager } from "../../pkg/range/range";
import { i18n } from "../i18n";

import DbItemPicker from "./DbItemPicker.vue";

const M = {
  ko: {
    mobileHint: "칸을 누르면 핸드 이름과 비중이 위에 크게 표시됩니다. 비중은 표 아래 막대로 바꿉니다.",
    clear: "초기화",
    errorPrefix: "오류:",
    weight: "비중:",
    combos: "콤보",
    parseError: (range: string) =>
      `레인지를 해석할 수 없습니다: ${range || "(빈 문자열)"}`,
  },
  en: {
    mobileHint: "Tap a cell to see its hand name and weight in large text above. Adjust the weight with the slider below the grid.",
    clear: "Clear",
    errorPrefix: "Error:",
    weight: "Weight:",
    combos: "combos",
    parseError: (range: string) =>
      `Failed to parse range: ${range || "(empty string)"}`,
  },
  ja: {
    mobileHint: "マスを押すとハンド名とウェイトが上に大きく表示されます。ウェイトは表の下のスライダーで変えられます。",
    clear: "クリア",
    errorPrefix: "エラー:",
    weight: "ウェイト:",
    combos: "コンボ",
    parseError: (range: string) =>
      `レンジを解析できません: ${range || "(空の文字列)"}`,
  },
  es: {
    mobileHint: "Toca una celda para ver el nombre de la mano y su peso en grande arriba. Cambia el peso con la barra bajo la tabla.",
    clear: "Borrar",
    errorPrefix: "Error:",
    weight: "Peso:",
    combos: "combos",
    parseError: (range: string) =>
      `No se pudo interpretar el rango: ${range || "(cadena vacía)"}`,
  },
  pt: {
    mobileHint: "Toque em uma célula para ver o nome da mão e o peso em destaque acima. Ajuste o peso pela barra abaixo da tabela.",
    clear: "Limpar",
    errorPrefix: "Erro:",
    weight: "Peso:",
    combos: "combos",
    parseError: (range: string) =>
      `Não foi possível interpretar o range: ${range || "(texto vazio)"}`,
  },
  de: {
    mobileHint: "Tippe auf ein Feld, um Handname und Gewicht darüber groß zu sehen. Mit dem Schieberegler unter der Tabelle änderst du das Gewicht.",
    clear: "Leeren",
    errorPrefix: "Fehler:",
    weight: "Gewicht:",
    combos: "Combos",
    parseError: (range: string) =>
      `Die Range konnte nicht gelesen werden: ${range || "(leerer Text)"}`,
  },
  zh: {
    mobileHint: "点选格子后，手牌名称和权重会在上方放大显示。用表格下方的滑块调整权重。",
    // clearRange()는 격자·비중·입력칸을 전부 비운다 (BoardSelector와 같은 뜻의 「清空」)
    clear: "清空",
    errorPrefix: "错误：",
    weight: "权重：",
    combos: "组合",
    parseError: (range: string) =>
      `无法解析这个范围：${range || "（空）"}`,
  },
  "zh-hant": {
    mobileHint: "點選格子後，手牌名稱和權重會在上方放大顯示。用表格下方的滑桿調整權重。",
    // clearRange()는 격자·비중·입력칸을 전부 비운다 (BoardSelector와 같은 뜻의 「清空」)
    clear: "清空",
    errorPrefix: "錯誤：",
    weight: "權重：",
    combos: "組合",
    parseError: (range: string) =>
      `無法解析這個範圍：${range || "（空）"}`,
  },
  fr: {
    mobileHint: "Touche une case pour voir le nom de la main et son poids en grand au-dessus. Ajuste le poids avec le curseur sous la grille.",
    clear: "Effacer",
    errorPrefix: "Erreur :",
    weight: "Poids :",
    combos: "combos",
    parseError: (range: string) =>
      `Impossible d'interpréter la range : ${range || "(chaîne vide)"}`,
  },
  id: {
    mobileHint: "Ketuk kotak untuk melihat nama hand dan bobotnya dalam ukuran besar di atas. Ubah bobot dengan penggeser di bawah tabel.",
    clear: "Bersihkan",
    errorPrefix: "Error:",
    weight: "Bobot:",
    combos: "combo",
    parseError: (range: string) =>
      `Range tidak bisa dibaca: ${range || "(kosong)"}`,
  },
  ms: {
    mobileHint: "Ketik kotak untuk melihat nama tangan dan wajarannya dalam saiz besar di atas. Laraskan wajaran dengan peluncur di bawah jadual.",
    clear: "Kosongkan",
    errorPrefix: "Ralat:",
    weight: "Wajaran:",
    combos: "combo",
    parseError: (range: string) =>
      `Range tidak dapat dibaca: ${range || "(kosong)"}`,
  },
  hi: {
    mobileHint: "खाने पर टैप करने से हैंड का नाम और वज़न ऊपर बड़े अक्षरों में दिखते हैं। वज़न बदलने के लिए तालिका के नीचे का स्लाइडर इस्तेमाल करें।",
    clear: "साफ़ करें",
    errorPrefix: "त्रुटि:",
    weight: "वज़न:",
    combos: "combos",
    parseError: (range: string) => `Range पार्स नहीं हो सकी: ${range || "(खाली टेक्स्ट)"}`,
  },
} as const;

import { C } from "../theme";

const yellow500 = C.accent;

const comboPat = `(?:(?:${rankPat}{2}[os]?)|(?:(?:${rankPat}[cdhs]){2}))`;
const weightPat = "(?:(?:[01](\\.\\d*)?)|(?:\\.\\d+))";
const trimRegex = /\s*([-:,])\s*/g;
const rangeRegex = new RegExp(
  `^(?<range>${comboPat}(?:\\+|(?:-${comboPat}))?)(?::(?<weight>${weightPat}))?$`
);

type DraggingMode = "none" | "enabling" | "disabling";

export default defineComponent({
  components: {
    DbItemPicker,
  },

  props: {
    player: {
      type: Number,
      required: true,
    },
  },

  setup(props) {
    const appStore = useStore();
    const config = useConfigStore();
    const L = computed(() => M[i18n.locale]);

    const range = RangeManager.new();
    const rangeStore = config.range[props.player];
    const rangeStoreRaw = config.rangeRaw[props.player];
    const rangeText = ref("");
    const rangeTextError = ref("");
    const weight = ref(100);
    const numCombos = ref(0);
    const activeCell = ref<{ row: number; col: number } | null>(null);

    let draggingMode: DraggingMode = "none";

    const cellText = (row: number, col: number) => {
      const r1 = 13 - Math.min(row, col);
      const r2 = 13 - Math.max(row, col);
      return ranks[r1] + ranks[r2] + ["s", "", "o"][Math.sign(row - col) + 1];
    };

    const cellIndex = (row: number, col: number) => {
      return 13 * (row - 1) + col - 1;
    };

    const cellValue = (row: number, col: number) => {
      return rangeStore[cellIndex(row, col)];
    };

    const onUpdate = () => {
      rangeStoreRaw.set(range.raw_data());
      rangeText.value = range.to_string();
      rangeTextError.value = "";
      numCombos.value = rangeStoreRaw.reduce((acc, cur) => acc + cur, 0);
      appStore.rangeText[props.player] = rangeText.value; // 스팟 공유용 미러
    };

    const update = (row: number, col: number, weight: number) => {
      const idx = 13 * (row - 1) + col - 1;
      range.update(row, col, weight / 100);
      rangeStore[idx] = weight;
      onUpdate();
    };

    const onRangeTextChange = () => {
      const trimmed = rangeText.value.replace(trimRegex, "$1").trim();
      const ranges = trimmed.split(",");

      if (ranges[ranges.length - 1] === "") {
        ranges.pop();
      }

      for (const range of ranges) {
        if (!rangeRegex.test(range)) {
          rangeTextError.value = L.value.parseError(range);
          return;
        }
      }

      const errorString = range.from_string(trimmed);

      if (errorString) {
        rangeTextError.value = errorString;
      } else {
        const weights = range.get_weights();
        for (let i = 0; i < 13 * 13; ++i) {
          rangeStore[i] = weights[i] * 100;
        }
        onUpdate();
      }
    };

    const dragStart = (row: number, col: number) => {
      activeCell.value = { row, col };
      const idx = 13 * (row - 1) + col - 1;

      if (rangeStore[idx] !== weight.value) {
        draggingMode = "enabling";
        update(row, col, weight.value);
      } else {
        draggingMode = "disabling";
        update(row, col, 0);
      }
    };

    const dragEnd = () => {
      draggingMode = "none";
    };

    const mouseEnter = (row: number, col: number) => {
      if (draggingMode === "enabling") {
        activeCell.value = { row, col };
        update(row, col, weight.value);
      } else if (draggingMode === "disabling") {
        activeCell.value = { row, col };
        update(row, col, 0);
      }
    };

    const onCellKeydown = (event: KeyboardEvent, row: number, col: number) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        if (!event.repeat) {
          dragStart(row, col);
          dragEnd();
        }
        return;
      }
      const movement: Record<string, [number, number]> = {
        ArrowUp: [-1, 0], ArrowDown: [1, 0],
        ArrowLeft: [0, -1], ArrowRight: [0, 1],
      };
      const delta = movement[event.key];
      if (!delta) return;
      event.preventDefault();
      const nextRow = Math.min(13, Math.max(1, row + delta[0]));
      const nextCol = Math.min(13, Math.max(1, col + delta[1]));
      const table = (event.currentTarget as HTMLElement).closest("table");
      table?.querySelector<HTMLElement>(`[data-range-cell="${nextRow}-${nextCol}"]`)?.focus();
    };

    const onWeightChange = () => {
      weight.value = Math.round(Math.max(0, Math.min(100, weight.value)));
    };

    const clearRange = () => {
      range.clear();
      rangeStore.fill(0);
      rangeStoreRaw.fill(0);
      rangeText.value = "";
      rangeTextError.value = "";
      weight.value = 100;
      numCombos.value = 0;
      appStore.rangeText[props.player] = "";
    };

    const loadRange = (rangeStr: unknown) => {
      rangeText.value = String(rangeStr);
      onRangeTextChange();
    };

    // 프리셋 로더/공유 링크가 넘긴 레인지 텍스트를 기존 파이프라인으로 적용
    // immediate: 공유 링크는 컴포넌트 마운트 전에 값을 넣으므로 초기값도 처리
    watch(
      () => appStore.pendingRangeText[props.player],
      (v) => {
        if (v) {
          loadRange(v);
          appStore.pendingRangeText[props.player] = "";
        }
      },
      { immediate: true }
    );

    return {
      L,
      yellow500,
      cellText,
      cellValue,
      rangeStore,
      rangeText,
      rangeTextError,
      weight,
      numCombos,
      activeCell,
      onCellKeydown,
      onRangeTextChange,
      dragStart,
      dragEnd,
      mouseEnter,
      onWeightChange,
      clearRange,
      loadRange,
    };
  },
});
</script>

<style scoped>
.range-cell-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 40px;
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}
.range-editor td {
  touch-action: manipulation;
}
.range-editor td.range-cell-active::after,
.range-editor td:focus-visible::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none;
  box-shadow: inset 0 0 0 2px rgb(var(--c-brand));
}
.range-editor td:focus-visible {
  outline: 2px solid rgb(var(--c-brand));
  outline-offset: 1px;
}
@media (min-width: 768px) {
  .range-cell-summary { display: none; }
}
.range-weight > div {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  row-gap: 0.5rem;
}
.range-editor :deep(input) {
  max-width: 100%;
}
</style>
