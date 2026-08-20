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
import { TrainerAttempt } from "./db";
import { pick } from "./i18n";

declare const __SUPABASE_URL__: string;
declare const __SUPABASE_ANON_KEY__: string;

const SUPABASE_URL = __SUPABASE_URL__;
const SUPABASE_ANON_KEY = __SUPABASE_ANON_KEY__;

/** 접속 정보가 주입되지 않은 빌드에서는 계정 기능을 통째로 숨긴다. */
export const isAccountEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let clientPromise: Promise<SupabaseClient> | null = null;

/**
 * supabase-js는 200KB가 넘어 첫 화면 로딩을 늦춘다.
 * 계정 기능을 실제로 쓸 때만 별도 청크로 내려받는다.
 */
const getClient = async (): Promise<SupabaseClient | null> => {
  if (!isAccountEnabled) return null;
  if (!clientPromise) {
    clientPromise = import(
      /* webpackChunkName: "supabase" */ "@supabase/supabase-js"
    ).then((mod) =>
      mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // 소셜 로그인 후 돌아온 주소에서 세션을 자동으로 회수
          detectSessionInUrl: true,
          flowType: "pkce",
        },
      })
    );
  }
  return clientPromise;
};

/** 리더보드 등 다른 모듈이 같은 클라이언트를 재사용할 수 있게 노출 */
export const getSupabase = getClient;

/**
 * 이미 로그인한 흔적이 있는지 저장소만 훑어본다(supabase-js를 내려받지 않고).
 * 트레이너를 여는 모든 사람에게 214KB를 받게 하지 않으려는 것 —
 * 로그인한 적 없으면 [구글로 계속하기]를 누를 때 비로소 내려받는다.
 */
export const hasStoredSession = () => {
  if (!isAccountEnabled || typeof localStorage === "undefined") return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("sb-") && key.endsWith("-auth-token")) return true;
    }
  } catch {
    // 프라이빗 모드 등에서 접근이 막히면 없는 것으로 본다
  }
  return false;
};

/** 소셜 로그인에서 막 돌아온 상태인지 (주소에 인증 코드가 붙어 있는지) */
export const isReturningFromAuth = () => {
  const params = new URLSearchParams(window.location.search);
  return params.has("code") || window.location.hash.includes("access_token");
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
  } finally {
    cleanAuthParams();
  }
  return returning;
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
      pick("회원", "player", "プレイヤー", "jugador"),
  };
};

export const getCurrentUser = async (): Promise<AccountUser | null> => {
  const supabase = await getClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return toUser(data.session);
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
export const signIn = async (provider: "google" | "kakao") => {
  const supabase = await getClient();
  if (!supabase) throw new Error(pick("계정 기능이 꺼져 있습니다", "Accounts are disabled in this build", "アカウント機能は無効になっています", "Las cuentas están desactivadas en esta versión"));
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
  await supabase.auth.signOut();
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

/**
 * 기기 기록과 계정 기록을 양방향으로 맞춘다.
 * - 올리기: 기기에 있는 기록을 `client_id` 기준으로 덮어쓰기(같은 기록은 중복되지 않음)
 * - 내려받기: 계정에만 있는 기록(다른 기기에서 푼 것)을 기기로 가져옴
 * 로컬 저장은 호출한 쪽이 담당한다(db 의존을 한 방향으로 유지).
 */
export const syncAttempts = async (
  localAttempts: TrainerAttempt[]
): Promise<{ result: SyncResult; missingLocally: TrainerAttempt[] }> => {
  const supabase = await getClient();
  if (!supabase) throw new Error(pick("계정 기능이 꺼져 있습니다", "Accounts are disabled in this build", "アカウント機能は無効になっています", "Las cuentas están desactivadas en esta versión"));
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error(pick("로그인이 필요합니다", "Please sign in first", "ログインが必要です", "Primero inicia sesión"));

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
      "client_id, question_id, preset_id, category, hand_pair, selected_action, best_action, ev_loss_bb, played_at"
    )
    .order("played_at", { ascending: false })
    .limit(500);
  if (selectError) throw selectError;

  const localIds = new Set(uploadable.map((item) => item.clientId));
  const missingLocally = ((data ?? []) as RemoteRow[])
    .filter((row) => !localIds.has(row.client_id))
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
