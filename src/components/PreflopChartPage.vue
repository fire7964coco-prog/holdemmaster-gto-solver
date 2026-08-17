<template>
  <div class="pb-6 max-w-5xl">
    <p class="text-sm md:text-base text-neutral-400 mb-4">
      {{ L.intro }}
    </p>

    <!-- 포지션 탭 -->
    <div class="flex flex-wrap gap-1.5 md:gap-2 mb-4">
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
                <div
                  class="absolute inset-0 bg-bottom bg-no-repeat"
                  :style="{
                    'background-image': `linear-gradient(${yellow500} 0% 100%)`,
                    'background-size': `100% ${cellFreq(row, col)}%`,
                  }"
                ></div>
                <span
                  :class="
                    'absolute top-0 left-0.5 z-10 text-[0.5rem] md:text-[0.6875rem] leading-tight text-shadow ' +
                    (cellFreq(row, col) > 0 ? 'text-white' : 'text-neutral-500')
                  "
                >
                  {{ cellLabel(row, col) }}
                </span>
              </div>
            </td>
          </tr>
        </table>

        <!-- 범례 -->
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-neutral-400">
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
      </div>

      <!-- 우측: 통계·동작·설명 -->
      <div class="flex-grow min-w-0">
        <div class="flex flex-wrap gap-2 mb-4">
          <div class="stat-chip">
            {{ L.statPercent }} <b data-testid="preflop-percent">{{ percentOf(selected) }}%</b>
          </div>
          <div class="stat-chip">
            {{ L.statCombos }} <b>{{ Math.round(stats.combos) }} / 1326</b>
          </div>
          <div class="stat-chip">{{ L.statHands }} <b>{{ stats.hands }} / 169</b></div>
          <div class="stat-chip">{{ L.statMixed }} <b>{{ stats.mixedHands }}</b></div>
        </div>

        <div class="flex flex-wrap gap-2 mb-5">
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

        <div class="panel mb-4">
          <div class="section-title">{{ L.howTitle }}</div>
          <ul class="list-disc pl-5 text-sm text-neutral-300 space-y-1.5">
            <li>{{ L.how1 }}</li>
            <li>{{ L.how2 }}</li>
            <li>{{ L.how3 }}</li>
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
  gridFor,
  statsFor,
  rangeTextFor,
} from "../preflop-charts";
import { ranks } from "../utils";

const yellow500 = "#eab308";

const M = {
  ko: {
    intro:
      "포지션별 오픈 레인지(RFI) — 앞 사람이 모두 폴드했을 때 어떤 핸드로 " +
      "레이즈해야 할까요? 6맥스 캐시 100bb, 오픈 2.5bb 기준입니다. " +
      "부분 채움은 혼합 빈도(가끔만 오픈)를 뜻합니다.",
    legendOpen: "오픈 (100%)",
    legendMixed: "혼합 빈도 (채움 높이 = 오픈 %)",
    legendFold: "폴드",
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
    sourceTitle: "이 차트는 어떻게 만들었나요?",
    sourceBody:
      "특정 유료 솔버의 차트를 복제하지 않았습니다. 공개된 무료 GTO 자료 여러 개를 " +
      "핸드 단위로 교차 검증해 «합의 레인지»를 만들고, 자료마다 판단이 갈리는 경계 " +
      "핸드는 혼합 빈도로 표기했습니다. BTN·SB는 이 앱의 교육 예제에 쓰이는 " +
      "솔버 검증 레인지와도 대조했습니다.",
    sourceList:
      "교차 검증에 쓴 공개 자료: nlh.poker · Preflop Wizard · HoldemPro · " +
      "The Felt(about-poker.com) · BeyondGTO(포지션별 빈도) + 자체 교육 프리셋 레인지 (2026-08 수집)",
    phase2: "vs 레이즈(3벳/콜) 차트는 2단계로 준비 중입니다.",
  },
  en: {
    intro:
      "Opening ranges by position (RFI) — which hands should you raise when " +
      "everyone folds to you? Based on 6-max cash, 100bb, 2.5bb open. " +
      "Partially filled cells are mixed-frequency opens.",
    legendOpen: "Open (100%)",
    legendMixed: "Mixed frequency (fill height = open %)",
    legendFold: "Fold",
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
    sourceTitle: "How was this chart built?",
    sourceBody:
      "It is not a copy of any paid solver's chart. We cross-checked several " +
      "freely published GTO resources hand by hand to build a consensus range, " +
      "marking hands the sources disagree on as mixed frequencies. BTN and SB " +
      "were also checked against the solver-verified ranges used by this app's study spots.",
    sourceList:
      "Public sources cross-checked: nlh.poker · Preflop Wizard · HoldemPro · " +
      "The Felt (about-poker.com) · BeyondGTO (per-position frequencies) + our own study-spot ranges (collected 2026-08)",
    phase2: "Facing-a-raise charts (3-bet / call) are coming in phase 2.",
  },
} as const;

export default defineComponent({
  setup() {
    const store = useStore();
    const L = computed(() => M[i18n.locale]);

    const selected = ref<Position>("UTG");
    const copied = ref(false);

    const grid = computed(() => gridFor(selected.value));
    const stats = computed(() => statsFor(selected.value));

    const percentOf = (pos: Position) => statsFor(pos).percent.toFixed(1);

    // RangeEditor·RangeMiniViewer와 같은 격자 관례
    const cellFreq = (row: number, col: number) =>
      grid.value[13 * (row - 1) + col - 1];

    const cellLabel = (row: number, col: number) => {
      const r1 = 13 - Math.min(row, col);
      const r2 = 13 - Math.max(row, col);
      return ranks[r1] + ranks[r2] + ["s", "", "o"][Math.sign(row - col) + 1];
    };

    const copyRange = async () => {
      const text = rangeTextFor(selected.value);
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
      copied.value = true;
      setTimeout(() => (copied.value = false), 1500);
    };

    // 레인지를 커스텀 스팟 에디터로 — RangeEditor가 watch로 받아 적용한다
    const sendToEditor = (player: 0 | 1) => {
      store.pendingRangeText[player] = rangeTextFor(selected.value);
      store.sideView = player === 0 ? "oop-range" : "ip-range";
    };

    return {
      yellow500,
      positions: POSITIONS,
      selected,
      copied,
      stats,
      L,
      percentOf,
      cellFreq,
      cellLabel,
      copyRange,
      sendToEditor,
      Math,
    };
  },
});
</script>
