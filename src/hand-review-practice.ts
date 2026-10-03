import type { CustomTrainerBank } from "./custom-trainer";
import type { TrainerDecision, TrainerHistoryAction } from "./trainer";
import type { ReviewNode } from "./hand-review-model";
import { applyPerm, SuitPermutation } from "./review/flop-canon";
import { parseAction } from "./review/flop-line";

// ④ 복기 → 같은 자리 연습. 복기한 결정 하나를 «내 스팟» 연습 문제 형식으로 바꾼다.
// 출제 분포 = 그 자리에 도달한 내 레인지(도달 비중), EV가 모든 액션에 있는 핸드만.

export type ReviewPracticeSource = {
  spotId: string;
  street: "flop" | "turn" | "river";
  heroPlayer: 0 | 1;
  /** Actual (user-entered) board for this street. */
  board: number[];
  /** File/solver suit space → actual suits. */
  inversePerm: SuitPermutation;
  node: ReviewNode;
  /** Every earlier action of the hand, across streets, actual action strings. */
  line: { player: 0 | 1; action: string }[];
  /** Prepared action index of each line entry (identity only). */
  linePath: number[];
  startingPot: number;
  effectiveStack: number;
  unit: number;
  targetPct: number;
  achievedPct: number;
  frequencyFloor: number;
  seats: [string, string];
};

const sideName = (p: 0 | 1) => (p === 0 ? "oop" : "ip");

function trainerAction(raw: string) {
  const a = parseAction(raw);
  return { name: a.kind === "AllIn" ? "Allin" : a.kind, amount: a.amount === undefined ? "" : String(a.amount) };
}

function encode(hand: readonly [number, number], perm: SuitPermutation) {
  const [a, b] = hand.map(c => applyPerm(c, perm)).sort((x, y) => x - y);
  return a | (b << 8);
}

/** Hands of the acting player that can be asked: reached, and every action has an EV. */
export function practiceWeights(node: ReviewNode): number[] {
  const p = node.player;
  if (node.kind !== "decision" || p === null || node.actions.length < 2) return [];
  const n = node.hands[p].length;
  return node.hands[p].map((_, h) => {
    const weight = node.ranges[p][h];
    if (!(weight > 0)) return 0;
    let sum = 0;
    for (let a = 0; a < node.actions.length; a++) {
      const o = a * n + h;
      if (!node.available[o] || !Number.isFinite(node.evBb[o])) return 0;
      sum += node.strategy[o];
    }
    return sum > 0 ? weight : 0;
  });
}

export function canPractice(node: ReviewNode | null | undefined) {
  return !!node && practiceWeights(node).some(w => w > 0);
}

export async function createReviewPracticeBank(src: ReviewPracticeSource): Promise<CustomTrainerBank | null> {
  const node = src.node, p = node.player;
  if (p !== src.heroPlayer) return null;
  const weights = practiceWeights(node);
  if (!weights.some(w => w > 0)) return null;
  const n = node.hands[p].length, actions = node.actions.length;
  const strategy = new Array<number>(n * actions).fill(0);
  const actionEv = new Array<number>(n * actions).fill(0);
  weights.forEach((w, h) => {
    if (!(w > 0)) return;
    let sum = 0;
    for (let a = 0; a < actions; a++) sum += node.strategy[a * n + h];
    for (let a = 0; a < actions; a++) {
      strategy[a * n + h] = node.strategy[a * n + h] / sum;
      actionEv[a * n + h] = node.evBb[a * n + h] * src.unit;
    }
  });
  const sides = [0, 1].map(s => s === p ? weights : Array.from(node.ranges[s], v => (v > 0 ? v : 0)));
  const cards = [0, 1].map(s => node.hands[s].map(hand => encode(hand, src.inversePerm)));
  const zeros = (s: number) => new Array<number>(cards[s].length).fill(0);
  const history: TrainerHistoryAction[] = src.line.map(item => ({ player: sideName(item.player), ...trainerAction(item.action) }));
  const path = [...src.linePath];
  const decision: TrainerDecision = {
    nodeId: path.length ? path.join("-") : "root",
    path,
    history,
    cards,
    selectedSpot: {
      type: "player", index: path.length + 1, player: sideName(p), selectedIndex: -1,
      pot: node.pot,
      stack: node.stacks[p],
      actions: node.actions.map((raw, index) => {
        const { name, amount } = trainerAction(raw);
        return { index, name, amount, isSelected: false,
          color: name === "Fold" ? "#3b82f6" : name === "Check" || name === "Call" ? "#22c55e" : "#f59e0b" };
      }),
    },
    currentBoard: [...src.board],
    results: {
      currentPlayer: sideName(p), numActions: actions, isEmpty: 0, eqrBase: [0, 0],
      weights: sides.map(s => [...s]), normalizer: sides.map(s => [...s]),
      equity: [zeros(0), zeros(1)], ev: [zeros(0), zeros(1)], eqr: [zeros(0), zeros(1)],
      strategy, actionEv,
    },
    totalBetAmount: [...node.committed],
    startingPot: src.startingPot,
    effectiveStack: src.effectiveStack,
    unitScale: src.unit,
  };
  const identity = JSON.stringify({ review: src.spotId, hero: src.heroPlayer, board: src.board, line: src.line });
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(identity));
  const hash12 = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("").slice(0, 12);
  return {
    id: `custom:${hash12}`,
    createdAt: Date.now(),
    board: [...src.board],
    startingPot: src.startingPot,
    effectiveStack: src.effectiveStack,
    unitScale: src.unit,
    lockCount: 0,
    targetExploitabilityPct: src.targetPct,
    achievedExploitabilityPct: src.achievedPct,
    configSnapshot: { review: src.spotId, street: src.street },
    locks: [],
    nodes: [decision],
    origin: { kind: "review", street: src.street, frequencyFloor: src.frequencyFloor, seats: [...src.seats] },
  };
}
