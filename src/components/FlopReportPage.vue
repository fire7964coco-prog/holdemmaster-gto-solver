<template>
  <!-- 플랍 통계 2단계: PC 화면 (설계 참고자료/플랍통계_설계안_2026-10-12.md §3 · §7-2) -->
  <section class="report-page" data-testid="flop-report-page">
    <div class="report-toolbar">
      <span>{{
        format(T.intro, { pct: pct((report?.targetPct ?? 0.3) / 100, 1) })
      }}</span>
      <span>{{ spot.oop }} vs {{ spot.ip }} · {{ R.pot }} {{ bb(spot.startingPot) }}</span>
    </div>

    <div class="report-panel report-top">
      <div class="report-group">
        <h3>{{ R.preflop }}</h3>
        <div class="report-options">
          <button
            v-for="item in potTypes"
            :key="item.id"
            :data-testid="'report-pot-' + item.id"
            :aria-pressed="potType === item.id"
            @click="choosePot(item.id)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
      <div class="report-group">
        <h3>{{ R.opener }}</h3>
        <div class="report-options">
          <button
            v-for="pos in OPENERS"
            :key="pos"
            :data-testid="'report-opener-' + pos"
            :aria-pressed="spot.opener === pos"
            :disabled="!spotFor(pos)"
            :class="{ 'not-ready': spotFor(pos) && !openerReady(pos) }"
            @click="chooseSeats(pos, spot.caller)"
          >
            {{ pos
            }}<small v-if="spotFor(pos) && !openerReady(pos)" class="report-badge">{{
              S.notReady
            }}</small>
          </button>
        </div>
      </div>
      <div class="report-group">
        <h3>{{ potType === "srp" ? R.caller : R.threeBettor }}</h3>
        <div class="report-options">
          <button
            v-for="pos in secondSeats"
            :key="pos"
            :data-testid="'report-caller-' + pos"
            :aria-pressed="spot.caller === pos"
            :disabled="!spotFor(spot.opener, pos)"
            :class="{ 'not-ready': spotFor(spot.opener, pos) && !isReady(spotFor(spot.opener, pos)) }"
            @click="chooseSeats(spot.opener, pos)"
          >
            {{ pos
            }}<small
              v-if="spotFor(spot.opener, pos) && !isReady(spotFor(spot.opener, pos))"
              class="report-badge"
              >{{ S.notReady }}</small
            >
          </button>
        </div>
      </div>
    </div>

    <div class="report-panel report-controls">
      <div class="report-options">
        <button
          v-for="(n, i) in nodeChoices"
          :key="i"
          :data-testid="'report-node-' + i"
          :aria-pressed="nodeIndex === i"
          @click="nodeIndex = i"
        >
          {{ n }}
        </button>
      </div>
      <div class="report-options">
        <button
          data-testid="report-metric-strategy"
          :aria-pressed="metric === 'strategy'"
          @click="metric = 'strategy'"
        >
          {{ T.strategyTab }}
        </button>
        <button
          data-testid="report-metric-ev"
          :aria-pressed="metric === 'ev'"
          @click="metric = 'ev'"
        >
          {{ T.evTab }}
        </button>
      </div>
      <div v-if="metric === 'strategy'" class="report-options">
        <button
          data-testid="report-size-split"
          :aria-pressed="!merged"
          @click="merged = false"
        >
          {{ T.bySize }}
        </button>
        <button
          data-testid="report-size-merged"
          :aria-pressed="merged"
          @click="merged = true"
        >
          {{ T.merged }}
        </button>
      </div>
      <div class="report-options">
        <span class="report-label">{{ T.groupBy }}</span>
        <button
          data-testid="report-group-none"
          :aria-pressed="axis === null"
          @click="chooseAxis(null)"
        >
          {{ T.groupNone }}
        </button>
        <button
          v-for="a in GROUP_AXES"
          :key="a"
          :data-testid="'report-group-' + a"
          :aria-pressed="axis === a"
          @click="chooseAxis(a)"
        >
          {{ T[("group_" + a) as GroupLabelKey] }}
        </button>
      </div>
    </div>

    <div
      v-if="statusCode || loading"
      class="report-panel report-status"
      role="status"
      data-testid="report-status"
      :data-code="statusCode"
    >
      <template v-if="loading">{{ R.loading }}</template>
      <template v-else
        >{{ statusCode === "SCENARIO_NOT_READY" ? T.notReadyNote : R.loadFailed
        }}<button
          v-if="statusCode === 'LOAD_FAILED'"
          data-testid="report-retry"
          @click="load"
        >
          {{ R.retry }}
        </button></template
      >
    </div>

    <div v-else-if="report" class="report-columns">
      <section class="report-panel report-groups" data-testid="report-groups">
        <p v-if="facts" class="report-summary" data-testid="report-summary">
          {{ factsText }}
        </p>
        <div class="report-legend" v-if="metric === 'strategy'">
          <span v-for="(c, i) in columns" :key="i"
            ><i :style="{ background: colors[i] }" />{{ columnText(c) }}</span
          >
        </div>

        <button
          class="report-bar-row"
          data-testid="report-overall"
          :aria-pressed="groupKey === null"
          :data-freq="overall.freq.join(',')"
          :data-ev="overall.ev"
          @click="groupKey = null"
        >
          <span class="report-bar-name">{{ T.overall }}</span>
          <span class="report-bar-share">{{ pct(1, 0) }}</span>
          <span class="report-bar">
            <template v-if="metric === 'strategy'"
              ><i
                v-for="(f, i) in columnValues(overall.freq, columns)"
                :key="i"
                :style="{ width: f * 100 + '%', background: colors[i] }"
                :title="columnText(columns[i]) + ' ' + pct(f)"
            /></template>
            <i v-else class="report-ev-fill" :style="evBarStyle(overall.ev)" />
          </span>
          <span class="report-bar-value">{{ barValue(overall) }}</span>
        </button>

        <template v-if="axis">
          <button
            v-for="g in groups"
            :key="g.key"
            class="report-bar-row"
            :data-testid="'report-group-row-' + g.key"
            :data-share="g.share"
            :data-freq="g.freq.join(',')"
            :aria-pressed="groupKey === g.key"
            @click="groupKey = groupKey === g.key ? null : g.key"
          >
            <span class="report-bar-name">{{ groupName(g.key) }}</span>
            <span class="report-bar-share">{{ pct(g.share) }}</span>
            <span class="report-bar">
              <template v-if="metric === 'strategy'"
                ><i
                  v-for="(f, i) in columnValues(g.freq, columns)"
                  :key="i"
                  :style="{ width: f * 100 + '%', background: colors[i] }"
                  :title="columnText(columns[i]) + ' ' + pct(f)"
              /></template>
              <i v-else class="report-ev-fill" :style="evBarStyle(g.ev)" />
            </span>
            <span class="report-bar-value">{{ barValue(g) }}</span>
          </button>
          <p class="report-meta">{{ T.groupHelp }}</p>
        </template>
      </section>

      <section class="report-panel report-table-panel">
        <div class="report-table-head">
          <h2>
            {{ groupKey ? format(T.filteredAverage, { name: groupName(groupKey) }) : T.overall }}
            <small>{{ format(T.flopCount, { count: num(tableRows.length, 0) }) }}</small>
          </h2>
          <button v-if="groupKey" data-testid="report-show-all" @click="groupKey = null">
            {{ T.showAll }}
          </button>
        </div>
        <p class="report-meta">{{ T.rowHelp }} {{ T.evHelp }}</p>
        <table class="report-table" data-testid="report-table">
          <thead>
            <tr>
              <th>
                <button :aria-sort="ariaSort('flop')" data-testid="report-sort-flop" @click="sortBy('flop')">
                  {{ T.colFlop }}{{ arrow("flop") }}
                </button>
              </th>
              <th v-if="!narrow">
                <button :aria-sort="ariaSort('weight')" data-testid="report-sort-weight" @click="sortBy('weight')">
                  {{ T.colShare }}{{ arrow("weight") }}
                </button>
              </th>
              <template v-if="metric === 'strategy'">
                <th v-for="(c, i) in tableColumns" :key="c.action">
                  <button
                    :aria-sort="ariaSort('column', c)"
                    :data-testid="'report-sort-col-' + i"
                    @click="sortBy('column', c)"
                  >
                    <i class="report-dot" :style="{ background: tableColors[i] }" />{{
                      columnText(c)
                    }}{{ arrow("column", c) }}
                  </button>
                </th>
              </template>
              <th>
                <button :aria-sort="ariaSort('ev')" data-testid="report-sort-ev" @click="sortBy('ev')">
                  {{ T.colEv }}{{ arrow("ev") }}
                </button>
              </th>
              <th v-if="metric === 'ev'" class="report-th-plain">{{ T.colVersus }}</th>
            </tr>
          </thead>
          <tbody>
            <tr class="report-average-row" data-testid="report-average-row">
              <td>{{ groupKey ? format(T.filteredAverage, { name: groupName(groupKey) }) : T.overall }}</td>
              <td v-if="!narrow">{{ pct(baseline.share) }}</td>
              <template v-if="metric === 'strategy'">
                <td v-for="(f, i) in baselineColumns" :key="i">{{ pct(f) }}</td>
              </template>
              <td>{{ baseline.ev === null ? "—" : num(baseline.ev, 2) }}</td>
              <td v-if="metric === 'ev'" />
            </tr>
            <tr
              v-for="row in visibleRows"
              :key="row.flop"
              class="report-row"
              tabindex="0"
              :data-testid="'report-row-' + row.flop"
              :data-link="rowLink(row)"
              @click="openRow(row)"
              @keydown.enter="openRow(row)"
            >
              <td class="report-flop">
                <span v-for="c in row.cards" :key="c" :class="suitClass(c)">{{ card(c) }}</span>
              </td>
              <td v-if="!narrow">{{ pct(row.weight / report.totalWeight, 2) }}</td>
              <template v-if="metric === 'strategy'">
                <td
                  v-for="(f, i) in columnValues(row.freq[nodeIndex], tableColumns)"
                  :key="i"
                  :class="versusAverage(f, baselineColumns[i])"
                >
                  {{ pct(f) }}
                </td>
              </template>
              <td :class="evClass(row.ev[nodeIndex])">
                {{ row.ev[nodeIndex] === null ? "—" : num(row.ev[nodeIndex]!, 2) }}
              </td>
              <td v-if="metric === 'ev'" :class="evClass(row.ev[nodeIndex])">
                {{ evDelta(row.ev[nodeIndex]) }}
              </td>
            </tr>
          </tbody>
        </table>
        <button
          v-if="tableRows.length > visibleRows.length"
          class="report-more"
          data-testid="report-more"
          @click="limit += PAGE"
        >
          {{ format(T.showMore, { count: num(Math.min(PAGE, tableRows.length - visibleRows.length), 0) }) }}
        </button>
      </section>
    </div>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, onUnmounted, ref, shallowRef, watch } from "vue";
