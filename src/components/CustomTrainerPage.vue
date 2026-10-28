<template>
  <section id="custom-trainer-top" class="custom-trainer max-w-3xl pb-10">
    <div class="flex flex-wrap items-center gap-2">
      <h2 class="text-base font-semibold text-brand">{{ L.tab }}</h2>
      <!-- RNG 연습: GTO 트레이너와 같은 칩·같은 기억값 (끔 → High → Low) -->
      <button v-if="rngEnabled" type="button" data-testid="custom-trainer-rng-mode" :title="G.modeHelp" :class="['custom-button', rngMode === 'off' ? 'bg-neutral-700' : 'button-blue']" @click="cycleRngMode">
        {{ G.mode[rngMode] }}
      </button>
      <button v-if="bank?.origin" type="button" data-testid="custom-trainer-back-review" class="custom-button ms-auto bg-neutral-700" @click="backToReview">
        {{ backLabel }}
      </button>
      <button type="button" data-testid="custom-trainer-presets" :class="['custom-button bg-neutral-700', bank?.origin ? '' : 'ms-auto']" @click="leave">
        {{ L.presetTab }}
      </button>
    </div>
    <p v-if="error" role="alert" class="mt-3 rounded-lg border border-red-700 bg-red-950 p-3 text-red-300">{{ error }}</p>
    <p v-if="loading" class="py-6">{{ L.loading }}</p>
    <p v-else-if="!banks.length" data-testid="custom-trainer-empty" class="mt-4 rounded-lg border border-neutral-700 p-4 text-neutral-300">{{ L.empty }}</p>
    <template v-else>
      <div class="mt-3 flex flex-wrap items-end gap-2">
        <!-- 폰: 스팟 이름이 길어 잘리므로 선택 칸에 한 줄을 통째로 준다(삭제 버튼은 다음 줄 끝) -->
        <label class="min-w-0 flex-1 basis-full sm:basis-0 text-xs text-neutral-400">
          {{ L.chooseSpot }}
          <select v-model="customTrainerState.selectedBankId" data-testid="custom-trainer-select" :disabled="saving" class="mt-1 block w-full min-w-0 rounded border-neutral-600 bg-neutral-800 text-[13px] sm:text-sm text-neutral-200">
            <option v-for="item in banks" :key="item.id" :value="item.id">{{ bankTitle(item) }}</option>
          </select>
        </label>
        <button type="button" data-testid="custom-trainer-delete" :disabled="saving" class="custom-button ms-auto sm:ms-0 bg-neutral-700 text-neutral-300" @click="deleteSpot">{{ L.deleteSpot }}</button>
      </div>
      <article v-if="bank" data-testid="custom-trainer-bank" :data-bank-id="bank.id" :data-node-count="bank.nodes.length" class="mt-3">
        <p data-testid="custom-trainer-source" class="text-xs leading-relaxed text-neutral-400">{{ source }}</p>
        <p v-if="bank.lockCount" data-testid="custom-trainer-lock-label" class="mt-2 rounded-lg border border-amber-700/70 bg-amber-950/50 px-3 py-2 text-sm font-semibold text-amber-200">{{ L.lockAssumption }}</p>
        <div v-if="question" data-testid="custom-trainer-question" :data-question-id="question.id" :data-bank-id="bank.id" :data-node-id="question.node.nodeId" :data-hand-pair="question.handPair" class="mt-3 rounded-lg border border-neutral-700 bg-surface-2 p-3 md:p-4">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <b class="text-brand">{{ seatName(question.player) }}</b>
            <span class="text-neutral-300">{{ L.pot }} {{ amount(question.node.selectedSpot.pot ?? question.node.startingPot) }} · {{ L.stack }} {{ amount(question.node.selectedSpot.stack ?? question.node.effectiveStack) }}</span>
          </div>
          <p data-rtl-island="action-path" dir="ltr" v-if="question.node.history.length" class="mt-2 text-xs leading-relaxed text-neutral-400">
            {{ lineLabelText }} {{ question.node.history.map(historyText).join(" → ") }}
          </p>
          <div class="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-3 rounded-lg bg-surface-1 p-3">
            <div class="text-center">
              <p class="mb-1 text-xs text-neutral-400">{{ L.board }}</p>
              <div data-rtl-island="board-cards" dir="ltr" class="flex justify-center gap-1 text-2xl font-bold">
                <span v-for="(card, index) in boardCards" :key="index" :class="card.colorClass">{{ card.rank }}{{ card.suit }}</span>
              </div>
            </div>
            <div class="text-center">
              <p class="mb-1 text-xs text-neutral-400">{{ L.hand }}</p>
              <div data-rtl-island="hand-cards" dir="ltr" class="flex justify-center gap-1 text-3xl font-bold">
                <span v-for="(card, index) in handCards" :key="index" :class="card.colorClass">{{ card.rank }}{{ card.suit }}</span>
              </div>
            </div>
            <div v-if="rngActive" class="self-end text-center">
              <span dir="ltr" data-testid="custom-trainer-rng-roll" class="inline-block rounded bg-brand/15 px-2 py-0.5 text-sm font-semibold text-brand tabular-nums">RNG {{ rngRoll }}</span>
            </div>
          </div>
          <p class="mt-4 text-sm font-semibold">{{ L.prompt }}</p>
          <div class="mt-2 grid gap-2 md:grid-cols-2">
            <button v-for="(action, index) in question.node.selectedSpot.actions" :key="index" type="button" :data-testid="`custom-trainer-action-${index}`" :disabled="!!evaluation || saving" :class="['custom-button border text-start', evaluation?.selectedAction === index ? 'border-brand bg-brand/10 text-brand' : 'border-neutral-600 bg-neutral-700']" @click="choose(index)">
              {{ actionLabel(action, evaluation ? "label" : "button") }}
            </button>
          </div>
          <div v-if="evaluation" data-testid="custom-trainer-verdict" :data-loss="evaluation.evLossBb" :data-best-limit="limits.bestBb" :data-good-limit="limits.goodBb" :data-verdict="verdictKind" :data-rng="rngResult ? rngResult.verdict : ''" :data-reference="answer.reference" class="mt-4 border-t border-neutral-700 pt-3" aria-live="polite">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <b :class="answer.reference ? 'text-neutral-300' : verdictKind === 'best' ? 'text-emerald-300' : verdictKind === 'good' ? 'text-blue-300' : 'text-orange-300'">{{ answer.reference ? R.referenceOnly : verdict }}</b>
              <span class="text-sm text-neutral-300">{{ L.evLoss }} {{ displayValue(evaluation.evLossBb) }}</span>
            </div>
            <p v-if="answer.reference" data-testid="custom-trainer-reference" class="mt-1 text-xs text-neutral-400">{{ R.practiceReferenceNote }}</p>
            <p v-else-if="answer.mixed" data-testid="custom-trainer-mixed" class="mt-1 text-xs text-neutral-400">{{ R.mixedAction }}</p>
            <!-- RNG 구간: 1~100을 솔버 빈도로 나눈 띠 + 내 숫자 위치 (GTO 트레이너와 같은 모양) -->
            <div v-if="rngResult" data-testid="custom-trainer-rng-result" class="mt-3 rounded-lg bg-neutral-900/60 px-3 py-2">
              <div class="text-xs text-neutral-400">
                {{ G.bandsTitle }} ·
                <b dir="ltr" class="text-brand tabular-nums">{{ G.yourNumber }} {{ rngRoll }}</b>
              </div>
              <div data-rtl-island="rng" dir="ltr" class="relative mt-1.5 flex h-2 rounded bg-neutral-900">
                <div v-for="(band, b) in rngBandList" :key="band.action" :class="'h-full ' + (band.action === rngResult.rolledAction ? 'bg-brand/80' : b % 2 ? 'bg-neutral-600' : 'bg-neutral-500')" :style="{ width: band.to - band.from + 1 + '%' }"></div>
                <div class="absolute -top-1 -bottom-1 w-0.5 rounded bg-white" :style="{ left: 'calc(' + (rngRoll - 0.5) + '% - 1px)' }"></div>
              </div>
              <div :dir="isAr ? 'rtl' : 'ltr'" class="mt-1.5 text-xs text-neutral-400 tabular-nums">
                <span v-for="(band, b) in rngBandList" :key="band.action">
                  <template v-if="b"> · </template>
                  <span :class="band.action === rngResult.rolledAction ? 'text-brand font-semibold' : ''">{{ bandText(actionLabel(question.node.selectedSpot.actions[band.action]), band.from, band.to) }}</span>
                </span>
              </div>
              <div class="mt-1 text-xs text-neutral-300">{{ rngNote }}</div>
            </div>
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
import { M, ruChipLabel, plChipLabel } from "../custom-trainer-labels";
import { classifyRngAnswer, nextRngMode, readRngMode, rngAction, rngBands, rollRng, trainerRngEnabled } from "../trainer-rng";
import type { RngMode } from "../trainer-rng";
import { RNG_M } from "../trainer-rng-labels";
import { M as REVIEW_LABELS } from "../hand-review-labels";
import { turnPackLabels } from "../turn-pack-labels"; // R2_REVIEW_ONLY
import { useStore } from "../store";
import { i18n, localizeNumber, pctText, ltrIso, arLabelIso } from "../i18n";
import { cardText, formatAmount } from "../utils";

