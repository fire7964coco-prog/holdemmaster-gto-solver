<template>
  <div class="max-w-4xl pb-10">
    <div
      v-if="loadError"
      class="rounded-lg border border-red-700 bg-red-950 px-4 py-3 text-red-300"
    >
      트레이너 데이터를 불러오지 못했습니다: {{ loadError }}
    </div>
    <div v-else-if="!bank" class="py-8">
      <span class="spinner inline-block mr-3"></span>트레이너 준비 중...
    </div>

    <template v-else>
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="item in categories"
          :key="item"
          :class="
            'button-base ' +
            (category === item ? 'button-blue' : 'bg-neutral-700 hover:bg-neutral-600')
          "
          @click="changeCategory(item)"
        >
          {{ trainerCategoryLabel(item) }}
        </button>
        <button
          v-if="reviewAttempts.length"
          :class="
            'button-base ml-0 md:ml-2 ' +
            (reviewMode ? 'button-green' : 'bg-neutral-700 hover:bg-neutral-600')
          "
          @click="toggleReview"
        >
          복습 {{ reviewAttempts.length }}개
        </button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
        <div class="stat-card">
          <span>풀이</span><b>{{ attempts.length }}</b>
        </div>
        <div class="stat-card">
          <span>연속 정답</span>
          <b :class="streak >= 3 ? 'text-emerald-300' : ''">
            {{ streak }}<span v-if="bestStreak > 0" class="text-xs text-neutral-500">
              / 최고 {{ bestStreak }}</span
            >
          </b>
        </div>
        <div class="stat-card">
          <span>누적 EV 손실</span><b>{{ totalLoss.toFixed(3) }}bb</b>
        </div>
        <div class="stat-card">
          <span>평균 EV 손실</span><b>{{ averageLoss.toFixed(3) }}bb</b>
        </div>
        <div class="stat-card">
          <span>좋은 선택</span><b>{{ excellentRate.toFixed(0) }}%</b>
        </div>
      </div>

      <!-- 약점 분석: 카테고리별 평균 EV 손실 -->
      <div
        v-if="weakness.rows.some((row) => row.count > 0)"
        class="mt-3 rounded-lg border border-neutral-700 bg-neutral-900/50 px-3 py-2.5"
      >
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span class="font-semibold text-neutral-300">약점 분석</span>
          <span
            v-for="row in weakness.rows"
            :key="row.category"
            :class="
              weakness.weakest && weakness.weakest.category === row.category
                ? 'text-orange-300 font-semibold'
                : 'text-neutral-400'
            "
          >
            {{ row.label }}
            <template v-if="row.count">
              평균 {{ row.averageLossBb.toFixed(3) }}bb
              <span class="text-neutral-600">({{ row.count }}문제)</span>
            </template>
            <span v-else class="text-neutral-600">미풀이</span>
          </span>
        </div>
        <div v-if="weakness.weakest" class="mt-1.5 text-xs text-neutral-400">
          <b class="text-orange-300">{{ weakness.weakest.label }}</b>
          에서 손실이 가장 큽니다 —
          <button class="link-like" @click="changeCategory(weakness.weakest.category)">
            이 상황만 연습하기
          </button>
        </div>
        <div v-else class="mt-1.5 text-xs text-neutral-500">
          상황별로 3문제 이상 풀면 어디가 약한지 알려드립니다.
        </div>
      </div>

      <p class="mt-2 text-right text-xs text-neutral-500">
        13개 교육 프리셋 · {{ decisionCount }}개 결정 노드 · 계산 목표 오차
        {{ bank.targetExploitabilityPct }}%
      </p>

      <div
        v-if="question"
        class="mt-5 rounded-xl border border-neutral-700 bg-neutral-800 p-4 md:p-5"
      >
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span class="text-sm font-semibold text-blue-300">
            {{ question.presetTitle }}
          </span>
          <span class="text-xs text-neutral-500">
            {{ positionLabel }} ({{ question.node.selectedSpot.player.toUpperCase() }})
            차례
          </span>
          <span class="ml-auto text-xs text-neutral-400">
            팟 {{ amountBb(question.node.selectedSpot.pot ?? question.node.startingPot) }}
            · 스택
            {{ amountBb(question.node.selectedSpot.stack ?? question.node.effectiveStack) }}
          </span>
        </div>

        <div v-if="question.node.history.length" class="mt-3 text-sm text-neutral-400">
          진행:
          <span
            v-for="(action, index) in question.node.history"
            :key="index"
            class="ml-1"
          >
            {{ historyPlayerLabel(action.player) }}
            {{ historyLabel(action) }}<span v-if="index + 1 < question.node.history.length"> →</span>
          </span>
        </div>

        <div class="flex flex-col md:flex-row items-center justify-center gap-5 md:gap-10 mt-6">
          <div class="text-center">
            <div class="text-xs text-neutral-500 mb-1">보드</div>
            <div class="text-2xl font-bold tracking-wide">
              <span
                v-for="(card, index) in boardCards"
                :key="index"
                :class="'mr-1 ' + card.colorClass"
              >
                {{ card.rank }}{{ card.suit }}
              </span>
            </div>
          </div>
          <div class="text-center">
            <div class="text-xs text-neutral-500 mb-1">내 핸드</div>
            <div class="text-3xl font-bold tracking-wide">
              <span
                v-for="(card, index) in handCards"
                :key="index"
                :class="'mr-1 ' + card.colorClass"
              >
                {{ card.rank }}{{ card.suit }}
              </span>
            </div>
            <div class="mt-1.5 flex flex-wrap justify-center gap-1">
              <span class="hand-tag bg-neutral-700 text-neutral-200">
                {{ handLabels.made }}
              </span>
              <span
                v-if="handLabels.draw"
                class="hand-tag bg-blue-900/70 text-blue-200"
              >
                {{ handLabels.draw }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-6 text-center font-semibold">어떤 액션을 선택하시겠습니까?</div>
        <div class="flex flex-wrap justify-center gap-2 mt-3">
          <button
            v-for="(action, index) in question.node.selectedSpot.actions"
            :key="index"
            :disabled="!!evaluation"
            :class="
              'min-w-28 rounded-lg border px-4 py-2 font-semibold transition ' +
              (evaluation && evaluation.selectedAction === index
                ? 'border-yellow-400 bg-yellow-900/50 text-yellow-200'
                : 'border-neutral-600 bg-neutral-700 hover:bg-neutral-600')
            "
            @click="choose(index)"
          >
            {{
              trainerActionLabel(
                action,
                question.node.selectedSpot.pot ?? question.node.startingPot,
                question.node.unitScale
              )
            }}
          </button>
        </div>

        <div v-if="evaluation" class="mt-6 border-t border-neutral-700 pt-4">
          <div
            :class="
              'text-center text-lg font-bold ' +
              (evaluation.evLossBb <= 0.01
                ? 'text-emerald-300'
                : evaluation.evLossBb <= 0.05
                ? 'text-blue-300'
                : 'text-orange-300')
            "
          >
            {{
              evaluation.evLossBb <= 0.01
                ? "최적 선택"
                : evaluation.evLossBb <= 0.05
                ? "허용 가능한 선택"
                : "다시 볼 스팟"
            }}
            · EV 손실 {{ evaluation.evLossBb.toFixed(3) }}bb
          </div>
          <p class="mt-1 text-center text-xs text-neutral-500">
            혼합 전략은 단순 오답 처리하지 않고 액션 EV 차이로 평가합니다.
          </p>

          <div class="mt-4 space-y-2">
            <div
              v-for="action in evaluation.actions"
              :key="action.index"
              class="grid grid-cols-[minmax(8rem,1fr)_5rem_6rem] items-center gap-2 rounded-lg bg-neutral-900/60 px-3 py-2 text-sm"
            >
              <span :class="{ 'font-bold text-emerald-300': action.isBest }">
                {{ action.label }}{{ action.isBest ? " · 최고 EV" : "" }}
              </span>
              <span class="text-right">{{ (action.frequency * 100).toFixed(1) }}%</span>
              <span class="text-right tabular-nums">EV {{ action.evBb.toFixed(3) }}bb</span>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button class="button-base button-green px-6" @click="nextQuestion">
              다음 문제
            </button>
            <a
              v-if="articleUrl"
              :href="articleUrl"
              target="_blank"
              class="text-sm text-blue-400 hover:underline"
            >
              이 스팟 해설 읽기 →
            </a>
            <button
              class="text-sm text-neutral-400 hover:text-neutral-200"
              @click="openSpot"
            >
              이 스팟 결과 전체 보기
            </button>
          </div>
        </div>
      </div>

      <div class="mt-4 flex justify-end">
        <button
          v-if="attempts.length"
          class="text-xs text-neutral-500 hover:text-red-300"
          @click="resetHistory"
        >
          학습 기록 초기화
        </button>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import {
  clearTrainerAttempts,
  addTrainerAttempt,
  getTrainerAttempts,
  TrainerAttempt,
} from "../db";
import { ARTICLE_URLS, PRESETS } from "../presets";
import { useStore } from "../store";
import { cardText, formatBb } from "../utils";
import {
  evaluateTrainerAction,
  makeTrainerQuestion,
  GOOD_LOSS_BB,
  TrainerBank,
  TrainerCategory,
  TrainerEvaluation,
  TrainerQuestion,
  trainerActionLabel,
  trainerCardPair,
  trainerCategory,
  trainerCategoryLabel,
  trainerHandLabels,
  trainerStreak,
  trainerWeakness,
  validateTrainerBank,
} from "../trainer";

export default defineComponent({
  setup() {
    const store = useStore();
    const categories: TrainerCategory[] = ["all", "srp", "3bp", "blind"];
    const category = ref<TrainerCategory>("all");
    const bank = ref<TrainerBank | null>(null);
    const question = ref<TrainerQuestion | null>(null);
    const evaluation = ref<TrainerEvaluation | null>(null);
    const attempts = ref<TrainerAttempt[]>([]);
    const loadError = ref("");
    const reviewMode = ref(false);
    let reviewIndex = 0;

    const decisionCount = computed(
      () => bank.value?.presets.reduce((sum, item) => sum + item.nodes.length, 0) ?? 0
    );
    const averageLoss = computed(() =>
      attempts.value.length
        ? attempts.value.reduce((sum, item) => sum + item.evLossBb, 0) /
          attempts.value.length
        : 0
    );
    const totalLoss = computed(() =>
      attempts.value.reduce((sum, item) => sum + item.evLossBb, 0)
    );
    const excellentRate = computed(() =>
      attempts.value.length
        ? (attempts.value.filter((item) => item.evLossBb <= GOOD_LOSS_BB)
            .length *
            100) /
          attempts.value.length
        : 0
    );
    // attempts는 최신순 — 앞에서부터 세면 현재 연속 기록이 된다
    const streak = computed(() => trainerStreak(attempts.value));
    const bestStreak = computed(() => {
      let best = 0;
      let current = 0;
      for (const attempt of attempts.value) {
        if (attempt.evLossBb <= GOOD_LOSS_BB) {
          current++;
          best = Math.max(best, current);
        } else {
          current = 0;
        }
      }
      return best;
    });
    const weakness = computed(() => trainerWeakness(attempts.value));
    const reviewAttempts = computed(() => {
      const seen = new Set<string>();
      return attempts.value.filter((item) => {
        if (seen.has(item.questionId)) return false;
        seen.add(item.questionId);
        return (
          item.evLossBb > 0.05 &&
          (category.value === "all" || item.category === category.value)
        );
      });
    });

    const restoreQuestion = (attempt: TrainerAttempt) => {
      if (!bank.value) return null;
      const [presetId, nodeId] = attempt.questionId.split(":");
      const presetData = bank.value.presets.find((item) => item.presetId === presetId);
      const node = presetData?.nodes.find((item) => item.nodeId === nodeId);
      if (!node) return null;
      const player = node.selectedSpot.player;
      const playerIndex = player === "oop" ? 0 : 1;
      const handIndex = node.cards[playerIndex].indexOf(attempt.handPair);
      if (handIndex < 0) return null;
      return {
        id: `${presetId}:${nodeId}:${attempt.handPair}`,
        presetId,
        presetTitle: PRESETS.find((item) => item.id === presetId)?.title ?? presetId,
        category: trainerCategory(presetId),
        node,
        handIndex,
        handPair: attempt.handPair,
        player,
      } as TrainerQuestion;
    };

    const nextQuestion = () => {
      evaluation.value = null;
      if (!bank.value) return;
      if (reviewMode.value && reviewAttempts.value.length) {
        const attempt = reviewAttempts.value[reviewIndex % reviewAttempts.value.length];
        reviewIndex++;
        question.value = restoreQuestion(attempt);
      } else {
        question.value = makeTrainerQuestion(bank.value, category.value);
      }
    };

    const choose = async (actionIndex: number) => {
      if (!question.value || evaluation.value) return;
      evaluation.value = evaluateTrainerAction(question.value, actionIndex);
      const result = evaluation.value;
      await addTrainerAttempt({
        timestamp: Date.now(),
        questionId: question.value.id,
        presetId: question.value.presetId,
        category: question.value.category,
        handPair: question.value.handPair,
        selectedAction: actionIndex,
        bestAction: result.bestAction,
        evLossBb: result.evLossBb,
      });
      attempts.value = await getTrainerAttempts();
    };

    const changeCategory = (value: TrainerCategory) => {
      category.value = value;
      reviewMode.value = false;
      nextQuestion();
    };
    const toggleReview = () => {
      reviewMode.value = !reviewMode.value;
      reviewIndex = 0;
      nextQuestion();
    };
    const resetHistory = async () => {
      if (!confirm("이 기기의 트레이너 학습 기록을 모두 지울까요?")) return;
      await clearTrainerAttempts();
      attempts.value = [];
      reviewMode.value = false;
    };

    onMounted(async () => {
      try {
        const response = await fetch("trainer-decisions.json");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const loaded = (await response.json()) as TrainerBank;
        const errors = validateTrainerBank(loaded);
        if (errors.length) throw new Error(errors.slice(0, 3).join(", "));
        bank.value = loaded;
        attempts.value = await getTrainerAttempts();
        nextQuestion();
      } catch (error) {
        loadError.value = error instanceof Error ? error.message : String(error);
      }
    });

    const boardCards = computed(
      () => question.value?.node.currentBoard.map(cardText) ?? []
    );
    const handCards = computed(() =>
      question.value ? trainerCardPair(question.value.handPair) : []
    );
    const handLabels = computed(() =>
      question.value
        ? trainerHandLabels(
            question.value.handPair,
            question.value.node.currentBoard
          )
        : { made: "", draw: "" }
    );
    const articleUrl = computed(() =>
      question.value ? ARTICLE_URLS[question.value.presetId] ?? "" : ""
    );
    const openSpot = () => {
      if (!question.value) return;
      store.pendingPresetPreview = question.value.presetId;
      store.sideView = "presets";
    };
    const positionLabel = computed(() => {
      if (!question.value) return "";
      const preset = PRESETS.find((item) => item.id === question.value?.presetId);
      return question.value.player === "oop"
        ? preset?.oopLabel ?? "OOP"
        : preset?.ipLabel ?? "IP";
    });
    const amountBb = (value: number) =>
      formatBb(value, question.value?.node.unitScale || 10);
    const historyLabel = (action: { name: string; amount: string }) =>
      trainerActionLabel(
        action,
        question.value?.node.startingPot || 0,
        question.value?.node.unitScale || 10
      );
    const historyPlayerLabel = (player: "oop" | "ip") => {
      const preset = PRESETS.find((item) => item.id === question.value?.presetId);
      return player === "oop"
        ? preset?.oopLabel ?? "OOP"
        : preset?.ipLabel ?? "IP";
    };

    return {
      categories,
      category,
      bank,
      question,
      evaluation,
      attempts,
      loadError,
      reviewMode,
      decisionCount,
      averageLoss,
      totalLoss,
      excellentRate,
      reviewAttempts,
      streak,
      bestStreak,
      weakness,
      boardCards,
      handCards,
      handLabels,
      articleUrl,
      openSpot,
      positionLabel,
      trainerCategoryLabel,
      trainerActionLabel,
      amountBb,
      historyLabel,
      historyPlayerLabel,
      choose,
      nextQuestion,
      changeCategory,
      toggleReview,
      resetHistory,
    };
  },
});
</script>

<style scoped>
.stat-card {
  @apply flex flex-col rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2;
}
.stat-card span {
  @apply text-xs text-neutral-500;
}
.stat-card b {
  @apply mt-0.5 text-lg text-neutral-200;
}
.hand-tag {
  @apply rounded px-2 py-0.5 text-xs font-semibold;
}
.link-like {
  @apply text-blue-400 underline font-semibold;
}
</style>
