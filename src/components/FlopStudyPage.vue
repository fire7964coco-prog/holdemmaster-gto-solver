<template>
  <!-- 플랍 조회 2단계: PC 화면 (설계 참고자료/플랍조회_설계안_2026-10-10.md §1 · §7-2) -->
  <section class="study-page" data-testid="flop-study-page">
    <div class="study-toolbar">
      <span>{{
        format(S.precomputedAccuracy, {
          pct: pct((file?.header.targetPct ?? 0.3) / 100),
        })
      }}</span>
      <span>{{ spot.oop }} vs {{ spot.ip }} · {{ R.pot }} {{ bb(spot.startingPot) }}</span>
    </div>

    <div class="study-panel study-top">
      <div class="study-group">
        <h3>{{ R.preflop }}</h3>
        <div class="study-options">
          <button
            v-for="item in potTypes"
            :key="item.id"
            :data-testid="'study-pot-' + item.id"
            :aria-pressed="potType === item.id"
            @click="choosePot(item.id)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
      <div class="study-group">
        <h3>{{ R.opener }}</h3>
        <div class="study-options">
          <button
            v-for="pos in OPENERS"
            :key="pos"
            :data-testid="'study-opener-' + pos"
            :aria-pressed="spot.opener === pos"
            :disabled="!spotFor(pos)"
            @click="chooseSeats(pos, spot.caller)"
          >
            {{ pos }}
          </button>
        </div>
      </div>
      <div class="study-group">
        <h3>{{ potType === "srp" ? R.caller : R.threeBettor }}</h3>
        <div class="study-options">
          <button
            v-for="pos in secondSeats"
            :key="pos"
            :data-testid="'study-caller-' + pos"
            :aria-pressed="spot.caller === pos"
            :disabled="!spotFor(spot.opener, pos)"
            :class="{ 'not-ready': !isReady(spotFor(spot.opener, pos)) }"
            @click="chooseSeats(spot.opener, pos)"
          >
            {{ pos }}
          </button>
        </div>
      </div>
      <div class="study-group study-board">
        <h3>{{ S.board }}</h3>
        <div class="study-board-row">
          <span
            v-for="c in flop"
            :key="c"
            class="study-card"
            :class="suitClass(c)"
            data-testid="study-board-card"
            >{{ card(c) }}</span
          >
          <button
            data-testid="study-pick-board"
            :aria-expanded="picking"
            @click="togglePicker"
          >
            {{ picking ? S.closePicker : S.pickBoard }}
          </button>
          <button data-testid="study-random" @click="chooseRandom">
            {{ S.randomFlop }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="picking" class="study-panel" data-testid="study-picker">
      <h3>{{ format(S.pickPrompt, { count: String(pending.length) }) }}</h3>
      <div class="study-deck">
        <template v-for="s in [3, 2, 1, 0]" :key="s"
          ><button
            v-for="r in RANKS"
            :key="r"
            :data-testid="'study-card-' + (r * 4 + s)"
            :aria-label="card(r * 4 + s)"
            :aria-pressed="pending.includes(r * 4 + s)"
            :class="suitClass(r * 4 + s)"
            @click="pickCard(r * 4 + s)"
          >
            {{ card(r * 4 + s) }}
          </button></template
        >
      </div>
    </div>

    <div
      class="study-panel study-line"
      data-testid="study-line"
      v-if="file && !statusCode"
    >
      <button
        class="study-step-head"
        data-testid="study-line-start"
        :aria-pressed="path.length === 0"
        @click="goTo([])"
      >
        {{ S.start }}
      </button>
      <div
        v-for="(step, i) in line.steps"
        :key="i"
        class="study-step"
        :data-testid="'study-step-' + i"
      >
        <span class="study-step-seat">{{ seat(step.summary.player) }}</span>
        <button
          v-for="(item, a) in step.summary.actions"
          :key="a"
          class="study-step-action"
          :data-testid="'study-step-' + i + '-action-' + a"
          :data-frequency="item.frequency"
          :aria-pressed="step.selected === a"
          @click="goTo([...step.path, a])"
        >
          <i :style="{ background: stepColors[i][a] }" />{{
            actionText(item.action)
          }}
          <b>{{ pct(item.frequency) }}</b>
        </button>
      </div>
    </div>

    <div
      v-if="statusCode || loading"
      class="study-panel study-status"
      role="status"
      data-testid="study-status"
      :data-code="statusCode"
    >
      <template v-if="loading">{{ R.loading }}</template>
      <template v-else
        >{{ statusText
        }}<button
          v-if="statusCode === 'LOAD_FAILED' || statusCode === 'MISSING_FILE'"
          data-testid="study-retry"
          @click="load"
        >
          {{ R.retry }}
        </button></template
      >
    </div>

    <div
      v-else-if="file && !summary"
      class="study-panel study-status"
      data-testid="study-end"
      :data-end="line.end"
    >
      {{ endText }}
    </div>

    <div v-else-if="file" class="study-columns">
      <section class="study-panel study-summary" data-testid="study-summary">
        <template v-if="summary">
          <h2>{{ format(S.actions, { seat: seat(summary.player) }) }}</h2>
          <p class="study-meta">
            {{
              format(S.combos, { count: num(summary.combos, 1) })
            }}
          </p>
          <div
            v-for="(item, a) in summary.actions"
            :key="a"
            class="study-summary-row"
            :data-testid="'study-summary-' + a"
            :data-frequency="item.frequency"
            :data-combos="item.combos"
          >
            <span>{{ actionText(item.action) }}</span>
            <b>{{ pct(item.frequency) }}</b>
            <div class="study-track">
              <i
                :style="{
                  width: 100 * item.frequency + '%',
                  background: colors[a],
                }"
              />
            </div>
            <small>{{ format(S.combos, { count: num(item.combos, 1) }) }}</small>
          </div>
        </template>
      </section>

      <section class="study-panel study-grid-panel">
        <template v-if="summary">
          <h2>{{ format(S.strategyGrid, { seat: seat(summary.player) }) }}</h2>
          <div class="study-grid" data-testid="study-grid">
            <button
              v-for="cell in grid"
              :key="cell.key"
              class="study-cell"
              :class="{ selected: cell.key === selectedKey }"
              :data-testid="'study-cell-' + cell.key"
              :data-reach="cell.reach"
              :data-frequencies="cell.frequencies.join(',')"
              :title="cell.key"
              @click="selectedKey = cell.key"
            >
              <i
                v-if="cell.frequencies.length"
                :style="{
                  height: Math.max(cell.reach, 0.06) * 100 + '%',
                  background: gradient(cell.frequencies),
                }"
              /><span>{{ cell.key }}</span>
            </button>
          </div>
          <p class="study-meta">{{ S.gridHelp }}</p>
        </template>
      </section>

      <section class="study-panel study-detail" data-testid="study-detail">
        <h2>
          {{ S.handDetail
          }}<template v-if="selectedKey && summary"> · {{ selectedKey }}</template>
        </h2>
        <p v-if="!selectedKey || !summary" class="study-meta">
          {{ S.chooseCell }}
        </p>
        <p v-else-if="!reachedCombos.length" class="study-meta">
          {{ S.notInRange }}
        </p>
        <table v-else class="study-combos">
          <thead>
            <tr>
              <th rowspan="2">{{ S.combo }}</th>
              <th rowspan="2">{{ S.frequency }}</th>
              <th :colspan="node!.actions.length" class="study-ev-head">
                {{ S.ev }} (bb)
              </th>
            </tr>
            <tr>
              <th v-for="(action, a) in node!.actions" :key="a">
                {{ actionText(action) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="combo in reachedCombos"
              :key="combo.name"
              :data-testid="'study-combo-' + combo.name"
              :data-weight="combo.weight"
              :data-frequencies="combo.frequencies.join(',')"
            >
              <td class="study-combo-name">
                <span
                  v-for="c in combo.actualHand"
                  :key="c"
                  :class="suitClass(c)"
                  >{{ card(c) }}</span
                >
              </td>
              <td>
                <div class="study-bar" :title="pct(combo.weight)">
                  <i
                    v-for="(f, a) in combo.frequencies"
                    :key="a"
                    :style="{ width: f * 100 + '%', background: colors[a] }"
                  />
                </div>
              </td>
              <td v-for="(ev, a) in combo.evBb" :key="a">
                {{ ev === null ? "—" : num(ev, 2) }}
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, ref, shallowRef } from "vue";
import { i18n, localizeNumber } from "../i18n";
import { flopStudyLabels } from "../flop-study-labels";
import { M } from "../hand-review-labels";
import {
  OPENERS,
  CALLERS,
  THREE_BETTORS,
  SRP_SPOTS,
  THREE_BET_SPOTS,
  FOUR_BET_SPOTS,
  SPOT_UNIT_SCALE,
  SrpSpot,
} from "../preflop-spots";
import { HAND_REVIEW_DATA, loadReviewFlop } from "../hand-review-data";
import { Hmr1File } from "../review/hmr1";
import { canonicalizeFlop } from "../review/flop-canon";
import { parseAction } from "../review/flop-line";
import { ReviewError } from "../review/errors";
import { flopNode } from "../hand-review-model";
import {
  cellCombos,
  lineSummaries,
  parseFlopText,
  randomFlop,
  studyGrid,
} from "../flop-study-model";
import { actionColors } from "../action-colors";

const RANKS = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

export default defineComponent({
  setup() {
    const S = computed(() => flopStudyLabels(i18n.locale));
    const R = computed(() => M[i18n.locale]);

    const potType = ref<"srp" | "3bet" | "4bet">("srp"),
      spotId = ref("srp-btn-bb"),
      flop = ref<number[]>(parseFlopText("Ah7d2c")!),
      path = ref<number[]>([]),
      selectedKey = ref("");
    const file = shallowRef<Hmr1File | null>(null),
      loading = ref(false),
      errorCode = ref("");
    const picking = ref(false),
      pending = ref<number[]>([]);
    let epoch = 0;

    const spots = computed<SrpSpot[]>(() =>
      potType.value === "4bet"
        ? FOUR_BET_SPOTS
        : potType.value === "3bet"
        ? THREE_BET_SPOTS
        : SRP_SPOTS
    );
    const secondSeats = computed<string[]>(() =>
      potType.value === "srp" ? CALLERS : THREE_BETTORS
    );
    const spotFor = (opener: string, caller?: string) =>
      spots.value.find(
        (s) =>
          s.opener === opener && (caller === undefined || s.caller === caller)
      );
    const spot = computed(
      () =>
        [...SRP_SPOTS, ...THREE_BET_SPOTS, ...FOUR_BET_SPOTS].find(
          (s) => s.id === spotId.value
        )!
    );
    const isReady = (s?: SrpSpot) =>
      !!s && HAND_REVIEW_DATA.readyScenarios.includes(s.id);
    const statusCode = computed(() =>
      !isReady(spot.value) ? "SCENARIO_NOT_READY" : errorCode.value
    );
    const statusText = computed(() => {
      const r = R.value;
      switch (statusCode.value) {
        case "SCENARIO_NOT_READY":
          return S.value.notReadyNote;
        case "MISSING_FILE":
          return r.fileMissing;
        case "LOAD_FAILED":
          return r.loadFailed;
        default:
          return r.invalidData;
      }
    });

    const line = computed(() =>
      file.value
        ? lineSummaries(file.value, path.value)
        : { steps: [], end: "decision", terminalReason: null }
    );
    const node = computed(() =>
      file.value ? flopNode(file.value, path.value) : null
    );
    const summary = computed(() => {
      const last = line.value.steps[line.value.steps.length - 1];
      return last && last.path.length === path.value.length
        ? last.summary
        : null;
    });
    const colors = computed(() => actionColors(node.value?.actions ?? []));
    const stepColors = computed(() =>
      line.value.steps.map((step) =>
        actionColors(step.summary.actions.map((a) => a.action))
      )
    );
    const grid = computed(() =>
      node.value && summary.value ? studyGrid(node.value) : []
    );
    const mapping = computed(() => canonicalizeFlop(flop.value));
    const reachedCombos = computed(() =>
      node.value && selectedKey.value
        ? cellCombos(
            node.value,
            selectedKey.value,
            mapping.value.inversePerm
          ).filter((c) => c.weight > 0 && c.frequencies.length)
        : []
    );
    const endText = computed(() =>
      line.value.end === "chance"
        ? S.value.turnNotStored
        : line.value.terminalReason === "fold"
        ? S.value.handOverFold
        : S.value.handOverAllIn
    );

    const potTypes = computed(() => [
      { id: "srp" as const, label: R.value.singleRaised },
      { id: "3bet" as const, label: R.value.threeBet },
      { id: "4bet" as const, label: R.value.fourBet },
    ]);

    const format = (template: string, values: Record<string, string>) =>
      template.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "");
    const num = (value: number, digits: number) =>
      localizeNumber(value.toFixed(digits));
    const pct = (fraction: number) =>
      localizeNumber(`${(fraction * 100).toFixed(1)}%`);
    const bb = (chips: number) =>
      localizeNumber(
        `${(chips / SPOT_UNIT_SCALE).toFixed(2).replace(/\.?0+$/, "")}bb`
      );
    const card = (c: number) => "23456789TJQKA"[c >> 2] + "♣♦♥♠"[c & 3];
    const suitClass = (c: number) =>
      ["clubs", "diamonds", "hearts", "spades"][c & 3];
    const seat = (p: number) => (p === 0 ? spot.value.oop : spot.value.ip);
    const actionText = (raw: string) => {
      const a = parseAction(raw);
      const key = {
        Fold: "fold",
        Check: "check",
        Call: "call",
        Bet: "bet",
        Raise: "raise",
        AllIn: "allin",
      } as const;
      return (
        R.value[key[a.kind]] +
        (a.amount === undefined ? "" : " " + bb(a.amount))
      );
    };
    const gradient = (frequencies: number[]) => {
      let from = 0;
      return `linear-gradient(to right,${frequencies
        .map((f, i) => {
          const to = from + f * 100,
            segment = `${colors.value[i]} ${from}% ${to}%`;
          from = to;
          return segment;
        })
        .join(",")})`;
    };

    async function load() {
      const token = ++epoch;
      file.value = null;
      errorCode.value = "";
      if (!isReady(spot.value)) return;
      loading.value = true;
      try {
        const result = await loadReviewFlop(
          spot.value,
          mapping.value.fileName
        );
        if (token !== epoch) return;
        file.value = result;
      } catch (error) {
        if (token === epoch)
          errorCode.value =
            error instanceof ReviewError ? error.code : "LOAD_FAILED";
      } finally {
        if (token === epoch) loading.value = false;
      }
    }
    function goTo(next: number[]) {
      path.value = next;
    }
    function chooseSpot(id: string) {
      spotId.value = id;
      path.value = [];
      void load();
    }
    // 같은 자리 조합이 없으면 그 오픈의 첫 조합으로 간다 (복기 화면과 같음)
    function chooseSeats(opener: string, caller: string) {
      const next = spotFor(opener, caller) ?? spotFor(opener);
      if (next) chooseSpot(next.id);
    }
    function choosePot(id: "srp" | "3bet" | "4bet") {
      potType.value = id;
      const next =
        spotFor(spot.value.opener, spot.value.caller) ??
        spotFor("BTN", "BB") ??
        spots.value[0];
      chooseSpot(next.id);
    }
    function setFlop(cards: number[]) {
      flop.value = [...cards].sort((a, b) => b - a);
      path.value = [];
      void load();
    }
    function togglePicker() {
      picking.value = !picking.value;
      pending.value = [];
    }
    function pickCard(c: number) {
      const i = pending.value.indexOf(c);
      if (i >= 0) {
        pending.value.splice(i, 1);
        return;
      }
      pending.value.push(c);
      if (pending.value.length === 3) {
        picking.value = false;
        setFlop(pending.value);
        pending.value = [];
      }
    }
    function chooseRandom() {
      picking.value = false;
      pending.value = [];
      setFlop(randomFlop());
    }

    void load();

    return {
      S,
      R,
      RANKS,
      OPENERS,
      potType,
      potTypes,
      secondSeats,
      spot,
      spotFor,
      isReady,
      flop,
      path,
      file,
      loading,
      statusCode,
      statusText,
      line,
      node,
      summary,
      colors,
      stepColors,
      grid,
      selectedKey,
      reachedCombos,
      endText,
      picking,
      pending,
      format,
      num,
      pct,
      bb,
      card,
      suitClass,
      seat,
      actionText,
      gradient,
      load,
      goTo,
      chooseSeats,
      choosePot,
      togglePicker,
      pickCard,
      chooseRandom,
    };
  },
});
</script>

