/**
 * 홀덤마스터 계정(Supabase) 연동 — 트레이너 학습 기록 보관용.
 *
 * 설계 원칙
 * - **선택 기능이다.** 로그인하지 않으면 이 모듈은 아무것도 전송하지 않고, 기록은 기기(IndexedDB)에만 남는다.
 *   ⚠ 이 줄은 «이 모듈의 현재 동작» 서술이다. 「로그인 전엔 아무것도 전송 안 함」을 **화면 문구로
 *   되살리지 말 것** — 2026-08-17 사용자 지시로 앱·본체 모두에서 뺐다(동의 기반 기능을 열 수 있게,
 *   errors.ts 상단 참조). 사실이 틀려서가 아니라 미래를 묶는 약속이라서다.
 * - 계정은 본체 커뮤니티와 **같은 Supabase 프로젝트**를 쓴다 → 솔버에서 가입해도 홀덤마스터 회원이 된다.
 * - 접속 정보는 빌드 시점에 주입된다(webpack DefinePlugin). 값이 없으면 이 기능 자체가 꺼진다.
 * - 서버 테이블은 `trainer_attempts`이며 RLS로 본인 것만 접근 가능
 *   (handoff-to-main-site/supabase_trainer_attempts.sql).
 */
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { claimLocalData, TrainerAttempt } from "./db";
import { i18n, pick } from "./i18n";
import { MAIN_SITE_CONFIG } from "./main-site";

declare const __SUPABASE_URL__: string;
declare const __SUPABASE_ANON_KEY__: string;

const SUPABASE_URL = __SUPABASE_URL__;
const SUPABASE_ANON_KEY = __SUPABASE_ANON_KEY__;

/** 접속 정보가 주입되지 않은 빌드에서는 계정 기능을 통째로 숨긴다. */
export const isAccountEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * 로그인 공유(SSO · 본체 MB-343): 이름·공유 도메인은 src/main-site.ts. 공유 도메인이 있으면 그 하위 주소끼리
 * «한 장의 쿠키»를 같이 읽고 쓴다(공유 도메인이 빈 값이면 이 주소만).
 * 라이브러리도 본체와 같은 @supabase/ssr 0.12 — 쿠키 인코딩(base64url)·쪼개기(name.0, name.1…)가 같아야 서로 읽힌다.
 */
const AUTH_COOKIE = MAIN_SITE_CONFIG.authCookie;
const SHARED_DOMAIN = MAIN_SITE_CONFIG.sharedCookieDomain;

const authCookieOptions = () => {
  const host = window.location.hostname.toLowerCase();
  const shared = !!SHARED_DOMAIN && (host === SHARED_DOMAIN.slice(1) || host.endsWith(SHARED_DOMAIN));
  return {
    name: AUTH_COOKIE,
    path: "/",
    sameSite: "lax" as const,
    maxAge: 400 * 24 * 60 * 60, // @supabase/ssr 기본값과 같다
    ...(shared ? { domain: SHARED_DOMAIN, secure: true } : {}),
  };
};

const hasAuthCookie = () => {
  try {
    return document.cookie
      .split(/;\s*/)
      .some((pair) => pair.startsWith(`${AUTH_COOKIE}=`) || pair.startsWith(`${AUTH_COOKIE}.0=`));
  } catch {
    return false;
  }
};

/** 쿠키로 옮기기 전 솔버가 localStorage에 두던 세션 키(`sb-<프로젝트>-auth-token`)와 딸린 키들. */
const legacyStorageKeys = () => {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("sb-") && /-auth-token(-code-verifier|-user)?$/.test(key)) keys.push(key);
    }
  } catch {
    // 프라이빗 모드 등에서 접근이 막히면 없는 것으로 본다
  }
  return keys;
};

/**
 * 기존 솔버 회원의 localStorage 세션을 공용 쿠키로 한 번 옮긴다(안 하면 배포 순간 한 번 로그아웃된다).
 * 실패(만료 등)해도 옛 키는 지운다 — 다시 로그인하면 된다.
 */
