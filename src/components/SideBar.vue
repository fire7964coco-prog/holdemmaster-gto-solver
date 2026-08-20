<template>
  <aside
    class="flex flex-row md:flex-col shrink-0 w-full md:w-56 my-0 md:my-2 overflow-x-auto md:overflow-x-visible md:overflow-y-auto border-b md:border-b-0 md:border-r-2 border-neutral-700"
  >
    <div class="side-bar-group md:mb-1">
    <div class="side-bar-label">
      {{ L.exploreLabel }}<span class="hidden md:inline">{{ L.exploreLabelSuffix }}</span>
    </div>

    <button :class="itemStyle('about')" @click="store.sideView = 'about'">
      {{ L.about }}
    </button>

    <button :class="itemStyle('guide')" @click="store.sideView = 'guide'">
      {{ L.guide }}
    </button>

    <button :class="itemStyle('presets')" @click="store.sideView = 'presets'">
      {{ L.presets }}
      <span class="badge hidden md:inline text-xs font-semibold text-emerald-400">
        ⚡ {{ L.presetsBadge }}
      </span>
      <span class="md:hidden text-emerald-400">⚡</span>
    </button>

    <button :class="itemStyle('trainer')" @click="store.sideView = 'trainer'">
      {{ L.trainer }}
      <span class="badge hidden md:inline text-xs font-semibold text-blue-400">
        {{ L.trainerBadge }}
      </span>
    </button>

    <button :class="itemStyle('preflop')" @click="store.sideView = 'preflop'">
      {{ L.preflop }}
      <span class="badge hidden md:inline text-xs font-semibold text-yellow-500">
        {{ L.preflopBadge }}
      </span>
    </button>

    <button :class="itemStyle('equity')" @click="store.sideView = 'equity'">
      {{ L.equity }}
      <span class="badge hidden md:inline text-xs font-semibold text-emerald-400">
        {{ L.equityBadge }}
      </span>
    </button>

    </div>

    <div class="side-bar-group">
    <div class="side-bar-label">
      {{ L.customLabel }}<span class="hidden md:inline">{{ L.customLabelSuffix }}</span>
    </div>

    <button
      :class="itemStyle('oop-range')"
      @click="store.sideView = 'oop-range'"
    >
      ① {{ L.oopRange }}
      <span class="hidden md:flex mt-1 justify-center">
        <RangeMiniViewer :player="0" compact />
      </span>
    </button>

    <button :class="itemStyle('ip-range')" @click="store.sideView = 'ip-range'">
      ② {{ L.ipRange }}
      <span class="hidden md:flex mt-1 justify-center">
        <RangeMiniViewer :player="1" compact />
      </span>
    </button>

    <button :class="itemStyle('board')" @click="store.sideView = 'board'">
      ③ {{ L.board }}
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
      ④ {{ L.betSize }}
      <span class="hidden md:inline text-xs text-neutral-500">{{ L.betSizeSub }}</span>
    </button>

    <button
      :class="itemStyle('run-solver')"
      @click="store.sideView = 'run-solver'"
    >
      ⑤ {{ L.run }}
    </button>
    </div>
  </aside>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { SideView, useStore, useConfigStore } from "../store";
import { cardText } from "../utils";
import { i18n } from "../i18n";

import RangeMiniViewer from "./RangeMiniViewer.vue";

