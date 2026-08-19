<template>
  <table class="shadow-md">
    <tr v-for="row in 13" :key="row" :class="compact ? 'h-[6px]' : 'h-2.5'">
      <td
        v-for="col in 13"
        :key="col"
        :class="
          'relative border-[0.5px] border-black ' +
          (compact ? 'w-[6px]' : 'w-2.5')
        "
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
      </td>
    </tr>
  </table>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useConfigStore } from "../store";

import { C } from "../theme";

const yellow500 = C.accent;

export default defineComponent({
  props: {
    player: {
      type: Number,
      required: true,
    },
    // 사이드바용 축소판 — ①~⑤가 스크롤 없이 한 화면에 들어와야 한다
    compact: {
      type: Boolean,
      default: false,
    },
  },

  setup(props) {
    const config = useConfigStore();

    const cellValue = (row: number, col: number) => {
      const cellIndex = (row - 1) * 13 + (col - 1);
      return config.range[props.player][cellIndex];
    };

    return { yellow500, cellValue };
  },
});
</script>
