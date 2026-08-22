<template>
  <PresetPreview
    v-if="previewPreset"
    :preset="previewPreset"
    @close="previewPreset = null"
    @load="loadFromPreview"
  />

  <div v-else class="max-w-3xl">
    <div
      class="flex pl-2.5 pr-3 py-1 text-cyan-300 bg-cyan-950 border-2 border-cyan-700 rounded-md"
    >
      <InformationCircleIcon class="inline w-5 h-5 mt-[0.1875rem] mr-1.5 shrink-0" />
      <div>
        <span class="font-semibold text-emerald-300">{{ L.infoBtn1 }}</span
        >{{ L.infoText1
        }}<span class="font-semibold">{{ L.infoBtn2 }}</span
        >{{ L.infoText2 }}
      </div>
    </div>

    <div v-for="group in grouped" :key="group.category" class="mt-6">
      <!-- 일본어 분류명은 전각이라 같은 글자 크기면 넘친다. 문구를 줄이는 대신
           그 언어에서만 한 단계 작게 쓴다 — 언어마다 화면이 달라도 된다 (사용자 결정 2026-08-21) -->
      <div :class="[isJa ? 'text-sm' : 'text-base', 'font-bold text-neutral-200']">
        {{ presetCategoryOf(group.items[0]) }}
      </div>
      <div class="mt-0.5 text-xs text-neutral-500">
        OOP: {{ oopLabelOf(group.items[0]) }} · IP:
        {{ ipLabelOf(group.items[0]) }} · {{ L.pot }}
        {{ $n(String(group.items[0].startingPot / group.items[0].unitScale)) }}bb ·
        {{ L.stack }}
        {{ $n(String(group.items[0].effectiveStack / group.items[0].unitScale)) }}bb
      </div>

      <div
        v-for="p in group.items"
        :key="p.id"
        class="mt-2 px-4 py-3 rounded-lg bg-neutral-800 border border-neutral-700"
      >
        <!--
          모바일에서는 세로로 쌓는다. 버튼 3개가 shrink-0이라 좁은 화면에서
          제목이 최소 폭까지 눌려 «드/라/이/A/하/이/보/드»처럼 한 글자씩 세로로 깨졌다.
        -->
        <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <span class="font-semibold">{{ presetTitleOf(p) }}</span>
            <span class="font-bold tracking-wide shrink-0">
              <span
                v-for="(c, i) in boardCards(p.board)"
                :key="i"
                :class="'mr-0.5 ' + c.colorClass"
              >
                {{ c.rank }}{{ c.suit }}
              </span>
            </span>
          </div>
          <span class="md:ml-auto flex items-center gap-1.5 shrink-0">
            <a
              v-if="articleUrl(p)"
              :href="articleUrl(p)"
              target="_blank"
              class="px-2 text-sm text-blue-400 hover:underline"
            >
              {{ L.articleLink }}
            </a>
            <button
              class="button-base button-green"
              @click="openPreview(p)"
            >
              ⚡ {{ L.viewResults }}
            </button>
            <button class="button-base button-blue" @click="load(p)">
              {{ L.solveYourself }}
            </button>
          </span>
        </div>
        <div class="mt-1.5 text-sm text-neutral-400">
          {{ presetLessonOf(p) }}
        </div>
      </div>
    </div>

    <p class="mt-6 text-xs text-neutral-500">
      {{ L.footnote }}
    </p>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import { useStore, useConfigStore } from "../store";
import { cardText, parseCardString } from "../utils";
import {
  PRESETS,
  ARTICLE_URLS,
  Preset,
  presetTitleOf,
  presetLessonOf,
  presetCategoryOf,
  oopLabelOf,
  ipLabelOf,
} from "../presets";
import { trackOutbound } from "../outbound";
import { notePresetOpened } from "../pwa";
import { i18n } from "../i18n";

import { InformationCircleIcon } from "@heroicons/vue/20/solid";
import PresetPreview from "./PresetPreview.vue";

