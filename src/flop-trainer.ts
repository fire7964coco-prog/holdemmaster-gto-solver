// GTO 트레이너 «모든 플랍» 출제 — 화면 없는 순수 함수 (설계안 참고자료/트레이너확대_설계안_2026-10-13.md §2).
// src/review 와 같은 규칙: Vue·DOM·앱 런타임 import 금지 → Node에서 그대로 검사한다
// (도구/e2e/flop-trainer-check.js). 서버 자료(복기·플랍 조회와 같은 파일)에서 문제를 뽑고,
// 문제 형식 변환은 복기 «그 자리 연습»의 reviewNodeDecision을 같이 쓴다.
import { Hmr1File, getNode } from "./review/hmr1";
import { canonicalizeFlop, CanonicalFlop } from "./review/flop-canon";
import { flopNode, flopReach, ReviewNode } from "./hand-review-model";
import { encodeHand, practiceWeights, reviewNodeDecision } from "./hand-review-practice";
import { randomFlop, flopText, parseFlopText } from "./flop-study-model";
import { boardClass, GROUP_AXES, GroupAxis } from "./flop-report-model";
import {
  SRP_SPOTS,
  THREE_BET_SPOTS,
  FOUR_BET_SPOTS,
  SPOT_UNIT_SCALE,
  SrpSpot,
} from "./preflop-spots";
import type { TrainerQuestion } from "./trainer";

export type FlopTrainerCategory = "all" | "srp" | "3bp" | "4bp" | "blind";

export type FlopTrainerQuestion = Omit<TrainerQuestion, "category"> & {
  source: "flop";
  category: Exclude<FlopTrainerCategory, "all">;
  /** 실제 카드(내림차순) — 문제 id와 복습 되살리기에 쓴다 */
  flop: number[];
  path: number[];
};

const ALL_SPOTS: SrpSpot[] = [...SRP_SPOTS, ...THREE_BET_SPOTS, ...FOUR_BET_SPOTS];

export const flopTrainerSpot = (scenario: string) =>
  ALL_SPOTS.find((spot) => spot.id === scenario) ?? null;

/** 블라인드전 = SB 대 BB (프리셋의 «블라인드전»과 같은 뜻) */
export const flopScenarioCategory = (
  scenario: string
): Exclude<FlopTrainerCategory, "all"> =>
  scenario.endsWith("-sb-bb")
    ? "blind"
    : scenario.startsWith("4bp-")
    ? "4bp"
    : scenario.startsWith("3bp-")
    ? "3bp"
    : "srp";

/** 출제할 상황 — 자료가 준비됐고(ready) 이 사용자가 받을 수 있는(allowed · 회원 전용 판단) 것만 */
export function flopTrainerScenarios(
  category: FlopTrainerCategory,
  ready: readonly string[],
  allowed: (scenario: string) => boolean = () => true
) {
  return ready.filter(
    (id) =>
      !!flopTrainerSpot(id) &&
      allowed(id) &&
      (category === "all" || flopScenarioCategory(id) === category)
  );
}

export type FlopTrainerDeal = {
  scenario: string;
  /** 실제 카드(내림차순) */
  flop: number[];
  canonical: CanonicalFlop;
};

/** 보드 고르기 — 축마다 고른 칸(빈 배열·없음 = 전체), 축끼리는 «그리고». 칸 이름은 플랍 통계 묶기(GROUP_KEYS)와 같다.
 *  board = 특정 플랍(실제 카드 3장)만 · 있으면 축 조건은 보지 않는다. */
export type FlopBoardFilter = Partial<Record<GroupAxis, readonly string[]>> & { board?: readonly number[] };

export const isBoardFilterActive = (filter: FlopBoardFilter | undefined) =>
  !!filter && (!!filter.board || GROUP_AXES.some((axis) => !!filter[axis]?.length));

export function flopMatchesFilter(flop: readonly number[], filter: FlopBoardFilter) {
  const cls = boardClass(flop);
  return GROUP_AXES.every((axis) => !filter[axis]?.length || filter[axis]!.includes(cls[axis]));
}

