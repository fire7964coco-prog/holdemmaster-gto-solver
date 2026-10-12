<template>
  <!-- 회원 전용 ② 상황 한 줄 (설계 참고자료/회원전용_설계안_2026-10-12.md §2 «앱») — 팝업 없음 -->
  <span data-testid="member-only-line">
    {{ M.memberScenario }}
    <span class="inline-flex gap-2 ml-1 align-middle">
      <button
        class="member-login-button"
        data-testid="member-login-google"
        :disabled="busy"
        @click="start('google')"
      >
        {{ L.google }}
      </button>
      <button
        v-if="isKo"
        class="member-login-button"
        data-testid="member-login-kakao"
        :disabled="busy"
        @click="start('kakao')"
      >
        {{ L.kakao }}
      </button>
    </span>
  </span>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { i18n } from "../i18n";
import { setLoginReturnView, signIn } from "../account";
import { useStore } from "../store";
import { savedSyncLabels } from "../saved-sync-labels";
import { memberLabels } from "../member-limits";

export default defineComponent({
  setup() {
    const store = useStore();
    const L = computed(() => savedSyncLabels(i18n.locale));
    const M = computed(() => memberLabels(i18n.locale));
    const isKo = computed(() => i18n.locale === "ko");
    const busy = ref(false);
    const start = async (provider: "google" | "kakao") => {
      busy.value = true;
      try {
        // 로그인에서 돌아오면 같은 화면(복기·플랍 조회)으로
        setLoginReturnView(store.sideView);
        await signIn(provider);
      } catch {
        busy.value = false;
      }
    };
    return { L, M, isKo, busy, start };
  },
});
</script>

<style scoped>
.member-login-button {
  padding: 1px 8px;
  border: 1px solid rgb(var(--c-line));
  border-radius: 5px;
  background: rgb(var(--c-bg-2));
  font-weight: 600;
}
.member-login-button:hover {
  background: rgb(var(--c-bg-3));
}
</style>