const M = {
  ko: {
    infoBtn1: "[⚡ 결과 바로 보기]",
    infoText1:
      "를 누르면 결과가 바로 나옵니다. 레인지를 바꿔보거나 턴·리버까지 탐색하고 싶을 때만 ",
    infoBtn2: "[직접 계산]",
    infoText2: "을 쓰세요.",
    pot: "팟",
    stack: "스택",
    articleLink: "해설 보기",
    viewResults: "결과 바로 보기",
    solveYourself: "직접 계산",
    footnote:
      "레인지는 100bb 온라인 표준의 근사치입니다. 불러온 뒤 자유롭게 수정해서 비교해보는 것도 좋은 공부예요.",
  },
  en: {
    infoBtn1: "[⚡ View results]",
    infoText1:
      " shows the solved strategy instantly. Use ",
    infoBtn2: "[Solve it yourself]",
    infoText2:
      " only when you want to tweak the ranges or explore turn and river play.",
    pot: "Pot",
    stack: "Stack",
    articleLink: "Read article",
    viewResults: "View results",
    solveYourself: "Solve it yourself",
    footnote:
      "Ranges are approximations of standard 100bb online play. Load a spot, tweak the ranges, and compare — a great way to study.",
  },
  ja: {
    infoBtn1: "[⚡ 結果をすぐ見る]",
    infoText1:
      "を押すと結果がすぐに表示されます。レンジを変えたり、ターン・リバーまで探索したいときだけ",
    infoBtn2: "[自分で計算]",
    infoText2: "を使ってください。",
    pot: "ポット",
    stack: "スタック",
    articleLink: "解説を見る",
    viewResults: "結果をすぐ見る",
    solveYourself: "自分で計算",
    footnote:
      "レンジは100bbオンライン標準の近似値です。読み込んだ後、自由に調整して比較してみるのも良い勉強になります。",
  },
  es: {
    infoBtn1: "[⚡ Ver resultados]",
    infoText1:
      " muestra la estrategia resuelta al instante. Usa ",
    infoBtn2: "[Resolver tú mismo]",
    infoText2:
      " solo cuando quieras ajustar los rangos o explorar turn y river.",
    pot: "Bote",
    stack: "Stack",
    articleLink: "Leer análisis",
    viewResults: "Ver resultados",
    solveYourself: "Resolver tú mismo",
    footnote:
      "Los rangos son aproximaciones del estándar online de 100bb. Carga un spot, ajusta los rangos y compara — una gran forma de estudiar.",
  },
  pt: {
    infoBtn1: "[⚡ Ver resultados]",
    infoText1:
      " mostra na hora a estratégia já resolvida. Use ",
    infoBtn2: "[Resolver você mesmo]",
    infoText2:
      " só quando quiser ajustar os ranges ou explorar turn e river.",
    pot: "Pote",
    stack: "Stack",
    articleLink: "Ler a análise",
    viewResults: "Ver resultados",
    solveYourself: "Resolver você mesmo",
    footnote:
      "Os ranges são aproximações do padrão online de 100bb. Carregue um spot, ajuste os ranges e compare — é um ótimo jeito de estudar.",
  },
  de: {
    infoBtn1: "[⚡ Ergebnisse ansehen]",
    infoText1: " zeigt dir die fertige Strategie sofort. Nimm ",
    infoBtn2: "[Selbst berechnen]",
    infoText2:
      " nur dann, wenn du die Ranges anpassen oder Turn und River erkunden willst.",
    pot: "Pot",
    stack: "Stack",
    articleLink: "Analyse lesen",
    viewResults: "Ergebnisse ansehen",
    solveYourself: "Selbst berechnen",
    // 「100bb」는 앱이 코드로 찍는 단위 표기(formatAmount)와 맞춘 것 — 화면 안 일관성 우선
    footnote:
      "Die Ranges sind Näherungen des 100bb-Onlinestandards. Lade einen Spot, passe die Ranges an und vergleiche – so lernst du am meisten.",
  },
  zh: {
    // 이 넷은 «[버튼1] 글1 [버튼2] 글2» 순서로 한 문장을 이룬다 — 앞뒤 공백에 주의.
    // 중국어는 단어를 띄우지 않으므로 en·de와 달리 조각 끝에 공백을 두지 않는다
    // ⚠ 이 조각이 문장 «맨 앞»에 온다 — 동사가 없으면 잔문장이 된다
    infoBtn1: "点[⚡ 直接看结果]",
    infoText1:
      "，就能立刻看到算好的策略。想改范围、或者想一路点到转牌和河牌时，再用",
    infoBtn2: "[自己计算]",
    infoText2: "。",
    pot: "底池",
    stack: "筹码量",
    // ⚠ 해설 링크는 지금 한국어에서만 뜬다(articleUrl이 ko 외에는 ""를 돌려준다).
    //   본체 /zh/blog는 있지만 GTO 13편의 중국어판이 아직 없다(2026-08-21 실측 404).
    //   중국어판 글이 생기면 그때 articleUrl에 zh 분기를 더하면 이 문구가 살아난다
    articleLink: "查看解说",
    viewResults: "直接看结果",
    solveYourself: "自己计算",
    // 「100bb」는 앱이 코드로 찍는 단위 표기(formatAmount)와 맞춘 것 — 브리프 §3의 「100BB」
    // 대문자 권고보다 «화면 안 일관성»을 택했다 (독일어에서 내린 판단과 같다)
    footnote:
      "这些范围是 100bb 线上标准打法的近似值。加载之后随便改、随便比较，这本身就是很好的练习。",
  },
  "zh-hant": {
    // 이 넷은 «[버튼1] 글1 [버튼2] 글2» 순서로 한 문장을 이룬다 — 앞뒤 공백에 주의.
    // 중국어는 단어를 띄우지 않으므로 en·de와 달리 조각 끝에 공백을 두지 않는다.
    // ⚠ 이 조각이 문장 «맨 앞»에 온다 — 동사가 없으면 잔문장이 된다
    infoBtn1: "按下[⚡ 直接看結果]",
    infoText1:
      "，就能立刻看到算好的策略。想改範圍，或者想一路點到轉牌和河牌時，再用",
    infoBtn2: "[自己計算]",
    infoText2: "。",
    pot: "底池",
    stack: "籌碼量",
    // ⚠ 해설 링크는 지금 한국어에서만 뜬다(articleUrl이 ko 외에는 ""를 돌려준다).
    //   본체 /zh-hant/blog는 200이지만 GTO 13편의 번체판은 없다(a-high-board-cbet = 404, 2026-08-22 실측)
    articleLink: "查看解說",
    viewResults: "直接看結果",
    solveYourself: "自己計算",
    // 「100bb」는 앱이 코드로 찍는 단위 표기(formatAmount)와 맞춘 것 — «화면 안 일관성» 우선
    footnote:
      "這些範圍是 100bb 線上標準打法的近似值。載入之後隨便改、隨便比較，這本身就是很好的練習。",
  },
} as const;