let allFlops: number[][] | null = null;
/** 실제 22,100플랍(내림차순 카드) — 한 번만 만든다 */
const realFlops = () => {
  if (!allFlops) {
    allFlops = [];
    for (let a = 51; a >= 2; a--)
      for (let b = a - 1; b >= 1; b--) for (let c = b - 1; c >= 0; c--) allFlops.push([a, b, c]);
  }
  return allFlops;
};

/** 조건에 맞는 실제 플랍 목록 — 개수는 화면 표시(«n개 플랍»)·빈 조합 판단에 쓴다 */
export function filteredFlops(filter: FlopBoardFilter): number[][] {
  if (filter.board) return [[...filter.board].sort((a, b) => b - a)];
  return realFlops().filter((flop) => flopMatchesFilter(flop, filter));
}

/** ① 상황 = 균등 ② 플랍 = 실제 22,100플랍 균등(보드 고르기가 있으면 맞는 플랍 중 균등). 받을 파일 = canonical.fileName
 *  맞는 플랍이 없으면(예: 트립스+모노톤) null */
export function dealFlopTrainer(
  scenarios: readonly string[],
  rng: () => number = Math.random,
  filter?: FlopBoardFilter
): FlopTrainerDeal | null {
  const pool = isBoardFilterActive(filter) ? filteredFlops(filter!) : null;
  if (!scenarios.length || pool?.length === 0) return null;
  const scenario = scenarios[Math.floor(rng() * scenarios.length)];
  const flop = pool ? [...pool[Math.floor(rng() * pool.length)]] : randomFlop(rng);
  return { scenario, flop, canonical: canonicalizeFlop(flop) };
}

/** 같은 플랍으로 되살리기(복습) — 실제 카드는 문제 id에서 */
export function dealFromFlop(scenario: string, flop: readonly number[]): FlopTrainerDeal {
  const cards = [...flop].sort((a, b) => b - a);
  return { scenario, flop: cards, canonical: canonicalizeFlop(cards) };
}

export type FlopDecisionPoint = { path: number[]; nodeProb: number };

/** ③ 파일의 플랍 결정 지점 — 도달 비중(nodeProb) > 0이고 물을 핸드가 있는 것만 */
export function flopDecisionPoints(file: Hmr1File): FlopDecisionPoint[] {
  return file.header.nodes.flatMap((header) => {
    const path = [...header.path];
    const node = flopNode(file, path);
    if (node.kind !== "decision") return [];
    const { nodeProb } = flopReach(file, path);
    if (!(nodeProb > 0) || !practiceWeights(node).some((w) => w > 0)) return [];
    return [{ path, nodeProb }];
  });
}

/** «가까운 결정» = 가장 좋은 액션과 두 번째 액션의 EV 차이가 «허용» 경계(goodBb) 안 */
export function isCloseDecision(node: ReviewNode, hand: number, goodBb: number) {
  const p = node.player;
  if (p === null) return false;
  const n = node.hands[p].length;
  const evs = node.actions
    .map((_, a) => node.evBb[a * n + hand])
    .sort((x, y) => y - x);
  return evs.length >= 2 && evs[0] - evs[1] <= goodBb;
}

const pickWeighted = (weights: readonly number[], rng: () => number) => {
  const total = weights.reduce((s, w) => s + (w > 0 ? w : 0), 0);
  if (!(total > 0)) return -1;
  let target = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    if (!(weights[i] > 0)) continue;
    target -= weights[i];
    if (target <= 0) return i;
  }
  for (let i = weights.length - 1; i >= 0; i--) if (weights[i] > 0) return i;
  return -1;
};

export const flopQuestionId = (scenario: string, flop: readonly number[], path: readonly number[], handPair: number) =>
  `flop:${scenario}:${flopText(flop)}:${path.length ? path.join("-") : "root"}:${handPair}`;