const migrateLegacySession = async (supabase: SupabaseClient) => {
  const keys = legacyStorageKeys();
  if (!keys.length) return;
  try {
    if (!hasAuthCookie()) {
      const sessionKey = keys.find((key) => key.endsWith("-auth-token"));
      const parsed = JSON.parse((sessionKey && localStorage.getItem(sessionKey)) || "null");
      const session = parsed?.currentSession ?? parsed; // 아주 옛 supabase-js는 currentSession으로 감쌌다
      if (session?.access_token && session?.refresh_token) {
        await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
      }
    }
  } catch {
    // 옮기지 못하면 비로그인으로 시작한다
  } finally {
    for (const key of keys) {
      try { localStorage.removeItem(key); } catch { /* 지우지 못해도 다음 방문에 다시 시도 */ }
    }
  }
};

let clientPromise: Promise<SupabaseClient> | null = null;

/**
 * supabase-js는 200KB가 넘어 첫 화면 로딩을 늦춘다.
 * 계정 기능을 실제로 쓸 때만 별도 청크로 내려받는다.
 */
const getClient = async (): Promise<SupabaseClient | null> => {
  if (!isAccountEnabled) return null;
  if (!clientPromise) {
    clientPromise = import(
      /* webpackChunkName: "supabase" */ "@supabase/ssr"
    ).then(async (mod) => {
      // flowType은 ssr이 pkce로 고정 · 세션 유지·자동 갱신은 ssr 기본값(켜짐)
      const supabase = mod.createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        cookieOptions: authCookieOptions(),
        // 소셜 로그인 후 돌아온 주소에서 세션을 자동으로 회수
        auth: { detectSessionInUrl: true },
      }) as unknown as SupabaseClient;
      await migrateLegacySession(supabase);
      return supabase;
    });
  }
  return clientPromise;
};

/** 리더보드 등 다른 모듈이 같은 클라이언트를 재사용할 수 있게 노출 */
export const getSupabase = getClient;

/**
 * 이미 로그인한 흔적이 있는지 저장소만 훑어본다(supabase-js를 내려받지 않고).
 * 트레이너를 여는 모든 사람에게 214KB를 받게 하지 않으려는 것 —
 * 로그인한 적 없으면 [구글로 계속하기]를 누를 때 비로소 내려받는다.
 * 공용 쿠키를 보므로 본체에서 로그인하고 솔버를 처음 연 사람도 여기서 잡힌다(이게 SSO의 실체).
 * 아직 옮기지 않은 옛 localStorage 세션도 흔적으로 본다(getClient가 옮긴다).
 */
export const hasStoredSession = () => {
  if (!isAccountEnabled) return false;
  return hasAuthCookie() || legacyStorageKeys().some((key) => key.endsWith("-auth-token"));
};

/** 소셜 로그인에서 막 돌아온 상태인지 (주소에 인증 코드가 붙어 있는지) */
export const isReturningFromAuth = () => {
  const params = new URLSearchParams(window.location.search);
  return params.has("code") || window.location.hash.includes("access_token");
};

/**
 * 기기 자료 관문 확인(MB-388 ① · 5차 N1): 로그인 흔적이 있으면 지금 계정으로 claim — 다른 계정 DB면 탭을 새로 연다.
 * 세션을 못 읽으면(라이브러리·네트워크 실패) 로그아웃과 같이 본다(마지막 계정 자료가 보이는 기존 동작).
 * claim이 실패하면(저장소 막힘) false — 관문을 닫는다.
 */
export const verifyLocalOwner = async (): Promise<boolean> => {
  if (!isAccountEnabled || (!hasStoredSession() && !isReturningFromAuth())) return true;
  let user: AccountUser | null = null;
  try {
    user = await getCurrentUser();
  } catch {
    return true;
  }
  if (!user) return true;
  try {
    await claimLocalData(user.id);
    return true;
  } catch {
    return false;
  }
};

/** supabase 클라이언트가 이미 만들어졌는지 (다른 화면이 먼저 띄운 경우) */
export const isClientLoaded = () => clientPromise !== null;

/**
 * 앱 시작 시 한 번 호출한다.
 *
 * ⚠ 순서가 중요하다: 로그인에서 돌아오면 주소에 인증 코드가 붙어 오는데,
 * supabase-js는 **클라이언트를 만드는 시점의 주소**에서 그 코드를 읽어 세션으로
 * 바꾼다. 주소를 먼저 지우면 코드가 사라져 로그인이 영영 완료되지 않는다.
 * 따라서 세션 회수(getCurrentUser) → 주소 정리(cleanAuthParams) 순서를 지킬 것.
 *
 * @returns 로그인에서 돌아온 흐름이면 true (호출한 쪽이 화면 복귀에 사용)
 */
