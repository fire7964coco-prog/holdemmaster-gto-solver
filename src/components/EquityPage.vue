<template>
  <div class="pb-6 max-w-5xl">
    <p class="text-sm md:text-base text-neutral-400 mb-4">{{ L.intro }}</p>

    <div class="flex flex-col lg:flex-row gap-4 lg:gap-6">
      <!-- 좌: 입력 (① 내 핸드 → ② 상대 → ③ 보드 → 카드판 → ④ 계산) -->
      <div class="shrink-0 w-full lg:w-[27rem]">
        <!-- ① 내 핸드 -->
        <div class="panel mb-3">
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="section-title">{{ L.heroTitle }}</div>
            <button
              :class="targetChip('hero')"
              data-testid="equity-target-hero"
              @click="target = 'hero'"
            >
              {{ L.fill }}
            </button>
          </div>
          <div class="panel-inner flex items-center gap-2">
            <CardSlot
              v-for="i in 2"
              :key="i"
              :card="hero[i - 1]"
              :active="target === 'hero' && hero.length === i - 1"
              @click="onSlotClick('hero', i - 1)"
            />
            <span class="text-xs text-neutral-500 ml-1">{{ L.heroHint }}</span>
          </div>
        </div>

        <!-- ② 상대 -->
        <div class="panel mb-3">
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="section-title">{{ L.villainTitle }}</div>
            <div class="flex gap-1.5">
              <button :class="modeChip('hand')" @click="setVillainMode('hand')">
                {{ L.modeHand }}
              </button>
              <button :class="modeChip('range')" @click="setVillainMode('range')">
                {{ L.modeRange }}
              </button>
            </div>
          </div>

          <div v-if="villainMode === 'hand'" class="panel-inner flex items-center gap-2">
            <CardSlot
              v-for="i in 2"
              :key="i"
              :card="villainHand[i - 1]"
              :active="target === 'villain' && villainHand.length === i - 1"
              @click="onSlotClick('villain', i - 1)"
            />
            <button
              :class="targetChip('villain') + ' ml-1'"
              data-testid="equity-target-villain"
              @click="target = 'villain'"
            >
              {{ L.fill }}
            </button>
          </div>

          <div v-else>
            <textarea
              v-model="rangeText"
              rows="3"
              data-testid="equity-range-input"
              class="w-full px-2 py-1.5 rounded-lg text-sm font-mono"
              :placeholder="L.rangePlaceholder"
            ></textarea>
            <div class="flex flex-wrap items-center gap-2 mt-2">
              <button class="button-base bg-neutral-700 hover:bg-neutral-600" @click="fillAllHands">
                {{ L.anyTwo }}
              </button>
              <span v-if="rangeError" class="text-xs text-red-400">
                {{ L.rangeError(rangeError) }}
              </span>
              <span v-else-if="rangeCombos > 0" class="text-xs text-neutral-500">
                {{ L.rangeSummary(rangeCombos, rangePercent) }}
              </span>
            </div>
            <p class="text-xs text-neutral-500 mt-2">{{ L.rangeNote }}</p>
          </div>
        </div>

        <!-- ③ 보드 -->
        <div class="panel mb-3">
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="section-title">{{ L.boardTitle }}</div>
            <button
              :class="targetChip('board')"
              data-testid="equity-target-board"
              @click="target = 'board'"
            >
              {{ L.fill }}
            </button>
          </div>
          <div class="panel-inner flex flex-wrap items-center gap-2">
            <CardSlot
              v-for="i in 5"
              :key="i"
              :card="board[i - 1]"
              :active="target === 'board' && board.length === i - 1"
              @click="onSlotClick('board', i - 1)"
            />
            <span class="text-xs text-neutral-500 ml-1">{{ boardHint }}</span>
          </div>
        </div>

        <!-- 카드판 (BoardSelector와 같은 관례: ♠♥♦♣ 네 줄, A→2) -->
        <div class="max-w-full mb-3">
          <div v-for="suit in 4" :key="suit" class="flex">
            <BoardSelectorCard
              v-for="rank in 13"
              :key="rank"
              class="m-0.5"
              :width="cardWidth"
              :font-size="cardFontSize"
              :ratio="cardRatio"
              :card-id="56 - 4 * rank - suit"
              :is-selected="isUsed(56 - 4 * rank - suit)"
              :data-card="56 - 4 * rank - suit"
              @click="place(56 - 4 * rank - suit)"
            />
          </div>
        </div>

        <!-- ④ 계산 -->
        <div class="flex flex-wrap items-center gap-2">
          <button
            class="button-base button-blue"
            data-testid="equity-run"
            :disabled="!canCompute || running"
            @click="run"
          >
            {{ running ? L.computing : L.compute }}
          </button>
          <button
            v-if="running"
            class="button-base button-red"
            data-testid="equity-stop"
            @click="stop"
          >
            {{ L.stop }}
          </button>
          <button
            class="button-base bg-neutral-700 hover:bg-neutral-600"
            data-testid="equity-clear"
            @click="clearAll"
          >
            {{ L.clear }}
          </button>
          <span v-if="running" class="text-sm text-neutral-400 tabular-nums">
            {{ Math.round(progress * 100) }}%
          </span>
        </div>
      </div>

      <!-- 우: 결과 -->
      <div class="flex-grow min-w-0">
        <div class="panel mb-4" data-testid="equity-panel">
          <div class="section-title mb-3">{{ L.resultTitle }}</div>

          <div v-if="errorCode" class="text-sm text-red-400">
            {{ L.errors[errorCode] || L.errors.unknown }}
          </div>

          <div v-else-if="!result" class="text-sm text-neutral-400 leading-relaxed">
            {{ L.resultEmpty }}
          </div>

          <div v-else>
            <div class="flex items-end gap-3 mb-1">
              <div class="text-4xl font-bold text-yellow-400 tabular-nums">
                <span data-testid="equity-result">{{ result.equity.toFixed(1) }}</span
                >%
              </div>
              <div class="pb-1.5 text-sm text-neutral-400">
                {{ L.vsSide((100 - result.equity).toFixed(1)) }}
              </div>
            </div>

            <!-- 에퀴티 막대: 노랑(내 쪽) / 회색(상대) -->
            <div class="h-3 w-full rounded-full overflow-hidden bg-neutral-700 my-3">
              <div
                class="h-full bg-yellow-400 transition-all"
                :style="{ width: result.equity.toFixed(2) + '%' }"
              ></div>
            </div>

            <div class="flex flex-wrap gap-2 mb-3">
              <div class="stat-chip">
                {{ L.win }} <b data-testid="equity-win">{{ result.win.toFixed(1) }}%</b>
              </div>
              <div class="stat-chip">{{ L.tie }} <b>{{ result.tie.toFixed(1) }}%</b></div>
              <div class="stat-chip">{{ L.lose }} <b>{{ result.lose.toFixed(1) }}%</b></div>
              <div class="stat-chip">
                {{ L.combos }} <b>{{ result.villainCombos }}</b>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <span
                :class="
                  'rounded-lg px-2.5 py-1 text-xs font-semibold ' +
                  (result.method === 'exact'
                    ? 'bg-emerald-900 text-emerald-300'
                    : 'bg-neutral-700 text-neutral-300')
                "
                data-testid="equity-mode-badge"
              >
                {{ result.method === "exact" ? L.badgeExact : L.badgeApprox }}
              </span>
              <span class="text-xs text-neutral-500">
                {{
                  result.method === "exact"
                    ? L.exactNote(result.evaluations)
                    : L.approxNote(result.evaluations)
                }}
              </span>
            </div>
          </div>
        </div>

        <div class="panel mb-4">
          <div class="section-title">{{ L.howTitle }}</div>
          <ul class="list-disc pl-5 text-sm text-neutral-300 space-y-1.5 mt-2">
            <li>{{ L.how1 }}</li>
            <li>{{ L.how2 }}</li>
            <li>{{ L.how3 }}</li>
          </ul>
        </div>

        <div class="panel">
          <div class="section-title">{{ L.limitTitle }}</div>
          <p class="text-sm text-neutral-400 leading-relaxed mt-2">{{ L.limitBody }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onUnmounted, ref, watch } from "vue";
