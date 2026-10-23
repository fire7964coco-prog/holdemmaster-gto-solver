/**
 * 앱이 바깥 사이트와 이어지는 값을 한 곳에 모은다(본체 MB-399·MB-404).
 * ⚠ 본체 주소·API·쿠키 이름은 이 파일 밖에 적지 않는다 — 다른 빌드는 webpack이 이 파일 대신 그 빌드의 값 파일을 문다.
 */
import type { MainSite } from "./main-site-type";

export type { MainSite };

export const MAIN_SITE_CONFIG: MainSite = {
  origin: "https://www.holdemmaster.com",
  localePaths: {}, // 언어별 경로는 outbound.ts LOCALE_PATHS(본체 랜딩 실측표)가 정한다
  feedbackApi: "https://www.holdemmaster.com/api/solver-feedback",
  shareApi: "https://www.holdemmaster.com/api/spot-share",
  shareOrigin: "https://www.holdemmaster.com",
  reviewsSummaryApi: "https://www.holdemmaster.com/api/solver-reviews/summary",
  // 본체 블로그의 해설 포스팅 URL (2026-08-08 발행분). 수정 시 재배포 필요.
  articleUrls: {
    "srp-dry-ace": "https://www.holdemmaster.com/blog/a-high-board-cbet",
    "srp-dry-king": "https://www.holdemmaster.com/blog/k-high-board-cbet",
    "srp-broadway": "https://www.holdemmaster.com/blog/broadway-board-strategy",
    "srp-middle-connected": "https://www.holdemmaster.com/blog/donk-bet-strategy",
    "srp-monotone": "https://www.holdemmaster.com/blog/monotone-board-strategy",
    "srp-paired": "https://www.holdemmaster.com/blog/paired-board-strategy",
    "srp-low-rainbow": "https://www.holdemmaster.com/blog/low-board-check-raise",
    "3bp-ace-king": "https://www.holdemmaster.com/blog/3bet-pot-cbet",
    "3bp-dynamic": "https://www.holdemmaster.com/blog/3bet-pot-bet-sizing",
    "3bp-low": "https://www.holdemmaster.com/blog/3bet-pot-low-board",
    "sb-king-mid": "https://www.holdemmaster.com/blog/blind-battle-cbet",
    "sb-connected": "https://www.holdemmaster.com/blog/blind-battle-connected-board",
    "sb-paired-ace": "https://www.holdemmaster.com/blog/ace-paired-board-strategy",
  },
  // 로그인 공유(SSO · 본체 MB-343): 본체(www)와 «한 장의 쿠키». 이름은 본체 정본
  // `Holdem_Project/lib/supabase/cookie-name.ts`와 반드시 같게.
  authCookie: "sb-holdemmaster-auth-token",
  sharedCookieDomain: ".holdemmaster.com",
  noticeHrefHosts: [],
  noticeBlockedWords: [],
  community: true,
  languagePicker: false, // 본체가 언어별 랜딩에서 «?lang=xx»를 붙여 보낸다 — 그 언어에 페깅(NavBar)
  homeOnlyLinks: false,
  utmSource: "solver", // 본체 통계의 연속성 — 바꾸지 않는다
};
