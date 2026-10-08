<template>
  <section id="custom-trainer-top" class="custom-trainer max-w-3xl pb-10">
    <div class="flex flex-wrap items-center gap-2">
      <h2 class="text-base font-semibold text-brand">{{ L.tab }}</h2>
      <button v-if="bank?.origin" type="button" data-testid="custom-trainer-back-review" class="custom-button ml-auto bg-neutral-700" @click="backToReview">
        {{ L.backToReview }}
      </button>
      <button type="button" data-testid="custom-trainer-presets" :class="['custom-button bg-neutral-700', bank?.origin ? '' : 'ml-auto']" @click="leave">
        {{ L.presetTab }}
      </button>
    </div>
    <p v-if="error" role="alert" class="mt-3 rounded-lg border border-red-700 bg-red-950 p-3 text-red-300">{{ error }}</p>
    <p v-if="loading" class="py-6">{{ L.loading }}</p>
    <p v-else-if="!banks.length" data-testid="custom-trainer-empty" class="mt-4 rounded-lg border border-neutral-700 p-4 text-neutral-300">{{ L.empty }}</p>
    <template v-else>
      <div class="mt-3 flex flex-wrap items-end gap-2">
        <label class="min-w-0 flex-1 text-xs text-neutral-400">
          {{ L.chooseSpot }}
          <select v-model="customTrainerState.selectedBankId" data-testid="custom-trainer-select" :disabled="saving" class="mt-1 block w-full min-w-0 rounded border-neutral-600 bg-neutral-800 text-sm text-neutral-200">
            <option v-for="item in banks" :key="item.id" :value="item.id">{{ bankTitle(item) }}</option>
          </select>
        </label>
        <button type="button" data-testid="custom-trainer-delete" :disabled="saving" class="custom-button bg-neutral-700 text-neutral-300" @click="deleteSpot">{{ L.deleteSpot }}</button>
      </div>
      <article v-if="bank" data-testid="custom-trainer-bank" :data-bank-id="bank.id" :data-node-count="bank.nodes.length" class="mt-3">
        <p data-testid="custom-trainer-source" class="text-xs leading-relaxed text-neutral-400">{{ source }}</p>
        <p v-if="bank.lockCount" data-testid="custom-trainer-lock-label" class="mt-2 rounded-lg border border-amber-700/70 bg-amber-950/50 px-3 py-2 text-sm font-semibold text-amber-200">{{ L.lockAssumption }}</p>
        <div v-if="question" data-testid="custom-trainer-question" :data-question-id="question.id" :data-bank-id="bank.id" :data-node-id="question.node.nodeId" :data-hand-pair="question.handPair" class="mt-3 rounded-lg border border-neutral-700 bg-surface-2 p-3 md:p-4">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <b class="text-brand">{{ seatName(question.player) }}</b>
            <span class="text-neutral-300">{{ L.pot }} {{ amount(question.node.selectedSpot.pot ?? question.node.startingPot) }} · {{ L.stack }} {{ amount(question.node.selectedSpot.stack ?? question.node.effectiveStack) }}</span>
          </div>
          <p v-if="question.node.history.length" class="mt-2 text-xs leading-relaxed text-neutral-400">
            {{ L.line }}: {{ question.node.history.map(item => `${seatName(item.player)} ${actionLabel(item)}`).join(" → ") }}
          </p>
          <div class="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-3 rounded-lg bg-surface-1 p-3">
            <div class="text-center">
              <p class="mb-1 text-xs text-neutral-400">{{ L.board }}</p>
              <div class="flex justify-center gap-1 text-2xl font-bold">
                <span v-for="(card, index) in boardCards" :key="index" :class="card.colorClass">{{ card.rank }}{{ card.suit }}</span>
              </div>
            </div>
            <div class="text-center">
              <p class="mb-1 text-xs text-neutral-400">{{ L.hand }}</p>
              <div class="flex justify-center gap-1 text-3xl font-bold">
                <span v-for="(card, index) in handCards" :key="index" :class="card.colorClass">{{ card.rank }}{{ card.suit }}</span>
              </div>
            </div>
          </div>
          <p class="mt-4 text-sm font-semibold">{{ L.prompt }}</p>
          <div class="mt-2 grid gap-2 md:grid-cols-2">
            <button v-for="(action, index) in question.node.selectedSpot.actions" :key="index" type="button" :data-testid="`custom-trainer-action-${index}`" :disabled="!!evaluation || saving" :class="['custom-button border text-left', evaluation?.selectedAction === index ? 'border-brand bg-brand/10 text-brand' : 'border-neutral-600 bg-neutral-700']" @click="choose(index)">
              {{ actionLabel(action) }}
            </button>
          </div>
          <div v-if="evaluation" data-testid="custom-trainer-verdict" :data-loss="evaluation.evLossBb" :data-best-limit="limits.bestBb" :data-good-limit="limits.goodBb" :data-verdict="verdictKind" :data-reference="answer.reference" class="mt-4 border-t border-neutral-700 pt-3" aria-live="polite">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <b :class="answer.reference ? 'text-neutral-300' : verdictKind === 'best' ? 'text-emerald-300' : verdictKind === 'good' ? 'text-blue-300' : 'text-orange-300'">{{ answer.reference ? R.referenceOnly : verdict }}</b>
              <span class="text-sm text-neutral-300">{{ L.evLoss }} {{ displayValue(evaluation.evLossBb) }}</span>
            </div>
            <p v-if="answer.reference" data-testid="custom-trainer-reference" class="mt-1 text-xs text-neutral-400">{{ R.practiceReferenceNote }}</p>
            <p v-else-if="answer.mixed" data-testid="custom-trainer-mixed" class="mt-1 text-xs text-neutral-400">{{ R.mixedAction }}</p>
            <div class="mt-3 grid gap-2 text-sm">
              <div v-for="action in evaluation.actions" :key="action.index" class="rounded-lg bg-neutral-900/60 px-3 py-2">
                <b :class="action.isBest ? 'text-emerald-300' : 'text-neutral-300'">{{ actionLabel(question.node.selectedSpot.actions[action.index]) }} <span v-if="action.isBest">✓</span></b>
                <div class="mt-1 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-neutral-400">
                  <span>{{ L.frequency }} {{ percent(action.frequency * 100) }}</span>
                  <span>{{ L.actionEv }} {{ displayValue(action.evBb) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <button type="button" data-testid="custom-trainer-next" :disabled="saving" class="custom-button button-blue w-full sm:w-auto" @click="nextQuestion">{{ L.next }}</button>
            <button v-if="reviewMode || reviewAttempts.length" type="button" data-testid="custom-trainer-review" :disabled="saving" class="custom-button bg-neutral-700" @click="toggleReview">{{ reviewMode ? L.practice : L.review }}<span v-if="!reviewMode"> ({{ reviewAttempts.length }})</span></button>
          </div>
        </div>
        <p v-else class="mt-3 text-sm text-neutral-300">{{ L.noQuestion }}</p>
        <p data-testid="custom-trainer-attempts" :data-count="attempts.length" class="mt-3 text-sm text-neutral-400">{{ L.attemptCount.replace('{count}', number(String(attempts.length))) }}</p>
      </article>
    </template>
    <p class="mt-4 text-xs leading-relaxed text-neutral-500">{{ L.storageNote }}</p>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { customTrainerState, customLossLimits, classifyCustomTrainerAnswer, makeCustomTrainerQuestion, restoreCustomTrainerQuestion } from "../custom-trainer";
import type { CustomTrainerBank, CustomTrainerQuestion, CustomTrainerAttempt } from "../custom-trainer";
import { listCustomTrainerBanks, deleteCustomTrainerBank, getCustomTrainerAttempts, addCustomTrainerAttempt } from "../custom-trainer-db";
import { evaluateTrainerAction, trainerActionLabel, trainerCardPair } from "../trainer";
import type { TrainerEvaluation } from "../trainer";
import { M, ruChipLabel } from "../custom-trainer-labels";
import { M as REVIEW_LABELS } from "../hand-review-labels";
import { useStore } from "../store";
import { i18n, localizeNumber, pctText } from "../i18n";
import { cardText, formatAmount } from "../utils";

export default defineComponent({
  setup() {
    const L = computed(() => M[i18n.locale]);
    const R = computed(() => REVIEW_LABELS[i18n.locale]);
    const store = useStore();
    const banks = ref<CustomTrainerBank[]>([]);
    const bank = computed(() => banks.value.find(item => item.id === customTrainerState.selectedBankId) ?? null);
    const question = ref<CustomTrainerQuestion | null>(null);
    const evaluation = ref<TrainerEvaluation | null>(null);
    const attempts = ref<CustomTrainerAttempt[]>([]);
    const loading = ref(true);
    const saving = ref(false);
    const error = ref("");
    const reviewMode = ref(false);
    let reviewIndex = 0;
    let alive = true;
    let selectionVersion = 0;
    const unit = computed(() => bank.value?.unitScale === 10 ? "bb" : L.value.chips);
    const number = localizeNumber;
    // ru nouns depend on the displayed count; bb stays attached (U1 §2-1).
    const ruUnit = (n: number, scale: number) => scale === 10 ? "bb" : ` ${ruChipLabel(n)}`;
    const displayValue = (value: number) => i18n.locale === "ru"
      ? `${number(value.toFixed(3))}${ruUnit(value, bank.value?.unitScale ?? 1)}`
      : `${number(value.toFixed(3))} ${unit.value}`;
    const amount = (value: number) => i18n.locale === "ru"
      ? `${number(formatAmount(value, bank.value?.unitScale ?? 1))}${ruUnit(Number(formatAmount(value, bank.value?.unitScale ?? 1)), bank.value?.unitScale ?? 1)}`
      : `${number(formatAmount(value, bank.value?.unitScale ?? 1))} ${unit.value}`;
    const percent = (value: number) =>
      i18n.locale === "fr" ? `${number(value.toFixed(1))} %` : pctText(number(value.toFixed(1)));
    const boardCards = computed(() => question.value?.node.currentBoard.map(cardText) ?? []);
    const handCards = computed(() => question.value ? trainerCardPair(question.value.handPair) : []);
    const limits = computed(() => question.value ? customLossLimits(question.value.node) : { potBb: 0, bestBb: 0, goodBb: 0 });
    const answer = computed(() => question.value && evaluation.value && bank.value
      ? classifyCustomTrainerAnswer(bank.value, question.value.node, question.value.handIndex, evaluation.value.selectedAction, evaluation.value.evLossBb)
      : { kind: "best" as const, mixed: false, reference: false });
    const verdictKind = computed(() => answer.value.kind);
    const verdict = computed(() => verdictKind.value === "best" ? L.value.verdictBest : verdictKind.value === "good" ? L.value.verdictGood : L.value.verdictBad);
    const source = computed(() => bank.value ? (bank.value.origin
      ? L.value.reviewSource.replace("{method}", bank.value.origin.street === "flop" ? R.value.precomputed : R.value.onDevice)
      : L.value.source)
      .replace("{target}", number(String(bank.value.targetExploitabilityPct)))
      .replace("{achieved}", number(String(Number(bank.value.achievedExploitabilityPct.toPrecision(3))))) : "");
    const bankTitle = (item: CustomTrainerBank) => {
      const board = item.board.map(card => { const text = cardText(card); return text.rank + text.suit; }).join(" ");
      if (i18n.locale === "ru") {
        const pot = formatAmount(item.startingPot, item.unitScale);
        const stack = formatAmount(item.effectiveStack, item.unitScale);
        return `${board} · ${L.value.pot} ${number(pot)}${ruUnit(Number(pot), item.unitScale)} · ${L.value.stack} ${number(stack)}${ruUnit(Number(stack), item.unitScale)}`;
      }
      const unitName = item.unitScale === 10 ? "bb" : L.value.chips;
      return `${board} · ${L.value.pot} ${number(formatAmount(item.startingPot, item.unitScale))} ${unitName} · ${L.value.stack} ${number(formatAmount(item.effectiveStack, item.unitScale))} ${unitName}`;
    };
    const actionLabel = (action: { name: string; amount: string }) => {
      const label = trainerActionLabel({ name: action.name, amount: "" }, 0, 1);
      return !action.amount || Number(action.amount) === 0 ? label : `${label} ${amount(Number(action.amount))}`;
    };
    const reviewAttempts = computed(() => {
      if (!bank.value) return [];
      const seen = new Set<string>();
      return attempts.value.filter(attempt => {
        if (seen.has(attempt.questionId)) return false;
        seen.add(attempt.questionId);
        const restored = restoreCustomTrainerQuestion(bank.value!, attempt);
        const graded = restored && classifyCustomTrainerAnswer(bank.value!, restored.node, restored.handIndex, attempt.selectedAction, attempt.evLossBb);
        return !!graded && graded.kind === "bad" && !graded.reference;
      });
    });
    const nextQuestion = () => {
      if (!bank.value || saving.value) return;
      const previousId = question.value?.id;
      evaluation.value = null;
      if (reviewMode.value && reviewAttempts.value.length) {
        const attempt = reviewAttempts.value[reviewIndex++ % reviewAttempts.value.length];
        question.value = restoreCustomTrainerQuestion(bank.value, attempt);
      } else {
        reviewMode.value = false;
        question.value = makeCustomTrainerQuestion(bank.value, previousId);
      }
      void nextTick(() => {
        if (alive) document.getElementById("custom-trainer-top")?.scrollIntoView({ block: "start" });
      });
    };
    watch(bank, async () => {
      const version = ++selectionVersion;
      const selected = bank.value;
      attempts.value = [];
      question.value = null;
      evaluation.value = null;
      reviewMode.value = false;
      reviewIndex = 0;
      error.value = "";
      if (!selected) return;
      nextQuestion();
      try {
        const records = await getCustomTrainerAttempts(selected.id);
        if (alive && version === selectionVersion) attempts.value = records;
      } catch {
        if (alive && version === selectionVersion) error.value = L.value.loadError;
      }
    });
    onMounted(async () => {
      try {
        const saved = await listCustomTrainerBanks();
        if (!alive) return;
        banks.value = saved;
        if (!saved.some(item => item.id === customTrainerState.selectedBankId)) customTrainerState.selectedBankId = saved[0]?.id ?? null;
      } catch {
        if (alive) error.value = L.value.loadError;
      } finally {
        if (alive) loading.value = false;
      }
    });
    onUnmounted(() => { alive = false; });
    const choose = async (selectedAction: number) => {
      if (!question.value || !bank.value || evaluation.value || saving.value) return;
      const current = question.value;
      const selected = bank.value;
      const result = evaluateTrainerAction(current, selectedAction);
      evaluation.value = result;
      saving.value = true;
      error.value = "";
      try {
        const attempt: CustomTrainerAttempt = {
          clientId: globalThis.crypto?.randomUUID?.() ?? `custom-attempt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          timestamp: Date.now(), questionId: current.id,
          presetId: selected.id, category: "custom", bankCreatedAt: selected.createdAt,
          handPair: current.handPair, selectedAction, bestAction: result.bestAction, evLossBb: result.evLossBb,
        };
        await addCustomTrainerAttempt(attempt);
        const records = await getCustomTrainerAttempts(selected.id);
        if (alive && bank.value?.id === selected.id) attempts.value = records;
      } catch {
        if (alive) error.value = L.value.saveError;
      } finally {
        if (alive) saving.value = false;
      }
    };
    const toggleReview = () => {
      reviewMode.value = !reviewMode.value;
      reviewIndex = 0;
      nextQuestion();
    };
    const deleteSpot = async () => {
      const selected = bank.value;
      if (!selected || saving.value || !window.confirm(L.value.deleteConfirm)) return;
      saving.value = true;
      try {
        await deleteCustomTrainerBank(selected.id);
        if (!alive) return;
        banks.value = banks.value.filter(item => item.id !== selected.id);
        customTrainerState.selectedBankId = banks.value[0]?.id ?? null;
      } catch {
        if (alive) error.value = L.value.saveError;
      } finally {
        if (alive) { saving.value = false; if (!question.value) nextQuestion(); }
      }
    };
    const leave = () => { customTrainerState.active = false; };
    const backToReview = () => { store.sideView = "hand-review"; };
    const seatName = (player: "oop" | "ip") => bank.value?.origin?.seats[player === "oop" ? 0 : 1] ?? player.toUpperCase();
    return { L, R, answer, backToReview, seatName, customTrainerState, banks, bank, question, evaluation, attempts, loading, saving, error, reviewMode, reviewAttempts,
      number, amount, displayValue, percent, source, bankTitle, actionLabel, boardCards, handCards, limits, verdictKind, verdict,
      choose, nextQuestion, toggleReview, deleteSpot, leave };
  },
});
</script>

<style scoped>
.custom-trainer {
  min-width: 0;
  overflow-wrap: anywhere;
}
.custom-button {
  @apply rounded-lg px-3 py-2 text-sm font-semibold transition;
  min-height: 44px;
  white-space: normal;
}
.custom-button:disabled {
  cursor: default;
}
.custom-button:not(:disabled):hover {
  filter: brightness(1.13);
}
.custom-trainer {
  font-variant-numeric: tabular-nums;
}
</style>
