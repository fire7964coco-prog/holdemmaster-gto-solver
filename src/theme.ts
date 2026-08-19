/*
 * T39 색 토큰 — 자바스크립트(chart.js·캔버스)에서 쓰는 쪽.
 * CSS 쪽 정의(src/index.css :root의 --c-*)와 값이 짝을 이룬다.
 * 한쪽을 바꾸면 반드시 같이 바꿀 것 (검증: 도구/e2e/t39-token-diff.js).
 *
 * 여기 없는 색(액션 빨강/초록, 핸드 분류 무지개, 차트 데이터 계열 색)은
 * «의미색»이라 테마가 바뀌어도 유지한다 — 각 컴포넌트에 그대로 둔다.
 */
const BASE = {
  /** 홀덤마스터 브랜드 앰버 (--c-brand) */
  brand: "#DFAC2A",
  /** 앰버 위 글자·도안색 (--c-brand-ink) */
  brandInk: "#04160C",
  /** 매트릭스·표의 선택/강조색 = yellow-500 (--c-yellow-500) */
  accent: "#eab308",
  /** 차트 눈금 글자 = neutral-400 */
  chartTick: "#a3a3a3",
  /** 차트 격자선 = neutral-700 */
  chartGrid: "#404040",
  /** 차트 범례·제목 = neutral-200 */
  chartLegend: "#e5e5e5",
  /** 다크 배경용 스페이드 막대 = neutral-300 (원래 검정이던 것) */
  chartSpade: "#d4d4d4",
  /** 패널 배경 = neutral-800 */
  panelBg: "#262626",
};

/* T39 시안 미리보기(?t39=) — index.css의 [data-t39] 블록과 값이 짝.
 * 시안이 확정되면 선택된 값을 BASE로 승격하고 이 표는 지운다. */
const AB_NEUTRALS = {
  chartTick: "#a8a8b0", // neutral-400
  chartGrid: "#2a2a2e", // neutral-700
  chartLegend: "#e2e2e7", // neutral-200
  chartSpade: "#cacad0", // neutral-300
  panelBg: "#1d1d20", // neutral-800
};
const T39_VARIANTS: Record<string, Partial<typeof BASE>> = {
  a: { ...AB_NEUTRALS, accent: "#DFAC2A" },
  b: { ...AB_NEUTRALS, accent: "#D4AF37", brand: "#D4AF37" },
  c: {},
};

const t39 =
  typeof location !== "undefined"
    ? new URLSearchParams(location.search).get("t39")
    : null;

export const C: typeof BASE = {
  ...BASE,
  ...((t39 && T39_VARIANTS[t39]) || {}),
};
