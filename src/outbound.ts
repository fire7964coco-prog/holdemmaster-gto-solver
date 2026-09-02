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

/* 빌드 2벌 분기 — 본체 통계에서 «어느 앱이 보낸 유입인지» 갈라 보여야 한다.
 * 트레이너 빌드는 기존 값(solver)을 유지한다 — 본체 통계의 연속성이 깨지지 않게. */
declare const __APP_TARGET__: "trainer" | "npokers";
const SOURCE = __APP_TARGET__ === "npokers" ? "npokers" : "solver";
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
 *
 * ── ✅ 실측 갱신 2026-08-27 (라이브 curl 25경로 · 상시 규칙 «언어 작업마다 다시 잰다») ──
 *   · `/xx/solver` — **9개 언어 전부 200** (en·ja·es·pt·de·zh·zh-hant·fr + ko `/solver`)
 *   · `/xx/community` — **9개 언어 전부 404** (그래서 어느 로케일에도 `"/community"`가 없다)
 * ⚠ 08-27 이전에는 pt·de·zh·zh-hant·fr에 `"/solver"`가 빠져 있었다 — 본체가 랜딩을 늘리는 동안
 *   이 표가 낡은 것이다. 그날 5줄을 채웠고, 각 언어 `*-verify.js`의 «랜딩 링크가 없어야 한다»
 *   단언도 «그 언어 것이어야 한다»로 같이 뒤집었다(확정_결정 «검사도 낡는다»).
 * 🔴 **다음에 언어를 건드리는 세션은 여기를 또 재라.** 본체가 `/xx/community`를 열면
 *   이번과 똑같은 모양으로 이 표와 검사가 한꺼번에 낡는다.
 */
const LOCALE_PATHS: Record<string, Record<string, string>> = {
  en: { "": "/en", "/solver": "/en/solver" },
  // ✅ /ja/solver가 열렸다 (2026-08-22 실측 200). 2026-08-19에는 404였다 —
  //    본체가 랜딩을 늘릴 때마다 여기가 낡는다. 언어 작업마다 한 번씩 다시 재 볼 것
  ja: { "": "/ja", "/solver": "/ja/solver" }, // /ja/community는 아직 없다
  // ✅ /es/solver 신설 (본체 회신 reply-to-solver-2026-08-22.md §4, 2026-08-22 실측 200)
  es: { "": "/es", "/solver": "/es/solver" }, // /es/community는 아직 없다
  // ✅ /pt/solver 200 (2026-08-27 실측 — 08-21에는 404였다). /pt/community는 여전히 404
  pt: { "": "/pt", "/solver": "/pt/solver" },
  // ✅ /de/solver 200 (2026-08-27 실측 — 08-21에는 404였다). /de/community는 여전히 404
  de: { "": "/de", "/solver": "/de/solver" },
  // ✅ /zh/solver 200 (2026-08-27 실측 — 08-21에는 404였다). /zh/community는 여전히 404
  zh: { "": "/zh", "/solver": "/zh/solver" },
  // ⚠ 본체 /zh/blog는 200이지만 GTO 13편의 «중국어판»은 없다(a-high-board-cbet = 404)
  //   → 프리셋 해설 링크는 zh에서 숨긴다 (presets.ts articleSlug 쪽에서 판단)
  //
  // 번체: /zh-hant는 실재(200)이고 본체 app/zh-hant/page.tsx가 <CommunityClient pageLocale="zh-hant"/>를
  // 렌더한다 — 피드도 번체 글로 걸러지고 블로그 티저 42편도 번체다(2026-08-22 본체 소스 확인).
  // ✅ 본체가 `LABELS`에 zh-hant 한 벌(52키)을 넣었다 — 화면 라벨도 번체다
  //   (회신 reply-to-solver-2026-08-22.md §1, 2026-08-22). 영어 폴백은 해소됐다.
  //   → TrainerPage의 «[✏️ 發文]»은 본체 확정값이다(임시 영어 이름에서 바꿨다).
  // ✅ /zh-hant/solver 200 (2026-08-27 실측 — 08-22에는 404였다). /zh-hant/community는 여전히 404
  "zh-hant": { "": "/zh-hant", "/solver": "/zh-hant/solver" },
  // ✅ /fr/solver 200 (2026-08-27 실측 — 08-24에는 404였다). /fr/community는 여전히 404
  // ⚠ /fr/blog/a-high-board-cbet는 손대지 않았다 — 해설 링크는 별개 판단이다(08-24 실측 404)
  // ⚠ 이 한 줄을 빼면 «숨김»이 아니라 «한국어 홈으로 연결»된다 — 맵 자체가 없으면
  //   mainSiteUrl()이 경로를 그대로 통과시키기 때문 (착수지시서 §0)
  fr: { "": "/fr", "/solver": "/fr/solver" },
  // 인도네시아어 (2026-09-02 실측 curl): `/id` 200 · **`/id/solver` 404** · `/id/community` 404 ·
  // `/id/blog/a-high-board-cbet` 404 → 홈만 등재. 랜딩·해설 링크는 화면에서 숨겨진다.
  // 🔴 본체가 `/id/solver`를 열면 여기와 id-verify.js가 같이 낡는다 — 언어 작업마다 다시 잴 것
  id: { "": "/id" },
};

export const mainSiteUrl = (path: string, placement: OutboundPlacement) => {
  const map = LOCALE_PATHS[i18n.locale];
  const localized = map ? map[path] : path;
  if (localized === undefined) return ""; // 이 언어에 등가 페이지 없음 → 링크 숨김
  return trackOutbound(`${MAIN_SITE}${localized}`, placement);
};
