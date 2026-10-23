// 턴 팩(턴 카드 비교) 계산 — 화면 없는 순수 함수 (설계 참고자료/턴팩_설계안_2026-10-21.md §6 · 판정 §3).
// flop-study-model.ts와 같은 규칙: Vue·DOM·앱 런타임 import 금지 → Node에서 그대로 검사한다
// (도구/e2e/turn-pack-verify.js).
// 집계 무게 = 상대와 카드가 안 겹치는 손패 짝 무게 q(h) = r(h) × m(h). 원래 reach 배열(ReviewNode.ranges)은 덮어쓰지 않는다.
import { Hmr1Hand, Hmr1Node, Hmr1Player } from "./review/hmr1";
import { canonicalizeTurn } from "./review/flop-canon";
import { getTurnRoot, Hmt1Pack } from "./review/hmt1";
import { ReviewError } from "./review/errors";
import { nodeSummary, StudyNodeSummary } from "./flop-study-model";
import type { ReviewNode } from "./hand-review-model";

/** 턴 팩이 있는 상황(10-21 사장님 ○ · BB 수비 SRP 둘). 자료 id는 `tp-<상황>`(회원 자료). */
export const TURN_PACK_SPOTS: readonly string[] = ["srp-btn-bb", "srp-co-bb"];
/** 준비된 플랍 경로 = 파일 이름 → 플랍 나무의 액션 번호(체크–체크 · BB 체크→33% 벳→콜 · BB 체크→75% 벳→콜). */
export const TURN_PACK_LINES = {
  xx: [0, 0],
  xb33c: [0, 1, 1],
  xb75c: [0, 2, 1],
} as const;
export type TurnPackLine = keyof typeof TURN_PACK_LINES;

export const turnPackDataId = (spotId: string) => `tp-${spotId}`;

/** 화면의 플랍 경로가 준비된 경로면 그 이름. 받은 뒤 header.flopPath와 한 번 더 비교한다. */
export function turnPackLineFor(spotId: string, path: readonly number[]): TurnPackLine | null {
  if (!TURN_PACK_SPOTS.includes(spotId)) return null;
  for (const [name, p] of Object.entries(TURN_PACK_LINES) as [TurnPackLine, readonly number[]][])
    if (p.length === path.length && p.every((v, i) => v === path[i])) return name;
  return null;
}

/** m(h) = h와 카드가 안 겹치는 상대 손패들의 reach 합 = S − B[a] − B[b] + r(같은 손패) (판정 §3-1). */
export function opponentMass(
  hands: readonly Hmr1Hand[],
  oppHands: readonly Hmr1Hand[],
  oppReach: ArrayLike<number>
): Float64Array {
  let total = 0;
  const byCard = new Float64Array(52),
    same = new Map<number, number>();
  oppHands.forEach(([a, b], g) => {
    const r = oppReach[g];
    if (!(r > 0)) return;
    total += r;
    byCard[a] += r;
    byCard[b] += r;
    same.set(a * 52 + b, r);
  });
  return Float64Array.from(hands, ([a, b]) =>
    Math.max(0, total - byCard[a] - byCard[b] + (same.get(a * 52 + b) ?? 0))
  );
}

export type TurnRootStats = {
  actions: readonly string[];
  /** Zt = 가능한 양쪽 손패 짝의 총무게. 0이면 이 경로에서 나올 수 없는 턴. */
  weight: number;
  /** 액션 비율(손패 짝 가중 · 합 1). */
  frequencies: number[];
  /** BB(OOP) 평균 EV(bb). 쓰는 액션의 EV가 하나라도 빠졌으면 null. */
  oopEv: number | null;
};

/** 턴 첫 결정(항상 OOP)의 레인지 전체 요약 — 판정 §3-1 식. */
export function turnRootStats(
  players: readonly [Hmr1Player, Hmr1Player],
  root: Hmr1Node,
  evScale: number,
  unit: number
): TurnRootStats {
  if (root.player !== 0 || root.path.length)
    throw new ReviewError("INVALID_FORMAT", "Turn root must be the OOP first decision");
  const hands = players[0].hands,
    r0 = players[0].weights,
    n = hands.length,
    A = root.actions.length,
    m = opponentMass(hands, players[1].hands, players[1].weights),
    f = new Array<number>(A).fill(0);
  let weight = 0,
    ev = 0,
    evOk = true;
  for (let h = 0; h < n; h++) {
    const q = r0[h] * m[h];
    if (!(q > 0)) continue;
    let sum = 0;
    for (let a = 0; a < A; a++) sum += root.strategy[a * n + h];
    if (sum <= 0) {
      evOk = false;
      continue;
    }
    weight += q;
    for (let a = 0; a < A; a++) {
      const o = a * n + h,
        s = root.strategy[o] / sum;
      f[a] += q * s;
      if (s <= 0) continue;
      if (!root.evAvailable[o]) evOk = false;
      else ev += (q * s * root.ev[o]) / evScale / unit;
    }
  }
  return {
    actions: root.actions,
    weight,
    frequencies: weight > 0 ? f.map((v) => v / weight) : f,
    oopEv: weight > 0 && evOk ? ev / weight : null,
  };
}

