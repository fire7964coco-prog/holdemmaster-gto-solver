// 교육용 프리셋 스팟 — 보드 유형 × 상황 커리큘럼
// 단위: bb×10 (예: 팟 55 = 5.5bb). 레인지는 100bb 온라인 표준의 근사치.
import { i18n } from "./i18n";

export type Preset = {
  id: string;
  category: string;
  categoryEn: string;
  categoryJa: string;
  categoryEs: string;
  categoryPt: string;
  categoryDe: string;
  categoryZh: string;
  categoryZhHant: string;
  categoryFr: string;
  categoryId: string;
  categoryMs: string;
  categoryHi: string;
  categoryTr: string;
  categoryVi: string;
  categoryRu: string;
  title: string;
  titleEn: string;
  titleJa: string;
  titleEs: string;
  titlePt: string;
  titleDe: string;
  titleZh: string;
  titleZhHant: string;
  titleFr: string;
  titleId: string;
  titleMs: string;
  titleHi: string;
  titleTr: string;
  titleVi: string;
  titleRu: string;
  board: string; // 예: "Ah 7d 2c"
  lesson: string; // 이 스팟에서 배우는 것
  lessonEn: string;
  lessonJa: string;
  lessonEs: string;
  lessonPt: string;
  lessonDe: string;
  lessonZh: string;
  lessonZhHant: string;
  lessonFr: string;
  lessonId: string;
  lessonMs: string;
  lessonHi: string;
  lessonTr: string;
  lessonVi: string;
  lessonRu: string;
  oopLabel: string;
  oopLabelEn: string;
  oopLabelJa: string;
  oopLabelEs: string;
  oopLabelPt: string;
  oopLabelDe: string;
  oopLabelZh: string;
  oopLabelZhHant: string;
  oopLabelFr: string;
  oopLabelId: string;
  oopLabelMs: string;
  oopLabelHi: string;
  oopLabelTr: string;
  oopLabelVi: string;
  oopLabelRu: string;
  ipLabel: string;
  ipLabelEn: string;
  ipLabelJa: string;
  ipLabelEs: string;
  ipLabelPt: string;
  ipLabelDe: string;
  ipLabelZh: string;
  ipLabelZhHant: string;
  ipLabelFr: string;
  ipLabelId: string;
  ipLabelMs: string;
  ipLabelHi: string;
  ipLabelTr: string;
  ipLabelVi: string;
  ipLabelRu: string;
  oopRange: string;
  ipRange: string;
  startingPot: number;
  effectiveStack: number;
  betFlop: string; // 플랍 벳 사이즈 (핵심 교육 지점이라 2종 유지)
  betTurnRiver: string; // 턴·리버 벳 사이즈 (트리 크기 절약을 위해 1종)
  raise: string; // 레이즈 사이즈 (전 스트리트 공통)
  unitScale: number; // 화면 환산 단위 (10 = 엔진 10칩을 1bb로 표시)
  articleUrl?: string; // 본체 사이트의 해설 포스팅 URL (있으면 "해설 보기" 링크 표시)
};

/* 현재 언어에 맞는 프리셋 문구 — 화면에서는 preset.title 대신 이걸 쓸 것 */
export const presetTitleOf = (
  preset: Pick<Preset, "title" | "titleEn" | "titleJa" | "titleEs" | "titlePt" | "titleDe" | "titleZh" | "titleZhHant" | "titleFr" | "titleId" | "titleMs" | "titleHi" | "titleTr" | "titleVi" | "titleRu">
) =>
  i18n.locale === "ko"
    ? preset.title
    : i18n.locale === "ja"
    ? preset.titleJa
    : i18n.locale === "es"
    ? preset.titleEs
    : i18n.locale === "pt"
    ? preset.titlePt
    : i18n.locale === "de"
    ? preset.titleDe
    : i18n.locale === "zh"
    ? preset.titleZh
    : i18n.locale === "zh-hant"
    ? preset.titleZhHant
    : i18n.locale === "fr"
    ? preset.titleFr
    : i18n.locale === "id"
    ? preset.titleId
    : i18n.locale === "ms"
    ? preset.titleMs
    : i18n.locale === "hi"
    ? preset.titleHi
    : i18n.locale === "tr"
    ? preset.titleTr
    : i18n.locale === "vi"
    ? preset.titleVi
    : i18n.locale === "ru"
    ? preset.titleRu
    : preset.titleEn;
export const presetLessonOf = (
  preset: Pick<Preset, "lesson" | "lessonEn" | "lessonJa" | "lessonEs" | "lessonPt" | "lessonDe" | "lessonZh" | "lessonZhHant" | "lessonFr" | "lessonId" | "lessonMs" | "lessonHi" | "lessonTr" | "lessonVi" | "lessonRu">
) =>
  i18n.locale === "ko"
    ? preset.lesson
    : i18n.locale === "ja"
    ? preset.lessonJa
    : i18n.locale === "es"
    ? preset.lessonEs
    : i18n.locale === "pt"
    ? preset.lessonPt
    : i18n.locale === "de"
    ? preset.lessonDe
    : i18n.locale === "zh"
    ? preset.lessonZh
    : i18n.locale === "zh-hant"
    ? preset.lessonZhHant
    : i18n.locale === "fr"
    ? preset.lessonFr
    : i18n.locale === "id"
    ? preset.lessonId
    : i18n.locale === "ms"
    ? preset.lessonMs
    : i18n.locale === "hi"
    ? preset.lessonHi
    : i18n.locale === "tr"
    ? preset.lessonTr
    : i18n.locale === "vi"
    ? preset.lessonVi
    : i18n.locale === "ru"
    ? preset.lessonRu
    : preset.lessonEn;
export const presetCategoryOf = (
  preset: Pick<Preset, "category" | "categoryEn" | "categoryJa" | "categoryEs" | "categoryPt" | "categoryDe" | "categoryZh" | "categoryZhHant" | "categoryFr" | "categoryId" | "categoryMs" | "categoryHi" | "categoryTr" | "categoryVi" | "categoryRu">
) =>
  i18n.locale === "ko"
    ? preset.category
    : i18n.locale === "ja"
    ? preset.categoryJa
    : i18n.locale === "es"
    ? preset.categoryEs
    : i18n.locale === "pt"
    ? preset.categoryPt
    : i18n.locale === "de"
    ? preset.categoryDe
    : i18n.locale === "zh"
    ? preset.categoryZh
    : i18n.locale === "zh-hant"
    ? preset.categoryZhHant
    : i18n.locale === "fr"
    ? preset.categoryFr
    : i18n.locale === "id"
    ? preset.categoryId
    : i18n.locale === "ms"
    ? preset.categoryMs
    : i18n.locale === "hi"
    ? preset.categoryHi
    : i18n.locale === "tr"
    ? preset.categoryTr
    : i18n.locale === "vi"
    ? preset.categoryVi
    : i18n.locale === "ru"
    ? preset.categoryRu
    : preset.categoryEn;
export const oopLabelOf = (
  preset: Pick<Preset, "oopLabel" | "oopLabelEn" | "oopLabelJa" | "oopLabelEs" | "oopLabelPt" | "oopLabelDe" | "oopLabelZh" | "oopLabelZhHant" | "oopLabelFr" | "oopLabelId" | "oopLabelMs" | "oopLabelHi" | "oopLabelTr" | "oopLabelVi" | "oopLabelRu">
) =>
  i18n.locale === "ko"
    ? preset.oopLabel
    : i18n.locale === "ja"
    ? preset.oopLabelJa
    : i18n.locale === "es"
    ? preset.oopLabelEs
    : i18n.locale === "pt"
    ? preset.oopLabelPt
    : i18n.locale === "de"
    ? preset.oopLabelDe
    : i18n.locale === "zh"
    ? preset.oopLabelZh
    : i18n.locale === "zh-hant"
    ? preset.oopLabelZhHant
    : i18n.locale === "fr"
    ? preset.oopLabelFr
    : i18n.locale === "id"
    ? preset.oopLabelId
    : i18n.locale === "ms"
    ? preset.oopLabelMs
    : i18n.locale === "hi"
    ? preset.oopLabelHi
    : i18n.locale === "tr"
    ? preset.oopLabelTr
    : i18n.locale === "vi"
    ? preset.oopLabelVi
    : i18n.locale === "ru"
    ? preset.oopLabelRu
    : preset.oopLabelEn;
export const ipLabelOf = (
  preset: Pick<Preset, "ipLabel" | "ipLabelEn" | "ipLabelJa" | "ipLabelEs" | "ipLabelPt" | "ipLabelDe" | "ipLabelZh" | "ipLabelZhHant" | "ipLabelFr" | "ipLabelId" | "ipLabelMs" | "ipLabelHi" | "ipLabelTr" | "ipLabelVi" | "ipLabelRu">
) =>
  i18n.locale === "ko"
    ? preset.ipLabel
    : i18n.locale === "ja"
    ? preset.ipLabelJa
    : i18n.locale === "es"
    ? preset.ipLabelEs
    : i18n.locale === "pt"
    ? preset.ipLabelPt
    : i18n.locale === "de"
    ? preset.ipLabelDe
    : i18n.locale === "zh"
    ? preset.ipLabelZh
    : i18n.locale === "zh-hant"
    ? preset.ipLabelZhHant
    : i18n.locale === "fr"
    ? preset.ipLabelFr
    : i18n.locale === "id"
    ? preset.ipLabelId
    : i18n.locale === "ms"
    ? preset.ipLabelMs
    : i18n.locale === "hi"
    ? preset.ipLabelHi
    : i18n.locale === "tr"
    ? preset.ipLabelTr
    : i18n.locale === "vi"
    ? preset.ipLabelVi
    : i18n.locale === "ru"
    ? preset.ipLabelRu
    : preset.ipLabelEn;
