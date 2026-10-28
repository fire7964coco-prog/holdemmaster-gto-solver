// 회원 전용 (설계 참고자료/회원전용_설계안_2026-10-12.md §2·§3 · 확정_결정.md «회원 전용»).
// ① 비회원 저장 = 레인지·벳 설정 각 SAVE_LIMIT개(폴더 제외) — 앱 안의 권유 장치(잠금 아님)
// ② 회원 전용 상황 = 자료 Worker가 로그인 토큰을 확인해 잠근다 — 앱은 토큰을 붙이고, 없으면 그 자리 한 줄만 보인다
// 트레이너 빌드 전용 — 단독 빌드에는 @features 이음새로 들어가지 않는다(계정 기능이 없다).
import { isAccountEnabled } from "./account";
import type { Locale, LocaleDict } from "./i18n";

/** 출시 스위치 — 15언어 문구 판정(3단계) 뒤 사장님 ○로 켠다. 켜기 전엔 저장 제한·회원 상황 모두 없다. */
export const MEMBER_LIMITS_LAUNCHED = true; // 10-18 림프 팟 출시와 함께 켬(사장님 ○ «둘 다 같이»)
/** localhost 검사용: localStorage `solver.memberLimits.test` = "1"이면 스위치가 꺼져 있어도 켜고, "0"이면 켜져 있어도 끈다(켜기 전 사용자 흉내). */
const TEST_KEY = "solver.memberLimits.test";
/** localhost 검사용: 이 키에 상황 id(쉼표 구분)를 넣으면 그 상황도 회원 전용으로 다룬다(림프 자리표가 앱에 오기 전 확인용). */
const TEST_SCENARIOS_KEY = "solver.memberLimits.testScenarios";

const isTestHost = () => {
  try {
    return ["localhost", "127.0.0.1"].includes(location.hostname);
  } catch {
    return false;
  }
};

export const memberLimitsEnabled = () => {
  if (!isAccountEnabled) return false;
  try {
    const test = isTestHost() ? localStorage.getItem(TEST_KEY) : null;
    if (test === "0") return false;
    return MEMBER_LIMITS_LAUNCHED || test === "1";
  } catch {
    return MEMBER_LIMITS_LAUNCHED;
  }
};

/** 비회원이 이 기기에 저장할 수 있는 레인지·벳 설정 수(각각 · 폴더는 세지 않는다). 이미 넘은 항목은 지우지 않는다. */
export const SAVE_LIMIT = 10;

/** 회원 전용 상황 — Worker `MEMBER_PREFIXES`(`limp-` · 턴 팩 `tp-`)와 같게. 맛보기 파일은 Worker `FREE_SAMPLES`가 토큰 없이 준다. */
const MEMBER_PREFIXES = ["limp-", "tp-"];
/** 턴 팩 맛보기 = BTN–BB K♠7♦2♣(정규 파일 Kh7d2c · 사장님 ○ 10-21)의 세 경로. */
export const TURN_PACK_SAMPLE = { spot: "srp-btn-bb", flop: "Ks7d2c" } as const;
const MEMBER_FREE_SAMPLES = [
  "limp-sb-bb/QdTd7c.bin",
  "tp-srp-btn-bb/Kh7d2c/xx.hmt",
  "tp-srp-btn-bb/Kh7d2c/xb33c.hmt",
  "tp-srp-btn-bb/Kh7d2c/xb75c.hmt",
];

export const isMemberScenario = (scenario: string) => {
  if (!memberLimitsEnabled()) return false;
  if (MEMBER_PREFIXES.some((p) => scenario.startsWith(p))) return true;
  if (!isTestHost()) return false;
  try {
    return (localStorage.getItem(TEST_SCENARIOS_KEY) ?? "").split(",").includes(scenario);
  } catch {
    return false;
  }
};

/** 로그인 없이 받을 수 있는 회원 상황 파일(맛보기)인가 */
export const isMemberFreeSample = (scenario: string, fileName: string) =>
  MEMBER_FREE_SAMPLES.includes(`${scenario}/${fileName}`);