<style scoped>
.study-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  font-size: 12px;
}
.study-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: rgb(var(--c-text-muted));
  font-size: 11px;
  flex: none;
}
button {
  border: 1px solid rgb(var(--c-line));
  border-radius: 6px;
  padding: 6px 9px;
  background: rgb(var(--c-bg-2));
  line-height: 1.3;
  transition: background 0.15s;
}
button:hover {
  background: rgb(var(--c-bg-3));
}
button:focus-visible {
  outline: 2px solid rgb(var(--c-brand));
  outline-offset: 2px;
}
button:disabled {
  opacity: 0.3;
  cursor: default;
}
button[aria-pressed="true"] {
  background: rgb(var(--c-brand));
  border-color: rgb(var(--c-brand));
  color: #171717;
  font-weight: 700;
}
button.not-ready:not([aria-pressed="true"]) {
  opacity: 0.45;
}
.study-panel {
  background: rgb(var(--c-bg-1));
  border: 1px solid rgb(var(--c-line));
  border-radius: 9px;
  padding: 10px 12px;
  min-width: 0;
  flex: none;
}
h2 {
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 8px;
}
h3 {
  font-weight: 600;
  margin: 0 0 6px;
  font-size: 11px;
  color: rgb(var(--c-text-muted));
}
p {
  margin: 0;
}
.study-meta {
  color: rgb(var(--c-text-muted));
  font-size: 10px;
  line-height: 1.5;
}
.study-top {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px 22px;
}
.study-options,
.study-board-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.study-card {
  background: #f0efec;
  border-radius: 4px;
  padding: 4px 5px;
  font-size: 15px;
  font-weight: 700;
  min-width: 28px;
  text-align: center;
}
.clubs {
  color: #287c59;
}
.diamonds {
  color: #4a89d5;
}
.hearts {
  color: #df6266;
}
.spades {
  color: #b9c1cd;
}
.study-card.spades {
  color: #18191c;
}
.study-deck {
  display: grid;
  grid-template-columns: repeat(13, minmax(0, 1fr));
  gap: 3px;
  max-width: 640px;
}
.study-deck button {
  padding: 6px 0;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}
