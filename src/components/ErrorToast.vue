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
        <div class="font-semibold text-neutral-100">{{ L.title }}</div>
        <p class="mt-1 text-neutral-400 leading-relaxed">
          {{ L.body1 }}<b class="text-neutral-200">{{ L.bodyB1 }}</b
          >{{ L.body2 }}
        </p>
        <div class="mt-2.5 flex gap-2 flex-wrap">
          <button class="button-blue px-3 py-1" @click="copy">
            {{ copied ? L.copied : L.copyButton }}
          </button>
          <button class="button-base px-3 py-1" @click="dismissErrorToast">
            {{ L.close }}
          </button>
        </div>
        <p v-if="copied" class="mt-1.5 text-xs text-neutral-500 leading-relaxed">
          {{ L.copiedHint }}
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { errorState, errorReportText, dismissErrorToast } from "../errors";
import { i18n } from "../i18n";

const M = {
  ko: {
    title: "문제가 하나 기록됐습니다",
    body1: "화면이 이상하게 보였다면 알려주세요. 내용은 ",
    bodyB1: "이 기기에만",
    body2: " 저장되고, 보낼지는 직접 정하시면 됩니다.",
    copied: "복사됨",
    copyButton: "오류 내용 복사",
    close: "닫기",
    copiedHint:
      "커뮤니티 문의글에 붙여넣어 주시면 고치는 데 씁니다. 개인 정보는 들어 있지 않습니다.",
    promptCopy: "아래 내용을 복사해 주세요",
  },
  en: {
    title: "An error was logged",
    body1: "If something looked wrong, please let us know. The details are stored ",
    bodyB1: "only on this device",
    body2: " — sharing them is entirely up to you.",
    copied: "Copied",
    copyButton: "Copy error details",
    close: "Close",
    copiedHint:
      "Paste it into a community post and we'll use it to fix the issue. It contains no personal information.",
    promptCopy: "Copy the text below",
  },
  ja: {
    title: "問題が1件記録されました",
    body1: "画面の表示がおかしかった場合はお知らせください。内容は",
    bodyB1: "この端末にのみ",
    body2: "保存され、送るかどうかはご自身で決められます。",
    copied: "コピーしました",
    copyButton: "エラー内容をコピー",
    close: "閉じる",
    copiedHint:
      "コミュニティの投稿に貼り付けていただければ、修正に役立てます。個人情報は含まれていません。",
    promptCopy: "以下の内容をコピーしてください",
  },
} as const;

export default defineComponent({
  setup() {
    const L = computed(() => M[i18n.locale]);
    const copied = ref(false);

    const copy = async () => {
      try {
        await navigator.clipboard.writeText(errorReportText());
        copied.value = true;
      } catch {
        // 클립보드가 막힌 환경 — 선택 가능한 형태로 대신 보여준다
        window.prompt(L.value.promptCopy, errorReportText());
      }
    };

    return { errorState, copied, copy, dismissErrorToast, L };
  },
});
</script>
