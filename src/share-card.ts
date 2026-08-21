/*
 * 오늘의 문제 성적 카드 — 결과를 그림 한 장으로 만들어 카카오톡·SNS로 내보낸다.
 *
 * 왜 이미지인가: 커뮤니티 회원이 아직 적어 글로 올려도 반응이 없다(2026-08-16 사용자
 * 판단). 대신 포커 단톡방·인스타로 나가는 카드가 새 방문자를 데려온다 — 카드를 받은
 * 사람이 «오늘은 모두 같은 문제»를 풀러 들어오는 구조라 회원 수와 무관하게 작동한다.
 *
 * 전부 기기 안에서 그린다(캔버스). 서버 전송 없음.
 * 정답(어떤 액션이 최적인지)은 카드에 넣지 않는다 — 아직 안 푼 사람의 재미를 지킨다.
 */
import { cardText } from "./utils";
import { C } from "./theme";
import { i18n, localizeNumber } from "./i18n";

// 카드에 그려 넣는 고정 문구 — 카드 언어는 현재 화면 언어를 따른다
const CARD_TEXT = {
  ko: {
    brand: "홀덤마스터 GTO 트레이너",
    tagline: "매일 1문제 · 모두 같은 문제",
    heading: "오늘의 GTO 문제",
    board: "보드",
    hand: "내 핸드",
    result: (verdict: string) => `내 결과: ${verdict}`,
    evLine: (bb: string, streak: number) =>
      `EV 손실 ${bb}bb${streak > 1 ? ` · ${streak}일 연속 풀이 중` : ""}`,
    invite: "나도 같은 문제 풀어보기",
  },
  en: {
    brand: "HoldemMaster GTO Trainer",
    tagline: "One puzzle a day · same for everyone",
    heading: "Daily GTO Puzzle",
    board: "Board",
    hand: "My Hand",
    result: (verdict: string) => `My result: ${verdict}`,
    evLine: (bb: string, streak: number) =>
      `EV loss ${bb}bb${streak > 1 ? ` · ${streak}-day streak` : ""}`,
    invite: "Try today's puzzle",
  },
  ja: {
    brand: "HoldemMaster GTOトレーナー",
    tagline: "毎日1問・全員同じ問題",
    heading: "今日のGTO問題",
    board: "ボード",
    hand: "自分のハンド",
    result: (verdict: string) => `私の結果: ${verdict}`,
    evLine: (bb: string, streak: number) =>
      `EVロス ${bb}bb${streak > 1 ? `・${streak}日連続挑戦中` : ""}`,
    invite: "同じ問題を解いてみる",
  },
  es: {
    brand: "Entrenador GTO de HoldemMaster",
    tagline: "Un reto al día · el mismo para todos",
    heading: "Reto GTO del día",
    board: "Board",
    hand: "Mi mano",
    result: (verdict: string) => `Mi resultado: ${verdict}`,
    evLine: (bb: string, streak: number) =>
      `Pérdida de EV ${bb}bb${streak > 1 ? ` · racha de ${streak} días` : ""}`,
    invite: "Resuelve el mismo reto",
  },
  pt: {
    brand: "Treinador GTO da HoldemMaster",
    tagline: "Um desafio por dia · o mesmo para todos",
    heading: "Desafio GTO do dia",
    board: "Board",
    hand: "Minha mão",
    result: (verdict: string) => `Meu resultado: ${verdict}`,
    evLine: (bb: string, streak: number) =>
      `Perda de EV ${bb}bb${streak > 1 ? ` · sequência de ${streak} dias` : ""}`,
    invite: "Resolva o mesmo desafio",
  },
  de: {
    brand: "HoldemMaster GTO-Trainer",
    tagline: "Eine Aufgabe pro Tag · für alle dieselbe",
    heading: "GTO-Tagesaufgabe",
    board: "Board",
    hand: "Meine Hand",
    result: (verdict: string) => `Mein Ergebnis: ${verdict}`,
    evLine: (bb: string, streak: number) =>
      `EV-Verlust ${bb}bb${streak > 1 ? ` · ${streak} Tage in Folge` : ""}`,
    invite: "Dieselbe Aufgabe lösen",
  },
} as const;

