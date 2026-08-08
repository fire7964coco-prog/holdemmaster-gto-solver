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
        <div class="text-sm">플레이어:</div>
        <select
          v-model="displayOptions.playerBasics"
          class="w-28 px-1 py-0.5 border-neutral-600 bg-neutral-700 rounded-lg shadow cursor-pointer bg-right"
          @change="updateDisplayOptions"
        >
          <option value="auto">
            자동 ({{ autoPlayerBasics.toUpperCase() }})
          </option>
          <option value="oop">OOP</option>
          <option value="ip">IP</option>
        </select>
      </div>

      <div
        v-if="displayMode === 'chance'"
        class="flex flex-col items-start justify-center h-full"
      >
        <div class="text-sm">플레이어:</div>
        <select
          v-model="displayOptions.playerChance"
          class="w-28 px-1 py-0.5 border-neutral-600 bg-neutral-700 rounded-lg shadow cursor-pointer bg-right"
          @change="updateDisplayOptions"
        >
          <option value="auto">
            자동 ({{ autoPlayerChance.toUpperCase() }})
          </option>
          <option value="oop">OOP</option>
          <option value="ip">IP</option>
        </select>
      </div>

      <div
        v-if="['basics', 'compare'].includes(displayMode)"
        class="flex flex-col items-start justify-center h-full"
      >
        <div class="text-sm">바 높이:</div>
        <select
          v-model="displayOptions.barHeight"
          class="w-28 px-1 py-0.5 border-neutral-600 bg-neutral-700 rounded-lg shadow cursor-pointer bg-right"
          @change="updateDisplayOptions"
        >
          <option value="normalized">정규화</option>
          <option value="absolute">절대값</option>
          <option value="full">전체</option>
        </select>
      </div>

      <div
        v-if="['basics', 'compare'].includes(displayMode)"
        class="flex flex-col items-start justify-center h-full"
      >
        <div class="text-sm">수트:</div>
        <select
          v-model="displayOptions.suit"
          class="w-[6.25rem] px-1 py-0.5 border-neutral-600 bg-neutral-700 rounded-lg shadow cursor-pointer bg-right"
          @change="updateDisplayOptions"
        >
          <option value="grouped">그룹</option>
          <option value="individual">개별</option>
        </select>
      </div>

      <div
        v-if="['basics', 'compare'].includes(displayMode)"
        class="flex flex-col items-start justify-center h-full"
      >
        <div class="text-sm">표시:</div>
        <select
          v-model="strategyContentPair"
          class="w-[8.75rem] px-1 py-0.5 border-neutral-600 bg-neutral-700 rounded-lg shadow cursor-pointer bg-right"
          @change="updateDisplayOptions"
        >
          <option value="show,default">전략</option>
          <option value="show,eq">전략 + EQ</option>
          <option value="show,ev">전략 + EV</option>
          <option value="show,eqr">전략 + EQR</option>
          <option value="none,default">비중</option>
          <option value="none,eq">EQ</option>
          <option value="none,ev">EV</option>
          <option value="none,eqr">EQR</option>
        </select>
      </div>

      <div
        v-if="displayMode === 'graphs'"
        class="flex flex-col items-start justify-center h-full"
      >
        <div class="text-sm">표시:</div>
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
        <div class="text-sm">차트:</div>
        <select
          v-model="displayOptions.chartChance"
          class="w-[10.25rem] px-1 py-0.5 border-neutral-600 bg-neutral-700 rounded-lg shadow cursor-pointer bg-right"
          @change="updateDisplayOptions"
        >
          <option value="strategy-combos">전략 (콤보)</option>
          <option value="strategy">전략 (%)</option>
          <option value="eq">에퀴티</option>
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
import { defineComponent, reactive, ref, toRefs, watch } from "vue";
import { capitalize } from "../utils";
import * as Types from "../result-types";

// display-only label map (internal mode values remain in English)
const modeLabels: Record<string, string> = {
  basics: "기본",
  graphs: "그래프",
  compare: "비교",
  turn: "턴",
  river: "리버",
};

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
