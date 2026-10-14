/*
 * RTL 로캘 정본은 rtl-locales.json 한 곳이다. webpack이 같은 목록을 런타임과
 * 두 HTML의 첫 페인트 스크립트에 주입한다. 단계 3에서 목록에 "ar"를 추가한다.
 * 시험용 주소·저장값 스위치는 없다. 검사에서만 html.dir을 직접 바꾼다.
 */
declare const __RTL_LOCALES__: readonly string[];

export const RTL_LOCALES = __RTL_LOCALES__;
export const isRtl = (locale: string): boolean => RTL_LOCALES.includes(locale);
export const directionForLocale = (locale: string): "ltr" | "rtl" =>
  isRtl(locale) ? "rtl" : "ltr";
