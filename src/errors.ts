/*
 * 오류 수집 — 기기 안에만 모은다.
 *
 * 왜 자동 전송하지 않는가:
 *   이 앱은 「로그인하지 않으면 아무것도 전송되지 않습니다」를 사용법·README·트레이너
 *   화면에서 약속하고 있고, 설치 안전성 설명도 «비행기 모드에서도 돌아간다 = 서버로
 *   안 보낸다»를 근거로 삼는다. 오류를 몰래 보내면 그 약속이 깨진다.
 *   → 기록은 localStorage에만 남기고, 보낼지는 사용자가 버튼을 눌러 결정한다.
 *
 * 무엇이 담기나: 시각·오류 메시지·스택 앞부분·화면 크기·브라우저 종류·빌드 번호.
 *   입력한 레인지나 학습 기록 같은 내용은 담지 않는다.
 */
import { reactive } from "vue";

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
  if (/SamsungBrowser\/([\d.]+)/.test(ua)) return "삼성 인터넷 " + RegExp.$1;
  if (/Edg\/([\d.]+)/.test(ua)) return "엣지 " + RegExp.$1;
  if (/Chrome\/([\d.]+)/.test(ua)) return "크롬 " + RegExp.$1;
  if (/Firefox\/([\d.]+)/.test(ua)) return "파이어폭스 " + RegExp.$1;
  if (/Version\/([\d.]+).*Safari/.test(ua)) return "사파리 " + RegExp.$1;
  return "기타 브라우저";
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
  const head = [
    "홀덤마스터 GTO 솔버 오류 기록",
    `빌드 ${__BUILD_ID__} · ${shortBrowser()} · 화면 ${window.innerWidth}x${window.innerHeight}`,
    `설치 실행: ${
      window.matchMedia?.("(display-mode: standalone)").matches ? "예" : "아니오"
    }`,
    "",
  ].join("\n");
  const body = records
    .slice()
    .reverse()
    .map((item, index) => {
      const time = new Date(item.t).toLocaleString("ko-KR");
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
      record(`${target.tagName} 로딩 실패`, String(target.src || target.href || ""));
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
      "처리되지 않은 오류: " + String(reason?.message ?? reason),
      String(reason?.stack ?? "")
    );
  });
};
