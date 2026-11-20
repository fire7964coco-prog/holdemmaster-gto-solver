/**
 * 개인정보처리방침 링크 — 화면 아래쪽 작은 글씨 한 줄(본체 MB-608 · 사장님 11-17).
 * 주소는 사이트 설정(MainSite.privacyUrl) · 빈 값인 사이트에서는 안 나온다.
 * 한국어 화면 = /privacy · 나머지 19언어 = /privacy#en(본체 영어 전문 · MB-624 사장님 11-20).
 * 🔴 이용 결과 수집 1차 배포와 같은 배포에 켠다(MB-608 «시점»). 공개 앱·새 앱 두 곳을 같이 켤 것.
 */
import { i18n } from "./i18n";
import type { LocaleDict } from "./i18n";
import { MAIN_SITE_CONFIG } from "./main-site";

/** 이용 결과 수집 1차 배포 때 켠다 */
export const PRIVACY_LINK_LAUNCHED = true;

// 시험: 로컬 주소에서만 ?privacy=1
const testSwitch = (): boolean => {
  try {
    return ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname) &&
      new URLSearchParams(location.search).get("privacy") === "1";
  } catch {
    return false;
  }
};

// 앱이 시작하며 주소의 ?…를 지우므로 모듈을 불러올 때 한 번 읽는다(board-ask.ts와 같은 방식)
const switchedOn = PRIVACY_LINK_LAUNCHED || testSwitch();

/** 화면 언어에 따라 바뀐다 — computed 안에서 부를 것 */
export const privacyUrl = (): string => {
  const base = switchedOn ? MAIN_SITE_CONFIG.privacyUrl : "";
  if (!base) return "";
  return i18n.locale === "ko" ? base : `${base}#en`;
};

/** 링크 hreflang — 도착 문서의 언어 */
export const privacyHreflang = (): string => (i18n.locale === "ko" ? "ko" : "en");

export const PRIVACY_LABEL: LocaleDict<string> = {
  ko: "개인정보처리방침",
  en: "Privacy Policy",
  ja: "プライバシーポリシー",
  es: "Política de privacidad",
  pt: "Política de Privacidade",
  de: "Datenschutzerklärung",
  zh: "隐私政策",
  "zh-hant": "隱私權政策",
  fr: "Politique de confidentialité",
  id: "Kebijakan Privasi",
  ms: "Dasar Privasi",
  hi: "गोपनीयता नीति",
  tr: "Gizlilik Politikası",
  vi: "Chính sách quyền riêng tư",
  ru: "Политика конфиденциальности",
  ar: "سياسة الخصوصية",
  it: "Informativa sulla privacy",
  pl: "Polityka prywatności",
  th: "นโยบายความเป็นส่วนตัว",
  uk: "Політика конфіденційності",
};

export const privacyLabel = (): string => PRIVACY_LABEL[i18n.locale] ?? PRIVACY_LABEL.en;
