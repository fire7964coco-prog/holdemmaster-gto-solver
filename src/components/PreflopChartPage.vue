<template>
  <div class="pb-6 max-w-5xl">
    <!--
      모드별로 다른 것(탭·격자·범례·통계·안내문·버튼·설명)은 전부 script의 `modes`
      서술자에 데이터로 들어 있다. 새 모드를 추가할 때 여기에 분기를 더하지 말고
      서술자 배열에 항목을 하나 더할 것.
    -->
    <div class="flex gap-1.5 mb-3">
      <button
        v-for="m in modes"
        :key="m.key"
        :class="modeStyle(m.key)"
        @click="mode = m.key"
      >
        {{ m.label }}
      </button>
    </div>

    <p class="text-sm md:text-base text-neutral-400 mb-4">{{ active.intro }}</p>

    <!-- 포지션 탭(오픈) / 조합 탭(수비·vs 3벳) -->
    <div class="flex flex-wrap gap-1.5 md:gap-2 mb-4">
      <button
        v-for="tab in active.tabs"
        :key="tab.key"
        :class="
          'px-3 md:px-4 py-1.5 rounded-xl text-sm md:text-[0.9375rem] font-semibold transition-colors ' +
          (tab.active
            ? 'bg-yellow-500 text-neutral-900'
            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700')
        "
        @click="tab.select()"
      >
        {{ tab.label }}
        <span
          :class="
            'ml-1 text-xs font-normal ' +
            (tab.active ? 'text-neutral-700' : 'text-neutral-500')
          "
        >
          {{ tab.percent }}%
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
                <template v-if="!active.dual">
                  <div
                    class="absolute inset-0 bg-bottom bg-no-repeat"
                    :style="{
                      'background-image': `linear-gradient(${yellow500} 0% 100%)`,
                      'background-size': `100% ${cellFreq(row, col)}%`,
                    }"
                  ></div>
                </template>
                <template v-else>
                  <!-- 콜(초록)을 바닥에, 레이즈(빨강)를 그 위에 쌓는다 — 전체 높이 = 계속 빈도 -->
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
                      height: cellRaise(row, col) + '%',
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
          v-if="!active.dual"
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
            {{ active.legendRaise }}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded-sm" :style="{ background: green500 }"></span>
            {{ L.legendCall }}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded-sm bg-neutral-800 border border-neutral-600"></span>
            {{ L.legendFold }}
          </span>
          <span>{{ active.legendNote }}</span>
        </div>
      </div>

      <!-- 우측: 통계·동작·설명 -->
      <div class="flex-grow min-w-0">
        <div class="flex flex-wrap gap-2 mb-4">
          <div v-for="s in active.stats" :key="s.label" class="stat-chip">
            {{ s.label }} <b :data-testid="s.testid">{{ s.value }}</b>
          </div>
        </div>

        <p v-if="active.note" class="text-sm text-neutral-400 mb-4">
          {{ active.note }}
        </p>

        <div class="flex flex-wrap gap-2 mb-5">
          <button
            v-for="a in active.actions"
            :key="a.key"
            :class="a.cls"
            :disabled="a.disabled"
            @click="a.run()"
          >
            {{ a.label }}
          </button>
        </div>

        <div class="panel mb-4">
          <div class="section-title">{{ L.howTitle }}</div>
          <ul class="list-disc pl-5 text-sm text-neutral-300 space-y-1.5">
            <li v-for="(line, i) in active.how" :key="i">{{ line }}</li>
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
  VS3BET_SCENARIOS,
  Vs3BetId,
  gridFor,
  statsFor,
  rangeTextFor,
  defendGridsFor,
  defendStatsFor,
  defendRangeTextFor,
  vs3betGridsFor,
  vs3betStatsFor,
  vs3betRangeTextFor,
} from "../preflop-charts";
import { ranks } from "../utils";

const yellow500 = "#eab308";
const red500 = "#ef4444"; // 3벳 (결과 매트릭스의 벳 색과 같은 계열)
const green500 = "#22c55e"; // 콜