/** id로 제목 찾기 (트레이너 등 id만 있는 곳용) */
export const presetTitleById = (id: string) => {
  const preset = PRESETS.find((item) => item.id === id);
  return preset ? presetTitleOf(preset) : id;
};

// 본체 블로그의 해설 포스팅 URL (2026-08-08 발행분). 수정 시 재배포 필요.
export const ARTICLE_URLS: Record<string, string> = {
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
};

const BTN_OPEN =
  "22+,A2s+,K5s+,Q6s+,J7s+,T7s+,97s+,86s+,75s+,64s+,54s,A2o+,K9o+,Q9o+,J9o+,T8o+,98o";
const BB_DEFEND =
  "TT-22,AJs-A2s,KJs-K2s,QJs-Q2s,J4s+,T6s+,96s+,85s+,75s+,64s+,54s,AJo-A2o,K9o+,Q9o+,J9o+,T8o+,98o";
const BB_3BET = "99+,AJs+,KQs,A5s-A4s,AQo+";
const BTN_CALL_3BET = "QQ-22,ATs+,KJs+,QJs,JTs,T9s,98s,AJo+,KQo";
const SB_OPEN =
  "22+,A2s+,K2s+,Q4s+,J6s+,T6s+,96s+,85s+,75s+,64s+,54s,A2o+,K7o+,Q8o+,J8o+,T8o+,98o";
const BB_VS_SB =
  "99-22,AJs-A2s,KTs-K2s,QTs-Q2s,J5s+,T6s+,95s+,85s+,74s+,64s+,53s+,43s,ATo-A2o,K8o+,Q8o+,J8o+,T7o+,97o+,87o,76o";

const SRP = {
    categoryHi: "Single Raised Pot — BTN vs BB (बुनियाद)",
    oopLabelHi: "BB (caller)",
    ipLabelHi: "BTN (opener)",
  category: "싱글레이즈팟 — BTN vs BB (기본기)",
  categoryEn: "Single Raised Pot — BTN vs BB (Fundamentals)",
  categoryTr: "Single raised pot — BTN vs BB (temeller)",
  categoryVi: "Single raised pot — BTN vs BB (cơ bản)",
  categoryRu: "Сингл-рейз-пот — BTN vs BB (основы)",
  categoryJa: "シングルレイズポット — BTN vs BB（基本）",
  categoryEs: "Single Raised Pot — BTN vs BB (fundamentos)",
  categoryPt: "Single Raised Pot — BTN vs BB (fundamentos)",
  categoryDe: "Single Raised Pot – BTN vs BB (Grundlagen)",
  categoryZh: "单加注底池——BTN vs BB（基础）",
  categoryZhHant: "單加注底池——BTN vs BB（基礎）",
  categoryFr: "Single Raised Pot — BTN vs BB (fondamentaux)",
  categoryId: "Single Raised Pot — BTN vs BB (dasar)",
  categoryMs: "Single Raised Pot — BTN vs BB (asas)",
  oopLabel: "BB (콜러)",
  oopLabelEn: "BB (Caller)",
  oopLabelTr: "BB (call eden)",
  oopLabelVi: "BB (bên call)",
  oopLabelRu: "BB (колл)",
  oopLabelJa: "BB（コーラー）",
  oopLabelEs: "BB (caller)",
  oopLabelPt: "BB (caller)",
  oopLabelDe: "BB (Caller)",
  oopLabelZh: "BB 跟注方",
  oopLabelZhHant: "BB 跟注方",
  oopLabelFr: "BB (caller)",
  oopLabelId: "BB (caller)",
  oopLabelMs: "BB (caller)",
  ipLabel: "BTN (오픈레이저)",
  ipLabelEn: "BTN (Opener)",
  ipLabelTr: "BTN (açan)",
  ipLabelVi: "BTN (bên open)",
  ipLabelRu: "BTN (опен)",
  ipLabelJa: "BTN（オープンレイザー）",
  ipLabelEs: "BTN (open-raiser)",
  ipLabelPt: "BTN (open-raiser)",
  ipLabelDe: "BTN (Open-Raiser)",
  ipLabelZh: "BTN 开池方",
  ipLabelZhHant: "BTN 開池方",
  ipLabelFr: "BTN (ouvreur)",
  ipLabelId: "BTN (opener)",
  ipLabelMs: "BTN (opener)",
  oopRange: BB_DEFEND,
  ipRange: BTN_OPEN,
  startingPot: 55,
  effectiveStack: 975,
  betFlop: "33,75",
  betTurnRiver: "60",
  raise: "60",
  unitScale: 10,
};

const TBP = {
    categoryHi: "3-Bet Pot — BB 3-bet, BTN call (कम SPR)",
    oopLabelHi: "BB (3-bettor)",
    ipLabelHi: "BTN (caller)",
  category: "3벳팟 — BB 3벳 vs BTN 콜 (낮은 SPR)",
  categoryEn: "3-Bet Pot — BB 3-Bets, BTN Calls (Low SPR)",
  categoryTr: "3-bet pot — BB 3-bet yapar, BTN call eder (düşük SPR)",
  categoryVi: "Pot 3-bet — BB 3-bet, BTN call (SPR thấp)",
  categoryRu: "3-бет-пот — 3-бет BB, колл BTN (низкий SPR)",
  categoryJa: "3ベットポット — BB 3ベット vs BTN コール（低SPR）",
  categoryEs: "Bote de 3-bet — BB 3-betea y BTN paga (SPR bajo)",
  categoryPt: "Pote de 3-bet — BB dá 3-bet e BTN paga (SPR baixo)",
  categoryDe: "3-Bet-Pot – BB 3-bettet, BTN callt (niedriger SPR)",
  categoryZh: "3bet 底池——BB 3bet、BTN 跟注（低 SPR）",
  categoryZhHant: "3bet 底池——BB 3bet、BTN 跟注（低 SPR）",
  categoryFr: "Pot 3-bet — BB 3-bet, BTN paye (SPR bas)",
  categoryId: "Pot 3-bet — BB 3-bet, BTN call (SPR rendah)",
  categoryMs: "Pot 3-bet — BB 3-bet, BTN call (SPR rendah)",
  oopLabel: "BB (3벳터)",
  oopLabelEn: "BB (3-Bettor)",
  oopLabelTr: "BB (3-bet yapan)",
  oopLabelVi: "BB (bên 3-bet)",
  oopLabelRu: "BB (3-бет)",
  oopLabelJa: "BB（3ベッター）",
  oopLabelEs: "BB (3-bettor)",
  oopLabelPt: "BB (3-bettor)",
  oopLabelDe: "BB (3-Bettor)",
  oopLabelZh: "BB 3bet 方",
  oopLabelZhHant: "BB 3bet 方",
  oopLabelFr: "BB (3-betteur)",
  oopLabelId: "BB (3-bettor)",
  oopLabelMs: "BB (3-bettor)",
  ipLabel: "BTN (콜러)",
  ipLabelEn: "BTN (Caller)",
  ipLabelTr: "BTN (call eden)",
  ipLabelVi: "BTN (bên call)",
  ipLabelRu: "BTN (колл)",
  ipLabelJa: "BTN（コーラー）",
  ipLabelEs: "BTN (caller)",
  ipLabelPt: "BTN (caller)",
  ipLabelDe: "BTN (Caller)",
  ipLabelZh: "BTN 跟注方",
  ipLabelZhHant: "BTN 跟注方",
  ipLabelFr: "BTN (caller)",
  ipLabelId: "BTN (caller)",
  ipLabelMs: "BTN (caller)",
  oopRange: BB_3BET,
  ipRange: BTN_CALL_3BET,
  startingPot: 225,
  effectiveStack: 890,
  betFlop: "33,66",
  betTurnRiver: "66",
  raise: "60",
  unitScale: 10,
};

const SBBB = {
    categoryHi: "Blind vs Blind — SB vs BB (चौड़ी ranges)",
    oopLabelHi: "SB (opener)",
    ipLabelHi: "BB (caller)",
  category: "블라인드전 — SB vs BB (와이드 레인지)",
  categoryEn: "Blind vs Blind — SB vs BB (Wide Ranges)",
  categoryTr: "Blind vs blind — SB vs BB (geniş range'ler)",
  categoryVi: "Blind vs blind — SB vs BB (range rộng)",
  categoryRu: "Блайнд vs блайнд — SB vs BB (широкие диапазоны)",
  categoryJa: "ブラインド戦（BvB） — SB vs BB（ワイドレンジ）",
  categoryEs: "Guerra de ciegas — SB vs BB (rangos amplios)",
  categoryPt: "Blind vs Blind — SB vs BB (ranges amplos)",
  categoryDe: "Blind vs Blind – SB vs BB (weite Ranges)",
  categoryZh: "盲位对战——SB vs BB（宽范围）",
  categoryZhHant: "盲位對戰——SB vs BB（寬範圍）",
  categoryFr: "Blind vs Blind — SB vs BB (ranges larges)",
  categoryId: "Blind vs Blind — SB vs BB (range lebar)",
  categoryMs: "Blind vs Blind — SB vs BB (range luas)",
  oopLabel: "SB (오픈레이저)",
  oopLabelEn: "SB (Opener)",
  oopLabelTr: "SB (açan)",
  oopLabelVi: "SB (bên open)",
  oopLabelRu: "SB (опен)",
  oopLabelJa: "SB（オープンレイザー）",
  oopLabelEs: "SB (open-raiser)",
  oopLabelPt: "SB (open-raiser)",
  oopLabelDe: "SB (Open-Raiser)",
  oopLabelZh: "SB 开池方",
  oopLabelZhHant: "SB 開池方",
  oopLabelFr: "SB (ouvreur)",
  oopLabelId: "SB (opener)",
  oopLabelMs: "SB (opener)",
  ipLabel: "BB (콜러)",
  ipLabelEn: "BB (Caller)",
  ipLabelTr: "BB (call eden)",
  ipLabelVi: "BB (bên call)",
  ipLabelRu: "BB (колл)",
  ipLabelJa: "BB（コーラー）",
  ipLabelEs: "BB (caller)",
  ipLabelPt: "BB (caller)",
  ipLabelDe: "BB (Caller)",
  ipLabelZh: "BB 跟注方",
  ipLabelZhHant: "BB 跟注方",
  ipLabelFr: "BB (caller)",
  ipLabelId: "BB (caller)",
  ipLabelMs: "BB (caller)",
  oopRange: SB_OPEN,
  ipRange: BB_VS_SB,
  startingPot: 60,
  effectiveStack: 970,
  betFlop: "33,75",
  betTurnRiver: "60",
  raise: "60",
  unitScale: 10,
};