/** ok = 숫자 있음 · impossible = 이 경로에서 나올 수 없음(한쪽 손패 0) · unconverged = 목표 미달 · missing = 팩에 없음(표본). */
export type TurnCardStatus = "ok" | "impossible" | "unconverged" | "missing";
export type TurnCardRow = {
  /** 실제 카드(화면). */
  card: number;
  /** 파일의 대표 턴. */
  rep: number;
  status: TurnCardStatus;
  exploitPct: number | null;
  /** 이 턴이 나올 확률(실제 49장 정규화). 빠진 카드가 있으면 null. */
  probability: number | null;
  frequencies: number[] | null;
  oopEv: number | null;
  /** IP EV = 턴 시작 팟 − BB EV (레이크 0 · 같은 자리 손패 짝 평균). */
  ipEv: number | null;
  /** 보드의 사실만: 플랍과 같은 랭크 · 이 턴과 같은 무늬의 보드 카드 수(턴 포함). */
  pairsBoard: boolean;
  suitCount: number;
};
export type TurnAverage = {
  probability: number;
  frequencies: number[];
  oopEv: number | null;
  ipEv: number | null;
};
export type TurnComparison = {
  actions: readonly string[];
  potBb: number;
  stackBb: number;
  /** 보드 3장을 뺀 49장, 카드 번호 내림차순. */
  rows: TurnCardRow[];
  /** 미수렴·누락이 없어야 true — false면 확률·평균·평균 대비를 보여 주지 않는다. */
  complete: boolean;
  average: TurnAverage | null;
  /** 랭크 묶기: A부터 2까지 13개(보드 랭크도 남은 카드가 있으면 있음). */
  ranks: { rank: number; cards: number[]; average: TurnAverage | null }[];
};

function weighted(rows: readonly TurnCardRow[], A: number): TurnAverage | null {
  let p = 0,
    oop = 0,
    evOk = true;
  const f = new Array<number>(A).fill(0);
  for (const row of rows) {
    const w = row.probability ?? 0;
    if (!(w > 0)) continue;
    p += w;
    row.frequencies!.forEach((v, a) => (f[a] += w * v));
    if (row.oopEv === null) evOk = false;
    else oop += w * row.oopEv;
  }
  if (!(p > 0)) return null;
  return {
    probability: p,
    frequencies: f.map((v) => v / p),
    oopEv: evOk ? oop / p : null,
    ipEv: null,
  };
}

/**
 * 실제 플랍(3장) → 49장 비교. 대표 턴마다 첫 노드만 한 번 풀어 `cache`에 둔다(같은 팩이면 재사용).
 * 구조가 깨진 팩은 ReviewError를 그대로 던진다(«자료 없음»과 구별 · 화면은 오류·다시 시도).
 */