import { i18n, localizeNumber } from "../i18n";
import { useStore } from "../store";
import { flopReportLabels, FlopReportLabels } from "../flop-report-labels";
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
import { HAND_REVIEW_DATA } from "../hand-review-data";
import { flopStudyEntry, parseFlopStudyLink } from "../flop-study-model";
import {
  averageRows,
  columnValues,
  FlopReport,
  FlopReportRow,
  GROUP_AXES,
  GroupAxis,
  groupRows,
  parseFlopReport,
  ReportAverage,
  ReportColumn,
  reportColumns,
  reportRowLink,
  ReportSort,
  sortRows,
  summaryFacts,
  versusAverage,
} from "../flop-report-model";
import { actionColors } from "../action-colors";

type GroupLabelKey = Extract<keyof FlopReportLabels, `group_${string}`>;
const ALL_SPOTS = [...SRP_SPOTS, ...THREE_BET_SPOTS, ...FOUR_BET_SPOTS];
const PAGE = 300;
// 폰(767px 이하, FlopStudyPage와 같은 경계): 표는 «플랍 · 체크 % · 벳 % · EV» 4열 (설계 §3)
const NARROW = "(max-width: 767px)";
// 요약 파일은 앱 정적 파일 (public/flop-reports · 도구/flop-report-build.js). 한 번 받은 상황은 다시 받지 않는다.
const cache = new Map<string, FlopReport>();

