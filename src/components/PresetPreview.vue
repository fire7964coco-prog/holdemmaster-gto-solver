<template>
  <div class="preset-preview min-w-0">
    <!-- 상단 바: 돌아가기 + 스팟 정보 + 직접 계산 -->
    <div class="flex flex-wrap items-center gap-2">
      <button class="button-base button-blue" @click="$emit('close')">
        {{ L.backToList }}
      </button>
      <span class="font-bold text-lg ml-1">{{ presetTitleOf(preset) }}</span>
      <span class="font-bold tracking-wide">
        <span
          v-for="(c, i) in boardTexts"
          :key="i"
          :class="'mr-0.5 ' + c.colorClass"
        >
          {{ c.rank }}{{ c.suit }}
        </span>
      </span>
      <!-- 스팟 정보는 칩으로 — 트레이너와 같은 눈금을 쓴다 -->
      <span class="stat-chip">
        {{ L.pot }} <b>{{ $n(String(preset.startingPot / preset.unitScale)) }}</b>bb
      </span>
      <span class="stat-chip">
        {{ L.stack }} <b>{{ $n(String(preset.effectiveStack / preset.unitScale)) }}</b>bb
      </span>
    </div>

    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm">
      <span class="text-neutral-400">
        {{ L.flopOnlyNote }}
      </span>
      <button
        class="button-base button-green shrink-0"
        @click="$emit('load')"
      >
        {{ L.solveThisSpot }}
      </button>
      <a
        v-if="articleUrl"
        :href="articleUrl"
        target="_blank"
        class="px-1 text-brand hover:underline shrink-0"
      >
        {{ L.readArticle }}
      </a>
    </div>

    <div v-if="error" class="mt-4 text-red-400">
      {{ L.loadError(error) }}
    </div>
    <div v-else-if="!data" class="mt-4">
      <span class="spinner inline-block mr-3"></span>{{ L.loading }}
    </div>

    <template v-else>
      <!-- 플레이어 전환 -->
      <!-- 폭을 고정하지 않는다 — 언어마다 라벨 길이가 달라(ja가 en의 1.4배) 어떤 값을
           잡아도 어딘가는 잘린다. 내용에 맞춰 늘어나게 두고 상한만 건다.
           (2026-08-21: ko 101·en 108·ja 143·es 106px vs 고정폭 안쪽 94px로 4개 국어 전부 잘렸다) -->
      <div class="flex flex-wrap items-center gap-2 mt-3">
        <span class="text-sm">{{ L.playerLabel }}</span>
        <select
          v-model="displayPlayer"
          class="max-w-full sm:max-w-[18rem] px-2 py-1 rounded-lg text-sm"
        >
          <option value="oop">OOP ({{ oopLabelOf(preset) }})</option>
          <option value="ip">IP ({{ ipLabelOf(preset) }})</option>
        </select>
        <span
          v-if="displayPlayer === 'oop'"
          data-testid="preset-oop-hint"
          class="basis-full md:basis-auto text-xs text-neutral-400"
        >
          {{ L.oopHint }}
        </span>
      </div>

      <!-- 본문: 결과 화면과 동일한 구도 (모바일 세로 스택 / 데스크톱 좌우) -->
      <div class="flex flex-col md:flex-row mt-3 gap-3">
        <!-- ResultBasics 루트가 h-full이라 높이는 래퍼에서 지정해야 함 -->
        <div class="preview-matrix shrink-0 min-w-0 md:[flex:11]">
          <ResultBasics
            :cards="data.cards"
            :selected-spot="data.selectedSpot"
            :selected-chance="null"
            :current-board="data.currentBoard"
            :total-bet-amount="data.totalBetAmount"
            :results="data.results"
            :display-options="displayOptions"
            :display-player="displayPlayer"
            :is-compare-mode="false"
          />
        </div>

        <div class="flex flex-col md:[flex:9] min-w-0 gap-2">
          <ActionSummary
            :results="data.results"
            :selected-spot="data.selectedSpot"
            :display-player="displayPlayer"
            :unit-scale="preset.unitScale"
            :pot="preset.startingPot"
          />

          <HandBreakdown
            class="shrink-0"
            :cards="data.cards[displayPlayer === 'oop' ? 0 : 1]"
            :weights="data.results.weights[displayPlayer === 'oop' ? 0 : 1]"
            :board="data.currentBoard"
          />

          <ResultTable
            class="h-[24rem] md:h-[24rem]"
            table-mode="basics"
            :cards="data.cards"
            :selected-spot="data.selectedSpot"
            :results="data.results"
            :display-player="displayPlayer"
            :unit-scale="preset.unitScale"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import {
  ARTICLE_URLS,
  Preset,
  presetTitleOf,
  oopLabelOf,
  ipLabelOf,
} from "../presets";
import { trackOutbound } from "../outbound";
import { Results, Spot, DisplayOptions } from "../result-types";
import { cardText, parseCardString } from "../utils";
import { i18n } from "../i18n";