export function turnComparison(
  pack: Hmt1Pack,
  flop: readonly number[],
  cache: Map<number, TurnRootStats | TurnCardStatus> = new Map()
): TurnComparison {
  const h = pack.header,
    potBb = h.pot / h.unit,
    rows: TurnCardRow[] = [];
  let actions: readonly string[] | null = null;
  const statsFor = (rep: number): TurnRootStats | TurnCardStatus => {
    const found = cache.get(rep);
    if (found !== undefined) return found;
    let value: TurnRootStats | TurnCardStatus;
    try {
      const { players, root } = getTurnRoot(pack, rep);
      value = turnRootStats(players, root, h.evScale, h.unit);
      if (!(value.weight > 0)) value = "impossible";
    } catch (error) {
      const code = error instanceof ReviewError ? error.code : "";
      if (code === "TURN_SKIPPED") value = "impossible";
      else if (code === "MISSING_TURN") value = "missing";
      else if (code === "UNSUPPORTED_ACCURACY") value = "unconverged";
      else throw error;
    }
    cache.set(rep, value);
    return value;
  };
  const flopRanks = flop.map((c) => c >> 2);
  for (let card = 51; card >= 0; card--) {
    if (flop.includes(card)) continue;
    const ct = canonicalizeTurn([...flop, card]);
    if (ct.canonical.join() !== h.flopCards.join())
      throw new ReviewError("PACK_MISMATCH", "Turn pack belongs to another flop", { pack: h.flop });
    const stats = statsFor(ct.turn),
      meta = h.turns.find((t) => t.turn === ct.turn);
    const row: TurnCardRow = {
      card,
      rep: ct.turn,
      status: typeof stats === "string" ? stats : "ok",
      exploitPct: meta ? meta.exploitPct : null,
      probability: null,
      frequencies: null,
      oopEv: null,
      ipEv: null,
      pairsBoard: flopRanks.includes(card >> 2),
      suitCount: 1 + flop.filter((c) => (c & 3) === (card & 3)).length,
    };
    if (typeof stats !== "string") {
      if (actions && actions.join() !== stats.actions.join())
        throw new ReviewError("INVALID_FORMAT", "Turn roots disagree on actions", { turn: ct.turn });
      actions = stats.actions;
      row.frequencies = stats.frequencies;
      row.oopEv = stats.oopEv;
      row.ipEv = stats.oopEv === null ? null : potBb - stats.oopEv;
    }
    rows.push(row);
  }
  if (!actions) throw new ReviewError("INVALID_FORMAT", "Turn pack has no playable turn");
  const complete = rows.every((r) => r.status === "ok" || r.status === "impossible");
  if (complete) {
    const total = rows.reduce((s, r) => s + (r.status === "ok" ? (statsFor(r.rep) as TurnRootStats).weight : 0), 0);
    for (const r of rows)
      r.probability = r.status === "ok" ? (statsFor(r.rep) as TurnRootStats).weight / total : 0;
  }
  const A = actions.length;
  const withIp = (avg: TurnAverage | null) =>
    avg && { ...avg, ipEv: avg.oopEv === null ? null : potBb - avg.oopEv };
  const ranks = [];
  for (let rank = 12; rank >= 0; rank--) {
    const group = rows.filter((r) => r.card >> 2 === rank);
    if (group.length)
      ranks.push({
        rank,
        cards: group.map((r) => r.card),
        average: complete ? withIp(weighted(group, A)) : null,
      });
  }
  return {
    actions,
    potBb,
    stackBb: h.stack / h.unit,
    rows,
    complete,
    average: complete ? withIp(weighted(rows, A)) : null,
    ranks,
  };
}

/**
 * 턴 상세(전략 보기)의 레인지 전체 액션 비율 — 비교 화면과 같은 손패 짝 가중.
 * 콤보 수는 nodeSummary 그대로(자기 도달 비중) · 개별 손패의 전략·EV도 그대로다.
 */
export function turnNodeSummary(node: ReviewNode): StudyNodeSummary | null {
  const base = nodeSummary(node);
  if (!base) return null;
  const p = base.player,
    n = node.hands[p].length,
    m = opponentMass(node.hands[p], node.hands[p ^ 1], node.ranges[p ^ 1]),
    f = node.actions.map(() => 0);
  let total = 0;
  for (let h = 0; h < n; h++) {
    const q = node.ranges[p][h] * m[h];
    if (!(q > 0)) continue;
    let sum = 0;
    for (let a = 0; a < f.length; a++) sum += node.strategy[a * n + h];
    if (sum <= 0) continue;
    total += q;
    for (let a = 0; a < f.length; a++) f[a] += (q * node.strategy[a * n + h]) / sum;
  }
  return {
    ...base,
    actions: base.actions.map((item, a) => ({
      ...item,
      frequency: total > 0 ? f[a] / total : 0,
    })),
  };
}

/** 턴 카드 비교 화면 상태(전략 보기에 다녀와도 유지 · 플랍을 바꾸면 고른 카드만 지운다). */
export type TurnCompareUi = {
  metric: "strategy" | "ev";
  evSeat: 0 | 1;
  layout: "cards" | "table";
  group: "none" | "rank";
  sortKey: string;
  sortDir: 1 | -1;
  /** 고른 실제 카드(묶기 없음) · 랭크 묶기면 selectedRank. */
  selected: number | null;
  selectedRank: number | null;
};
