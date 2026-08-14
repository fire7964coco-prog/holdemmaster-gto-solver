<template>
  <aside
    class="flex flex-row md:flex-col shrink-0 w-full md:w-56 my-0 md:my-4 overflow-x-auto md:overflow-x-visible md:overflow-y-auto border-b md:border-b-0 md:border-r-2 border-neutral-700"
  >
    <div class="side-bar-label">
      둘러보기<span class="hidden md:inline"> · 학습</span>
    </div>

    <button :class="itemStyle('about')" @click="store.sideView = 'about'">
      소개
    </button>

    <button :class="itemStyle('guide')" @click="store.sideView = 'guide'">
      사용법
    </button>

    <button :class="itemStyle('presets')" @click="store.sideView = 'presets'">
      교육 예제
      <span class="hidden md:inline text-xs font-semibold text-emerald-400">
        ⚡ 바로 보기
      </span>
      <span class="md:hidden text-emerald-400">⚡</span>
    </button>

    <button :class="itemStyle('trainer')" @click="store.sideView = 'trainer'">
      GTO 트레이너
      <span class="hidden md:inline text-xs font-semibold text-blue-400">
        EV 채점
      </span>
    </button>

    <div class="side-bar-divider"></div>

    <div class="side-bar-label">
      커스텀 스팟<span class="hidden md:inline"> — 직접 계산</span>
    </div>

    <button
      :class="itemStyle('oop-range')"
      @click="store.sideView = 'oop-range'"
    >
      ① OOP 레인지
      <span class="hidden md:flex mt-1 justify-center">
        <RangeMiniViewer :player="0" compact />
      </span>
    </button>

    <button :class="itemStyle('ip-range')" @click="store.sideView = 'ip-range'">
      ② IP 레인지
      <span class="hidden md:flex mt-1 justify-center">
        <RangeMiniViewer :player="1" compact />
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
      ④ 벳 사이즈
      <span class="hidden md:inline text-xs text-neutral-500">트리 설정</span>
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
/* ①~⑤가 스크롤 없이 한 화면에 들어와야 하므로 데스크톱 높이를 조였다
   (py-3 → py-2, 글자 1.0625rem → 0.9375rem, 항목 간격 my-1 → my-0.5) */
.side-bar-item {
  @apply block shrink-0 whitespace-nowrap mx-1 my-1 px-3 py-2 rounded-xl text-sm;
  @apply md:shrink md:whitespace-normal md:mx-2 md:my-0.5 md:px-4 md:py-2 md:rounded-2xl md:text-[0.9375rem];
  @apply text-left select-none;
  @apply transition-colors hover:bg-neutral-700;
}

.side-bar-label {
  @apply shrink-0 whitespace-nowrap self-center mx-1 px-2 text-xs font-semibold text-neutral-500 select-none;
  @apply md:self-auto md:whitespace-normal md:mx-2 md:mt-1.5 md:mb-0.5 md:px-4;
  @apply md:text-[0.6875rem] md:uppercase md:tracking-wider;
}

/* 학습 영역과 커스텀 계산 영역을 눈으로 구분 (모바일은 가로 탭바라 생략) */
.side-bar-divider {
  @apply hidden md:block md:mx-4 md:mt-2 md:border-t md:border-neutral-700;
}
</style>
