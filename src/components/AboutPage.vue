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
        홀덤마스터 커뮤니티
      </div>
      <h1
        class="silver-text mt-1.5 text-4xl md:text-5xl font-bold tracking-tight leading-[1.15]"
      >
        GTO 전략,<br />
        브라우저에서 바로.
      </h1>
      <p class="mt-4 text-base md:text-lg text-neutral-400 leading-relaxed">
        <!-- 아래에 «홈 화면에 설치» 버튼이 붙으므로 «설치 파일»이라고 못박는다 -->
        설치 파일도, 결제도 없습니다. 레인지와 보드를 넣으면<br
          class="hidden md:block"
        />
        상황별 최적 전략을 내 컴퓨터에서 직접 계산합니다.
      </p>

      <div class="flex flex-wrap items-center gap-3 mt-7">
        <button
          class="px-5 py-2.5 rounded-full bg-white text-neutral-900 text-sm font-semibold transition hover:bg-neutral-200"
          @click="store.sideView = 'presets'"
        >
          예제 결과 바로 보기
        </button>
        <button
          class="px-5 py-2.5 rounded-full text-sm font-semibold text-neutral-200 border border-white/15 transition hover:bg-white/5"
          @click="store.sideView = 'trainer'"
        >
          GTO 트레이너
        </button>
        <button
          class="px-5 py-2.5 rounded-full text-sm font-semibold text-neutral-200 border border-white/15 transition hover:bg-white/5"
          @click="store.sideView = 'guide'"
        >
          사용법 보기
        </button>
        <!-- 설치 가능한 환경에서만 노출 (이미 설치해서 실행 중이면 숨김) -->
        <button
          v-if="canShowInstallButton()"
          :class="
            'px-5 py-2.5 rounded-full text-sm font-semibold transition ' +
            'text-[#04160C] bg-[#DFAC2A] hover:bg-[#e8bb4a] flex items-center gap-2'
          "
          @click="requestInstall"
        >
          <span aria-hidden="true">&#9824;</span>
          홈 화면에 설치
        </button>
      </div>
      <p v-if="canShowInstallButton()" class="mt-2.5 text-xs text-neutral-500">
        설치하면 교육 예제와 트레이너가 기기에 저장돼 인터넷이 끊겨도 문제를 풀 수 있습니다.
        프로그램이 아니라 브라우저 바로가기라 권한을 요구하지 않습니다 —
        <button class="underline hover:text-neutral-300" @click="store.sideView = 'guide'">
          안전한가요?
        </button>
      </p>
    </div>

    <!-- 특징 -->
    <div
      class="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 mt-12 md:mt-16"
    >
      <div v-for="f in features" :key="f.title" class="pt-4 border-t border-white/10">
        <div class="text-sm font-semibold text-white">{{ f.title }}</div>
        <div class="mt-1 text-[0.8125rem] leading-relaxed text-neutral-500">
          {{ f.desc }}
        </div>
      </div>
    </div>

    <!-- 시작 안내 -->
    <div class="mt-12 md:mt-16 rounded-2xl bg-white/[0.04] border border-white/10 p-6">
      <div class="text-sm font-semibold text-white">처음이라면</div>
      <div class="mt-4 space-y-3">
        <div v-for="(s, i) in steps" :key="i" class="flex items-baseline gap-3">
          <span
            class="shrink-0 w-5 text-right text-sm font-semibold text-yellow-300/90 tabular-nums"
            >{{ i + 1 }}</span
          >
          <span class="text-sm text-neutral-300">{{ s }}</span>
        </div>
      </div>
      <!-- 본체 랜딩(정보형 콘텐츠)으로 연결 — 앱은 도구, 랜딩은 설명 역할 분담 -->
      <div class="mt-5 pt-4 border-t border-white/10 text-[0.8125rem] text-neutral-500">
        GTO 솔버가 무엇인지, 결과를 어떻게 읽는지 글로 먼저 보고 싶다면
        <a
          :href="landingUrl"
          class="text-neutral-300 underline decoration-neutral-600 underline-offset-2 hover:text-white"
          target="_blank"
          >홀덤마스터 솔버 소개·사용법</a
        >을 참고하세요.
      </div>
    </div>

    <!-- 알아둘 점 + 크레딧 -->
    <div class="mt-12 pt-5 border-t border-white/10 text-[0.8125rem] leading-relaxed text-neutral-500">
      <p>
        iOS·Safari에서는 브라우저 제약으로 단일 스레드로 동작해 계산이
        느립니다 — macOS에서는 Chrome을 권장합니다. 사용 가능한 메모리는
        4GB로 제한되며(WebAssembly 한계), 큰 스팟의 직접 계산은 PC에서 더
        쾌적합니다.
      </p>
      <p class="mt-3">
        이 프로그램은
        <a
          href="https://github.com/b-inary/wasm-postflop"
          class="text-neutral-400 underline decoration-neutral-600 underline-offset-2 hover:text-neutral-200"
          target="_blank"
          >WASM Postflop</a
        >
        (Wataru Inariba 작, AGPL-3.0)을 기반으로
        <a
          :href="creditUrl"
          class="text-neutral-400 underline decoration-neutral-600 underline-offset-2 hover:text-neutral-200"
          target="_blank"
          >홀덤마스터</a
        >가 한국어화·개선한 버전이며, 수정된 전체 소스코드는
        <a
          href="https://github.com/fire7964coco-prog/holdemmaster-gto-solver"
          class="text-neutral-400 underline decoration-neutral-600 underline-offset-2 hover:text-neutral-200"
          target="_blank"
          >GitHub</a
        >에 동일한 라이선스로 공개되어 있습니다.
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { requestInstall, canShowInstallButton } from "../pwa";
import { useStore } from "../store";
import { mainSiteUrl } from "../outbound";

export default defineComponent({
  setup() {
    const features = [
      { title: "무료", desc: "횟수 제한 없이 모든 기능을 그대로" },
      // 「설치 없음」은 홈 화면 설치를 넣은 뒤로 앞뒤가 안 맞아 뺐다 (2026-08-15)
      { title: "오프라인 학습", desc: "홈 화면에 설치하면 인터넷 없이도" },
      { title: "빠른 계산", desc: "멀티스레드로 데스크톱 솔버 수준" },
      { title: "GTO 트레이너", desc: "문제를 풀고 EV 손실로 채점받기" },
    ];

    const steps = [
      "교육 예제에서 아무 스팟이나 [결과 바로 보기] — 기다림 없이 결과가 나옵니다",
      "사용법에서 결과 화면 읽는 법을 확인하세요",
      "GTO 트레이너에서 문제를 풀어보세요 — 내 선택이 몇 bb 손해인지 알려줍니다",
      "익숙해지면 커스텀 스팟(①~⑤)으로 내 핸드를 직접 계산해보세요",
    ];

    return {
      store: useStore(),
      features,
      steps,
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
    #ffffff 0%,
    #e5e5e5 35%,
    #a3a3a3 75%,
    #8a8a8a 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
