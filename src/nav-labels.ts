/*
 * 상단 네비게이션 «결과» 탭 이름 — 두 곳이 같은 글자를 써야 해서 여기로 뺐다.
 *
 * 왜 모듈로 뺐나 (2026-09-12): 계산이 끝난 뒤 «결과»로 보내는 버튼을 RunSolver에 넣었는데,
 * 버튼 글자가 탭 이름과 한 글자라도 다르면 «어디로 가는 버튼인지»가 흐려진다.
 * NavBar 안의 const M에 갇혀 있던 값을 그대로 옮겼을 뿐 — **새 문구가 아니다**
 * (12언어 문자열 축어 동일 · 검수장 전표 대상 아님).
 *
 * ⚠ 문구 사전은 컴포넌트 안에 두는 것이 이 앱의 원칙이다(i18n.ts 머리말). 여기는 예외다 —
 *   «두 컴포넌트가 반드시 같아야 하는 한 글자»만 둔다. 다른 라벨을 여기로 모으지 말 것.
 */
import type { Locale } from "./i18n";

export const navResults: Record<Locale, string> = {
  ko: "결과",
  en: "Results",
  ja: "結果",
  es: "Resultados",
  pt: "Resultados",
  de: "Ergebnisse",
  zh: "结果",
  "zh-hant": "結果",
  fr: "Résultats",
  id: "Hasil",
  ms: "Hasil",
  hi: "परिणाम",
};
