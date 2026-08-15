<template>
  <!--
    오류가 났을 때만 잠깐 뜨는 안내.
    목적은 «불편을 사과»가 아니라 «신고를 한 번에 끝내게 하는 것»이다.
    지금은 유저 화면에서 무슨 오류가 나는지 알 방법이 이것뿐이라, 신고 문턱을 최대한 낮춘다.
  -->
  <div
    v-if="errorState.toast"
    :class="
      'fixed z-50 bottom-0 inset-x-0 md:bottom-4 md:left-4 md:right-auto md:w-[24rem] ' +
      'border-t md:border md:rounded-lg border-orange-700/60 bg-neutral-800 shadow-2xl ' +
      'px-4 py-3 text-sm'
    "
  >
    <div class="flex items-start gap-3">
      <span class="text-orange-300 text-lg leading-none mt-0.5" aria-hidden="true">!</span>
      <div class="flex-grow min-w-0">
        <div class="font-semibold text-neutral-100">문제가 하나 기록됐습니다</div>
        <p class="mt-1 text-neutral-400 leading-relaxed">
          화면이 이상하게 보였다면 알려주세요. 내용은
          <b class="text-neutral-200">이 기기에만</b> 저장되고, 보낼지는 직접 정하시면 됩니다.
        </p>
        <div class="mt-2.5 flex gap-2 flex-wrap">
          <button class="button-blue px-3 py-1" @click="copy">
            {{ copied ? "복사됨" : "오류 내용 복사" }}
          </button>
          <button class="button-base px-3 py-1" @click="dismissErrorToast">닫기</button>
        </div>
        <p v-if="copied" class="mt-1.5 text-xs text-neutral-500 leading-relaxed">
          커뮤니티 문의글에 붙여넣어 주시면 고치는 데 씁니다. 개인 정보는 들어 있지 않습니다.
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { errorState, errorReportText, dismissErrorToast } from "../errors";

export default defineComponent({
  setup() {
    const copied = ref(false);

    const copy = async () => {
      try {
        await navigator.clipboard.writeText(errorReportText());
        copied.value = true;
      } catch {
        // 클립보드가 막힌 환경 — 선택 가능한 형태로 대신 보여준다
        window.prompt("아래 내용을 복사해 주세요", errorReportText());
      }
    };

    return { errorState, copied, copy, dismissErrorToast };
  },
});
</script>
