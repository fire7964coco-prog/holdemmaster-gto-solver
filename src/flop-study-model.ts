// 플랍 조회(Study) 계산 — 화면 없는 순수 함수 (설계안 참고자료/플랍조회_설계안_2026-10-10.md §1·§2).
// src/review 와 같은 규칙: Vue·DOM·앱 런타임 import 금지 → Node에서 그대로 검사한다
// (도구/e2e/flop-study-model-check.js). 새 연산은 없고 복기 부품만 다시 묶는다.
import { Hmr1File, Hmr1Hand } from "./review/hmr1";
import {
  applyPerm,
  cardFromName,
  cardName,
  assertDistinctCards,
  SuitPermutation,
} from "./review/flop-canon";
import { flopLine } from "./review/flop-line";
import { flopNode, gridFor, handClass, ReviewNode } from "./hand-review-model";

export const FLOP_STUDY_VIEW = "flop-study";
/** C(52,3) — 무늬를 구분한 실제 플랍 수. */
export const REAL_FLOP_COUNT = 22100;

export type StudyActionSummary = {
  action: string;
  /** 도달 비중을 곱한 범위 전체 빈도 (0~1). 액션 합 = 1. */
  frequency: number;
  /** 도달 비중을 곱한 콤보 수. */
  combos: number;
};
export type StudyNodeSummary = {
  player: 0 | 1;
  actions: StudyActionSummary[];
  /** 이 노드에 도달한 행동 플레이어의 콤보 합. */
  combos: number;
};

/** 행동 플레이어의 범위 전체 액션 빈도·콤보 (내 카드 블로커 없음 — 조회 화면은 핸드가 없다). */
export function nodeSummary(node: ReviewNode): StudyNodeSummary | null {
  const p = node.player;
  if (p === null || node.kind !== "decision") return null;
  const n = node.hands[p].length,
    combos = node.actions.map(() => 0);
  let total = 0;
  for (let h = 0; h < n; h++) {
    const weight = node.ranges[p][h];
    if (!(weight > 0)) continue;
    let sum = 0;
    for (let a = 0; a < combos.length; a++) sum += node.strategy[a * n + h];
    if (sum <= 0) continue;
    total += weight;
    for (let a = 0; a < combos.length; a++)
      combos[a] += (weight * node.strategy[a * n + h]) / sum;
  }
  return {
    player: p,
    combos: total,
    actions: node.actions.map((action, a) => ({
      action,
      combos: combos[a],
      frequency: total > 0 ? combos[a] / total : 0,
    })),
  };
}

export type StudyLineStep = {
  path: number[];
  /** 이 노드에서 고른 액션 (마지막 노드는 null). */
  selected: number | null;
  summary: StudyNodeSummary;
};

/** 이동 줄: path의 앞부분마다 결정 노드 요약 + 다음 끝 상태. */
export function lineSummaries(file: Hmr1File, path: readonly number[]) {
  const steps: StudyLineStep[] = [];
  for (let depth = 0; depth <= path.length; depth++) {
    const prefix = path.slice(0, depth),
      node = flopNode(file, prefix),
      summary = nodeSummary(node);
    if (summary)
      steps.push({
        path: prefix,
        selected: depth < path.length ? path[depth] : null,
        summary,
      });
  }
  const end = flopLine(file, path);
  return {
    steps,
    end: end.kind,
    terminalReason: end.terminalReason ?? null,
  };
}

export type StudyCell = {
  key: string;
  /** gridFor와 같은 값 (도달 비중 가중 평균 빈도). */
  frequencies: number[];
  /** 행동 플레이어의 도달 콤보 합. */
  combos: number;
  /** 채움 높이 = 도달 콤보 / 그 칸에서 보드와 안 겹치는 콤보 수 (0~1). */
  reach: number;
};

/** 13×13 (gridFor 순서) + 칸별 콤보·도달 비중. */
export function studyGrid(node: ReviewNode, player = node.player): StudyCell[] {
  const grid = gridFor(node);
  if (player === null) return grid.map((c) => ({ ...c, combos: 0, reach: 0 }));
  const mass = new Map<string, number>(),
    count = new Map<string, number>();
  node.hands[player].forEach((hand, h) => {
    const key = handClass(hand),
      weight = node.ranges[player][h];
    count.set(key, (count.get(key) ?? 0) + 1);
    if (weight > 0) mass.set(key, (mass.get(key) ?? 0) + weight);
  });
  return grid.map((cell) => {
    const combos = mass.get(cell.key) ?? 0,
      possible = count.get(cell.key) ?? 0;
    return {
      ...cell,
      frequencies: player === node.player ? cell.frequencies : [],
      combos,
      reach: possible > 0 ? combos / possible : 0,
    };
  });
}

export type StudyCombo = {
  /** 파일 무늬 공간. */
  hand: Hmr1Hand;
  /** 실제 무늬 (inversePerm 적용) — 화면에 보이는 카드. */
  actualHand: Hmr1Hand;
  name: string;
  /** 행동 플레이어의 도달 비중 (0~1). */
  weight: number;
  /** 정규화한 빈도 (strategy 합 0이면 빈 배열). */
  frequencies: number[];
  /** bb. evAvailable=0 이거나 유한하지 않으면 null («—»). */
  evBb: (number | null)[];
};

const RANK_ORDER = (c: number) => c >> 2;

