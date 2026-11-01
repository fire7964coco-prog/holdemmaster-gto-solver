// 액션 색 한 곳 (플랍 조회 설계안 §2). 값은 핸드 복기 화면(HandReviewPage.vue `actionColor`)과 같다.
// 복기 화면은 아직 이 파일로 옮기지 않았다 — 옮길 때 두 곳 값이 같은지 먼저 볼 것.
// HMR1 액션 문자열: "Fold" | "Check" | "Call" | "Bet(n)" | "Raise(n)" | "AllIn(n)".
export const ACTION_COLORS = {
  fold: "#537fae",
  passive: "#41966f", // Check · Call
  wager: "#b9535d", // Bet · Raise (크기가 하나뿐일 때)
  allIn: "#9c3d66",
  /** 벳·레이즈 크기가 여럿일 때: 작은 크기 → 큰 크기 (밝은 빨강 → 짙은 빨강). */
  wagerLight: "#d4776f",
  wagerDark: "#a3404c",
  empty: "#24272a",
} as const;

/** 복기 화면과 같은 의미의 단색 (크기 구분 없음). */
export const actionColor = (raw: string) =>
  raw === "Fold"
    ? ACTION_COLORS.fold
    : raw === "Check" || raw === "Call"
    ? ACTION_COLORS.passive
    : raw.startsWith("AllIn")
    ? ACTION_COLORS.allIn
    : ACTION_COLORS.wager;

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (from: string, to: string, t: number) =>
  "#" +
  hex(from)
    .map((v, i) => Math.round(v + (hex(to)[i] - v) * t).toString(16).padStart(2, "0"))
    .join("");
const amountOf = (raw: string) => Number(/\((\d+)\)$/.exec(raw)?.[1] ?? 0);

/** 한 노드의 액션 목록 전체 색. 올인 아닌 벳·레이즈는 크기 순으로 붉은 계열 단계를 준다. */
export function actionColors(actions: readonly string[]): string[] {
  const wagers = [
    ...new Set(
      actions
        .filter((a) => a.startsWith("Bet") || a.startsWith("Raise"))
        .map(amountOf)
    ),
  ].sort((a, b) => a - b);
  return actions.map((a) => {
    if (!(a.startsWith("Bet") || a.startsWith("Raise")) || wagers.length < 2)
      return actionColor(a);
    const rank = wagers.indexOf(amountOf(a));
    return mix(ACTION_COLORS.wagerLight, ACTION_COLORS.wagerDark, rank / (wagers.length - 1));
  });
}
