<template>
  <aside
    class="app-sidebar flex flex-col shrink-0 w-full md:w-56 my-0 md:my-2 md:overflow-y-auto border-b md:border-b-0 md:border-r border-neutral-700"
  >
    <div class="mobile-menu-groups md:hidden">
      <button :aria-pressed="!isCustom" :class="{ 'menu-group-active': !isCustom }" @click="openGroup(false)">{{ L.exploreLabel }}</button>
      <button :aria-pressed="isCustom" :class="{ 'menu-group-active': isCustom }" @click="openGroup(true)">{{ L.customLabel }}{{ L.customLabelSuffix }}</button>
    </div>
    <div class="side-bar-group md:mb-1" :class="{ 'mobile-group-active': !isCustom }" @scroll.passive="onMenuScroll">
    <div class="side-bar-label hidden md:block">
      {{ L.exploreLabel }}<span class="hidden md:inline">{{ L.exploreLabelSuffix }}</span>
    </div>

    <button :class="itemStyle('about')" @click="store.sideView = 'about'">
      {{ L.about }}
    </button>

    <button :class="itemStyle('guide')" @click="store.sideView = 'guide'">
      {{ L.guide }}
    </button>

    <!-- 교육예제·트레이너는 트레이너 빌드 전용 — npokers 빌드에서는 메뉴째 사라진다 -->
    <button
      v-if="FEATURE_TRAINER"
      :class="itemStyle('presets')"
      @click="store.sideView = 'presets'"
    >
      {{ L.presets }}
      <span class="badge hidden md:inline text-xs font-semibold text-brand">
        ⚡ {{ L.presetsBadge }}
      </span>
      <span class="md:hidden text-brand">⚡</span>
    </button>

    <button
      v-if="FEATURE_TRAINER"
      :class="itemStyle('trainer')"
      @click="store.sideView = 'trainer'"
    >
      {{ L.trainer }}
      <span class="badge hidden md:inline text-xs font-semibold text-brand">
        {{ L.trainerBadge }}
      </span>
    </button>

    <button :class="itemStyle('preflop')" @click="store.sideView = 'preflop'">
      {{ L.preflop }}
      <span class="badge hidden md:inline text-xs font-semibold text-brand">
        {{ L.preflopBadge }}
      </span>
    </button>

    <button :class="itemStyle('equity')" @click="store.sideView = 'equity'">
      {{ L.equity }}
      <span class="badge hidden md:inline text-xs font-semibold text-brand">
        {{ L.equityBadge }}
      </span>
    </button>

    </div>

    <div class="side-bar-group" :class="{ 'mobile-group-active': isCustom }" @scroll.passive="onMenuScroll">
    <div class="side-bar-label hidden md:block">
      {{ L.customLabel }}<span class="hidden md:inline">{{ L.customLabelSuffix }}</span>
    </div>

    <button
      :class="itemStyle('oop-range')"
      @click="store.sideView = 'oop-range'"
    >
      ① {{ L.oopRange }}
      <span class="step-status" :class="{ 'step-next': nextStep === 0 }" aria-hidden="true">{{ readySteps[0] ? '✓' : '○' }}</span>
      <span class="hidden md:flex mt-1 justify-center">
        <RangeMiniViewer :player="0" compact />
      </span>
    </button>

    <button :class="itemStyle('ip-range')" @click="store.sideView = 'ip-range'">
      ② {{ L.ipRange }}
      <span class="step-status" :class="{ 'step-next': nextStep === 1 }" aria-hidden="true">{{ readySteps[1] ? '✓' : '○' }}</span>
      <span class="hidden md:flex mt-1 justify-center">
        <RangeMiniViewer :player="1" compact />
      </span>
    </button>

    <button :class="itemStyle('board')" @click="store.sideView = 'board'">
      ③ {{ L.board }}
      <span class="step-status" :class="{ 'step-next': nextStep === 2 }" aria-hidden="true">{{ readySteps[2] ? '✓' : '○' }}</span>
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
      <span class="step-status" aria-hidden="true">✓</span>
      <span class="hidden md:inline text-xs text-neutral-500">{{ L.betSizeSub }}</span>
    </button>

    <button
      :class="itemStyle('run-solver')"
      @click="store.sideView = 'run-solver'"
    >
      ⑤ {{ L.run }}
      <span class="step-status" :class="{ 'step-next': nextStep === 4 }" aria-hidden="true">{{ readySteps[4] ? '✓' : '○' }}</span>
    </button>
    </div>
  </aside>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, ref, watch } from "vue";
