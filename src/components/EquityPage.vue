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
                <span data-testid="equity-result">{{ $n(result.equity.toFixed(1)) }}</span
                >%
              </div>
              <div class="pb-1.5 text-sm text-neutral-400">
                {{ $n(L.vsSide((100 - result.equity).toFixed(1))) }}
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
                {{ L.win }} <b data-testid="equity-win">{{ $n(result.win.toFixed(1)) }}%</b>
              </div>
              <div class="stat-chip">{{ L.tie }} <b>{{ $n(result.tie.toFixed(1)) }}%</b></div>
              <div class="stat-chip">{{ L.lose }} <b>{{ $n(result.lose.toFixed(1)) }}%</b></div>
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
      "for preflop, or pick 3/4/5 cards for the flop, turn, or river.",
    heroTitle: "① Your Hand",
    heroHint: "Pick 2 cards below",
    fill: "Fill from here",
    villainTitle: "② Opponent",
    modeHand: "vs Hand",
    modeRange: "vs Range",
    rangePlaceholder: "e.g., 22+,AQs+,K8s:0.75",
    rangeNote:
      "Paste the output of [Copy range text] from the preflop charts. Weighted notation such as " +
      "“K8s:0.75” is applied as-is.",
    anyTwo: "Any two cards",
    rangeError: (token: string) => `Cannot parse: ${token}`,
    rangeSummary: (combos: number, percent: string) => `${combos} combos · ${percent}% of all combos`,
    boardTitle: "③ Board",
    boardHintEmpty: "Empty = preflop (3/4/5 cards also allowed)",
    boardHintBad: "The board must have 0, 3, 4 or 5 cards.",
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
    combos: "Opponent combos",
    badgeExact: "Exact",
    badgeApprox: "Approx. (±0.2 pp)",
    exactNote: (n: number) => `Every one of ${n.toLocaleString()} cases was counted`,
    approxNote: (n: number) =>
      `Too many cases to enumerate — sampled ${n.toLocaleString()} random runouts`,
    howTitle: "How to read this",
    how1: "Equity = win% + half of the ties. It is your share of the pot if you were all in right now.",
    how2: "Against a range, combos blocked by your cards or the board are removed automatically.",
    how3: "The “Exact” badge means every case was counted; “Approx.” is a random sample.",
    limitTitle: "What this calculator covers",
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
      "プリフロップレンジ表の[レンジテキストをコピー]をそのまま貼り付けられます。" +
      "「K8s:0.75」のようなウェイト付きの表記もそのまま反映されます。",
    anyTwo: "すべて（ランダムハンド）",
    rangeError: (token: string) => `解釈できない表記: ${token}`,
    rangeSummary: (combos: number, percent: string) => `${combos}コンボ・全体の${percent}%`,
    boardTitle: "③ ボード",
    boardHintEmpty: "空のままならプリフロップ（3・4・5枚も可）",
    boardHintBad: "ボードは0・3・4・5枚のみ有効です",
    boardHintOk: (n: number) => ["", "", "", "フロップ", "ターン", "リバー"][n],
    compute: "計算",
    computing: "計算中…",
    stop: "停止",
    clear: "すべてクリア",
    resultTitle: "結果",
    resultEmpty:
      "自分のカード2枚と相手（ハンド2枚またはレンジ）を選んで[計算]を押してください。",
    vsSide: (value: string) => `相手 ${value}%`,
    win: "勝ち",
    tie: "引き分け",
    lose: "負け",
    combos: "相手コンボ",
    badgeExact: "完全計算",
    badgeApprox: "近似 (±0.2%ポイント)",
    exactNote: (n: number) => `あり得る${n.toLocaleString()}通りをすべて数えました`,
    approxNote: (n: number) =>
      `場合の数が多すぎるため、ランダムな${n.toLocaleString()}回をサンプルにしました`,
    howTitle: "読み方",
    how1: "エクイティ（勝率）= 勝ち% + 引き分けの半分。今オールインした場合にポットから得られる期待シェアです。",
    how2: "相手をレンジにすると、自分のカードやボードと重なるコンボは自動的に除外されます（カードリムーバル）。",
    how3: "「完全計算」バッジはすべての場合を数えたという意味で、「近似」はランダムサンプルの結果です。",
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
  es: {
    intro:
      "Tu probabilidad de ganar contra una mano específica o contra un rango completo. Deja el board vacío " +
      "para preflop, o elige 3/4/5 cartas para flop, turn y river.",
    heroTitle: "① Tu mano",
    heroHint: "Elige 2 cartas abajo",
    fill: "Llenar aquí",
    villainTitle: "② Rival",
    modeHand: "Mano",
    modeRange: "vs Rango",
    rangePlaceholder: "ej. 22+,AQs+,K8s:0.75",
    rangeNote:
      "Puedes pegar el resultado de [Copiar rango] de las tablas preflop. La notación con peso como " +
      "«K8s:0.75» se aplica tal cual.",
    anyTwo: "Cualquier par de cartas",
    rangeError: (token: string) => `No se pudo interpretar: ${token}`,
    rangeSummary: (combos: number, percent: string) => `${combos} combos · ${percent}% del total`,
    boardTitle: "③ Board",
    boardHintEmpty: "Vacío = preflop (también acepta 3/4/5 cartas)",
    boardHintBad: "El board debe tener 0, 3, 4 o 5 cartas",
    boardHintOk: (n: number) => ["", "", "", "Flop", "Turn", "River"][n],
    compute: "Calcular",
    computing: "Calculando…",
    stop: "Detener",
    clear: "Borrar todo",
    resultTitle: "Resultado",
    resultEmpty:
      "Elige tus dos cartas y un rival (mano de 2 cartas o rango) y presiona [Calcular].",
    vsSide: (value: string) => `Rival ${value}%`,
    win: "Victoria",
    tie: "Empate",
    lose: "Derrota",
    combos: "Combos del rival",
    badgeExact: "Cálculo exacto",
    badgeApprox: "Aprox. (±0.2 pp)",
    exactNote: (n: number) => `Se contaron los ${n.toLocaleString()} casos posibles`,
    approxNote: (n: number) =>
      `Demasiados casos para enumerar — se muestrearon ${n.toLocaleString()} repartos al azar`,
    howTitle: "Cómo leerlo",
    how1: "Equity = % de victorias + la mitad de los empates. Es tu parte del bote si fueras all-in ahora mismo.",
    how2: "Contra un rango, los combos bloqueados por tus cartas o el board se eliminan automáticamente (card removal).",
    how3: "La insignia «Cálculo exacto» significa que se contaron todos los casos; «Aprox.» es una muestra aleatoria.",
    limitTitle: "Alcance",
    limitBody:
      "Esta herramienta solo calcula equity de all-in entre dos jugadores. Rango contra rango, botes " +
      "multiway y líneas de apuesta los maneja el solver (Spot personalizado).",
    errors: {
      "need-hero": "Primero elige tus dos cartas.",
      "bad-board": "El board debe tener 0, 3, 4 o 5 cartas.",
      "bad-card": "Valor de carta inválido.",
      duplicate: "No puedes usar la misma carta dos veces.",
      "empty-range": "El rango del rival está vacío.",
      "no-combos": "No quedan combos para el rival después del card removal.",
      unknown: "Ocurrió un error durante el cálculo.",
    } as Record<string, string>,
  },
  pt: {
    intro:
      "Sua probabilidade de vencer contra uma mão específica ou contra um range inteiro. Deixe o board vazio " +
      "para o pré-flop, ou escolha 3/4/5 cartas para flop, turn e river.",
    heroTitle: "① Sua mão",
    heroHint: "Escolha 2 cartas abaixo",
    fill: "Preencher a partir daqui",
    villainTitle: "② Vilão",
    modeHand: "vs Mão",
    modeRange: "vs Range",
    rangePlaceholder: "ex.: 22+,AQs+,K8s:0.75",
    rangeNote:
      "Você pode colar o resultado de [Copiar texto do range] das tabelas pré-flop. A notação com peso como " +
      "“K8s:0.75” é aplicada do jeito que está.",
    anyTwo: "Duas cartas quaisquer",
    rangeError: (token: string) => `Não foi possível interpretar: ${token}`,
    rangeSummary: (combos: number, percent: string) => `${combos} combos · ${percent}% do total`,
    boardTitle: "③ Board",
    boardHintEmpty: "Vazio = pré-flop (também aceita 3/4/5 cartas)",
    boardHintBad: "O board precisa ter 0, 3, 4 ou 5 cartas",
    boardHintOk: (n: number) => ["", "", "", "Flop", "Turn", "River"][n],
    compute: "Calcular",
    computing: "Calculando…",
    stop: "Parar",
    clear: "Limpar tudo",
    resultTitle: "Resultado",
    resultEmpty:
      "Escolha as suas duas cartas e um vilão (mão de 2 cartas ou range) e pressione [Calcular].",
    vsSide: (value: string) => `Vilão ${value}%`,
    win: "Vitória",
    tie: "Empate",
    lose: "Derrota",
    combos: "Combos do vilão",
    badgeExact: "Cálculo exato",
    badgeApprox: "Aprox. (±0,2 pp)",
    exactNote: (n: number) =>
      `Foram contados os ${n.toLocaleString("pt-BR")} casos possíveis`,
    approxNote: (n: number) =>
      `Casos demais para enumerar — foram amostrados ${n.toLocaleString(
        "pt-BR"
      )} runouts aleatórios`,
    howTitle: "Como ler",
    how1: "Equity = % de vitórias + metade dos empates. É a sua parte do pote se vocês estivessem all-in agora mesmo.",
    how2: "Contra um range, os combos bloqueados pelas suas cartas ou pelo board são removidos automaticamente (card removal).",
    how3: "O selo “Cálculo exato” significa que todos os casos foram contados; “Aprox.” é uma amostra aleatória.",
    limitTitle: "O que esta calculadora cobre",
    limitBody:
      "Esta ferramenta só calcula equity de all-in entre dois jogadores. Range contra range, potes " +
      "multiway e linhas de aposta são tratados pelo solver (Spot personalizado).",
    errors: {
      "need-hero": "Escolha primeiro as suas duas cartas.",
      "bad-board": "O board precisa ter 0, 3, 4 ou 5 cartas.",
      "bad-card": "Valor de carta inválido.",
      duplicate: "Você não pode usar a mesma carta duas vezes.",
      "empty-range": "O range do vilão está vazio.",
      "no-combos": "Não sobrou nenhum combo para o vilão depois do card removal.",
      unknown: "Ocorreu um erro durante o cálculo.",
    } as Record<string, string>,
  },
  de: {
    intro:
      "Deine Gewinnchance gegen eine bestimmte Hand oder gegen eine ganze Range. Lass das Board " +
      "für Preflop leer, oder wähle 3/4/5 Karten für Flop, Turn und River.",
    heroTitle: "① Deine Hand",
    heroHint: "Wähle unten 2 Karten",
    fill: "Von hier befüllen",
    villainTitle: "② Gegner",
    modeHand: "vs Hand",
    modeRange: "vs Range",
    rangePlaceholder: "z. B. 22+,AQs+,K8s:0.75",
    // ⚠ 「Range-Text kopieren」는 PreflopChartPage의 실제 버튼 이름과 같아야 한다
    rangeNote:
      "Du kannst die Ausgabe von [Range-Text kopieren] aus den Preflop-Charts direkt einfügen. " +
      "Gewichtete Notation wie „K8s:0.75“ wird genau so übernommen.",
    anyTwo: "Beliebige zwei Karten",
    rangeError: (token: string) =>
      `„${token}“ ist keine gültige Notation – schreib z. B. 22+, AQs+ oder K8s:0.75`,
    rangeSummary: (combos: number, percent: string) =>
      `${combos} Combos · ${percent}% aller Combos`,
    boardTitle: "③ Board",
    boardHintEmpty: "Leer = Preflop (3/4/5 Karten sind auch möglich)",
    boardHintBad: "Das Board darf nur 0, 3, 4 oder 5 Karten haben",
    boardHintOk: (n: number) => ["", "", "", "Flop", "Turn", "River"][n],
    compute: "Berechnen",
    computing: "Wird berechnet…",
    stop: "Stopp",
    clear: "Karten & Board leeren",
    resultTitle: "Ergebnis",
    resultEmpty:
      "Wähle deine zwei Karten und einen Gegner (2 Karten oder Range) und drücke auf [Berechnen].",
    vsSide: (value: string) => `Gegner ${value}%`,
    win: "Sieg",
    tie: "Split",
    lose: "Niederlage",
    combos: "Gegner-Combos",
    badgeExact: "Exakt",
    badgeApprox: "Näherung (±0,2%-Punkte)",
    // 천단위 구분은 독일식 마침표 — 본체 브리프 §3 (pt판의 toLocaleString("pt-BR")과 같은 처리)
    exactNote: (n: number) =>
      `Alle ${n.toLocaleString("de-DE")} möglichen Fälle wurden gezählt`,
    approxNote: (n: number) =>
      `Zu viele Fälle zum Auszählen – ${n.toLocaleString("de-DE")} zufällige Runouts als Stichprobe`,
    howTitle: "So liest du das",
    how1:
      "Equity = Gewinn-% + die Hälfte der Splits. Das ist dein Anteil am Pot, wenn ihr jetzt sofort all-in wärt.",
    how2:
      "Gegen eine Range fallen Combos, die durch deine Karten oder das Board blockiert sind, automatisch weg (Card Removal).",
    how3:
      "Das Abzeichen „Exakt“ heißt, dass jeder Fall gezählt wurde; „Näherung“ ist eine Zufallsstichprobe.",
    limitTitle: "Was dieser Rechner abdeckt",
    limitBody:
      "Dieses Werkzeug berechnet nur die All-in-Equity zwischen zwei Spielern. Range gegen Range, " +
      "Multiway-Pots und Bet-Lines übernimmt der Solver (Eigener Spot).",
    errors: {
      "need-hero": "Wähle zuerst deine zwei Karten.",
      "bad-board": "Das Board darf nur 0, 3, 4 oder 5 Karten haben.",
      "bad-card": "Ungültiger Kartenwert.",
      duplicate: "Dieselbe Karte kann nicht zweimal vorkommen.",
      "empty-range": "Die Gegner-Range ist leer.",
      "no-combos":
        "Nach dem Card Removal bleiben dem Gegner keine Combos übrig – wähle andere Karten oder mach die Gegner-Range weiter.",
      unknown: "Bei der Berechnung ist ein Fehler aufgetreten.",
    } as Record<string, string>,
  },
  zh: {
    intro:
      "这里算的是你的手牌对上对手某手牌（或者整个范围）时的胜率。公共牌留空就是翻前，" +
      "选 3/4/5 张就分别算翻牌圈、转牌圈、河牌圈的胜率。",
    heroTitle: "① 我的手牌",
    heroHint: "在下面的选牌区里选 2 张",
    fill: "填到这里",
    villainTitle: "② 对手",
    modeHand: "vs 手牌",
    modeRange: "vs 范围",
    rangePlaceholder: "例：22+,AQs+,K8s:0.75",
    // ⚠ [复制范围文本]는 PreflopChartPage의 «실제» 버튼 이름과 글자까지 같아야 한다
    rangeNote:
      "在翻前范围表里点[复制范围文本]，再直接粘到这里就行。" +
      "像“K8s:0.75”这样带权重的写法也会原样生效。",
    anyTwo: "任意两张（随机手牌）",
    rangeError: (token: string) =>
      `“${token}”不是有效的写法——请写成 22+、AQs+ 或 K8s:0.75 这样的形式`,
    rangeSummary: (combos: number, percent: string) =>
      `${combos} 个组合 · 占全部的 ${percent}%`,
    boardTitle: "③ 公共牌",
    boardHintEmpty: "留空 = 翻前（3/4/5 张也可以）",
    boardHintBad: "公共牌只能是 0、3、4 或 5 张。",
    boardHintOk: (n: number) => ["", "", "", "翻牌", "转牌", "河牌"][n],
    compute: "计算",
    computing: "计算中…",
    stop: "停止",
    // ⚠ clearAll()은 손패·상대 핸드·공공패·결과만 지우고 «레인지 입력칸은 그대로» 둔다.
    //   그래서 「全部清空」이라고 쓰면 거짓말이 된다 (독일어 UX 검수에서 잡은 그 결함)
    clear: "清空手牌和公共牌",
    resultTitle: "结果",
    resultEmpty: "先选好自己的两张牌和对手（两张牌或一个范围），再点[计算]。",
    vsSide: (value: string) => `对手 ${value}%`,
    win: "胜",
    tie: "平",
    lose: "负",
    combos: "对手组合数",
    badgeExact: "精确",
    // 「个百分点」= percentage point. 「%」와 뒤섞이지 않게 반드시 «点»을 붙인다
    badgeApprox: "近似（±0.2 个百分点）",
    // ⚠ 큰 수를 「万/亿」으로 바꾸지 «않는다» — 브리프 §3의 万/亿은 어림수(3万筹码)에 쓰는 말이고,
    //   여기 1,712,304는 «정확히 센 개수»다. 정확한 개수는 중국어도 천단위 콤마로 적는다.
    //   로케일을 명시해 브라우저 언어에 따라 표기가 흔들리지 않게 했다 (de판과 같은 처리)
    exactNote: (n: number) =>
      `${n.toLocaleString("zh-CN")} 种可能的情况全部数过了`,
    approxNote: (n: number) =>
      `情况太多，数不完——随机抽取了 ${n.toLocaleString("zh-CN")} 次发牌作为样本`,
    howTitle: "怎么看",
    how1:
      "胜率（equity）= 获胜% + 平局的一半。也就是如果现在就全下，你能从底池里拿走的份额。",
    how2:
      "对手是一个范围时，被你的牌或公共牌挡住的组合会自动去掉——这叫牌张移除（card removal）。",
    how3: "“精确”这个标记表示所有情况都数过了；“近似”则是随机抽样的结果。",
    limitTitle: "这个计算器管到哪儿",
    limitBody:
      "它只算两人全下的胜率。范围对范围、3 人以上，以及夹着下注和弃牌的局面，" +
      "由求解器（自定义牌局）来负责。",
    errors: {
      "need-hero": "请先选好自己的两张牌。",
      "bad-board": "公共牌只能是 0、3、4 或 5 张。",
      "bad-card": "牌的数值不对。",
      duplicate: "同一张牌不能用两次。",
      "empty-range": "对手范围是空的。",
      "no-combos":
        "去掉被挡住的组合后，对手一个组合都不剩了——换几张牌，或者把对手范围放宽一些。",
      unknown: "计算过程中出错了。",
    } as Record<string, string>,
  },
  "zh-hant": {
    intro:
      "這裡算的是你的手牌對上對手某手牌（或者整個範圍）時的勝率。公共牌留空就是翻牌前，" +
      "選 3/4/5 張就分別算翻牌圈、轉牌圈、河牌圈的勝率。",
    heroTitle: "① 我的手牌",
    heroHint: "在下面的選牌區裡選 2 張",
    fill: "填到這裡",
    villainTitle: "② 對手",
    modeHand: "vs 手牌",
    modeRange: "vs 範圍",
    rangePlaceholder: "例：22+,AQs+,K8s:0.75",
    // ⚠ [複製範圍文字]는 PreflopChartPage의 «실제» 버튼 이름과 글자까지 같아야 한다
    rangeNote:
      "在翻前範圍表裡按下[複製範圍文字]，再直接貼到這裡就行。" +
      "像「K8s:0.75」這樣帶權重的寫法也會原樣生效。",
    anyTwo: "任意兩張（隨機手牌）",
    rangeError: (token: string) =>
      `「${token}」不是有效的寫法——請寫成 22+、AQs+ 或 K8s:0.75 這樣的形式`,
    rangeSummary: (combos: number, percent: string) =>
      `${combos} 個組合 · 佔全部的 ${percent}%`,
    boardTitle: "③ 公共牌",
    boardHintEmpty: "留空 = 翻牌前（3/4/5 張也可以）",
    boardHintBad: "公共牌只能是 0、3、4 或 5 張。",
    boardHintOk: (n: number) => ["", "", "", "翻牌", "轉牌", "河牌"][n],
    compute: "計算",
    computing: "計算中…",
    stop: "停止",
    // ⚠ clearAll()은 손패·상대 핸드·공공패·결과만 지우고 «레인지 입력칸은 그대로» 둔다.
    //   그래서 「全部清空」이라고 쓰면 거짓말이 된다 (독일어 UX 검수에서 잡은 그 결함)
    clear: "清空手牌和公共牌",
    resultTitle: "結果",
    resultEmpty: "先選好自己的兩張牌和對手（兩張牌或一個範圍），再按下[計算]。",
    vsSide: (value: string) => `對手 ${value}%`,
    win: "勝",
    tie: "平",
    lose: "負",
    combos: "對手組合數",
    badgeExact: "精確",
    // 「個百分點」= percentage point. 「%」와 뒤섞이지 않게 반드시 «點»을 붙인다
    badgeApprox: "近似（±0.2 個百分點）",
    // ⚠ 큰 수를 「萬/億」으로 바꾸지 «않는다» — 어림수(3萬籌碼)에 쓰는 말이고
    //   여기 1,712,304는 «정확히 센 개수»다. 로케일은 zh-TW로 명시해 표기가 흔들리지 않게 했다
    exactNote: (n: number) =>
      `${n.toLocaleString("zh-TW")} 種可能的情況全部數過了`,
    approxNote: (n: number) =>
      `情況太多，數不完——隨機抽取了 ${n.toLocaleString("zh-TW")} 次發牌作為樣本`,
    howTitle: "怎麼看",
    // ⚠ equity의 «정의»를 잃지 말 것 — 간체 세션에서 검토자 3명이 이 자리를 🔴로 올렸다.
    //   en「win% plus half of the ties」와 같은 뜻이어야 한다
    how1:
      "勝率（equity）= 獲勝% + 平手的一半。也就是如果現在就全下，你能從底池裡拿走的份額。",
    how2:
      "對手是一個範圍時，被你的牌或公共牌擋住的組合會自動去掉——這叫牌張移除（card removal）。",
    how3: "「精確」這個標記表示所有情況都數過了；「近似」則是隨機抽樣的結果。",
    limitTitle: "這個計算器算得到什麼",
    limitBody:
      "它只算兩人全下的勝率。範圍對範圍、3 人以上，以及夾著下注和蓋牌的局面，" +
      "由解算器（自訂牌局）來負責。",
    errors: {
      "need-hero": "請先選好自己的兩張牌。",
      "bad-board": "公共牌只能是 0、3、4 或 5 張。",
      "bad-card": "牌的數值不對。",
      duplicate: "同一張牌不能用兩次。",
      "empty-range": "對手範圍是空的。",
      "no-combos":
        "去掉被擋住的組合後，對手一個組合都不剩了——換幾張牌，或者把對手範圍放寬一些。",
      unknown: "計算過程中出錯了。",
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