export const bootstrapAccount = async () => {
  if (!isAccountEnabled) return false;
  const returning = isReturningFromAuth();
  if (!returning && !hasStoredSession()) return false;
  try {
    await getCurrentUser();
    if (returning) await fixNewProfileLanguage();
  } finally {
    cleanAuthParams();
  }
  return returning;
};

/**
 * OAuth 가입은 언어를 못 실어 보내 본체 트리거가 profiles.language='ko'로 만든다.
 * 본체는 /auth/callback에서 고치지만 솔버는 origin으로 돌아오므로 여기서 같은 규칙으로 고친다
 * (방금 만든 계정 · 아직 'ko'일 때만 · 본인 행 update는 RLS profiles_update가 허용).
 */
const fixNewProfileLanguage = async () => {
  if (i18n.locale === "ko") return;
  try {
    const supabase = await getClient();
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user?.created_at || Date.now() - new Date(user.created_at).getTime() > 10 * 60 * 1000) return;
    await supabase.from("profiles").update({ language: i18n.locale }).eq("id", user.id).eq("language", "ko");
  } catch { /* 언어 표기는 부가 정보 — 실패해도 로그인은 그대로 */ }
};

export type AccountUser = {
  id: string;
  email: string;
  nickname: string;
};

const toUser = (session: Session | null): AccountUser | null => {
  if (!session?.user) return null;
  const meta = session.user.user_metadata ?? {};
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    nickname:
      (meta.nickname as string) ||
      (meta.full_name as string) ||
      (meta.name as string) ||
      session.user.email?.split("@")[0] ||
      pick("회원", "Player", "プレイヤー", "jugador", "Jogador", "Spieler", "玩家", "玩家", "Joueur", "Pemain", "Pemain", "खिलाड़ी", "Oyuncu", "Người chơi", "Игрок",
        "لاعب", "Giocatore", "Gracz",
        "ผู้เล่น"),
  };
};

export const getCurrentUser = async (): Promise<AccountUser | null> => {
  const supabase = await getClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return toUser(data.session);
};

/**
 * 회원 전용 자료 요청에 붙일 로그인 토큰. 로그인한 흔적이 없으면 supabase-js를 내려받지 않고 null.
 * refresh = 자료 서버가 401을 준 뒤 한 번 새로 받을 때.
 */
export const getAccessToken = async (refresh = false): Promise<string | null> => {
  if (!hasStoredSession() && !isClientLoaded()) return null;
  const supabase = await getClient();
  if (!supabase) return null;
  try {
    const { data } = refresh
      ? await supabase.auth.refreshSession()
      : await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
};

export const onAuthChange = (handler: (user: AccountUser | null) => void) => {
  let unsubscribe: (() => void) | null = null;
  let cancelled = false;
  void getClient().then((supabase) => {
    if (!supabase || cancelled) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      handler(toUser(session));
    });
    unsubscribe = () => data.subscription.unsubscribe();
  });
  return () => {
    cancelled = true;
    unsubscribe?.();
  };
};

/**
 * 소셜 로그인 시작. 현재 주소로 되돌아온다.
 * ⚠ Supabase 대시보드 Authentication → URL Configuration → Redirect URLs에
 *   solver 주소가 등록돼 있어야 한다(미등록 시 로그인 후 되돌아오지 못함).
 */
const LOGIN_PURPOSE_KEY = "solver.login.purpose.v1";
const LOGIN_PURPOSE_TTL_MS = 15 * 60 * 1000;

/** 이번 로그인 왕복을 시작한 화면(같은 탭 sessionStorage · 복귀 때 한 번만 꺼낸다). */
export const takeLoginPurpose = (): "feedback" | null => {
  try {
    const raw = sessionStorage.getItem(LOGIN_PURPOSE_KEY);
    sessionStorage.removeItem(LOGIN_PURPOSE_KEY);
    const d = JSON.parse(raw ?? "null");
    return d?.purpose === "feedback" && Number.isFinite(d.at) && Date.now() - d.at >= 0 &&
      Date.now() - d.at <= LOGIN_PURPOSE_TTL_MS ? "feedback" : null;
  } catch { return null; }
};