// hi lessons use the root-node observations in main-site gto-solver-series-spec §4-B.
// Do not back-translate retired claims from older locale lessons (see hi_번역_C.md).
export const PRESETS: Preset[] = [
  {
    titleHi: "सूखा A-high board",
    lessonHi: "A-high board पर BB पहली बारी में 98.2% check करता है। यह preview केवल उसी पहले फ़ैसले को दिखाता है; इससे BB के check के बाद BTN की c-bet आवृत्ति नहीं पढ़ सकते। BB की range में कौन-से हैंड check करते हैं, देखें।",
    ...SRP,
    id: "srp-dry-ace",
    title: "드라이 A하이 보드",
    titleEn: "Dry Ace-High Board",
    titleTr: "Kuru A-high board",
    titleVi: "Board A-high khô",
    titleRu: "Сухой борд туз-хай",
    board: "Ah 7d 2c",
    lesson:
      "레인지 우위 교과서. 이 A하이 보드에서 BB는 첫 액션의 98.2%를 체크합니다(BB 에퀴티 45.1%). 먼저 벳하는 1.9%가 어떤 핸드인지 살펴보세요.",
    lessonEn:
      "The textbook range-advantage spot. On this ace-high board BB checks 98.2% of the time on its first action (BB equity 45.1%). See which hands make up the 1.9% that bets.",
    lessonTr:
      "Ders kitabı gibi bir range avantajı spotu. Bu A-high board'da BB ilk aksiyonunda %98,2 check yapıyor (BB'nin equity'si %45,1). Bet yapan %1,9'u hangi ellerin oluşturduğuna bak.",
    lessonVi: "Spot kinh điển về lợi thế range. Trên board A-high này, BB check 98,2% ở hành động đầu tiên (equity của BB: 45,1%). Hãy xem những tay bài nào tạo nên 1,9% bet.",
    lessonRu: "Хрестоматийный спот с преимуществом диапазона. На этом борде туз-хай BB первым действием чекает в 98,2% случаев (эквити BB — 45,1%). Посмотри, какие руки составляют те 1,9%, что ставят.",
    titleJa: "ドライなAハイボード",
    lessonJa:
      "レンジ優位の教科書的スポットです。このAハイボードでBBは最初のアクションで98.2%チェックします（BBのエクイティ45.1%）。先にベットする1.9%がどんなハンドか見てみましょう。",
    titleEs: "Board seco A-high",
    lessonEs:
      "El spot de manual de la ventaja de rango. En este board A-high, BB hace check el 98.2% de las veces en su primera acción (equity de BB: 45.1%). Mira qué manos forman el 1.9% que apuesta.",
    titlePt: "Board seco A-high",
    lessonPt:
      "O spot clássico de vantagem de range. Neste board A-high, o BB dá check 98,2% das vezes na primeira ação (equity do BB: 45,1%). Veja quais mãos formam os 1,9% que apostam.",
    titleDe: "Trockenes A-High-Board",
    titleZh: "干燥的 A 高牌面",
    titleZhHant: "乾燥的 A 高牌面",
    lessonDe:
      "Der Lehrbuch-Spot für den Range-Vorteil. Auf diesem A-High-Board checkt BB bei der ersten Aktion 98,2% (Equity von BB: 45,1%). Schau dir an, welche Hände die 1,9% Bets ausmachen.",
    lessonZh: "这是范围优势的教科书。在这个 A 高牌面上，BB 第一次行动有 98.2% 过牌（BB 胜率 45.1%）。看看先下注的那 1.9% 是哪些手牌。",
    lessonZhHant: "這是範圍優勢的教科書。在這個 A 高牌面上，BB 第一次行動有 98.2% 過牌（BB 勝率 45.1%）。看看先下注的那 1.9% 是哪些手牌。",
    titleFr: "Board sec A-high",
    lessonFr:
      "Le cas d'école de l'avantage de range. Sur ce board A-high, BB checke 98,2 % du temps à sa première action (equity de BB : 45,1 %). Regarde quelles mains composent les 1,9 % qui misent.",
    titleId: "Board kering A-high",
    lessonId:
      "Contoh klasik range advantage. Di board A-high ini BB check 98,2% pada aksi pertamanya (equity BB 45,1%). Lihat hand mana saja yang membentuk 1,9% yang bet.",
    titleMs: "Board kering A-high",
    lessonMs:
      "Spot klasik untuk range advantage. Di board A-high ini BB check 98.2% pada tindakan pertamanya (equity BB 45.1%). Lihat tangan mana yang membentuk 1.9% yang bet.",
  },
  {
    titleHi: "सूखा K-high board",
    lessonHi: "BB इस K-high board पर पहली बारी में 99.8% check करता है। BB की equity 46.3% है, लेकिन EQR 80.7% है। दोनों आँकड़ों का फ़र्क़ देखें: equity होना और उसे EV में बदल पाना एक ही बात नहीं है।",
    ...SRP,
    id: "srp-dry-king",
    title: "드라이 K하이 보드",
    titleEn: "Dry King-High Board",
    titleTr: "Kuru K-high board",
    titleVi: "Board K-high khô",
    titleRu: "Сухой борд король-хай",
    board: "Ks 8d 3c",
    lesson:
      "A하이 보드와 비교해보세요. K 보드도 BTN 우위지만 미묘하게 체크가 늘어납니다. 왜일까요?",
    lessonEn:
      "Compare with the ace-high board. King-high still favors BTN, but there's a bit more checking. Can you tell why?",
    lessonTr:
      "A-high board ile karşılaştır. K-high hâlâ BTN'nin lehine ama check biraz daha sık. Nedenini bulabilir misin?",
    lessonVi: "So sánh với board A-high. K-high vẫn có lợi cho BTN, nhưng check nhiều hơn một chút. Bạn có đoán được vì sao không?",
    lessonRu: "Сравни с бордом туз-хай. Король-хай тоже в пользу BTN, но чеков чуть больше. Понимаешь почему?",
    titleJa: "ドライなKハイボード",
    lessonJa:
      "Aハイボードと比較してみましょう。KハイボードでもBTN優位ですが、チェックがわずかに増えます。なぜでしょうか？",
    titleEs: "Board seco K-high",
    lessonEs:
      "Compáralo con el board A-high. El board K-high también favorece a BTN, pero los checks aumentan un poco. ¿Sabes por qué?",
    titlePt: "Board seco K-high",
    lessonPt:
      "Compare com o board A-high. O board K-high também favorece o BTN, mas os checks aumentam um pouco. Sabe dizer por quê?",
    titleDe: "Trockenes K-High-Board",
    titleZh: "干燥的 K 高牌面",
    titleZhHant: "乾燥的 K 高牌面",
    lessonDe:
      "Vergleiche es mit dem A-High-Board. K-High begünstigt den BTN ebenfalls, aber es wird etwas öfter gecheckt. Weißt du, warum?",
    lessonZh: "和 A 高牌面比一比。K 高牌面同样是 BTN 占优，但过牌会稍微多一点。为什么呢？",
    lessonZhHant: "和 A 高牌面比一比。K 高牌面同樣是 BTN 佔優，但過牌會稍微多一點。為什麼呢？",
    titleFr: "Board sec K-high",
    lessonFr:
      "Compare avec le board A-high. Le board K-high favorise aussi BTN, mais les checks augmentent un peu. Tu sais pourquoi ?",
    titleId: "Board kering K-high",
    lessonId:
      "Bandingkan dengan board A-high. Board K-high masih menguntungkan BTN, tetapi check-nya sedikit lebih sering. Tahu kenapa?",
    titleMs: "Board kering K-high",
    lessonMs:
      "Bandingkan dengan board A-high. Board K-high masih memihak BTN, tetapi check menjadi sedikit lebih kerap. Tahu kenapa?",
  },
  {
    titleHi: "जुड़ा हुआ Broadway board, two-tone",
    lessonHi: "इस जुड़े हुए Q-J-T board पर भी BB पहली बारी में 99.9% check करता है। बहुत-से draws होना अपने-आप donk bet करने की वजह नहीं बनता। किसी हैंड के बजाय दोनों पूरी ranges की बनावट देखें।",
    ...SRP,
    id: "srp-broadway",
    title: "브로드웨이 연결 투톤",
    titleEn: "Connected Broadway Board, Two-Tone",
    titleTr: "Bağlantılı broadway board, iki renkli",
    titleVi: "Board broadway liền nhau, hai chất",
    titleRu: "Связанный бродвейный борд, двухмастный",
    board: "Qs Jd Ts",
    lesson:
      "양쪽 다 맞은 것처럼 보이는 보드. 그런데 BB는 13스팟 중 에퀴티 실현율이 가장 낮습니다 — 77.9%, BTN은 119.4%. BB가 99.9% 체크하는 이유를 핸드 분류 패널에서 확인하세요.",
    lessonEn:
      "A board that looks like it hits both ranges. But BB realizes less equity here than in any of the 13 spots — 77.9% against BTN's 119.4% — and checks 99.9%. The hand-category panel shows why.",
    lessonTr:
      "İki range'e de oturuyor gibi görünen bir board. Ama BB, 13 spot içinde equity'sini en az burada realize ediyor — %77,9, BTN ise %119,4 — ve %99,9 sıklıkla check yapıyor. Nedenini el kategorisi paneli gösteriyor.",
    lessonVi: "Board trông như trúng cả hai range. Nhưng trong 13 spot, đây là nơi BB hiện thực hóa equity kém nhất — 77,9%, so với 119,4% của BTN — và check 99,9%. Khung Nhóm tay bài cho thấy lý do.",
    lessonRu: "Кажется, что этот борд попадает в оба диапазона. Но здесь BB реализует эквити хуже, чем в любом из 13 спотов, — 77,9% против 119,4% у BTN — и чекает 99,9%. Почему так, видно на панели «Руки».",
    titleJa: "ブロードウェイのコネクトボード（2トーン）",
    lessonJa:
      "両者に当たったように見えるボードです。ところがBBのエクイティ実現率は13スポット中で最も低く、77.9%（BTNは119.4%）。99.9%チェックになる理由を分類パネルで確かめましょう。",
    titleEs: "Broadway conectado, two-tone",
    lessonEs:
      "Un board que parece conectar con ambos rangos. Pero BB realiza menos equity aquí que en cualquiera de los 13 spots — 77.9% frente al 119.4% de BTN — y hace check el 99.9%. El panel de manos y proyectos explica por qué.",
    titlePt: "Board Broadway conectado, two-tone",
    lessonPt:
      "Um board que parece conectar com os dois ranges. Mas o BB realiza menos equity aqui do que em qualquer um dos 13 spots — 77,9% contra 119,4% do BTN — e dá check em 99,9%. O painel Mãos / Draws mostra o porquê.",
    titleDe: "Verbundenes Broadway-Board, Two-Tone",
    titleZh: "broadway 高张连张双色牌面",
    titleZhHant: "百老匯連張雙色牌面",
    lessonDe:
      "Ein Board, das beide Ranges zu treffen scheint. Doch BB realisiert hier weniger Equity als in jedem der 13 Spots – 77,9% gegen 119,4% beim BTN – und checkt zu 99,9%. Das Panel Hände / Draws zeigt, warum.",
    lessonZh: "看着像两边都打中的牌面。可 BB 的权益实现在 13 个案例里是最低的——77.9%，BTN 是 119.4%。BB 为什么 99.9% 都过牌，到“手牌/听牌”面板里找答案。",
    lessonZhHant: "看著像兩邊都打中的牌面。可 BB 的勝率實現在 13 個案例裡是最低的——77.9%，BTN 是 119.4%。BB 為什麼 99.9% 都過牌，到「手牌/聽牌」面板裡找答案。",
    titleFr: "Broadway connecté, bicolore",
    lessonFr:
      "Un board qui semble toucher les deux ranges. Pourtant c'est ici que BB réalise le moins bien son equity des 13 spots — 77,9 % réalisés contre 119,4 % pour BTN — et il check à 99,9 %. Le panneau « Mains / Tirages » montre pourquoi.",
    titleId: "Board Broadway terhubung, two-tone",
    lessonId:
      "Board yang tampak mengenai kedua range. Namun justru di sini BB merealisasikan equity paling rendah dari 13 spot — 77,9% berbanding 119,4% milik BTN — dan check 99,9%. Panel kategori hand menunjukkan alasannya.",
    titleMs: "Board Broadway bersambung, two-tone",
    lessonMs:
      "Board yang nampak seperti mengenai kedua-dua range. Namun di sinilah BB merealisasikan equity paling rendah antara 13 spot — 77.9% berbanding 119.4% milik BTN — dan check 99.9%. Panel kategori tangan menunjukkan sebabnya.",
  },
  {
    titleHi: "जुड़ा हुआ middle board, two-tone",
    lessonHi: "9-8-7 पर BB की पहली बारी की donk-bet आवृत्ति 23.7% है। फिर भी उसकी equity 48.5% है, इसलिए उसे पूरी range का फ़ायदा कहना सही नहीं होगा। यह preview BTN की अगली c-bet रणनीति नहीं दिखाता।",
    ...SRP,
    id: "srp-middle-connected",
    title: "미들 연결 투톤",
    titleEn: "Connected Middle Board, Two-Tone",
    titleTr: "Bağlantılı orta board, iki renkli",
    titleVi: "Board tầm trung liền nhau, hai chất",
    titleRu: "Связанный средний борд, двухмастный",
    board: "9h 8h 7c",
    lesson:
      "같은 BTN 대 BB라도 9-8-7 연결 보드에서는 BB가 첫 액션에 23.7%를 먼저 벳합니다 — A하이 보드보다 훨씬 많습니다. 그래도 에퀴티는 BB 48.5%로 BTN이 조금 앞섭니다. 어떤 핸드가 먼저 치는지 확인하세요.",
    lessonEn:
      "Same BTN vs BB, but on the connected 9-8-7 BB leads 23.7% on its first action — far more than on the ace-high board. Equity still slightly favors BTN — BB has 48.5%. Check which hands lead.",
    lessonTr:
      "Yine BTN - BB, ama bağlantılı 9-8-7'de BB ilk aksiyonunda %23,7 önden bet yapıyor — A-high board'dakinden çok daha sık. Yine de equity biraz BTN'den yana: BB'de %48,5. Hangi ellerin önden bet yaptığına bak.",
    lessonVi: "Vẫn là BTN vs BB, nhưng trên board liền nhau 9-8-7, BB bet trước 23,7% ở hành động đầu tiên, nhiều hơn hẳn so với board A-high. Dù vậy equity vẫn nghiêng nhẹ về BTN — BB có 48,5%. Hãy xem những tay nào bet trước.",
    lessonRu: "Снова BTN против BB, но на связанном 9-8-7 BB первым действием ставит в 23,7% случаев — намного чаще, чем на борде туз-хай. При этом эквити всё равно чуть на стороне BTN: у BB 48,5%. Посмотри, какие руки ставят первыми.",
    titleJa: "ミドルのコネクトボード（2トーン）",
    lessonJa:
      "同じBTN vs BBでも、9-8-7の連結ボードではBBが最初のアクションで23.7%先にベットします（Aハイボードよりずっと多い）。それでもエクイティはBB 48.5%で、わずかにBTNが上です。どのハンドが先に打つか確認しましょう。",
    titleEs: "Conectado medio, two-tone",
    lessonEs:
      "Mismo BTN vs BB, pero en el 9-8-7 conectado BB apuesta primero el 23.7% en su primera acción, mucho más que en el board A-high. Aun así, la equity favorece un poco a BTN: BB tiene el 48.5%. Revisa qué manos apuestan primero.",
    titlePt: "Board médio conectado, two-tone",
    lessonPt:
      "Mesmo BTN vs BB, mas no 9-8-7 conectado o BB aposta primeiro 23,7% na primeira ação, bem mais do que no board A-high. Mesmo assim, a equity favorece levemente o BTN: o BB tem 48,5%. Confira quais mãos apostam primeiro.",
    titleDe: "Verbundenes Middle-Board, Two-Tone",
    titleZh: "中张连张双色牌面",
    titleZhHant: "中張連張雙色牌面",
    lessonDe:
      "Wieder BTN gegen BB, aber auf dem verbundenen 9-8-7 bettet BB bei der ersten Aktion 23,7% zuerst – viel öfter als auf dem A-High-Board. Die Equity liegt trotzdem knapp bei BTN – BB hat 48,5%. Prüfe, welche Hände zuerst betten.",
    lessonZh: "同样是 BTN vs BB，在 9-8-7 连张牌面上 BB 第一次行动就有 23.7% 先下注，比 A 高牌面多得多。不过胜率仍是 BTN 略占上风——BB 为 48.5%。看看哪些手牌会先下注。",
    lessonZhHant: "同樣是 BTN vs BB，在 9-8-7 連張牌面上 BB 第一次行動就有 23.7% 先下注，比 A 高牌面多得多。不過勝率仍是 BTN 略佔上風——BB 為 48.5%。看看哪些手牌會先下注。",
    titleFr: "Board médian connecté, bicolore",
    lessonFr:
      "Toujours BTN contre BB, mais sur le 9-8-7 connecté, BB mise en premier 23,7 % du temps à sa première action, bien plus que sur le board A-high. L'equity reste pourtant légèrement en faveur de BTN : BB a 48,5 %. Vérifie quelles mains misent en premier.",
    titleId: "Board tengah terhubung, two-tone",
    lessonId:
      "Masih BTN vs BB, tetapi di board terhubung 9-8-7 BB bet lebih dulu 23,7% pada aksi pertamanya, jauh lebih sering daripada di board A-high. Meski begitu, equity masih sedikit berpihak ke BTN — BB 48,5%. Periksa hand mana yang bet lebih dulu.",
    titleMs: "Board tengah bersambung, two-tone",
    lessonMs:
      "Masih BTN lawan BB, tetapi di board bersambung 9-8-7 BB bet dahulu 23.7% pada tindakan pertamanya, jauh lebih kerap berbanding di board A-high. Namun equity masih sedikit memihak BTN — BB 48.5%. Semak tangan mana yang bet dahulu.",
  },
  {
    titleHi: "Monotone board (एक ही suit)",
    lessonHi: "तीनों board कार्ड एक ही suit के हैं। BB पहली बारी में 88.8% check करता है और कुल 11.2% bet करता है। Flush और flush draw वाले हैंड की रणनीति की तुलना करें; हर हैंड एक जैसा नहीं खेलता।",
    ...SRP,
    id: "srp-monotone",
    title: "몬톤 보드 (같은 무늬 3장)",
    titleEn: "Monotone Board (All One Suit)",
    titleTr: "Monoton board (hepsi aynı renk)",
    titleVi: "Board monotone (cả 3 lá cùng chất)",
    titleRu: "Монотонный борд (все карты одной масти)",
    board: "Qs 9s 2s",
    lesson:
      "큰 벳이 드물어지고 작은 벳/체크 위주가 되는 이유. 플러시 완성 핸드도 자주 체크하는 것을 관찰하세요.",
    lessonEn:
      "Watch why big bets give way to small bets and checks. Notice how often even made flushes just check.",
    lessonTr:
      "Büyük bet'lerin neden yerini küçük bet'lere ve check'e bıraktığını izle. Hazır floşların bile ne kadar sık yalnızca check yaptığına dikkat et.",
    lessonVi: "Hãy xem vì sao cược lớn nhường chỗ cho cược nhỏ và check. Để ý xem ngay cả tay đã thành Thùng cũng check thường xuyên đến mức nào.",
    lessonRu: "Смотри, почему крупные ставки уступают место маленьким и чекам. Заметь, как часто даже готовые флеши просто чекают.",
    titleJa: "モノトーンボード（同スート3枚）",
    lessonJa:
      "大きなベットが減り、小さなベットとチェックが中心になる理由を学びます。完成したフラッシュでさえ頻繁にチェックすることを観察しましょう。",
    titleEs: "Board monotone",
    lessonEs:
      "Las apuestas grandes ceden el paso a apuestas pequeñas y checks. Fíjate con qué frecuencia incluso un color hecho se limita a hacer check.",
    titlePt: "Board monotone",
    lessonPt:
      "As apostas grandes ficam raras e dão lugar a apostas pequenas e checks. Repare com que frequência até um flush fechado só dá check.",
    titleDe: "Monotones Board (eine Farbe)",
    titleZh: "单色牌面（3 张同花）",
    titleZhHant: "單色牌面（3 張同花）",
    lessonDe:
      "Sieh, warum große Bets seltener werden und kleine Bets und Checks übernehmen. Achte darauf, wie oft selbst ein fertiger Flush nur checkt.",
    lessonZh: "看看大注为什么变少了，主要剩下小注和过牌。注意连已经成同花的牌都经常只过牌。",
    lessonZhHant: "看看大注為什麼變少了，主要剩下小注和過牌。注意連已經成同花的牌都經常只過牌。",
    titleFr: "Board monochrome",
    lessonFr:
      "Regarde pourquoi les grosses mises se raréfient au profit des petites mises et des checks. Remarque à quelle fréquence même une couleur faite se contente de checker.",
    titleId: "Board monotone (satu suit)",
    lessonId:
      "Perhatikan kenapa bet besar menghilang dan digantikan bet kecil serta check. Lihat seberapa sering flush yang sudah jadi pun hanya check.",
    titleMs: "Board monotone (satu suit)",
    lessonMs:
      "Perhatikan kenapa bet besar semakin hilang dan digantikan bet kecil serta check. Lihat betapa kerapnya flush yang sudah jadi pun sekadar check.",
  },
  {
    titleHi: "Paired board",
    lessonHi: "Board पर दो 6 होने के बावजूद BB पहली बारी में 97.0% check करता है। Trips, pairs और बिना pair वाले हैंड की रणनीति अलग-अलग देखें। केवल paired board होने से बार-बार bet करना तय नहीं होता।",
    ...SRP,
    id: "srp-paired",
    title: "페어 보드",
    titleEn: "Paired Board",
    titleTr: "Çiftli board",
    titleVi: "Board có đôi",
    titleRu: "Спаренный борд",
    board: "6c 6d 3h",
    lesson:
      "아무도 잘 못 맞춘 보드 → 블러프 비중이 올라갑니다. 어떤 핸드가 블러프 벳을 하는지 상세 표에서 찾아보세요.",
    lessonEn:
      "Nobody connects with this board, so the bluffing frequency goes up. Use the detail table to find which hands bet as bluffs.",
    lessonTr:
      "Bu board kimseye pek oturmuyor, bu yüzden blöf sıklığı artıyor. Hangi ellerin blöf olarak bet yaptığını detay tablosunda bul.",
    lessonVi: "Board này hầu như không trúng ai, nên tần suất bluff tăng lên. Dùng bảng chi tiết để tìm những tay bài bet bluff.",
    lessonRu: "В этот борд никто толком не попадает, поэтому частота блефа растёт. Найди в подробной таблице руки, которые ставят блефом.",
    titleJa: "ペアボード",
    lessonJa:
      "どちらのレンジもボードとほとんど噛み合いません → ブラフの比率が上がります。どのハンドがブラフベットをするのか、詳細表で探してみましょう。",
    titleEs: "Board pareado",
    lessonEs:
      "Nadie conecta con este board, así que la proporción de bluffs sube. Usa la tabla de detalle para encontrar qué manos apuestan como bluff.",
    titlePt: "Board pareado",
    lessonPt:
      "Ninguém conecta com este board, então a proporção de blefes sobe. Use a tabela de detalhes para achar quais mãos apostam como blefe.",
    titleDe: "Gepaartes Board",
    titleZh: "对子牌面",
    titleZhHant: "對子牌面",
    lessonDe:
      "Niemand trifft dieses Board, also steigt die Bluff-Frequenz. Finde in der Übersicht heraus, welche Hände als Bluff betten.",
    lessonZh: "谁都不太容易打中的牌面，诈唬（bluff）的频率就上去了。到详情表里找找看，是哪些手牌被当作诈唬来下注。",
    lessonZhHant: "誰都不太容易打中的牌面，詐唬（bluff）的頻率就上去了。到詳情表裡找找看，是哪些手牌被當作詐唬來下注。",
    titleFr: "Board pairé",
    lessonFr:
      "Personne ne touche ce board, donc la part de bluffs augmente. Utilise le tableau détaillé pour trouver quelles mains misent en bluff.",
    titleId: "Board paired",
    lessonId:
      "Tidak ada yang mengenai board ini, jadi porsi bluff naik. Gunakan tabel detail untuk menemukan hand mana yang bet sebagai bluff.",
    titleMs: "Board paired",
    lessonMs:
      "Tiada siapa yang berinteraksi dengan board ini, jadi kadar bluff meningkat. Gunakan jadual terperinci untuk mencari tangan mana yang bet sebagai bluff.",
  },
  {
    titleHi: "नीचा rainbow board",
    lessonHi: "BB पहली बारी में 96.8% check करता है। इस ट्री में flop पर केवल 33% pot का bet उपलब्ध है। Preview में check के बाद की शाखा नहीं है, इसलिए इससे check-raise की आवृत्ति का दावा नहीं कर सकते।",
    ...SRP,
    id: "srp-low-rainbow",
    title: "로우 레인보우 보드",
    board: "6s 5h 2d",
    // 로우 레인보우는 보드가 레인지를 거의 안 가려 콤보 수가 최대 →
    // 벳 2종이면 16비트로도 3.91GB(한도 3.9GB 초과)라 플랍 벳 1종으로 다이어트
    betFlop: "33",
    titleEn: "Low Rainbow Board",
    titleTr: "Düşük rainbow board",
    titleVi: "Board thấp rainbow (3 lá khác chất)",
    titleRu: "Низкий радужный борд",
    lesson:
      "6-5-2 로우 보드에서 BB는 첫 액션의 96.8%를 체크합니다. 이 스팟의 플랍 벳은 팟 33% 한 가지뿐이고, BB가 그 벳을 고르는 비율은 3.2%입니다. 벳하는 핸드가 무엇인지 보세요.",
    lessonEn:
      "On the low 6-5-2, BB checks 96.8% of the time on its first action. This spot has a single flop bet size, 33% pot, and BB uses it 3.2% of the time. See which hands bet.",
    lessonTr:
      "Düşük 6-5-2'de BB ilk aksiyonunda %96,8 check yapıyor. Bu spotta flop'ta tek bir bet boyutu var, pot'un %33'ü; BB onu %3,2 sıklıkla kullanıyor. Hangi ellerin bet yaptığına bak.",
    lessonVi: "Trên board thấp 6-5-2, BB check 96,8% ở hành động đầu tiên. Spot này chỉ có một cỡ bet ở flop là 33% pot, và BB dùng nó 3,2%. Hãy xem những tay nào bet.",
    lessonRu: "На низком 6-5-2 BB первым действием чекает в 96,8% случаев. В этом споте на флопе только один сайзинг — 33% банка, и BB выбирает его в 3,2% случаев. Посмотри, какие руки ставят.",
    titleJa: "ロー・レインボーボード",
    lessonJa:
      "6-5-2のローボードで、BBは最初のアクションで96.8%チェックします。このスポットのフロップのベットサイズはポットの33%の1種類だけで、BBがそれを選ぶのは3.2%です。ベットするハンドを見てみましょう。",
    titleEs: "Board bajo y rainbow",
    lessonEs:
      "En el 6-5-2 bajo, BB hace check el 96.8% de las veces en su primera acción. Este spot tiene un solo tamaño de apuesta en el flop, 33% del bote, y BB lo usa el 3.2% de las veces. Mira qué manos apuestan.",
    titlePt: "Board baixo e rainbow",
    lessonPt:
      "No 6-5-2 baixo, o BB dá check 96,8% das vezes na primeira ação. Este spot tem um único tamanho de aposta no flop, 33% do pote, e o BB o usa 3,2% das vezes. Veja quais mãos apostam.",
    titleDe: "Niedriges Rainbow-Board",
    titleZh: "低张彩虹牌面",
    titleZhHant: "低張彩虹牌面",
    lessonDe:
      "Auf dem niedrigen 6-5-2 checkt BB bei der ersten Aktion 96,8%. In diesem Spot gibt es auf dem Flop nur eine Bet-Size, 33% Pot, und BB nutzt sie zu 3,2%. Sieh dir an, welche Hände betten.",
    lessonZh: "在 6-5-2 低张牌面上，BB 第一次行动有 96.8% 过牌。这个局面翻牌只有一种下注尺寸——底池的 33%，BB 选择它的比例是 3.2%。看看哪些手牌会下注。",
    lessonZhHant: "在 6-5-2 低張牌面上，BB 第一次行動有 96.8% 過牌。這個牌局翻牌只有一種下注尺寸——底池的 33%，BB 選擇它的比例是 3.2%。看看哪些手牌會下注。",
    titleFr: "Board bas rainbow",
    lessonFr:
      "Sur le 6-5-2 bas, BB checke 96,8 % du temps à sa première action. Ce spot n'a qu'une taille de mise au flop, 33 % du pot, et BB l'utilise 3,2 % du temps. Regarde quelles mains misent.",
    titleId: "Board rendah rainbow",
    lessonId:
      "Di board rendah 6-5-2, BB check 96,8% pada aksi pertamanya. Spot ini hanya punya satu ukuran bet di flop, 33% pot, dan BB memakainya 3,2%. Lihat hand mana yang bet.",
    titleMs: "Board rendah rainbow",
    lessonMs:
      "Di board rendah 6-5-2, BB check 96.8% pada tindakan pertamanya. Spot ini hanya ada satu saiz bet di flop, 33% pot, dan BB menggunakannya 3.2%. Lihat tangan mana yang bet.",
  },
  {
    titleHi: "A-high board, 3-bettor को फ़ायदा",
    lessonHi: "BB की equity 68.9% है और वह पहली बारी में अपनी पूरी range से bet करता है: 33% pot का bet 57.8%, और 66% pot का bet 42.2%। दोनों sizes इस्तेमाल होते हैं; केवल कम SPR से छोटे bet की वजह तय नहीं होती।",
    ...TBP,
    id: "3bp-ace-king",
    title: "3벳터 우위 A하이 보드",
    titleEn: "Ace-High Board, 3-Bettor's Edge",
    titleTr: "A-high board, 3-bet yapanın avantajı",
    titleVi: "Board A-high, lợi thế của bên 3-bet",
    titleRu: "Борд туз-хай в пользу 3-беттора",
    board: "Ad Ks 2h",
    lesson:
      "3벳 레인지(AK·AA·KK 다수)에 잘 맞는 플랍 — BB(3벳터) 에퀴티 68.9%. BB는 첫 액션에 레인지 전체로 벳합니다: 팟 33% 57.8%, 팟 66% 42.2%. 두 사이즈를 섞으니 어떤 핸드가 어느 사이즈를 고르는지 비교해 보세요.",
    lessonEn:
      "A flop that suits the 3-bet range, loaded with AK, AA and KK: BB, the 3-bettor, has 68.9% equity. BB bets its entire range on its first action — 57.8% at 33% pot and 42.2% at 66% pot. Compare which hands pick which size.",
    lessonTr:
      "Bolca AK, AA ve KK içeren 3-bet range'ine uyan bir flop: 3-bet yapan BB'nin equity'si %68,9. BB ilk aksiyonunda tüm range'iyle bet yapıyor — pot'un %33'ü ile %57,8, pot'un %66'sı ile %42,2. Hangi ellerin hangi boyutu seçtiğini karşılaştır.",
    lessonVi: "Flop hợp với range 3-bet đầy AK, AA và KK: BB, bên 3-bet, có equity 68,9%. BB bet với toàn bộ range ở hành động đầu tiên — 57,8% cỡ 33% pot và 42,2% cỡ 66% pot. So sánh xem tay nào chọn cỡ nào.",
    lessonRu: "Флоп, который подходит диапазону 3-бета, где полно AK, AA и KK: у BB, 3-беттора, эквити 68,9%. BB первым действием ставит всем диапазоном — 57,8% по 33% банка и 42,2% по 66% банка. Сравни, какие руки выбирают какой сайзинг.",
    titleJa: "3ベッター優位のAハイボード",
    lessonJa:
      "3ベットレンジ（AK・AA・KKが多い）に合うフロップです。3ベッターのBBのエクイティは68.9%。BBは最初のアクションでレンジ全体をベットします — ポット33%が57.8%、ポット66%が42.2%。どのハンドがどちらのサイズを選ぶか比べてみましょう。",
    titleEs: "Board A-high, ventaja del 3-bettor",
    lessonEs:
      "Un flop que encaja con el rango de 3-bet, lleno de AK, AA y KK: BB, el 3-bettor, tiene un 68.9% de equity. BB apuesta todo su rango en su primera acción: 57.8% al 33% del bote y 42.2% al 66%. Compara qué manos eligen cada tamaño.",
    titlePt: "Board A-high, vantagem do 3-bettor",
    lessonPt:
      "Um flop que combina com o range de 3-bet, cheio de AK, AA e KK: o BB, que deu o 3-bet, tem 68,9% de equity. O BB aposta com todo o range na primeira ação — 57,8% com 33% do pote e 42,2% com 66%. Compare quais mãos escolhem cada tamanho.",
    titleDe: "A-High-Board, Vorteil für den 3-Bettor",
    titleZh: "3bet 方占优的 A 高牌面",
    titleZhHant: "3bet 方佔優的 A 高牌面",
    lessonDe:
      "Ein Flop, der zur 3-Bet-Range voller AK, AA und KK passt: BB als 3-Bettor hat 68,9% Equity. BB bettet bei der ersten Aktion mit der ganzen Range – 57,8% mit 33% Pot und 42,2% mit 66% Pot. Vergleiche, welche Hände welche Size wählen.",
    lessonZh: "适合 3bet 范围（一堆 AK、AA、KK）的翻牌：3bet 方 BB 的胜率是 68.9%。BB 第一次行动用整个范围下注——33% 底池占 57.8%，66% 底池占 42.2%。比较一下哪些手牌选哪种尺寸。",
    lessonZhHant: "適合 3bet 範圍（一堆 AK、AA、KK）的翻牌：3bet 方 BB 的勝率是 68.9%。BB 第一次行動用整個範圍下注——33% 底池佔 57.8%，66% 底池佔 42.2%。比較一下哪些手牌選哪種尺寸。",
    titleFr: "Board A-high, avantage du 3-betteur",
    lessonFr:
      "Un flop qui convient à la range de 3-bet, pleine d'AK, AA et KK : BB, le 3-betteur, a 68,9 % d'equity. BB mise toute sa range à sa première action — 57,8 % à 33 % du pot et 42,2 % à 66 %. Compare quelles mains choisissent quelle taille.",
    titleId: "Board A-high, keunggulan 3-bettor",
    lessonId:
      "Flop yang cocok untuk range 3-bet yang penuh AK, AA, dan KK: BB sebagai 3-bettor punya equity 68,9%. BB bet dengan seluruh range pada aksi pertamanya — 57,8% dengan 33% pot dan 42,2% dengan 66% pot. Bandingkan hand mana yang memilih ukuran mana.",
    titleMs: "Board A-high, kelebihan 3-bettor",
    lessonMs:
      "Flop yang sesuai dengan range 3-bet yang penuh dengan AK, AA dan KK: BB sebagai 3-bettor mempunyai equity 68.9%. BB bet dengan seluruh range pada tindakan pertamanya — 57.8% dengan 33% pot dan 42.2% dengan 66% pot. Bandingkan tangan mana memilih saiz yang mana.",
  },
  {
    titleHi: "Draws वाला two-tone board",
    lessonHi: "BB इस Q-T-7 board पर पहली बारी में 66% pot का bet 98.4% इस्तेमाल करता है; 33% pot का bet 0.7% और check 0.8% है। A-K-2 वाले 3-bet pot से तुलना करें: SPR समान होने पर भी size का चुनाव बदलता है।",
    ...TBP,
    id: "3bp-dynamic",
    title: "다이나믹 투톤 보드",
    titleEn: "Dynamic Two-Tone Board",
    titleTr: "Dinamik iki renkli board",
    titleVi: "Board động, hai chất",
    titleRu: "Динамичный двухмастный борд",
    board: "Qh Th 7s",
    // ⚠ 빈도는 «normalizer»로 잰다 — «weights»가 아니다.
    //   화면(ActionSummary.vue)의 freq = Σ strategy×normalizer / Σ normalizer 다.
    //   weights로 재면 2/3 사이즈가 98.4534%(→98.5)가 나오고,
    //   normalizer로 재면 98.4437%(→98.4)가 나온다. 화면에 뜨는 값은 «98.4»다.
    //   2026-08-22에 우리가 98.5로 잘못 적었고 본체가 98.4로 잡아 줬다(2026-08-23).
    //   🪶 체크 0.8%는 우리가 맞았다 — 본체의 0.9%는 100-99.1로 «반올림된 값을 빼서» 나온 값이다.
    //   빈도를 인용할 때는 normalizer 기준으로 재고, 합을 빼서 구하지 말 것.
    lesson:
      "3벳팟인데 콜러에게도 좋은 카드가 많은 보드. 그런데 3벳터는 멈추지 않습니다 — 98.4%가 같은 2/3 사이즈로 나갑니다. 체크로 남는 0.8%가 어떤 핸드인지 보세요.",
    lessonEn:
      "A 3-bet pot on a board that suits the caller as well — and yet the 3-bettor doesn't slow down: 98.4% of the range fires the same two-thirds size. See which hands make up the 0.8% that checks.",
    lessonTr:
      "Call edene de uyan bir board'da 3-bet pot — yine de 3-bet yapan yavaşlamıyor: range'in %98,4'ü aynı üçte iki boyutla bet yapıyor. Check yapan %0,8'i hangi ellerin oluşturduğuna bak.",
    lessonVi: "Pot 3-bet trên board cũng hợp với bên call — vậy mà bên 3-bet không chậm lại: 98,4% range bet cùng một cỡ 2/3 pot. Xem những tay bài nào tạo nên 0,8% check.",
    lessonRu: "3-бет-пот на борде, который подходит и коллеру, — и всё же 3-беттор не сбавляет темп: 98,4% диапазона ставит один и тот же сайзинг в две трети банка. Посмотри, какие руки составляют те 0,8%, что чекает.",
    titleJa: "ダイナミックな2トーンボード",
    lessonJa:
      "3ベットポットなのにコーラーにも良いカードが多いボードです。それでも3ベッターは止まりません — 98.4%が同じ2/3サイズで打ちます。チェックに残る0.8%がどんなハンドか見てみましょう。",
    titleEs: "Board dinámico two-tone",
    lessonEs:
      "Un bote de 3-bet en un board que también le gusta al caller — y aun así el 3-bettor no frena: el 98.4% del rango dispara con el mismo tamaño de dos tercios. Mira qué manos forman ese 0.8% que hace check.",
    titlePt: "Board dinâmico two-tone",
    lessonPt:
      "Um pote de 3-bet num board que também agrada ao caller — e mesmo assim o 3-bettor não freia: 98,4% do range aposta com o mesmo tamanho de dois terços. Veja quais mãos formam os 0,8% que dão check.",
    titleDe: "Dynamisches Two-Tone-Board",
    titleZh: "多变的双色牌面",
    titleZhHant: "多變的雙色牌面",
    lessonDe:
      "Ein 3-Bet-Pot auf einem Board, das auch dem Caller liegt – und trotzdem bremst der 3-Bettor nicht: 98,4% der Range feuert mit derselben Zwei-Drittel-Size. Sieh dir an, welche Hände die 0,8% Check ausmachen.",
    lessonZh: "虽然是 3bet 底池，但这个牌面对跟注方也不差。可 3bet 方并不会收手——98.4% 的范围都用同一个 2/3 尺寸打出去。看看剩下过牌的 0.8% 是哪些手牌。",
    lessonZhHant: "雖然是 3bet 底池，但這個牌面對跟注方也不差。可 3bet 方並不會收手——98.4% 的範圍都用同一個 2/3 尺寸打出去。看看剩下過牌的 0.8% 是哪些手牌。",
    titleFr: "Board dynamique bicolore",
    lessonFr:
      "Un pot 3-bet sur un board qui convient aussi au caller — et pourtant le 3-betteur ne ralentit pas : 98,4 % de la range mise aux deux tiers du pot, toujours au même sizing. Regarde quelles mains composent les 0,8 % qui checkent.",
    titleId: "Board dinamis two-tone",
    lessonId:
      "Pot 3-bet di board yang juga cocok untuk caller — tetapi 3-bettor tidak mengendur: 98,4% range-nya bet dengan ukuran dua pertiga pot yang sama. Lihat hand mana saja yang membentuk 0,8% yang check.",
    titleMs: "Board dinamik two-tone",
    lessonMs:
      "Pot 3-bet di board yang turut menyebelahi caller — namun 3-bettor tetap tidak memperlahankan permainannya: 98.4% daripada range-nya bet dengan saiz dua pertiga pot yang sama. Lihat tangan mana yang membentuk 0.8% yang check.",
  },
  {
    titleHi: "नीचा सूखा board",
    lessonHi: "नीचे और सूखे board पर भी BB पहली बारी में 66% pot का bet 97.8% इस्तेमाल करता है। इस जगह strategy बड़े bet पर बहुत केंद्रित है; इसे केवल छोटे bet या बहुत कम हैंड से bet करने वाली रणनीति न मानें।",
    ...TBP,
    id: "3bp-low",
    title: "로우 드라이 보드",
    titleEn: "Low Dry Board",
    titleTr: "Düşük kuru board",
    titleVi: "Board thấp khô",
    titleRu: "Низкий сухой борд",
    board: "8d 5c 2s",
    lesson:
      "3벳 레인지가 통째로 빗나간 보드. 그래도 오버페어+A하이로 압박이 가능한 이유 — 에퀴티 vs 폴드에퀴티.",
    lessonEn:
      "A board that largely misses the 3-bettor's range — yet overpairs and ace-high hands keep the pressure on. Equity vs fold equity.",
    lessonTr:
      "3-bet yapanın range'ini büyük ölçüde ıskalayan bir board — yine de overpair'ler ve A-high eller baskıyı sürdürüyor. Equity mi, fold equity mi?",
    lessonVi: "Board phần lớn trượt range của bên 3-bet — vậy mà overpair và tay A-high vẫn giữ áp lực. Equity hay fold equity?",
    lessonRu: "Борд почти не попадает в диапазон 3-бета — но оверпары и руки туз-хай продолжают давить. Эквити против фолд-эквити.",
    titleJa: "ロー・ドライボード",
    lessonJa:
      "3ベットレンジがほぼ丸ごと外れるボードです。それでもオーバーペアとAハイで圧力をかけられる理由を学びます — エクイティ対フォールドエクイティです。",
    titleEs: "Board bajo y seco",
    lessonEs:
      "Un board que no conecta en absoluto con el rango del 3-bettor — y aun así los overpairs y las A-high mantienen la presión. Equity vs fold equity.",
    titlePt: "Board baixo e seco",
    lessonPt:
      "Um board que não conecta em nada com o range do 3-bettor — e mesmo assim os overpairs e as mãos A-high mantêm a pressão. Equity vs fold equity.",
    titleDe: "Niedriges, trockenes Board",
    titleZh: "低张干燥牌面",
    titleZhHant: "低張乾燥牌面",
    lessonDe:
      "Ein Board, das die Range des 3-Bettors weitgehend verfehlt – und trotzdem halten Overpairs und A-High den Druck aufrecht. Equity vs. Fold Equity.",
    lessonZh: "3bet 范围整个都没打中的牌面。可即便如此，超对和 A 高牌照样能施压——比的是胜率和 fold equity（弃牌率）。",
    lessonZhHant: "3bet 範圍整個都沒打中的牌面。但即便如此，超對和 A 高牌照樣能施壓——比的是勝率和棄牌權益（fold equity）。",
    titleFr: "Board bas et sec",
    lessonFr:
      "Un board qui rate presque toute la range du 3-betteur — et pourtant les overpairs et les mains hauteur As maintiennent la pression. Equity contre fold equity.",
    titleId: "Board rendah kering",
    lessonId:
      "Board yang hampir sepenuhnya meleset dari range 3-bettor — tetapi overpair dan hand A-high tetap menekan. Equity vs fold equity.",
    titleMs: "Board rendah kering",
    lessonMs:
      "Board yang hampir sepenuhnya terlepas daripada range 3-bettor — namun Overpair dan tangan A-high tetap menekan. Equity vs fold equity.",
  },
  {
    titleHi: "K-high board पर T",
    lessonHi: "SB पहली बारी में 67.4% bet और 32.6% check करता है। दोनों ranges चौड़ी हैं। यहाँ flop पर केवल 33% pot का bet उपलब्ध है, इसलिए यह परिणाम छोटे और बड़े sizes के बीच चुनाव नहीं दिखाता।",
    ...SBBB,
    id: "sb-king-mid",
    title: "K하이 미들킥 보드",
    titleEn: "King-High with a Ten",
    titleTr: "K-high, T'li board",
    titleVi: "Board K-high có lá 10",
    titleRu: "Король-хай с десяткой",
    board: "Kh Td 6s",
    // 블라인드전 와이드 레인지는 콤보 수가 최대 → 벳 2종이면 16비트로도
    // 4.18GB(한도 초과)라 플랍 벳 1종으로 다이어트 (sb-paired-ace는 보드가
    // 레인지를 많이 가려 2종으로도 한도 안이므로 유지)
    betFlop: "33",
    lesson:
      "블라인드전은 레인지가 넓어 서로 약합니다. 같은 K 보드라도 BTN vs BB 때와 빈도가 어떻게 다른지 비교.",
    lessonEn:
      "Blind vs Blind ranges are wide, so both ranges are weak. Compare the frequencies to the BTN-vs-BB Dry King-High Board spot.",
    lessonTr:
      "Blind vs blind'da range'ler geniş, bu yüzden iki range de zayıf. Sıklıkları BTN vs BB “Kuru K-high board” spotuyla karşılaştır.",
    lessonVi: "Ở blind vs blind, range hai bên đều rộng nên cả hai range đều yếu. So sánh tần suất với spot BTN vs BB “Board K-high khô”.",
    lessonRu: "В игре блайнд vs блайнд диапазоны широкие, поэтому оба диапазона слабые. Сравни частоты со спотом BTN vs BB «Сухой борд король-хай».",
    titleJa: "KTハイボード",
    lessonJa:
      "ブラインド戦はレンジが広く、お互いに弱いのが特徴です。同じKハイボードでも、BTN vs BBのときと頻度がどう違うか比較してみましょう。",
    titleEs: "Board K-T high",
    lessonEs:
      "En la guerra de ciegas los rangos son amplios y ambos jugadores llegan débiles al flop. Compara las frecuencias con el spot K-high de BTN vs BB.",
    titlePt: "Board K-high com um T",
    lessonPt:
      "No blind vs blind os ranges são amplos e os dois jogadores chegam fracos ao flop. Compare as frequências com o spot K-high de BTN vs BB.",
    titleDe: "K-High mit einer Zehn",
    titleZh: "K 高带 T 的牌面",
    titleZhHant: "K 高帶 10 的牌面",
    lessonDe:
      "Im Blind vs Blind sind die Ranges weit, beide kommen also schwach zum Flop. Vergleiche die Frequenzen mit dem Spot „Trockenes K-High-Board“ aus BTN vs BB.",
    lessonZh: "盲位对战双方范围都宽，所以到了翻牌两边都比较弱。同样是 K 高牌面，和 BTN vs BB 时的频率比一比，差在哪里。",
    lessonZhHant: "盲位對戰雙方範圍都寬，所以到了翻牌兩邊都比較弱。同樣是 K 高牌面，和 BTN vs BB 時的頻率比一比，差在哪裡。",
    titleFr: "Board K-high avec un T",
    lessonFr:
      "En blind vs blind, les ranges sont larges, donc les deux joueurs arrivent faibles au flop. Compare les fréquences avec le spot « Board sec K-high » de BTN vs BB.",
    titleId: "Board K-high dengan T",
    lessonId:
      "Di blind vs blind, range-nya lebar, jadi kedua range sama-sama lemah. Bandingkan frekuensinya dengan spot Board kering K-high di BTN vs BB.",
    titleMs: "Board K-high dengan T",
    lessonMs:
      "Dalam blind vs blind, range kedua-dua pemain luas, jadi kedua-duanya sampai ke flop dalam keadaan lemah. Bandingkan frekuensinya dengan spot Board kering K-high di BTN vs BB.",
  },
  {
    titleHi: "जुड़ा हुआ low board, two-tone",
    lessonHi: "7-6-5 पर SB पहली बारी में 90.4% check और 9.6% bet करता है। यहाँ flop पर केवल 33% pot का bet उपलब्ध है, इसलिए यह परिणाम छोटे और बड़े sizes के बीच चुनाव नहीं दिखाता। SB की equity 49.6% है, लेकिन EQR 85.3% तक गिरता है। चौड़ी range के साथ OOP खेलते समय equity को EV में बदलने की मुश्किल देखें।",
    ...SBBB,
    id: "sb-connected",
    title: "로우 연결 투톤",
    titleEn: "Connected Low Board, Two-Tone",
    titleTr: "Bağlantılı düşük board, iki renkli",
    titleVi: "Board thấp liền nhau, hai chất",
    titleRu: "Связанный низкий борд, двухмастный",
    board: "7d 6d 5c",
    betFlop: "33", // sb-king-mid와 동일한 메모리 사유
    lesson:
      "와이드 레인지끼리 만나는 초연결 보드. 투페어·스트레이트·드로우가 쏟아집니다. 분류 패널이 화려한 스팟.",
    lessonEn:
      "Two wide ranges collide on an ultra-connected board: two-pair hands, straights, and draws everywhere. The hand-category panel shines here.",
    lessonTr:
      "İki geniş range çok bağlantılı bir board'da çarpışıyor: her yerde iki çift, kent ve draw'lar. El kategorisi paneli tam burada işe yarıyor.",
    lessonVi: "Hai range rộng va chạm trên board cực kỳ liền nhau: Hai Đôi, Sảnh và draw ở khắp nơi. Khung Nhóm tay bài phát huy tác dụng ở đây.",
    lessonRu: "Два широких диапазона сталкиваются на сверхсвязанном борде: две пары, стриты и дро повсюду. Здесь особенно полезны панели «Руки» и «Дро».",
    titleJa: "ローのコネクトボード（2トーン）",
    lessonJa:
      "ワイドレンジ同士がぶつかる非常にコネクトしたボードです。ツーペア・ストレート・ドローが続出します。分類パネルがにぎやかになるスポットです。",
    titleEs: "Bajo conectado, two-tone",
    lessonEs:
      "Dos rangos amplios chocan en un board ultraconectado: dobles parejas, escaleras y proyectos por todos lados. Aquí es donde el panel de clasificación se luce.",
    titlePt: "Board baixo conectado, two-tone",
    lessonPt:
      "Dois ranges amplos se chocam num board ultraconectado: dois pares, straights e draws por todo lado. É aqui que o painel Mãos / Draws brilha.",
    titleDe: "Verbundenes Low-Board, Two-Tone",
    titleZh: "低张连张双色牌面",
    titleZhHant: "低張連張雙色牌面",
    lessonDe:
      "Zwei weite Ranges treffen auf einem extrem verbundenen Board aufeinander: Zwei Paare, Straßen und Draws überall. Hier glänzt das Panel Hände / Draws.",
    lessonZh: "两个宽范围撞上一个连张性极强的牌面。两对、顺子、听牌满地都是——这是“手牌/听牌”面板最热闹的一个局面。",
    lessonZhHant: "兩個寬範圍撞上一個連張性極強的牌面。兩對、順子、聽牌滿地都是——這是「手牌/聽牌」面板最熱鬧的一個局面。",
    titleFr: "Board bas connecté, bicolore",
    lessonFr:
      "Deux ranges larges se percutent sur un board ultra-connecté : doubles paires, quintes et tirages partout. C'est ici que le panneau « Mains / Tirages » est le plus parlant.",
    titleId: "Board rendah terhubung, two-tone",
    lessonId:
      "Dua range lebar bertabrakan di board yang sangat terhubung: two pair, straight, dan draw ada di mana-mana. Panel kategori hand paling bersinar di sini.",
    titleMs: "Board rendah bersambung, two-tone",
    lessonMs:
      "Dua range luas berlanggar di board yang sangat bersambung: Two Pair, straight dan draw bertaburan di merata-rata tempat. Di sinilah panel kategori tangan paling menyerlah.",
  },
  {
    titleHi: "दो Ace वाला board",
    lessonHi: "SB पहली बारी में 33% pot का bet 79.6% इस्तेमाल करता है; 75% pot का bet 0.5% और check 19.8% है। यहाँ दोनों sizes उपलब्ध हैं, पर छोटे bet का इस्तेमाल कहीं ज़्यादा है। सभी दिखाई गई आवृत्तियाँ अलग-अलग round की गई हैं।",
    ...SBBB,
    id: "sb-paired-ace",
    title: "A 페어 보드",
    titleEn: "Ace-Paired Board",
    titleTr: "As çiftli board",
    titleVi: "Board đôi A",
    titleRu: "Борд со спаренными тузами",
    board: "As Ah 6d",
    // ⚠ 콤보 수 88/66은 «트립스»다 — «A를 든 콤보»(94/72)가 아니다.
    //   보드가 As Ah 6d라 A6는 트립스가 아니라 «에이스 풀하우스»다(AAA + 66).
    //   양쪽 다 A6가 정확히 6콤보씩이라 94-6=88 · 72-6=66이 된다.
    //   2026-08-22에 우리가 94/72로 잘못 적었고 본체가 88/66으로 잡아 줬다.
    //   레인지에서 «족보»를 셀 때는 보드와 페어를 이루는 킥커를 먼저 빼고 셀 것
    lesson:
      "A가 2장 깔린 특수 보드. 트립스는 드물지 않습니다 — SB가 88콤보로 BB(66콤보)보다 많아서 SB가 80.1%를 칩니다. 어느 쪽이 A를 더 들고 있는지가 이 보드의 전부입니다.",
    lessonEn:
      "Two aces on the board. Trips aren't rare — SB simply holds more of them (88 combos to BB's 66), so SB bets 80.1%. Who holds more aces is the whole story here.",
    lessonTr:
      "Board'da iki as var. Trips nadir değil — sadece SB'de daha fazla var (SB'de 88 combo, BB'de 66), bu yüzden SB %80,1 sıklıkla bet yapıyor. Burada her şey, kimin daha çok as tuttuğuna bağlı.",
    lessonVi: "Hai lá A trên board. Xám không hiếm — chỉ là SB có nhiều hơn (88 combo so với 66 của BB), nên SB bet 80,1%. Ai giữ nhiều lá A hơn mới là điều quyết định ở đây.",
    lessonRu: "На борде два туза. Трипсы не редкость — просто у SB их больше (88 комбо против 66 у BB), поэтому SB ставит 80,1%. Здесь всё решает то, у кого больше тузов.",
    titleJa: "Aペアボード",
    lessonJa:
      "Aが2枚落ちた特殊なボードです。トリップスは珍しくありません — SBが88コンボ、BBが66コンボで、Aを多く持つSBが80.1%打ちます。どちらがAを多く持つかがこのボードのすべてです。",
    titleEs: "Board con A pareado",
    lessonEs:
      "Dos ases en el board. Los tríos no son raros — SB simplemente tiene más (88 combos frente a los 66 de BB), así que SB apuesta el 80.1%. Quién tiene más ases lo explica todo aquí.",
    titlePt: "Board com A pareado",
    lessonPt:
      "Dois ases no board. As trincas não são raras — o SB simplesmente tem mais delas (88 combos contra 66 do BB), então o SB aposta 80,1%. Quem tem mais ases explica tudo aqui.",
    titleDe: "Board mit gepaartem Ass",
    titleZh: "A 对子牌面",
    titleZhHant: "A 對子牌面",
    lessonDe:
      "Zwei Asse auf dem Board. Drillinge sind nicht selten – SB hält einfach mehr davon (88 Combos gegen 66 beim BB), also bettet SB 80,1%. Wer mehr Asse hält, erklärt hier alles.",
    lessonZh: "牌面上摆着两张 A 的特殊局面。明三条（trips）并不少见——SB 有 88 个组合，BB 只有 66 个，所以 SB 打出 80.1%。谁手里的 A 更多，就是这个牌面的全部。",
    lessonZhHant: "牌面上擺著兩張 A 的特殊局面。明三條（trips）並不少見——SB 有 88 個組合，BB 只有 66 個，所以 SB 打出 80.1%。誰手裡的 A 更多，就是這個牌面的全部。",
    titleFr: "Board avec deux As",
    lessonFr:
      "Deux as sur le board. Les brelans ne sont pas rares — SB en a simplement plus (88 combos contre 66 pour BB), donc SB mise à 80,1 %. Toute la question sur ce board : qui a le plus d'as dans sa range.",
    titleId: "Board dengan dua As",
    lessonId:
      "Dua As di board. Trips tidak langka — SB sekadar punya lebih banyak (88 combo berbanding 66 milik BB), jadi SB bet 80,1%. Siapa yang memegang lebih banyak As, itulah inti board ini.",
    titleMs: "Board dengan dua Ace",
    lessonMs:
      "Dua Ace di board. Trips bukan sesuatu yang jarang — SB cuma memegang lebih banyak (88 combo berbanding 66 milik BB), jadi SB bet 80.1%. Siapa yang memegang lebih banyak Ace, itulah inti pati board ini.",
  },
];