import { SideView, useStore, useConfigStore } from "../store";
import { cardText } from "../utils";
import { i18n } from "../i18n";
import { FEATURE_TRAINER } from "@features";

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
    trainerBadge: "Graded",
    preflop: "Preflop Charts",
    // 뱃지까지 한 줄에 들어와야 한다 — 「Open·Defend」는 1280×720에서 두 줄로 접혔다
    preflopBadge: "Ranges",
    equity: "Equity Calculator",
    // 뱃지는 «무엇을 내주는가»를 한 마디로 — 라벨과 같은 말(Equity)을 반복하면 오작동처럼 보인다.
    // ko 승률 · ja 勝率 · es % victoria 와 같은 자리다. «Win %»는 퍼센트 기호가 있어
    // bb/100을 뜻하는 «win rate»와 혼동되지 않는다 (2026-08-20 눈검수).
    equityBadge: "Win %",
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
    exploreLabel: "学習",
    exploreLabelSuffix: "・ツール",
    about: "はじめに",
    guide: "使い方",
    presets: "学習スポット",
    // ⚠ «計算済み»는 «미리 계산해 뒀다»는 말이라 사용자 지시(2026-08-13)에 어긋났다.
    //   ko「바로 보기」·en「Instant」·de「Sofort」와 같이 «빠르다»로 말한다
    presetsBadge: "すぐ見る",
    trainer: "GTOトレーナー",
    trainerBadge: "EV採点",
    preflop: "プリフロップ",
    preflopBadge: "レンジ表",
    equity: "エクイティ計算機",
    equityBadge: "勝率",
    customLabel: "カスタムスポット",
    customLabelSuffix: "・自分で計算",
    oopRange: "OOPレンジ",
    ipRange: "IPレンジ",
    board: "ボード",
    betSize: "ベットサイズ",
    betSizeSub: "設定",
    run: "ソルバーを実行",
  },
  // ⚠ es도 같은 한 줄 제약 — 스페인어 라벨은 길어지기 쉬우니 늘리면 sidebar-fit로 확인할 것
  es: {
    exploreLabel: "Explorar",
    exploreLabelSuffix: " y estudiar",
    about: "Acerca de",
    guide: "Cómo usarlo",
    presets: "Spots de estudio",
    presetsBadge: "Al instante",
    trainer: "Entrenador GTO",
    // ⚠ 「Nota EV」는 이 항목이 «선택»되면(굵게) 1280×720에서 두 줄로 접혀 ⑤가 화면 밖으로 밀렸다
    // (2026-08-21 독일어 작업 중 선택 상태까지 재는 검사를 만들며 발견 — 라이브 결함이었다).
    // 이름(Entrenador GTO)은 다른 화면 문구가 그대로 가리키므로 뱃지 쪽을 줄였다
    trainerBadge: "EV",
    preflop: "Tablas preflop",
    preflopBadge: "Rangos",
    equity: "Equity",
    equityBadge: "% victoria",
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
  pt: {
    exploreLabel: "Explorar",
    exploreLabelSuffix: " e estudar",
    about: "Sobre",
    guide: "Como usar",
    presets: "Spots de estudo",
    presetsBadge: "Na hora",
    trainer: "Treinador GTO",
    trainerBadge: "Nota EV",
    preflop: "Tabelas pré-flop",
    preflopBadge: "Ranges",
    equity: "Equity",
    equityBadge: "% de vitória",
    customLabel: "Spot personalizado",
    // 한 줄 유지용 — 접미사를 비워 이름만 표시한다 (라벨이 길면 ⑤가 화면 밖으로 밀린다)
    customLabelSuffix: "",
    oopRange: "Range OOP",
    ipRange: "Range IP",
    board: "Board",
    betSize: "Bet sizes",
    betSizeSub: "Ajustes",
    run: "Calcular",
  },
  // ⚠ 독일어는 복합명사로 라벨이 길어진다 — 착수 전 DOM 주입으로 4해상도를 미리 쟀고
  // (1280×720에서 648/648, 기존과 동일) 접힘 없음을 확인한 뒤 확정한 문구다.
  // 늘리려면 반드시 sidebar-fit-verify.js를 다시 돌릴 것.
  de: {
    exploreLabel: "Entdecken",
    exploreLabelSuffix: " & Lernen",
    about: "Über",
    guide: "Anleitung",
    // 「Studienspots」는 길어서 접힘 위험 — Lernen+Spot 복합어로 줄였다 (der Spot은 독일 포커 실사용어)
    presets: "Lernspots",
    presetsBadge: "Sofort",
    trainer: "GTO-Trainer",
    trainerBadge: "EV-Note",
    preflop: "Preflop-Charts",
    preflopBadge: "Ranges",
    equity: "Equity-Rechner",
    // 「Gewinn %」는 1280×720에서 두 줄로 접혔다 (2026-08-21 캡처 눈검수) → 한 단계 줄임.
    // EquityPage의 승/무/패 칩이 「Sieg」라 그쪽과도 말이 맞는다
    equityBadge: "Sieg-%",
    customLabel: "Eigener Spot",
    // 한 줄 유지용 — es·pt와 같이 접미사를 비운다
    customLabelSuffix: "",
    oopRange: "OOP-Range",
    ipRange: "IP-Range",
    board: "Board",
    betSize: "Bet Sizes",
    // 「Tree Settings」의 뜻을 살리면서 ④가 선택돼도 한 줄에 들어간다
    betSizeSub: "Spielbaum",
    run: "Berechnen",
  },
  // ⚠ 이 라벨들은 «착수 전»에 zh-sidebar-premeasure.js로 4해상도 + 선택 상태 11화면을
  // 미리 재고 확정한 것이다 (1280×720에서 648/648, 접힘 0건). 한자는 글자당 폭이 커서
  // 짧아 보여도 두 자만 늘리면 접힌다 — 고칠 땐 sidebar-fit-verify.js를 반드시 다시 돌릴 것.
  zh: {
    exploreLabel: "探索",
    exploreLabelSuffix: " · 学习",
    about: "简介",
    guide: "使用方法",
    presets: "教学案例",
    // ⚠ 사용자 지시(2026-08-13): 유저에게 «미리 계산»을 언급하지 않는다.
    //   ko「바로 보기」·en「Instant」와 같이 «바로 볼 수 있다»로만 말한다
    presetsBadge: "立刻看",
    trainer: "GTO 训练器",
    trainerBadge: "EV 评分",
    preflop: "翻前范围表",
    preflopBadge: "开池·防守",
    equity: "胜率计算器",
    // 라벨이 이미 「胜率」이라 뱃지에 같은 말을 또 쓰면 오작동처럼 보인다.
    // 여기에 영어 원词를 두면 «첫 등장 영어 병기»(브리프 §0.5-1) 역할도 겸한다
    equityBadge: "Equity",
    customLabel: "自定义牌局",
    // es·pt·de는 길이 때문에 접미사를 비웠지만 중국어는 한자가 짧아 실측상 여유가 있었다
    customLabelSuffix: " · 自己算",
    oopRange: "OOP 范围",
    ipRange: "IP 范围",
    board: "公共牌",
    // bet size = 「下注尺寸」. 중국 德扑 매체(dpskill)가 쓰는 정착역 — 리서치 §2 출처
    betSize: "下注尺寸",
    betSizeSub: "决策树",
    // 화면 제목(App.vue "run-solver")·안의 버튼과 같은 이름이어야 한다 —
    // 다른 사이드바 항목은 전부 제목과 일치하는데 ⑤만 달랐다 (검토자 C)
    run: "运行求解器",
  },
  // ⚠ 이 라벨들도 «착수 전»에 zh-hant-sidebar-premeasure.js로 4해상도 + 선택 상태 11화면을
  // 미리 재고 확정한 것이다 (15/15 PASS, 1280×720에서 648/648, 접힘 0건).
  // 번체는 간체와 «글자 폭»이 같지만 글자 «수»가 달라진 항목이 있어 다시 쟀다
  // (自定义牌局 4자 → 自訂牌局 3자 · 运行求解器 → 執行解算器).
  "zh-hant": {
    exploreLabel: "探索",
    exploreLabelSuffix: " · 學習",
    about: "簡介",
    guide: "使用方法",
    presets: "教學案例",
    // ⚠ 사용자 지시(2026-08-13): 유저에게 «미리 계산»을 언급하지 않는다
    presetsBadge: "立刻看",
    trainer: "GTO 訓練器",
    trainerBadge: "EV 評分",
    preflop: "翻前範圍表",
    preflopBadge: "開池·防守",
    equity: "勝率計算器",
    // 라벨이 이미 「勝率」이라 뱃지에는 영어 원어를 둔다 (첫 등장 병기 역할도 겸한다)
    equityBadge: "Equity",
    // 台灣 소프트웨어 표기는 «自訂»이다 (본체 번체 포스팅 自訂 1 / 自定義 0.
    // 간체의 「自定义」와 다르다 — 대만 Windows·Office가 전부 自訂을 쓴다)
    customLabel: "自訂牌局",
    customLabelSuffix: " · 自己算",
    oopRange: "OOP 範圍",
    ipRange: "IP 範圍",
    board: "公共牌",
    // bet size = 「下注尺寸」 (본체 브리프 §7-D 底池賠率 필라의 «下注尺寸표» — 간체와 같다)
    betSize: "下注尺寸",
    betSizeSub: "決策樹",
    // solver=解算器(브리프 §7-C) · run=執行(台灣 표기. 본체 코퍼스 執行 3 / 運行 0).
    // 화면 제목(App.vue "run-solver")·안의 버튼과 글자까지 같아야 한다
    run: "執行解算器",
  },
  // fr 라벨은 fr-sidebar-premeasure.js로 4해상도 + 선택 상태 12뷰 실측 후 확정 (2026-08-24).
  // 1차 후보에서 두 개가 접혔다: «Immédiat» 뱃지(전 해상도) → Direct ·
  // «Tableaux préflop»(선택 시 ⑤가 화면 밖) → Charts préflop (프랑스 실사용어 chart préflop)
  fr: {
    exploreLabel: "Explorer",
    exploreLabelSuffix: " et étudier",
    about: "À propos",
    guide: "Mode d'emploi",
    presets: "Spots d'étude",
    // ⚠ 사용자 지시(2026-08-13): 유저에게 «미리 계산»을 언급하지 않는다
    presetsBadge: "Direct",
    // 도구명 Trainer는 프랑스 코퍼스가 영어로 쓴다 (리서치 §1-2)
    trainer: "Trainer GTO",
    trainerBadge: "Note EV",
    preflop: "Charts préflop",
    preflopBadge: "Ranges",
    // es·pt와 같은 선택 — "Calculateur d'equity"(20자)는 접힘 확정이라 원어 하나로
    equity: "Equity",
    equityBadge: "% victoire",
    customLabel: "Spot personnalisé",
    // 한 줄 유지용 — es·pt·de와 같이 접미사를 비운다
    customLabelSuffix: "",
    oopRange: "Range OOP",
    ipRange: "Range IP",
    board: "Board",
    betSize: "Bet sizes",
    betSizeSub: "Réglages",
    run: "Calculer",
  },
  // id 라벨은 id-sidebar-premeasure.js로 4해상도 + 선택 상태 12뷰 실측 후 확정 (2026-09-02, 15뷰 전부 PASS).
  // 도구명 Trainer·용어 Range·Board·Equity·Bet size는 본체 id 코퍼스가 영어 그대로 쓴다(리서치 §2).
  id: {
    exploreLabel: "Jelajahi",
    exploreLabelSuffix: " & pelajari",
    about: "Tentang",
    guide: "Cara pakai",
    presets: "Spot belajar",
    // ⚠ 사용자 지시(2026-08-13): 유저에게 «미리 계산»을 언급하지 않는다 — «즉시»로만
    presetsBadge: "Instan",
    // Pelatih는 사람(코치)이 1차 의미 — 도구명은 영어 Trainer (리서치 §1-2)
    trainer: "Trainer GTO",
    trainerBadge: "Skor EV",
    preflop: "Chart preflop",
    preflopBadge: "Range",
    equity: "Equity",
    equityBadge: "% menang",
    customLabel: "Spot kustom",
    // 한 줄 유지용 — es·pt·de·fr과 같이 접미사를 비운다
    customLabelSuffix: "",
    oopRange: "Range OOP",
    ipRange: "Range IP",
    board: "Board",
    betSize: "Bet size",
    betSizeSub: "Pengaturan",
    run: "Hitung",
  },
  // ms 라벨은 ms-sidebar-premeasure.js 실측으로 확정 (리서치 §3). id와 어휘가 겹쳐 보여도
  // 인니어(kustom·Instan·Pengaturan·Hitung)를 쓰지 않는다 — 말레이 표준어로 새로 잡았다.
  ms: {
    exploreLabel: "Teroka",
    exploreLabelSuffix: " & belajar",
    about: "Tentang",
    // 「Cara menggunakan」보다 짧다 — 한 줄 유지
    guide: "Cara guna",
    presets: "Spot belajar",
    // ⚠ 사용자 지시(2026-08-13): 유저에게 «미리 계산»을 언급하지 않는다 — «즉시»로만
    presetsBadge: "Segera",
    // Jurulatih는 사람(코치)이 1차 의미 — 도구명은 영어 Trainer (리서치 §1-3)
    trainer: "Trainer GTO",
    trainerBadge: "Skor EV",
    preflop: "Carta preflop",
    preflopBadge: "Range",
    equity: "Equity",
    equityBadge: "% menang",
    customLabel: "Spot tersuai",
    // 한 줄 유지용 — es·pt·de·fr·id와 같이 접미사를 비운다
    customLabelSuffix: "",
    oopRange: "Range OOP",
    ipRange: "Range IP",
    board: "Board",
    betSize: "Bet size",
    betSizeSub: "Tetapan",
    run: "Kira",
  },
  hi: {
    exploreLabel: "जानें",
    exploreLabelSuffix: " और सीखें",
    about: "परिचय",
    guide: "कैसे इस्तेमाल करें",
    presets: "अभ्यास स्पॉट",
    presetsBadge: "तुरंत",
    trainer: "GTO Trainer",
    trainerBadge: "EV",
    preflop: "Preflop चार्ट",
    preflopBadge: "Range",
    equity: "Equity",
    equityBadge: "हिस्सा",
    customLabel: "अपना स्पॉट",
    customLabelSuffix: "",
    oopRange: "OOP Range",
    ipRange: "IP Range",
    board: "Board",
    betSize: "Bet size",
    betSizeSub: "सेटिंग",
    run: "गणना करें",
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
    const customViews: SideView[] = ["oop-range", "ip-range", "board", "tree-config", "run-solver"];
    const isCustom = computed(() => customViews.includes(store.sideView));
    const lastExplore = ref<SideView>("about");
    const lastCustom = ref<SideView>("oop-range");
    const readySteps = computed(() => [config.range[0].some(Boolean), config.range[1].some(Boolean), config.board.length >= 3, true, store.isSolverFinished]);
    const nextStep = computed(() => readySteps.value.findIndex(ready => !ready));
    watch(() => store.sideView, async view => {
      if (customViews.includes(view)) lastCustom.value = view;
      else lastExplore.value = view;
      await nextTick();
      if (window.matchMedia("(max-width: 767px)").matches) {
        const item = document.querySelector<HTMLElement>(".mobile-group-active .side-bar-item.text-blue-300");
        const group = item?.parentElement;
        if (item && group) {
          // 가운데로 붙인다 — 예전엔 «보일 만큼만» 움직여 활성 항목이 언제나 가장자리에
          // 딱 붙고, 옆 항목은 마지막 한 글자만 남았다(«지 ✓») — 스크롤줄이 아니라
          // 글자가 깨진 것처럼 보였다. 양쪽을 고르게 보여 주면 «더 있다»가 읽힌다.
          const target = item.offsetLeft - (group.clientWidth - item.offsetWidth) / 2;
          group.scrollLeft = Math.max(0, Math.min(target, group.scrollWidth - group.clientWidth));
          syncMenuFade(group);
        }
      }
    }, { immediate: true });
    // 양끝 페이드는 «더 스크롤할 게 있다»를 뜻한다 — 끝까지 갔으면 그쪽은 끄다.
    const syncMenuFade = (group: HTMLElement) => {
      const max = group.scrollWidth - group.clientWidth;
      group.classList.toggle("fade-start", group.scrollLeft > 4);
      group.classList.toggle("fade-end", group.scrollLeft < max - 4);
    };
    const onMenuScroll = (event: Event) => syncMenuFade(event.currentTarget as HTMLElement);

    const openGroup = (custom: boolean) => {
      store.sideView = custom ? lastCustom.value : lastExplore.value;
    };

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
      FEATURE_TRAINER,
      isCustom,
      readySteps,
      nextStep,
      openGroup,
      onMenuScroll,
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
  position: relative;
  @apply block shrink-0 whitespace-nowrap mx-1 my-1 px-3 py-2 rounded-md text-sm;
  @apply md:shrink md:whitespace-normal md:mx-2 md:my-0.5 md:px-3 md:py-1.5 md:rounded-md md:text-[0.8125rem];
  @apply text-left select-none;
  @apply transition-colors hover:bg-neutral-700;
}

/* 항목이 늘 때마다(프리플랍 차트 → 에퀴티 계산기) 라벨·구분선 여백을 더 조였다 */
.side-bar-label {
  @apply shrink-0 whitespace-nowrap self-center mx-1 px-2 text-xs font-semibold text-neutral-500 select-none;
  @apply md:self-auto md:whitespace-normal md:mx-2 md:mt-0.5 md:mb-0.5 md:px-3;
  @apply md:text-[0.6875rem] md:uppercase md:tracking-wider;
}

/* 학습 영역과 커스텀 계산 영역을 블록(패널)으로 구분 (2026-08-19 사용자 요청).
   모바일 가로 탭바에서는 display:contents로 상자를 없애 기존 한 줄 배치를 유지한다.
   ⚠ 높이 예산: 테두리 4 + 패딩 8 + 간격 6 = +18px를 aside 여백 my-4→my-2(-16px)와
   구분선 제거(-3px)로 회수 — 1280×720에서 ⑤가 보이는지는 sidebar-fit-verify가 판정 */
.side-bar-group {
  @apply hidden;
  @apply md:block md:mx-1 md:py-1 md:rounded-lg;
  @apply md:border md:border-neutral-700 md:bg-surface-1;
}
.mobile-menu-groups { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: 4px; padding: 4px 8px; background: rgb(var(--c-bg-1)); }
.mobile-menu-groups button { min-height: 40px; padding: 4px 8px; border: 1px solid rgb(var(--c-line)); border-radius: 6px; color: rgb(var(--c-text-secondary)); font-size: 13px; line-height: 1.35; overflow-wrap: anywhere; }
.mobile-menu-groups .menu-group-active { color: rgb(var(--c-brand)); background: rgb(var(--c-bg-3)); border-color: rgb(var(--c-brand)); }
.step-status { display: inline-block; margin-left: 5px; color: rgb(var(--c-text-muted)); font-size: 12px; }
.step-next { color: rgb(var(--c-brand)); }
.step-next::after { content: ""; display: inline-block; width: 4px; height: 4px; margin: 0 0 2px 3px; border-radius: 50%; background: currentColor; }
@media (max-width: 767px) {
  .side-bar-group.mobile-group-active {
    display: flex; min-width: 0; max-width: 100%; overflow-x: auto; overscroll-behavior-x: contain;
    /* 페이드 폭은 스크롤 위치로 켜진다(fade-start / fade-end) —
       끝에 닿은 쪽까지 흐리면 «더 있는 줄»처럼 보여 거짓말이 된다. */
    --fade-l: 0px; --fade-r: 0px;
    -webkit-mask-image: linear-gradient(to right, transparent 0, #000 var(--fade-l), #000 calc(100% - var(--fade-r)), transparent 100%);
    mask-image: linear-gradient(to right, transparent 0, #000 var(--fade-l), #000 calc(100% - var(--fade-r)), transparent 100%);
  }
  .side-bar-group.fade-start { --fade-l: 16px; }
  .side-bar-group.fade-end { --fade-r: 16px; }
  .side-bar-item { min-height: 40px; margin-top: 2px; margin-bottom: 3px; }
}
/* 패널 도입으로 항목 폭이 18px 줄어 EN «Equity Calculator Win %»가 두 줄로 접혔다
   (2026-08-19 사용자 실기기에서 발견 — 125% 배율에서 접힘). 그룹 여백을 줄이고(mx-2→mx-1)
   뱃지는 줄바꿈 금지 — 항목이 늘면 여기가 또 첫 파열점이다 */
.side-bar-item .badge {
  @apply whitespace-nowrap;
}
/* Keep the existing state class contract; change only the navigation accent. */
.side-bar-item.text-blue-300 {
  @apply text-brand bg-surface-3;
  box-shadow: inset 2px 0 0 rgb(var(--c-brand));
}
@media (min-width: 768px) {
  .mobile-menu-groups { display: none; }
  .side-bar-item .step-status { position: absolute; right: 5px; top: 4px; font-size: 10px; }
  .side-bar-item:has(.step-status) { padding-right: 20px; }
  .side-bar-item:has(table) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .side-bar-item:has(table) > span {
    margin-top: 0;
    flex: none;
  }
  .side-bar-item :deep(table) {
    width: 52px;
    height: 52px;
    box-shadow: none;
  }
  .side-bar-item :deep(table tr) {
    height: 4px;
  }
  .side-bar-item :deep(table td) {
    width: 4px;
  }
}
</style>
