<template>
  <div class="pb-6 max-w-5xl">
    <!-- 모드: 오픈(RFI) / vs 오픈(수비) -->
    <div class="flex gap-1.5 mb-3">
      <button
        :class="modeStyle('rfi')"
        @click="mode = 'rfi'"
      >
        {{ L.modeRfi }}
      </button>
      <button
        :class="modeStyle('defend')"
        @click="mode = 'defend'"
      >
        {{ L.modeDefend }}
      </button>
    </div>

    <p class="text-sm md:text-base text-neutral-400 mb-4">
      {{ mode === "rfi" ? L.intro : L.introDefend }}
    </p>

    <!-- 포지션 탭 (오픈) -->
    <div v-if="mode === 'rfi'" class="flex flex-wrap gap-1.5 md:gap-2 mb-4">
      <button
        v-for="pos in positions"
        :key="pos"
        :class="
          'px-3 md:px-4 py-1.5 rounded-xl text-sm md:text-[0.9375rem] font-semibold transition-colors ' +
          (pos === selected
            ? 'bg-yellow-500 text-neutral-900'
            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700')
        "
        @click="selected = pos"
      >
        {{ pos }}
        <span
          :class="
            'ml-1 text-xs font-normal ' +
            (pos === selected ? 'text-neutral-700' : 'text-neutral-500')
          "
        >
          {{ percentOf(pos) }}%
        </span>
      </button>
    </div>

    <!-- 조합 탭 (수비) -->
    <div v-else class="flex flex-wrap gap-1.5 md:gap-2 mb-4">
      <button
        v-for="sc in scenarios"
        :key="sc.id"
        :class="
          'px-3 md:px-4 py-1.5 rounded-xl text-sm md:text-[0.9375rem] font-semibold transition-colors ' +
          (sc.id === selectedScenario
            ? 'bg-yellow-500 text-neutral-900'
            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700')
        "
        @click="selectedScenario = sc.id"
      >
        {{ sc.hero }} vs {{ sc.villain }}
        <span
          :class="
            'ml-1 text-xs font-normal ' +
            (sc.id === selectedScenario ? 'text-neutral-700' : 'text-neutral-500')
          "
        >
          {{ defendPercentOf(sc.id) }}%
        </span>
      </button>
    </div>

    <div class="flex flex-col lg:flex-row gap-4 lg:gap-6">
      <!-- 13×13 격자 -->
      <div class="shrink-0 w-full max-w-[26rem] lg:max-w-[28rem]">
        <table
          class="w-full border-collapse shadow-md select-none"
          data-testid="preflop-grid"
        >
          <tr v-for="row in 13" :key="row">
            <td
              v-for="col in 13"
              :key="col"
              class="relative border-[0.5px] border-black p-0"
              style="width: 7.69%"
            >
              <div class="pb-[100%]"></div>
              <div
                :class="
                  'absolute inset-0 ' +
                  (row === col ? 'bg-neutral-700' : 'bg-neutral-800')
                "
              >
                <template v-if="mode === 'rfi'">
                  <div
                    class="absolute inset-0 bg-bottom bg-no-repeat"
                    :style="{
                      'background-image': `linear-gradient(${yellow500} 0% 100%)`,
                      'background-size': `100% ${cellFreq(row, col)}%`,
                    }"
                  ></div>
                </template>
                <template v-else>
                  <!-- 콜(초록)을 바닥에, 3벳(빨강)을 그 위에 쌓는다 — 전체 높이 = 수비 빈도 -->
                  <div
                    class="absolute left-0 w-full"
                    :style="{
                      bottom: '0',
                      height: cellCall(row, col) + '%',
                      background: green500,
                    }"
                  ></div>
                  <div
                    class="absolute left-0 w-full"
                    :style="{
                      bottom: cellCall(row, col) + '%',
                      height: cellThreeBet(row, col) + '%',
                      background: red500,
                    }"
                  ></div>
                </template>
                <span
                  :class="
                    'absolute top-0 left-0.5 z-10 text-[0.5rem] md:text-[0.6875rem] leading-tight text-shadow ' +
                    (cellActive(row, col) ? 'text-white' : 'text-neutral-500')
                  "
                >
                  {{ cellLabel(row, col) }}
                </span>
              </div>
            </td>
          </tr>
        </table>

        <!-- 범례 -->
        <div
          v-if="mode === 'rfi'"
          class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-neutral-400"
        >
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded-sm bg-yellow-500"></span>
            {{ L.legendOpen }}
          </span>
          <span class="flex items-center gap-1.5">
            <span
              class="inline-block w-3 h-3 rounded-sm bg-neutral-800 border border-neutral-600 bg-bottom bg-no-repeat"
              :style="{
                'background-image': `linear-gradient(${yellow500} 0% 100%)`,
                'background-size': '100% 50%',
              }"
            ></span>
            {{ L.legendMixed }}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded-sm bg-neutral-800 border border-neutral-600"></span>
            {{ L.legendFold }}
          </span>
        </div>
        <div
          v-else
          class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-neutral-400"
        >
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded-sm" :style="{ background: red500 }"></span>
            {{ L.legend3bet }}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded-sm" :style="{ background: green500 }"></span>
            {{ L.legendCall }}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded-sm bg-neutral-800 border border-neutral-600"></span>
            {{ L.legendFold }}
          </span>
          <span>{{ L.legendMixedDefend }}</span>
        </div>
      </div>

      <!-- 우측: 통계·동작·설명 -->
      <div class="flex-grow min-w-0">
        <div v-if="mode === 'rfi'" class="flex flex-wrap gap-2 mb-4">
          <div class="stat-chip">
            {{ L.statPercent }} <b data-testid="preflop-percent">{{ percentOf(selected) }}%</b>
          </div>
          <div class="stat-chip">
            {{ L.statCombos }} <b>{{ Math.round(stats.combos) }} / 1326</b>
          </div>
          <div class="stat-chip">{{ L.statHands }} <b>{{ stats.hands }} / 169</b></div>
          <div class="stat-chip">{{ L.statMixed }} <b>{{ stats.mixedHands }}</b></div>
        </div>
        <div v-else class="flex flex-wrap gap-2 mb-4">
          <div class="stat-chip">
            {{ L.stat3bet }}
            <b data-testid="preflop-3bet">{{ defendStats.threeBetPercent.toFixed(1) }}%</b>
          </div>
          <div class="stat-chip">
            {{ L.statCall }} <b>{{ defendStats.callPercent.toFixed(1) }}%</b>
          </div>
          <div class="stat-chip">
            {{ L.statTotal }}
            <b data-testid="preflop-percent">{{ defendStats.totalPercent.toFixed(1) }}%</b>
          </div>
          <div class="stat-chip">{{ L.statMixed }} <b>{{ defendStats.mixedHands }}</b></div>
        </div>

        <p
          v-if="mode === 'defend' && selectedScenario === 'sb-vs-btn'"
          class="text-sm text-neutral-400 mb-4"
        >
          {{ L.sbNote }}
        </p>

        <div v-if="mode === 'rfi'" class="flex flex-wrap gap-2 mb-5">
          <button class="button-base button-blue" @click="copyRange">
            {{ copied ? L.copied : L.copy }}
          </button>
          <button
            class="button-base bg-neutral-700 hover:bg-neutral-600"
            @click="sendToEditor(0)"
          >
            {{ L.sendOop }}
          </button>
          <button
            class="button-base bg-neutral-700 hover:bg-neutral-600"
            @click="sendToEditor(1)"
          >
            {{ L.sendIp }}
          </button>
        </div>
        <div v-else class="flex flex-wrap gap-2 mb-5">
          <button class="button-base button-red" @click="copyDefend('threeBet')">
            {{ copiedAction === "threeBet" ? L.copied : L.copy3bet }}
          </button>
          <button
            class="button-base button-green"
            :disabled="selectedScenario === 'sb-vs-btn'"
            @click="copyDefend('call')"
          >
            {{ copiedAction === "call" ? L.copied : L.copyCall }}
          </button>
        </div>

        <div class="panel mb-4">
          <div class="section-title">{{ L.howTitle }}</div>
          <ul class="list-disc pl-5 text-sm text-neutral-300 space-y-1.5">
            <li>{{ L.how1 }}</li>
            <li>{{ mode === "rfi" ? L.how2 : L.howDefend2 }}</li>
            <li>{{ mode === "rfi" ? L.how3 : L.howDefend3 }}</li>
          </ul>
        </div>

        <div class="panel">
          <div class="section-title">{{ L.sourceTitle }}</div>
          <p class="text-sm text-neutral-400 leading-relaxed">
            {{ L.sourceBody }}
          </p>
          <p class="text-xs text-neutral-500 mt-2">
            {{ L.sourceList }}
          </p>
          <p class="text-xs text-neutral-500 mt-2">
            {{ L.phase2 }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { useStore } from "../store";
import { i18n } from "../i18n";
import {
  POSITIONS,
  Position,
  SCENARIOS,
  ScenarioId,
  gridFor,
  statsFor,
  rangeTextFor,
  defendGridsFor,
  defendStatsFor,
  defendRangeTextFor,
} from "../preflop-charts";
import { ranks } from "../utils";

const yellow500 = "#eab308";
const red500 = "#ef4444"; // 3벳 (결과 매트릭스의 벳 색과 같은 계열)
const green500 = "#22c55e"; // 콜

const M = {
  ko: {
    modeRfi: "오픈 (RFI)",
    modeDefend: "vs 오픈 (수비)",
    intro:
      "포지션별 오픈 레인지(RFI) — 앞 사람이 모두 폴드했을 때 어떤 핸드로 " +
      "레이즈해야 할까요? 6맥스 캐시 100bb, 오픈 2.5bb 기준입니다. " +
      "부분 채움은 혼합 빈도(가끔만 오픈)를 뜻합니다.",
    introDefend:
      "상대가 먼저 오픈 레이즈했을 때의 대응 — 자주 나오는 5개 조합입니다. " +
      "빨강은 3벳, 초록은 콜, 두 색이 쌓인 높이가 수비 빈도입니다. " +
      "6맥스 캐시 100bb, 오픈 2.5bb(SB 오픈은 3bb) 기준.",
    legendOpen: "오픈 (100%)",
    legendMixed: "혼합 빈도 (채움 높이 = 오픈 %)",
    legendFold: "폴드",
    legend3bet: "3벳",
    legendCall: "콜",
    legendMixedDefend: "채움 높이 = 빈도 (섞인 칸은 그 비율로 혼합)",
    stat3bet: "3벳 비율",
    statCall: "콜 비율",
    statTotal: "총 수비",
    copy3bet: "3벳 레인지 복사",
    copyCall: "콜 레인지 복사",
    sbNote:
      "SB는 BTN 오픈에 사실상 «3벳 아니면 폴드»로 대응합니다 — 포지션도 없고 " +
      "BB가 아직 뒤에 남아 있어, 콜은 두 가지 불리함을 동시에 안기 때문입니다.",
    statPercent: "오픈 비율",
    statCombos: "오픈 콤보",
    statHands: "오픈 핸드",
    statMixed: "혼합 핸드",
    copy: "레인지 텍스트 복사",
    copied: "✓ 복사됨",
    sendOop: "① OOP 레인지로 보내기",
    sendIp: "② IP 레인지로 보내기",
    howTitle: "읽는 법",
    how1: "좌상단→우하단 대각선이 페어, 그 위(오른쪽)가 수티드, 아래(왼쪽)가 오프수트입니다.",
    how2: "혼합 빈도 핸드(부분 채움)는 «항상»이 아니라 그 비율만큼만 오픈합니다. 경계 핸드라 어느 쪽을 택해도 EV 차이가 작습니다.",
    how3: "[레인지로 보내기]를 누르면 이 레인지가 커스텀 스팟의 레인지 입력에 채워집니다 — 플랍 이후를 직접 계산해 보세요.",
    howDefend2:
      "빨강+초록이 칸을 다 채우지 못하면 그만큼 폴드가 섞인 핸드입니다. 두 색이 함께 있는 칸은 3벳과 콜을 그 비율로 혼합합니다.",
    howDefend3:
      "[레인지 복사]로 얻은 텍스트를 커스텀 스팟의 ①/② 레인지 입력에 붙여넣으면 이 수비 레인지로 플랍 이후를 직접 계산할 수 있습니다.",
    sourceTitle: "이 차트는 어떻게 만들었나요?",
    sourceBody:
      "특정 유료 솔버의 차트를 복제하지 않았습니다. 공개된 무료 GTO 자료 여러 개를 " +
      "핸드 단위로 교차 검증해 «합의 레인지»를 만들고, 자료마다 판단이 갈리는 경계 " +
      "핸드는 혼합 빈도로 표기했습니다. BTN·SB는 이 앱의 교육 예제에 쓰이는 " +
      "솔버 검증 레인지와도 대조했습니다.",
    sourceList:
      "교차 검증에 쓴 공개 자료: nlh.poker · Preflop Wizard · HoldemPro · " +
      "The Felt(about-poker.com) · BeyondGTO · ThinkGTO(BB vs SB 실측 빈도) · " +
      "GTO Gecko·RiverOdds(수비 빈도 앵커) + 자체 교육 프리셋 레인지 (2026-08 수집)",
    phase2: "더 많은 수비 조합(vs UTG·HJ, 스퀴즈 등)은 다음 단계에서 추가됩니다.",
  },
  en: {
    modeRfi: "Opening (RFI)",
    modeDefend: "vs Open (Defense)",
    intro:
      "Opening ranges by position (RFI) — which hands should you raise when " +
      "everyone folds to you? Based on 6-max cash, 100bb, 2.5bb open. " +
      "Partially filled cells are mixed-frequency opens.",
    introDefend:
      "How to respond when someone open-raises before you — the five most " +
      "common matchups. Red is 3-bet, green is call, and the stacked height is " +
      "your total defend frequency. 6-max cash, 100bb, 2.5bb open (3bb for SB opens).",
    legendOpen: "Open (100%)",
    legendMixed: "Mixed frequency (fill height = open %)",
    legendFold: "Fold",
    legend3bet: "3-bet",
    legendCall: "Call",
    legendMixedDefend: "Fill height = frequency (split cells are mixed)",
    stat3bet: "3-bet %",
    statCall: "Call %",
    statTotal: "Total defend",
    copy3bet: "Copy 3-bet range",
    copyCall: "Copy call range",
    sbNote:
      "The SB plays essentially 3-bet-or-fold against a BTN open — you are out " +
      "of position with the BB still left to act, so calling takes on both " +
      "disadvantages at once.",
    statPercent: "Open %",
    statCombos: "Combos opened",
    statHands: "Hands opened",
    statMixed: "Mixed hands",
    copy: "Copy range text",
    copied: "✓ Copied",
    sendOop: "① Send to OOP Range",
    sendIp: "② Send to IP Range",
    howTitle: "How to read",
    how1: "The top-left to bottom-right diagonal is pairs; above it (right) is suited, below it (left) is offsuit.",
    how2: "Mixed-frequency hands (partial fill) are opened only that fraction of the time — they are borderline, so either choice loses little EV.",
    how3: "The [Send to Range] buttons load this range into the custom-spot range editor — try solving the postflop play yourself.",
    howDefend2:
      "If red + green don't fill the whole cell, the rest is folded. Cells showing both colors mix 3-bets and calls at those ratios.",
    howDefend3:
      "Paste a copied range into the custom-spot range inputs (① / ②) to solve the postflop play with this defense range yourself.",
    sourceTitle: "How was this chart built?",
    sourceBody:
      "It is not a copy of any paid solver's chart. We cross-checked several " +
      "freely published GTO resources hand by hand to build a consensus range, " +
      "marking hands the sources disagree on as mixed frequencies. BTN and SB " +
      "were also checked against the solver-verified ranges used by this app's study spots.",
    sourceList:
      "Public sources cross-checked: nlh.poker · Preflop Wizard · HoldemPro · " +
      "The Felt (about-poker.com) · BeyondGTO · ThinkGTO (BB vs SB solved frequencies) · " +
      "GTO Gecko · RiverOdds (defense anchors) + our own study-spot ranges (collected 2026-08)",
    phase2: "More defense matchups (vs UTG/HJ, squeezes) are coming in a later phase.",
  },
} as const;

export default defineComponent({
  setup() {
    const store = useStore();
    const L = computed(() => M[i18n.locale]);

    const mode = ref<"rfi" | "defend">("rfi");
    const selected = ref<Position>("UTG");
    const selectedScenario = ref<ScenarioId>("bb-vs-btn");
    const copied = ref(false);
    const copiedAction = ref<"" | "threeBet" | "call">("");

    const grid = computed(() => gridFor(selected.value));
    const stats = computed(() => statsFor(selected.value));
    const defendGrids = computed(() => defendGridsFor(selectedScenario.value));
    const defendStats = computed(() => defendStatsFor(selectedScenario.value));

    const percentOf = (pos: Position) => statsFor(pos).percent.toFixed(1);
    const defendPercentOf = (id: ScenarioId) =>
      defendStatsFor(id).totalPercent.toFixed(1);

    // RangeEditor·RangeMiniViewer와 같은 격자 관례
    const cellFreq = (row: number, col: number) =>
      grid.value[13 * (row - 1) + col - 1];
    const cellThreeBet = (row: number, col: number) =>
      defendGrids.value.threeBet[13 * (row - 1) + col - 1];
    const cellCall = (row: number, col: number) =>
      defendGrids.value.call[13 * (row - 1) + col - 1];
    const cellActive = (row: number, col: number) =>
      mode.value === "rfi"
        ? cellFreq(row, col) > 0
        : cellThreeBet(row, col) + cellCall(row, col) > 0;

    const cellLabel = (row: number, col: number) => {
      const r1 = 13 - Math.min(row, col);
      const r2 = 13 - Math.max(row, col);
      return ranks[r1] + ranks[r2] + ["s", "", "o"][Math.sign(row - col) + 1];
    };

    const writeClipboard = async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // clipboard API를 못 쓰는 환경 폴백
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
    };

    const copyRange = async () => {
      await writeClipboard(rangeTextFor(selected.value));
      copied.value = true;
      setTimeout(() => (copied.value = false), 1500);
    };

    const copyDefend = async (action: "threeBet" | "call") => {
      await writeClipboard(defendRangeTextFor(selectedScenario.value, action));
      copiedAction.value = action;
      setTimeout(() => (copiedAction.value = ""), 1500);
    };

    // 레인지를 커스텀 스팟 에디터로 — RangeEditor가 watch로 받아 적용한다
    const sendToEditor = (player: 0 | 1) => {
      store.pendingRangeText[player] = rangeTextFor(selected.value);
      store.sideView = player === 0 ? "oop-range" : "ip-range";
    };

    const modeStyle = (value: "rfi" | "defend") =>
      "px-3 py-1 rounded-lg text-sm font-semibold transition-colors " +
      (mode.value === value
        ? "bg-neutral-700 text-white"
        : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700");

    return {
      yellow500,
      red500,
      green500,
      positions: POSITIONS,
      scenarios: SCENARIOS,
      mode,
      modeStyle,
      selected,
      selectedScenario,
      copied,
      copiedAction,
      stats,
      defendStats,
      L,
      percentOf,
      defendPercentOf,
      cellFreq,
      cellThreeBet,
      cellCall,
      cellActive,
      cellLabel,
      copyRange,
      copyDefend,
      sendToEditor,
      Math,
    };
  },
});
</script>
