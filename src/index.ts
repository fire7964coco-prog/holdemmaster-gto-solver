import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./components/App.vue";
import { setupPwa } from "./pwa";
import "./index.css";
import "tippy.js/dist/tippy.css";

createApp(App).use(createPinia()).mount("#app");

// 서비스워커 등록 + 설치 배너 조건 감시 (앱 마운트 뒤에 붙인다)
setupPwa();
