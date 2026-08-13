import { PRESETS } from "./presets";
import { Results, SpotPlayer } from "./result-types";
import { cardText, formatAmount } from "./utils";
import {
  classifyMade,
  classifyDraw,
  MADE_LABELS,
  DRAW_LABELS,
} from "./hand-categories";

export type TrainerHistoryAction = {
  player: "oop" | "ip";
  name: string;
  amount: string;
};

export type TrainerDecision = {
  nodeId: string;
  path: number[];
  history: TrainerHistoryAction[];
  cards: number[][];
  selectedSpot: SpotPlayer;
  currentBoard: number[];
  results: Results;
  totalBetAmount: number[];
  startingPot: number;
  effectiveStack: number;
  unitScale: number;
};

export type TrainerPresetData = {
  presetId: string;
  nodes: TrainerDecision[];
};

export type TrainerBank = {
  version: number;
  generatedAt: string;
  targetExploitabilityPct: number;
  presets: TrainerPresetData[];
};

export type TrainerCategory = "all" | "srp" | "3bp" | "blind";

export type TrainerQuestion = {
  id: string;
  presetId: string;
  presetTitle: string;
  category: Exclude<TrainerCategory, "all">;
  node: TrainerDecision;
  handIndex: number;
  handPair: number;
  player: "oop" | "ip";
};

export type TrainerEvaluation = {
  selectedAction: number;
  bestAction: number;
  evLossBb: number;
  actions: {
    index: number;
    label: string;
    frequency: number;
    evBb: number;
    isBest: boolean;
  }[];
};

const actionLabels: Record<string, string> = {
  Fold: "폴드",
  Check: "체크",
  Call: "콜",
  Bet: "벳",
  Raise: "레이즈",
  Allin: "올인",
  "All-in": "올인",
};

export const trainerCategory = (
  presetId: string
): Exclude<TrainerCategory, "all"> => {
  if (presetId.startsWith("srp-")) return "srp";
  if (presetId.startsWith("3bp-")) return "3bp";
  return "blind";
};

export const trainerCategoryLabel = (category: TrainerCategory) => {
  const labels: Record<TrainerCategory, string> = {
    all: "전체",
    srp: "싱글레이즈팟",
    "3bp": "3벳팟",
    blind: "블라인드전",
  };
  return labels[category];
};

export const trainerActionLabel = (
  action: { name: string; amount: string },
  pot: number,
  unitScale: number
) => {
  const label = actionLabels[action.name] ?? action.name;
  if (!action.amount || action.amount === "0") return label;
  const value = Number(action.amount);
  const amount = `${formatAmount(value, unitScale)}${
    unitScale === 10 ? "bb" : ""
  }`;
  if (action.name === "Bet" && pot > 0) {
    return `${label} ${amount} (${Math.round((value * 100) / pot)}% 팟)`;
  }
  return `${label} ${amount}`;
};

export const trainerCardPair = (pair: number) => {
  const card1 = pair & 0xff;
  const card2 = pair >>> 8;
  return [cardText(card2), cardText(card1)];
};

/** 내 핸드가 보드에 무엇을 맞췄는지 (메이드 + 드로우) 라벨로 돌려준다. */
export const trainerHandLabels = (pair: number, board: number[]) => {
  const hole: [number, number] = [pair & 0xff, pair >>> 8];
  const made = MADE_LABELS[classifyMade(hole, board)];
  const drawKey = classifyDraw(hole, board);
  const draw = drawKey === "no_draw" ? "" : DRAW_LABELS[drawKey];
  return { made, draw };
};

const weightedHandIndex = (node: TrainerDecision, random: () => number) => {
  const playerIndex = node.selectedSpot.player === "oop" ? 0 : 1;
  const normalizer = node.results.normalizer[playerIndex];
  const weights = normalizer.map((value, index) => {
    const pair = node.cards[playerIndex][index];
    const card1 = pair & 0xff;
    const card2 = pair >>> 8;
    const isDead = node.currentBoard.includes(card1) || node.currentBoard.includes(card2);
    return !isDead &&
      value > 0 &&
      node.results.weights[playerIndex][index] > 0
      ? value
      : 0;
  });
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return -1;
  let target = random() * total;
  for (let i = 0; i < weights.length; i++) {
    target -= weights[i];
    if (target <= 0) return i;
  }
  return weights.length - 1;
};

export const makeTrainerQuestion = (
  bank: TrainerBank,
  category: TrainerCategory,
  random: () => number = Math.random
): TrainerQuestion | null => {
  const candidates = bank.presets.flatMap((presetData) => {
    if (
      category !== "all" &&
      trainerCategory(presetData.presetId) !== category
    ) {
      return [];
    }
    return presetData.nodes.map((node) => ({
      presetId: presetData.presetId,
      node,
    }));
  });
  if (candidates.length === 0) return null;

  for (let attempt = 0; attempt < candidates.length * 2; attempt++) {
    const candidate = candidates[Math.floor(random() * candidates.length)];
    const handIndex = weightedHandIndex(candidate.node, random);
    if (handIndex < 0) continue;
    const preset = PRESETS.find((item) => item.id === candidate.presetId);
    const playerIndex = candidate.node.selectedSpot.player === "oop" ? 0 : 1;
    const handPair = candidate.node.cards[playerIndex][handIndex];
    return {
      id: `${candidate.presetId}:${candidate.node.nodeId}:${handPair}`,
      presetId: candidate.presetId,
      presetTitle: preset?.title ?? candidate.presetId,
      category: trainerCategory(candidate.presetId),
      node: candidate.node,
      handIndex,
      handPair,
      player: candidate.node.selectedSpot.player,
    };
  }
  return null;
};

