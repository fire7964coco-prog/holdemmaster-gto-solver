<template>
  <div class="solver-shell min-w-0" :style="{ height: clientHeight + 'px' }">
    <NavBar />

    <div
      v-show="store.navView === 'solver'"
      class="solver-workspace flex flex-col md:flex-row w-full mx-auto max-w-screen-xl"
      style="height: calc(100% - 2.5rem)"
    >
      <SideBar class="md:h-[calc(100%-2rem)]" />

      <div
        ref="solverContent"
        class="solver-content flex-grow min-w-0 min-h-0 my-2 md:my-4 px-3 md:px-6 pt-2 overflow-y-auto md:h-[calc(100%-2rem)]"
        :style="isHandReview ? { display: 'flex', flexDirection: 'column', flex: '1 1 0%', overflow: 'hidden' } : undefined /* R2_REVIEW_ONLY */"
      >
        <div class="flex">
          <h1
            ref="contentHeading"
            tabindex="-1"
            :class="
              'app-section-heading mb-3 md:mb-4 pl-2.5 pr-3 py-0.5 text-base font-semibold border-l-2 ' +
              'border-blue-600 rounded rounded-br-none'
            "
          >
            {{ header }}
          </h1>
        </div>

        <div v-if="store.sideView === 'about'">
          <AboutPage />
        </div>
        <div v-if="store.sideView === 'guide'">
          <GuidePage />
        </div>
        <div v-if="store.sideView === 'presets'">
          <PresetsPage />
        </div>
        <div v-if="store.sideView === 'trainer'">
          <TrainerPage />
        </div>
        <!-- R2_REVIEW_ONLY_START -->
        <div v-if="reviewMounted" v-show="isHandReview" class="flex-1 min-h-0">
          <HandReviewPage />
        </div>
        <!-- R2_REVIEW_ONLY_END -->
        <div v-if="store.sideView === 'preflop'">
          <PreflopChartPage />
        </div>
        <div v-if="store.sideView === 'equity'">
          <EquityPage />
        </div>
        <div v-show="store.sideView === 'oop-range' || store.sideView === 'ip-range'">
          <SpotPicker />
        </div>
        <div v-show="store.sideView === 'oop-range'">
          <RangeEditor :player="0" />
        </div>
        <div v-show="store.sideView === 'ip-range'">
          <RangeEditor :player="1" />
        </div>
        <div v-show="store.sideView === 'board'">
          <p v-if="boardNavigationError" class="mb-2 text-sm text-red-400" role="alert">{{ boardNavigationError }}</p>
          <BoardSelector />
        </div>
        <div v-show="store.sideView === 'tree-config'">
          <TreeConfig />
        </div>
        <div v-show="store.sideView === 'run-solver'">
          <RunSolver @board-required="showBoardError" />
        </div>
      </div>
    </div>

    <InstallBanner />
    <LaunchScreen />
    <ErrorToast />
    <!-- F1_FEEDBACK_ONLY_START -->
    <FeedbackForm v-if="feedbackFeatures.feedback && feedbackOpen" />
    <!-- F1_FEEDBACK_ONLY_END -->

    <div
      ref="resultsContent"
      tabindex="-1"
      v-show="store.navView === 'results'"
      class="results-workspace overflow-y-auto"
      style="height: calc(100% - 2.5rem)"
    >
      <ResultViewer class="result-workspace-content" />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, ref, watch } from "vue";
import { useStore, useConfigStore } from "../store";
import { applySpotFromUrl } from "../spot-share";
import { viewFromUrl } from "../pwa";
// 빌드 2벌 분기 — npokers 빌드에서는 스텁이 들어온다 (webpack alias, src/features/ 참조)
import { TrainerPage, PresetsPage, bootstrapAccount } from "@features";
import { HandReviewPage, handReviewLabels, FEATURE_TRAINER } from "@features"; // R2_REVIEW_ONLY
import { i18n } from "../i18n";

