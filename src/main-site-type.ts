/** 앱이 바깥 사이트와 이어지는 값의 형식 — 값은 src/main-site.ts(빌드마다 다른 파일). */
export type MainSite = {
  /** 앱 밖으로 나가는 링크의 첫 화면(소개·커뮤니티) */
  origin: string;
  /** origin 아래 언어별 경로 — 없는 언어는 첫 화면 */
  localePaths: Record<string, string>;
  /** 후기·공유·요약 서버 — 빈 값이면 그 기능을 쓰지 않는다 */
  feedbackApi: string;
  shareApi: string;
  shareOrigin: string;
  reviewsSummaryApi: string;
  /** 교육 예제 해설 글 — 빈 표면 링크를 숨긴다 */
  articleUrls: Record<string, string>;
  /** 로그인 쿠키 이름 · 여러 하위 도메인이 같이 읽을 도메인(빈 값 = 이 주소만) */
  authCookie: string;
  sharedCookieDomain: string;
  /** 공지(notice.json) 링크로 허용하는 호스트 — 빈 목록이면 제한 없음 */
  noticeHrefHosts: readonly string[];
  /** 공지 글에 들어 있으면 그 공지를 띄우지 않는 낱말(소문자) */
  noticeBlockedWords: readonly string[];
  /** 커뮤니티가 있는 사이트인가 — 없으면 커뮤니티 링크·버튼을 숨긴다 */
  community: boolean;
  /** 앱 안 언어 상자 — 페깅할 언어별 사이트가 없을 때 켠다 */
  languagePicker: boolean;
  /** 바깥 링크가 경로와 상관없이 그 언어의 첫 화면 하나로만 가는가 */
  homeOnlyLinks: boolean;
  /** 바깥 링크의 utm_source */
  utmSource: string;
};
