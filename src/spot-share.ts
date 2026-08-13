// 스팟 공유 링크 — 커스텀 스팟 설정을 URL로 인코딩/디코딩
// 사용처: RunSolver(공유 버튼), App(접속 시 ?spot= 자동 적용)
import { useStore, useConfigStore } from "./store";
import { cardText, parseCardString } from "./utils";

// 페이로드(키 축약): o/i=레인지, b=보드, sp/es=팟·스택, rp/rc=레이크,
// d=동크 허용, bt=벳 문자열 14개, th=올인·머징 임계값 3개
type SharedSpot = {
  v: 1 | 2;
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
};

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

/** 현재 설정을 공유 URL로 인코딩. 레인지 2개·플랍 3장이 없으면 null */
export const encodeSpotUrl = (): string | null => {
  const store = useStore();
  const config = useConfigStore();

  const oop = store.rangeText[0].trim();
  const ip = store.rangeText[1].trim();
  if (!oop || !ip || config.board.length < 3) return null;

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

  const encoded = toBase64Url(JSON.stringify(spot));
  return `${location.origin}${location.pathname}?spot=${encoded}`;
};

/** 접속 URL의 ?spot=을 설정에 적용. 적용했으면 true */
export const applySpotFromUrl = (): boolean => {
  const param = new URLSearchParams(location.search).get("spot");
  if (!param) return false;

  let spot: SharedSpot;
  try {
    spot = JSON.parse(fromBase64Url(param));
    if (![1, 2].includes(spot.v) || !spot.o || !spot.i || !spot.b) return false;
  } catch {
    return false;
  }

  const store = useStore();
  const config = useConfigStore();

  const board = spot.b
    .split(" ")
    .map(parseCardString)
    .filter((c): c is number => c !== null);
  if (board.length < 3) return false;

  config.board = board;
  config.startingPot = Number(spot.sp) || 20;
  config.effectiveStack = Number(spot.es) || 100;
  config.rakePercent = Number(spot.rp) || 0;
  config.rakeCap = Number(spot.rc) || 0;
  config.donkOption = !!spot.d;
  betFields.forEach((f, idx) => {
    config[f] = String(spot.bt?.[idx] ?? "");
  });
  config.addAllInThreshold = Number(spot.th?.[0] ?? 150);
  config.forceAllInThreshold = Number(spot.th?.[1] ?? 20);
  config.mergingThreshold = Number(spot.th?.[2] ?? 10);
  store.displayUnitScale = spot.u === 10 ? 10 : 1;

  // 편집 트리 흔적 초기화 (프리셋 로드와 동일)
  config.expectedBoardLength = 0;
  config.addedLines = "";
  config.removedLines = "";

  // 레인지는 RangeEditor가 watch로 받아 적용
  store.pendingRangeText = [spot.o, spot.i];

  return true;
};
