/*
 * 템플릿 전역 속성 타입 선언 ($n·$d — index.ts에서 등록).
 *
 * ⚠ shims-vue.d.ts에는 넣지 말 것. 그 파일은 `declare module "*.vue"`를 가진
 *   «전역» 선언 파일이라, 거기에 `declare module "vue"`를 쓰면 «확장»이 아니라
 *   vue 모듈 자체를 새로 «선언»해 버려 프로젝트 전체 타입이 무너진다 (2026-08-21 실측).
 */
export {};

declare module "vue" {
  interface ComponentCustomProperties {
    /** 화면 수치의 소수점을 언어에 맞춘다 (pt=«,») */
    $n: (text: string) => string;
    /** 현재 언어의 소수점 문자 */
    $d: () => string;
  }
}
