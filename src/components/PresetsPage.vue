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
        <span class="font-semibold text-emerald-300">[⚡ 결과 바로 보기]</span>를
        누르면 결과가 바로 나옵니다. 레인지를 바꿔보거나 턴·리버까지
        탐색하고 싶을 때만 <span class="font-semibold">[직접 계산]</span>을
        쓰세요.
      </div>
    </div>

    <div v-for="group in grouped" :key="group.category" class="mt-6">
      <div class="text-base font-bold text-neutral-200">
        {{ group.category }}
      </div>
      <div class="mt-0.5 text-xs text-neutral-500">
        OOP: {{ group.items[0].oopLabel }} · IP: {{ group.items[0].ipLabel }} ·
        팟 {{ group.items[0].startingPot / group.items[0].unitScale }}bb · 스택
        {{ group.items[0].effectiveStack / group.items[0].unitScale }}bb
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
            <span class="font-semibold">{{ p.title }}</span>
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
              해설 보기
            </a>
            <button
              class="button-base button-green"
              @click="openPreview(p)"
            >
              ⚡ 결과 바로 보기
            </button>
            <button class="button-base button-blue" @click="load(p)">
              직접 계산
            </button>
          </span>
        </div>
        <div class="mt-1.5 text-sm text-neutral-400">{{ p.lesson }}</div>
      </div>
    </div>

    <p class="mt-6 text-xs text-neutral-500">
      레인지는 100bb 온라인 표준의 근사치입니다. 불러온 뒤 자유롭게 수정해서
      비교해보는 것도 좋은 공부예요.
    </p>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import { useStore, useConfigStore } from "../store";
import { cardText, parseCardString } from "../utils";
import { PRESETS, ARTICLE_URLS, Preset } from "../presets";
import { trackOutbound } from "../outbound";
import { notePresetOpened } from "../pwa";

import { InformationCircleIcon } from "@heroicons/vue/20/solid";
import PresetPreview from "./PresetPreview.vue";

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

    const articleUrl = (p: Preset) =>
      trackOutbound(ARTICLE_URLS[p.id] ?? "", "preset-card");

    return {
      grouped,
      boardCards,
      load,
      previewPreset,
      openPreview,
      loadFromPreview,
      articleUrl,
    };
  },
});
</script>