/** 실제 카드 2장 이름 (높은 랭크 먼저, 같으면 카드 번호 큰 것 먼저). */
export function comboName(hand: Hmr1Hand) {
  const [a, b] = [...hand].sort(
    (x, y) => RANK_ORDER(y) - RANK_ORDER(x) || y - x
  );
  return cardName(a) + cardName(b);
}

/** 칸 하나의 콤보 상세. inversePerm = canonicalizeFlop(실제 플랍).inversePerm.
 *  player가 행동 플레이어가 아니면(레인지 탭의 상대 자리) 비중만 채우고 빈도·EV는 빈 배열. */
export function cellCombos(
  node: ReviewNode,
  key: string,
  inversePerm: SuitPermutation,
  player = node.player
): StudyCombo[] {
  const p = player;
  if (p === null) return [];
  const acting = p === node.player;
  const n = node.hands[p].length,
    out: StudyCombo[] = [];
  node.hands[p].forEach((hand, h) => {
    if (handClass(hand) !== key) return;
    const actualHand = [
      applyPerm(hand[0], inversePerm),
      applyPerm(hand[1], inversePerm),
    ] as const;
    let sum = 0;
    if (acting)
      for (let a = 0; a < node.actions.length; a++)
        sum += node.strategy[a * n + h];
    out.push({
      hand,
      actualHand,
      name: comboName(actualHand),
      weight: node.ranges[p][h],
      frequencies:
        sum > 0 ? node.actions.map((_, a) => node.strategy[a * n + h] / sum) : [],
      evBb: (acting ? node.actions : []).map((_, a) => {
        const v = node.evBb[a * n + h];
        return node.available[a * n + h] && Number.isFinite(v) ? v : null;
      }),
    });
  });
  return out.sort((x, y) => (x.name < y.name ? 1 : x.name > y.name ? -1 : 0));
}

/** 액션 필터: 고른 액션들의 빈도 합 (칸마다 0~1). 아무것도 안 고르면 전부 1. */
export function actionFilterMask(
  cells: readonly { frequencies: readonly number[] }[],
  selected: readonly number[]
) {
  if (!selected.length) return cells.map(() => 1);
  return cells.map((c) =>
    selected.reduce((s, a) => s + (c.frequencies[a] ?? 0), 0)
  );
}

/** 실제 22,100 플랍에서 균등 — 서로 다른 3장 (rng는 [0,1) 균등). */
export function randomFlop(rng: () => number = Math.random): number[] {
  const deck = Array.from({ length: 52 }, (_, i) => i);
  for (let i = 0; i < 3; i++) {
    const j = i + Math.floor(rng() * (52 - i));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, 3).sort((a, b) => b - a);
}

/** 실제 플랍 → «Ah7d2c» (카드 번호 내림차순). */
export function flopText(cards: readonly number[]) {
  assertDistinctCards(cards, 3);
  return [...cards].sort((a, b) => b - a).map(cardName).join("");
}

/** «Ah7d2c» / «ah 7d 2c» → 카드 3장, 잘못되면 null. */
export function parseFlopText(text: string): number[] | null {
  const compact = String(text ?? "").replace(/[\s,]/g, "");
  if (compact.length !== 6) return null;
  try {
    const cards = [0, 2, 4].map((i) =>
      cardFromName(compact[i].toUpperCase() + compact[i + 1].toLowerCase())
    );
    assertDistinctCards(cards, 3);
    return cards.sort((a, b) => b - a);
  } catch {
    return null;
  }
}

export type FlopStudyLink = {
  spot: string | null;
  flop: number[] | null;
  line: number[];
};

/** `?view=flop-study&spot=..&flop=Ah7d2c&line=0.1` 해석. 다른 view면 null. 잘못된 부분만 버린다. */
export function parseFlopStudyLink(search: string): FlopStudyLink | null {
  const q = new URLSearchParams(search);
  if (q.get("view") !== FLOP_STUDY_VIEW) return null;
  const spot = q.get("spot"),
    flop = q.get("flop"),
    line = q.get("line");
  const parts = line ? line.split(".") : [];
  const valid = parts.every((s) => /^(0|[1-9][0-9]{0,2})$/.test(s));
  return {
    spot: spot && /^[a-z0-9-]{1,40}$/.test(spot) ? spot : null,
    flop: flop ? parseFlopText(flop) : null,
    line: valid ? parts.map(Number) : [],
  };
}

/** App.vue가 `replaceState`로 주소를 지우기 전에 읽어 둔 딥링크 — 조회 화면이 열릴 때 한 번 가져간다. */
export const flopStudyEntry: { link: FlopStudyLink | null } = { link: null };

export function buildFlopStudyLink(link: {
  spot: string;
  flop: readonly number[];
  line?: readonly number[];
}) {
  const q = new URLSearchParams({
    view: FLOP_STUDY_VIEW,
    spot: link.spot,
    flop: flopText(link.flop),
  });
  if (link.line?.length) q.set("line", link.line.join("."));
  return "?" + q.toString();
}

/** 딥링크 line 중 파일에서 실제로 따라갈 수 있는 가장 긴 앞부분. */
export function validLinePrefix(file: Hmr1File, line: readonly number[]) {
  let ok: number[] = [];
  for (let depth = 1; depth <= line.length; depth++) {
    try {
      flopLine(file, line.slice(0, depth));
      ok = line.slice(0, depth);
    } catch {
      break;
    }
  }
  return ok;
}
