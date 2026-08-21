<template>
  <div class="flex flex-col md:flex-row mt-1">
    <div class="shrink-0 ml-0 md:ml-1 max-w-full">
      <table class="shadow-md shadow-black/40 select-none snug" @mouseleave="dragEnd">
        <tr v-for="row in 13" :key="row" class="h-7 md:h-9">
          <td
            v-for="col in 13"
            :key="col"
            class="relative w-7 md:w-[2.625rem] border border-neutral-700"
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

      <div class="mt-5">
        <div class="flex">
          <input
            v-model="rangeText"
            type="text"
            :class="
              'flex-grow mr-6 px-2 py-1 rounded-lg text-sm ' +
              (rangeTextError ? 'input-error' : '')
            "
            @focus="($event.target as HTMLInputElement).select()"
            @change="onRangeTextChange"
          />

          <button class="button-base button-blue" @click="clearRange">
            {{ L.clear }}
          </button>
        </div>

        <div v-if="rangeTextError" class="mt-1 text-red-400">
          {{ L.errorPrefix }} {{ rangeTextError }}
        </div>
      </div>

      <div class="flex mt-3.5 items-center">
        <div>
          {{ L.weight }}
          <input
            v-model="weight"
            type="range"
            class="ml-3 w-40 align-middle"
            min="0"
            max="100"
            step="5"
            @change="onWeightChange"
          />
          <input
            v-model="weight"
            type="number"
            :class="
              'w-20 ml-4 px-2 py-1 rounded-lg text-sm text-center ' +
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

    <div class="flex-grow max-w-full md:max-w-[18rem] ml-0 md:ml-6 mt-4 md:mt-0">
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
    clear: "초기화",
    errorPrefix: "오류:",
    weight: "비중:",
    combos: "콤보",
    parseError: (range: string) =>
      `레인지를 해석할 수 없습니다: ${range || "(빈 문자열)"}`,
  },
  en: {
    clear: "Clear",
    errorPrefix: "Error:",
    weight: "Weight:",
    combos: "combos",
    parseError: (range: string) =>
      `Failed to parse range: ${range || "(empty string)"}`,
  },
  ja: {
    clear: "クリア",
    errorPrefix: "エラー:",
    weight: "ウェイト:",
    combos: "コンボ",
    parseError: (range: string) =>
      `レンジを解析できません: ${range || "(空の文字列)"}`,
  },
  es: {
    clear: "Borrar",
    errorPrefix: "Error:",
    weight: "Peso:",
    combos: "combos",
    parseError: (range: string) =>
      `No se pudo interpretar el rango: ${range || "(cadena vacía)"}`,
  },
  pt: {
    clear: "Limpar",
    errorPrefix: "Erro:",
    weight: "Peso:",
    combos: "combos",
    parseError: (range: string) =>
      `Não foi possível interpretar o range: ${range || "(texto vazio)"}`,
  },
  de: {
    clear: "Leeren",
    errorPrefix: "Fehler:",
    weight: "Gewicht:",
    combos: "Combos",
    parseError: (range: string) =>
      `Die Range konnte nicht gelesen werden: ${range || "(leerer Text)"}`,
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
        update(row, col, weight.value);
      } else if (draggingMode === "disabling") {
        update(row, col, 0);
      }
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