.study-line {
  display: flex;
  align-items: stretch;
  gap: 6px;
  overflow-x: auto;
}
.study-step {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-left: 6px;
  border-left: 1px solid rgb(var(--c-line));
  flex: none;
}
.study-step-seat {
  font-weight: 700;
  font-size: 11px;
}
.study-step-head {
  align-self: flex-start;
  flex: none;
}
.study-step-action {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 7px;
  font-size: 11px;
  text-align: left;
}
.study-step-action i {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex: none;
}
.study-step-action b {
  margin-left: auto;
  padding-left: 6px;
  font-weight: 600;
}
.study-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px;
  color: rgb(var(--c-text-muted));
}
.study-columns {
  display: grid;
  grid-template-columns: minmax(170px, 0.7fr) minmax(360px, 1.6fr) minmax(
      250px,
      1fr
    );
  gap: 10px;
  min-height: 0;
  flex: 1;
}
.study-columns > .study-panel {
  overflow: auto;
}
.study-summary-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 3px 8px;
  margin-top: 10px;
}
.study-summary-row small {
  grid-column: 1 / -1;
  color: rgb(var(--c-text-muted));
  font-size: 10px;
}
.study-track {
  grid-column: 1 / -1;
  height: 8px;
  border-radius: 4px;
  background: rgb(var(--c-bg-3));
  overflow: hidden;
}
.study-track i {
  display: block;
  height: 100%;
}
.study-grid {
  display: grid;
  grid-template-columns: repeat(13, minmax(0, 1fr));
  gap: 1px;
  aspect-ratio: 1;
  width: min(100%, max(300px, calc(100vh - 450px)));
  margin: 0 auto 6px;
}
.study-cell {
  position: relative;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: #24272a;
  min-width: 0;
  overflow: hidden;
}
.study-cell:hover {
  background: #2e3236;
}
.study-cell i {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
}
.study-cell span {
  position: relative;
  font-size: 9px;
  color: #f3f3f3;
  text-shadow: 0 0 2px #000;
}
.study-cell.selected {
  outline: 2px solid rgb(var(--c-brand));
  outline-offset: -2px;
  z-index: 1;
}
.study-combos {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.study-combos th {
  text-align: left;
  white-space: nowrap;
  font-weight: 600;
  color: rgb(var(--c-text-muted));
  font-size: 10px;
  padding: 0 4px 5px;
}
.study-ev-head {
  border-bottom: 1px solid rgb(var(--c-line));
}
.study-combos td {
  padding: 4px;
  border-top: 1px solid rgb(var(--c-line));
  white-space: nowrap;
}
.study-combo-name span {
  font-weight: 700;
  font-size: 12px;
}
.study-bar {
  display: flex;
  width: 70px;
  height: 9px;
  border-radius: 3px;
  overflow: hidden;
  background: rgb(var(--c-bg-3));
}
</style>