export default defineComponent({
  setup() {
    const T = computed(() => flopReportLabels(i18n.locale));
    const S = computed(() => flopStudyLabels(i18n.locale));
    const R = computed(() => M[i18n.locale]);
    const store = useStore();

    const potType = ref<"srp" | "3bet" | "4bet">("srp"),
      spotId = ref("srp-btn-bb"),
      nodeIndex = ref(1),
      metric = ref<"strategy" | "ev">("strategy"),
      merged = ref(false),
      axis = ref<GroupAxis | null>("high"),
      groupKey = ref<string | null>(null),
      sort = ref<ReportSort>({ by: "flop", desc: true }),
      limit = ref(PAGE);
    const report = shallowRef<FlopReport | null>(null),
      loading = ref(false),
      errorCode = ref("");
    let epoch = 0;
    const media = window.matchMedia(NARROW);
    const narrow = ref(media.matches);
    const onMedia = () => (narrow.value = media.matches);
    media.addEventListener("change", onMedia);
    onUnmounted(() => media.removeEventListener("change", onMedia));

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
        (s) => s.opener === opener && (caller === undefined || s.caller === caller)
      );
    const spot = computed(() => ALL_SPOTS.find((s) => s.id === spotId.value)!);
    const isReady = (s?: SrpSpot) =>
      !!s && HAND_REVIEW_DATA.readyScenarios.includes(s.id);
    const openerReady = (opener: string) =>
      spots.value.some((s) => s.opener === opener && isReady(s));
    const statusCode = computed(() =>
      !isReady(spot.value) ? "SCENARIO_NOT_READY" : errorCode.value
    );

    const node = computed(() => report.value?.nodes[nodeIndex.value] ?? null);
    const nodeChoices = computed(() =>
      (report.value?.nodes ?? []).map((n, i) =>
        format(i === 0 ? T.value.nodeFirst : T.value.nodeAfterCheck, { seat: seat(n.player) })
      )
    );
    const columns = computed(() =>
      node.value ? reportColumns(node.value.actions, merged.value || metric.value === "ev") : []
    );
    const colorsOf = (cols: ReportColumn[]) =>
      actionColors(cols.map((c) => (c.action === "Bet" ? "Bet(1)" : c.action)));
    const colors = computed(() => colorsOf(columns.value));
    // 표 열: 폰에서는 막대의 «크기별»과 상관없이 벳을 합친다 (두 노드 모두 체크 + 벳뿐이라 체크 · 벳 2열)
    const tableColumns = computed(() =>
      narrow.value && node.value ? reportColumns(node.value.actions, true) : columns.value
    );
    const tableColors = computed(() => colorsOf(tableColumns.value));
    const overall = computed<ReportAverage>(() =>
      report.value
        ? averageRows(report.value.rows, nodeIndex.value, report.value.totalWeight)
        : { weight: 0, share: 0, freq: [], ev: null, count: 0 }
    );
    const groups = computed(() =>
      report.value && axis.value
        ? groupRows(report.value.rows, axis.value, nodeIndex.value, report.value.totalWeight)
        : []
    );
    const selectedGroup = computed(() =>
      groupKey.value ? groups.value.find((g) => g.key === groupKey.value) ?? null : null
    );
    // 표의 색 기준 = 고른 묶음이 있으면 그 묶음 평균, 없으면 전체 평균 (Wizard «필터된 평균»)
    const baseline = computed(() => selectedGroup.value ?? overall.value);
    const baselineColumns = computed(() => columnValues(baseline.value.freq, tableColumns.value));
    const tableRows = computed(() =>
      report.value
        ? sortRows(selectedGroup.value?.rows ?? report.value.rows, nodeIndex.value, sort.value)
        : []
    );
    const visibleRows = computed(() => tableRows.value.slice(0, limit.value));
    watch([groupKey, sort, nodeIndex, spotId], () => (limit.value = PAGE));
    // 크기별 ↔ 합침이면 열 객체가 바뀌므로 열 정렬은 처음으로 돌린다
    watch([tableColumns], () => {
      if (sort.value.by === "column") sort.value = { by: "flop", desc: true };
    });

    // 쉬운 말 한 줄 — 묶기가 없으면 하이카드 기준
    const facts = computed(() =>
      report.value ? summaryFacts(report.value, nodeIndex.value, axis.value ?? "high") : null
    );
    const factsText = computed(() => {
      const f = facts.value;
      if (!f) return "";
      return format(T.value.summary, {
        seat: seat(f.player),
        when: nodeIndex.value === 0 ? T.value.whenFirst : T.value.whenAfterCheck,
        pct: pct(f.bet, 0),
        minPct: pct(f.minShare, 0),
        most: groupName(f.most.key),
        mostPct: pct(f.most.bet, 0),
        least: groupName(f.least.key),
        leastPct: pct(f.least.bet, 0),
      });
    });

    const evRange = computed(() => {
      const values = [overall.value.ev, ...groups.value.map((g) => g.ev)].filter(
        (v): v is number => v !== null
      );
      return Math.max(...values.map(Math.abs), 1e-9);
    });
    const evBarStyle = (ev: number | null) => ({
      width: ev === null ? "0%" : (100 * Math.abs(ev)) / evRange.value + "%",
      background: ev !== null && ev < 0 ? "#b9535d" : "rgb(var(--c-brand))",
    });
    const barValue = (avg: ReportAverage) => {
      if (metric.value === "ev") return avg.ev === null ? "—" : num(avg.ev, 2) + "bb";
      // 막대 오른쪽 숫자 = 벳·레이즈·올인 합 (크기별로 볼 때도 합)
      const values = columnValues(avg.freq, columns.value);
      const bet = columns.value.reduce(
        (s, c, i) => (/^(?:Check|Call|Fold)$/.test(c.action) ? s : s + values[i]),
        0
      );
      return `${R.value.bet} ${pct(bet, 0)}`;
    };
    const evClass = (ev: number | null) =>
      ev === null || baseline.value.ev === null
        ? ""
        : versusAverage(ev, baseline.value.ev, 0.01);
    const evDelta = (ev: number | null) => {
      if (ev === null || baseline.value.ev === null) return "—";
      const d = ev - baseline.value.ev;
      return Math.abs(d) < 0.005 ? num(0, 2) : (d > 0 ? "+" : "") + num(d, 2);
    };

    function sortBy(by: "flop" | "weight" | "ev" | "column", column?: ReportColumn) {
      const same =
        sort.value.by === by &&
        (by !== "column" || (sort.value.by === "column" && sort.value.column.action === column!.action));
      const desc = same ? !sort.value.desc : true;
      sort.value = by === "column" ? { by, column: column!, desc } : { by, desc };
    }
    const sortActive = (by: string, column?: ReportColumn) =>
      sort.value.by === by &&
      (by !== "column" || (sort.value.by === "column" && sort.value.column.action === column!.action));
    const arrow = (by: string, column?: ReportColumn) =>
      sortActive(by, column) ? (sort.value.desc ? " ▼" : " ▲") : "";
    const ariaSort = (by: string, column?: ReportColumn) =>
      sortActive(by, column) ? (sort.value.desc ? "descending" : "ascending") : "none";

    const rowLink = (row: FlopReportRow) =>
      report.value ? reportRowLink(report.value, row, nodeIndex.value) : "";
    // 플랍 조회는 v-if로 새로 열리며 flopStudyEntry를 한 번 읽는다 (App.vue의 ?view=flop-study와 같은 길)
    function openRow(row: FlopReportRow) {
      flopStudyEntry.link = parseFlopStudyLink(rowLink(row));
      store.sideView = "flop-study";
    }

    const potTypes = computed(() => [
      { id: "srp" as const, label: R.value.singleRaised },
      { id: "3bet" as const, label: R.value.threeBet },
      { id: "4bet" as const, label: R.value.fourBet },
    ]);

    const format = (template: string, values: Record<string, string>) =>
      template.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "");
    const num = (value: number, digits: number) =>
      localizeNumber(value.toFixed(digits));
    const pct = (fraction: number, digits = 1) =>
      localizeNumber(`${(fraction * 100).toFixed(digits)}%`);
    const bb = (chips: number) =>
      localizeNumber(`${(chips / SPOT_UNIT_SCALE).toFixed(2).replace(/\.?0+$/, "")}bb`);
    const card = (c: number) => "23456789TJQKA"[c >> 2] + "♣♦♥♠"[c & 3];
    const suitClass = (c: number) => ["clubs", "diamonds", "hearts", "spades"][c & 3];
    const seat = (p: number) => (p === 0 ? spot.value.oop : spot.value.ip);
    const groupName = (key: string) =>
      /^[2-9TJQKA]$/.test(key)
        ? format(T.value.highKey, { rank: key })
        : T.value[`key_${key}` as keyof FlopReportLabels];
    // 열 이름: 체크·폴드·콜 · 벳은 팟 대비 % (두 노드 모두 아직 벳이 없는 자리라 팟 = 시작 팟)
    const columnText = (c: ReportColumn) => {
      const r = R.value;
      if (c.action === "Bet") return r.bet;
      if (c.action === "Check") return r.check;
      if (c.action === "Fold") return r.fold;
      if (c.action === "Call") return r.call;
      if (c.action.startsWith("AllIn")) return r.allin;
      const amount = Number(/\((\d+)\)$/.exec(c.action)?.[1] ?? 0);
      const potSize = report.value?.pot ?? spot.value.startingPot;
      return c.action.startsWith("Raise")
        ? `${r.raise} ${bb(amount)}`
        : format(T.value.betPct, { pct: localizeNumber(`${Math.round((100 * amount) / potSize)}%`) });
    };

    async function load() {
      const token = ++epoch;
      const id = spot.value.id;
      report.value = null;
      errorCode.value = "";
      if (!isReady(spot.value)) return;
      const hit = cache.get(id);
      if (hit) {
        report.value = hit;
        return;
      }
      loading.value = true;
      try {
        const response = await fetch(`flop-reports/${id}.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const parsed = parseFlopReport(await response.json());
        cache.set(id, parsed);
        if (token === epoch) report.value = parsed;
      } catch {
        if (token === epoch) errorCode.value = "LOAD_FAILED";
      } finally {
        if (token === epoch) loading.value = false;
      }
    }
    function chooseSpot(id: string) {
      spotId.value = id;
      groupKey.value = null;
      void load();
    }
    function chooseSeats(opener: string, caller: string) {
      const next = spotFor(opener, caller) ?? spotFor(opener);
      if (next) chooseSpot(next.id);
    }
    function choosePot(id: "srp" | "3bet" | "4bet") {
      potType.value = id;
      const next =
        spotFor(spot.value.opener, spot.value.caller) ?? spotFor("BTN", "BB") ?? spots.value[0];
      chooseSpot(next.id);
    }
    function chooseAxis(next: GroupAxis | null) {
      axis.value = next;
      groupKey.value = null;
    }

    void load();

    return {
      T,
      S,
      R,
      OPENERS,
      GROUP_AXES,
      PAGE,
      potType,
      potTypes,
      secondSeats,
      spot,
      spotFor,
      isReady,
      openerReady,
      statusCode,
      loading,
      report,
      nodeIndex,
      nodeChoices,
      metric,
      merged,
      axis,
      groupKey,
      columns,
      colors,
      narrow,
      tableColumns,
      tableColors,
      overall,
      groups,
      baseline,
      baselineColumns,
      tableRows,
      visibleRows,
      limit,
      facts,
      factsText,
      evBarStyle,
      barValue,
      evClass,
      evDelta,
      columnValues,
      versusAverage,
      sortBy,
      arrow,
      ariaSort,
      rowLink,
      openRow,
      format,
      num,
      pct,
      bb,
      card,
      suitClass,
      groupName,
      columnText,
      load,
      chooseSeats,
      choosePot,
      chooseAxis,
    };
  },
});
</script>

<style scoped>
.report-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  font-size: 12px;
}
.report-toolbar {
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
button:focus-visible,
.report-row:focus-visible {
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
.report-panel {
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
}
h2 small {
  margin-left: 6px;
  font-weight: 500;
  font-size: 11px;
  color: rgb(var(--c-text-muted));
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
.report-meta {
  color: rgb(var(--c-text-muted));
  font-size: 10px;
  line-height: 1.5;
}
.report-top,
.report-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px 22px;
}
.report-controls {
  align-items: center;
  gap: 8px 18px;
}
.report-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.report-label {
  color: rgb(var(--c-text-muted));
  font-size: 11px;
  margin-right: 2px;
}
.report-badge {
  margin-left: 5px;
  padding: 0 4px;
  border-radius: 3px;
  background: rgb(var(--c-bg-3));
  font-size: 9px;
  font-weight: 600;
  vertical-align: 1px;
}
.report-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px;
  color: rgb(var(--c-text-muted));
}
.report-columns {
  display: grid;
  grid-template-columns: minmax(300px, 1fr) minmax(420px, 1.5fr);
  gap: 10px;
  min-height: 0;
  flex: 1;
}
.report-columns > .report-panel {
  overflow: auto;
}
.report-summary {
  font-size: 12px;
  line-height: 1.55;
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgb(var(--c-bg-2));
}
.report-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-bottom: 6px;
  font-size: 11px;
  color: rgb(var(--c-text-muted));
}
.report-legend i,
.report-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  margin-right: 4px;
}
.report-bar-row {
  display: grid;
  grid-template-columns: minmax(84px, 1.1fr) 46px minmax(90px, 2fr) 62px;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-top: 4px;
  padding: 5px 8px;
  text-align: left;
  font-size: 11px;
}
.report-bar-row[aria-pressed="true"] {
  background: rgb(var(--c-bg-3));
  border-color: rgb(var(--c-brand));
  color: inherit;
}
.report-bar-share,
.report-bar-value {
  text-align: right;
  color: rgb(var(--c-text-muted));
  white-space: nowrap;
}
.report-bar {
  display: flex;
  height: 12px;
  border-radius: 3px;
  overflow: hidden;
  background: rgb(var(--c-bg-3));
}
.report-bar i {
  display: block;
  height: 100%;
}
.report-groups .report-meta {
  margin-top: 8px;
}
.report-table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}
.report-table-head button {
  padding: 3px 8px;
  font-size: 11px;
}
.report-table {
  width: 100%;
  margin-top: 8px;
  border-collapse: collapse;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.report-table th {
  position: sticky;
  top: -10px;
  background: rgb(var(--c-bg-1));
  text-align: right;
  padding: 0 0 4px;
  z-index: 1;
}
.report-table th:first-child,
.report-table td:first-child {
  text-align: left;
}
.report-th-plain,
.report-table th button {
  border: 0;
  background: none;
  padding: 3px 4px;
  font-size: 10px;
  font-weight: 600;
  color: rgb(var(--c-text-muted));
  white-space: nowrap;
}
.report-table th button[aria-sort="ascending"],
.report-table th button[aria-sort="descending"] {
  color: rgb(var(--c-text));
}
.report-table td {
  padding: 4px;
  border-top: 1px solid rgb(var(--c-line));
  text-align: right;
  white-space: nowrap;
}
.report-average-row td {
  font-weight: 700;
  background: rgb(var(--c-bg-2));
}
.report-row {
  cursor: pointer;
}
.report-row:hover td {
  background: rgb(var(--c-bg-2));
}
.report-flop span {
  font-weight: 700;
  font-size: 12px;
  margin-right: 1px;
}
td.above {
  color: #5cc28f;
}
td.below {
  color: #e2737a;
}
.clubs {
  color: #3fa877;
}
.diamonds {
  color: #5b9be3;
}
.hearts {
  color: #e2737a;
}
.spades {
  color: #c4ccd8;
}
.report-more {
  display: block;
  margin: 8px auto 0;
}
/* 폰: 한 줄로 쌓고 페이지가 스크롤한다 · 표는 4열 (narrow) · 가로 스크롤 없음 */
@media (max-width: 767px) {
  .report-page {
    height: auto;
    gap: 6px;
  }
  .report-toolbar {
    flex-wrap: wrap;
    gap: 2px 8px;
    font-size: 10px;
  }
  .report-panel {
    padding: 8px 10px;
  }
  .report-top,
  .report-controls {
    gap: 8px 12px;
  }
  button {
    min-height: 30px;
    padding: 5px 7px;
  }
  .report-columns {
    grid-template-columns: minmax(0, 1fr);
  }
  .report-columns > .report-panel {
    overflow: visible;
  }
  .report-bar-row {
    grid-template-columns: minmax(0, 1fr) 40px minmax(56px, 1.3fr) 54px;
    gap: 6px;
    padding: 5px 6px;
  }
  .report-bar-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .report-table {
    table-layout: fixed;
  }
  .report-table th {
    top: 0;
  }
  .report-table td {
    padding: 6px 3px;
  }
  .report-table th:first-child,
  .report-table td:first-child {
    width: 34%;
  }
  .report-average-row td:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