const M = {
  ko: {
    modeRfi: "오픈 (RFI)",
    modeDefend: "vs 오픈 (수비)",
    mode3bet: "vs 3벳 (오픈 후)",
    intro3bet:
      "내가 오픈 레이즈했는데 3벳을 받았을 때의 대응 — 빨강은 4벳, 초록은 콜, " +
      "나머지는 폴드입니다. 빈도는 «오픈했다면» 기준이라 오픈하지 않는 핸드는 " +
      "비어 있습니다. 6맥스 캐시 100bb, 오픈 2.5bb, 3벳 약 10~11bb 기준.",
    legend4bet: "4벳",
    legendCond: "빈 칸 = 애초에 오픈 안 함",
    stat4bet: "4벳 비율",
    statContinue: "계속(오픈 대비)",
    copy4bet: "4벳 레인지 복사",
    note3bet:
      "통계는 전체 핸드가 아니라 «오픈 레인지 대비» 비율입니다. 4벳 밸류는 " +
      "QQ+/AK 중심이고, A5s-A4s 같은 블러프를 소량 섞습니다. 콜은 포지션이 " +
      "있으니 페어·수딧 브로드웨이·커넥터까지 넓게 가져갑니다.",
    squeezeNote:
      "스퀴즈 = 오픈과 콜러가 모두 있는 상태에서의 3벳(여기서는 약 11~12bb). " +
      "콜러가 있으면 헤즈업 수비보다 전체 수비는 좁아지고 3벳은 밸류 중심이 " +
      "됩니다. 오버콜은 멀티웨이에서 너트를 만들 수 있는 수딧·커넥티드 핸드 위주입니다.",
    how3bet2:
      "빨강+초록이 칸을 다 채우지 못하면 그만큼 폴드입니다. 두 색이 함께면 4벳과 " +
      "콜을 혼합합니다. 오픈 레인지에 없는 핸드는 이 상황 자체가 생기지 않아 비어 있습니다.",
    intro:
      "포지션별 오픈 레인지(RFI) — 앞 사람이 모두 폴드했을 때 어떤 핸드로 " +
      "레이즈해야 할까요? 6맥스 캐시 100bb, 오픈 2.5bb 기준입니다. " +
      "부분 채움은 혼합 빈도(가끔만 오픈)를 뜻합니다.",
    introDefend:
      "상대가 먼저 오픈 레이즈했을 때의 대응 — 자주 나오는 조합들입니다. " +
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
    ipNote:
      "포지션이 있어도 앞 포지션의 오픈은 레인지가 강하고, 콜하면 뒤에 남은 " +
      "블라인드의 스퀴즈 위험까지 안습니다. 그래서 IP 수비는 3벳 중심의 좁은 " +
      "레인지가 되고, 콜은 페어·최상위 수딧 위주로만 남습니다.",
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
      "GTO Gecko·RiverOdds(수비 빈도 앵커) · GTO Wizard 블로그·FreeBetRange" +
      "(IP 수비·스퀴즈 원칙) · 888poker·Run It Once(vs 3벳 빈도) + " +
      "자체 교육 프리셋 레인지 (2026-08 수집)",
    phase2: "수비 조합과 시나리오는 계속 추가될 예정입니다.",
  },
  en: {
    modeRfi: "Opening (RFI)",
    modeDefend: "vs Open (Defense)",
    mode3bet: "vs 3-bet (after opening)",
    intro3bet:
      "How to respond when your open-raise gets 3-bet — red is 4-bet, green is " +
      "call, the rest folds. Frequencies are conditional on having opened, so " +
      "hands you never open are blank. 6-max cash, 100bb, 2.5bb open, ~10-11bb 3-bet.",
    legend4bet: "4-bet",
    legendCond: "Blank = never opened in the first place",
    stat4bet: "4-bet %",
    statContinue: "Continue (of opens)",
    copy4bet: "Copy 4-bet range",
    note3bet:
      "The stats are shares of your opening range, not of all hands. 4-bet value " +
      "centers on QQ+/AK with a few bluffs like A5s-A4s mixed in. With position, " +
      "the calling range stays wide: pairs, suited broadways, and connectors.",
    squeezeNote:
      "A squeeze is a 3-bet with both an opener and a caller in the pot (about " +
      "11-12bb here). The caller makes total defense tighter than heads-up and " +
      "pushes the 3-bet toward value. Overcalls favor suited, connected hands " +
      "that can make the nuts multiway.",
    how3bet2:
      "If red + green don't fill the cell, the rest is folded. Cells with both " +
      "colors mix 4-bets and calls. Hands outside the opening range never face " +
      "this spot, so they are blank.",
    intro:
      "Opening ranges by position (RFI) — which hands should you raise when " +
      "everyone folds to you? Based on 6-max cash, 100bb, 2.5bb open. " +
      "Partially filled cells are mixed-frequency opens.",
    introDefend:
      "How to respond when someone open-raises before you — the most " +
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
    ipNote:
      "Even with position, an early-position open is a strong range, and " +
      "calling risks a squeeze from the blinds still left to act. In-position " +
      "defense is therefore a narrow, 3-bet-centric range, with calls mostly " +
      "limited to pairs and premium suited hands.",
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
      "GTO Gecko · RiverOdds (defense anchors) · GTO Wizard blog · FreeBetRange " +
      "(IP defense & squeeze principles) · 888poker · Run It Once (vs 3-bet " +
      "frequencies) + our own study-spot ranges (collected 2026-08)",
    phase2: "More matchups and scenarios will keep being added.",
  },
} as const;

