import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./components/App.vue";
import { setupPwa } from "./pwa";
import { setupErrorCapture } from "./errors";
import "./index.css";
import "tippy.js/dist/tippy.css";

// 오류 수집을 가장 먼저 붙인다 — 마운트 도중 나는 오류도 잡아야 한다
setupErrorCapture();

// T39 디자인 시안 미리보기 스위치 (?t39=a|b|c) — 시안 확정 전까지의 임시 장치.
// CSS 변수 오버라이드는 index.css의 [data-t39] 블록, 차트 쪽은 theme.ts가 같은 값을 따른다.
{
  const t39 = new URLSearchParams(location.search).get("t39");
  if (t39 && ["a", "b", "c"].includes(t39)) {
    document.documentElement.dataset.t39 = t39;
  }
}

createApp(App).use(createPinia()).mount("#app");

// 서비스워커 등록 + 설치 배너 조건 감시 (앱 마운트 뒤에 붙인다)
setupPwa();
