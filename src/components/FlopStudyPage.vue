<template>
  <!-- 플랍 조회 2단계: PC 화면 (설계 참고자료/플랍조회_설계안_2026-10-10.md §1 · §7-2) -->
  <section class="study-page" data-testid="flop-study-page">
    <div class="study-toolbar">
      <span v-if="file">{{
        format(S.precomputedAccuracy, {
          pct: pct(file.header.targetPct / 100),
        })
      }}</span>
      <span>{{ spot.oop }} vs {{ spot.ip }} · {{ R.pot }} {{ bb(spot.startingPot) }}</span>
    </div>

    <!-- 모바일: 상황·보드를 한 줄로 줄이고, 고르는 칸은 아래 시트로 연다 (설계 §1) -->
    <div class="study-panel study-mobile-bar" data-testid="study-mobile-bar">
      <span class="study-mobile-pot">{{ potLabel }}</span>
      <span data-rtl-island="board-cards" dir="ltr" class="study-mobile-cards">
        <span
          v-for="c in flop"
          :key="c"
          class="study-card"
          :class="suitClass(c)"
          >{{ card(c) }}</span
        >
      </span>
      <button data-testid="study-mobile-random" @click="chooseRandom">
        {{ S.randomFlop }}
      </button>
      <button
        data-testid="study-open-setup"
        :aria-expanded="setupOpen"
        @click="setupOpen = true"
      >
        {{ S.changeSetup }}
      </button>
    </div>
    <div
      v-if="setupOpen || selectedKey"
      class="study-backdrop"
      @click="closeSheets"
    />

    <div class="study-setup" :class="{ open: setupOpen }" data-testid="study-setup">
      <div class="study-sheet-head">
        <h2>{{ S.changeSetup }}</h2>
        <button data-testid="study-close-setup" @click="setupOpen = false">
          {{ S.closePicker }}
        </button>
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
              :class="{ 'not-ready': spotFor(pos) && !openerReady(pos) }"
              @click="chooseSeats(pos, spot.caller)"
            >
              {{ pos
              }}<small v-if="spotFor(pos) && !openerReady(pos)" class="study-badge">{{
                S.notReady
              }}</small>
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
              :class="{ 'not-ready': spotFor(spot.opener, pos) && !isReady(spotFor(spot.opener, pos)) }"
              @click="chooseSeats(spot.opener, pos)"
            >
              {{ pos
              }}<small
                v-if="spotFor(spot.opener, pos) && !isReady(spotFor(spot.opener, pos))"
                class="study-badge"
                :data-testid="'study-not-ready-' + pos"
                >{{ S.notReady }}</small
              >
            </button>
          </div>
        </div>
        <div class="study-group study-board">
          <h3>{{ S.board }}</h3>
          <div data-rtl-island="board-cards" dir="ltr" class="study-board-row">
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
        <div data-rtl-island="card-picker" dir="ltr" class="study-deck">
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
    </div>

    <div class="study-note" data-testid="study-sizes">
      <span>{{ format(S.fixedSizes, sizes) }}</span>
      <button data-testid="study-open-solver" @click="openInSolver">
        {{ S.openInSolver }}
      </button>
    </div>

    <div
      data-rtl-island="action-path" dir="ltr" class="study-panel study-line"
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
          <b dir="ltr">{{ pct(item.frequency) }}</b>
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
      <MemberLoginLine
        v-else-if="statusCode === 'MEMBER_ONLY'"
        :return-state="{ spot: spot.id, flop }"
      />
      <template v-else
        >{{ statusText
        }}<button
          v-if="statusCode === 'SCENARIO_NOT_READY'"
          data-testid="study-not-ready-open"
          @click="openInSolver"
        >
          {{ S.openInSolver }}</button
        ><button
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
          <div class="study-tabs">
            <button
              data-testid="study-tab-strategy"
              :aria-pressed="mode === 'strategy'"
              @click="mode = 'strategy'"
            >
              {{ S.strategyTab }}
            </button>
            <button
              data-testid="study-tab-range"
              :aria-pressed="mode === 'range'"
              @click="mode = 'range'"
            >
              {{ S.rangeTab }}
            </button>
          </div>
          <div v-if="mode === 'range'" class="study-tabs">
            <button
              v-for="p in [0, 1]"
              :key="p"
              :data-testid="'study-range-player-' + p"
              :aria-pressed="rangePlayer === p"
              @click="rangePlayer = p"
            >
              {{ p === 0 ? "OOP" : "IP" }} · {{ seat(p) }}
            </button>
          </div>
          <h2>{{ format(S.actions, { seat: seat(summary.player) }) }}</h2>
          <p class="study-meta">
            {{
              format(S.combos, { count: num(summary.combos, 1) })
            }}
          </p>
          <div data-rtl-island="numeric-bar" dir="ltr" class="study-stack" data-testid="study-stack">
            <i
              v-for="(item, a) in summary.actions"
              :key="a"
              :style="{
                width: 100 * item.frequency + '%',
                background: colors[a],
              }"
            />
          </div>
          <button
            v-for="(item, a) in summary.actions"
            :key="a"
            class="study-summary-row"
            :data-testid="'study-summary-' + a"
            :data-frequency="item.frequency"
            :data-combos="item.combos"
            :aria-pressed="filter.includes(a)"
            :disabled="mode === 'range'"
            @click="toggleFilter(a)"
          >
            <span>{{ actionText(item.action) }}</span>
            <b dir="ltr">{{ pct(item.frequency) }}</b>
            <div data-rtl-island="numeric-bar" dir="ltr" class="study-track">
              <i
                :style="{
                  width: 100 * item.frequency + '%',
                  background: colors[a],
                }"
              />
            </div>
            <small>{{ format(S.combos, { count: num(item.combos, 1) }) }}</small>
          </button>
          <p v-if="mode === 'strategy'" class="study-meta study-filter-help">
            {{ S.filterHelp
            }}<button
              v-if="filter.length"
              data-testid="study-clear-filter"
              @click="filter = []"
            >
              {{ S.clearFilter }}
            </button>
          </p>
        </template>
      </section>

      <section class="study-panel study-grid-panel">
        <template v-if="summary">
          <h2>
            {{
              format(mode === "range" ? S.rangeGrid : S.strategyGrid, {
                seat: seat(viewPlayer),
              })
            }}
          </h2>
          <div
            data-rtl-island="range-matrix" dir="ltr" class="study-grid"
            data-testid="study-grid"
            :data-mode="mode"
            :data-player="viewPlayer"
          >
            <button
              v-for="(cell, i) in grid"
              :key="cell.key"
              class="study-cell"
              :class="{ selected: cell.key === selectedKey, dimmed: mask[i] === 0 }"
              :data-testid="'study-cell-' + cell.key"
              :data-reach="cell.reach"
              :data-mask="mask[i]"
              :data-frequencies="cell.frequencies.join(',')"
              :title="cell.key"
              @click="selectedKey = cell.key"
            >
              <i
                v-if="mode === 'range'"
                class="study-range-fill"
                :style="{ opacity: cell.reach }"
              /><i
                v-else-if="cell.frequencies.length"
                :style="{
                  height: Math.max(cell.reach, 0.06) * 100 + '%',
                  background: gradient(filtered(cell.frequencies)),
                }"
              /><span>{{ cell.key }}</span>
            </button>
          </div>
          <p class="study-meta">
            {{ mode === "range" ? S.rangeHelp : S.gridHelp }}
          </p>
        </template>
      </section>

      <section
        class="study-panel study-detail"
        :class="{ open: selectedKey }"
        data-testid="study-detail"
      >
        <div class="study-sheet-head">
          <h2>
            {{ S.handDetail
            }}<template v-if="selectedKey && summary"> · {{ selectedKey }}</template>
          </h2>
          <button data-testid="study-close-detail" @click="selectedKey = ''">
            {{ S.closePicker }}
          </button>
        </div>
        <p v-if="!selectedKey || !summary" class="study-meta">
          {{ mode === "range" ? S.chooseCellRange : S.chooseCell }}
        </p>
        <p v-else-if="!reachedCombos.length" class="study-meta">
          {{ S.notInRange }}
        </p>
        <table v-else-if="mode === 'range'" data-rtl-island="numeric-table" dir="ltr" class="study-combos">
          <thead>
            <tr>
              <th>{{ S.combo }}</th>
              <th>{{ S.weight }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="combo in reachedCombos"
              :key="combo.name"
              :data-testid="'study-combo-' + combo.name"
              :data-weight="combo.weight"
            >
              <td class="study-combo-name">
                <span
                  v-for="c in combo.actualHand"
                  :key="c"
                  :class="suitClass(c)"
                  >{{ card(c) }}</span
                >
              </td>
              <td>{{ pct(combo.weight) }}</td>
            </tr>
          </tbody>
        </table>
        <table v-else data-rtl-island="numeric-table" dir="ltr" class="study-combos">
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
import { computed, defineComponent, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { i18n, localizeNumber } from "../i18n";
import { useStore, useConfigStore } from "../store";
import { flopStudyLabels } from "../flop-study-labels";
import { M } from "../hand-review-labels";
import {
  OPENERS,
  CALLERS,
  THREE_BETTORS,
  SRP_SPOTS,
  THREE_BET_SPOTS,
  FOUR_BET_SPOTS,
  SPOT_BET_SIZES,
  SPOT_UNIT_SCALE,
  SrpSpot,
} from "../preflop-spots";
import { HAND_REVIEW_DATA, loadReviewFlop } from "../hand-review-data";
import { Hmr1File } from "../review/hmr1";
import { canonicalizeFlop } from "../review/flop-canon";
import { parseAction } from "../review/flop-line";
import { ReviewError } from "../review/errors";
import MemberLoginLine from "./MemberLoginLine.vue";
import { onLoginReturnState } from "../account";
import { flopNode } from "../hand-review-model";
import {
  actionFilterMask,
  cellCombos,
  flopStudyEntry,
  lineSummaries,
  parseFlopText,
  randomFlop,
  studyGrid,
  validLinePrefix,
} from "../flop-study-model";
import { actionColors } from "../action-colors";

const RANKS = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
const ALL_SPOTS = [...SRP_SPOTS, ...THREE_BET_SPOTS, ...FOUR_BET_SPOTS];
const BET_FIELDS = (["oop", "ip"] as const).flatMap((p) =>
  (["Flop", "Turn", "River"] as const).flatMap((street) =>
    (["Bet", "Raise"] as const).map((kind) => `${p}${street}${kind}` as const)
  )
);

export default defineComponent({
  components: { MemberLoginLine },
  setup() {
    const S = computed(() => flopStudyLabels(i18n.locale));
    const R = computed(() => M[i18n.locale]);

    const store = useStore();
    const config = useConfigStore();

    // 딥링크(?view=flop-study&spot=&flop=&line=)는 App.vue가 주소를 지우기 전에 읽어 둔 것을 한 번만 쓴다
    const entry = flopStudyEntry.link;
    flopStudyEntry.link = null;
    const entrySpot = ALL_SPOTS.find((s) => s.id === entry?.spot);
    let pendingLine = entrySpot && entry?.line.length ? entry.line : null;

    const potType = ref<"srp" | "3bet" | "4bet">(
        !entrySpot || SRP_SPOTS.includes(entrySpot)
          ? "srp"
          : THREE_BET_SPOTS.includes(entrySpot)
          ? "3bet"
          : "4bet"
      ),
      spotId = ref(entrySpot?.id ?? "srp-btn-bb"),
      flop = ref<number[]>(entry?.flop ?? parseFlopText("Ah7d2c")!),
      path = ref<number[]>([]),
      selectedKey = ref(""),
      mode = ref<"strategy" | "range">("strategy"),
      rangePlayer = ref<0 | 1>(0),
      filter = ref<number[]>([]);
    const file = shallowRef<Hmr1File | null>(null),
      loading = ref(false),
      errorCode = ref("");
    const picking = ref(false),
      pending = ref<number[]>([]),
      setupOpen = ref(false);
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
      () => ALL_SPOTS.find((s) => s.id === spotId.value)!
    );
    const isReady = (s?: SrpSpot) =>
      !!s && HAND_REVIEW_DATA.readyScenarios.includes(s.id);
    const openerReady = (opener: string) =>
      spots.value.some((s) => s.opener === opener && isReady(s));
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
    // 전략 탭 = 행동 플레이어 · 레인지 탭 = [OOP|IP]로 고른 쪽
    const viewPlayer = computed<0 | 1>(() =>
      mode.value === "range" ? rangePlayer.value : summary.value?.player ?? 0
    );
    const grid = computed(() =>
      node.value && summary.value ? studyGrid(node.value, viewPlayer.value) : []
    );
    const mask = computed(() =>
      mode.value === "range"
        ? grid.value.map(() => 1)
        : actionFilterMask(grid.value, filter.value)
    );
    const mapping = computed(() => canonicalizeFlop(flop.value));
    const reachedCombos = computed(() =>
      node.value && selectedKey.value
        ? cellCombos(
            node.value,
            selectedKey.value,
            mapping.value.inversePerm,
            viewPlayer.value
          ).filter(
            (c) =>
              c.weight > 0 && (mode.value === "range" || c.frequencies.length)
          )
        : []
    );
    // 노드가 바뀌면 액션 번호가 달라지므로 필터를 비운다
    watch(path, () => (filter.value = []));
    const toggleFilter = (a: number) => {
      filter.value = filter.value.includes(a)
        ? filter.value.filter((x) => x !== a)
        : [...filter.value, a].sort((x, y) => x - y);
    };
    const filtered = (frequencies: number[]) =>
      filter.value.length
        ? frequencies.map((f, a) => (filter.value.includes(a) ? f : 0))
        : frequencies;

    // 고정 벳 크기 안내 — 숫자는 받은 파일 헤더가 정본, 파일이 없으면 앱 상수
    const sizes = computed(() => {
      const h = file.value?.header,
        list = (text: string) =>
          text
            .split(",")
            .map((s) => localizeNumber(s.trim().replace(/%?$/, "%")))
            .join(" · ");
      return {
        flop: list(h?.flopBet ?? SPOT_BET_SIZES.flopBet),
        raise: list(h?.raise ?? SPOT_BET_SIZES.raise),
      };
    });

    // [솔버로 열기] — SpotPicker.apply와 같은 길 + 보드(실제 무늬) + 미리 계산과 같은 벳 크기
    const spotBetSize = (field: typeof BET_FIELDS[number]) =>
      field.endsWith("Raise")
        ? SPOT_BET_SIZES.raise
        : field.includes("Flop")
        ? SPOT_BET_SIZES.flopBet
        : SPOT_BET_SIZES.laterBet;
    function openInSolver() {
      // 레인지·보드가 비어 있어도 팟·스택·벳 크기·동크·트리 편집을 바꿨으면 묻는다
      // (S-076 코드 소견 · MA-469 통지 · 20·100 = store.ts 기본값, 벳 크기 기본값 = spotBetSize)
      const filled =
        config.range[0].some(Boolean) ||
        config.range[1].some(Boolean) ||
        config.board.length > 0 ||
        config.startingPot !== 20 ||
        config.effectiveStack !== 100 ||
        config.addedLines !== "" ||
        config.removedLines !== "" ||
        config.donkOption ||
        config.oopTurnDonk !== "" ||
        config.oopRiverDonk !== "" ||
        BET_FIELDS.some((field) => config[field] !== spotBetSize(field));
      if (filled && !window.confirm(S.value.confirmOverwrite)) return;
      const s = spot.value;
      config.board = [...flop.value];
      config.startingPot = s.startingPot;
      config.effectiveStack = s.effectiveStack;
      store.displayUnitScale = SPOT_UNIT_SCALE;
      config.expectedBoardLength = 0;
      config.addedLines = "";
      config.removedLines = "";
      config.donkOption = false;
      config.oopTurnDonk = "";
      config.oopRiverDonk = "";
      for (const field of BET_FIELDS) config[field] = spotBetSize(field);
      store.pendingRangeText = [s.oopRange, s.ipRange];
      store.sideView = "tree-config";
    }
    const endText = computed(() =>
      line.value.end === "chance"
        ? S.value.turnNotStored
        : line.value.terminalReason === "fold"
        ? S.value.handOverFold
        : S.value.handOverAllIn
    );

    // 모바일 시트(상황·보드 / 핸드 상세)를 바깥을 눌러 닫는다
    const closeSheets = () => {
      setupOpen.value = false;
      selectedKey.value = "";
    };

    const potTypes = computed(() => [
      { id: "srp" as const, label: R.value.singleRaised },
      { id: "3bet" as const, label: R.value.threeBet },
      { id: "4bet" as const, label: R.value.fourBet },
    ]);
    const potLabel = computed(
      () =>
        `${potTypes.value.find((p) => p.id === potType.value)!.label} · ${
          spot.value.opener
        } → ${spot.value.caller}`
    );

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
        // 필터로 뺀 액션 몫은 비워 둔다 (안 그러면 마지막 색이 끝까지 번진다)
        .concat(from < 99.95 ? [`transparent ${from}% 100%`] : [])
        .join(",")})`;
    };

    async function load() {
      const token = ++epoch;
      file.value = null;
      errorCode.value = "";
      // 앞 요청의 finally는 epoch가 바뀌어 loading을 못 끈다 — 미준비로 일찍 끝나도 꺼진 채로 시작(Q2-05)
      loading.value = false;
      if (!isReady(spot.value)) return;
      loading.value = true;
      try {
        const result = await loadReviewFlop(
          spot.value,
          mapping.value.fileName
        );
        if (token !== epoch) return;
        if (pendingLine) path.value = validLinePrefix(result, pendingLine);
        pendingLine = null;
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
      pendingLine = null;
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
      pendingLine = null;
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

    // 회원 상황 한 줄에서 로그인하고 돌아왔으면 그때의 상황·플랍으로 다시 연다
    const stopReturn = onLoginReturnState("flop-study", (state) => {
      const r = state as { spot?: unknown; flop?: unknown } | null;
      const back = ALL_SPOTS.find((s) => s.id === r?.spot);
      const cards = r?.flop;
      if (
        !back ||
        !Array.isArray(cards) ||
        cards.length !== 3 ||
        !cards.every((c) => Number.isInteger(c) && c >= 0 && c < 52) ||
        new Set(cards).size !== 3
      )
        return;
      potType.value = SRP_SPOTS.includes(back)
        ? "srp"
        : THREE_BET_SPOTS.includes(back)
        ? "3bet"
        : "4bet";
      spotId.value = back.id;
      setFlop(cards as number[]);
    });
    onBeforeUnmount(stopReturn);

    return {
      S,
      R,
      RANKS,
      OPENERS,
      potType,
      potTypes,
      potLabel,
      setupOpen,
      closeSheets,
      secondSeats,
      spot,
      spotFor,
      isReady,
      openerReady,
      mode,
      rangePlayer,
      viewPlayer,
      filter,
      mask,
      toggleFilter,
      filtered,
      sizes,
      openInSolver,
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
.study-mobile-cards { display: contents; }
:global(html[dir="rtl"] .study-mobile-bar .study-mobile-cards){ display: flex; gap: 4px; }
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
.study-note {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 10px;
  color: rgb(var(--c-text-muted));
  font-size: 11px;
  flex: none;
}
.study-note button {
  padding: 3px 8px;
  font-size: 11px;
}
.study-badge {
  margin-inline-start: 5px;
  padding: 0 4px;
  border-radius: 3px;
  background: rgb(var(--c-bg-3));
  font-size: 9px;
  font-weight: 600;
  vertical-align: 1px;
}
.study-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}
.study-tabs button {
  flex: 1;
  padding: 4px 6px;
  font-size: 11px;
}
.study-summary-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 3px 8px;
  margin-top: 6px;
  width: 100%;
  text-align: start;
  font-size: 12px;
}
.study-summary-row[aria-pressed="true"] {
  background: rgb(var(--c-bg-3));
  border-color: rgb(var(--c-brand));
  color: inherit;
}
.study-summary-row:disabled {
  opacity: 1;
}
.study-filter-help {
  margin-top: 8px;
}
.study-filter-help button {
  margin-inline-start: 6px;
  padding: 2px 6px;
  font-size: 10px;
}
.study-range-fill {
  top: 0;
  background: rgb(var(--c-brand));
}
.study-cell.dimmed span {
  opacity: 0.35;
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
/* PC에서는 모바일 전용 부품을 숨기고, 상황·보드 묶음은 원래 자리에 그대로 둔다 */
.study-mobile-bar,
.study-backdrop,
.study-stack,
.study-setup > .study-sheet-head,
.study-sheet-head button {
  display: none;
}
.study-setup {
  display: contents;
}
.study-sheet-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
@media (max-width: 767px) {
  .study-page {
    height: auto;
    gap: 6px;
  }
  .study-toolbar {
    font-size: 10px;
  }
  .study-mobile-bar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 8px;
  }
  .study-mobile-pot {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
    font-size: 11px;
  }
  .study-mobile-bar .study-card {
    font-size: 12px;
    min-width: 24px;
    padding: 3px 4px;
  }
  .study-mobile-bar button,
  .study-sheet-head button {
    display: block;
    padding: 5px 7px;
    min-height: 30px;
    font-size: 11px;
    flex: none;
  }
  .study-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgb(0 0 0 / 0.45);
  }
  /* 아래 시트: 상황·보드 고르기 / 핸드 상세 */
  .study-setup,
  .study-detail {
    display: none;
  }
  .study-setup.open,
  .study-columns > .study-detail.open {
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 50;
    max-height: 80vh;
    overflow-y: auto;
    padding: 12px 12px calc(12px + env(safe-area-inset-bottom));
    background: rgb(var(--c-bg-1));
    border: 1px solid rgb(var(--c-line));
    border-bottom: 0;
    border-radius: 12px 12px 0 0;
  }
  .study-columns > .study-detail.open {
    display: block;
    max-height: 55vh;
  }
  .study-setup > .study-sheet-head {
    display: flex;
  }
  .study-sheet-head h2 {
    margin: 0;
  }
  .study-detail .study-sheet-head {
    margin-bottom: 6px;
  }
  .study-setup .study-panel {
    border: 0;
    padding: 0;
  }
  .study-top {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .study-options button {
    min-height: 32px;
  }
  .study-deck button {
    min-height: 32px;
  }
  .study-line {
    padding: 8px;
  }
  /* 세 칸 → 위에서 아래로: 액션 요약 · 13×13 */
  .study-columns {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: none;
  }
  .study-columns > .study-panel {
    overflow: visible;
    padding: 8px;
  }
  .study-summary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }
  .study-summary > :not(.study-summary-row) {
    flex-basis: 100%;
    margin: 0;
  }
  .study-summary h2 {
    display: none;
  }
  .study-stack {
    display: flex;
    height: 10px;
    border-radius: 4px;
    overflow: hidden;
    background: rgb(var(--c-bg-3));
  }
  .study-summary-row {
    display: flex;
    gap: 6px;
    width: auto;
    margin: 0;
    padding: 4px 8px;
    font-size: 11px;
    min-height: 30px;
    align-items: center;
  }
  .study-summary-row .study-track,
  .study-summary-row small {
    display: none;
  }
  .study-grid {
    width: 100%;
  }
  .study-cell span {
    font-size: 8px;
  }
}
</style>
