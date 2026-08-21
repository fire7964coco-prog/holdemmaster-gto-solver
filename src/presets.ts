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
  title: string;
  titleEn: string;
  titleJa: string;
  titleEs: string;
  titlePt: string;
  titleDe: string;
  board: string; // 예: "Ah 7d 2c"
  lesson: string; // 이 스팟에서 배우는 것
  lessonEn: string;
  lessonJa: string;
  lessonEs: string;
  lessonPt: string;
  lessonDe: string;
  oopLabel: string;
  oopLabelEn: string;
  oopLabelJa: string;
  oopLabelEs: string;
  oopLabelPt: string;
  oopLabelDe: string;
  ipLabel: string;
  ipLabelEn: string;
  ipLabelJa: string;
  ipLabelEs: string;
  ipLabelPt: string;
  ipLabelDe: string;
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
  preset: Pick<Preset, "title" | "titleEn" | "titleJa" | "titleEs" | "titlePt" | "titleDe">
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
    : preset.titleEn;
export const presetLessonOf = (
  preset: Pick<Preset, "lesson" | "lessonEn" | "lessonJa" | "lessonEs" | "lessonPt" | "lessonDe">
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
    : preset.lessonEn;
export const presetCategoryOf = (
  preset: Pick<Preset, "category" | "categoryEn" | "categoryJa" | "categoryEs" | "categoryPt" | "categoryDe">
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
    : preset.categoryEn;
export const oopLabelOf = (
  preset: Pick<Preset, "oopLabel" | "oopLabelEn" | "oopLabelJa" | "oopLabelEs" | "oopLabelPt" | "oopLabelDe">
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
    : preset.oopLabelEn;
export const ipLabelOf = (
  preset: Pick<Preset, "ipLabel" | "ipLabelEn" | "ipLabelJa" | "ipLabelEs" | "ipLabelPt" | "ipLabelDe">
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
  category: "싱글레이즈팟 — BTN vs BB (기본기)",
  categoryEn: "Single Raised Pot — BTN vs BB (Fundamentals)",
  categoryJa: "シングルレイズポット — BTN vs BB（基本）",
  categoryEs: "Single Raised Pot — BTN vs BB (fundamentos)",
  categoryPt: "Single Raised Pot — BTN vs BB (fundamentos)",
  categoryDe: "Single Raised Pot – BTN vs BB (Grundlagen)",
  oopLabel: "BB (콜러)",
  oopLabelEn: "BB (Caller)",
  oopLabelJa: "BB（コーラー）",
  oopLabelEs: "BB (caller)",
  oopLabelPt: "BB (caller)",
  oopLabelDe: "BB (Caller)",
  ipLabel: "BTN (오픈레이저)",
  ipLabelEn: "BTN (Opener)",
  ipLabelJa: "BTN（オープンレイザー）",
  ipLabelEs: "BTN (open-raiser)",
  ipLabelPt: "BTN (open-raiser)",
  ipLabelDe: "BTN (Open-Raiser)",
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
  category: "3벳팟 — BB 3벳 vs BTN 콜 (낮은 SPR)",
  categoryEn: "3-Bet Pot — BB 3-Bets, BTN Calls (Low SPR)",
  categoryJa: "3ベットポット — BB 3ベット vs BTN コール（低SPR）",
  categoryEs: "Bote de 3-bet — BB 3-betea y BTN paga (SPR bajo)",
  categoryPt: "Pote de 3-bet — BB dá 3-bet e BTN paga (SPR baixo)",
  categoryDe: "3-Bet-Pot – BB 3-bettet, BTN callt (niedriger SPR)",
  oopLabel: "BB (3벳터)",
  oopLabelEn: "BB (3-Bettor)",
  oopLabelJa: "BB（3ベッター）",
  oopLabelEs: "BB (3-bettor)",
  oopLabelPt: "BB (3-bettor)",
  oopLabelDe: "BB (3-Bettor)",
  ipLabel: "BTN (콜러)",
  ipLabelEn: "BTN (Caller)",
  ipLabelJa: "BTN（コーラー）",
  ipLabelEs: "BTN (caller)",
  ipLabelPt: "BTN (caller)",
  ipLabelDe: "BTN (Caller)",
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
  category: "블라인드전 — SB vs BB (와이드 레인지)",
  categoryEn: "Blind vs Blind — SB vs BB (Wide Ranges)",
  categoryJa: "ブラインド戦（BvB） — SB vs BB（ワイドレンジ）",
  categoryEs: "Guerra de ciegas — SB vs BB (rangos amplios)",
  categoryPt: "Blind vs Blind — SB vs BB (ranges amplos)",
  categoryDe: "Blind vs Blind – SB vs BB (weite Ranges)",
  oopLabel: "SB (오픈레이저)",
  oopLabelEn: "SB (Opener)",
  oopLabelJa: "SB（オープンレイザー）",
  oopLabelEs: "SB (open-raiser)",
  oopLabelPt: "SB (open-raiser)",
  oopLabelDe: "SB (Open-Raiser)",
  ipLabel: "BB (콜러)",
  ipLabelEn: "BB (Caller)",
  ipLabelJa: "BB（コーラー）",
  ipLabelEs: "BB (caller)",
  ipLabelPt: "BB (caller)",
  ipLabelDe: "BB (Caller)",
  oopRange: SB_OPEN,
  ipRange: BB_VS_SB,
  startingPot: 60,
  effectiveStack: 970,
  betFlop: "33,75",
  betTurnRiver: "60",
  raise: "60",
  unitScale: 10,
};

export const PRESETS: Preset[] = [
  {
    ...SRP,
    id: "srp-dry-ace",
    title: "드라이 A하이 보드",
    titleEn: "Dry Ace-High Board",
    board: "Ah 7d 2c",
    lesson:
      "레인지 우위 교과서. BB 체크 후 BTN이 작은 벳을 매우 넓게 치는 이유를 관찰하세요 (A가 오픈레이저에게 유리한 카드).",
    lessonEn:
      "The textbook range-advantage spot. Watch how wide a range BTN c-bets small with after BB checks — the ace smashes the opener's range.",
    titleJa: "ドライなAハイボード",
    lessonJa:
      "レンジ優位の教科書的スポットです。BBのチェック後、BTNが非常に広いレンジで小さくCベットする理由を観察しましょう（Aはオープンレイザーに有利なカードです）。",
    titleEs: "Board seco A-high",
    lessonEs:
      "El spot de manual de la ventaja de rango. Observa con qué rango tan amplio apuesta BTN con un c-bet pequeño después del check de BB — el as encaja de lleno en el rango del open-raiser.",
    titlePt: "Board seco A-high",
    lessonPt:
      "O spot clássico de vantagem de range. Repare como o BTN dá um c-bet pequeno com um range amplíssimo depois do check do BB — o ás acerta em cheio no range de quem abriu.",
    titleDe: "Trockenes A-High-Board",
    lessonDe:
      "Der Lehrbuch-Spot für den Range-Vorteil. Schau, wie weit die Range ist, mit der der BTN nach dem Check der BB eine kleine C-Bet macht – das Ass trifft die Range des Openers voll.",
  },
  {
    ...SRP,
    id: "srp-dry-king",
    title: "드라이 K하이 보드",
    titleEn: "Dry King-High Board",
    board: "Ks 8d 3c",
    lesson:
      "A하이 보드와 비교해보세요. K 보드도 BTN 우위지만 미묘하게 체크가 늘어납니다. 왜일까요?",
    lessonEn:
      "Compare with the ace-high board. King-high still favors BTN, but BTN starts checking a bit more. Can you tell why?",
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
    lessonDe:
      "Vergleiche es mit dem A-High-Board. K-High begünstigt den BTN ebenfalls, aber er checkt etwas öfter. Weißt du, warum?",
  },
  {
    ...SRP,
    id: "srp-broadway",
    title: "브로드웨이 연결 투톤",
    titleEn: "Connected Broadway Board, Two-Tone",
    board: "Qs Jd Ts",
    lesson:
      "양쪽 모두 강한 핸드가 많은 보드. 큰 벳과 체크레이즈가 활발해집니다. 드로우 분류 패널을 꼭 보세요.",
    lessonEn:
      "Both ranges connect hard with this board. Big bets and check-raises come alive — don't skip the hand-category panel.",
    titleJa: "ブロードウェイのコネクトボード（2トーン）",
    lessonJa:
      "両者のレンジに強いハンドが多いボードです。大きなベットとチェックレイズが活発になります。分類パネルも必ず確認しましょう。",
    titleEs: "Broadway conectado, two-tone",
    lessonEs:
      "Aquí ambos rangos conectan fuerte. Las apuestas grandes y los check-raises se vuelven protagonistas — no te saltes el panel de proyectos.",
    titlePt: "Board Broadway conectado, two-tone",
    lessonPt:
      "Aqui os dois ranges conectam forte. As apostas grandes e os check-raises viram protagonistas — não pule o painel Mãos / Draws.",
    titleDe: "Verbundenes Broadway-Board, Two-Tone",
    lessonDe:
      "Beide Ranges treffen dieses Board hart. Große Bets und Check-Raises leben auf – lass das Panel Hände / Draws nicht aus.",
  },
  {
    ...SRP,
    id: "srp-middle-connected",
    title: "미들 연결 투톤",
    titleEn: "Connected Middle Board, Two-Tone",
    board: "9h 8h 7c",
    lesson:
      "콜러(BB) 우위 보드의 대표. BTN의 C벳 빈도가 뚝 떨어지는 것을 확인하세요 — '무조건 C벳'이 왜 틀린지 배우는 스팟.",
    lessonEn:
      "The classic caller-friendly texture. BTN's c-bet frequency plummets — this spot shows exactly why “always c-bet” is wrong.",
    titleJa: "ミドルのコネクトボード（2トーン）",
    lessonJa:
      "コーラー（BB）優位ボードの代表例です。BTNのCベット頻度が大きく下がることを確認しましょう — 「常にCベット」がなぜ間違いなのかを学べるスポットです。",
    titleEs: "Conectado medio, two-tone",
    lessonEs:
      "La textura clásica que favorece al caller. La frecuencia de c-bet de BTN se desploma — este spot muestra exactamente por qué «siempre c-bet» es un error.",
    titlePt: "Board médio conectado, two-tone",
    lessonPt:
      "A textura clássica que favorece o caller. A frequência de c-bet do BTN despenca — este spot mostra exatamente por que «sempre dar c-bet» é um erro.",
    titleDe: "Verbundenes Middle-Board, Two-Tone",
    lessonDe:
      "Die klassische Textur für den Caller. Die C-Bet-Frequenz des BTN bricht ein – dieser Spot zeigt genau, warum „immer c-betten“ falsch ist.",
  },
  {
    ...SRP,
    id: "srp-monotone",
    title: "몬톤 보드 (같은 무늬 3장)",
    titleEn: "Monotone Board (All One Suit)",
    board: "Qs 9s 2s",
    lesson:
      "큰 벳이 사라지고 작은 벳/체크 위주가 되는 이유. 플러시 완성 핸드도 자주 체크하는 것을 관찰하세요.",
    lessonEn:
      "Watch why big bets disappear in favor of small bets and checks. Notice how often even made flushes just check.",
    titleJa: "モノトーンボード（同スート3枚）",
    lessonJa:
      "大きなベットが消え、小さなベットとチェックが中心になる理由を学びます。完成したフラッシュでさえ頻繁にチェックすることを観察しましょう。",
    titleEs: "Board monotone",
    lessonEs:
      "Las apuestas grandes desaparecen a favor de apuestas pequeñas y checks. Fíjate con qué frecuencia incluso un color hecho se limita a hacer check.",
    titlePt: "Board monotone",
    lessonPt:
      "As apostas grandes somem e dão lugar a apostas pequenas e checks. Repare com que frequência até um flush fechado só dá check.",
    titleDe: "Monotones Board (eine Farbe)",
    lessonDe:
      "Sieh, warum große Bets verschwinden und kleine Bets und Checks übernehmen. Achte darauf, wie oft selbst ein fertiger Flush nur checkt.",
  },
  {
    ...SRP,
    id: "srp-paired",
    title: "페어 보드",
    titleEn: "Paired Board",
    board: "6c 6d 3h",
    lesson:
      "아무도 잘 못 맞춘 보드 → 블러프 비중이 올라갑니다. 어떤 핸드가 블러프 벳을 하는지 상세 표에서 찾아보세요.",
    lessonEn:
      "Nobody connects with this board, so the bluffing frequency goes up. Use the detail table to find which hands bet as bluffs.",
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
    lessonDe:
      "Niemand trifft dieses Board, also steigt die Bluff-Frequenz. Finde in der Übersicht heraus, welche Hände als Bluff betten.",
  },
  {
    ...SRP,
    id: "srp-low-rainbow",
    title: "로우 레인보우 보드",
    board: "6s 5h 2d",
    // 로우 레인보우는 보드가 레인지를 거의 안 가려 콤보 수가 최대 →
    // 벳 2종이면 16비트로도 3.91GB(한도 3.9GB 초과)라 플랍 벳 1종으로 다이어트
    betFlop: "33",
    titleEn: "Low Rainbow Board",
    lesson:
      "오버카드 싸움. BB의 체크레이즈 빈도가 높아지는 보드 — 상단 스트립에서 벳 이후 응수를 따라가 보세요.",
    lessonEn:
      "An overcard war — BB check-raises often on this texture, so follow the top strip past a bet to see the responses.",
    titleJa: "ロー・レインボーボード",
    lessonJa:
      "オーバーカードの戦いです。BBのチェックレイズ頻度が高くなるボード — 上部ストリップでベット後の相手のアクションを追ってみましょう。",
    titleEs: "Board bajo y rainbow",
    lessonEs:
      "Una guerra de overcards. BB hace check-raise muy seguido en esta textura — sigue la tira superior después de una apuesta para ver las respuestas.",
    titlePt: "Board baixo e rainbow",
    lessonPt:
      "Uma guerra de overcards. O BB dá check-raise com muita frequência nesta textura — siga a faixa superior depois de uma aposta para ver as respostas.",
    titleDe: "Niedriges Rainbow-Board",
    lessonDe:
      "Ein Overcard-Krieg – die BB check-raist auf dieser Textur oft. Verfolge die obere Leiste über eine Bet hinaus, um die Antworten zu sehen.",
  },
  {
    ...TBP,
    id: "3bp-ace-king",
    title: "3벳터 우위 A하이 보드",
    titleEn: "Ace-High Board, 3-Bettor's Edge",
    board: "Ad Ks 2h",
    lesson:
      "3벳 레인지(AK, AA, KK 다수)에 최고의 보드. 낮은 SPR에서 작은 벳으로 레인지 전체를 압박하는 패턴.",
    lessonEn:
      "The best possible flop for the 3-bettor, whose range is loaded with AK, AA and KK. At low SPR, small bets pressure the entire range.",
    titleJa: "3ベッター優位のAハイボード",
    lessonJa:
      "3ベットレンジ（AK・AA・KKが多い）にとって最高のボードです。低SPRで小さなベットを使い、レンジ全体に圧力をかけるパターンを学びます。",
    titleEs: "Board A-high, ventaja del 3-bettor",
    lessonEs:
      "El mejor flop posible para el 3-bettor (cargado de AK, AA y KK). Con SPR bajo, las apuestas pequeñas presionan todo el rango.",
    titlePt: "Board A-high, vantagem do 3-bettor",
    lessonPt:
      "O melhor flop possível para o 3-bettor (carregado de AK, AA e KK). Com SPR baixo, apostas pequenas pressionam o range inteiro.",
    titleDe: "A-High-Board, Vorteil für den 3-Bettor",
    lessonDe:
      "Der bestmögliche Flop für den 3-Bettor, dessen Range voll mit AK, AA und KK ist. Bei niedrigem SPR setzen kleine Bets die ganze Range unter Druck.",
  },
  {
    ...TBP,
    id: "3bp-dynamic",
    title: "다이나믹 투톤 보드",
    titleEn: "Dynamic Two-Tone Board",
    board: "Qh Th 7s",
    lesson:
      "3벳팟인데 콜러에게도 좋은 카드가 많은 보드. 3벳터가 조심스러워지는 지점을 관찰하세요.",
    lessonEn:
      "A 3-bet pot on a board that suits the caller as well. Watch where the 3-bettor starts slowing down.",
    titleJa: "ダイナミックな2トーンボード",
    lessonJa:
      "3ベットポットなのにコーラーにも良いカードが多いボードです。3ベッターが慎重になる場面を観察しましょう。",
    titleEs: "Board dinámico two-tone",
    lessonEs:
      "Un bote de 3-bet en un board que también le gusta al caller. Observa dónde el 3-bettor empieza a frenar.",
    titlePt: "Board dinâmico two-tone",
    lessonPt:
      "Um pote de 3-bet num board que também agrada ao caller. Observe onde o 3-bettor começa a frear.",
    titleDe: "Dynamisches Two-Tone-Board",
    lessonDe:
      "Ein 3-Bet-Pot auf einem Board, das auch dem Caller liegt. Schau, ab wann der 3-Bettor zu bremsen beginnt.",
  },
  {
    ...TBP,
    id: "3bp-low",
    title: "로우 드라이 보드",
    titleEn: "Low Dry Board",
    board: "8d 5c 2s",
    lesson:
      "3벳 레인지가 통째로 빗나간 보드. 그래도 오버페어+A하이로 압박이 가능한 이유 — 에퀴티 vs 폴드에퀴티.",
    lessonEn:
      "A board that largely misses the 3-bettor's range — yet overpairs and ace-high hands keep the pressure on. Equity vs fold equity.",
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
    lessonDe:
      "Ein Board, das die Range des 3-Bettors weitgehend verfehlt – und trotzdem halten Overpairs und A-High den Druck aufrecht. Equity vs. Fold Equity.",
  },
  {
    ...SBBB,
    id: "sb-king-mid",
    title: "K하이 미들킥 보드",
    titleEn: "King-High with a Ten",
    board: "Kh Td 6s",
    // 블라인드전 와이드 레인지는 콤보 수가 최대 → 벳 2종이면 16비트로도
    // 4.18GB(한도 초과)라 플랍 벳 1종으로 다이어트 (sb-paired-ace는 보드가
    // 레인지를 많이 가려 2종으로도 한도 안이므로 유지)
    betFlop: "33",
    lesson:
      "블라인드전은 레인지가 넓어 서로 약합니다. 같은 K 보드라도 BTN vs BB 때와 빈도가 어떻게 다른지 비교.",
    lessonEn:
      "Blind vs Blind ranges are wide, so both ranges are weak. Compare the frequencies to the BTN-vs-BB Dry King-High Board spot.",
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
    lessonDe:
      "Im Blind vs Blind sind die Ranges weit, beide kommen also schwach zum Flop. Vergleiche die Frequenzen mit dem Spot „Trockenes K-High-Board“ aus BTN vs BB.",
  },
  {
    ...SBBB,
    id: "sb-connected",
    title: "로우 연결 투톤",
    titleEn: "Connected Low Board, Two-Tone",
    board: "7d 6d 5c",
    betFlop: "33", // sb-king-mid와 동일한 메모리 사유
    lesson:
      "와이드 레인지끼리 만나는 초연결 보드. 투페어·스트레이트·드로우가 쏟아집니다. 분류 패널이 화려한 스팟.",
    lessonEn:
      "Two wide ranges collide on an ultra-connected board: two-pair hands, straights, and draws everywhere. The hand-category panel shines here.",
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
    lessonDe:
      "Zwei weite Ranges treffen auf einem extrem verbundenen Board aufeinander: Zwei Paare, Straßen und Draws überall. Hier glänzt das Panel Hände / Draws.",
  },
  {
    ...SBBB,
    id: "sb-paired-ace",
    title: "A 페어 보드",
    titleEn: "Ace-Paired Board",
    board: "As Ah 6d",
    lesson:
      "A가 2장 깔린 특수 보드. 트립스가 흔치 않아 블러프 천국이 됩니다. 폴드 비율을 잘 보세요.",
    lessonEn:
      "With two aces on board, trips are rare — bluff heaven. Keep a close eye on the fold frequencies.",
    titleJa: "Aペアボード",
    lessonJa:
      "Aが2枚落ちた特殊なボードです。Aを持つスリーカードが珍しいため、ブラフ天国になります。フォールド頻度に注目しましょう。",
    titleEs: "Board con A pareado",
    lessonEs:
      "Con dos ases en el board, los tríos son poco frecuentes — el paraíso del bluff. Vigila de cerca las frecuencias de fold.",
    titlePt: "Board com A pareado",
    lessonPt:
      "Com dois ases no board, as trincas são raras — o paraíso do blefe. Fique de olho nas frequências de fold.",
    titleDe: "Board mit gepaartem Ass",
    lessonDe:
      "Mit zwei Assen auf dem Board sind Drillinge selten – ein Bluff-Paradies. Behalte die Fold-Frequenzen genau im Blick.",
  },
];
