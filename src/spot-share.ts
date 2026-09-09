// 스팟 공유 링크 — 커스텀 스팟 설정을 URL로 인코딩/디코딩
// 사용처: RunSolver(공유 버튼), App(접속 시 ?spot= 자동 적용)
import { useStore, useConfigStore } from "./store";
import {
  cardText,
  parseCardString,
  readableLineString,
  INVALID_LINE_STRING,
  ROOT_LINE_STRING,
} from "./utils";

// 페이로드(키 축약): o/i=레인지, b=보드, sp/es=팟·스택, rp/rc=레이크,
// d=동크 허용, bt=벳 문자열 14개, th=올인·머징 임계값 3개,
// al/rl=추가·제거 라인, eb=편집 트리의 보드 장수(v3)
type SharedSpot = {
  v: 1 | 2 | 3;
  o: string;
  i: string;
  b: string;
  sp: number;
  es: number;
  rp: number;
  rc: number;
  d: boolean;
  bt: string[];
  th: [number, number, number];
  u?: number;
  al?: string;
  rl?: string;
  eb?: 3 | 4 | 5;
};

export class InvalidSpotLinesError extends Error {}

const validSharedLines = (lines: string): boolean =>
  lines === "" || lines.split(",").every((line) => {
    const readable = readableLineString(line);
    if (readable === INVALID_LINE_STRING || readable === ROOT_LINE_STRING) return false;
    // 기존 파서로 문법을 확인한 뒤 Rust 액션 금액(i32)의 범위만 보완한다.
    // readableLineString은 i32 초과 금액도 표시하지만 decode_action은 panic한다.
    return line.split(/[-|]/).every((action) =>
      action.length === 1 || Number(action.slice(1)) <= 2147483647
    );
  });

const betFields = [
  "oopFlopBet",
  "oopFlopRaise",
  "oopTurnBet",
  "oopTurnRaise",
  "oopTurnDonk",
  "oopRiverBet",
  "oopRiverRaise",
  "oopRiverDonk",
  "ipFlopBet",
  "ipFlopRaise",
  "ipTurnBet",
  "ipTurnRaise",
  "ipRiverBet",
  "ipRiverRaise",
] as const;

// 유니코드 안전 base64url
const toBase64Url = (s: string) =>
  btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromBase64Url = (s: string) =>
  decodeURIComponent(
    escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))
  );

/** 레인지 2개·플랍 3장이 없으면 null. 손상된 편집 라인은 공유하지 않는다. */
export const encodeSpotUrl = (): string | null => {
  const store = useStore();
  const config = useConfigStore();

  const oop = store.rangeText[0].trim();
  const ip = store.rangeText[1].trim();
  if (!oop || !ip || config.board.length < 3) return null;

  if (!validSharedLines(config.addedLines) || !validSharedLines(config.removedLines)) {
    throw new InvalidSpotLinesError(INVALID_LINE_STRING);
  }

  const spot: SharedSpot = {
    v: 2,
    o: oop,
    i: ip,
    b: config.board
      .map((c) => {
        const t = cardText(c);
        return t.rank + t.suitLetter;
      })
      .join(" "),
    sp: config.startingPot,
    es: config.effectiveStack,
    rp: config.rakePercent,
    rc: config.rakeCap,
    d: config.donkOption,
    bt: betFields.map((f) => config[f]),
    th: [
      config.addAllInThreshold,
      config.forceAllInThreshold,
      config.mergingThreshold,
    ],
    u: store.displayUnitScale,
  };

  // 편집이 없으면 기존 v2의 값·키 순서·생략 규칙을 그대로 유지한다.
  if (config.addedLines !== "" || config.removedLines !== "") {
    spot.v = 3;
    if (config.addedLines !== "") spot.al = config.addedLines;
    if (config.removedLines !== "") spot.rl = config.removedLines;
    spot.eb = (config.expectedBoardLength || Math.max(config.board.length, 3)) as 3 | 4 | 5;
  }

  const encoded = toBase64Url(JSON.stringify(spot));
  return `${location.origin}${location.pathname}?spot=${encoded}`;
};

/** 접속 URL의 ?spot=을 설정에 적용. 적용했으면 true */
export const applySpotFromUrl = (): boolean => {
  const param = new URLSearchParams(location.search).get("spot");
  if (!param || param.length > 16384) return false;

  let spot: SharedSpot;
  let restored;
  try {
    spot = JSON.parse(fromBase64Url(param));
    if (
      ![1, 2, 3].includes(spot.v) ||
      typeof spot.o !== "string" || !spot.o ||
      typeof spot.i !== "string" || !spot.i ||
      typeof spot.b !== "string" || !spot.b
    ) return false;

    const board = spot.b
      .split(" ")
      .map(parseCardString)
      .filter((c): c is number => c !== null);
    if (board.length < 3) return false;

    let expectedBoardLength: 0 | 3 | 4 | 5 = 0;
    let addedLines = "";
    let removedLines = "";
    if (spot.v === 3) {
      if (
        (spot.al !== undefined && typeof spot.al !== "string") ||
        (spot.rl !== undefined && typeof spot.rl !== "string") ||
        !(spot.al || spot.rl) ||
        !validSharedLines(spot.al ?? "") ||
        !validSharedLines(spot.rl ?? "") ||
        (spot.eb !== 3 && spot.eb !== 4 && spot.eb !== 5) ||
        spot.eb !== board.length
      ) return false;
      expectedBoardLength = spot.eb;
      addedLines = spot.al ?? "";
      removedLines = spot.rl ?? "";
    }

    // 모든 파싱·형 변환을 끝낸 뒤 설정에 적용한다. v1/v2는 편집 흔적을 초기화한다.
    restored = {
      board,
      startingPot: Number(spot.sp) || 20,
      effectiveStack: Number(spot.es) || 100,
      rakePercent: Number(spot.rp) || 0,
      rakeCap: Number(spot.rc) || 0,
      donkOption: !!spot.d,
      bets: betFields.map((_, idx) => String(spot.bt?.[idx] ?? "")),
      addAllInThreshold: Number(spot.th?.[0] ?? 150),
      forceAllInThreshold: Number(spot.th?.[1] ?? 20),
      mergingThreshold: Number(spot.th?.[2] ?? 10),
      expectedBoardLength,
      addedLines,
      removedLines,
    };
  } catch {
    return false;
  }

  const store = useStore();
  const config = useConfigStore();

  config.board = restored.board;
  config.startingPot = restored.startingPot;
  config.effectiveStack = restored.effectiveStack;
  config.rakePercent = restored.rakePercent;
  config.rakeCap = restored.rakeCap;
  config.donkOption = restored.donkOption;
  for (const [idx, f] of betFields.entries()) {
    config[f] = restored.bets[idx];
  }
  config.addAllInThreshold = restored.addAllInThreshold;
  config.forceAllInThreshold = restored.forceAllInThreshold;
  config.mergingThreshold = restored.mergingThreshold;
  store.displayUnitScale = spot.u === 10 ? 10 : 1;

  config.expectedBoardLength = restored.expectedBoardLength;
  config.addedLines = restored.addedLines;
  config.removedLines = restored.removedLines;

  // 레인지는 RangeEditor가 watch로 받아 적용
  store.pendingRangeText = [spot.o, spot.i];

  return true;
};
