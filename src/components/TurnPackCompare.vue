<template>
  <!-- 턴 카드 비교 (설계 참고자료/턴팩_설계안_2026-10-21.md §3-2·§3-3·§6) — 플랍 조회의 준비된 경로 찬스 노드 자리 -->
  <section class="tp" data-testid="turn-compare">
    <div class="tp-head">
      <h2>{{ T.title }}</h2>
      <p class="tp-meta" data-testid="turn-scope">
        {{ format(T.scope, { seat: oop }) }} · {{ T.flopLine.replace("{line}", "") }}<bdi :dir="rtl ? 'rtl' : 'ltr'">{{ lineText }}</bdi>
      </p>
      <p class="tp-meta">
        {{ format(T.turnStart, { pot: bb(cmp.potBb), stack: bb(cmp.stackBb) }) }}
      </p>
    </div>

    <div class="tp-controls">
      <div class="tp-control">
        <span>{{ T.metric }}</span>
        <button data-testid="turn-metric-strategy" :aria-pressed="ui.metric === 'strategy'" @click="ui.metric = 'strategy'">
          {{ T.metricStrategy }}
        </button>
        <button data-testid="turn-metric-ev" :aria-pressed="ui.metric === 'ev'" @click="ui.metric = 'ev'">
          {{ T.metricEv }}
        </button>
      </div>
      <div v-if="ui.metric === 'ev'" class="tp-control">
        <span>{{ T.evSeat }}</span>
        <button
          v-for="p in [0, 1]"
          :key="p"
          :data-testid="'turn-ev-seat-' + p"
          :aria-pressed="ui.evSeat === p"
          @click="ui.evSeat = p"
        >
          {{ p === 0 ? oop : ip }}
        </button>
      </div>
      <div class="tp-control">
        <span>{{ T.layout }}</span>
        <button data-testid="turn-layout-cards" :aria-pressed="ui.layout === 'cards'" @click="ui.layout = 'cards'">
          {{ T.layoutCards }}
        </button>
        <button data-testid="turn-layout-table" :aria-pressed="ui.layout === 'table'" @click="ui.layout = 'table'">
          {{ T.layoutTable }}
        </button>
      </div>
      <div class="tp-control">
        <span>{{ T.group }}</span>
        <button data-testid="turn-group-none" :aria-pressed="ui.group === 'none'" @click="ui.group = 'none'">
          {{ T.groupNone }}
        </button>
        <button data-testid="turn-group-rank" :aria-pressed="ui.group === 'rank'" @click="ui.group = 'rank'">
          {{ T.groupRank }}
        </button>
      </div>
    </div>

    <div v-if="cmp.average" class="tp-average" data-testid="turn-average">
      <b>{{ T.average }}</b>
      <div data-rtl-island="numeric-bar" dir="ltr" class="tp-bar tp-bar-wide">
        <i
          v-for="(f, a) in cmp.average.frequencies"
          :key="a"
          :style="{ width: f * 100 + '%', background: colors[a] }"
        />
      </div>
      <span v-for="(f, a) in cmp.average.frequencies" :key="a" class="tp-average-item">
        <i :style="{ background: colors[a] }" />{{ actionText(cmp.actions[a]) }}
        <b dir="ltr">{{ pct(f, 1) }}</b>
      </span>
      <span class="tp-average-item">
        {{ format(T.evOf, { seat: oop }) }} <b dir="ltr">{{ evText(cmp.average.oopEv) }}</b>
      </span>
      <span class="tp-average-item">
        {{ format(T.evOf, { seat: ip }) }} <b dir="ltr">{{ evText(cmp.average.ipEv) }}</b>
      </span>
    </div>
    <p v-else class="tp-meta" data-testid="turn-average-hidden">{{ T.averageHidden }}</p>

    <!-- 카드 보기: PC = 무늬 4행 × 랭크 13열 · 폰 = 랭크 13행 × 무늬 4열(같은 자료 · 같은 순서) -->
    <template v-if="ui.layout === 'cards'">
      <div
        v-for="shape in ['wide', 'tall']"
        :key="shape"
        data-rtl-island="turn-grid"
        dir="ltr"
        class="tp-grid"
        :class="'tp-grid-' + shape + (ui.group === 'rank' ? ' tp-grid-ranks' : '')"
        :data-testid="'turn-grid-' + shape"
      >
        <template v-if="ui.group === 'none'">
          <span class="tp-corner" />
          <span v-for="h in grids[shape].head" :key="'h' + h.label" class="tp-axis" :class="h.cls">
            {{ h.label }}
          </span>
          <template v-for="row in grids[shape].rows" :key="'r' + row.label">
            <span class="tp-axis" :class="row.cls">{{ row.label }}</span>
            <button
              v-for="cell in row.cells"
              :key="cell.card"
              class="tp-cell"
              v-bind="cellAttrs(cell.card)"
              @click="choose(cell.card, $event)"
            >
              <span class="tp-cell-name" :class="SUIT_CLASS[cell.card & 3]">{{ cardText(cell.card) }}</span>
              <span v-if="!cell.frequencies" class="tp-cell-status">{{ cell.statusText }}</span>
              <b v-else-if="cell.ev" class="tp-cell-value" :class="diffClass(cell.diff)">{{ cell.value }}</b>
              <span v-else class="tp-bar"><i v-for="(f, a) in cell.frequencies" :key="a" :style="{ width: f * 100 + '%', background: colors[a] }" /></span>
              <small v-if="cell.marks" class="tp-cell-marks">{{ cell.marks }}</small>
            </button>
          </template>
        </template>
        <template v-else>
          <button
            v-for="g in rankCells"
            :key="g.rank"
            class="tp-cell"
            :data-testid="'turn-rank-' + RANK_TEXT[g.rank]"
            :aria-pressed="ui.selectedRank === g.rank"
            @click="chooseRank(g.rank, $event)"
          >
            <span class="tp-cell-name">{{ RANK_TEXT[g.rank] }}</span>
            <span v-if="!g.frequencies" class="tp-cell-status">{{ g.statusText }}</span>
            <b v-else-if="g.ev" class="tp-cell-value" :class="diffClass(g.diff)">{{ g.value }}</b>
            <span v-else class="tp-bar"><i v-for="(f, a) in g.frequencies" :key="a" :style="{ width: f * 100 + '%', background: colors[a] }" /></span>
          </button>
        </template>
      </div>
    </template>

    <div v-else class="tp-table-wrap">
      <table data-rtl-island="numeric-table" dir="ltr" class="tp-table" data-testid="turn-table">
        <thead>
          <tr>
            <th><button class="tp-sort" @click="sortBy('card')">{{ T.card }}{{ arrow("card") }}</button></th>
            <th v-for="(action, a) in cmp.actions" :key="a" class="tp-col-action">
              <button class="tp-sort" @click="sortBy('a' + a)">{{ actionText(action) }}{{ arrow("a" + a) }}</button>
            </th>
            <th class="tp-col-mobile">{{ ui.metric === "ev" ? format(T.evOf, { seat: evSeatName }) : T.metricStrategy }}</th>
            <th class="tp-col-ev">
              <button class="tp-sort" @click="sortBy('oop')">{{ format(T.evOf, { seat: oop }) }}{{ arrow("oop") }}</button>
            </th>
            <th class="tp-col-ev">
              <button class="tp-sort" @click="sortBy('ip')">{{ format(T.evOf, { seat: ip }) }}{{ arrow("ip") }}</button>
            </th>
            <th v-if="cmp.complete" class="tp-col-ev">
              <button class="tp-sort" @click="sortBy('diff')">{{ T.diffCol }} ({{ evSeatName }}){{ arrow("diff") }}</button>
            </th>
            <th v-if="cmp.complete" class="tp-col-ev">
              <button class="tp-sort" @click="sortBy('prob')">{{ T.probability }}{{ arrow("prob") }}</button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cmp.average" class="tp-average-row">
            <td>{{ T.average }}</td>
            <td v-for="(f, a) in cmp.average.frequencies" :key="a" class="tp-col-action">{{ pct(f, 1) }}</td>
            <td class="tp-col-mobile">
              <span v-if="ui.metric === 'ev'">{{ evText(seatEv(cmp.average)) }}</span>
              <span v-else class="tp-bar"><i v-for="(f, a) in cmp.average.frequencies" :key="a" :style="{ width: f * 100 + '%', background: colors[a] }" /></span>
            </td>
            <td class="tp-col-ev">{{ evText(cmp.average.oopEv) }}</td>
            <td class="tp-col-ev">{{ evText(cmp.average.ipEv) }}</td>
            <td v-if="cmp.complete" class="tp-col-ev">—</td>
            <td v-if="cmp.complete" class="tp-col-ev">{{ pct(1, 0) }}</td>
          </tr>
          <tr
            v-for="row in tableRows"
            :key="row.key"
            :data-testid="'turn-row-' + row.key"
            :aria-selected="row.selected"
            class="tp-row"
            @click="row.card === null ? chooseRank(row.rank, $event) : choose(row.card, $event)"
          >
            <td>
              <span :class="row.card === null ? '' : SUIT_CLASS[row.card & 3]" class="tp-cell-name">{{ row.label }}</span>
            </td>
            <template v-if="row.frequencies">
              <td v-for="(f, a) in row.frequencies" :key="a" class="tp-col-action">{{ pct(f, 1) }}</td>
            </template>
            <td v-else class="tp-col-action" :colspan="cmp.actions.length">{{ row.statusText }}</td>
            <td class="tp-col-mobile">
              <template v-if="!row.frequencies">{{ row.statusText }}</template>
              <span v-else-if="ui.metric === 'ev'" :class="diffClass(row.diff)">{{ evText(row.seatEv) }}</span>
              <span v-else class="tp-bar"><i v-for="(f, a) in row.frequencies" :key="a" :style="{ width: f * 100 + '%', background: colors[a] }" /></span>
            </td>
            <td class="tp-col-ev">{{ evText(row.oopEv) }}</td>
            <td class="tp-col-ev">{{ evText(row.ipEv) }}</td>
            <td v-if="cmp.complete" class="tp-col-ev" :class="diffClass(row.diff)">{{ diffText(row.diff) }}</td>
            <td v-if="cmp.complete" class="tp-col-ev">{{ row.probability === null ? "—" : pct(row.probability, 2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="tp-meta">{{ T.averageNote }} · {{ T.legend }}</p>

    <!-- 고른 카드: PC는 아래에 · 폰은 별도 시트(손패 선택 시트와 분리) -->
    <div v-if="picked" class="tp-backdrop" @click="close" />
    <section
      class="tp-picked"
      :class="{ open: !!picked }"
      data-testid="turn-picked"
      :aria-label="T.title"
    >
      <p v-if="!picked" class="tp-meta">{{ T.chooseCard }}</p>
      <template v-else>
        <div class="tp-picked-head">
          <h3>
            <span :class="picked.card === null ? '' : SUIT_CLASS[picked.card & 3]" class="tp-picked-card" dir="ltr">{{ picked.label }}</span>
          </h3>
          <button ref="closeButton" class="tp-close" data-testid="turn-picked-close" @click="close">{{ closeLabel }}</button>
        </div>
        <p v-if="!picked.frequencies" class="tp-meta" data-testid="turn-picked-status">{{ picked.statusText }}</p>
        <template v-else>
          <div data-rtl-island="numeric-bar" dir="ltr" class="tp-bar tp-bar-wide">
            <i v-for="(f, a) in picked.frequencies" :key="a" :style="{ width: f * 100 + '%', background: colors[a] }" />
          </div>
          <p class="tp-picked-line">
            <span v-for="(f, a) in picked.frequencies" :key="a" class="tp-average-item">
              <i :style="{ background: colors[a] }" />{{ actionText(cmp.actions[a]) }} <b dir="ltr">{{ pct(f, 1) }}</b>
            </span>
          </p>
          <p class="tp-picked-line">
            <span class="tp-average-item">{{ format(T.evOf, { seat: oop }) }} <b dir="ltr">{{ evText(picked.oopEv) }}</b></span>
            <span class="tp-average-item">{{ format(T.evOf, { seat: ip }) }} <b dir="ltr">{{ evText(picked.ipEv) }}</b></span>
          </p>
          <p v-if="picked.diff !== null" class="tp-picked-line" data-testid="turn-picked-diff">
            {{ format(T.vsAverage, { seat: evSeatName, diff: "" }) }}<b dir="ltr" :class="diffClass(picked.diff)">{{ diffText(picked.diff) }}</b>
          </p>
          <p v-if="picked.probability !== null" class="tp-meta">
            {{ T.probability }} <span dir="ltr">{{ pct(picked.probability, 2) }}</span>
          </p>
          <p v-if="picked.exploitPct !== null" class="tp-meta">
            {{ format(T.turnAccuracy, { pct: pct(picked.exploitPct / 100, 2) }) }}
          </p>
          <div v-if="picked.card !== null" class="tp-picked-actions">
            <button data-testid="turn-open-strategy" @click="$emit('open', picked.card)">{{ T.viewStrategy }}</button>
            <!-- 연습 = 이 턴의 첫 결정 한 곳(판정 §6-4) -->
            <button
              data-testid="turn-practice"
              :disabled="practiceBusy"
              :aria-busy="practiceBusy"
              @click="$emit('practice', picked.card)"
            >{{ practiceBusy ? busyLabel : T.practice }}</button>
          </div>
          <p v-if="practiceError" role="alert" class="tp-meta" data-testid="turn-practice-error">{{ practiceError }}</p>
        </template>
      </template>
    </section>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, PropType, ref } from "vue";
import { i18n, localizeNumber } from "../i18n";
import { turnPackLabels } from "../turn-pack-labels";
import type { TurnAverage, TurnCardRow, TurnComparison, TurnCompareUi } from "../turn-pack-model";

const RANK_TEXT = "23456789TJQKA";
const SUIT_TEXT = ["♣", "♦", "♥", "♠"];
const SUIT_CLASS = ["clubs", "diamonds", "hearts", "spades"];
const RANK_ORDER = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
const SUIT_ORDER = [3, 2, 1, 0];

/** 칸 하나에 그릴 것(카드·랭크 공통). */
type Cell = {
  kind: "board" | "row";
  frequencies: number[] | null;
  /** 지표 값 문자열(EV 모드) */
  value: string;
  diff: number | null;
  statusText: string;
  marks: string;
  ev: boolean;
};

export default defineComponent({
  props: {
    cmp: { type: Object as PropType<TurnComparison>, required: true },
    ui: { type: Object as PropType<TurnCompareUi>, required: true },
    oop: { type: String, required: true },
    ip: { type: String, required: true },
    flop: { type: Array as PropType<number[]>, required: true },
    lineText: { type: String, required: true },
    colors: { type: Array as PropType<string[]>, required: true },
    actionText: { type: Function as PropType<(raw: string) => string>, required: true },
    closeLabel: { type: String, required: true },
    practiceBusy: { type: Boolean, default: false },
    busyLabel: { type: String, default: "" },
    /** 연습 묶음을 못 만들었을 때의 문구(없으면 ""). */
    practiceError: { type: String, default: "" },
  },
  emits: ["open", "practice"],
  setup(props) {
    const T = computed(() => turnPackLabels(i18n.locale));
    const format = (template: string, values: Record<string, string>) =>
      template.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "");
    const pct = (fraction: number, digits: number) =>
      localizeNumber(`${(fraction * 100).toFixed(digits)}%`);
    const bb = (value: number) => localizeNumber(`${value.toFixed(2).replace(/\.?0+$/, "")}bb`);
    const evText = (value: number | null) => (value === null ? "—" : localizeNumber(`${value.toFixed(2)}bb`));
    // 표시 자릿수(0.01bb)에서 0이면 중립(판정 지적 13)
    const roundedDiff = (d: number | null) => (d === null ? null : Math.round(d * 100) / 100);
    const diffText = (d: number | null) => {
      const r = roundedDiff(d);
      if (r === null) return "—";
      return localizeNumber(`${r > 0 ? "+" : r < 0 ? "−" : "±"}${Math.abs(r).toFixed(2)}bb`);
    };
    const diffClass = (d: number | null) => {
      const r = roundedDiff(d);
      return r === null || r === 0 ? "" : r > 0 ? "up" : "down";
    };
    const cardText = (c: number) => RANK_TEXT[c >> 2] + SUIT_TEXT[c & 3];
    const evSeatName = computed(() => (props.ui.evSeat === 0 ? props.oop : props.ip));
    const seatEv = (x: { oopEv: number | null; ipEv: number | null }) =>
      props.ui.evSeat === 0 ? x.oopEv : x.ipEv;
    const averageEv = computed(() => (props.cmp.average ? seatEv(props.cmp.average) : null));
    const diffOf = (x: { oopEv: number | null; ipEv: number | null }) => {
      const v = seatEv(x), avg = averageEv.value;
      return v === null || avg === null ? null : v - avg;
    };
    const statusText = (row: TurnCardRow) =>
      row.status === "impossible" ? "—" : row.status === "unconverged" ? T.value.unconverged : T.value.missing;
    const statusLong = (row: TurnCardRow) =>
      row.status === "impossible" ? T.value.impossible : statusText(row);

    const rowsByCard = computed(() => new Map(props.cmp.rows.map((r) => [r.card, r])));
    const marksOf = (row: TurnCardRow) =>
      [row.pairsBoard ? T.value.markPair : "", row.suitCount >= 3 ? `${SUIT_TEXT[row.card & 3]}${row.suitCount}` : ""]
        .filter(Boolean)
        .join(" ");
    const cellOf = (frequencies: number[] | null, x: { oopEv: number | null; ipEv: number | null }, status: string, marks: string, kind: Cell["kind"]): Cell => ({
      kind,
      frequencies,
      value: evText(seatEv(x)),
      diff: diffOf(x) === null ? null : roundedDiff(diffOf(x)),
      statusText: status,
      marks,
      ev: props.ui.metric === "ev",
    });
    const cells = computed(() => {
      const out: Cell[] = [];
      for (let c = 0; c < 52; c++) {
        const row = rowsByCard.value.get(c);
        out.push(
          row
            ? cellOf(row.status === "ok" ? row.frequencies : null, row, statusText(row), marksOf(row), "row")
            : cellOf(null, { oopEv: null, ipEv: null }, T.value.board, "", "board")
        );
      }
      return out;
    });
    // PC = 무늬 행 × 랭크 열 · 폰 = 랭크 행 × 무늬 열
    const grids = computed(() => {
      const at = (card: number) => ({ card, ...cells.value[card] });
      return {
        wide: {
          head: RANK_ORDER.map((r) => ({ label: RANK_TEXT[r], cls: "" })),
          rows: SUIT_ORDER.map((s) => ({ label: SUIT_TEXT[s], cls: SUIT_CLASS[s], cells: RANK_ORDER.map((r) => at(r * 4 + s)) })),
        },
        tall: {
          head: SUIT_ORDER.map((s) => ({ label: SUIT_TEXT[s], cls: SUIT_CLASS[s] })),
          rows: RANK_ORDER.map((r) => ({ label: RANK_TEXT[r], cls: "", cells: SUIT_ORDER.map((s) => at(r * 4 + s)) })),
        },
      } as Record<string, { head: { label: string; cls: string }[]; rows: { label: string; cls: string; cells: (Cell & { card: number })[] }[] }>;
    });
    const rankCells = computed(() =>
      props.cmp.ranks.map((g) => ({
        rank: g.rank,
        ...cellOf(g.average?.frequencies ?? null, g.average ?? { oopEv: null, ipEv: null }, g.average ? "" : "—", "", "row"),
      }))
    );
    const cellAttrs = (c: number) => {
      const row = rowsByCard.value.get(c);
      return {
        "data-testid": "turn-card-" + c,
        "data-status": row ? row.status : "board",
        "aria-pressed": props.ui.selected === c,
        "aria-label": cardText(c),
        disabled: !row,
        class: { board: !row, off: row && row.status !== "ok" },
      };
    };

    type TableRow = {
      key: string;
      card: number | null;
      rank: number;
      label: string;
      frequencies: number[] | null;
      oopEv: number | null;
      ipEv: number | null;
      seatEv: number | null;
      diff: number | null;
      probability: number | null;
      statusText: string;
      selected: boolean;
    };
    const tableRows = computed<TableRow[]>(() => {
      const rows: TableRow[] =
        props.ui.group === "rank"
          ? props.cmp.ranks.map((g) => {
              const avg: TurnAverage | null = g.average;
              return {
                key: "r" + RANK_TEXT[g.rank],
                card: null,
                rank: g.rank,
                label: RANK_TEXT[g.rank],
                frequencies: avg?.frequencies ?? null,
                oopEv: avg?.oopEv ?? null,
                ipEv: avg?.ipEv ?? null,
                seatEv: avg ? seatEv(avg) : null,
                diff: avg ? diffOf(avg) : null,
                probability: avg?.probability ?? null,
                statusText: "—",
                selected: props.ui.selectedRank === g.rank,
              };
            })
          : props.cmp.rows.map((r) => ({
              key: String(r.card),
              card: r.card,
              rank: r.card >> 2,
              label: cardText(r.card),
              frequencies: r.status === "ok" ? r.frequencies : null,
              oopEv: r.oopEv,
              ipEv: r.ipEv,
              seatEv: seatEv(r),
              diff: diffOf(r),
              probability: r.probability,
              statusText: statusLong(r),
              selected: props.ui.selected === r.card,
            }));
      const k = props.ui.sortKey,
        dir = props.ui.sortDir;
      const value = (r: TableRow): number | null =>
        k === "card"
          ? r.card ?? r.rank * 4
          : k === "oop"
          ? r.oopEv
          : k === "ip"
          ? r.ipEv
          : k === "diff"
          ? r.diff
          : k === "prob"
          ? r.probability
          : r.frequencies?.[Number(k.slice(1))] ?? null;
      // 값 없는 행은 방향과 상관없이 맨 아래
      return [...rows].sort((x, y) => {
        const a = value(x), b = value(y);
        if (a === null || b === null) return a === null ? (b === null ? 0 : 1) : -1;
        return (a - b) * dir;
      });
    });
    const sortBy = (key: string) => {
      if (props.ui.sortKey === key) props.ui.sortDir = props.ui.sortDir === 1 ? -1 : 1;
      else {
        props.ui.sortKey = key;
        props.ui.sortDir = -1;
      }
    };
    const arrow = (key: string) => (props.ui.sortKey === key ? (props.ui.sortDir === 1 ? " ▲" : " ▼") : "");

    const picked = computed(() => {
      if (props.ui.group === "rank") {
        const g = props.cmp.ranks.find((x) => x.rank === props.ui.selectedRank);
        if (!g) return null;
        return {
          card: null,
          label: RANK_TEXT[g.rank],
          frequencies: g.average?.frequencies ?? null,
          oopEv: g.average?.oopEv ?? null,
          ipEv: g.average?.ipEv ?? null,
          diff: g.average ? diffOf(g.average) : null,
          probability: g.average?.probability ?? null,
          exploitPct: null,
          // 그 랭크 카드가 전부 나올 수 없으면(보드·손패 무게 0·건너뛴 턴) 평균 숨김 사유가 아니다(MA-659)
          statusText: g.cards.every((c) => rowsByCard.value.get(c)?.status === "impossible")
            ? T.value.impossible
            : T.value.averageHidden,
        };
      }
      const r = props.ui.selected === null ? undefined : rowsByCard.value.get(props.ui.selected);
      if (!r) return null;
      return {
        card: r.card,
        label: cardText(r.card),
        frequencies: r.status === "ok" ? r.frequencies : null,
        oopEv: r.oopEv,
        ipEv: r.ipEv,
        diff: diffOf(r),
        probability: r.probability,
        exploitPct: r.status === "ok" ? r.exploitPct : null,
        statusText: statusLong(r),
      };
    });

    // 시트를 닫으면 누른 칸으로 포커스를 돌려준다
    let returnFocus: HTMLElement | null = null;
    const closeButton = ref<HTMLButtonElement | null>(null);
    const focusSheet = (event: Event) => {
      returnFocus = event.currentTarget as HTMLElement;
      if (window.matchMedia("(max-width: 767px)").matches) void nextTick(() => closeButton.value?.focus());
    };
    const choose = (card: number, event: Event) => {
      props.ui.selected = card;
      focusSheet(event);
    };
    const chooseRank = (rank: number, event: Event) => {
      props.ui.selectedRank = rank;
      focusSheet(event);
    };
    const close = () => {
      if (props.ui.group === "rank") props.ui.selectedRank = null;
      else props.ui.selected = null;
      returnFocus?.focus();
      returnFocus = null;
    };
    // ar 플랍 경로 글은 단계를 RTL로 읽는다(자리 이름만 FlopStudyPage가 LTR로 격리)
    const rtl = computed(() => i18n.locale === "ar");

    return {
      T,
      rtl,
      RANK_TEXT,
      SUIT_TEXT,
      SUIT_CLASS,
      RANK_ORDER,
      SUIT_ORDER,
      format,
      pct,
      bb,
      evText,
      diffText,
      diffClass,
      cardText,
      evSeatName,
      seatEv,
      grids,
      rankCells,
      cellAttrs,
      tableRows,
      sortBy,
      arrow,
      picked,
      choose,
      chooseRank,
      close,
      closeButton,
    };
  },
});
</script>

<style scoped>
.tp {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.tp h2 {
  font-weight: 700;
  font-size: 13px;
  margin: 0 0 2px;
}
.tp-meta {
  color: rgb(var(--c-text-muted));
  font-size: 10px;
  line-height: 1.5;
  margin: 0;
}
button {
  border: 1px solid rgb(var(--c-line));
  border-radius: 6px;
  padding: 4px 8px;
  background: rgb(var(--c-bg-2));
  line-height: 1.3;
  font-size: 11px;
}
button:hover:not(:disabled):not([aria-pressed="true"]) {
  background: rgb(var(--c-bg-3));
}
button:focus-visible {
  outline: 2px solid rgb(var(--c-brand));
  outline-offset: 2px;
}
button[aria-pressed="true"] {
  background: rgb(var(--c-brand));
  border-color: rgb(var(--c-brand));
  color: #171717;
  font-weight: 700;
}
.tp-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
}
.tp-control {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.tp-control > span {
  color: rgb(var(--c-text-muted));
  font-size: 10px;
  margin-inline-end: 2px;
}
.tp-average {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  font-size: 11px;
}
.tp-average-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.tp-average-item i {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex: none;
}
.tp-bar {
  display: flex;
  height: 8px;
  width: 100%;
  min-width: 40px;
  border-radius: 3px;
  overflow: hidden;
  background: rgb(var(--c-bg-3));
}
.tp-bar i {
  display: block;
  height: 100%;
}
.tp-bar-wide {
  width: 160px;
  height: 10px;
}
.tp-grid {
  display: grid;
  gap: 2px;
}
.tp-grid-wide {
  grid-template-columns: 22px repeat(13, minmax(0, 1fr));
}
.tp-grid-tall {
  display: none;
  grid-template-columns: 28px repeat(4, minmax(0, 1fr));
}
.tp-grid-wide.tp-grid-ranks {
  grid-template-columns: repeat(13, minmax(0, 1fr));
}
.tp-axis,
.tp-corner {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgb(var(--c-text-muted));
  font-size: 11px;
  font-weight: 700;
}
.tp-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  gap: 3px;
  min-width: 0;
  min-height: 46px;
  padding: 4px;
  border-radius: 4px;
  background: #24272a;
  border: 1px solid transparent;
  text-align: start;
}
.tp-cell:hover:not(:disabled):not([aria-pressed="true"]) {
  background: #2e3236;
}
.tp-cell[aria-pressed="true"] {
  background: #24272a;
  color: inherit;
  border-color: rgb(var(--c-brand));
  outline: 1px solid rgb(var(--c-brand));
}
.tp-cell.board {
  opacity: 0.35;
}
.tp-cell.off .tp-cell-status {
  color: rgb(var(--c-text-muted));
}
.tp-cell:disabled {
  cursor: default;
}
.tp-cell-name {
  font-weight: 700;
  font-size: 12px;
  color: #f3f3f3;
}
.tp-cell-status {
  font-size: 9px;
  line-height: 1.2;
  overflow: hidden;
}
.tp-cell-value {
  font-size: 11px;
  font-weight: 700;
  color: #d8d8d8;
}
.tp-cell-marks {
  position: absolute;
  top: 3px;
  inset-inline-end: 4px;
  font-size: 8px;
  color: rgb(var(--c-text-muted));
}
.up {
  color: #5fc28e;
}
.down {
  color: #e2787c;
}
.clubs {
  color: #4fae84;
}
.diamonds {
  color: #6aa5ec;
}
.hearts {
  color: #ec7a7e;
}
.spades {
  color: #c8cfda;
}
.tp-table-wrap {
  overflow-x: auto;
}
.tp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.tp-table th {
  text-align: start;
  white-space: nowrap;
  font-weight: 600;
  color: rgb(var(--c-text-muted));
  font-size: 10px;
  padding: 0 4px 5px;
}
.tp-table td {
  padding: 4px;
  border-top: 1px solid rgb(var(--c-line));
  white-space: nowrap;
}
.tp-sort {
  border: 0;
  padding: 0;
  background: none;
  color: inherit;
  font: inherit;
}
.tp-sort:hover:not(:disabled) {
  background: none;
  text-decoration: underline;
}
.tp-row {
  cursor: pointer;
}
.tp-row:hover {
  background: rgb(var(--c-bg-2));
}
.tp-row[aria-selected="true"] {
  background: rgb(var(--c-bg-3));
}
.tp-average-row td {
  font-weight: 700;
}
.tp-col-mobile {
  display: none;
}
.tp-backdrop {
  display: none;
}
.tp-picked {
  border-top: 1px solid rgb(var(--c-line));
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.tp-picked-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tp-picked-head h3 {
  margin: 0;
}
.tp-picked-card {
  font-size: 16px;
  font-weight: 700;
}
.tp-picked-line {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin: 0;
  font-size: 11px;
}
.tp-picked-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tp-picked-actions button {
  padding: 6px 12px;
  font-weight: 600;
}
.tp-close {
  display: none;
}
@media (max-width: 767px) {
  .tp-grid-wide {
    display: none;
  }
  .tp-grid-tall {
    display: grid;
  }
  .tp-grid-tall.tp-grid-ranks {
    grid-template-columns: minmax(0, 1fr);
  }
  /* 무늬 머리글은 스크롤해도 위에 붙어 있게 */
  .tp-grid-tall > .tp-axis:nth-child(-n + 5),
  .tp-grid-tall > .tp-corner {
    position: sticky;
    top: 0;
    z-index: 1;
    background: rgb(var(--c-bg-1));
    min-height: 24px;
  }
  .tp-cell {
    min-height: 46px;
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }
  .tp-cell .tp-bar {
    flex: 1;
  }
  .tp-col-action,
  .tp-col-ev {
    display: none;
  }
  .tp-col-mobile {
    display: table-cell;
    width: 50%;
  }
  .tp-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgb(0 0 0 / 0.45);
  }
  .tp-picked:not(.open) {
    display: none;
  }
  .tp-picked.open {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 50;
    max-height: 70vh;
    overflow-y: auto;
    padding: 12px 12px calc(12px + env(safe-area-inset-bottom));
    background: rgb(var(--c-bg-1));
    border: 1px solid rgb(var(--c-line));
    border-bottom: 0;
    border-radius: 12px 12px 0 0;
  }
  .tp-close {
    display: block;
    min-height: 32px;
  }
  .tp-picked-actions button {
    min-height: 40px;
    flex: 1;
  }
}
</style>
