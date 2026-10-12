// GTO 트레이너 «무작위 숫자(RNG)» 연습 — 숫자 구간·채점 (설계 참고자료/트레이너RNG_설계안_2026-10-12.md)
// 위자드와 같다: 1~100 · High = 높은 숫자가 공격적 액션 · Low = 낮은 숫자가 공격적 액션 · 숫자 구간의 액션이 «최선».

export type RngMode = "off" | "high" | "low";
export type RngVerdict = "best" | "good" | "miss";

/** 솔버가 이 빈도 이상 쓰는 다른 액션은 숫자와 달라도 «허용» — 복기·내 스팟과 같은 3.5% */
export const RNG_FREQUENCY_FLOOR = 0.035;

export type RngBand = { action: number; from: number; to: number };

/** 공격성 순위: 폴드 < 체크·콜 < 벳·레이즈(금액 순) < 올인 */
export const actionAggression = (action: { name: string; amount: string }) => {
  if (action.name === "Fold") return -1;
  if (action.name === "Check" || action.name === "Call") return 0;
  if (action.name === "Allin" || action.name === "All-in") return Number.MAX_SAFE_INTEGER;
  return 1 + (Number(action.amount) || 0);
};

/** 1~100 숫자. random은 [0,1) */
export const rollRng = (random: () => number = Math.random) => 1 + Math.floor(random() * 100);

/**
 * 핸드의 액션 빈도를 1~100 구간으로 나눈다. 빈도 0(반올림해 구간이 비는) 액션은 구간 없음.
 * High: 1부터 소극적 → 공격적(100 쪽이 공격적) · Low: 1부터 공격적 → 소극적.
 */
export const rngBands = (
  actions: { name: string; amount: string }[],
  frequencies: number[],
  mode: Exclude<RngMode, "off">
): RngBand[] => {
  const total = frequencies.reduce((sum, f) => sum + Math.max(0, f), 0);
  if (!(total > 0)) return [];
  const order = actions
    .map((action, index) => ({ index, rank: actionAggression(action) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((item) => item.index);
  if (mode === "low") order.reverse();
  const bands: RngBand[] = [];
  let cumulative = 0;
  let prevEnd = 0;
  for (const index of order) {
    cumulative += Math.max(0, frequencies[index] ?? 0) / total;
    const end = Math.min(100, Math.round(cumulative * 100));
    if (end > prevEnd) bands.push({ action: index, from: prevEnd + 1, to: end });
    prevEnd = Math.max(prevEnd, end);
  }
  // 반올림으로 100에 못 미치면 마지막 구간을 늘린다
  if (bands.length && bands[bands.length - 1].to < 100) bands[bands.length - 1].to = 100;
  return bands;
};

/** 숫자가 가리키는 액션 */
export const rngAction = (bands: RngBand[], roll: number) =>
  bands.find((band) => roll >= band.from && roll <= band.to)?.action ?? -1;

/**
 * RNG가 켜졌을 때의 채점.
 * 숫자 액션 = 최선 · 솔버가 3.5% 이상 쓰는 다른 액션 = 허용(mixed) · 그 밖은 EV 손실 기준
 * (단 숫자 액션이 아니므로 «최선»까지는 올리지 않는다 — 위자드도 Best는 숫자 액션뿐).
 */
export const classifyRngAnswer = (input: {
  selectedAction: number;
  frequencies: number[];
  evLossBb: number;
  goodBb: number;
  bands: RngBand[];
  roll: number;
}): { verdict: RngVerdict; rolledAction: number; mixed: boolean } => {
  const rolledAction = rngAction(input.bands, input.roll);
  if (input.selectedAction === rolledAction) return { verdict: "best", rolledAction, mixed: false };
  const frequency = input.frequencies[input.selectedAction] ?? 0;
  if (frequency >= RNG_FREQUENCY_FLOOR) return { verdict: "good", rolledAction, mixed: true };
  return { verdict: input.evLossBb <= input.goodBb ? "good" : "miss", rolledAction, mixed: false };
};
