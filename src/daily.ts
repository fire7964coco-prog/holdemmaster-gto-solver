/*
 * 오늘의 문제 — 날짜를 씨앗으로 삼아 «모두가 같은 문제»를 받게 한다.
 *
 * 목적은 두 가지다.
 *   ① 재방문 — 매일 하나뿐이라 «오늘 건 풀었나»가 돌아올 이유가 된다
 *   ② 커뮤니티 글감 — 같은 문제를 풀었으니 서로 답을 비교할 수 있다
 *      (각자 다른 문제였다면 대화가 안 된다)
 *
 * 데이터는 새로 만들지 않는다. 기존 문제 은행에 날짜 기반 난수를 넣을 뿐이다.
 */
import { reactive } from "vue";
import { makeTrainerQuestion, TrainerBank, TrainerQuestion } from "./trainer";

const KEY_LAST = "daily.lastDate";
const KEY_STREAK = "daily.streak";
const KEY_BEST = "daily.bestStreak";
const KEY_RESULT = "daily.result";

/** 한국 날짜(YYYY-MM-DD). 유저가 한국에 있으므로 UTC가 아니라 KST로 하루를 끊는다 */
export const todayKey = (now: Date = new Date()) => {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
};

/** 문자열 → 32비트 씨앗 */
const seedFrom = (text: string) => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

/** mulberry32 — 같은 씨앗이면 언제 어디서 돌려도 같은 순서가 나온다 */
const seededRandom = (seed: number) => {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const dailyState = reactive({
  /** 오늘 문제를 풀었는가 */
  done: false,
  /** 오늘 기록한 EV 손실(bb) */
  lossBb: 0,
  /** 며칠 연속으로 풀었는가 */
  streak: 0,
  bestStreak: 0,
});

const readNumber = (key: string) => {
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
    /* 저장이 막힌 환경이면 그냥 기록 없이 동작한다 */
  }
};

/** 오늘의 문제 — 날짜가 같으면 누구에게나 같은 문제가 나온다 */
export const makeDailyQuestion = (bank: TrainerBank): TrainerQuestion | null =>
  makeTrainerQuestion(bank, "all", seededRandom(seedFrom(todayKey())));

export const loadDailyState = () => {
  const today = todayKey();
  let result: { date: string; lossBb: number } | null = null;
  try {
    const raw = localStorage.getItem(KEY_RESULT);
    result = raw ? JSON.parse(raw) : null;
  } catch {
    result = null;
  }
  dailyState.done = result?.date === today;
  dailyState.lossBb = dailyState.done ? result?.lossBb ?? 0 : 0;
  dailyState.streak = readNumber(KEY_STREAK);
  dailyState.bestStreak = readNumber(KEY_BEST);

  // 하루를 건너뛰었으면 연속이 끊긴다 (어제까지 푼 경우만 이어진다)
  const last = (() => {
    try {
      return localStorage.getItem(KEY_LAST) ?? "";
    } catch {
      return "";
    }
  })();
  if (last && last !== today) {
    const yesterday = todayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
    if (last !== yesterday) {
      dailyState.streak = 0;
      writeValue(KEY_STREAK, "0");
    }
  }
};

/** 오늘의 문제를 풀었을 때 호출 */
export const recordDaily = (lossBb: number) => {
  const today = todayKey();
  if (dailyState.done) return;

  const last = (() => {
    try {
      return localStorage.getItem(KEY_LAST) ?? "";
    } catch {
      return "";
    }
  })();
  const yesterday = todayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const streak = last === yesterday ? dailyState.streak + 1 : 1;

  dailyState.done = true;
  dailyState.lossBb = lossBb;
  dailyState.streak = streak;
  dailyState.bestStreak = Math.max(dailyState.bestStreak, streak);

  writeValue(KEY_LAST, today);
  writeValue(KEY_STREAK, String(streak));
  writeValue(KEY_BEST, String(dailyState.bestStreak));
  writeValue(KEY_RESULT, JSON.stringify({ date: today, lossBb }));
};

/**
 * 커뮤니티에 붙여넣을 결과 문구.
 * 정답 자체는 넣지 않는다 — 아직 안 푼 사람의 재미를 없애면 글이 안 퍼진다.
 */
export const dailyShareText = (verdict: string) => {
  const date = todayKey().replace(/-/g, ".").slice(2);
  return [
    `[${date} 오늘의 GTO 문제]`,
    `내 결과: ${verdict} (EV 손실 ${dailyState.lossBb.toFixed(3)}bb)`,
    dailyState.streak > 1 ? `${dailyState.streak}일 연속 풀이 중` : "",
    "",
    "같은 문제 풀어보기 → https://solver.holdemmaster.com/?view=trainer",
  ]
    .filter(Boolean)
    .join("\n");
};
