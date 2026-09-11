<template>
  <section v-if="visible" class="nodelock relative shrink-0 min-w-0 text-sm">
    <button
      type="button"
      data-testid="nodelock-toggle"
      class="nodelock-trigger flex min-w-0 max-w-full items-center gap-2 px-3 py-2 text-left font-semibold"
      :aria-expanded="opened"
      aria-controls="nodelock-content"
      @click="opened = !opened"
    >
      <span class="shrink-0" aria-hidden="true">{{ opened ? "▾" : "▸" }}</span>
      <span class="min-w-0 break-words">{{ L.title }}</span>
      <span v-if="lockStore.locks.length" class="shrink-0 text-amber-300">({{ lockStore.locks.length }})</span>
    </button>

    <div
      v-show="opened"
      id="nodelock-content"
      data-testid="nodelock-panel"
      class="nodelock-popover absolute left-0 top-full min-w-0 space-y-3 overflow-y-auto overscroll-contain p-3"
    >
      <p v-if="lockStore.error" data-testid="nodelock-error" role="alert" class="break-words rounded bg-red-950 p-2 text-red-200">
        {{ L.engineError }}
        <code class="mt-1 block break-all text-xs">{{ lockStore.error }}</code>
      </p>

      <p v-if="skippedChance" data-testid="nodelock-skipped-chance" role="status" class="break-words text-amber-200">
        {{ L.skippedChance }}
      </p>

      <form v-else-if="editableSpot" class="min-w-0 space-y-2" @submit.prevent="apply">
        <p class="break-all font-mono text-xs text-neutral-300">{{ pathLabel }}</p>
        <p v-if="initialUnavailable && !currentLock" data-testid="nodelock-no-reach" class="break-words text-amber-200">{{ L.noReach }}</p>
        <fieldset :disabled="editorDisabled" class="min-w-0 space-y-2">
          <legend class="sr-only">{{ L.frequency }}</legend>
          <label v-for="(action, index) in editableSpot.actions" :key="index" class="nodelock-action grid min-w-0 grid-cols-[minmax(0,1fr)_6rem] items-center gap-3">
            <span class="min-w-0 break-all font-mono" :style="{ color: action.color }">{{ action.name }}:{{ action.amount }}</span>
            <span class="flex min-w-0 items-center gap-1">
              <input
                v-model.number="percentages[index]"
                type="number"
                inputmode="numeric"
                min="0"
                max="100"
                step="1"
                :data-testid="`nodelock-frequency-${index}`"
                :aria-label="`${action.name}:${action.amount} ${L.frequency} (%)`"
                :aria-invalid="!validPercentage(percentages[index])"
                class="w-full min-w-0 rounded border border-neutral-600 bg-neutral-800 px-2 py-1.5 text-right tabular-nums disabled:opacity-50"
              />
              <span aria-hidden="true">%</span>
            </span>
          </label>
        </fieldset>
        <div class="nodelock-submit">
        <p data-testid="nodelock-sum" class="text-right tabular-nums text-neutral-300">Σ {{ totalText }}</p>
        <p v-if="!validDistribution" data-testid="nodelock-sum-error" role="status" class="break-words text-amber-200">{{ L.sumError }}</p>
        <button
          type="submit"
          data-testid="nodelock-apply"
          :disabled="editorDisabled || !validDistribution"
          class="nodelock-apply max-w-full whitespace-normal break-words rounded bg-brand px-3 py-2 font-semibold text-brand-ink hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >{{ L.apply }}</button>
        </div>
      </form>

      <ul v-if="lockStore.locks.length" data-testid="nodelock-list" class="nodelock-list min-w-0 border-t border-neutral-700 pt-3">
        <li v-for="(lock, index) in lockStore.locks" :key="JSON.stringify(lock.history)" class="nodelock-saved min-w-0 rounded bg-neutral-800 p-2">
          <p class="break-all font-mono text-xs">{{ lock.label }}</p>
          <p class="mt-1 break-words text-xs text-neutral-300">{{ distributionText(lock) }}</p>
          <button
            type="button"
            :data-testid="`nodelock-remove-${index}`"
            :disabled="mutationDisabled"
            class="mt-2 max-w-full whitespace-normal break-words rounded border border-neutral-500 px-2 py-1 hover:bg-neutral-700 disabled:opacity-50"
            @click="remove(lock.history)"
          >{{ L.remove }}</button>
        </li>
      </ul>
      <button
        v-if="canClear"
        type="button"
        data-testid="nodelock-clear"
        :disabled="mutationDisabled"
        class="max-w-full whitespace-normal break-words rounded border border-neutral-500 px-3 py-2 hover:bg-neutral-800 disabled:opacity-50"
        @click="clearAll"
      >{{ L.clearAll }}</button>

      <div v-if="lockStore.before || lockStore.after" data-testid="nodelock-comparison" class="min-w-0 space-y-3 border-t border-neutral-700 pt-3">
        <h3 class="break-words font-semibold">{{ L.comparison }}</h3>
        <section v-for="node in comparisonNodes" :key="JSON.stringify(node.history)" :data-history="JSON.stringify(node.history)" class="min-w-0">
          <h4 class="mb-1 break-all font-mono text-xs text-neutral-300">{{ node.label }}</h4>
          <table class="w-full table-fixed text-xs">
            <thead>
              <tr>
                <th scope="col" class="w-[40%]"></th>
                <th scope="col" class="break-words px-1 py-1 text-right font-normal">{{ L.before }}</th>
                <th scope="col" class="break-words px-1 py-1 text-right font-normal">{{ L.after }}</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="action in node.actions" :key="action.name">
                <tr data-field="frequency" :data-action="action.name" class="border-t border-neutral-700">
                  <th scope="row" class="break-words py-1 text-left font-normal">{{ action.name }} · {{ L.frequency }}</th>
                  <td :data-before="raw(action.before?.frequency)" class="break-all px-1 py-1 text-right tabular-nums">{{ percent(action.before?.frequency) }}</td>
                  <td :data-after="raw(action.after?.frequency)" class="break-all px-1 py-1 text-right tabular-nums">{{ percent(action.after?.frequency) }}</td>
                </tr>
                <tr data-field="action-ev" :data-action="action.name">
                  <th scope="row" class="break-words py-1 text-left font-normal">{{ action.name }} · EV</th>
                  <td :data-before="raw(action.before?.ev)" class="break-all px-1 py-1 text-right tabular-nums">{{ evText(action.before?.ev) }}</td>
                  <td :data-after="raw(action.after?.ev)" class="break-all px-1 py-1 text-right tabular-nums">{{ evText(action.after?.ev) }}</td>
                </tr>
              </template>
              <tr v-for="(player, index) in ['OOP', 'IP']" :key="player" :data-field="`${player.toLowerCase()}-ev`" class="border-t border-neutral-700">
                <th scope="row" class="py-1 text-left font-normal">{{ player }} EV</th>
                <td :data-before="raw(node.before?.ev[index])" class="break-all px-1 py-1 text-right tabular-nums">{{ evText(node.before?.ev[index]) }}</td>
                <td :data-after="raw(node.after?.ev[index])" class="break-all px-1 py-1 text-right tabular-nums">{{ evText(node.after?.ev[index]) }}</td>
              </tr>
            </tbody>
          </table>
        </section>
        <table class="w-full table-fixed text-xs">
          <thead>
            <tr>
              <th scope="col" class="w-[40%]"></th>
              <th scope="col" class="break-words px-1 py-1 text-right font-normal">{{ L.before }}</th>
              <th scope="col" class="break-words px-1 py-1 text-right font-normal">{{ L.after }}</th>
            </tr>
          </thead>
          <tbody>
            <tr data-field="exploitability" class="border-t border-neutral-700">
              <th scope="row" class="break-words py-1 text-left font-normal">{{ L.exploitability }}</th>
              <td :data-before="raw(lockStore.before?.exploitability)" class="px-1 py-1 text-right align-top tabular-nums">
                <span class="break-all">{{ evText(lockStore.before?.exploitability) }}</span>
                <span v-if="lockStore.before && lockStore.before.lockCount > 0" data-testid="nodelock-before-assumption" class="mt-1 block break-words text-amber-200">{{ L.assumption }}</span>
              </td>
              <td :data-after="raw(lockStore.after?.exploitability)" class="px-1 py-1 text-right align-top tabular-nums">
                <span class="break-all">{{ evText(lockStore.after?.exploitability) }}</span>
                <span v-if="lockStore.after && lockStore.after.lockCount > 0" data-testid="nodelock-after-assumption" class="mt-1 block break-words text-amber-200">{{ L.assumption }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from "vue";
import { localizeNumber } from "../i18n";
import { nodeLockLabels } from "../node-lock-labels";
import { expandUniform, NodeLock, sameHistory, useNodeLockStore } from "../node-lock";
import { Results, Spot } from "../result-types";
import { useStore } from "../store";

export default defineComponent({
  props: {
    selectedSpot: { type: Object as PropType<Spot | null>, default: null },
    history: { type: Array as PropType<number[]>, required: true },
    pathLabel: { type: String, required: true },
    results: { type: Object as PropType<Results | null>, default: null },
    cards: { type: Array as PropType<number[][]>, required: true },
    navigationBusy: { type: Boolean, required: true },
  },
  setup(props) {
    const appStore = useStore();
    const lockStore = useNodeLockStore();
    const L = computed(nodeLockLabels);
    const opened = ref(Boolean(lockStore.error || lockStore.after));
    const percentages = ref<(number | string)[]>([]);
    const skippedChance = computed(() => props.selectedSpot?.type === "chance" || props.history.some(action => action < 0));
    const editableSpot = computed(() => {
      const spot = props.selectedSpot;
      const results = props.results;
      return spot?.type === "player" && results?.currentPlayer === spot.player &&
        results.numActions === spot.actions.length && !skippedChance.value ? spot : null;
    });
    const numHands = computed(() => editableSpot.value ? props.cards[editableSpot.value.player === "oop" ? 0 : 1]?.length ?? 0 : 0);
    const currentLock = computed(() => lockStore.locks.find(lock => sameHistory(lock.history, props.history)));
    const mutationDisabled = computed(() => props.navigationBusy || lockStore.busy);
    const editorDisabled = computed(() => mutationDisabled.value || !appStore.isSolverFinished || numHands.value === 0);
    const canClear = computed(() => lockStore.locks.length > 0 || lockStore.appliedLocks.length > 0 || lockStore.resultLockCount > 0 || !!lockStore.error);
    const visible = computed(() => !!editableSpot.value || skippedChance.value || canClear.value || !!lockStore.before || !!lockStore.after);

    const meanFrequencies = computed(() => {
      const spot = editableSpot.value;
      const results = props.results;
      const count = numHands.value;
      if (!spot || !results || !count) return null;
      const player = spot.player === "oop" ? 0 : 1;
      const weights = results.weights[player];
      const normalizer = results.normalizer[player];
      if (weights.length !== count || normalizer.length !== count || results.strategy.length !== count * spot.actions.length) return null;
      let mass = 0;
      const totals = spot.actions.map(() => 0);
      for (let hand = 0; hand < count; hand++) {
        const n = normalizer[hand];
        if (weights[hand] === 0 || n === 0) continue;
        if (!Number.isFinite(n) || n < 0) return null;
        for (let action = 0; action < totals.length; action++) {
          const probability = results.strategy[action * count + hand];
          if (!Number.isFinite(probability) || probability < 0) return null;
          totals[action] += probability * n;
        }
        mass += n;
      }
      return mass > 0 ? totals.map(total => total / mass) : null;
    });
    const initialUnavailable = computed(() => meanFrequencies.value === null);

    // Largest remainders make integer defaults total exactly 100 without
    // assigning a rounding discrepancy to the final action alone.
    const resetPercentages = () => {
      if (currentLock.value && currentLock.value.percentages.length === editableSpot.value?.actions.length) {
        percentages.value = [...currentLock.value.percentages];
        return;
      }
      const means = meanFrequencies.value;
      const sum = means?.reduce((total, value) => total + value, 0) ?? 0;
      if (!means || !(sum > 0)) {
        percentages.value = editableSpot.value?.actions.map(() => "") ?? [];
        return;
      }
      const rawPercentages = means.map(value => value / sum * 100);
      const rounded = rawPercentages.map(value => Math.floor(value));
      const remainderOrder = rawPercentages.map((value, index) => ({ index, remainder: value - rounded[index] }))
        .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
      const remaining = 100 - rounded.reduce((total, value) => total + value, 0);
      for (let i = 0; i < remaining; i++) rounded[remainderOrder[i % remainderOrder.length].index]++;
      percentages.value = rounded;
    };
    watch([meanFrequencies, editableSpot, () => props.history.join(","), currentLock], resetPercentages, { immediate: true });
    watch(() => lockStore.error, error => { if (error) opened.value = true; });
    watch(() => lockStore.after, after => { if (after) opened.value = true; });

    const validPercentage = (value: number | string | undefined): value is number =>
      typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100;
    const validDistribution = computed(() => percentages.value.length > 0 &&
      percentages.value.length === editableSpot.value?.actions.length &&
      percentages.value.every(validPercentage) && percentages.value.reduce<number>((sum, value) => sum + Number(value), 0) === 100);
    const totalText = computed(() => localizeNumber((percentages.value.every(validPercentage)
      ? percentages.value.reduce<number>((sum, value) => sum + Number(value), 0) + "%" : "—") + " / 100%"));

    const apply = () => {
      const spot = editableSpot.value;
      if (!spot || editorDisabled.value || !validDistribution.value) return;
      const distribution = percentages.value.map(Number);
      try {
        lockStore.upsert({ history: [...props.history], player: spot.player, label: props.pathLabel,
          actions: spot.actions.map(({ name, amount, color }) => ({ name, amount, color })),
          numHands: numHands.value, percentages: distribution, strategy: expandUniform(distribution, numHands.value) });
        lockStore.requestSolve();
      } catch (error) {
        lockStore.error = error instanceof Error ? error.message : "LOCK_INVALID_INPUT";
      }
    };
    const remove = (history: number[]) => {
      if (mutationDisabled.value) return;
      lockStore.remove(history);
      lockStore.requestSolve();
    };
    const clearAll = () => {
      if (mutationDisabled.value) return;
      lockStore.locks = [];
      lockStore.requestSolve();
    };
    const distributionText = (lock: NodeLock) => lock.actions.map((action, index) =>
      `${action.name}:${action.amount} ${localizeNumber(lock.percentages[index] + "%")}`).join(" · ");

    const comparisonNodes = computed(() => {
      const histories = (lockStore.before?.nodes ?? []).map(node => node.history);
      for (const node of lockStore.after?.nodes ?? []) {
        if (!histories.some(history => sameHistory(history, node.history))) histories.push(node.history);
      }
      return histories.map(history => {
        const before = lockStore.before?.nodes.find(node => sameHistory(node.history, history));
        const after = lockStore.after?.nodes.find(node => sameHistory(node.history, history));
        const names = new Set([...(before?.actions ?? []).map(action => action.name), ...(after?.actions ?? []).map(action => action.name)]);
        return { history, label: after?.label ?? before?.label ?? "", before, after,
          actions: [...names].map(name => ({ name, before: before?.actions.find(action => action.name === name), after: after?.actions.find(action => action.name === name) })) };
      });
    });
    const raw = (value: number | undefined) => value !== undefined && Number.isFinite(value) ? value : "";
    const percent = (value: number | undefined) => value !== undefined && Number.isFinite(value) ? localizeNumber((value * 100).toFixed(2) + "%") : "—";
    const evText = (value: number | undefined) => {
      if (value === undefined || !Number.isFinite(value)) return "—";
      const scale = appStore.displayUnitScale;
      return localizeNumber((value / scale).toFixed(3) + (scale > 1 ? "bb" : ""));
    };

    return { lockStore, L, opened, percentages, skippedChance, editableSpot, currentLock, mutationDisabled,
      editorDisabled, canClear, visible, initialUnavailable, validPercentage, validDistribution, totalText,
      apply, remove, clearAll, distributionText, comparisonNodes, raw, percent, evText };
  },
});
</script>

<style scoped>
.nodelock-trigger {
  min-height: 34px;
  border: 1px solid rgb(var(--c-brand) / 70%);
  border-radius: 6px;
  color: rgb(var(--c-brand-hover));
  background: rgb(var(--c-brand) / 8%);
  line-height: 1.4;
}
.nodelock-trigger:hover,
.nodelock-trigger[aria-expanded="true"] {
  background: rgb(var(--c-brand) / 16%);
  border-color: rgb(var(--c-brand));
}
.nodelock-trigger > span {
  line-height: 1.4;
}
.nodelock-popover {
  z-index: 60;
  width: min(36rem, 100%);
  max-height: min(620px, 65vh);
  margin-top: 4px;
  background: rgb(var(--c-bg-2));
  border: 1px solid rgb(var(--c-brand) / 45%);
  border-radius: 8px;
  box-shadow: 0 12px 32px rgb(0 0 0 / 35%);
  font-size: 13px;
}
.nodelock-action {
  padding: 6px 8px;
  background: rgb(var(--c-bg-1));
  border: 1px solid rgb(var(--c-line));
  border-radius: 5px;
}
.nodelock-action > span:first-child {
  font-size: 12px;
}
.nodelock-submit {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 2px;
}
.nodelock-submit [role="status"] {
  flex-basis: 100%;
}
.nodelock-apply {
  line-height: 1.4;
  min-height: 34px;
}
.nodelock-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.nodelock-saved {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 2px 10px;
  flex: 1 1 220px;
  border: 1px solid rgb(var(--c-line));
  background: rgb(var(--c-bg-1));
}
.nodelock-saved > p {
  margin: 0;
}
.nodelock-saved > p:nth-child(2) {
  grid-column: 1;
}
.nodelock-saved > button {
  grid-column: 2;
  grid-row: 1 / 3;
  margin: 0;
  font-size: 12px;
}
[data-testid="nodelock-comparison"] {
  font-variant-numeric: tabular-nums;
}
[data-testid="nodelock-comparison"] th,
[data-testid="nodelock-comparison"] td {
  line-height: 1.4;
}
@media (max-width: 767px) {
  .nodelock-popover {
    max-height: 65vh;
  }
  .nodelock-action {
    gap: 8px;
  }
}
</style>
