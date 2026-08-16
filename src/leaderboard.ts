/*
 * 오늘의 문제 리더보드 — 같은 날 모두가 같은 문제를 푸는 것을 «순위»로 잇는다.
 *
 * 원칙 (2026-08-17 사용자 방향):
 * - 로그인을 허들로 만들지 않는다 → 순위 «구경»은 비로그인도 가능.
 *   로그인은 순위에 «이름을 올릴 때만» 필요 — 이것이 유일한 가입 유도 장치다.
 * - 서버 테이블은 daily_results (handoff-to-main-site/supabase_daily_leaderboard.sql).
 *   ⚠ SQL이 실행되기 전에는 테이블이 없어 조회가 실패한다 → 이 모듈은 실패를
 *   조용히 null로 돌려주고, UI는 리더보드 영역을 숨긴다(앱은 평소처럼 동작).
 * - 하루 한 사람당 한 줄. 다시 풀어도 첫 기록 유지(upsert에서 ignoreDuplicates).
 */
import { getSupabase, getCurrentUser, isAccountEnabled } from "./account";

export type LeaderboardRow = {
  nickname: string;
  lossBb: number;
  isMine: boolean;
};

export type Leaderboard = {
  rows: LeaderboardRow[];
  total: number;
  /** 내 순위 (1부터). 기록이 없거나 비로그인이면 0 */
  myRank: number;
};

const TABLE = "daily_results";
const TOP_LIMIT = 20;

/** 오늘 순위표. 테이블 미설치·네트워크 오류 등은 null (UI는 조용히 숨김) */
export const fetchLeaderboard = async (day: string): Promise<Leaderboard | null> => {
  if (!isAccountEnabled) return null;
  try {
    const supabase = await getSupabase();
    if (!supabase) return null;
    const { data, error, count } = await supabase
      .from(TABLE)
      .select("user_id, nickname, loss_bb", { count: "exact" })
      .eq("day", day)
      .order("loss_bb", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(TOP_LIMIT);
    if (error || !data) return null;

    const { data: sessionData } = await supabase.auth.getSession();
    const myId = sessionData.session?.user.id ?? "";

    let myRank = 0;
    if (myId) {
      const mine = await supabase
        .from(TABLE)
        .select("loss_bb")
        .eq("day", day)
        .eq("user_id", myId)
        .maybeSingle();
      if (mine.data) {
        const better = await supabase
          .from(TABLE)
          .select("user_id", { count: "exact", head: true })
          .eq("day", day)
          .lt("loss_bb", mine.data.loss_bb);
        myRank = (better.count ?? 0) + 1;
      }
    }

    return {
      rows: data.map((row) => ({
        nickname: String(row.nickname || "?"),
        lossBb: Number(row.loss_bb),
        isMine: Boolean(myId && row.user_id === myId),
      })),
      total: count ?? data.length,
      myRank,
    };
  } catch {
    return null;
  }
};

/**
 * 오늘 결과를 순위에 올린다 (로그인한 경우만).
 * 이미 올린 날이면 그대로 둔다 — 첫 기록이 그날의 기록.
 */
export const submitDailyResult = async (
  day: string,
  lossBb: number,
  lossPct: number
): Promise<boolean> => {
  if (!isAccountEnabled) return false;
  try {
    const supabase = await getSupabase();
    if (!supabase) return false;
    const user = await getCurrentUser();
    if (!user) return false;
    const { error } = await supabase.from(TABLE).upsert(
      {
        user_id: user.id,
        day,
        loss_bb: Number(lossBb.toFixed(4)),
        loss_pct: Number(lossPct.toFixed(4)),
        nickname: user.nickname,
      },
      { onConflict: "user_id,day", ignoreDuplicates: true }
    );
    return !error;
  } catch {
    return false;
  }
};