export const evaluateTrainerAction = (
  question: TrainerQuestion,
  selectedAction: number
): TrainerEvaluation => {
  const { node, handIndex } = question;
  const numHands =
    node.cards[node.selectedSpot.player === "oop" ? 0 : 1].length;
  const unitScale = node.unitScale || 1;
  const actions = node.selectedSpot.actions.map((action, actionIndex) => {
    const offset = actionIndex * numHands + handIndex;
    return {
      index: actionIndex,
      label: trainerActionLabel(
        action,
        node.selectedSpot.pot ?? node.startingPot,
        unitScale
      ),
      frequency: node.results.strategy[offset] ?? 0,
      evBb: (node.results.actionEv[offset] ?? Number.NEGATIVE_INFINITY) / unitScale,
      isBest: false,
    };
  });
  const best = actions.reduce((a, b) => (b.evBb > a.evBb ? b : a));
  best.isBest = true;
  const selected = actions[selectedAction] ?? best;
  return {
    selectedAction,
    bestAction: best.index,
    evLossBb: Math.max(0, best.evBb - selected.evBb),
    actions,
  };
};

/** EV 손실 판정 경계 (사용법 페이지에도 같은 값이 적혀 있음) */
export const BEST_LOSS_BB = 0.01;
export const GOOD_LOSS_BB = 0.05;
const MIN_WEAKNESS_SAMPLES = 3;

/** 최근 풀이부터 거슬러 올라가며 "허용 가능(0.05bb 이하)"이 몇 번 이어졌는지. */
export const trainerStreak = (attempts: { evLossBb: number }[]) => {
  let streak = 0;
  for (const attempt of attempts) {
    if (attempt.evLossBb > GOOD_LOSS_BB) break;
    streak++;
  }
  return streak;
};

export type TrainerWeakness = {
  category: Exclude<TrainerCategory, "all">;
  label: string;
  count: number;
  averageLossBb: number;
};

/**
 * 카테고리별 평균 EV 손실. 표본이 3개 미만인 카테고리는 우연에 좌우되므로
 * 약점 판정에서 제외한다(목록에는 표시하되 "표본 부족"으로 둠).
 */
export const trainerWeakness = (
  attempts: { category: Exclude<TrainerCategory, "all">; evLossBb: number }[]
): { rows: TrainerWeakness[]; weakest: TrainerWeakness | null } => {
  const categories: Exclude<TrainerCategory, "all">[] = ["srp", "3bp", "blind"];
  const rows = categories.map((category) => {
    const target = attempts.filter((item) => item.category === category);
    const sum = target.reduce((total, item) => total + item.evLossBb, 0);
    return {
      category,
      label: trainerCategoryLabel(category),
      count: target.length,
      averageLossBb: target.length ? sum / target.length : 0,
    };
  });
  const eligible = rows.filter((row) => row.count >= MIN_WEAKNESS_SAMPLES);
  const weakest = eligible.length
    ? eligible.reduce((a, b) => (b.averageLossBb > a.averageLossBb ? b : a))
    : null;
  return { rows, weakest: weakest && weakest.averageLossBb > 0 ? weakest : null };
};

export const validateTrainerBank = (bank: TrainerBank) => {
  const errors: string[] = [];
  if (bank.version !== 1) errors.push("지원하지 않는 트레이너 데이터 버전");
  if (bank.presets.length !== PRESETS.length) {
    errors.push(`프리셋 수 불일치: ${bank.presets.length}/${PRESETS.length}`);
  }
  for (const preset of bank.presets) {
    if (preset.nodes.length < 2) {
      errors.push(`${preset.presetId}: 결정 노드가 2개 미만`);
    }
    for (const node of preset.nodes) {
      if (node.unitScale !== 10) {
        errors.push(`${preset.presetId}/${node.nodeId}: 단위 환산 메타데이터 오류`);
      }
      const spot = node.selectedSpot;
      if (spot.type !== "player" || node.results.numActions !== spot.actions.length) {
        errors.push(`${preset.presetId}/${node.nodeId}: 액션 데이터 불일치`);
        continue;
      }
      const player = spot.player === "oop" ? 0 : 1;
      const n = node.cards[player].length;
      if (
        node.results.strategy.length !== n * spot.actions.length ||
        node.results.actionEv.length !== n * spot.actions.length
      ) {
        errors.push(`${preset.presetId}/${node.nodeId}: 전략 배열 길이 불일치`);
      }
      for (let hand = 0; hand < n; hand++) {
        if (
          node.results.normalizer[player][hand] <= 0 ||
          node.results.weights[player][hand] <= 0
        ) {
          continue;
        }
        let sum = 0;
        for (let action = 0; action < spot.actions.length; action++) {
          sum += node.results.strategy[action * n + hand] ?? 0;
        }
        if (Math.abs(sum - 1) > 0.02) {
          errors.push(`${preset.presetId}/${node.nodeId}: 빈도 합 오류`);
          break;
        }
      }
    }
  }
  return errors;
};