type ModeKey = "rfi" | "defend" | "vs3bet";

/**
 * 모드 서술자 — 모드마다 다른 것을 전부 여기 데이터로 모은다.
 * 템플릿에는 `mode === "..."` 분기가 없다. 모드를 추가할 때는 이 배열에 항목 하나를 더한다.
 *  - dual  : 격자가 두 겹(레이즈 빨강 + 콜 초록)인가. false면 단색 한 겹(오픈 빈도).
 *  - single/raise/call : 격자 데이터. dual이면 raise·call, 아니면 single을 쓴다.
 *  - testid: 검증 스크립트(preflop-verify.js)가 잡는 지점 — 바꾸면 검증이 깨진다.
 */
type ChartMode = {
  key: ModeKey;
  label: string;
  intro: string;
  dual: boolean;
  tabs: {
    key: string;
    label: string;
    percent: string;
    active: boolean;
    select: () => void;
  }[];
  legendRaise: string;
  legendNote: string;
  single: number[] | null;
  raise: number[] | null;
  call: number[] | null;
  stats: { label: string; value: string; testid?: string }[];
  note: string;
  actions: {
    key: string;
    label: string;
    cls: string;
    disabled: boolean;
    run: () => void;
  }[];
  how: string[];
};

export default defineComponent({
  setup() {
    const store = useStore();
    const L = computed(() => M[i18n.locale]);

    const mode = ref<ModeKey>("rfi");
    const selected = ref<Position>("UTG");
    const selectedScenario = ref<ScenarioId>("bb-vs-btn");
    const selectedVs3bet = ref<Vs3BetId>("btn-vs-bb-3bet");
    const copied = ref(false);
    const copiedAction = ref<"" | "threeBet" | "fourBet" | "call">("");

    const grid = computed(() => gridFor(selected.value));
    const stats = computed(() => statsFor(selected.value));
    const defendGrids = computed(() => defendGridsFor(selectedScenario.value));
    const defendStats = computed(() => defendStatsFor(selectedScenario.value));
    const vs3Grids = computed(() => vs3betGridsFor(selectedVs3bet.value));
    const vs3betStats = computed(() => vs3betStatsFor(selectedVs3bet.value));

    const percentOf = (pos: Position) => statsFor(pos).percent.toFixed(1);
    const defendPercentOf = (id: ScenarioId) =>
      defendStatsFor(id).totalPercent.toFixed(1);
    const vs3betPercentOf = (id: Vs3BetId) =>
      vs3betStatsFor(id).continuePercent.toFixed(1);

    // IP 수비 조합(BTN·CO가 히어로) — 3벳 중심으로 좁은 이유를 안내
    const isIpScenario = computed(
      () =>
        selectedScenario.value.startsWith("btn-") ||
        selectedScenario.value.startsWith("co-")
    );
    const isSqueezeScenario = computed(() =>
      selectedScenario.value.startsWith("sq-")
    );
    // 콜 레인지가 아예 없는 조합(SB 계열) — 복사 버튼 비활성
    const callEmpty = computed(() =>
      defendGrids.value.call.every((f) => f === 0)
    );

    // 수비 모드의 안내문. 원본 템플릿의 v-if 순서를 그대로 유지한다 — 세 조건은 서로
    // 배타적이지만, 리팩터가 «동작 무변경»임을 눈으로 확인할 수 있게 순서를 보존.
    const defendNote = (t: {
      sbNote: string;
      squeezeNote: string;
      ipNote: string;
    }) => {
      if (selectedScenario.value === "sb-vs-btn") return t.sbNote;
      if (isSqueezeScenario.value) return t.squeezeNote;
      if (isIpScenario.value) return t.ipNote;
      return "";
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

    const copyVs3bet = async (action: "fourBet" | "call") => {
      await writeClipboard(vs3betRangeTextFor(selectedVs3bet.value, action));
      copiedAction.value = action;
      setTimeout(() => (copiedAction.value = ""), 1500);
    };

    // 레인지를 커스텀 스팟 에디터로 — RangeEditor가 watch로 받아 적용한다
    const sendToEditor = (player: 0 | 1) => {
      store.pendingRangeText[player] = rangeTextFor(selected.value);
      store.sideView = player === 0 ? "oop-range" : "ip-range";
    };

    const modes = computed<ChartMode[]>(() => {
      const t = L.value;
      const s = stats.value;
      const d = defendStats.value;
      const v = vs3betStats.value;
      return [
        {
          key: "rfi",
          label: t.modeRfi,
          intro: t.intro,
          dual: false,
          tabs: POSITIONS.map((pos) => ({
            key: pos,
            label: pos,
            percent: percentOf(pos),
            active: selected.value === pos,
            select: () => (selected.value = pos),
          })),
          legendRaise: "",
          legendNote: "",
          single: grid.value,
          raise: null,
          call: null,
          stats: [
            {
              label: t.statPercent,
              value: `${percentOf(selected.value)}%`,
              testid: "preflop-percent",
            },
            { label: t.statCombos, value: `${Math.round(s.combos)} / 1326` },
            { label: t.statHands, value: `${s.hands} / 169` },
            { label: t.statMixed, value: String(s.mixedHands) },
          ],
          note: "",
          actions: [
            {
              key: "copy",
              label: copied.value ? t.copied : t.copy,
              cls: "button-base button-blue",
              disabled: false,
              run: copyRange,
            },
            {
              key: "sendOop",
              label: t.sendOop,
              cls: "button-base bg-neutral-700 hover:bg-neutral-600",
              disabled: false,
              run: () => sendToEditor(0),
            },
            {
              key: "sendIp",
              label: t.sendIp,
              cls: "button-base bg-neutral-700 hover:bg-neutral-600",
              disabled: false,
              run: () => sendToEditor(1),
            },
          ],
          how: [t.how1, t.how2, t.how3],
        },
        {
          key: "defend",
          label: t.modeDefend,
          intro: t.introDefend,
          dual: true,
          tabs: SCENARIOS.map((sc) => ({
            key: sc.id,
            label: `${sc.hero} vs ${sc.villain}`,
            percent: defendPercentOf(sc.id),
            active: selectedScenario.value === sc.id,
            select: () => (selectedScenario.value = sc.id),
          })),
          legendRaise: t.legend3bet,
          legendNote: t.legendMixedDefend,
          single: null,
          raise: defendGrids.value.threeBet,
          call: defendGrids.value.call,
          stats: [
            {
              label: t.stat3bet,
              value: `${d.threeBetPercent.toFixed(1)}%`,
              testid: "preflop-3bet",
            },
            { label: t.statCall, value: `${d.callPercent.toFixed(1)}%` },
            {
              label: t.statTotal,
              value: `${d.totalPercent.toFixed(1)}%`,
              testid: "preflop-percent",
            },
            { label: t.statMixed, value: String(d.mixedHands) },
          ],
          note: defendNote(t),
          actions: [
            {
              key: "copy3bet",
              label: copiedAction.value === "threeBet" ? t.copied : t.copy3bet,
              cls: "button-base button-red",
              disabled: false,
              run: () => copyDefend("threeBet"),
            },
            {
              key: "copyCall",
              label: copiedAction.value === "call" ? t.copied : t.copyCall,
              cls: "button-base button-green",
              disabled: callEmpty.value,
              run: () => copyDefend("call"),
            },
          ],
          how: [t.how1, t.howDefend2, t.howDefend3],
        },
        {
          key: "vs3bet",
          label: t.mode3bet,
          intro: t.intro3bet,
          dual: true,
          tabs: VS3BET_SCENARIOS.map((sc) => ({
            key: sc.id,
            label: `${sc.hero} vs ${sc.villain}`,
            percent: vs3betPercentOf(sc.id),
            active: selectedVs3bet.value === sc.id,
            select: () => (selectedVs3bet.value = sc.id),
          })),
          legendRaise: t.legend4bet,
          legendNote: t.legendCond,
          single: null,
          raise: vs3Grids.value.fourBet,
          call: vs3Grids.value.call,
          stats: [
            {
              label: t.stat4bet,
              value: `${v.fourBetPercent.toFixed(1)}%`,
              testid: "preflop-4bet",
            },
            { label: t.statCall, value: `${v.callPercent.toFixed(1)}%` },
            {
              label: t.statContinue,
              value: `${v.continuePercent.toFixed(1)}%`,
              testid: "preflop-continue",
            },
            { label: t.statMixed, value: String(v.mixedHands) },
          ],
          note: t.note3bet,
          actions: [
            {
              key: "copy4bet",
              label: copiedAction.value === "fourBet" ? t.copied : t.copy4bet,
              cls: "button-base button-red",
              disabled: false,
              run: () => copyVs3bet("fourBet"),
            },
            {
              key: "copyCall",
              label: copiedAction.value === "call" ? t.copied : t.copyCall,
              cls: "button-base button-green",
              disabled: false,
              run: () => copyVs3bet("call"),
            },
          ],
          how: [t.how1, t.how3bet2, t.howDefend3],
        },
      ];
    });

    const active = computed(
      () => modes.value.find((m) => m.key === mode.value) as ChartMode
    );

    // RangeEditor·RangeMiniViewer와 같은 격자 관례
    const cellAt = (row: number, col: number) => 13 * (row - 1) + col - 1;
    const cellFreq = (row: number, col: number) =>
      active.value.single?.[cellAt(row, col)] ?? 0;
    const cellRaise = (row: number, col: number) =>
      active.value.raise?.[cellAt(row, col)] ?? 0;
    const cellCall = (row: number, col: number) =>
      active.value.call?.[cellAt(row, col)] ?? 0;
    const cellActive = (row: number, col: number) =>
      active.value.dual
        ? cellRaise(row, col) + cellCall(row, col) > 0
        : cellFreq(row, col) > 0;

    const cellLabel = (row: number, col: number) => {
      const r1 = 13 - Math.min(row, col);
      const r2 = 13 - Math.max(row, col);
      return ranks[r1] + ranks[r2] + ["s", "", "o"][Math.sign(row - col) + 1];
    };

    const modeStyle = (value: ModeKey) =>
      "px-3 py-1 rounded-lg text-sm font-semibold transition-colors " +
      (mode.value === value
        ? "bg-neutral-700 text-white"
        : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700");

    return {
      yellow500,
      red500,
      green500,
      mode,
      modes,
      active,
      modeStyle,
      cellFreq,
      cellRaise,
      cellCall,
      cellActive,
      cellLabel,
      L,
    };
  },
});
</script>
