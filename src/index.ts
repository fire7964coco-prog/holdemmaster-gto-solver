import { createApp } from "vue";
import { createPinia } from "pinia";
import { localizeNumber, decimalMark, pctText } from "./i18n";
import App from "./components/App.vue";
import { setupPwa } from "./pwa";
import { setupErrorCapture } from "./errors";
import { setupAnalytics } from "./usage-analytics";
import "./index.css";
import "tippy.js/dist/tippy.css";

// 이용 계측 — 오류 수집보다 먼저(자기 스크립트의 로딩 실패를 오류로 남기지 않게) · 주소를 정리하는 마운트보다 먼저
setupAnalytics();

// 오류 수집을 가장 먼저 붙인다 — 마운트 도중 나는 오류도 잡아야 한다
setupErrorCapture();

const app = createApp(App);
// 화면 수치의 소수점을 언어에 맞추는 도우미 — 템플릿에서 $n(...)으로 쓴다
app.config.globalProperties.$n = localizeNumber;
app.config.globalProperties.$d = decimalMark;
// 퍼센트 표기 — tr만 «%35», 나머지는 «35%» 그대로 (튀르키예어화 확정표 §2-2)
app.config.globalProperties.$pct = pctText;
app.use(createPinia()).mount("#app");

// 서비스워커 등록 + 설치 배너 조건 감시 (앱 마운트 뒤에 붙인다)
setupPwa();