/** 로그인에서 돌아와 열 화면 (저장 목록 동기화 · 없으면 App이 트레이너로 연다). 다음 signIn 한 번에만 쓰인다. */
const LOGIN_RETURN_KEY = "solver.login.returnView.v1";
// hand-review·flop-study = 회원 전용 상황 한 줄에서 시작한 로그인(member-limits.ts)
const RETURN_VIEWS = ["oop-range", "ip-range", "tree-config", "hand-review", "flop-study"];
let nextReturnView: string | null = null;
// 그 화면에서 고르던 것(회원 상황 한 줄 → 복기·플랍 조회의 상황·카드). 돌아온 화면이 한 번 꺼내 쓴다
let nextReturnState: unknown = null;
let returnedState: { view: string; state: unknown } | null = null;
const returnWaiters = new Map<string, (state: unknown) => void>();
export const setLoginReturnView = (view: string, state: unknown = null) => {
  nextReturnView = RETURN_VIEWS.includes(view) ? view : null;
  nextReturnState = nextReturnView ? state : null;
};
/**
 * 로그인에서 돌아온 화면이 자기 상태를 한 번 받는다. 화면이 먼저 열려 있을 수 있어(마지막 화면 기억)
 * 기다렸다가 받는다 — 앱이 돌아온 표시를 읽는 순간(takeLoginReturnView) 부른다. 모양 확인은 받는 쪽이 한다.
 * @returns 기다리기를 그만두는 함수(화면을 닫을 때)
 */
export const onLoginReturnState = (view: string, apply: (state: unknown) => void) => {
  if (returnedState?.view === view) {
    const state = returnedState.state;
    returnedState = null;
    apply(state);
    return () => {};
  }
  returnWaiters.set(view, apply);
  return () => {
    if (returnWaiters.get(view) === apply) returnWaiters.delete(view);
  };
};
/** 이번 로그인을 /study/ 앱에서 시작했는가 (복귀 표시를 꺼내지 않고 본다 · 꺼내는 쪽은 그 앱) */
export const isStudyLoginReturn = () => {
  try {
    return JSON.parse(sessionStorage.getItem(LOGIN_RETURN_KEY) ?? "null")?.app === "study";
  } catch {
    return false;
  }
};
export const takeLoginReturnView = (): string | null => {
  try {
    const raw = sessionStorage.getItem(LOGIN_RETURN_KEY);
    sessionStorage.removeItem(LOGIN_RETURN_KEY);
    const d = JSON.parse(raw ?? "null");
    const ok = RETURN_VIEWS.includes(d?.view) && Number.isFinite(d.at) &&
      Date.now() - d.at >= 0 && Date.now() - d.at <= LOGIN_PURPOSE_TTL_MS;
    returnedState = ok && d.state != null ? { view: d.view, state: d.state } : null;
    const waiter = returnedState && returnWaiters.get(returnedState.view);
    if (waiter && returnedState) {
      const state = returnedState.state;
      returnedState = null;
      returnWaiters.delete(d.view);
      waiter(state);
    }
    return ok ? d.view : null;
  } catch { return null; }
};

/** 텔레그램은 Supabase 커스텀 OIDC 공급자(본체 MB-341) — 스코프는 공급자 설정값을 쓴다. 회원 email·phone이 빈 값이다. */
export type LoginProvider = "google" | "kakao" | "custom:telegram";

export const signIn = async (provider: LoginProvider, purpose?: "feedback") => {
  // 다른 화면에서 시작한 로그인이 중단된 후기 초안을 자동 제출하지 않도록 매번 덮어쓴다.
  try {
    if (purpose) sessionStorage.setItem(LOGIN_PURPOSE_KEY, JSON.stringify({ purpose, at: Date.now() }));
    else sessionStorage.removeItem(LOGIN_PURPOSE_KEY);
    if (nextReturnView) sessionStorage.setItem(LOGIN_RETURN_KEY, JSON.stringify({ view: nextReturnView, state: nextReturnState, at: Date.now() }));
    else sessionStorage.removeItem(LOGIN_RETURN_KEY);
  } catch { /* storage may be unavailable: no purpose means no auto-submit */ }
  nextReturnView = null;
  nextReturnState = null;
  const supabase = await getClient();
  if (!supabase) throw new Error(pick("계정 기능이 꺼져 있습니다", "Accounts are disabled in this build", "アカウント機能は無効になっています", "Las cuentas están desactivadas en esta versión", "As contas estão desativadas nesta versão", "Konten sind in dieser Version deaktiviert", "此版本已关闭账号功能", "此版本已關閉帳號功能", "Les comptes sont désactivés dans cette version", "Fitur akun dinonaktifkan di versi ini", "Ciri akaun tidak tersedia dalam versi ini", "इस संस्करण में खाते की सुविधा उपलब्ध नहीं है", "Bu sürümde hesap özelliği kapalı", "Tính năng tài khoản đã bị tắt trong phiên bản này", "Аккаунты в этой версии отключены",
    "ميزة الحساب غير متاحة في هذا الإصدار", "La funzione account non è disponibile in questa build", "Funkcja konta jest niedostępna w tej wersji",
    "รุ่นนี้ไม่เปิดใช้งานบัญชีผู้ใช้"));
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      // origin만 쓴다(뒤에 "/"를 붙이지 않음) — Supabase의 Redirect URLs 목록은
      // 정확히 일치로 비교하므로, 등록값 "https://solver.holdemmaster.com"과
      // 슬래시 하나만 달라도 로그인이 거부된다.
      redirectTo: window.location.origin,
      scopes: provider === "kakao" ? "profile_nickname account_email" : undefined,
    },
  });
  if (error) throw error;
};

