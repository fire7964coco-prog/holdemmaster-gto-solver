<template>
  <div class="flex shrink-0 h-12 border-y border-neutral-600 overflow-x-auto">
    <button
      v-for="mode in ['basics', 'graphs', 'compare'] as const"
      :key="mode"
      :class="
        'flex shrink-0 w-16 md:w-[9%] h-full items-center justify-center font-semibold text-sm md:text-lg transition ' +
        (chanceMode === ''
          ? displayMode === mode
            ? 'bg-neutral-700 text-blue-300 underline'
            : 'hover:bg-neutral-700'
          : displayMode === mode
          ? 'bg-red-950 underline'
          : 'hover:bg-red-950')
      "
      @click="updateDisplayMode(mode)"
    >
      {{ modeLabels[mode] }}
    </button>
    <button
      :class="
        'flex shrink-0 w-16 md:w-[9%] h-full items-center justify-center font-semibold text-sm md:text-lg transition enabled:hover:bg-neutral-700 ' +
        (displayMode === 'chance' ? 'bg-neutral-700 text-blue-300 underline' : '')
      "
      :disabled="chanceMode === ''"
      @click="updateDisplayMode('chance')"
    >
      {{ chanceMode ? modeLabels[chanceMode] : "" }}
    </button>

    <div
      class="flex ml-auto shrink-0 h-full px-4 items-center justify-start gap-2 snug"
    >
      <div
        v-if="['basics', 'graphs'].includes(displayMode)"
        class="flex flex-col items-start justify-center h-full"
      >
        <div class="text-sm">{{ L.player }}</div>
        <select
          v-model="displayOptions.playerBasics"
          class="w-28 px-1 py-0.5 border-neutral-600 bg-neutral-700 rounded-lg shadow cursor-pointer bg-right"
          @change="updateDisplayOptions"
        >
          <option value="auto">
            {{ L.auto(autoPlayerBasics.toUpperCase()) }}
          </option>
          <option value="oop">OOP</option>
          <option value="ip">IP</option>
        </select>
      </div>

      <div
        v-if="displayMode === 'chance'"
        class="flex flex-col items-start justify-center h-full"
      >
        <div class="text-sm">{{ L.player }}</div>
        <select
          v-model="displayOptions.playerChance"
          class="w-28 px-1 py-0.5 border-neutral-600 bg-neutral-700 rounded-lg shadow cursor-pointer bg-right"
          @change="updateDisplayOptions"
        >
          <option value="auto">
            {{ L.auto(autoPlayerChance.toUpperCase()) }}
          </option>
          <option value="oop">OOP</option>
          <option value="ip">IP</option>
        </select>
      </div>

      <div
        v-if="['basics', 'compare'].includes(displayMode)"
        class="flex flex-col items-start justify-center h-full"
      >
        <div class="text-sm">{{ L.barHeight }}</div>
        <select
          v-model="displayOptions.barHeight"
          class="w-28 px-1 py-0.5 border-neutral-600 bg-neutral-700 rounded-lg shadow cursor-pointer bg-right"
          @change="updateDisplayOptions"
        >
          <option value="normalized">{{ L.normalized }}</option>
          <option value="absolute">{{ L.absolute }}</option>
          <option value="full">{{ L.full }}</option>
        </select>
      </div>

      <div
        v-if="['basics', 'compare'].includes(displayMode)"
        class="flex flex-col items-start justify-center h-full"
      >
        <div class="text-sm">{{ L.suit }}</div>
        <select
          v-model="displayOptions.suit"
          class="w-[6.25rem] px-1 py-0.5 border-neutral-600 bg-neutral-700 rounded-lg shadow cursor-pointer bg-right"
          @change="updateDisplayOptions"
        >
          <option value="grouped">{{ L.grouped }}</option>
          <option value="individual">{{ L.individual }}</option>
        </select>
      </div>

      <div
        v-if="['basics', 'compare'].includes(displayMode)"
        class="flex flex-col items-start justify-center h-full"
      >
        <div class="text-sm">{{ L.display }}</div>
        <select
          v-model="strategyContentPair"
          class="w-[8.75rem] px-1 py-0.5 border-neutral-600 bg-neutral-700 rounded-lg shadow cursor-pointer bg-right"
          @change="updateDisplayOptions"
        >
          <option value="show,default">{{ L.strategy }}</option>
          <option value="show,eq">{{ L.strategy }} + EQ</option>
          <option value="show,ev">{{ L.strategy }} + EV</option>
          <option value="show,eqr">{{ L.strategy }} + EQR</option>
          <option value="none,default">{{ L.weight }}</option>
          <option value="none,eq">EQ</option>
          <option value="none,ev">EV</option>
          <option value="none,eqr">EQR</option>
        </select>
      </div>

      <div
        v-if="displayMode === 'graphs'"
        class="flex flex-col items-start justify-center h-full"
      >
        <div class="text-sm">{{ L.display }}</div>
        <select
          v-model="displayOptions.contentGraphs"
          class="w-20 px-1 py-0.5 border-neutral-600 bg-neutral-700 rounded-lg shadow cursor-pointer bg-right"
          @change="updateDisplayOptions"
        >
          <option value="eq">EQ</option>
          <option value="ev">EV</option>
          <option value="eqr">EQR</option>
        </select>
      </div>

      <div
        v-if="displayMode === 'chance'"
        class="flex flex-col items-start justify-center h-full"
      >
        <div class="text-sm">{{ L.chart }}</div>
        <select
          v-model="displayOptions.chartChance"
          class="w-[10.25rem] px-1 py-0.5 border-neutral-600 bg-neutral-700 rounded-lg shadow cursor-pointer bg-right"
          @change="updateDisplayOptions"
        >
          <option value="strategy-combos">{{ L.strategyCombos }}</option>
          <option value="strategy">{{ L.strategy }} (%)</option>
          <option value="eq">{{ L.equity }}</option>
          <option value="ev">EV</option>
          <option value="eqr">EQR</option>
        </select>
      </div>

      <!--
      <div class="flex items-center px-4 gap-4">
        <Tippy content="Copy range text to clipboard">
          <button
            :class="
              'flex w-8 h-8 items-center justify-center rounded-lg shadow transition-colors border ' +
              (copySuccess === 1
                ? 'border-green-600 bg-green-100'
                : copySuccess === -1
                ? 'border-red-600 bg-red-100'
                : 'border-gray-600 bg-gray-200')
            "
            @click="copyToClipboard"
            @mouseleave="onCopyTooltipLeave"
          >
            <ClipboardDocumentIcon
              v-show="copySuccess !== 1"
              :class="'w-5 h-5 ' + (copySuccess === -1 ? 'text-red-600' : '')"
            />
            <ClipboardDocumentCheckIcon
              v-show="copySuccess === 1"
              class="w-5 h-5 text-green-600"
            />
          </button>
        </Tippy>

        <Tippy content="Open solver integration menu; not yet implemented">
          <button
            class="flex w-8 h-8 items-center justify-center border border-gray-600 bg-gray-200 rounded-lg shadow transition-colors active:bg-gray-300"
          >
            <ComputerDesktopIcon class="w-5 h-5" />
          </button>
        </Tippy>
      </div>
      -->
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, toRefs, watch } from "vue";
import { capitalize } from "../utils";
import * as Types from "../result-types";
import { i18n } from "../i18n";