export default defineComponent({
  components: { InformationCircleIcon, PresetPreview },

  setup() {
    const store = useStore();
    const config = useConfigStore();

    const previewPreset = ref<Preset | null>(null);

    // 미리보기를 여는 유일한 통로. 열람 횟수는 PWA 설치 배너 조건으로도 쓰인다
    // (2개 이상 본 사람에게만 «홈 화면에 추가»를 권한다)
    const openPreview = (preset: Preset) => {
      previewPreset.value = preset;
      notePresetOpened();
    };

    // 트레이너에서 "이 스팟 결과 전체 보기"로 넘어온 경우 해당 미리보기를 바로 연다
    watch(
      () => store.sideView,
      () => {
        if (store.sideView !== "presets" || !store.pendingPresetPreview) return;
        const target = PRESETS.find((p) => p.id === store.pendingPresetPreview);
        if (target) openPreview(target);
        store.pendingPresetPreview = "";
      },
      { immediate: true }
    );

    const grouped = computed(() => {
      const map = new Map<string, Preset[]>();
      for (const p of PRESETS) {
        if (!map.has(p.category)) map.set(p.category, []);
        map.get(p.category)?.push(p);
      }
      return [...map.entries()].map(([category, items]) => ({
        category,
        items,
      }));
    });

    const boardCards = (board: string) =>
      board
        .split(" ")
        .map(parseCardString)
        .filter((c): c is number => c !== null)
        .map(cardText);

    const load = (p: Preset) => {
      // 보드
      config.board = p.board
        .split(" ")
        .map(parseCardString)
        .filter((c): c is number => c !== null);

      // 팟·스택·벳 사이즈 (모든 스트리트 동일 적용)
      config.startingPot = p.startingPot;
      config.effectiveStack = p.effectiveStack;
      config.rakePercent = 0;
      config.rakeCap = 0;
      config.donkOption = false;
      config.oopFlopBet = p.betFlop;
      config.oopFlopRaise = p.raise;
      config.oopTurnBet = p.betTurnRiver;
      config.oopTurnRaise = p.raise;
      config.oopRiverBet = p.betTurnRiver;
      config.oopRiverRaise = p.raise;
      config.ipFlopBet = p.betFlop;
      config.ipFlopRaise = p.raise;
      config.ipTurnBet = p.betTurnRiver;
      config.ipTurnRaise = p.raise;
      config.ipRiverBet = p.betTurnRiver;
      config.ipRiverRaise = p.raise;
      store.displayUnitScale = p.unitScale;

      // 편집된 트리 흔적 초기화
      config.expectedBoardLength = 0;
      config.addedLines = "";
      config.removedLines = "";

      // 레인지는 RangeEditor가 watch로 받아 자체 파이프라인으로 적용
      store.pendingRangeText = [p.oopRange, p.ipRange];

      // 바로 실행 화면으로
      store.sideView = "run-solver";
    };

    // 미리보기 화면의 [직접 계산하기] — 프리셋을 로드하고 실행 화면으로
    const loadFromPreview = () => {
      if (previewPreset.value) load(previewPreset.value);
      previewPreset.value = null;
    };

    // EN posts don't exist yet — return "" so the v-if hides the link in English
    const articleUrl = (p: Preset) =>
      i18n.locale !== "ko"
        ? ""
        : trackOutbound(ARTICLE_URLS[p.id] ?? "", "preset-card");

    const L = computed(() => M[i18n.locale]);
    // 일본어 분류명은 전각이라 한 단계 작게 쓴다 (사용자 결정 2026-08-21)
    const isJa = computed(() => i18n.locale === "ja");

    return {
      grouped,
      boardCards,
      load,
      previewPreset,
      openPreview,
      loadFromPreview,
      articleUrl,
      L,
      presetTitleOf,
      presetLessonOf,
      presetCategoryOf,
      isJa,
      oopLabelOf,
      ipLabelOf,
    };
  },
});
</script>
