<template>
  <div class="max-w-3xl">
    <!-- 히어로 -->
    <div>
      <!-- 은색 스페이드 심볼 -->
      <div
        class="silver-text text-6xl md:text-7xl leading-none select-none"
        aria-hidden="true"
      >
        ♠
      </div>
      <div class="mt-4 text-sm font-semibold text-neutral-500 tracking-wide">
        {{ L.community }}
      </div>
      <h1
        class="silver-text mt-1.5 text-4xl md:text-5xl font-bold tracking-tight leading-[1.15]"
      >
        {{ L.heroTitle1 }}<br />
        {{ L.heroTitle2 }}
      </h1>
      <p class="mt-4 text-base md:text-lg text-neutral-400 leading-relaxed">
        <!-- 아래에 «홈 화면에 설치» 버튼이 붙으므로 «설치 파일»이라고 못박는다 -->
        {{ L.heroSub1 }}<br class="hidden md:block" />
        {{ L.heroSub2 }}
      </p>

      <div class="flex flex-wrap items-center gap-3 mt-7">
        <button
          class="px-5 py-2.5 rounded-full bg-white text-neutral-900 text-sm font-semibold transition hover:bg-neutral-200"
          @click="store.sideView = 'presets'"
        >
          {{ L.ctaPresets }}
        </button>
        <button
          class="px-5 py-2.5 rounded-full text-sm font-semibold text-neutral-200 border border-white/15 transition hover:bg-white/5"
          @click="store.sideView = 'trainer'"
        >
          {{ L.ctaTrainer }}
        </button>
        <!-- 매일 하나뿐이라 «오늘 건 풀었나»가 돌아올 이유가 된다 -->
        <button
          class="px-5 py-2.5 rounded-full text-sm font-semibold text-neutral-200 border border-white/15 transition hover:bg-white/5 flex items-center gap-2"
          @click="store.sideView = 'trainer'"
        >
          {{ L.ctaDaily }}
          <span v-if="dailyState.done" class="text-emerald-400" :aria-label="L.dailyDone">✓</span>
          <span v-else class="text-brand">●</span>
        </button>
        <button
          class="px-5 py-2.5 rounded-full text-sm font-semibold text-neutral-200 border border-white/15 transition hover:bg-white/5"
          @click="store.sideView = 'guide'"
        >
          {{ L.ctaGuide }}
        </button>
        <!-- 설치 가능한 환경에서만 노출 (이미 설치해서 실행 중이면 숨김) -->
        <button
          v-if="canShowInstallButton()"
          :class="
            'px-5 py-2.5 rounded-full text-sm font-semibold transition ' +
            'text-brand-ink bg-brand hover:bg-brand-hover flex items-center gap-2'
          "
          @click="requestInstall"
        >
          <span aria-hidden="true">&#9824;</span>
          {{ L.ctaInstall }}
        </button>
      </div>
      <p v-if="canShowInstallButton()" class="mt-2.5 text-xs text-neutral-500">
        {{ L.installNote }}
        <button class="underline hover:text-neutral-300" @click="store.sideView = 'guide'">
          {{ L.installSafe }}
        </button>
      </p>
    </div>

    <!-- 특징 -->
    <!-- 특징: 헤어라인 나열 → 패널로 묶어 다른 화면(트레이너·사용법)과 결을 맞춤 -->
    <div class="panel mt-10 md:mt-14">
      <!-- 본문 폭이 48rem이라 4열은 «데스크톱 솔 / 버 수준»처럼 어색하게 끊긴다 -->
      <div class="grid grid-cols-2 gap-x-8 gap-y-5">
        <div v-for="f in L.features" :key="f.title">
          <div class="text-sm font-semibold text-neutral-100">{{ f.title }}</div>
          <div class="mt-1 text-[0.8125rem] leading-relaxed text-neutral-500">
            {{ f.desc }}
          </div>
        </div>
      </div>
    </div>

    <!-- 시작 안내 -->
    <div class="panel mt-6">
      <div class="section-title">{{ L.stepsTitle }}</div>
      <div class="mt-3.5 space-y-3">
        <div v-for="(s, i) in L.steps" :key="i" class="flex items-baseline gap-3">
          <span
            class="shrink-0 w-5 text-right text-sm font-semibold text-yellow-300/90 tabular-nums"
            >{{ i + 1 }}</span
          >
          <span class="text-sm text-neutral-300">{{ s }}</span>
        </div>
      </div>
      <!-- 본체 랜딩(정보형 콘텐츠)으로 연결 — 앱은 도구, 랜딩은 설명 역할 분담 -->
      <div class="mt-5 pt-4 border-t border-neutral-700 text-[0.8125rem] text-neutral-500">
        {{ L.landingBefore }}
        <a
          :href="landingUrl"
          class="text-neutral-300 underline decoration-neutral-600 underline-offset-2 hover:text-white"
          target="_blank"
          >{{ L.landingLink }}</a
        >{{ L.landingAfter }}
      </div>
    </div>

    <!-- 알아둘 점 + 크레딧 -->
    <div class="mt-12 pt-5 border-t border-white/10 text-[0.8125rem] leading-relaxed text-neutral-500">
      <p>
        {{ L.notes }}
      </p>
      <p class="mt-3">
        {{ L.creditBefore }}
        <a
          href="https://github.com/b-inary/wasm-postflop"
          class="text-neutral-400 underline decoration-neutral-600 underline-offset-2 hover:text-neutral-200"
          target="_blank"
          >WASM Postflop</a
        >{{ L.creditMid1 }}
        <a
          :href="creditUrl"
          class="text-neutral-400 underline decoration-neutral-600 underline-offset-2 hover:text-neutral-200"
          target="_blank"
          >{{ L.creditBrand }}</a
        >{{ L.creditMid2 }}
        <a
          href="https://github.com/fire7964coco-prog/holdemmaster-gto-solver"
          class="text-neutral-400 underline decoration-neutral-600 underline-offset-2 hover:text-neutral-200"
          target="_blank"
          >GitHub</a
        >{{ L.creditAfter }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { requestInstall, canShowInstallButton } from "../pwa";
import { dailyState, loadDailyState } from "../daily";
import { useStore } from "../store";
import { mainSiteUrl } from "../outbound";
import { i18n } from "../i18n";

const M = {
  ko: {
    community: "홀덤마스터 커뮤니티",
    heroTitle1: "GTO 전략,",
    heroTitle2: "브라우저에서 바로.",
    heroSub1: "설치 파일도, 결제도 없습니다. 레인지와 보드를 넣으면",
    heroSub2: "상황별 최적 전략을 내 컴퓨터에서 직접 계산합니다.",
    ctaPresets: "예제 결과 바로 보기",
    ctaTrainer: "GTO 트레이너",
    ctaDaily: "오늘의 문제",
    dailyDone: "완료",
    ctaGuide: "사용법 보기",
    ctaInstall: "홈 화면에 설치",
    installNote:
      "설치하면 교육 예제와 트레이너가 기기에 저장돼 인터넷이 끊겨도 문제를 풀 수 있습니다. 프로그램이 아니라 브라우저 바로가기라 권한을 요구하지 않습니다 —",
    installSafe: "안전한가요?",
    features: [
      { title: "무료", desc: "횟수 제한 없이 모든 기능을 그대로" },
      // 「설치 없음」은 홈 화면 설치를 넣은 뒤로 앞뒤가 안 맞아 뺐다 (2026-08-15)
      { title: "오프라인 학습", desc: "홈 화면에 설치하면 인터넷 없이도" },
      { title: "빠른 계산", desc: "멀티스레드로 데스크톱 솔버 수준" },
      { title: "GTO 트레이너", desc: "문제를 풀고 EV 손실로 채점받기" },
    ],
    stepsTitle: "처음이라면",
    steps: [
      "교육 예제에서 아무 스팟이나 [결과 바로 보기] — 기다림 없이 결과가 나옵니다",
      "사용법에서 결과 화면 읽는 법을 확인하세요",
      "GTO 트레이너에서 문제를 풀어보세요 — 내 선택이 몇 bb 손해인지 알려줍니다",
      "익숙해지면 커스텀 스팟(①~⑤)으로 내 핸드를 직접 계산해보세요",
    ],
    landingBefore: "GTO 솔버가 무엇인지, 결과를 어떻게 읽는지 글로 먼저 보고 싶다면",
    landingLink: "홀덤마스터 솔버 소개·사용법",
    landingAfter: "을 참고하세요.",
    notes:
      "iOS·Safari에서는 브라우저 제약으로 단일 스레드로 동작해 계산이 느립니다 — macOS에서는 Chrome을 권장합니다. 사용 가능한 메모리는 4GB로 제한되며(WebAssembly 한계), 큰 스팟의 직접 계산은 PC에서 더 쾌적합니다.",
    creditBefore: "이 프로그램은",
    creditMid1: " (Wataru Inariba 작, AGPL-3.0)을 기반으로",
    creditBrand: "홀덤마스터",
    creditMid2: "가 한국어화·개선한 버전이며, 수정된 전체 소스코드는",
    creditAfter: "에 동일한 라이선스로 공개되어 있습니다.",
  },
  en: {
    community: "HoldemMaster Community",
    heroTitle1: "GTO strategy,",
    heroTitle2: "right in your browser.",
    heroSub1: "Nothing to install, nothing to pay. Enter your ranges and a board,",
    heroSub2: "and the optimal strategy is solved right on your own device.",
    ctaPresets: "View Solved Examples",
    ctaTrainer: "GTO Trainer",
    ctaDaily: "Daily Puzzle",
    dailyDone: "Done",
    ctaGuide: "How to Use",
    ctaInstall: "Add to Home Screen",
    installNote:
      "Installing saves the study spots and trainer to your device, so you can keep practicing even when you're offline. It's a browser shortcut, not a program — it never asks for any permissions.",
    installSafe: "Is it safe?",
    features: [
      { title: "Free", desc: "Every feature, no usage limits" },
      { title: "Offline Study", desc: "Add it to your home screen and practice without internet" },
      { title: "Fast Solving", desc: "Multithreaded — desktop-solver speed" },
      { title: "GTO Trainer", desc: "Play spots and get graded by EV loss" },
    ],
    stepsTitle: "New here?",
    steps: [
      "Open any spot under Study Spots and hit [View Results] — solutions appear instantly",
      "Check How to Use to learn how to read the results screen",
      "Try the GTO Trainer — it shows exactly how many bb each decision costs you",
      "Once you're comfortable, solve your own hands with Custom Spot (①~⑤)",
    ],
    landingBefore:
      "Prefer to read up first on what a GTO solver is and how to interpret the output? See",
    landingLink: "the HoldemMaster solver guide",
    landingAfter: ".",
    notes:
      "On iOS and Safari, browser limitations force single-threaded solving, so it runs slower — on macOS we recommend Chrome. Available memory is capped at 4GB (a WebAssembly limit), so solving big spots yourself is smoother on a PC.",
    creditBefore: "This app is based on",
    creditMid1: " (by Wataru Inariba, AGPL-3.0), localized and enhanced by",
    creditBrand: "HoldemMaster",
    creditMid2: ". The full modified source code is published on",
    creditAfter: " under the same license.",
  },
} as const;

export default defineComponent({
  setup() {
    const L = computed(() => M[i18n.locale]);

    loadDailyState();

    return {
      store: useStore(),
      dailyState,
      L,
      requestInstall,
      canShowInstallButton,
      landingUrl: mainSiteUrl("/solver", "about-landing"),
      creditUrl: mainSiteUrl("", "about-credit"),
    };
  },
});
</script>

<style scoped>
/* 애플식 메탈릭 실버 — 위에서 아래로 밝은 은색 → 어두운 은색 */
.silver-text {
  background-image: linear-gradient(
    180deg,
    rgb(var(--c-metal-1)) 0%,
    rgb(var(--c-metal-2)) 35%,
    rgb(var(--c-metal-4)) 75%,
    rgb(var(--c-metal-5)) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
