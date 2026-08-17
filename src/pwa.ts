/*
 * PWA (홈 화면 설치 + 오프라인 학습) 앱 쪽 담당.
 *
 * 하는 일 3가지
 *   ① 서비스워커 등록 (dist/sw.js — webpack이 빌드 때 만든다)
 *   ② 설치 유도 배너의 «언제 띄울지» 판단
 *      - 첫 진입에 띄우면 거절률만 올린다. 교육 예제를 2개 이상 열었거나
 *        트레이너 문제를 3개 이상 푼 «써본 사람»에게만 보여준다.
 *   ③ 오프라인 학습 데이터 저장 지시 (트레이너 1.6MB + 교육 예제 13종)
 *      - 설치한 사용자에게만 자동으로 시킨다. 일반 방문자 데이터 요금을 축내지 않게.
 */
import { reactive } from "vue";
import type { SideView } from "./store";

const KEY_PRESET_VIEWS = "pwa.presetViews";
const KEY_TRAINER_SOLVED = "pwa.trainerSolved";
const KEY_DISMISSED_AT = "pwa.bannerDismissedAt";
const KEY_INSTALLED = "pwa.installed";

// 배너를 닫으면 2주간 다시 묻지 않는다.
const DISMISS_DAYS = 14;
// 배너를 띄우는 «써봤다» 기준
const PRESET_VIEWS_NEEDED = 2;
const TRAINER_SOLVED_NEEDED = 3;

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<unknown> };

export const pwa = reactive({
  /** 홈 화면에서 실행 중인가 (설치된 상태) */
  standalone: false,
  /** 크롬 계열이 설치 가능하다고 알려왔는가 */
  canInstall: false,
  /** iOS 사파리 — 설치 버튼이 없어 «공유 → 홈 화면에 추가» 안내가 필요 */
  isIOS: false,
  /** 삼성 인터넷 — 설치는 되지만 Play 프로텍트 경고가 뜬다(브라우저 쪽 문제) */
  isSamsung: false,
  /** 배너 노출 여부 */
  showBanner: false,
  /** 실행 인사 화면(설치해서 연 경우에만) 표시 여부 */
  showLaunch: false,
  /** 오프라인 데이터 저장 상태 */
  offlineSaving: false,
  offlineHave: 0,
  offlineTotal: 0,
});

let deferredPrompt: PromptEvent | null = null;

const readCount = (key: string) => {
  try {
    return Number(localStorage.getItem(key) ?? 0) || 0;
  } catch {
    return 0;
  }
};

const writeValue = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* 사생활 보호 모드 등에서 막히면 그냥 무시 */
  }
};

const detectStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  // iOS 사파리는 표준 미디어쿼리 대신 이 값을 쓴다
  (navigator as unknown as { standalone?: boolean }).standalone === true;

/**
 * 삼성 인터넷 감지.
 * 이 브라우저가 만드는 WebAPK를 Google Play 프로텍트가 신뢰하지 않아
 * 설치할 때 「안전하지 않은 앱 차단됨」 경고가 뜬다 (2026-08-15 실기기 확인).
 * 우리 앱·manifest 문제가 아니고 고칠 방법도 없어서, 크롬으로 열도록 안내한다.
 * 한국은 갤럭시 기본 브라우저라 그냥 두면 설치 시도가 그대로 막힌다.
 */
const detectSamsungInternet = () => /SamsungBrowser/i.test(navigator.userAgent);

const detectIOS = () => {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  // iPadOS 13+는 자신을 Mac이라고 말한다 — 터치 지원 여부로 가른다
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
};

const dismissedRecently = () => {
  const at = readCount(KEY_DISMISSED_AT);
  if (!at) return false;
  return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
};

const usedEnough = () =>
  readCount(KEY_PRESET_VIEWS) >= PRESET_VIEWS_NEEDED ||
  readCount(KEY_TRAINER_SOLVED) >= TRAINER_SOLVED_NEEDED;

const refreshBanner = () => {
  pwa.showBanner =
    !pwa.standalone &&
    readCount(KEY_INSTALLED) === 0 &&
    !dismissedRecently() &&
    usedEnough() &&
    (pwa.canInstall || pwa.isIOS);
};

/* ── 사용 기록 (배너 조건) ─────────────────────────────── */

/** 교육 예제 결과를 열었을 때 호출 */
export const notePresetOpened = () => {
  writeValue(KEY_PRESET_VIEWS, String(readCount(KEY_PRESET_VIEWS) + 1));
  refreshBanner();
};

/** 트레이너에서 문제를 하나 채점했을 때 호출 */
export const noteTrainerSolved = () => {
  writeValue(KEY_TRAINER_SOLVED, String(readCount(KEY_TRAINER_SOLVED) + 1));
  refreshBanner();
};

/* ── 설치 ──────────────────────────────────────────────── */

/** 배너의 [홈 화면에 추가] — 크롬 계열에서만 실제 설치창이 뜬다 */
export const promptInstall = async () => {
  if (!deferredPrompt) return;
  const event = deferredPrompt;
  deferredPrompt = null;
  pwa.canInstall = false;
  pwa.showBanner = false;
  await event.prompt();
};

