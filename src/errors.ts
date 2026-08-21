/*
 * 오류 수집 — 기기 안에만 모은다.
 *
 * 왜 자동 전송하지 않는가:
 *   설치 안전성 설명이 «비행기 모드에서도 돌아간다 = 계산이 기기 안에서 끝난다»를
 *   근거로 삼고 있어, 동의 없는 전송은 그 신뢰를 깎는다.
 *   → 기록은 localStorage에만 남기고, 보낼지는 사용자가 버튼을 눌러 결정한다.
 *   (「로그인 전엔 아무것도 전송 안 함」이라는 화면 문구는 2026-08-17 사용자 지시로
 *    뺐다 — 앞으로 동의 기반 자동 수집을 열 수 있게. 다만 몰래 보내지 않는 원칙은 유지)
 *
 * 무엇이 담기나: 시각·오류 메시지·스택 앞부분·화면 크기·브라우저 종류·빌드 번호.
 *   입력한 레인지나 학습 기록 같은 내용은 담지 않는다.
 */
import { reactive } from "vue";
import { pick } from "./i18n";

/** 빌드 시각 (webpack DefinePlugin이 채운다) — 어느 버전에서 난 오류인지 구분용 */
declare const __BUILD_ID__: string;

const KEY = "solver.errors";
const MAX_RECORDS = 20;
/** 같은 오류가 연달아 쏟아질 때 기록을 낭비하지 않도록 */
const DEDUPE_MS = 10_000;

export type ErrorRecord = {
  t: number;
  msg: string;
  stack: string;
  where: string;
};

export const errorState = reactive({
  /** 이 기기에 쌓인 오류 개수 */
  count: 0,
  /** 이번 방문에서 오류가 났는가 — 신고 안내를 띄울지 판단 */
  toast: false,
});

const read = (): ErrorRecord[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ErrorRecord[]) : [];
  } catch {
    return [];
  }
};

const write = (records: ErrorRecord[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(records.slice(-MAX_RECORDS)));
  } catch {
    /* 저장이 막힌 환경이면 조용히 포기한다 */
  }
};

const shortBrowser = () => {
  const ua = navigator.userAgent;
  if (/SamsungBrowser\/([\d.]+)/.test(ua))
    return pick("삼성 인터넷 ", "Samsung Internet ", "Samsung Internet ") + RegExp.$1;
  if (/Edg\/([\d.]+)/.test(ua)) return pick("엣지 ", "Edge ", "Edge ") + RegExp.$1;
  if (/Chrome\/([\d.]+)/.test(ua)) return pick("크롬 ", "Chrome ", "Chrome ") + RegExp.$1;
  if (/Firefox\/([\d.]+)/.test(ua)) return pick("파이어폭스 ", "Firefox ", "Firefox ") + RegExp.$1;
  if (/Version\/([\d.]+).*Safari/.test(ua)) return pick("사파리 ", "Safari ", "Safari ") + RegExp.$1;
  return pick("기타 브라우저", "Other browser", "その他のブラウザ", "Otro navegador", "Outro navegador", "Anderer Browser");
};

const record = (msg: string, stack: string) => {
  const records = read();
  const last = records[records.length - 1];
  if (last && last.msg === msg && Date.now() - last.t < DEDUPE_MS) return;

  records.push({
    t: Date.now(),
    msg: msg.slice(0, 300),
    stack: stack.split("\n").slice(0, 6).join("\n").slice(0, 600),
    where: location.pathname + location.search,
  });
  write(records);
  errorState.count = Math.min(records.length, MAX_RECORDS);
  errorState.toast = true;
};

/** 신고용 본문 — 사용자가 복사해서 커뮤니티나 문의로 보낼 수 있게 */
export const errorReportText = () => {
  const records = read();
  if (!records.length) return "";
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches;
  const head = [
    pick("홀덤마스터 GTO 솔버 오류 기록", "HoldemMaster GTO Solver error log", "HoldemMaster GTOソルバー エラーログ", "Registro de errores de HoldemMaster GTO Solver", "Registro de erros do HoldemMaster GTO Solver", "Fehlerprotokoll des HoldemMaster GTO Solvers"),
    `${pick("빌드", "Build", "ビルド")} ${__BUILD_ID__} · ${shortBrowser()} · ${pick("화면", "Screen", "画面", "Pantalla", "Tela", "Bildschirm")} ${window.innerWidth}x${window.innerHeight}`,
    `${pick("설치 실행", "Installed app", "インストール版", "App instalada", "App instalado", "Installierte App")}: ${standalone ? pick("예", "yes", "はい", "sí", "sim", "ja") : pick("아니오", "no", "いいえ", "no", "não", "nein")}`,
    "",
  ].join("\n");
  const body = records
    .slice()
    .reverse()
    .map((item, index) => {
      const time = new Date(item.t).toLocaleString(pick("ko-KR", "en-US", "ja-JP", "es-MX", "pt-BR", "de-DE"));
      return `[${index + 1}] ${time} (${item.where})\n${item.msg}\n${item.stack}`;
    })
    .join("\n\n");
  return head + body;
};

export const clearErrors = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* 무시 */
  }
  errorState.count = 0;
  errorState.toast = false;
};

export const dismissErrorToast = () => {
  errorState.toast = false;
};

export const setupErrorCapture = () => {
  errorState.count = read().length;

  window.addEventListener("error", (event) => {
    const target = event.target as (HTMLElement & { src?: string; href?: string }) | null;
    if (event.error) {
      record(String(event.message || event.error), String(event.error.stack || ""));
    } else if (target && target.tagName) {
      // 이미지·스크립트 로딩 실패는 error 객체가 없다
      record(
        `${target.tagName} ${pick("로딩 실패", "failed to load", "読み込み失敗", "no se pudo cargar", "não foi possível carregar", "konnte nicht geladen werden")}`,
        String(target.src || target.href || "")
      );
    } else if (event.message) {
      // 다른 출처의 스크립트에서 난 오류는 브라우저가 내용을 가린다("Script error.").
      // 스택은 못 받지만 «어디서 몇 번째 줄» 정도는 남겨야 단서가 된다.
      record(
        String(event.message),
        [event.filename, event.lineno && `${event.lineno}:${event.colno}`]
          .filter(Boolean)
          .join(" ")
      );
    }
    // preventDefault를 하지 않는다 — 브라우저 콘솔에도 그대로 남아야 한다
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    record(
      pick("처리되지 않은 오류: ", "Unhandled rejection: ", "未処理のエラー: ", "Error no controlado: ", "Erro não tratado: ", "Unbehandelter Fehler: ") + String(reason?.message ?? reason),
      String(reason?.stack ?? "")
    );
  });
};