// display-only label maps (internal mode values remain in English)
const M = {
  ko: {
    modeLabels: {
      basics: "기본",
      graphs: "그래프",
      compare: "비교",
      turn: "턴",
      river: "리버",
    } as Record<string, string>,
    player: "플레이어:",
    auto: (player: string) => `자동 (${player})`,
    barHeight: "바 높이:",
    normalized: "정규화",
    absolute: "절대값",
    full: "전체",
    suit: "수트:",
    grouped: "그룹",
    individual: "개별",
    display: "표시:",
    strategy: "전략",
    weight: "비중",
    chart: "차트:",
    strategyCombos: "전략 (콤보)",
    equity: "에퀴티",
  },
  en: {
    modeLabels: {
      basics: "Basics",
      graphs: "Graphs",
      compare: "Compare",
      turn: "Turn",
      river: "River",
    } as Record<string, string>,
    player: "Player:",
    auto: (player: string) => `Auto (${player})`,
    barHeight: "Bar Height:",
    normalized: "Normalized",
    absolute: "Absolute",
    full: "Full",
    suit: "Suit:",
    grouped: "Grouped",
    individual: "Individual",
    display: "Display:",
    strategy: "Strategy",
    weight: "Weight",
    chart: "Chart:",
    strategyCombos: "Strategy (Combos)",
    equity: "Equity",
  },
  ja: {
    modeLabels: {
      basics: "基本",
      graphs: "グラフ",
      compare: "比較",
      turn: "ターン",
      river: "リバー",
    } as Record<string, string>,
    player: "プレイヤー:",
    auto: (player: string) => `自動 (${player})`,
    barHeight: "バーの高さ:",
    normalized: "正規化",
    absolute: "絶対値",
    full: "全体",
    suit: "スート:",
    grouped: "グループ",
    individual: "個別",
    display: "表示:",
    strategy: "戦略",
    weight: "ウェイト",
    chart: "チャート:",
    strategyCombos: "戦略 (コンボ)",
    equity: "エクイティ",
  },
  es: {
    modeLabels: {
      basics: "Básicos",
      graphs: "Gráficos",
      compare: "Comparar",
      turn: "Turn",
      river: "River",
    } as Record<string, string>,
    player: "Jugador:",
    auto: (player: string) => `Auto (${player})`,
    barHeight: "Altura de barra:",
    normalized: "Normalizado",
    absolute: "Absoluto",
    full: "Completo",
    suit: "Palo:",
    grouped: "Agrupado",
    individual: "Individual",
    display: "Mostrar:",
    strategy: "Estrategia",
    weight: "Peso",
    chart: "Gráfico:",
    strategyCombos: "Estrategia (combos)",
    equity: "Equity",
  },
  pt: {
    modeLabels: {
      basics: "Básico",
      graphs: "Gráficos",
      compare: "Comparar",
      turn: "Turn",
      river: "River",
    } as Record<string, string>,
    player: "Jogador:",
    auto: (player: string) => `Auto (${player})`,
    barHeight: "Altura da barra:",
    normalized: "Normalizado",
    absolute: "Absoluto",
    full: "Completo",
    suit: "Naipe:",
    grouped: "Agrupado",
    individual: "Individual",
    display: "Mostrar:",
    strategy: "Estratégia",
    weight: "Peso",
    chart: "Gráfico:",
    strategyCombos: "Estratégia (combos)",
    equity: "Equity",
  },
  de: {
    modeLabels: {
      basics: "Basis",
      graphs: "Graphen",
      compare: "Vergleich",
      turn: "Turn",
      river: "River",
    } as Record<string, string>,
    player: "Spieler:",
    auto: (player: string) => `Auto (${player})`,
    barHeight: "Balkenhöhe:",
    normalized: "Normalisiert",
    absolute: "Absolut",
    full: "Voll",
    // suit = die Farbe (본체 브리프 §2 — gefärbt 금지)
    suit: "Farbe:",
    grouped: "Gruppiert",
    individual: "Einzeln",
    display: "Anzeige:",
    strategy: "Strategie",
    weight: "Gewicht",
    chart: "Diagramm:",
    strategyCombos: "Strategie (Combos)",
    equity: "Equity",
  },
  zh: {
    modeLabels: {
      basics: "基础",
      graphs: "图表",
      compare: "对比",
      turn: "转牌",
      river: "河牌",
    } as Record<string, string>,
    player: "玩家：",
    auto: (player: string) => `自动（${player}）`,
    barHeight: "柱高：",
    // 归一化 = 대륙 표준 표기 (대만은 正規化 — 간체판에서는 쓰지 않는다)
    normalized: "归一化",
    absolute: "绝对值",
    // 「全部」로 옮기면 아래 all(전체 핸드)과 뜻이 겹친다 — 막대가 «가득 찬다»는 뜻이므로 铺满
    full: "满格",
    // suit = 「花色」 (본체 브리프 §5 가짜친구: 「西装」 오역 주의)
    suit: "花色：",
    grouped: "分组",
    individual: "单独",
    display: "显示：",
    strategy: "策略",
    weight: "权重",
    chart: "图表：",
    strategyCombos: "策略（组合）",
    equity: "胜率",
  },
  "zh-hant": {
    modeLabels: {
      basics: "基礎",
      graphs: "圖表",
      compare: "比較",
      turn: "轉牌",
      river: "河牌",
    } as Record<string, string>,
    player: "玩家：",
    auto: (player: string) => `自動（${player}）`,
    barHeight: "長條高：",
    // ⚠ normalize는 대륙이 「归一化」, 台灣이 「正規化」다 — 간체판 주석이 그 차이를 적어 뒀다.
    //   여기서 「歸一化」로 글자만 바꾸면 대만 독자에게는 낯선 말이 된다
    normalized: "正規化",
    absolute: "絕對值",
    // 「全部」로 옮기면 아래 all(전체 핸드)과 뜻이 겹친다 — 막대가 «가득 찬다»는 뜻이므로 滿格
    full: "滿格",
    // suit = 「花色」 (가짜친구: 「西裝」 오역 주의)
    suit: "花色：",
    grouped: "合併",
    individual: "個別",
    display: "顯示：",
    strategy: "策略",
    weight: "權重",
    chart: "圖表：",
    strategyCombos: "策略（組合）",
    equity: "勝率",
  },
} as const;