export default defineComponent({
  setup() {
    const L = computed(() => M[i18n.locale]);
    const R = computed(() => REVIEW_LABELS[i18n.locale]);
    const TP = computed(() => turnPackLabels(i18n.locale)); // R2_REVIEW_ONLY
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
    const ruUnit = (n: number, scale: number) => scale === 10 ? "bb" : ` ${ruChipLabel(n, true)}`; // toFixed(3) 표시 → few형
    // ar: «N (رقائق)» avoids count-dependent chip nouns and a duplicate pot/stack label (§7-1).
    const arAmount = (value: string, scale: number) => scale === 10 ? ltrIso(`${number(value)}bb`) : `${ltrIso(number(value))} (${L.value.chips})`;
    // Keep display precision for Polish grammar: 1.000 selects other, not one.
    // The raw amount is still unchanged; formatting and noun selection happen only here.
    const plAmount = (value: string, scale: number) => {
      const fractionDigits = value.split(".")[1]?.length ?? 0;
      const count = Number(value);
      const display = count.toLocaleString("pl-PL", { useGrouping: true, minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
      return `${display}${scale === 10 ? "bb" : ` ${plChipLabel(count, fractionDigits)}`}`;
    };
    const displayValue = (value: number) => i18n.locale === "ar"
      ? arAmount(value.toFixed(3), bank.value?.unitScale ?? 1)
      : i18n.locale === "ru"
      ? `${number(value.toFixed(3))}${ruUnit(value, bank.value?.unitScale ?? 1)}`
      : i18n.locale === "it"
      ? `${number(value.toFixed(3))}${bank.value?.unitScale === 10 ? "bb" : ` ${L.value.chips}`}`
      : i18n.locale === "pl"
      ? plAmount(value.toFixed(3), bank.value?.unitScale ?? 1)
      : i18n.locale === "th"
      ? `${number(value.toFixed(3))}${bank.value?.unitScale === 10 ? "bb" : ` ${L.value.chips}`}`
      : `${number(value.toFixed(3))} ${unit.value}`;
    const amount = (value: number) => i18n.locale === "ar"
      ? arAmount(formatAmount(value, bank.value?.unitScale ?? 1), bank.value?.unitScale ?? 1)
      : i18n.locale === "ru"
      ? `${number(formatAmount(value, bank.value?.unitScale ?? 1))}${ruUnit(Number(formatAmount(value, bank.value?.unitScale ?? 1)), bank.value?.unitScale ?? 1)}`
      : i18n.locale === "it"
      ? `${number(formatAmount(value, bank.value?.unitScale ?? 1))}${bank.value?.unitScale === 10 ? "bb" : ` ${L.value.chips}`}`
      : i18n.locale === "pl"
      ? plAmount(formatAmount(value, bank.value?.unitScale ?? 1), bank.value?.unitScale ?? 1)
      : i18n.locale === "th"
      ? `${number(formatAmount(value, bank.value?.unitScale ?? 1))}${bank.value?.unitScale === 10 ? "bb" : ` ${L.value.chips}`}`
      : `${number(formatAmount(value, bank.value?.unitScale ?? 1))} ${unit.value}`;
    const percent = (value: number) =>
      i18n.locale === "fr" ? `${number(value.toFixed(1))} %` : pctText(number(value.toFixed(1)));
    const boardCards = computed(() => question.value?.node.currentBoard.map(cardText) ?? []);
    const handCards = computed(() => question.value ? trainerCardPair(question.value.handPair) : []);
    const limits = computed(() => question.value ? customLossLimits(question.value.node) : { potBb: 0, bestBb: 0, goodBb: 0 });
    /* RNG 연습 — 숫자는 문제마다 새로 뽑는다. 복습 목록·기록은 지금처럼 EV 손실 기준 */
    const G = computed(() => RNG_M[i18n.locale as keyof typeof RNG_M] ?? RNG_M.en);
    const rngEnabled = trainerRngEnabled();
    const rngMode = ref<RngMode>(rngEnabled ? readRngMode() : "off");
    const rngRoll = ref(rollRng());
    const cycleRngMode = () => { rngMode.value = nextRngMode(rngMode.value); };
    const rngActive = computed(() => rngMode.value !== "off" && !!question.value);
    const rngBandList = computed(() => {
      const mode = rngMode.value;
      if (!rngActive.value || !question.value || mode === "off") return [];
      const frequencies = evaluateTrainerAction(question.value, 0).actions.map(a => a.frequency);
      return rngBands(question.value.node.selectedSpot.actions, frequencies, mode);
    });
    const rngResult = computed(() => {
      const result = evaluation.value;
      if (!result || !rngBandList.value.length) return null;
      return classifyRngAnswer({
        selectedAction: result.selectedAction,
        frequencies: result.actions.map(a => a.frequency),
        evLossBb: result.evLossBb,
        goodBb: limits.value.goodBb,
        bands: rngBandList.value,
        roll: rngRoll.value,
      });
    });
    const rngNote = computed(() => {
      const r = rngResult.value;
      const node = question.value?.node;
      if (!r || !node) return "";
      const rolled = node.selectedSpot.actions[rngAction(rngBandList.value, rngRoll.value)];
      const action = rolled ? actionLabel(rolled) : "";
      return r.verdict === "best" ? G.value.noteBest(action) : r.mixed ? G.value.noteMixed(action) : G.value.noteOther(action);
    });
    const answer = computed(() => {
      if (!question.value || !evaluation.value || !bank.value) return { kind: "best" as const, mixed: false, reference: false };
      const graded = classifyCustomTrainerAnswer(bank.value, question.value.node, question.value.handIndex, evaluation.value.selectedAction, evaluation.value.evLossBb);
      // RNG가 켜졌으면 숫자 구간으로 채점(«참고용» 자리는 그대로 참고용) — 섞는 액션 안내는 RNG 문구가 맡는다
      const rng = rngResult.value;
      if (!rng || graded.reference) return graded;
      return { kind: rng.verdict === "miss" ? "bad" as const : rng.verdict, mixed: false, reference: false };
    });
    const verdictKind = computed(() => answer.value.kind);
    const verdict = computed(() => verdictKind.value === "best" ? L.value.verdictBest : verdictKind.value === "good" ? L.value.verdictGood : L.value.verdictBad);
    // 턴 팩(플랍 조회 턴 카드 비교)에서 만든 자리는 출처를 따로 적는다 — 기기 계산 복기로 보이지 않게
    const originSource = (origin: NonNullable<CustomTrainerBank["origin"]>) => {
      if (origin.study) return TP.value.practiceSource.replace("{method}", R.value.precomputed); // R2_REVIEW_ONLY
      return L.value.reviewSource.replace("{method}", origin.street === "flop" ? R.value.precomputed : R.value.onDevice);
    };
    const source = computed(() => bank.value ? (bank.value.origin
      ? originSource(bank.value.origin)
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
      if (i18n.locale === "ar") {
        return `${ltrIso(board)} · ${L.value.pot} ${arAmount(formatAmount(item.startingPot, item.unitScale), item.unitScale)} · ${L.value.stack} ${arAmount(formatAmount(item.effectiveStack, item.unitScale), item.unitScale)}`;
      }
      if (i18n.locale === "it") {
        const suffix = item.unitScale === 10 ? "bb" : ` ${L.value.chips}`;
        return `${board} · ${L.value.pot} ${number(formatAmount(item.startingPot, item.unitScale))}${suffix} · ${L.value.stack} ${number(formatAmount(item.effectiveStack, item.unitScale))}${suffix}`;
      }
      if (i18n.locale === "pl") {
        return `${board} · ${L.value.pot} ${plAmount(formatAmount(item.startingPot, item.unitScale), item.unitScale)} · ${L.value.stack} ${plAmount(formatAmount(item.effectiveStack, item.unitScale), item.unitScale)}`;
      }
      if (i18n.locale === "th") {
        const suffix = item.unitScale === 10 ? "bb" : ` ${L.value.chips}`;
        return `${board} · ${L.value.pot} ${number(formatAmount(item.startingPot, item.unitScale))}${suffix} · ${L.value.stack} ${number(formatAmount(item.effectiveStack, item.unitScale))}${suffix}`;
      }
      const unitName = item.unitScale === 10 ? "bb" : L.value.chips;
      return `${board} · ${L.value.pot} ${number(formatAmount(item.startingPot, item.unitScale))} ${unitName} · ${L.value.stack} ${number(formatAmount(item.effectiveStack, item.unitScale))} ${unitName}`;
    };
    const actionLabel = (action: { name: string; amount: string }, role: "label" | "button" = "label") => {
      const label = trainerActionLabel({ name: action.name, amount: "" }, 0, 1, role);
      if (i18n.locale === "ar") {
        return arLabelIso(!action.amount || Number(action.amount) === 0 ? label : `${label} ${amount(Number(action.amount))}`);
      }
      return !action.amount || Number(action.amount) === 0 ? label : `${label} ${amount(Number(action.amount))}`;
    };
    const bandText = (label: string, from: number, to: number) => i18n.locale === "ar"
      ? arLabelIso(label, `${from}–${to}`)
      : `${label} ${from}–${to}`;
    const lineLabelText = computed(() => i18n.locale === "ar" ? arLabelIso(`${L.value.line}:`) : `${L.value.line}:`);
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
      rngRoll.value = rollRng();
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
    const backLabel = computed(() => {
      const study = bank.value?.origin?.study; // R2_REVIEW_ONLY
      if (study) return study.turnView ? TP.value.backToTurnView : TP.value.backToStudy; // R2_REVIEW_ONLY
      return L.value.backToReview;
    });
    const backToReview = () => {
      const study = bank.value?.origin?.study; // R2_REVIEW_ONLY
      if (study && bank.value) { customTrainerState.studyReturn = { ...study, bankId: bank.value.id }; store.sideView = "flop-study"; return; } // R2_REVIEW_ONLY
      store.sideView = "hand-review";
    };
    const seatName = (player: "oop" | "ip") => bank.value?.origin?.seats[player === "oop" ? 0 : 1] ?? player.toUpperCase();
    const historyText = (action: { player: "oop" | "ip"; name: string; amount: string }) => i18n.locale === "ar"
      ? arLabelIso(`${ltrIso(seatName(action.player))} ${actionLabel(action)}`)
      : `${seatName(action.player)} ${actionLabel(action)}`;
    return { isAr: computed(() => i18n.locale === "ar"), bandText, lineLabelText, historyText, L, R, G, rngEnabled, rngMode, rngRoll, cycleRngMode, rngActive, rngBandList, rngResult, rngNote, answer, backLabel, backToReview, seatName, customTrainerState, banks, bank, question, evaluation, attempts, loading, saving, error, reviewMode, reviewAttempts,
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
