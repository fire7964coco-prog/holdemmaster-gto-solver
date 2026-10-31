// 플랍 통계(Aggregated Reports) 계산 — 화면 없는 순수 함수 (설계안 참고자료/플랍통계_설계안_2026-10-12.md).
// flop-study-model 과 같은 규칙: Vue·DOM·앱 런타임 import 금지 → Node에서 그대로 검사한다
// (도구/e2e/flop-report-model-check.js). 요약 파일은 도구/flop-report-build.js 가 만든다.
import { ReviewNode } from "./hand-review-model";
import { buildFlopStudyLink, parseFlopText, REAL_FLOP_COUNT } from "./flop-study-model";

export const FLOP_REPORT_VIEW = "flop-report";
export const FLOP_REPORT_FORMAT = 1;
/** 요약 파일의 빈도는 정수(0~FREQ_SCALE)로 저장한다. */
export const FLOP_REPORT_FREQ_SCALE = 10000;

export type FlopReportNode = {
  path: number[];
  player: 0 | 1;
  actions: string[];
};
export type FlopReportRow = {
  /** 파일 플랍 이름(무늬 대표형) «Ah7d2c». */
  flop: string;
  /** 카드 번호 내림차순. */
  cards: number[];
  /** 같은 무늬 구조를 가진 실제 플랍 수 (합 = 22,100). */
  weight: number;
  /** 노드마다 범위 전체 액션 빈도 (0~1). */
  freq: number[][];
  /** 노드마다 행동자 평균 EV (bb). 계산할 핸드가 없으면 null. */
  ev: (number | null)[];
};
export type FlopReport = {
  spot: string;
  pot: number;
  stack: number;
  unit: number;
  targetPct: number;
  nodes: FlopReportNode[];
  rows: FlopReportRow[];
  totalWeight: number;
};

/** 요약 파일 JSON → FlopReport. 형식이 어긋나면 던진다(빈 표로 숨기지 않는다). */
export function parseFlopReport(json: unknown): FlopReport {
  const raw = json as Record<string, any>;
  const fail = (m: string) => {
    throw new Error(`flop report: ${m}`);
  };
  if (!raw || raw.format !== FLOP_REPORT_FORMAT) fail("format");
  if (raw.freqScale !== FLOP_REPORT_FREQ_SCALE) fail("freqScale");
  if (!Array.isArray(raw.nodes) || !raw.nodes.length) fail("nodes");
  const nodes: FlopReportNode[] = raw.nodes.map((n: any) => {
    if (!Array.isArray(n.path) || (n.player !== 0 && n.player !== 1)) fail("node");
    if (!Array.isArray(n.actions) || !n.actions.length) fail("node actions");
    return { path: [...n.path], player: n.player, actions: [...n.actions] };
  });
  if (!Array.isArray(raw.rows) || !raw.rows.length) fail("rows");
  let totalWeight = 0;
  const rows: FlopReportRow[] = raw.rows.map((r: any) => {
    const [flop, weight, ...rest] = r;
    const cards = parseFlopText(flop);
    if (!cards) fail(`flop ${flop}`);
    if (!Number.isSafeInteger(weight) || weight <= 0) fail(`weight ${flop}`);
    if (rest.length !== nodes.length * 2) fail(`row length ${flop}`);
    const freq = nodes.map((node, i) => {
      const f = rest[i * 2];
      if (!Array.isArray(f) || f.length !== node.actions.length) fail(`freq ${flop}`);
      const sum = f.reduce((s: number, v: number) => s + v, 0);
      return f.map((v: number) => (sum > 0 ? v / sum : 0));
    });
    const ev = nodes.map((_, i) => {
      const v = rest[i * 2 + 1];
      return typeof v === "number" && Number.isFinite(v) ? v : null;
    });
    totalWeight += weight;
    return { flop, cards: cards as number[], weight, freq, ev };
  });
  return {
    spot: String(raw.spot),
    pot: raw.pot,
    stack: raw.stack,
    unit: raw.unit,
    targetPct: raw.targetPct,
    nodes,
    rows,
    totalWeight,
  };
}

/** 행동자 평균 EV (bb) = Σ 도달 비중 × Σ 빈도·EV / Σ 도달 비중.
 *  모든 액션에 EV가 있는 핸드만 센다(도달 비중 · 블로커 없음). */
