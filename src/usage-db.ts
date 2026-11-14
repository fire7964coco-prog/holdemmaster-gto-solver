/*
 * 이용 기록을 우리 DB에 하루 단위로 남긴다 (본체 MB-583·584 · 2026-11-14).
 * usage-analytics.ts만 이 파일을 부른다 → 계측을 싣지 않는 빌드에는 이 코드도 안 담긴다.
 * 서버 쪽 정본 = handoff-to-main-site/supabase_solver_usage.sql (RPC solver_usage_ping).
 *
 * 🔴 보내는 것 = 기기 무작위 ID · 이벤트 이름별 횟수 · 언어 · PC/모바일 · 설치 실행 여부 · 첫 유입 호스트.
 *    카드·보드·레인지·이메일·닉네임·User-Agent 원문은 보내지 않는다. 회원 ID와 날짜는 서버가 채운다.
 * 횟수는 저장소에 모았다가 묶어 보낸다(첫 기록 5초 뒤 · 탭이 가려질 때). 실패가 앱을 막으면 안 되므로 전부 try로 감싼다.
 * 저장소 열쇠는 공개 앱과 /study/ 앱이 같다(같은 주소라 같은 기기 ID를 쓴다).
 */
import { i18n } from "./i18n";
import { getAccessToken, hasStoredSession, isClientLoaded } from "./account";

declare const __SUPABASE_URL__: string;
declare const __SUPABASE_ANON_KEY__: string;

const LIVE_HOST = "solver.holdemmaster.com";
const DEVICE_KEY = "usage.device";
const PENDING_KEY = "usage.pending";
const VISIT_KEY = "usage.visit";
const FORCE_KEY = "usage.db.force"; // 검사 전용 — 로컬·자동화 브라우저에서도 보내게 한다
const KEY_FORMAT = /^[a-z_]{1,24}(:[a-z_]{1,24})?$/;
const UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const FLUSH_DELAY_MS = 5000;
const TOKEN_FRESH_MS = 30 * 60 * 1000;
const COUNT_CAP = 500;

type Pending = { visits: number; counts: Record<string, number> };

let enabledCache: boolean | null = null;
const enabled = () => {
  if (enabledCache !== null) return enabledCache;
  try {
    const forced = sessionStorage.getItem(FORCE_KEY) === "1";
    enabledCache =
      Boolean(__SUPABASE_URL__ && __SUPABASE_ANON_KEY__) &&
      (forced || (location.hostname === LIVE_HOST && !navigator.webdriver));
  } catch {
    enabledCache = false;
  }
  return enabledCache;
};

const newId = () => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

/** 저장소를 못 쓰면 null — 그 탭은 기록하지 않는다(날마다 새 기기로 잡히는 것보다 낫다) */
const deviceId = () => {
  try {
    const stored = localStorage.getItem(DEVICE_KEY);
    if (stored && UUID_FORMAT.test(stored)) return stored;
    const id = newId();
    localStorage.setItem(DEVICE_KEY, id);
    return localStorage.getItem(DEVICE_KEY) === id ? id : null;
  } catch {
    return null;
  }
};

const readPending = (): Pending => {
  try {
    const d = JSON.parse(localStorage.getItem(PENDING_KEY) ?? "null");
    const counts: Record<string, number> = {};
    for (const [key, value] of Object.entries(d?.counts ?? {})) {
      if (KEY_FORMAT.test(key) && Number.isInteger(value) && (value as number) > 0)
        counts[key] = Math.min(value as number, COUNT_CAP);
    }
    return { visits: Number.isInteger(d?.visits) && d.visits > 0 ? Math.min(d.visits, 50) : 0, counts };
  } catch {
    return { visits: 0, counts: {} };
  }
};
const writePending = (pending: Pending) => {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    // 저장소를 못 쓰면 이번 기록은 버린다
  }
};
const isEmpty = (pending: Pending) => pending.visits === 0 && Object.keys(pending.counts).length === 0;

const merge = (extra: Pending) => {
  const pending = readPending();
  pending.visits = Math.min(pending.visits + extra.visits, 50);
  for (const [key, value] of Object.entries(extra.counts))
    pending.counts[key] = Math.min((pending.counts[key] ?? 0) + value, COUNT_CAP);
  writePending(pending);
};

const refHost = (() => {
  try {
    const host = new URL(document.referrer).hostname.toLowerCase();
    return host && host !== location.hostname ? host : "";
  } catch {
    return "";
  }
})();
const deviceClass = () => (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "mobile" : "pc");
const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches === true ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;

let cachedToken: { token: string; at: number } | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

/** quick = 탭이 가려지는 중 — 토큰을 새로 받느라 기다리지 않는다(연결된 기기는 회원 없이 보내도 서버가 묶는다) */
const flush = async (quick: boolean) => {
  try {
    if (timer) clearTimeout(timer);
    timer = null;
    if (!enabled()) return;
    const device = deviceId();
    const snapshot = readPending();
    if (!device || isEmpty(snapshot)) return;
    localStorage.removeItem(PENDING_KEY);

    if (!quick && (hasStoredSession() || isClientLoaded())) {
      const token = await getAccessToken().catch(() => null);
      cachedToken = token ? { token, at: Date.now() } : null;
    }
    const userToken = cachedToken && Date.now() - cachedToken.at < TOKEN_FRESH_MS ? cachedToken.token : null;

    const restore = () => merge(snapshot);
    fetch(`${__SUPABASE_URL__}/rest/v1/rpc/solver_usage_ping`, {
      method: "POST",
      keepalive: true,
      credentials: "omit",
      headers: {
        apikey: __SUPABASE_ANON_KEY__,
        Authorization: `Bearer ${userToken ?? __SUPABASE_ANON_KEY__}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_device: device,
        p_counts: snapshot.counts,
        p_visits: snapshot.visits,
        p_locale: i18n.locale.toLowerCase(),
        p_device_class: deviceClass(),
        p_standalone: isStandalone(),
        p_ref: refHost,
      }),
    })
      .then((response) => {
        if (response.ok) return;
        if (response.status === 401) cachedToken = null; // 다음에는 새 토큰이나 비회원 키로
        if (response.status === 401 || response.status === 429 || response.status >= 500) restore();
      })
      .catch(restore);
  } catch {
    // 수집 실패는 앱과 무관하다
  }
};

const schedule = () => {
  if (timer) return;
  timer = setTimeout(() => void flush(false), FLUSH_DELAY_MS);
};

/** 이벤트 한 번 — key = «이벤트» 또는 «이벤트:기능» */
export const countUsage = (key: string) => {
  try {
    if (!enabled() || !KEY_FORMAT.test(key)) return;
    merge({ visits: 0, counts: { [key]: 1 } });
    schedule();
  } catch {
    // 수집 실패는 앱과 무관하다
  }
};

/** 앱을 열 때 한 번(탭 단위 · 공개 앱 ↔ /study/ 이동은 같은 탭이라 한 번으로 센다) */
export const setupUsageDb = () => {
  try {
    if (!enabled()) return;
    if (sessionStorage.getItem(VISIT_KEY) !== "1") {
      sessionStorage.setItem(VISIT_KEY, "1");
      merge({ visits: 1, counts: {} });
      schedule();
    }
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") void flush(true);
    });
    window.addEventListener("pagehide", () => void flush(true));
  } catch {
    // 수집 실패는 앱과 무관하다
  }
};