// import { Tippy } from "vue-tippy";
// import { ComputerDesktopIcon } from "@heroicons/vue/24/solid";
// import {
//   ClipboardDocumentIcon,
//   ClipboardDocumentCheckIcon,
// } from "@heroicons/vue/24/outline";

export default defineComponent({
  components: {
    // Tippy,
    // ComputerDesktopIcon,
    // ClipboardDocumentIcon,
    // ClipboardDocumentCheckIcon,
  },

  props: {
    displayMode: {
      type: String as () => Types.DisplayMode,
      required: true,
    },
    chanceMode: {
      type: String,
      required: true,
    },
    autoPlayerBasics: {
      type: String as () => "oop" | "ip",
      required: true,
    },
    autoPlayerChance: {
      type: String as () => "oop" | "ip",
      required: true,
    },
    copySuccess: {
      type: Number,
      required: true,
    },
  },

  emits: {
    "update:display-mode": (_displayMode: Types.DisplayMode) => true,
    "update:display-options": (_displayOptions: Types.DisplayOptions) => true,
    // "copy-to-clipboard": () => true,
    // "reset-copy-success": () => true,
  },

  setup(props, context) {
    const L = computed(() => M[i18n.locale]);
    const modeLabels = computed(() => L.value.modeLabels);
    const { chanceMode } = toRefs(props);
    let displayModeOld = "basics" as Types.DisplayMode;

    watch(chanceMode, (newValue, oldValue) => {
      if (newValue && !oldValue) {
        displayModeOld = props.displayMode;
        context.emit("update:display-mode", "chance");
      } else if (!newValue && oldValue) {
        context.emit("update:display-mode", displayModeOld);
      }
    });

    const displayOptions = reactive<Types.DisplayOptions>({
      playerBasics: "auto",
      playerChance: "auto",
      barHeight: "normalized",
      suit: "grouped",
      strategy: "show",
      contentBasics: "default",
      contentGraphs: "eq",
      chartChance: "strategy-combos",
    });

    const strategyContentPair = ref("show,default");

    const savedDisplayOptions = localStorage.getItem("display-options");

    if (savedDisplayOptions) {
      const saved = JSON.parse(savedDisplayOptions) as Types.DisplayOptions;

      if (Types.barHeightList.includes(saved?.barHeight)) {
        displayOptions.barHeight = saved.barHeight;
      }
      if (Types.suitList.includes(saved?.suit)) {
        displayOptions.suit = saved.suit;
      }
      if (Types.strategyList.includes(saved?.strategy)) {
        displayOptions.strategy = saved.strategy;
      }
      if (Types.contentBasicsList.includes(saved?.contentBasics)) {
        displayOptions.contentBasics = saved.contentBasics;
      }
      if (Types.contentGraphsList.includes(saved?.contentGraphs)) {
        displayOptions.contentGraphs = saved.contentGraphs;
      }
      if (Types.chartChanceList.includes(saved?.chartChance)) {
        displayOptions.chartChance = saved.chartChance;
      }

      strategyContentPair.value = [
        displayOptions.strategy,
        displayOptions.contentBasics,
      ].join(",");

      context.emit("update:display-options", displayOptions);
    }

    const updateDisplayMode = (displayMode: Types.DisplayMode) => {
      if (displayMode !== "chance") {
        displayModeOld = displayMode;
      }
      context.emit("update:display-mode", displayMode);
    };

    const updateDisplayOptions = () => {
      const options = displayOptions;
      const [strategy, content] = strategyContentPair.value.split(",");
      options.strategy = strategy as Types.DisplayOptions["strategy"];
      options.contentBasics = content as Types.DisplayOptions["contentBasics"];
      localStorage.setItem("display-options", JSON.stringify(options));
      context.emit("update:display-options", options);
    };

    // const copyToClipboard = () => {
    //   context.emit("copy-to-clipboard");
    // };

    // const onCopyTooltipLeave = () => {
    //   context.emit("reset-copy-success");
    // };

    return {
      capitalize,
      L,
      modeLabels,
      displayOptions,
      strategyContentPair,
      updateDisplayMode,
      updateDisplayOptions,
      // copyToClipboard,
      // onCopyTooltipLeave,
    };
  },
});
</script>