// 문구 15언어(3단계 · 검수장 판정 S-087 MA-501 → saveFull «무제한» 대신 «10개 넘게»(계정 보관 한도 1,000이 있어서) · 재판정 S-088). 말투·어휘는 저장 목록 동기화 줄(saved-sync-labels.ts)과 복기 «상황» 용어에 맞춘다
// (es·pt·de·fr·tr·ru 반말 · hi आप). memberScenario = «간편 로그인 후 이용»(사장님 10-22 · «무료 회원» 표현 뺌).
const ko = {
  saveFull: "로그인하면 10개 넘게 저장하고 폰·PC에서 불러올 수 있어요",
  importOver: "가져오면 이 기기 저장이 10개를 넘어요 — 로그인하면 전부 가져올 수 있어요",
  memberScenario: "이 상황은 간편 로그인 후 이용할 수 있어요",
};
const en: typeof ko = {
  saveFull: "Sign in to save more than 10 items and open your list on any phone or PC",
  importOver: "This import would take this device past 10 saved items — sign in to import all of it",
  memberScenario: "This situation is available after a quick sign-in",
};
const ja: typeof ko = {
  saveFull: "ログインすると10件より多く保存でき、スマホでもPCでも開けます",
  importOver: "インポートするとこの端末の保存が10件を超えます — ログインするとすべてインポートできます",
  memberScenario: "この状況は簡単ログイン後に利用できます",
};
const es: typeof ko = {
  saveFull: "Inicia sesión para guardar más de 10 elementos y abrir tu lista en cualquier móvil o PC",
  importOver: "Con esta importación este dispositivo pasaría de 10 elementos guardados — inicia sesión para importarlo todo",
  memberScenario: "Esta situación está disponible tras un inicio de sesión rápido",
};
const pt: typeof ko = {
  saveFull: "Entre na sua conta para salvar mais de 10 itens e abrir sua lista em qualquer celular ou PC",
  importOver: "Esta importação faria este dispositivo passar de 10 itens salvos — entre na sua conta para importar tudo",
  memberScenario: "Esta situação fica disponível após um login rápido",
};
const de: typeof ko = {
  saveFull: "Melde dich an, um mehr als 10 Einträge zu speichern und deine Liste auf jedem Handy oder PC zu öffnen",
  importOver: "Mit diesem Import hätte dieses Gerät mehr als 10 gespeicherte Einträge – melde dich an, um alles zu importieren",
  memberScenario: "Diese Situation ist nach einer schnellen Anmeldung verfügbar",
};
const zh: typeof ko = {
  saveFull: "登录后可保存超过 10 个，手机和电脑都能打开你的列表",
  importOver: "导入后此设备的保存将超过 10 个 — 登录后即可全部导入",
  memberScenario: "此场景快捷登录后即可使用",
};
const zhHant: typeof ko = {
  saveFull: "登入後可儲存超過 10 個，手機和電腦都能開啟你的清單",
  importOver: "匯入後此裝置的儲存將超過 10 個 — 登入後即可全部匯入",
  memberScenario: "此情境快速登入後即可使用",
};
const fr: typeof ko = {
  saveFull: "Connecte-toi pour enregistrer plus de 10 éléments et ouvrir ta liste sur n'importe quel téléphone ou PC",
  importOver: "Cette importation ferait dépasser 10 éléments enregistrés sur cet appareil — connecte-toi pour tout importer",
  memberScenario: "Cette situation est disponible après une connexion rapide",
};
const id: typeof ko = {
  saveFull: "Masuk untuk menyimpan lebih dari 10 item dan membuka daftar di HP atau PC mana pun",
  importOver: "Impor ini akan membuat simpanan di perangkat ini lebih dari 10 — masuk untuk mengimpor semuanya",
  memberScenario: "Situasi ini bisa dipakai setelah login cepat",
};
const ms: typeof ko = {
  saveFull: "Log masuk untuk menyimpan lebih daripada 10 item dan membuka senarai di mana-mana telefon atau PC",
  importOver: "Import ini akan menjadikan simpanan pada peranti ini melebihi 10 — log masuk untuk import semuanya",
  memberScenario: "Keadaan ini boleh digunakan selepas log masuk pantas",
};
const hi: typeof ko = {
  saveFull: "लॉग इन करें, फिर 10 से ज़्यादा आइटम सेव करें और लिस्ट किसी भी फ़ोन या PC पर खोलें",
  importOver: "इसे इंपोर्ट करने पर इस डिवाइस पर सेव किए गए आइटम 10 से ज़्यादा हो जाएँगे — लॉग इन करें, फिर सब इंपोर्ट कर सकते हैं",
  memberScenario: "यह स्थिति झटपट लॉग इन के बाद इस्तेमाल कर सकते हैं",
};
const tr: typeof ko = {
  saveFull: "10'dan fazla öğe kaydetmek ve listeni her telefonda veya PC'de açmak için giriş yap",
  importOver: "Bu içe aktarma bu cihazdaki kayıtları 10'un üzerine çıkarır — hepsini içe aktarmak için giriş yap",
  memberScenario: "Bu durum hızlı girişten sonra kullanılabilir",
};
const vi: typeof ko = {
  saveFull: "Đăng nhập để lưu hơn 10 mục và mở danh sách trên mọi điện thoại hoặc PC",
  importOver: "Nhập tệp này sẽ khiến số mục đã lưu trên thiết bị này vượt quá 10 — đăng nhập để nhập toàn bộ",
  memberScenario: "Tình huống này dùng được sau khi đăng nhập nhanh",
};
const ru: typeof ko = {
  saveFull: "Войди, чтобы сохранять больше 10 элементов и открывать список на любом телефоне или ПК",
  importOver: "После импорта на этом устройстве будет больше 10 сохранённых элементов — войди, чтобы импортировать всё",
  memberScenario: "Эта ситуация доступна после быстрого входа",
};
const ar: typeof ko = {
  saveFull: "سجّل الدخول لحفظ أكثر من 10 عناصر وفتح قائمتك على أي هاتف أو حاسوب",
  importOver: "بهذا الاستيراد تتجاوز العناصر المحفوظة على هذا الجهاز 10 — سجّل الدخول لاستيراد الملف كله",
  memberScenario: "هذا الموقف متاح بعد تسجيل دخول سريع",
};
const it: typeof ko = {
  saveFull: "Accedi per salvare più di 10 elementi e aprire la tua lista da qualsiasi telefono o PC",
  importOver: "Con questa importazione supereresti il limite di 10 elementi salvati sul dispositivo: accedi per importare l’intero file",
  memberScenario: "Questa situazione è disponibile dopo un accesso rapido",
};
export type MemberLabels = typeof ko;
// This assignment checks both the locale set and every required key at build time.
const checkedLabels: LocaleDict<MemberLabels> = {
  ko, en, ja, es, pt, de, zh, "zh-hant": zhHant, fr, id, ms, hi, tr, vi, ru, ar, it,
  pl: {
  saveFull: "Zaloguj się, aby zapisać więcej niż 10 pozycji i otwierać swoją listę na dowolnym telefonie lub komputerze",
  importOver: "Ten import przekroczy limit 10 pozycji zapisanych na tym urządzeniu — zaloguj się, aby zaimportować całość",
  memberScenario: "Ta sytuacja jest dostępna po szybkim zalogowaniu",
},
  th: {
  saveFull: "เข้าสู่ระบบเพื่อบันทึกได้มากกว่า 10 รายการ และเปิดรายการของคุณบนโทรศัพท์หรือคอมพิวเตอร์เครื่องใดก็ได้",
  importOver: "การนำเข้าครั้งนี้จะทำให้มีข้อมูลที่บันทึกบนอุ⁠ป⁠ก⁠ร⁠ณ์เกิน 10 รายการ เข้าสู่ระบบเพื่อนำเข้าทั้งหมด",
  memberScenario: "เข้าสู่ระบบอย่างรวดเร็วเพื่อใช้สถานการณ์นี้",
},
};
export const memberLabels = (locale: Locale): MemberLabels => checkedLabels[locale];