import { i18n } from "../i18n";
import {
  ALL_HANDS_RANGE,
  comboOfCards,
  parseRangeText,
  Combo,
  EquityResult,
} from "../equity";
import type { EquityResponse } from "../equity-worker";

import BoardSelectorCard from "./BoardSelectorCard.vue";
import CardSlot from "./CardSlot.vue";

type Target = "hero" | "villain" | "board";

const M = {
  ko: {
    intro:
      "내 핸드가 상대의 핸드(또는 레인지)를 상대로 이길 확률입니다. 보드를 비워 두면 프리플랍, " +
      "3·4·5장을 고르면 플랍·턴·리버 시점의 승률을 계산합니다.",
    heroTitle: "① 내 핸드",
    heroHint: "카드판에서 2장을 고르세요",
    fill: "여기 채우기",
    villainTitle: "② 상대",
    modeHand: "핸드",
    modeRange: "레인지",
    rangePlaceholder: "예: 22+,AQs+,K8s:0.75",
    rangeNote:
      "프리플랍 차트의 [레인지 복사]를 그대로 붙여넣을 수 있습니다. " +
      "«K8s:0.75»처럼 가중치가 붙은 표기도 그대로 반영됩니다.",
    anyTwo: "전체(랜덤 핸드)",
    rangeError: (token: string) => `해석할 수 없는 표기: ${token}`,
    rangeSummary: (combos: number, percent: string) => `${combos}콤보 · 전체의 ${percent}%`,
    boardTitle: "③ 보드",
    boardHintEmpty: "비우면 프리플랍 (3·4·5장도 가능)",
    boardHintBad: "보드는 0·3·4·5장만 가능합니다",
    boardHintOk: (n: number) => ["", "", "", "플랍", "턴", "리버"][n],
    compute: "계산",
    computing: "계산 중…",
    stop: "중단",
    clear: "전부 지우기",
    resultTitle: "결과",
    resultEmpty:
      "내 핸드 2장과 상대(핸드 2장 또는 레인지)를 고른 뒤 [계산]을 누르세요.",
    vsSide: (value: string) => `상대 ${value}%`,
    win: "승",
    tie: "무",
    lose: "패",
    combos: "상대 콤보",
    badgeExact: "전수 계산",
    badgeApprox: "근사 (±0.2%p)",
    exactNote: (n: number) => `가능한 경우 ${n.toLocaleString()}가지를 모두 세었습니다`,
    approxNote: (n: number) =>
      `경우의 수가 너무 많아 무작위 ${n.toLocaleString()}회를 표본으로 썼습니다`,
    howTitle: "읽는 법",
    how1: "에퀴티 = 승률 + 무승부의 절반. 지금 올인했을 때 팟에서 가져갈 기대 지분입니다.",
    how2: "상대를 레인지로 두면 내 카드·보드와 겹치는 콤보는 자동으로 빠집니다(카드 제거).",
    how3: "«전수 계산» 배지는 모든 경우를 다 세었다는 뜻이고, «근사»는 무작위 표본 결과입니다.",
    limitTitle: "이 계산기의 범위",
    limitBody:
      "2인 올인 승률만 계산합니다. 레인지 대 레인지, 3인 이상, 벳·폴드가 섞인 상황의 " +
      "기대값은 솔버(커스텀 스팟)가 담당합니다.",
    errors: {
      "need-hero": "내 핸드 2장을 골라 주세요.",
      "bad-board": "보드는 0·3·4·5장만 가능합니다.",
      "bad-card": "카드 값이 잘못되었습니다.",
      duplicate: "같은 카드를 두 번 쓸 수 없습니다.",
      "empty-range": "상대 레인지가 비어 있습니다.",
      "no-combos": "카드 제거 후 상대에게 남는 콤보가 없습니다.",
      unknown: "계산 중 오류가 발생했습니다.",
    } as Record<string, string>,
  },
  en: {
    intro:
      "Your chance of winning against a specific hand or an entire range. Leave the board empty " +
      "for preflop, or pick 3/4/5 cards for flop, turn and river.",
    heroTitle: "① Your Hand",
    heroHint: "Pick 2 cards below",
    fill: "Fill here",
    villainTitle: "② Opponent",
    modeHand: "Hand",
    modeRange: "vs Range",
    rangePlaceholder: "e.g. 22+,AQs+,K8s:0.75",
    rangeNote:
      "Paste the output of [Copy Range] from the preflop charts. Weighted notation such as " +
      "“K8s:0.75” is applied as-is.",
    anyTwo: "Any two cards",
    rangeError: (token: string) => `Cannot parse: ${token}`,
    rangeSummary: (combos: number, percent: string) => `${combos} combos · ${percent}% of all`,
    boardTitle: "③ Board",
    boardHintEmpty: "Empty = preflop (3/4/5 cards also allowed)",
    boardHintBad: "The board must have 0, 3, 4 or 5 cards",
    boardHintOk: (n: number) => ["", "", "", "Flop", "Turn", "River"][n],
    compute: "Calculate",
    computing: "Calculating…",
    stop: "Stop",
    clear: "Clear all",
    resultTitle: "Result",
    resultEmpty: "Pick your two cards and an opponent hand or range, then press Calculate.",
    vsSide: (value: string) => `Opponent ${value}%`,
    win: "Win",
    tie: "Tie",
    lose: "Lose",
    combos: "Opp. combos",
    badgeExact: "Exact",
    badgeApprox: "Approx. (±0.2%p)",
    exactNote: (n: number) => `Every one of ${n.toLocaleString()} cases was counted`,
    approxNote: (n: number) =>
      `Too many cases to enumerate — sampled ${n.toLocaleString()} random runouts`,
    howTitle: "How to read this",
    how1: "Equity = win% + half of the ties. It is your share of the pot if all-in right now.",
    how2: "Against a range, combos blocked by your cards or the board are removed automatically.",
    how3: "The “Exact” badge means every case was counted; “Approx.” is a random sample.",
    limitTitle: "Scope",
    limitBody:
      "This tool computes all-in equity between two players only. Range vs range, multiway pots " +
      "and betting lines are handled by the solver (Custom Spot).",
    errors: {
      "need-hero": "Pick your two cards first.",
      "bad-board": "The board must have 0, 3, 4 or 5 cards.",
      "bad-card": "Invalid card value.",
      duplicate: "The same card cannot be used twice.",
      "empty-range": "The opponent range is empty.",
      "no-combos": "No opponent combos remain after card removal.",
      unknown: "Something went wrong during the calculation.",
    } as Record<string, string>,
  },
  ja: {
    intro:
      "自分のハンドが相手のハンド（またはレンジ）に勝つ確率です。ボードを空のままにするとプリフロップ、" +
      "3・4・5枚を選ぶとフロップ・ターン・リバー時点の勝率を計算します。",
    heroTitle: "① 自分のハンド",
    heroHint: "下のカード一覧から2枚選んでください",
    fill: "ここに入力",
    villainTitle: "② 相手",
    modeHand: "ハンド",
    modeRange: "レンジ",
    rangePlaceholder: "例: 22+,AQs+,K8s:0.75",
    rangeNote:
      "プリフロップレンジ表の[レンジをコピー]をそのまま貼り付けられます。" +
      "「K8s:0.75」のようなウェイト付きの表記もそのまま反映されます。",
    anyTwo: "すべて（ランダムハンド）",
    rangeError: (token: string) => `解釈できない表記: ${token}`,
    rangeSummary: (combos: number, percent: string) => `${combos}コンボ · 全体の${percent}%`,
    boardTitle: "③ ボード",
    boardHintEmpty: "空のままならプリフロップ（3・4・5枚も可）",
    boardHintBad: "ボードは0・3・4・5枚のみ有効です",
    boardHintOk: (n: number) => ["", "", "", "フロップ", "ターン", "リバー"][n],
    compute: "計算",
    computing: "計算中…",
    stop: "中断",
    clear: "すべてクリア",
    resultTitle: "結果",
    resultEmpty:
      "自分のカード2枚と相手（ハンド2枚またはレンジ）を選んで[計算]を押してください。",
    vsSide: (value: string) => `相手 ${value}%`,
    win: "勝ち",
    tie: "引き分け",
    lose: "負け",
    combos: "相手コンボ",
    badgeExact: "全数計算",
    badgeApprox: "近似 (±0.2%p)",
    exactNote: (n: number) => `あり得る${n.toLocaleString()}通りをすべて数えました`,
    approxNote: (n: number) =>
      `場合の数が多すぎるため、ランダムな${n.toLocaleString()}回をサンプルにしました`,
    howTitle: "読み方",
    how1: "エクイティ（勝率）= 勝ち% + 引き分けの半分。今オールインした場合にポットから得られる期待シェアです。",
    how2: "相手をレンジにすると、自分のカードやボードと重なるコンボは自動的に除外されます（カードリムーバル）。",
    how3: "「全数計算」バッジはすべての場合を数えたという意味で、「近似」はランダムサンプルの結果です。",
    limitTitle: "この計算機の範囲",
    limitBody:
      "2人のオールイン勝率のみを計算します。レンジ対レンジ、3人以上、ベットやフォールドが絡む状況の" +
      "期待値はソルバー（カスタムスポット）が担当します。",
    errors: {
      "need-hero": "自分のハンド2枚を選んでください。",
      "bad-board": "ボードは0・3・4・5枚のみ有効です。",
      "bad-card": "カードの値が正しくありません。",
      duplicate: "同じカードを2回使うことはできません。",
      "empty-range": "相手のレンジが空です。",
      "no-combos": "カードリムーバル後、相手に残るコンボがありません。",
      unknown: "計算中にエラーが発生しました。",
    } as Record<string, string>,
  },
} as const;