export function nodeAverageEv(node: ReviewNode): number | null {
  const p = node.player;
  if (p === null || node.kind !== "decision") return null;
  const n = node.hands[p].length,
    k = node.actions.length;
  let total = 0,
    value = 0;
  for (let h = 0; h < n; h++) {
    const weight = node.ranges[p][h];
    if (!(weight > 0)) continue;
    let sum = 0,
      ev = 0,
      ok = true;
    for (let a = 0; a < k; a++) {
      const i = a * n + h;
      if (!node.available[i] || !Number.isFinite(node.evBb[i])) {
        ok = false;
        break;
      }
      sum += node.strategy[i];
      ev += node.strategy[i] * node.evBb[i];
    }
    if (!ok || sum <= 0) continue;
    total += weight;
    value += (weight * ev) / sum;
  }
  return total > 0 ? value / total : null;
}

// ── 보드 묶기 (축마다 모든 플랍이 정확히 한 칸) ──
export type GroupAxis = "high" | "suits" | "pairing" | "connect";
export const GROUP_AXES: readonly GroupAxis[] = ["high", "suits", "pairing", "connect"];
/** 칸 순서 = 화면 순서. high 는 랭크 문자. */
export const GROUP_KEYS: Readonly<Record<GroupAxis, readonly string[]>> = {
  high: ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"],
  suits: ["rainbow", "two-tone", "monotone"],
  pairing: ["unpaired", "paired", "trips"],
  connect: ["connected", "semi", "disconnected"],
};
const RANKS = "23456789TJQKA";

/** 연결성: connected = 서로 다른 3장이 5칸 창 안(스트레이트 완성 가능 · board-type-aggregate.js 와 같은 정의)
 *  · semi = 서로 다른 2장의 간격 2 이하(오픈엔드·거트샷이 많은 보드) · 그 밖 disconnected. A는 14와 1 둘 다 본다. */
export function boardClass(cards: readonly number[]): Record<GroupAxis, string> {
  const ranks = cards.map((c) => (c >> 2) + 2);
  const distinct = [...new Set(ranks)];
  const suits = new Set(cards.map((c) => c & 3)).size;
  const span = (rs: number[]) => {
    const lo = rs.map((r) => (r === 14 ? 1 : r));
    return Math.min(Math.max(...rs) - Math.min(...rs), Math.max(...lo) - Math.min(...lo));
  };
  let connect = "disconnected";
  if (distinct.length === 3 && span(distinct) <= 4) connect = "connected";
  else if (
    distinct.some((a, i) => distinct.some((b, j) => j > i && span([a, b]) <= 2))
  )
    connect = "semi";
  return {
    high: RANKS[Math.max(...ranks) - 2],
    suits: suits === 3 ? "rainbow" : suits === 2 ? "two-tone" : "monotone",
    pairing: distinct.length === 3 ? "unpaired" : distinct.length === 2 ? "paired" : "trips",
    connect,
  };
}

