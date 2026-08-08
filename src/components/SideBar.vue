<template>
  <aside
    class="flex flex-row md:flex-col shrink-0 w-full md:w-56 my-0 md:my-4 overflow-x-auto md:overflow-x-visible md:overflow-y-auto border-b md:border-b-0 md:border-r-2 border-neutral-700"
  >
    <button :class="itemStyle('about')" @click="store.sideView = 'about'">
      소개
    </button>

    <button :class="itemStyle('guide')" @click="store.sideView = 'guide'">
      사용법
    </button>

    <button :class="itemStyle('presets')" @click="store.sideView = 'presets'">
      교육 예제
      <span
        class="hidden md:block mt-0.5 text-xs font-semibold text-emerald-400"
      >
        ⚡ 결과 바로 보기
      </span>
      <span class="md:hidden text-emerald-400">⚡</span>
    </button>

    <div class="side-bar-label">
      커스텀 스팟<span class="hidden md:inline"> — 직접 입력해서 계산</span>
    </div>

    <button
      :class="itemStyle('oop-range')"
      @click="store.sideView = 'oop-range'"
    >
      ① OOP 레인지
      <span class="hidden md:flex my-2 justify-center">
        <RangeMiniViewer :player="0" />
      </span>
    </button>

    <button :class="itemStyle('ip-range')" @click="store.sideView = 'ip-range'">
      ② IP 레인지
      <span class="hidden md:flex my-2 justify-center">
        <RangeMiniViewer :player="1" />
      </span>
    </button>

    <button :class="itemStyle('board')" @click="store.sideView = 'board'">
      ③ 보드
      <span class="hidden md:flex mt-1 justify-center font-semibold">
        <span
          v-for="(item, i) in boardTexts"
          :key="i"
          :class="
            'inline-block ' + (i === 3 ? 'mx-1 ' : 'mx-0.5 ') + item.colorClass
          "
        >
          {{ item.rank + item.suit }}
        </span>
      </span>
    </button>

    <button
      :class="itemStyle('tree-config')"
      @click="store.sideView = 'tree-config'"
    >
      ④ 벳 사이즈 (트리 설정)
    </button>

    <button
      :class="itemStyle('run-solver')"
      @click="store.sideView = 'run-solver'"
    >
      ⑤ 계산 실행
    </button>
  </aside>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { SideView, useStore, useConfigStore } from "../store";
import { cardText } from "../utils";

import RangeMiniViewer from "./RangeMiniViewer.vue";

export default defineComponent({
  components: {
    RangeMiniViewer,
  },

  setup() {
    const store = useStore();
    const config = useConfigStore();

    const boardTexts = computed(() => {
      if (config.board.length === 0) {
        return [{ rank: "-", suit: "", colorClass: "text-neutral-200" }];
      } else {
        return config.board.map(cardText);
      }
    });

    return {
      store,
      boardTexts,
      itemStyle: (view: SideView) => {
        return (
          "side-bar-item " +
          (view === store.sideView ? "font-bold bg-neutral-700 text-blue-300" : "")
        );
      },
    };
  },
});
</script>

<style scoped>
.side-bar-item {
  @apply block shrink-0 whitespace-nowrap mx-1 my-1 px-3 py-2 rounded-xl text-sm;
  @apply md:shrink md:whitespace-normal md:mx-2 md:px-4 md:py-3 md:rounded-3xl md:text-[1.0625rem];
  @apply text-left select-none;
  @apply transition-colors hover:bg-neutral-700;
}

.side-bar-label {
  @apply shrink-0 whitespace-nowrap self-center mx-1 px-2 text-xs font-semibold text-neutral-500 select-none;
  @apply md:self-auto md:whitespace-normal md:mx-2 md:mt-4 md:mb-0.5 md:px-4;
}
</style>