/** 삼성 인터넷에서 [크롬으로 열기] — 크롬이 없으면 그냥 현재 주소로 떨어진다 */
export const openInChrome = () => {
  const target = `${location.host}/?view=trainer`;
  const fallback = encodeURIComponent(`${location.origin}/?view=trainer`);
  location.href =
    `intent://${target}#Intent;scheme=https;package=com.android.chrome;` +
    `S.browser_fallback_url=${fallback};end`;
};

/**
 * 소개 화면의 [홈 화면에 설치] 버튼.
 * 크롬 계열이면 바로 설치창을 띄우고, iOS·삼성 인터넷처럼 그럴 수 없는 환경에서는
 * 안내가 들어 있는 배너를 대신 연다(빈손으로 아무 일도 안 일어나면 안 된다).
 */
export const requestInstall = async () => {
  if (deferredPrompt) {
    await promptInstall();
    return;
  }
  writeValue(KEY_DISMISSED_AT, "0");
  pwa.showBanner = true;
};

/** 소개 화면에 설치 버튼을 보여줄 상황인가 */
export const canShowInstallButton = () =>
  !pwa.standalone && (pwa.canInstall || pwa.isIOS || pwa.isSamsung);

/** 배너의 [나중에] */
export const dismissBanner = () => {
  writeValue(KEY_DISMISSED_AT, String(Date.now()));
  pwa.showBanner = false;
};

/* ── 오프라인 학습 데이터 ───────────────────────────────── */

const postToServiceWorker = (message: unknown) => {
  navigator.serviceWorker?.controller?.postMessage(message);
};

/** 트레이너 결정 데이터 + 교육 예제 13종을 기기에 저장시킨다 */
export const saveOffline = () => {
  if (!navigator.serviceWorker?.controller) return;
  pwa.offlineSaving = true;
  postToServiceWorker({ type: "cache-data" });
};

export const checkOfflineStatus = () => postToServiceWorker({ type: "cache-status" });

/* ── 주소 파라미터로 첫 화면 지정 ────────────────────────── */

const VIEWS: SideView[] = [
  "about",
  "guide",
  "presets",
  "trainer",
  "preflop",
  "oop-range",
  "ip-range",
  "board",
  "tree-config",
  "run-solver",
];

/**
 * `?view=trainer` 로 들어오면 그 화면부터 연다.
 * 설치한 사람은 이미 «쓰러 온» 사람이라 소개 화면을 다시 볼 이유가 없다 →
 * manifest의 start_url과 바로가기가 이 파라미터를 쓴다.
 */
export const viewFromUrl = (): SideView | null => {
  const value = new URLSearchParams(location.search).get("view");
  if (!value) return null;
  return (VIEWS as string[]).includes(value) ? (value as SideView) : null;
};

/* ── 초기화 ────────────────────────────────────────────── */

/** 인사 화면 닫기 (탭하면 즉시) */
export const closeLaunch = () => {
  pwa.showLaunch = false;
};

export const setupPwa = () => {
  pwa.standalone = detectStandalone();
  pwa.isIOS = detectIOS();
  pwa.isSamsung = detectSamsungInternet();

  // 홈 화면 아이콘으로 연 경우에만 인사 화면을 띄운다.
  // 검색으로 들어온 웹 방문자에게는 지연일 뿐이라 보여주지 않는다.
  if (pwa.standalone) {
    pwa.showLaunch = true;
    setTimeout(closeLaunch, 1400);
  }
  refreshBanner();

  window.addEventListener("beforeinstallprompt", (event) => {
    // 크롬 기본 배너를 막고, 우리 조건에 맞을 때만 직접 띄운다
    event.preventDefault();
    deferredPrompt = event as PromptEvent;
    pwa.canInstall = true;
    refreshBanner();
  });

  window.addEventListener("appinstalled", () => {
    writeValue(KEY_INSTALLED, "1");
    pwa.showBanner = false;
    pwa.canInstall = false;
    deferredPrompt = null;
    // 설치한 사람에게는 지하철에서 쓸 데이터를 미리 채워둔다
    saveOffline();
  });

  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.addEventListener("message", (event) => {
    const data = event.data || {};
    if (data.type === "cache-status") {
      pwa.offlineHave = data.have;
      pwa.offlineTotal = data.total;
    } else if (data.type === "cache-data-done") {
      pwa.offlineSaving = false;
      pwa.offlineHave = data.total - (data.failed ?? 0);
      pwa.offlineTotal = data.total;
    }
  });

  // ⚠ load 이벤트를 기다리면 안 된다.
  // webpack의 asyncWebAssembly로 진입 모듈이 «비동기 모듈»이 되는 탓에
  // 이 코드가 실행되는 시점에는 이미 load가 지나간 뒤인 경우가 있다
  // (그러면 리스너가 영영 안 불려 서비스워커가 등록되지 않는다 —
  //  2026-08-15 pwa-verify.js가 실제로 이 상태를 잡아냈다).
  const registerWorker = () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(async () => {
        await navigator.serviceWorker.ready;
        checkOfflineStatus();
        // 이미 설치해서 쓰는 중이면 학습 데이터를 자동으로 확보한다
        if (pwa.standalone) saveOffline();
      })
      .catch((e) => console.warn("[pwa] 서비스워커 등록 실패", e));
  };

  if (document.readyState === "complete") registerWorker();
  else window.addEventListener("load", registerWorker, { once: true });
};