// ── 열(액션) 구성 ──
export type ReportColumn = {
  /** 액션 이름(크기별) 또는 «Bet»(합침). */
  action: string;
  /** 합칠 노드 액션 번호. */
  indices: number[];
};
const AGGRESSIVE = /^(?:Bet|Raise|AllIn)\(/;

/** 크기별 = 액션 그대로 · 합침 = 벳·레이즈·올인을 «Bet» 한 열로. */
export function reportColumns(actions: readonly string[], merged: boolean): ReportColumn[] {
  if (!merged) return actions.map((action, a) => ({ action, indices: [a] }));
  const out: ReportColumn[] = [];
  const bets = actions.flatMap((a, i) => (AGGRESSIVE.test(a) ? [i] : []));
  actions.forEach((action, a) => {
    if (!AGGRESSIVE.test(action)) out.push({ action, indices: [a] });
    else if (a === bets[0]) out.push({ action: "Bet", indices: bets });
  });
  return out;
}

export function columnValues(freq: readonly number[], columns: readonly ReportColumn[]) {
  return columns.map((c) => c.indices.reduce((s, i) => s + (freq[i] ?? 0), 0));
}

// ── 가중 평균 ──
export type ReportAverage = {
  /** 실제 플랍 수 합. */
  weight: number;
  /** 전체(22,100)에서 차지하는 비율 0~1. */
  share: number;
  /** 플랍 무게로 가중 평균한 액션 빈도. */
  freq: number[];
  /** 플랍 무게로 가중 평균한 EV (EV 없는 플랍은 빼고) — 하나도 없으면 null. */
  ev: number | null;
  count: number;
};

export function averageRows(
  rows: readonly FlopReportRow[],
  nodeIndex: number,
  totalWeight = REAL_FLOP_COUNT
): ReportAverage {
  const k = rows[0]?.freq[nodeIndex].length ?? 0;
  const freq = Array.from({ length: k }, () => 0);
  let weight = 0,
    evWeight = 0,
    ev = 0;
  for (const row of rows) {
    weight += row.weight;
    row.freq[nodeIndex].forEach((f, a) => (freq[a] += row.weight * f));
    const v = row.ev[nodeIndex];
    if (v !== null) {
      evWeight += row.weight;
      ev += row.weight * v;
    }
  }
  return {
    weight,
    share: totalWeight > 0 ? weight / totalWeight : 0,
    freq: freq.map((f) => (weight > 0 ? f / weight : 0)),
    ev: evWeight > 0 ? ev / evWeight : null,
    count: rows.length,
  };
}

export type ReportGroup = ReportAverage & { key: string; rows: FlopReportRow[] };

/** 축으로 묶은 칸 (빈 칸은 뺀다 · 순서 = GROUP_KEYS). */
export function groupRows(
  rows: readonly FlopReportRow[],
  axis: GroupAxis,
  nodeIndex: number,
  totalWeight = REAL_FLOP_COUNT
): ReportGroup[] {
  const buckets = new Map<string, FlopReportRow[]>(GROUP_KEYS[axis].map((k) => [k, []]));
  for (const row of rows) buckets.get(boardClass(row.cards)[axis])!.push(row);
  return [...buckets]
    .filter(([, rs]) => rs.length)
    .map(([key, rs]) => ({ key, rows: rs, ...averageRows(rs, nodeIndex, totalWeight) }));
}

// ── 정렬 ──
export type ReportSort =
  | { by: "flop" | "weight" | "ev"; desc: boolean }
  | { by: "column"; column: ReportColumn; desc: boolean };

/** 플랍 정렬 = 높은 카드부터 랭크 비교(카드 번호 내림차순 배열 비교). 같은 값이면 플랍 순서 유지. */
export function sortRows(
  rows: readonly FlopReportRow[],
  nodeIndex: number,
  sort: ReportSort
): FlopReportRow[] {
  const key = (r: FlopReportRow): number | number[] => {
    switch (sort.by) {
      case "flop":
        return r.cards.map((c) => c >> 2);
      case "weight":
        return r.weight;
      case "ev":
        return r.ev[nodeIndex] ?? -Infinity;
      case "column":
        return columnValues(r.freq[nodeIndex], [sort.column])[0];
    }
  };
  const cmp = (a: number | number[], b: number | number[]) => {
    if (Array.isArray(a) && Array.isArray(b)) {
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
      return 0;
    }
    return (a as number) - (b as number);
  };
  return rows
    .map((r, i) => ({ r, i, k: key(r) }))
    .sort((x, y) => (sort.desc ? -1 : 1) * cmp(x.k, y.k) || x.i - y.i)
    .map((x) => x.r);
}

/** 평균 대비 색: 차이가 tolerance 이하면 same. */
export function versusAverage(value: number, average: number, tolerance = 0.005) {
  return value > average + tolerance ? "above" : value < average - tolerance ? "below" : "same";
}

/** 쉬운 말 한 줄의 숫자: 전체 벳 비율 + 가장 자주·가장 적게 벳하는 칸 (비중 2% 미만 칸은 제외).
 *  문장은 labels 쪽이 만든다. 벳 액션이 없거나 칸이 2개 미만이면 null. */
export function summaryFacts(
  report: FlopReport,
  nodeIndex: number,
  axis: GroupAxis,
  minShare = 0.02
) {
  const bet = reportColumns(report.nodes[nodeIndex].actions, true).find((c) => c.action === "Bet");
  if (!bet) return null;
  const betOf = (freq: number[]) => columnValues(freq, [bet])[0];
  const groups = groupRows(report.rows, axis, nodeIndex, report.totalWeight)
    .filter((g) => g.share >= minShare)
    .map((g) => ({ key: g.key, share: g.share, bet: betOf(g.freq) }));
  if (groups.length < 2) return null;
  const sorted = [...groups].sort((a, b) => b.bet - a.bet);
  return {
    player: report.nodes[nodeIndex].player,
    bet: betOf(averageRows(report.rows, nodeIndex, report.totalWeight).freq),
    minShare,
    most: sorted[0],
    least: sorted[sorted.length - 1],
  };
}

/** 표의 줄 → 플랍 조회 딥링크 (그 노드까지의 line). */
export function reportRowLink(report: FlopReport, row: FlopReportRow, nodeIndex: number) {
  return buildFlopStudyLink({ spot: report.spot, flop: row.cards, line: report.nodes[nodeIndex].path });
}
