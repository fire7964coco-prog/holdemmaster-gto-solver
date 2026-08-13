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

const SOURCE = "solver";
const MEDIUM = "referral";

/** 링크가 놓인 위치 — 본체 통계에서 이 값으로 화면별 성과를 구분한다. */
export type OutboundPlacement =
  | "navbar" // 상단 네비바 커뮤니티 링크
  | "about-credit" // 소개 화면 하단 크레딧
  | "about-landing" // 소개 화면의 솔버 랜딩 안내
  | "preset-card" // 교육 예제 목록 카드의 해설 보기
  | "preset-preview" // 미리보기 화면의 해설 읽기
  | "trainer-feedback"; // 트레이너 채점 후 해설 읽기

const CAMPAIGN: Record<OutboundPlacement, string> = {
  navbar: "community",
  "about-credit": "community",
  "about-landing": "landing",
  "preset-card": "article",
  "preset-preview": "article",
  "trainer-feedback": "article",
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

export const mainSiteUrl = (path: string, placement: OutboundPlacement) => {
  return trackOutbound(`${MAIN_SITE}${path}`, placement);
};
