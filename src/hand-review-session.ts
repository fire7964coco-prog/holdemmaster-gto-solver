/*
 * /study/ 앱이 넘긴 복기 판(study-handoff.ts). 플랍까지는 그 앱이 끝냈고, 여기서는 턴·리버만 계산한다 —
 * 이 앱은 플랍 자료를 읽지 않으므로 계산 입력과 플랍 줄이 모두 짐에 들어 있다.
 * 형식은 그 앱 solver-bridge.ts의 ReviewTurn과 맞춘다(코드는 나눠 쓰지 않는다).
 */
import { shallowRef } from "vue";
import type { ActionMatch } from "./review/actions";
import type { SuitPermutation } from "./review/cards";
import type { HandReviewSolverInput } from "./hand-review-solver";
import type { ReviewNode, ReviewVerdict, responseFor } from "./hand-review-model";

export type ReviewTurnSeat = {
  /** 플랍 쪽으로 되돌아갈 때 그 앱이 판을 찾는 표시 */
  returnId: string;
  spot: { id: string; opener: string; caller: string; oop: string; ip: string; startingPot: number; effectiveStack: number };
  heroPlayer: 0 | 1;
  heroCards: number[];
  canonicalHero: [number, number];
  /** 실제 무늬 4장 */
  board: number[];
  input: HandReviewSolverInput;
  inversePerm: SuitPermutation;
  flopPath: number[];
  flopAccuracy: { targetPct: number; achievedPct: number };
  rootWeights: [number, number];
  records: {
    street: "flop";
    path: number[];
    player: 0 | 1;
    match: ActionMatch;
    node: ReviewNode;
    verdict: ReviewVerdict | null;
    response: ReturnType<typeof responseFor>;
  }[];
};

export const reviewSession = shallowRef<ReviewTurnSeat | null>(null);
export const hasReviewSession = () => reviewSession.value !== null;
