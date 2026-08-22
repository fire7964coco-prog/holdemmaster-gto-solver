<template>
  <!--
    실행 인사 화면 — 홈 화면 아이콘으로 열었을 때만 잠깐 뜬다.
    브라우저가 manifest로 만드는 기본 스플래시(같은 앰버 배경)에 곧바로 이어지도록
    배경색을 맞춰서, 두 화면이 하나처럼 보이게 했다.
    검색으로 들어온 웹 방문자에게는 지연일 뿐이라 띄우지 않는다.
  -->
  <Transition name="launch">
    <div
      v-if="pwa.showLaunch"
      class="launch-screen"
      role="presentation"
      @click="closeLaunch"
    >
      <div class="px-8 pt-24 text-left w-full max-w-md mx-auto">
        <div class="text-3xl font-bold text-brand-ink/70 leading-tight">
          {{ L.greeting }}
        </div>
        <div class="mt-1 text-[2rem] md:text-4xl font-extrabold text-brand-ink leading-tight">
          {{ L.titleLine1 }}<br />{{ L.titleLine2 }}
        </div>
      </div>

      <div class="flex-grow flex items-center justify-center">
        <!-- 아이콘 판(앰버)이 배경과 겹치므로 스페이드만 그린다 -->
        <svg
          viewBox="0 0 180 180"
          class="w-28 h-28"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M90 22 C 90 22, 36 56, 36 88 C 36 112, 60 122, 90 110
               C 77 124, 74 142, 70 154 L110 154 C 106 142, 103 124, 90 110
               C 120 122, 144 112, 144 88 C 144 56, 90 22, 90 22 Z"
            class="fill-brand-ink"
          />
        </svg>
      </div>

      <div class="pb-14 text-center text-sm font-semibold text-brand-ink/60">
        {{ L.footer }}
      </div>
    </div>
  </Transition>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { pwa, closeLaunch } from "../pwa";
import { i18n } from "../i18n";

const M = {
  ko: {
    greeting: "안녕하세요",
    titleLine1: "홀덤마스터",
    titleLine2: "GTO 솔버입니다.",
    footer: "무료 GTO 솔버 · 오프라인 학습",
  },
  en: {
    greeting: "Welcome to",
    titleLine1: "HoldemMaster",
    titleLine2: "GTO Solver.",
    footer: "Free GTO Solver · Works Offline",
  },
  ja: {
    greeting: "ようこそ",
    titleLine1: "HoldemMaster",
    titleLine2: "GTOソルバーへ。",
    footer: "無料GTOソルバー・オフライン学習",
  },
  es: {
    greeting: "Te damos la bienvenida a",
    titleLine1: "HoldemMaster",
    titleLine2: "GTO Solver.",
    footer: "Solver GTO gratis · Funciona offline",
  },
  pt: {
    greeting: "Boas-vindas ao",
    titleLine1: "HoldemMaster",
    titleLine2: "GTO Solver.",
    footer: "Solver GTO grátis · Funciona offline",
  },
  de: {
    greeting: "Willkommen bei",
    titleLine1: "HoldemMaster",
    titleLine2: "GTO Solver.",
    footer: "Kostenloser GTO-Solver · Offline nutzbar",
  },
  zh: {
    greeting: "欢迎使用",
    titleLine1: "HoldemMaster",
    // 중국어 제목 줄에는 마침표를 찍지 않는다 (ko·en·de의 「.」와 «일부러» 다르다)
    titleLine2: "GTO 求解器",
    footer: "免费 GTO 求解器 · 可离线使用",
  },
  "zh-hant": {
    greeting: "歡迎使用",
    titleLine1: "HoldemMaster",
    // 중국어 제목 줄에는 마침표를 찍지 않는다 (ko·en·de의 「.」와 «일부러» 다르다)
    titleLine2: "GTO 解算器",
    footer: "免費 GTO 解算器 · 可離線使用",
  },
} as const;

export default defineComponent({
  setup() {
    const L = computed(() => M[i18n.locale]);
    return { pwa, closeLaunch, L };
  },
});
</script>

<style scoped>
.launch-screen {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  /* manifest의 background_color와 같은 값 — 기본 스플래시와 이어 붙이기 위함 */
  background-color: rgb(var(--c-brand));
}

.launch-leave-active {
  transition: opacity 0.35s ease;
}
.launch-leave-to {
  opacity: 0;
}
</style>