export type DailyCardInput = {
  dateLabel: string; // "2026.08.16"
  spotTitle: string; // 프리셋 제목
  positionLabel: string; // "BTN (IP) 차례"
  potLabel: string; // "팟 5.5bb"
  board: number[]; // 보드 카드 id
  hand: number[]; // 내 핸드 카드 id 2장
  verdictText: string; // "최적 선택" 등
  verdictTone: "best" | "good" | "miss";
  evLossBb: number;
  streak: number; // 연속 일수 (1이면 표기 생략)
};

const WIDTH = 1080;
const HEIGHT = 1350;

// 앱과 같은 팔레트 (tailwind neutral + 브랜드 앰버 + 4색 덱)
const BG = "#141414";
const PANEL = "#232323";
const PANEL_BORDER = "#3d3d3d";
const AMBER = C.brand;
const DARK_GREEN = C.brandInk;
const TEXT = "#f5f5f5";
const TEXT_DIM = "#a3a3a3";
const TEXT_FAINT = "#737373";
const SUIT_COLORS = ["#22c55e", "#60a5fa", "#f87171", "#f5f5f5"]; // ♣ ♦ ♥ ♠

const TONE_COLORS = { best: "#6ee7b7", good: "#93c5fd", miss: "#fdba74" };

const FONT =
  "'Pretendard', 'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";

// 아이콘·인사 화면과 같은 스페이드 도안 (원본 viewBox 0 0 180 180)
const SPADE_PATH =
  "M90 22 C 90 22, 36 56, 36 88 C 36 112, 60 122, 90 110 " +
  "C 77 124, 74 142, 70 154 L110 154 C 106 142, 103 124, 90 110 " +
  "C 120 122, 144 112, 144 88 C 144 56, 90 22, 90 22 Z";

// roundRect는 구형 사파리에 없다 — 직접 그린다
const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const drawSpade = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 180, size / 180);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(SPADE_PATH));
  ctx.restore();
};

/** 카드 한 장(랭크+무늬 타일). 반환값은 그린 폭 */
const drawPokerCard = (
  ctx: CanvasRenderingContext2D,
  cardId: number,
  x: number,
  y: number,
  w: number
) => {
  const h = w * 1.38;
  const info = cardText(cardId);
  const color = SUIT_COLORS[cardId & 3];
  roundedRect(ctx, x, y, w, h, w * 0.12);
  ctx.fillStyle = "#1d1d1d";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#4a4a4a";
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.font = `700 ${Math.round(w * 0.52)}px ${FONT}`;
  ctx.fillText(info.rank, x + w / 2, y + h * 0.46);
  ctx.font = `400 ${Math.round(w * 0.44)}px ${FONT}`;
  ctx.fillText(info.suit, x + w / 2, y + h * 0.86);
  return w;
};

/** 카드 여러 장을 중앙 정렬로 그린다 */
const drawCardRow = (
  ctx: CanvasRenderingContext2D,
  cards: number[],
  centerX: number,
  y: number,
  cardW: number,
  gap: number
) => {
  const total = cards.length * cardW + (cards.length - 1) * gap;
  let x = centerX - total / 2;
  for (const card of cards) {
    drawPokerCard(ctx, card, x, y, cardW);
    x += cardW + gap;
  }
};

