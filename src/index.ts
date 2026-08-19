import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./components/App.vue";
import { setupPwa } from "./pwa";
import { setupErrorCapture } from "./errors";
import "./index.css";
import "tippy.js/dist/tippy.css";

// 오류 수집을 가장 먼저 붙인다 — 마운트 도중 나는 오류도 잡아야 한다
setupErrorCapture();

createApp(App).use(createPinia()).mount("#app");

// 서비스워커 등록 + 설치 배너 조건 감시 (앱 마운트 뒤에 붙인다)
setupPwa();
