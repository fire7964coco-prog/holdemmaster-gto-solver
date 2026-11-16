/**
 * 「게시판에 묻기」 — 계산·복기 화면에서 커뮤니티 글쓰기 창을 채운 채로 연다(본체 MB-600).
 * 받는 쪽 주소 규격: <origin>/<언어>?tab=board&compose=1&cat=hand&spot=<공유 주소>&text=<한 줄>
 * 커뮤니티가 없는 사이트(MainSite.community = false)에서는 버튼이 나오지 않는다.
 */
import { i18n } from "./i18n";
import type { LocaleDict } from "./i18n";
import { MAIN_SITE_CONFIG } from "./main-site";
import { trackBoardAsk } from "./usage-analytics";

/** 받는 쪽 게시판이 열린 뒤에 켠다 */
export const BOARD_ASK_LAUNCHED = false;

const SPOT_LIMIT = 500; // 받는 쪽이 받는 공유 주소 길이
const TEXT_LIMIT = 200;

// 시험: 로컬 주소에서만 ?boardAsk=1
const testSwitch = (): boolean => {
  try {
    return ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname) &&
      new URLSearchParams(location.search).get("boardAsk") === "1";
  } catch {
    return false;
  }
};
const switchedOn = BOARD_ASK_LAUNCHED || testSwitch();

export const boardAskOn = (): boolean => switchedOn && MAIN_SITE_CONFIG.community && MAIN_SITE_CONFIG.origin !== "";

export const BOARD_ASK_LABELS: LocaleDict<{ ask: string; post: string }> = {
  ko: { ask: "💬 게시판에 묻기", post: "💬 이 판 올리기" },
  en: { ask: "💬 Ask the community", post: "💬 Post this hand" },
  ja: { ask: "💬 掲示板で質問する", post: "💬 このハンドを投稿" },
  es: { ask: "💬 Preguntar a la comunidad", post: "💬 Publicar esta mano" },
  pt: { ask: "💬 Perguntar à comunidade", post: "💬 Publicar esta mão" },
  de: { ask: "💬 Die Community fragen", post: "💬 Diese Hand posten" },
  zh: { ask: "💬 去社区提问", post: "💬 发布这手牌" },
  "zh-hant": { ask: "💬 到社群發問", post: "💬 發布這手牌" },
  fr: { ask: "💬 Demander à la communauté", post: "💬 Publier cette main" },
  id: { ask: "💬 Tanya komunitas", post: "💬 Posting hand ini" },
  ms: { ask: "💬 Tanya komuniti", post: "💬 Siarkan tangan ini" },
  hi: { ask: "💬 कम्युनिटी से पूछें", post: "💬 यह हैंड पोस्ट करें" },
  tr: { ask: "💬 Topluluğa sor", post: "💬 Bu eli paylaş" },
  vi: { ask: "💬 Hỏi cộng đồng", post: "💬 Đăng ván này" },
  ru: { ask: "💬 Спросить сообщество", post: "💬 Опубликовать раздачу" },
  ar: { ask: "💬 اسأل المجتمع", post: "💬 انشر هذه اليد" },
  it: { ask: "💬 Chiedi alla comunità", post: "💬 Pubblica questa mano" },
  pl: { ask: "💬 Zapytaj społeczność", post: "💬 Opublikuj to rozdanie" },
  th: { ask: "💬 ถามในชุมชน", post: "💬 โพสต์มือนี้" },
  uk: { ask: "💬 Запитати спільноту", post: "💬 Опублікувати роздачу" },
};

export const boardComposeUrl = (spot: string, text: string): string => {
  const home = i18n.locale === "ko" ? "/" : `/${i18n.locale}`;
  const url = new URL(home, MAIN_SITE_CONFIG.origin);
  url.searchParams.set("tab", "board");
  url.searchParams.set("compose", "1");
  url.searchParams.set("cat", "hand");
  if (spot && spot.length <= SPOT_LIMIT) url.searchParams.set("spot", spot);
  if (text) url.searchParams.set("text", text.slice(0, TEXT_LIMIT));
  return url.toString();
};

/**
 * 누른 그 순간에 빈 새 탭을 먼저 열고(공유 주소를 기다린 뒤에 열면 브라우저가 막는다), 주소가 준비되면 그 탭을 보낸다.
 * 공유 주소를 못 만들어도 글쓰기 창은 연다(한 줄 요약만 채워짐).
 */
export const openBoardAsk = async (
  feature: "custom" | "hand_review",
  text: string,
  makeSpot?: () => Promise<string>
): Promise<void> => {
  let tab: Window | null = null;
  try {
    tab = window.open("", "_blank");
  } catch {
    tab = null;
  }
  let spot = "";
  try {
    if (makeSpot) spot = await makeSpot();
  } catch {
    spot = "";
  }
  const url = boardComposeUrl(spot, text);
  try {
    if (tab && !tab.closed) {
      tab.opener = null;
      tab.location.replace(url);
    } else {
      window.open(url, "_blank", "noopener");
    }
  } catch {
    window.open(url, "_blank", "noopener");
  }
  trackBoardAsk(feature);
};