export const drawDailyCard = (input: DailyCardInput): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // 바탕
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const T = CARD_TEXT[i18n.locale];

  // 상단 브랜드 줄: 앰버 배지(스페이드) + 서비스명
  roundedRect(ctx, 72, 72, 92, 92, 24);
  ctx.fillStyle = AMBER;
  ctx.fill();
  drawSpade(ctx, 78, 78, 80, DARK_GREEN);
  ctx.textAlign = "left";
  ctx.fillStyle = TEXT;
  ctx.font = `700 44px ${FONT}`;
  ctx.fillText(T.brand, 192, 112);
  ctx.fillStyle = TEXT_DIM;
  ctx.font = `400 32px ${FONT}`;
  ctx.fillText(T.tagline, 192, 156);

  // 제목 + 날짜
  ctx.fillStyle = AMBER;
  ctx.font = `800 76px ${FONT}`;
  ctx.fillText(T.heading, 72, 292);
  ctx.fillStyle = TEXT_DIM;
  ctx.font = `600 40px ${FONT}`;
  ctx.fillText(input.dateLabel, 72, 352);

  // 문제 패널: 스팟 이름 + 보드/핸드 (핸드 줄 바닥 panelY+593 + 여백 40)
  const panelY = 408;
  const panelH = 633;
  roundedRect(ctx, 72, panelY, WIDTH - 144, panelH, 28);
  ctx.fillStyle = PANEL;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = PANEL_BORDER;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = TEXT;
  ctx.font = `700 42px ${FONT}`;
  ctx.fillText(input.spotTitle, WIDTH / 2, panelY + 76);
  ctx.fillStyle = TEXT_FAINT;
  ctx.font = `400 30px ${FONT}`;
  ctx.fillText(
    `${input.positionLabel} · ${input.potLabel}`,
    WIDTH / 2,
    panelY + 126
  );

  ctx.fillStyle = TEXT_FAINT;
  ctx.font = `600 28px ${FONT}`;
  ctx.fillText(T.board, WIDTH / 2, panelY + 190);
  drawCardRow(ctx, input.board, WIDTH / 2, panelY + 212, 118, 18);

  ctx.fillStyle = TEXT_FAINT;
  ctx.font = `600 28px ${FONT}`;
  ctx.fillText(T.hand, WIDTH / 2, panelY + 430 - 22);
  drawCardRow(ctx, input.hand, WIDTH / 2, panelY + 430, 118, 18);

  // 판정 — 문구가 길면(«허용 가능한 선택») 폭을 넘치므로 크기를 맞춰 줄인다
  const verdictY = 1122;
  ctx.textAlign = "center";
  ctx.fillStyle = TONE_COLORS[input.verdictTone];
  const verdictLine = T.result(input.verdictText);
  let verdictSize = 84;
  ctx.font = `800 ${verdictSize}px ${FONT}`;
  while (verdictSize > 48 && ctx.measureText(verdictLine).width > WIDTH - 144) {
    verdictSize -= 4;
    ctx.font = `800 ${verdictSize}px ${FONT}`;
  }
  ctx.fillText(verdictLine, WIDTH / 2, verdictY);
  ctx.fillStyle = TEXT_DIM;
  ctx.font = `500 36px ${FONT}`;
  ctx.fillText(
    T.evLine(localizeNumber(input.evLossBb.toFixed(3)), input.streak),
    WIDTH / 2,
    verdictY + 60
  );

  // 하단 앰버 바: 같은 문제로 초대
  const barY = HEIGHT - 120;
  ctx.fillStyle = AMBER;
  ctx.fillRect(0, barY, WIDTH, 120);
  ctx.fillStyle = DARK_GREEN;
  ctx.font = `700 38px ${FONT}`;
  ctx.fillText(T.invite, WIDTH / 2, barY + 52);
  ctx.font = `600 32px ${FONT}`;
  ctx.fillText("solver.holdemmaster.com", WIDTH / 2, barY + 96);

  return canvas;
};

const toBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

/** 이 기기에서 이미지 파일 공유(카카오톡 등 공유 시트)가 되는가 */
export const canShareCard = () => {
  if (typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({
      files: [new File([new Blob()], "t.png", { type: "image/png" })],
    });
  } catch {
    return false;
  }
};

/** 공유 시트 열기 (모바일). 사용자가 취소하면 조용히 끝낸다 */
export const shareCard = async (
  canvas: HTMLCanvasElement,
  fileName: string,
  text: string
): Promise<boolean> => {
  const blob = await toBlob(canvas);
  if (!blob) return false;
  const file = new File([blob], fileName, { type: "image/png" });
  try {
    await navigator.share({ files: [file], text });
    return true;
  } catch {
    return false; // 취소 포함 — 실패로 다그치지 않는다
  }
};

/** PNG로 내려받기 (데스크톱·공유 시트가 없는 브라우저) */
export const saveCard = async (
  canvas: HTMLCanvasElement,
  fileName: string
): Promise<boolean> => {
  const blob = await toBlob(canvas);
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return true;
};
