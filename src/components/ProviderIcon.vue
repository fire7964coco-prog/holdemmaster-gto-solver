<template>
  <!-- 로그인 버튼 앞 공급자 로고(10-15 사장님 ○). 각 회사 공식 로고 모양·색 그대로, 원 배지 안에 둔다.
       파일로 받지 않고 인라인 — 솔버는 COEP require-corp라 다른 출처 이미지는 막힐 수 있다. -->
  <svg v-if="provider === 'google'" class="provider-icon" viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="10" fill="#fff" />
    <g transform="translate(4 4) scale(0.25)">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </g>
  </svg>
  <svg v-else-if="provider === 'kakao'" class="provider-icon" viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="10" fill="#FEE500" />
    <path fill="#000" fill-opacity="0.9" d="M10 5.2c-3.2 0-5.8 2-5.8 4.5 0 1.6 1.1 3 2.7 3.8l-.6 2.2c-.05.2.17.36.34.25l2.6-1.7c.25.02.5.03.76.03 3.2 0 5.8-2 5.8-4.5S13.2 5.2 10 5.2z" />
  </svg>
  <svg v-else-if="provider === 'custom:telegram'" class="provider-icon" viewBox="0 0 240 240" aria-hidden="true">
    <circle cx="120" cy="120" r="120" fill="#2AABEE" />
    <path fill="#fff" d="M53.9 118.7c35-15.2 58.3-25.3 70-30.2 33.3-13.9 40.3-16.3 44.8-16.4 1 0 3.2.2 4.7 1.4 1.2 1 1.5 2.3 1.7 3.3s.4 3.1.2 4.7c-1.8 19-9.6 65.1-13.6 86.3-1.7 9-5 12-8.2 12.3-7 .6-12.3-4.6-19-9-10.6-6.9-16.5-11.2-26.8-18-11.9-7.8-4.2-12.1 2.6-19.1 1.8-1.8 32.5-29.8 33.1-32.3.1-.3.1-1.5-.6-2.1-.7-.6-1.7-.4-2.5-.2-1.1.2-17.9 11.4-50.6 33.5-4.8 3.3-9.1 4.9-13 4.8-4.3-.1-12.5-2.4-18.7-4.4-7.5-2.4-13.5-3.7-13-7.9.3-2.2 3.3-4.4 8.9-6.7z" />
  </svg>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import type { LoginProvider } from "../account";

export default defineComponent({
  props: {
    provider: { type: String as PropType<LoginProvider>, required: true },
  },
});
</script>

<style scoped>
.provider-icon {
  display: inline-block;
  flex-shrink: 0;
  width: 1em;
  height: 1em;
  margin-inline-end: 0.4em;
  vertical-align: -0.15em;
}
</style>
