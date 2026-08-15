<template>
  <div
    v-if="pwa.showBanner"
    :class="
      'fixed z-40 bottom-0 inset-x-0 md:bottom-4 md:right-4 md:left-auto md:w-[26rem] ' +
      'border-t md:border md:rounded-lg border-neutral-600 bg-neutral-800 shadow-2xl ' +
      'px-4 py-3 text-sm'
    "
  >
    <div class="flex items-start gap-3">
      <img
        src="/icons/icon-192.png"
        alt="홀덤마스터 GTO 솔버 아이콘"
        class="w-10 h-10 rounded-lg shrink-0 mt-0.5"
      />

      <div class="flex-grow min-w-0">
        <div class="font-semibold text-neutral-100">홈 화면에 추가할까요?</div>

        <p v-if="!pwa.isIOS" class="mt-1 text-neutral-300 leading-relaxed">
          아이콘 하나로 바로 열리고, <b class="text-neutral-100">교육 예제 13종과 트레이너를
          기기에 저장</b>해 인터넷이 없는 곳에서도 공부할 수 있습니다.
        </p>
        <p v-else class="mt-1 text-neutral-300 leading-relaxed">
          아래 <b class="text-neutral-100">공유 버튼</b>을 누른 뒤
          <b class="text-neutral-100">「홈 화면에 추가」</b>를 선택하세요. 아이콘 하나로 바로
          열리고, 교육 예제와 트레이너를 저장해 인터넷 없이도 공부할 수 있습니다.
        </p>

        <div class="mt-2.5 flex gap-2">
          <button v-if="!pwa.isIOS" class="button-blue px-3 py-1" @click="promptInstall">
            홈 화면에 추가
          </button>
          <button class="button-base px-3 py-1" @click="dismissBanner">
            {{ pwa.isIOS ? "알겠습니다" : "나중에" }}
          </button>
        </div>
      </div>

      <button
        class="text-neutral-400 hover:text-neutral-200 leading-none"
        title="닫기"
        @click="dismissBanner"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { pwa, promptInstall, dismissBanner } from "../pwa";

export default defineComponent({
  setup() {
    return { pwa, promptInstall, dismissBanner };
  },
});
</script>
