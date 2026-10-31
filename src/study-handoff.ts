/*
 * 같은 주소의 /study/ 앱과 이어지는 곳. 두 앱은 코드를 나눠 쓰지 않는다 — 아래 형식(version 1)만 맞춘다.
 *
 * 흐름: /study/ 앱이 짐을 IndexedDB `study-handoff`에 맡기고 `/?view=…&handoff=1`로 이동 →
 *       여기서 한 번 꺼내 지우고 자기 화면에 채운다.
 * 이 페이지는 막 새로 열린 것이라 설정이 기본값이다 — 덮어쓰기 확인이 필요 없다.
 * 사용자가 하던 계산은 openStudyApp이 새 탭으로 열어 지킨다.
 */
import { nextTick } from "vue";
import { useStore, useConfigStore } from "./store";
import { i18n } from "./i18n";
import { customTrainerState } from "./custom-trainer";
import type { CustomTrainerBank, CustomTrainerStudy } from "./custom-trainer";
import { saveCustomTrainerBank } from "./custom-trainer-db";
import { buildFlopStudyLink } from "./flop-study-model";
import { M as reviewLabels } from "./hand-review-labels";
import { SPOT_BET_SIZES } from "./preflop-spots";

/** 켜면 메뉴·옛 링크·연습 돌아가기가 /study/ 앱으로 간다. 끄면 지금까지처럼 이 앱 안 화면을 쓴다. */
export const STUDY_APP_LAUNCHED = true;

const BET_FIELDS = [
  "oopFlopBet",
  "oopFlopRaise",
  "oopTurnBet",
  "oopTurnRaise",
  "oopRiverBet",
  "oopRiverRaise",
  "ipFlopBet",
  "ipFlopRaise",
  "ipTurnBet",
  "ipTurnRaise",
  "ipRiverBet",
  "ipRiverRaise",
] as const;

const betSizeDefault = (field: typeof BET_FIELDS[number]) =>
  field.endsWith("Raise")
    ? SPOT_BET_SIZES.raise
    : field.includes("Flop")
    ? SPOT_BET_SIZES.flopBet
    : SPOT_BET_SIZES.laterBet;

// 페이지를 옮기면 메모리의 설정·계산 결과가 사라진다 — 쓰던 것이 있는지 본다
// (20·100 = store.ts 기본값)
const solverInUse = () => {
  const store = useStore();
  const config = useConfigStore();
  return (
    store.hasSolverRun ||
    config.range[0].some(Boolean) ||
    config.range[1].some(Boolean) ||
    config.board.length > 0 ||
    config.startingPot !== 20 ||
    config.effectiveStack !== 100 ||
    config.addedLines !== "" ||
    config.removedLines !== "" ||
    config.donkOption ||
    config.oopTurnDonk !== "" ||
    config.oopRiverDonk !== "" ||
    BET_FIELDS.some((field) => config[field] !== betSizeDefault(field))
  );
};

/** /study/ 앱을 연다. 쓰던 설정·결과가 있으면 새 탭으로 열어 그대로 남긴다. */
export const openStudyApp = (search = "") => {
  const url = `/study/${search}`;
  if (solverInUse()) window.open(url, "_blank");
  else location.assign(url);
};

// /study/ 앱이 연습 갔다 돌아올 자리를 이 탭에 맡겨 둔 표시
const PRACTICE_RETURN_KEY = "study.practiceReturn";
const cameFromStudyApp = () => {
  try {
    return sessionStorage.getItem(PRACTICE_RETURN_KEY) !== null;
  } catch {
    return false;
  }
};

/** 연습 화면의 «돌아가기»가 /study/ 앱으로 가야 하는가 */
export const practiceBackGoesToStudyApp = () => STUDY_APP_LAUNCHED || cameFromStudyApp();

/** 같은 묶음이면 /study/ 앱이 화면 상태까지 되살리고, 아니면 주소의 자리로 연다 */
const practiceBackSearch = (study: CustomTrainerStudy, bankId: string) =>
  `${buildFlopStudyLink(study)}&back=${encodeURIComponent(bankId)}`;