import ResultBasics from "./ResultBasics.vue";
import ResultTable from "./ResultTable.vue";
import HandBreakdown from "./HandBreakdown.vue";
import ActionSummary from "./ActionSummary.vue";

const M = {
  ko: {
    backToList: "← 목록",
    pot: "팟",
    stack: "스택",
    flopOnlyNote: "플랍 전략입니다. 턴·리버까지 눌러보며 탐색하려면 →",
    solveThisSpot: "이 스팟 직접 계산하기",
    readArticle: "이 스팟 해설 읽기",
    loadError: (e: string) => `미리 계산된 결과를 불러오지 못했습니다: ${e}`,
    loading: "결과 불러오는 중...",
    playerLabel: "플레이어:",
    oopHint: "먼저 행동하는 쪽(OOP)의 전략입니다. 상대(IP) 쪽을 보려면 위 「플레이어」를 IP로 바꾸세요.",
  },
  en: {
    backToList: "← Back",
    pot: "Pot",
    stack: "Stack",
    flopOnlyNote: "Flop strategy only. Want to click through turn and river? →",
    solveThisSpot: "Solve this spot yourself",
    readArticle: "Read the article",
    loadError: (e: string) => `Couldn't load the precomputed results: ${e}`,
    loading: "Loading results…",
    playerLabel: "Player:",
    oopHint: "This is the strategy of the player who acts first (OOP). To see the opponent (IP), set “Player” above to IP.",
  },
  ja: {
    backToList: "← 一覧へ",
    pot: "ポット",
    stack: "スタック",
    flopOnlyNote: "フロップ戦略です。ターン・リバーまでクリックして探索するには →",
    solveThisSpot: "このスポットを自分で計算する",
    readArticle: "このスポットの解説を読む",
    loadError: (e: string) => `計算済みの結果を読み込めませんでした: ${e}`,
    loading: "結果を読み込み中…",
    playerLabel: "プレイヤー:",
    oopHint: "先に行動する側(OOP)の戦略です。相手(IP)側を見るには、上の「プレイヤー」をIPにしてください。",
  },
  es: {
    backToList: "← Lista",
    pot: "Bote",
    stack: "Stack",
    flopOnlyNote: "Solo estrategia de flop. ¿Quieres explorar turn y river? →",
    solveThisSpot: "Resolver este spot tú mismo",
    readArticle: "Leer el análisis",
    loadError: (e: string) => `No se pudieron cargar los resultados precalculados: ${e}`,
    loading: "Cargando resultados…",
    playerLabel: "Jugador:",
    oopHint: "Es la estrategia del jugador que actúa primero (OOP). Para ver al rival (IP), cambia “Jugador” arriba a IP.",
  },
  pt: {
    backToList: "← Lista",
    pot: "Pote",
    stack: "Stack",
    flopOnlyNote: "Só a estratégia do flop. Quer explorar turn e river? →",
    solveThisSpot: "Resolver este spot você mesmo",
    readArticle: "Ler a análise",
    loadError: (e: string) => `Não foi possível carregar os resultados pré-calculados: ${e}`,
    loading: "Carregando resultados…",
    playerLabel: "Jogador:",
    oopHint: "Esta é a estratégia de quem age primeiro (OOP). Para ver o adversário (IP), mude “Jogador” acima para IP.",
  },
  de: {
    backToList: "← Zurück",
    pot: "Pot",
    stack: "Stack",
    flopOnlyNote: "Nur die Flop-Strategie. Turn und River durchklicken? →",
    solveThisSpot: "Diesen Spot selbst berechnen",
    readArticle: "Analyse lesen",
    loadError: (e: string) =>
      `Die vorberechneten Ergebnisse konnten nicht geladen werden: ${e}`,
    loading: "Ergebnisse werden geladen…",
    playerLabel: "Spieler:",
    oopHint: "Das ist die Strategie des Spielers, der zuerst handelt (OOP). Um den Gegner (IP) zu sehen, stelle oben „Spieler“ auf IP.",
  },
  zh: {
    backToList: "← 列表",
    pot: "底池",
    stack: "筹码量",
    flopOnlyNote: "这里只有翻牌圈的策略。想一路点到转牌和河牌 →",
    solveThisSpot: "自己计算这个牌局",
    // ⚠ PresetsPage.articleLink와 같은 사정 — 지금은 한국어에서만 뜬다
    readArticle: "阅读这个牌局的解说",
    loadError: (e: string) => `无法加载预先算好的结果：${e}`,
    loading: "正在加载结果…",
    playerLabel: "玩家：",
    oopHint: "这是先行动一方(OOP)的策略。要看对手(IP)一方，请将上方“玩家”改为 IP。",
  },
  "zh-hant": {
    backToList: "← 列表",
    pot: "底池",
    stack: "籌碼量",
    flopOnlyNote: "這裡只有翻牌圈的策略。想一路點到轉牌和河牌 →",
    solveThisSpot: "自己計算這個牌局",
    // ⚠ PresetsPage.articleLink와 같은 사정 — 지금은 한국어에서만 뜬다
    readArticle: "閱讀這個牌局的解說",
    // ⚠ 「미리 계산해 뒀다」를 말하지 않는 규칙의 예외 — 실패했을 때만 뜨는 문구다
    loadError: (e: string) => `無法載入預先算好的結果：${e}`,
    loading: "正在載入結果…",
    playerLabel: "玩家：",
    oopHint: "這是先行動一方(OOP)的策略。要看對手(IP)一方，請將上方「玩家」改為 IP。",
  },
  fr: {
    backToList: "← Liste",
    pot: "Pot",
    stack: "Stack",
    flopOnlyNote: "Stratégie du flop uniquement. Envie de cliquer jusqu'au turn et à la river ? →",
    solveThisSpot: "Calcule ce spot toi-même",
    // ⚠ PresetsPage.articleLink와 같은 사정 — 지금은 한국어에서만 뜬다
    readArticle: "Lire l'article",
    // ⚠ 「미리 계산해 뒀다」를 말하지 않는 규칙의 예외 — 실패했을 때만 뜨는 문구다
    loadError: (e: string) => `Impossible de charger les résultats précalculés : ${e}`,
    loading: "Chargement des résultats…",
    playerLabel: "Joueur :",
    // «parler» = 프랑스 포커에서 «액션할 차례»의 관용 표현 (c'est à toi de parler)
    oopHint: "C'est la stratégie du joueur qui parle en premier (OOP). Pour voir l'adversaire (IP), passe « Joueur » sur IP au-dessus.",
  },
  id: {
    backToList: "← Kembali",
    pot: "Pot",
    stack: "Stack",
    flopOnlyNote: "Hanya strategi flop. Ingin lanjut ke turn dan river? →",
    solveThisSpot: "Hitung sendiri spot ini",
    // ⚠ PresetsPage.articleLink와 같은 사정 — 지금은 한국어에서만 뜬다
    readArticle: "Baca artikel",
    // ⚠ 「미리 계산해 뒀다」를 말하지 않는 규칙의 예외 — 실패했을 때만 뜨는 문구다
    loadError: (e: string) => `Gagal memuat hasil yang sudah dihitung (coba muat ulang halaman): ${e}`,
    loading: "Memuat hasil…",
    playerLabel: "Pemain:",
    oopHint: "Ini strategi pemain yang bertindak lebih dulu (OOP). Untuk melihat sisi lawan (IP), ubah “Pemain” di atas ke IP.",
  },
  ms: {
    backToList: "← Kembali",
    pot: "Pot",
    stack: "Stack",
    flopOnlyNote: "Strategi flop sahaja. Mahu klik terus ke turn dan river? →",
    solveThisSpot: "Kira sendiri spot ini",
    // ⚠ PresetsPage.articleLink와 같은 사정 — 지금은 한국어에서만 뜬다
    readArticle: "Baca artikel",
    // ⚠ 「미리 계산해 뒀다」를 말하지 않는 규칙의 예외 — 실패했을 때만 뜨는 문구다
    loadError: (e: string) => `Gagal memuatkan hasil yang telah dikira (sila muat semula halaman): ${e}`,
    loading: "Sedang memuatkan hasil…",
    playerLabel: "Pemain:",
    oopHint: "Ini strategi pemain yang bertindak dahulu (OOP). Untuk melihat pihak lawan (IP), tukar “Pemain” di atas kepada IP.",
  },
  hi: {

    backToList: "← वापस",
    pot: "Pot",
    stack: "Stack",
    flopOnlyNote: "यहाँ केवल flop की रणनीति है। Turn और river भी देखना चाहते हैं? →",
    solveThisSpot: "इस स्पॉट की गणना खुद करें",
    readArticle: "विश्लेषण पढ़ें",
    loadError: (e: string) => `पहले से गणना किए गए परिणाम लोड नहीं हुए: ${e}`,
    loading: "परिणाम लोड हो रहे हैं…",
    playerLabel: "खिलाड़ी:",
    oopHint: "यह पहले action करने वाले खिलाड़ी (OOP) की रणनीति है। प्रतिद्वंद्वी (IP) की ओर देखने के लिए ऊपर “खिलाड़ी” को IP पर बदलें।",
  },
} as const;