const M = {
  ko: {
    exploreLabel: "둘러보기",
    exploreLabelSuffix: " · 학습",
    about: "소개",
    guide: "사용법",
    presets: "교육 예제",
    presetsBadge: "바로 보기",
    trainer: "GTO 트레이너",
    trainerBadge: "EV 채점",
    preflop: "프리플랍 차트",
    preflopBadge: "오픈·수비",
    equity: "에퀴티 계산기",
    equityBadge: "승률",
    customLabel: "커스텀 스팟",
    customLabelSuffix: " — 직접 계산",
    oopRange: "OOP 레인지",
    ipRange: "IP 레인지",
    board: "보드",
    betSize: "벳 사이즈",
    betSizeSub: "트리 설정",
    run: "계산 실행",
  },
  en: {
    exploreLabel: "Explore",
    exploreLabelSuffix: " & Study",
    about: "About",
    guide: "How to Use",
    presets: "Study Spots",
    presetsBadge: "Instant",
    trainer: "GTO Trainer",
    trainerBadge: "EV Grading",
    preflop: "Preflop Charts",
    // 뱃지까지 한 줄에 들어와야 한다 — 「Open·Defend」는 1280×720에서 두 줄로 접혔다
    preflopBadge: "Open·Def",
    equity: "Equity Calculator",
    equityBadge: "Win%",
    customLabel: "Custom Spot",
    // ⚠ 이 라벨이 두 줄로 접히면 1280×720에서 ⑤가 화면 밖으로 밀린다 (한 줄로 유지할 것)
    customLabelSuffix: " — Solve",
    oopRange: "OOP Range",
    ipRange: "IP Range",
    board: "Board",
    betSize: "Bet Sizes",
    betSizeSub: "Tree Settings",
    run: "Run Solver",
  },
  // ⚠ ja도 ko/en과 같은 한 줄 제약 — 라벨을 늘리면 wrap 검사·sidebar-fit로 확인할 것
  ja: {
    exploreLabel: "スタディ",
    exploreLabelSuffix: "・ツール",
    about: "はじめに",
    guide: "使い方",
    presets: "学習スポット",
    presetsBadge: "計算済み",
    trainer: "GTOトレーナー",
    trainerBadge: "EV採点",
    preflop: "プリフロップ",
    preflopBadge: "レンジ表",
    equity: "エクイティ計算",
    equityBadge: "勝率",
    customLabel: "カスタムスポット",
    customLabelSuffix: "・自分で計算",
    oopRange: "OOPレンジ",
    ipRange: "IPレンジ",
    board: "ボード",
    betSize: "ベットサイズ",
    betSizeSub: "設定",
    run: "計算を実行",
  },
  // ⚠ es도 같은 한 줄 제약 — 스페인어 라벨은 길어지기 쉬우니 늘리면 sidebar-fit로 확인할 것
  es: {
    exploreLabel: "Explorar",
    exploreLabelSuffix: " y estudiar",
    about: "Acerca de",
    guide: "Cómo usarlo",
    presets: "Spots de estudio",
    presetsBadge: "Directo",
    trainer: "Entrenador GTO",
    trainerBadge: "Nota EV",
    preflop: "Tablas preflop",
    preflopBadge: "Rangos",
    equity: "Calc. de equity",
    equityBadge: "Victoria",
    customLabel: "Spot personalizado",
    // 한 줄 유지용 — 접미사를 비워 이름만 표시한다 (라벨이 길면 ⑤가 화면 밖으로 밀린다)
    customLabelSuffix: "",
    oopRange: "Rango OOP",
    ipRange: "Rango IP",
    board: "Board",
    betSize: "Bet sizes",
    betSizeSub: "Ajustes",
    run: "Calcular",
  },
} as const;

export default defineComponent({
  components: {
    RangeMiniViewer,
  },

  setup() {
    const store = useStore();
    const config = useConfigStore();
    const L = computed(() => M[i18n.locale]);

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
      L,
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
/* ①~⑤가 스크롤 없이 한 화면에 들어와야 하므로 데스크톱 높이를 조였다.
   기준 해상도는 1280×720 — 여기서 넘치면 ⑤ 계산 실행이 스크롤 뒤로 숨는다.
   조인 이력: py-3 → py-2 → py-1.5, 글자 1.0625rem → 0.9375rem, 항목 간격 my-1 → my-0.5
   (마지막 py-1.5는 2026-08-18 «에퀴티 계산기» 항목을 넣으며. 항목당 4px × 11개 = 44px 확보)
   ⚠ 여기서 항목을 또 늘리면 여백으로는 더 못 짜낸다 — 다른 항목을 빼거나 구조를 바꿀 것 */
.side-bar-item {
  @apply block shrink-0 whitespace-nowrap mx-1 my-1 px-3 py-2 rounded-xl text-sm;
  @apply md:shrink md:whitespace-normal md:mx-2 md:my-0.5 md:px-4 md:py-1.5 md:rounded-2xl md:text-[0.9375rem];
  @apply text-left select-none;
  @apply transition-colors hover:bg-neutral-700;
}

/* 항목이 늘 때마다(프리플랍 차트 → 에퀴티 계산기) 라벨·구분선 여백을 더 조였다 */
.side-bar-label {
  @apply shrink-0 whitespace-nowrap self-center mx-1 px-2 text-xs font-semibold text-neutral-500 select-none;
  @apply md:self-auto md:whitespace-normal md:mx-2 md:mt-0.5 md:mb-0.5 md:px-4;
  @apply md:text-[0.6875rem] md:uppercase md:tracking-wider;
}

/* 학습 영역과 커스텀 계산 영역을 블록(패널)으로 구분 (2026-08-19 사용자 요청).
   모바일 가로 탭바에서는 display:contents로 상자를 없애 기존 한 줄 배치를 유지한다.
   ⚠ 높이 예산: 테두리 4 + 패딩 8 + 간격 6 = +18px를 aside 여백 my-4→my-2(-16px)와
   구분선 제거(-3px)로 회수 — 1280×720에서 ⑤가 보이는지는 sidebar-fit-verify가 판정 */
.side-bar-group {
  @apply contents;
  @apply md:block md:mx-1 md:py-0.5 md:rounded-2xl;
  @apply md:border md:border-neutral-700 md:bg-neutral-800/40;
}
/* 패널 도입으로 항목 폭이 18px 줄어 EN «Equity Calculator Win %»가 두 줄로 접혔다
   (2026-08-19 사용자 실기기에서 발견 — 125% 배율에서 접힘). 그룹 여백을 줄이고(mx-2→mx-1)
   뱃지는 줄바꿈 금지 — 항목이 늘면 여기가 또 첫 파열점이다 */
.side-bar-item .badge {
  @apply whitespace-nowrap;
}
</style>