export const openStudyAppFromPractice = (study: CustomTrainerStudy, bankId: string) =>
  openStudyApp(practiceBackSearch(study, bankId));

/* ── 짐 받기 ── */
type SolverSetup = {
  kind: "solver-setup";
  board: number[];
  startingPot: number;
  effectiveStack: number;
  unitScale: number;
  betSizes: Record<string, string>;
  ranges: [string, string];
  /** 턴부터 다시 푸는 길만 온다(미리 계산과 같은 나무) */
  thresholds?: { addAllIn: number; forceAllIn: number; merging: number };
  noRake?: boolean;
};
type PracticeBank = { kind: "practice"; bank: CustomTrainerBank };
type Parcel = (SolverSetup | PracticeBank) & { version: 1; at: number };

const PARCEL_DB = "study-handoff";
const PARCEL_STORE = "parcels";
const PARCEL_MAX_AGE_MS = 10 * 60 * 1000;

/** 맡긴 짐을 한 번 꺼내고 지운다 — 새로고침으로 두 번 받지 않게 */
const takeParcel = () =>
  new Promise<Parcel | null>((resolve, reject) => {
    const open = indexedDB.open(PARCEL_DB, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(PARCEL_STORE);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const tx = open.result.transaction(PARCEL_STORE, "readwrite");
      const parcels = tx.objectStore(PARCEL_STORE);
      const get = parcels.get("next");
      parcels.delete("next");
      tx.oncomplete = () => {
        open.result.close();
        resolve((get.result as Parcel | undefined) ?? null);
      };
      tx.onerror = () => reject(tx.error);
    };
  });

const parcelIsFresh = (parcel: Parcel | null): parcel is Parcel => {
  if (parcel?.version !== 1 || !Number.isFinite(parcel.at)) return false;
  const age = Date.now() - parcel.at;
  return age >= 0 && age <= PARCEL_MAX_AGE_MS;
};

const applySolverSetup = (setup: SolverSetup) => {
  const store = useStore();
  const config = useConfigStore();
  config.board = [...setup.board];
  config.startingPot = setup.startingPot;
  config.effectiveStack = setup.effectiveStack;
  store.displayUnitScale = setup.unitScale;
  config.expectedBoardLength = 0;
  if (setup.noRake) {
    config.rakePercent = 0;
    config.rakeCap = 0;
  }
  config.addedLines = "";
  config.removedLines = "";
  config.donkOption = false;
  config.oopTurnDonk = "";
  config.oopRiverDonk = "";
  if (setup.thresholds) {
    config.addAllInThreshold = setup.thresholds.addAllIn;
    config.forceAllInThreshold = setup.thresholds.forceAllIn;
    config.mergingThreshold = setup.thresholds.merging;
  }
  for (const field of BET_FIELDS) config[field] = setup.betSizes[field] ?? betSizeDefault(field);
  store.pendingRangeText = [...setup.ranges];
};

const startPractice = async (bank: CustomTrainerBank) => {
  const store = useStore();
  try {
    await saveCustomTrainerBank(bank);
  } catch {
    window.alert(reviewLabels[i18n.locale].practiceError);
    const study = bank.origin?.study;
    location.replace(`/study/${study ? practiceBackSearch(study, bank.id) : ""}`);
    return;
  }
  // 복기의 «그 자리 연습»과 같은 넘김: 연습 화면을 이 묶음으로 다시 연다
  customTrainerState.active = false;
  await nextTick();
  customTrainerState.selectedBankId = bank.id;
  customTrainerState.active = true;
  store.navView = "solver";
  store.sideView = "trainer";
};

/** `?handoff=1`로 들어왔을 때 App이 한 번 부른다. 짐이 없거나 낡았으면 그 화면을 그대로 둔다. */
export const receiveStudyHandoff = async () => {
  let parcel: Parcel | null = null;
  try {
    parcel = await takeParcel();
  } catch {
    return; // 저장소가 막혔으면 빈 화면으로 시작한다
  }
  if (!parcelIsFresh(parcel)) return;
  if (parcel.kind === "solver-setup") applySolverSetup(parcel);
  else if (parcel.kind === "practice") await startPractice(parcel.bank);
};