const CAPACITY: Record<Target, number> = { hero: 2, villain: 2, board: 5 };

export default defineComponent({
  components: { BoardSelectorCard, CardSlot },

  setup() {
    const L = computed(() => M[i18n.locale]);

    const hero = ref<number[]>([]);
    const villainHand = ref<number[]>([]);
    const board = ref<number[]>([]);
    const villainMode = ref<"hand" | "range">("hand");
    const rangeText = ref("");
    const target = ref<Target>("hero");

    const running = ref(false);
    const progress = ref(0);
    const result = ref<EquityResult | null>(null);
    const errorCode = ref("");

    let worker: Worker | null = null;

    /* ── 카드 선택 ─────────────────────────────────────────── */

    const slotsOf = (t: Target) =>
      t === "hero" ? hero : t === "villain" ? villainHand : board;

    const fillOrder = computed<Target[]>(() =>
      villainMode.value === "hand" ? ["hero", "villain", "board"] : ["hero", "board"]
    );

    const isUsed = (card: number) =>
      hero.value.includes(card) ||
      (villainMode.value === "hand" && villainHand.value.includes(card)) ||
      board.value.includes(card);

    const removeCard = (card: number) => {
      for (const t of ["hero", "villain", "board"] as Target[]) {
        const slots = slotsOf(t);
        const index = slots.value.indexOf(card);
        if (index >= 0) {
          slots.value = slots.value.filter((c) => c !== card);
          if (fillOrder.value.includes(t)) target.value = t;
          return true;
        }
      }
      return false;
    };

    /** 카드판 클릭: 이미 쓰인 카드면 빼고, 아니면 지금 채우는 칸에 넣는다(다 차면 다음 칸으로) */
    const place = (card: number) => {
      if (removeCard(card)) return;

      const order = fillOrder.value;
      let t = target.value;
      if (!order.includes(t) || slotsOf(t).value.length >= CAPACITY[t]) {
        const next = order.find((x) => slotsOf(x).value.length < CAPACITY[x]);
        if (!next) return;
        t = next;
      }

      const slots = slotsOf(t);
      slots.value = [...slots.value, card];
      // 플랍 3장은 BoardSelector와 같이 내림차순으로 정돈한다
      if (t === "board" && slots.value.length <= 3) {
        slots.value = [...slots.value].sort((a, b) => b - a);
      }
      target.value = t;

      if (slots.value.length >= CAPACITY[t]) {
        const next = order.find((x) => slotsOf(x).value.length < CAPACITY[x]);
        if (next) target.value = next;
      }
    };

    /** 칸을 직접 누르면: 카드가 있으면 빼고, 비었으면 그 칸을 «채우는 칸»으로 */
    const onSlotClick = (t: Target, index: number) => {
      const card = slotsOf(t).value[index];
      if (card === undefined) target.value = t;
      else removeCard(card);
    };

    const clearAll = () => {
      hero.value = [];
      villainHand.value = [];
      board.value = [];
      target.value = "hero";
      result.value = null;
      errorCode.value = "";
    };

    const setVillainMode = (mode: "hand" | "range") => {
      villainMode.value = mode;
      result.value = null;
      errorCode.value = "";
      if (mode === "range" && target.value === "villain") target.value = "board";
    };

    const fillAllHands = () => {
      rangeText.value = ALL_HANDS_RANGE;
    };

    /* ── 입력 상태 ─────────────────────────────────────────── */

    const parsed = computed(() =>
      villainMode.value === "range" ? parseRangeText(rangeText.value) : null
    );
    const rangeError = computed(() => parsed.value?.error ?? "");
    const rangeCombos = computed(() => parsed.value?.combos.length ?? 0);
    const rangePercent = computed(() =>
      (((parsed.value?.weighted ?? 0) / 1326) * 100).toFixed(1)
    );

    const boardValid = computed(() => [0, 3, 4, 5].includes(board.value.length));
    const boardHint = computed(() => {
      if (board.value.length === 0) return L.value.boardHintEmpty;
      if (!boardValid.value) return L.value.boardHintBad;
      return L.value.boardHintOk(board.value.length);
    });

    const canCompute = computed(() => {
      if (hero.value.length !== 2 || !boardValid.value) return false;
      if (villainMode.value === "hand") return villainHand.value.length === 2;
      return !rangeError.value && rangeCombos.value > 0;
    });

    // 입력을 고치면 옛 결과는 지운다 (바뀐 입력 옆에 옛 숫자가 남으면 오해한다)
    watch([hero, villainHand, board, rangeText], () => {
      if (!running.value) {
        result.value = null;
        errorCode.value = "";
      }
    });

    /* ── 계산 ─────────────────────────────────────────────── */

    const stop = () => {
      worker?.terminate();
      worker = null;
      running.value = false;
      progress.value = 0;
    };

    const run = () => {
      if (!canCompute.value || running.value) return;
      const villain: Combo[] =
        villainMode.value === "hand"
          ? comboOfCards(villainHand.value)
          : parsed.value?.combos ?? [];

      result.value = null;
      errorCode.value = "";
      progress.value = 0;
      running.value = true;

      worker?.terminate();
      worker = new Worker(new URL("../equity-worker.ts", import.meta.url), {
        type: "module",
      });
      worker.onmessage = (event: MessageEvent) => {
        const message = event.data as EquityResponse;
        if (message.type === "progress") {
          progress.value = message.value;
        } else if (message.type === "done") {
          result.value = message.result;
          running.value = false;
          progress.value = 1;
          worker?.terminate();
          worker = null;
        } else {
          errorCode.value = message.code;
          running.value = false;
          worker?.terminate();
          worker = null;
        }
      };
      worker.onerror = () => {
        errorCode.value = "unknown";
        running.value = false;
      };
      worker.postMessage({
        hero: [...hero.value],
        villain,
        board: [...board.value],
      });
    };

    onUnmounted(stop);

    /* ── 카드판 크기 (BoardSelector와 같은 규칙) ───────────── */

    const isNarrow = ref(false);
    const updateNarrow = () => {
      isNarrow.value = window.innerWidth < 768;
    };
    updateNarrow();
    window.addEventListener("resize", updateNarrow);
    onUnmounted(() => window.removeEventListener("resize", updateNarrow));

    const cardWidth = computed(() =>
      isNarrow.value ? "calc((100vw - 2rem) / 13 - 0.25rem)" : "30px"
    );
    const cardFontSize = computed(() => (isNarrow.value ? "0.6rem" : "0.8rem"));
    const cardRatio = computed(() => (isNarrow.value ? 1.9 : 1.4));

    const chipBase =
      "rounded-lg px-2 py-0.5 text-xs font-semibold transition-colors shrink-0 ";

    return {
      L,
      hero,
      villainHand,
      board,
      villainMode,
      rangeText,
      target,
      running,
      progress,
      result,
      errorCode,
      rangeError,
      rangeCombos,
      rangePercent,
      boardHint,
      canCompute,
      cardWidth,
      cardFontSize,
      cardRatio,
      isUsed,
      place,
      onSlotClick,
      clearAll,
      setVillainMode,
      fillAllHands,
      run,
      stop,
      targetChip: (t: Target) =>
        chipBase +
        (t === target.value
          ? "bg-yellow-500 text-neutral-900"
          : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"),
      modeChip: (mode: "hand" | "range") =>
        chipBase +
        (mode === villainMode.value
          ? "bg-yellow-500 text-neutral-900"
          : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"),
    };
  },
});
</script>