type PreviewData = {
  cards: number[][];
  selectedSpot: Spot;
  currentBoard: number[];
  results: Results;
  totalBetAmount: number[];
};

export default defineComponent({
  components: { ResultBasics, ResultTable, HandBreakdown, ActionSummary },

  props: {
    preset: {
      type: Object as () => Preset,
      required: true,
    },
  },

  emits: ["close", "load"],

  setup(props) {
    const data = ref<PreviewData | null>(null);
    const error = ref("");
    const displayPlayer = ref<"oop" | "ip">("oop");

    const displayOptions = ref<DisplayOptions>({
      playerBasics: "oop",
      playerChance: "auto",
      barHeight: "normalized",
      suit: "grouped",
      strategy: "show",
      contentBasics: "default",
      contentGraphs: "eq",
      chartChance: "strategy-combos",
    });

    const fetchData = async () => {
      data.value = null;
      error.value = "";
      displayPlayer.value = "oop";
      try {
        const res = await fetch(`preset-results/${props.preset.id}.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data.value = await res.json();
      } catch (e) {
        error.value = e instanceof Error ? e.message : String(e);
      }
    };

    fetchData();
    watch(() => props.preset.id, fetchData);

    const boardTexts = computed(() =>
      props.preset.board
        .split(" ")
        .map(parseCardString)
        .filter((c): c is number => c !== null)
        .map(cardText)
    );

    // EN posts don't exist yet — return "" so the v-if hides the link in English
    const articleUrl = computed(() =>
      i18n.locale !== "ko"
        ? ""
        : trackOutbound(ARTICLE_URLS[props.preset.id] ?? "", "preset-preview")
    );

    const L = computed(() => M[i18n.locale]);

    return {
      data,
      error,
      displayPlayer,
      displayOptions,
      boardTexts,
      articleUrl,
      L,
      presetTitleOf,
      oopLabelOf,
      ipLabelOf,
    };
  },
});
</script>

<style scoped>
.preview-matrix {
  height: auto;
  aspect-ratio: 1;
}
@media (min-width: 768px) {
  .preview-matrix {
    height: clamp(26rem, 65vh, 36rem);
    aspect-ratio: auto;
  }
}

.button-green {
  @apply bg-brand text-brand-ink hover:bg-brand-hover active:bg-brand-hover disabled:bg-brand;
}
</style>