import NavBar from "./NavBar.vue";
import SideBar from "./SideBar.vue";
import AboutPage from "./AboutPage.vue";
import GuidePage from "./GuidePage.vue";
import PreflopChartPage from "./PreflopChartPage.vue";
import EquityPage from "./EquityPage.vue";
import RangeEditor from "./RangeEditor.vue";
import SpotPicker from "./SpotPicker.vue";
import BoardSelector from "./BoardSelector.vue";
import TreeConfig from "./TreeConfig.vue";
import RunSolver from "./RunSolver.vue";
import ResultViewer from "./ResultViewer.vue";
import InstallBanner from "./InstallBanner.vue";
import LaunchScreen from "./LaunchScreen.vue";
import ErrorToast from "./ErrorToast.vue";
import FeedbackForm from "./FeedbackForm.vue"; // F1_FEEDBACK_ONLY
import { feedbackFeatures } from "../solver-feedback-features"; // F1_FEEDBACK_ONLY
import { feedbackOpen, resumeFeedbackDraft } from "../solver-feedback"; // F1_FEEDBACK_ONLY
declare const __F1_TEST_BUILD__: boolean; // F1_FEEDBACK_ONLY

export default defineComponent({
  components: {
    NavBar,
    SideBar,
    AboutPage,
    GuidePage,
    PresetsPage,
    TrainerPage,
    HandReviewPage, // R2_REVIEW_ONLY
    PreflopChartPage,
    EquityPage,
    RangeEditor,
    SpotPicker,
    BoardSelector,
    TreeConfig,
    RunSolver,
    ResultViewer,
    InstallBanner,
    LaunchScreen,
    ErrorToast,
    FeedbackForm, // F1_FEEDBACK_ONLY
  },

  setup() {
    const store = useStore();
    if (__F1_TEST_BUILD__) void import("../solver-feedback-test").then(m => m.installFeedbackTestHooks(store)); // F1_FEEDBACK_ONLY
    const isHandReview = computed(() => FEATURE_TRAINER && store.sideView === "hand-review"); // R2_REVIEW_ONLY
    // 복기 → 연습 → 돌아오기에서 입력한 판이 지워지지 않게, 한 번 연 복기 화면은 숨기기만 한다. // R2_REVIEW_ONLY
    const reviewMounted = ref(false); // R2_REVIEW_ONLY
    watch(isHandReview, (open) => { if (open) reviewMounted.value = true; }, { immediate: true }); // R2_REVIEW_ONLY
    const config = useConfigStore();
    const solverContent = ref<HTMLElement | null>(null);
    const resultsContent = ref<HTMLElement | null>(null);
    const contentHeading = ref<HTMLElement | null>(null);
    const boardNavigationError = ref("");
    const positions = new Map<string, number>();
    const screenKey = computed(() => store.navView === "results" ? "results" : store.sideView);
    watch(screenKey, async (screen, previous) => {
      const previousContainer = previous === "results" ? resultsContent.value : solverContent.value;
      positions.set(previous, previousContainer?.scrollTop ?? 0);
      if (screen !== "board") boardNavigationError.value = "";
      await nextTick();
      const container = screen === "results" ? resultsContent.value : solverContent.value;
      const heading = screen === "board" && boardNavigationError.value
        ? document.getElementById("board-text-input")
        : screen === "results" ? resultsContent.value : contentHeading.value;
      heading?.focus({ preventScroll: true });
      if (container) container.scrollTop = positions.get(screen) ?? 0;
    }, { flush: "pre" });
    watch(() => config.board.slice(), () => { boardNavigationError.value = ""; });
    const showBoardError = (message: string) => {
      boardNavigationError.value = message;
      positions.delete("board");
      store.sideView = "board";
    };
    const HEADERS = {
      ko: {
        about: "소개",
        guide: "사용법 — 순서대로 따라하기",
        presets: "교육 예제 — 원클릭 스팟",
        trainer: "GTO 트레이너 — 선택의 EV를 확인하세요",
        preflop: "프리플랍 차트 — 오픈 & 수비 레인지",
        equity: "에퀴티 계산기 — 핸드·레인지 승률",
        "oop-range": "OOP 레인지",
        "ip-range": "IP 레인지",
        board: "보드",
        "tree-config": "트리 설정",
        "run-solver": "솔버 실행",
        treeEdit: "트리 미리보기 & 편집",
      },
      hi: {

        about: "परिचय",
        guide: "कैसे इस्तेमाल करें — कदम-दर-कदम",
        presets: "अभ्यास स्पॉट — एक क्लिक में उदाहरण",
        trainer: "GTO Trainer — हर फ़ैसले का EV देखें",
        preflop: "Preflop चार्ट — Open और defend ranges",
        equity: "Equity — हैंड और range की equity",
        "oop-range": "OOP Range",
        "ip-range": "IP Range",
        board: "Board",
        "tree-config": "Tree सेटिंग",
        "run-solver": "Solver चलाएँ",
        treeEdit: "Tree देखें और बदलें",
  },
      tr: {
        about: "Hakkında",
        guide: "Nasıl kullanılır — adım adım",
        presets: "Örnek spotlar — tek tıkla örnekler",
        trainer: "GTO Trainer — her kararın EV'sini gör",
        preflop: "Preflop tabloları — açılış ve savunma range'leri",
        equity: "Equity hesaplayıcı — el ve range equity'si",
        "oop-range": "OOP range",
        "ip-range": "IP range",
        board: "Board",
        "tree-config": "Ağaç ayarları",
        "run-solver": "Solver'ı çalıştır",
        treeEdit: "Ağacı önizle ve düzenle",
      },
      vi: {
        about: "Giới thiệu",
        guide: "Hướng dẫn sử dụng — từng bước",
        presets: "Spot mẫu — ví dụ một chạm",
        trainer: "Trainer GTO — xem EV của mọi quyết định",
        preflop: "Bảng preflop — range mở bài và phòng thủ",
        equity: "Tính equity — equity của tay bài và range",
        "oop-range": "Range OOP",
        "ip-range": "Range IP",
        board: "Board",
        "tree-config": "Cài đặt cây",
        "run-solver": "Chạy solver",
        treeEdit: "Xem trước và chỉnh sửa cây",
      },
      // 러시아어 — 확정표 §5-3 (sentence case)
      ru: {
        about: "О сервисе",
        guide: "Как пользоваться — шаг за шагом",
        presets: "Учебные споты — примеры в один клик",
        trainer: "GTO-тренажёр — смотри EV каждого решения",
        preflop: "Префлоп-чарты — диапазоны опена и защиты",
        equity: "Калькулятор эквити — эквити руки и диапазона",
        "oop-range": "Диапазон OOP",
        "ip-range": "Диапазон IP",
        board: "Борд",
        "tree-config": "Настройки дерева",
        "run-solver": "Запустить солвер",
        treeEdit: "Просмотр и правка дерева",
      },
      en: {
        about: "About",
        guide: "How to Use — Step by Step",
        presets: "Study Spots — One-Click Examples",
        trainer: "GTO Trainer — See the EV of Every Decision",
        preflop: "Preflop Charts — Opening & Defense Ranges",
        equity: "Equity Calculator — Hand & Range Equity",
        "oop-range": "OOP Range",
        "ip-range": "IP Range",
        board: "Board",
        "tree-config": "Tree Settings",
        "run-solver": "Run Solver",
        treeEdit: "Tree Preview & Edit",
      },
      ja: {
        about: "はじめに",
        guide: "使い方 — 手順どおりに進める",
        presets: "学習スポット — ワンクリック例題",
        trainer: "GTOトレーナー — 選択のEVを確認",
        preflop: "プリフロップレンジ表 — オープン & ディフェンス",
        equity: "エクイティ計算機 — ハンド・レンジの勝率",
        "oop-range": "OOPレンジ",
        "ip-range": "IPレンジ",
        board: "ボード",
        "tree-config": "ツリー設定",
        "run-solver": "ソルバーを実行",
        treeEdit: "ツリーのプレビュー & 編集",
      },
      es: {
        about: "Acerca de",
        guide: "Cómo usarlo — paso a paso",
        presets: "Spots de estudio — ejemplos con un clic",
        trainer: "Entrenador GTO — mira el EV de cada decisión",
        preflop: "Tablas preflop — rangos de open y defensa",
        equity: "Calculadora de equity — probabilidad de victoria",
        "oop-range": "Rango OOP",
        "ip-range": "Rango IP",
        board: "Board",
        "tree-config": "Ajustes del árbol",
        "run-solver": "Ejecutar solver",
        treeEdit: "Vista previa y edición del árbol",
      },
      pt: {
        about: "Sobre",
        guide: "Como usar — passo a passo",
        presets: "Spots de estudo — exemplos com um clique",
        trainer: "Treinador GTO — veja o EV de cada decisão",
        preflop: "Tabelas pré-flop — ranges de open e defesa",
        equity: "Calculadora de equity — probabilidade de vitória",
        "oop-range": "Range OOP",
        "ip-range": "Range IP",
        board: "Board",
        "tree-config": "Ajustes da árvore",
        "run-solver": "Executar solver",
        treeEdit: "Prévia e edição da árvore",
      },
      de: {
        about: "Über",
        guide: "Anleitung – Schritt für Schritt",
        presets: "Lernspots – Beispiele mit einem Klick",
        trainer: "GTO-Trainer – sieh den EV jeder Entscheidung",
        preflop: "Preflop-Charts – Open- und Defense-Ranges",
        equity: "Equity-Rechner – Gewinnchance für Hand und Range",
        "oop-range": "OOP-Range",
        "ip-range": "IP-Range",
        board: "Board",
        "tree-config": "Spielbaum-Einstellungen",
        "run-solver": "Solver starten",
        treeEdit: "Spielbaum – Vorschau & Bearbeiten",
      },
      // 중국어 破折号는 «두 칸»(——)이 국가표준(GB/T 15834)이다. 다른 언어의 «—»(1칸)·
      // 독일어의 «–»와 일부러 다르다. 破折号 앞뒤는 띄우지 않는다
      zh: {
        about: "简介",
        guide: "使用方法——按顺序照着做",
        presets: "教学案例——一键加载的示例",
        trainer: "GTO 训练器——看清每个选择的 EV",
        preflop: "翻前范围表——开池与防守范围",
        equity: "胜率计算器——手牌与范围的胜率",
        "oop-range": "OOP 范围",
        "ip-range": "IP 范围",
        board: "公共牌",
        "tree-config": "决策树设置",
        "run-solver": "运行求解器",
        treeEdit: "决策树——预览与编辑",
      },
      // 번체도 破折號는 «두 칸»(——)이다. 인용부호만 대만·홍콩 관습인 「 」로 간다
      // (간체의 “ ”와 «반대» — 본체 브리프 §8-4 「引號는 「」 통일」)
      "zh-hant": {
        about: "簡介",
        guide: "使用方法——照著順序做",
        presets: "教學案例——一鍵載入的範例",
        trainer: "GTO 訓練器——看清每個選擇的 EV",
        preflop: "翻前範圍表——開池與防守範圍",
        equity: "勝率計算器——手牌與範圍的勝率",
        "oop-range": "OOP 範圍",
        "ip-range": "IP 範圍",
        board: "公共牌",
        "tree-config": "決策樹設定",
        "run-solver": "執行解算器",
        treeEdit: "決策樹——預覽與編輯",
      },
      fr: {
        about: "À propos",
        guide: "Mode d'emploi — pas à pas",
        presets: "Spots d'étude — exemples en un clic",
        trainer: "Trainer GTO — l'EV de chaque décision",
        preflop: "Charts préflop — ranges d'open et de défense",
        equity: "Calculateur d'equity — equity de main et de range",
        "oop-range": "Range OOP",
        "ip-range": "Range IP",
        board: "Board",
        "tree-config": "Réglages de l'arbre",
        "run-solver": "Lancer le solver",
        treeEdit: "Aperçu et édition de l'arbre",
      },
      id: {
        about: "Tentang",
        guide: "Cara pakai — langkah demi langkah",
        presets: "Spot belajar — contoh siap pakai, sekali klik",
        trainer: "Trainer GTO — lihat EV setiap keputusan Anda",
        preflop: "Chart preflop — range open dan defend",
        equity: "Kalkulator equity — equity hand dan range",
        "oop-range": "Range OOP",
        "ip-range": "Range IP",
        board: "Board",
        "tree-config": "Pengaturan tree",
        "run-solver": "Jalankan Solver",
        treeEdit: "Pratinjau & Edit Tree",
      },
      ms: {
        about: "Tentang",
        guide: "Cara guna — langkah demi langkah",
        presets: "Spot belajar — contoh sedia guna, satu klik",
        trainer: "Trainer GTO — lihat EV setiap keputusan anda",
        preflop: "Carta preflop — range open dan defend",
        equity: "Kalkulator equity — equity tangan dan range",
        "oop-range": "Range OOP",
        "ip-range": "Range IP",
        board: "Board",
        "tree-config": "Tetapan tree",
        "run-solver": "Jalankan Solver",
        treeEdit: "Pratonton & Sunting Tree",
      },
    } as const;
    const header = computed(() => {
      const messages = HEADERS[i18n.locale];
      if (store.sideView === "hand-review") return FEATURE_TRAINER ? handReviewLabels(i18n.locale).title : ""; // R2_REVIEW_ONLY
      const base = messages[store.sideView];
      return store.sideView === "tree-config" && store.treeEditOpen
        ? `${base} > ${messages.treeEdit}`
        : base;
    });

    // 로그인에서 돌아온 경우: 세션을 먼저 회수하고 주소를 정리한 뒤 트레이너로 복귀.
    // (앱 진입 화면은 소개라, 트레이너 화면에서만 처리하면 인증 코드를 놓친다)
    void bootstrapAccount().then((returned) => {
      if (returned) store.sideView = "trainer";
      if (returned && feedbackFeatures.feedback) void resumeFeedbackDraft(); // F1_FEEDBACK_ONLY
    });

    // 공유 링크(?spot=)로 들어온 경우 설정을 적용하고 실행 화면으로
    if (applySpotFromUrl()) {
      store.sideView = "run-solver";
      store.sharedSpotLoaded = true;
      history.replaceState(null, "", location.pathname);
    } else {
      // 홈 화면 아이콘·바로가기(?view=trainer 등)로 들어온 경우 그 화면부터 연다.
      // 공유 링크가 우선이므로 없을 때만 본다.
      const view = viewFromUrl();
      if (view) {
        store.sideView = view;
        history.replaceState(null, "", location.pathname);
      } else if (new URLSearchParams(location.search).has("lang")) {
        // ?lang=은 i18n.ts가 이미 읽어 저장했다 — 주소만 정리
        history.replaceState(null, "", location.pathname);
      }
    }

    const clientHeight = ref(0);

    const updateClientHeight = () => {
      clientHeight.value = Math.min(
        document.documentElement.clientHeight - 0.01,
        Math.max(document.documentElement.clientWidth, 1080) * 0.8
      );
    };

    updateClientHeight();
    window.addEventListener("resize", updateClientHeight);

    return {
      store,
      feedbackFeatures, feedbackOpen, // F1_FEEDBACK_ONLY
      isHandReview, // R2_REVIEW_ONLY
      reviewMounted, // R2_REVIEW_ONLY
      header,
      clientHeight,
      solverContent,
      resultsContent,
      contentHeading,
      boardNavigationError,
      showBoardError,
    };
  },
});
</script>
