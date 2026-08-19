/** @type {import('tailwindcss').Config} */

// T39 색 토큰: 팔레트 값은 src/index.css의 :root CSS 변수에서 나온다.
// 클래스 이름(bg-neutral-800 등)은 그대로 두고 값만 변수로 우회하므로
// 테마 교체는 CSS 변수만 바꾸면 된다. chart.js 쪽 상수는 src/theme.ts 참조.
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const scale = (palette) =>
  Object.fromEntries(SHADES.map((s) => [s, v(`${palette}-${s}`)]));

module.exports = {
  content: ["src/**/*.ts", "src/**/*.vue"],
  theme: {
    extend: {
      colors: {
        white: v("white"),
        neutral: scale("neutral"),
        yellow: scale("yellow"),
        blue: scale("blue"),
        // ⚠ gray는 토큰화하지 않는다 — @tailwindcss/forms가 select 화살표를
        // SVG data-URI에 gray.500을 «빌드 시점에 박아» 그리는데, var() 식은
        // SVG 안에서 해석되지 않아 화살표가 사라진다 (2026-08-19 픽셀 diff로 적발)
        brand: {
          DEFAULT: v("brand"),
          hover: v("brand-hover"),
          ink: v("brand-ink"),
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