export const signOut = async () => {
  const supabase = await getClient();
  if (!supabase) return;
  // 토큰이 만료된 채 오프라인이면 auth-js가 갱신을 최대 30초 남짓 다시 시도하다가 세션을 지우지 않고
  // 돌아온다(MB-388 ② · 판정 2026-10-18). 3초만 기다리고, 그래도 쿠키가 남았으면 세션 쿠키(쪼갠 조각
  // 포함)를 직접 지운다 — 공용 PC에 로그인이 남지 않게. 서버 쪽 세션은 만료로 끝난다.
  await Promise.race([
    supabase.auth.signOut().catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]);
  if (hasAuthCookie()) {
    clearAuthCookies();
    // 직접 지우면 auth-js의 SIGNED_OUT 알림이 없다 — 열린 화면(저장 목록 줄 등)이 로그인 상태로 남지 않게
    // 이 탭과 다른 솔버 탭을 새로 연다
    try {
      localStorage.setItem(SIGNED_OUT_KEY, String(Date.now()));
    } catch {
      /* 다른 탭 알림만 못 한다 */
    }
    location.reload();
  }
};

const SIGNED_OUT_KEY = "solver.signedOutAt";
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === SIGNED_OUT_KEY && e.newValue) location.reload();
  });
}

const clearAuthCookies = () => {
  const { domain } = authCookieOptions() as { domain?: string };
  for (const pair of document.cookie.split(/;\s*/)) {
    const name = pair.split("=")[0];
    if (!name.startsWith(AUTH_COOKIE)) continue;
    document.cookie = `${name}=; Max-Age=0; Path=/`;
    if (domain) document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${domain}; Secure`;
  }
};

/** 로그인 직후 주소에 남는 인증 파라미터를 지운다 (공유 링크 파라미터는 건드리지 않음). */
export const cleanAuthParams = () => {
  const url = new URL(window.location.href);
  let changed = false;
  for (const key of ["code", "error", "error_description", "state"]) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (url.hash.includes("access_token")) {
    url.hash = "";
    changed = true;
  }
  if (changed) window.history.replaceState({}, "", url.toString());
};

type RemoteRow = {
  client_id: string;
  question_id: string;
  preset_id: string;
  category: TrainerAttempt["category"];
  hand_pair: number;
  selected_action: number;
  best_action: number;
  ev_loss_bb: number;
  played_at: string;
};

const toRemote = (attempt: TrainerAttempt, userId: string) => ({
  user_id: userId,
  client_id: attempt.clientId,
  question_id: attempt.questionId,
  preset_id: attempt.presetId,
  category: attempt.category,
  hand_pair: attempt.handPair,
  selected_action: attempt.selectedAction,
  best_action: attempt.bestAction,
  ev_loss_bb: attempt.evLossBb,
  played_at: new Date(attempt.timestamp).toISOString(),
});

const fromRemote = (row: RemoteRow): TrainerAttempt => ({
  clientId: row.client_id,
  timestamp: new Date(row.played_at).getTime(),
  questionId: row.question_id,
  presetId: row.preset_id,
  category: row.category,
  handPair: row.hand_pair,
  selectedAction: row.selected_action,
  bestAction: row.best_action,
  evLossBb: Number(row.ev_loss_bb),
});

export type SyncResult = { uploaded: number; downloaded: number };
/** 동기화 도중 로그인 계정이 바뀌었다 — 화면이 계정을 다시 읽고 다음 동기화가 맞춘다 */
export class AccountChangedError extends Error {}

/**
 * 기기 기록과 계정 기록을 양방향으로 맞춘다.
 * - 올리기: 기기에 있는 기록을 `client_id` 기준으로 덮어쓰기(같은 기록은 중복되지 않음)
 * - 내려받기: 계정에만 있는 기록(다른 기기에서 푼 것)을 기기로 가져옴
 * 로컬 저장은 호출한 쪽이 담당한다(db 의존을 한 방향으로 유지).
 */
export const syncAttempts = async (
  localAttempts: TrainerAttempt[],
  ownerId: string
): Promise<{ result: SyncResult; missingLocally: TrainerAttempt[] }> => {
  const supabase = await getClient();
  if (!supabase) throw new Error(pick("계정 기능이 꺼져 있습니다", "Accounts are disabled in this build", "アカウント機能は無効になっています", "Las cuentas están desactivadas en esta versión", "As contas estão desativadas nesta versão", "Konten sind in dieser Version deaktiviert", "此版本已关闭账号功能", "此版本已關閉帳號功能", "Les comptes sont désactivés dans cette version", "Fitur akun dinonaktifkan di versi ini", "Ciri akaun tidak tersedia dalam versi ini", "इस संस्करण में खाते की सुविधा उपलब्ध नहीं है", "Bu sürümde hesap özelliği kapalı", "Tính năng tài khoản đã bị tắt trong phiên bản này", "Аккаунты в этой версии отключены",
    "ميزة الحساب غير متاحة في هذا الإصدار", "La funzione account non è disponibile in questa build", "Funkcja konta jest niedostępna w tej wersji",
    "รุ่นนี้ไม่เปิดใช้งานบัญชีผู้ใช้"));
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error(pick("로그인이 필요합니다", "Please sign in first", "ログインが必要です", "Primero inicia sesión", "Faça login primeiro", "Melde dich zuerst an", "请先登录", "請先登入", "Connecte-toi d'abord", "Silakan login dulu", "Sila log masuk dahulu", "पहले लॉग इन करें", "Önce giriş yap", "Hãy đăng nhập trước", "Сначала войди в аккаунт",
    "سجّل الدخول أولًا", "Accedi prima di continuare", "Najpierw się zaloguj",
    "โปรดเข้าสู่ระบบก่อน"));
  // 기기 기록의 주인(ownerId)과 지금 세션이 다르면 올리지 않는다 — 본체에서 다른 계정으로 로그인하면
  // 화면은 옛 계정인데 쿠키는 새 계정일 수 있다(MB-388 ① · 판정 2026-10-18)
  if (userId !== ownerId) throw new AccountChangedError();

  const uploadable = localAttempts.filter((item) => item.clientId);
  if (uploadable.length) {
    const { error } = await supabase
      .from("trainer_attempts")
      .upsert(
        uploadable.map((item) => toRemote(item, userId)),
        { onConflict: "user_id,client_id", ignoreDuplicates: true }
      );
    if (error) throw error;
  }

  const { data, error: selectError } = await supabase
    .from("trainer_attempts")
    .select(
      "user_id, client_id, question_id, preset_id, category, hand_pair, selected_action, best_action, ev_loss_bb, played_at"
    )
    .eq("user_id", ownerId)
    .order("played_at", { ascending: false })
    .limit(500);
  if (selectError) throw selectError;
  // 받는 사이 세션이 다른 계정으로 바뀌었으면(본체 로그인) 받은 것을 쓰지 않는다 (MB-388 ① · 재판정)
  const { data: after } = await supabase.auth.getSession();
  if (after.session?.user.id !== ownerId) throw new AccountChangedError();

  const localIds = new Set(uploadable.map((item) => item.clientId));
  const missingLocally = ((data ?? []) as (RemoteRow & { user_id: string })[])
    .filter((row) => row.user_id === ownerId && !localIds.has(row.client_id))
    .map(fromRemote);

  return {
    result: { uploaded: uploadable.length, downloaded: missingLocally.length },
    missingLocally,
  };
};

/** 계정에 보관된 기록을 전부 지운다 (기기 기록과 별개). */
export const clearRemoteAttempts = async () => {
  const supabase = await getClient();
  if (!supabase) return;
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return;
  const { error } = await supabase
    .from("trainer_attempts")
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
};