export function parseFlopQuestionId(id: string) {
  const parts = id.split(":");
  if (parts.length !== 5 || parts[0] !== "flop") return null;
  const flop = parseFlopText(parts[2]);
  const path = parts[3] === "root" ? [] : parts[3].split("-").map(Number);
  const handPair = Number(parts[4]);
  if (!flop || !flopTrainerSpot(parts[1]) || path.some((a) => !Number.isSafeInteger(a) || a < 0) ||
    !Number.isSafeInteger(handPair))
    return null;
  return { scenario: parts[1], flop, path, handPair };
}

/** 한 지점·한 핸드 → 트레이너 문제 (hand = 파일 핸드 순서의 번호) */
export function flopTrainerQuestionAt(
  file: Hmr1File,
  deal: FlopTrainerDeal,
  path: readonly number[],
  hand: number
): FlopTrainerQuestion | null {
  const spot = flopTrainerSpot(deal.scenario);
  if (!spot || file.header.scenario !== deal.scenario || `${file.header.flop}.bin` !== deal.canonical.fileName)
    return null;
  const node = flopNode(file, path);
  const p = node.player;
  if (node.kind !== "decision" || p === null) return null;
  const weights = practiceWeights(node);
  if (!(weights[hand] > 0)) return null;
  const line = path.map((action, depth) => {
    const step = getNode(file, path.slice(0, depth));
    return { player: step.player, action: step.actions[action] };
  });
  const decision = reviewNodeDecision(
    {
      heroPlayer: p,
      board: [...deal.flop],
      inversePerm: deal.canonical.inversePerm,
      node,
      line,
      linePath: [...path],
      startingPot: spot.startingPot,
      effectiveStack: spot.effectiveStack,
      unit: SPOT_UNIT_SCALE,
    },
    weights
  );
  if (!decision) return null;
  const handPair = decision.cards[p][hand];
  return {
    source: "flop",
    id: flopQuestionId(deal.scenario, deal.flop, path, handPair),
    presetId: deal.scenario,
    presetTitle: deal.scenario,
    category: flopScenarioCategory(deal.scenario),
    node: decision,
    handIndex: hand,
    handPair,
    player: p === 0 ? "oop" : "ip",
    flop: [...deal.flop],
    path: [...path],
  };
}

export type FlopTrainerOptions = {
  /** «가까운 결정만» — 1·2위 EV 차이 상한(bb). 부르는 쪽이 lossLimits(상황).goodBb를 넘긴다(이 파일은 앱 런타임을 안 불러서) */
  closeWithinBb?: number;
  rng?: () => number;
};

/** ③ 지점 = 도달 비중대로 ④ 핸드 = 그 지점 레인지 비중대로. 물을 것이 없으면 null(다음 플랍으로) */
export function makeFlopTrainerQuestion(
  file: Hmr1File,
  deal: FlopTrainerDeal,
  options: FlopTrainerOptions = {}
): FlopTrainerQuestion | null {
  const rng = options.rng ?? Math.random;
  const points = flopDecisionPoints(file);
  while (points.length) {
    const at = pickWeighted(points.map((point) => point.nodeProb), rng);
    if (at < 0) return null;
    const { path } = points[at];
    const node = flopNode(file, path);
    const weights = practiceWeights(node).map((w, h) =>
      w > 0 && (options.closeWithinBb === undefined || isCloseDecision(node, h, options.closeWithinBb)) ? w : 0
    );
    const hand = pickWeighted(weights, rng);
    if (hand >= 0) return flopTrainerQuestionAt(file, deal, path, hand);
    points.splice(at, 1);
  }
  return null;
}

/** 복습: 문제 id + 그 플랍 파일 → 같은 문제 */
export function restoreFlopTrainerQuestion(file: Hmr1File, id: string): FlopTrainerQuestion | null {
  const parsed = parseFlopQuestionId(id);
  if (!parsed) return null;
  const deal = dealFromFlop(parsed.scenario, parsed.flop);
  const node = flopNode(file, parsed.path);
  if (node.kind !== "decision" || node.player === null) return null;
  const hand = node.hands[node.player].findIndex(
    (pair) => encodeHand(pair, deal.canonical.inversePerm) === parsed.handPair
  );
  return hand >= 0 ? flopTrainerQuestionAt(file, deal, parsed.path, hand) : null;
}
