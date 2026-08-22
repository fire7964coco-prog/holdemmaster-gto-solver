/**
 * 본체 사이트(holdemmaster.com)로 나가는 링크에 유입 추적 파라미터를 붙인다.
 *
 * 왜 필요한가: 솔버는 별도 하위 도메인이라, 파라미터가 없으면 본체 통계에서
 * "솔버 덕분에 온 사람"을 구분할 수 없다. 어떤 화면의 어떤 버튼이 실제로
 * 유입을 만드는지 알아야 개선 방향을 정할 수 있다.
 *
 * 본체 블로그·랜딩은 canonical 태그가 파라미터를 무시하고 원본 주소를 가리키므로
 * (2026-08-13 확인) 중복 색인 문제는 생기지 않는다.
 */

import { i18n } from "./i18n";
const SOURCE = "solver";
const MEDIUM = "referral";

/** 링크가 놓인 위치 — 본체 통계에서 이 값으로 화면별 성과를 구분한다. */
export type OutboundPlacement =
  | "navbar" // 상단 네비바 커뮤니티 링크
  | "about-credit" // 소개 화면 하단 크레딧
  | "about-landing" // 소개 화면의 솔버 랜딩 안내
  | "preset-card" // 교육 예제 목록 카드의 해설 보기
  | "preset-preview" // 미리보기 화면의 해설 읽기
  | "trainer-feedback" // 트레이너 채점 후 해설 읽기
  | "daily-share"; // 오늘의 문제 결과를 커뮤니티에 올리러 갈 때

const CAMPAIGN: Record<OutboundPlacement, string> = {
  navbar: "community",
  "about-credit": "community",
  "about-landing": "landing",
  "preset-card": "article",
  "preset-preview": "article",
  "trainer-feedback": "article",
  "daily-share": "community",
};

/**
 * 추적 파라미터를 붙인 주소를 돌려준다.
 * 빈 문자열이 들어오면 그대로 빈 문자열 (링크 자체를 숨기는 쪽에서 판단).
 */
export const trackOutbound = (url: string, placement: OutboundPlacement) => {
  if (!url) return "";
  const separator = url.includes("?") ? "&" : "?";
  const params = new URLSearchParams({
    utm_source: SOURCE,
    utm_medium: MEDIUM,
    utm_campaign: CAMPAIGN[placement],
    utm_content: placement,
  });
  return `${url}${separator}${params.toString()}`;
};

/** 본체 사이트 주소 (경로는 "/solver"처럼 슬래시로 시작). */
export const MAIN_SITE = "https://www.holdemmaster.com";

/*
 * 본체는 언어별 URL(hreflang)을 따로 둔다 — 외국어 화면에서 나가는 링크는 그 언어
 * 페이지로만. (2026-08-19 사용자 지적 + 본체 회신: /en/solver 오픈. /ja는 홈만 실재)
 * 언어별로 «실재하는» 경로만 등재한다. 표에 없는 경로는 빈 문자열을 돌려주므로
 * 화면 쪽에서 v-if로 링크 자체를 숨겨야 한다 (한국어 페이지나 404로 보내지 않는다).
 */
const LOCALE_PATHS: Record<string, Record<string, string>> = {
  en: { "": "/en", "/solver": "/en/solver" },
  ja: { "": "/ja" }, // /ja/solver·/ja/community는 아직 없다 (2026-08-19 실측 404)
  es: { "": "/es" }, // /es는 실재(200), /es/solver는 404 (2026-08-20 실측 — 스페인어화 리서치)
  pt: { "": "/pt" }, // /pt는 실재(200), /pt/solver·/pt/community는 404 (2026-08-21 실측)
  de: { "": "/de" }, // /de는 실재(200), /de/solver·/de/community는 404 (2026-08-21 실측)
  zh: { "": "/zh" }, // /zh는 실재(200), /zh/solver·/zh/community는 404 (2026-08-21 실측).
  // ⚠ 본체 /zh/blog는 200이지만 GTO 13편의 «중국어판»은 없다(a-high-board-cbet = 404)
  //   → 프리셋 해설 링크는 zh에서 숨긴다 (presets.ts articleSlug 쪽에서 판단)
};

export const mainSiteUrl = (path: string, placement: OutboundPlacement) => {
  const map = LOCALE_PATHS[i18n.locale];
  const localized = map ? map[path] : path;
  if (localized === undefined) return ""; // 이 언어에 등가 페이지 없음 → 링크 숨김
  return trackOutbound(`${MAIN_SITE}${localized}`, placement);
};
