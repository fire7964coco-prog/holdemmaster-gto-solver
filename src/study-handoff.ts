/*
 * 같은 주소의 /study/ 앱과 이어지는 곳. 두 앱은 코드를 나눠 쓰지 않는다 — 아래 형식(version 1)만 맞춘다.
 *
 * 흐름: /study/ 앱이 짐을 IndexedDB `study-handoff`에 짐마다 다른 id로 맡기고 `/?view=…&handoff=<id>`로 이동 →
 *       여기서 그 id의 짐만 꺼내 화면에 채운 뒤 지운다(여러 탭이 동시에 보내도 섞이지 않는다).
 * 이 페이지는 막 새로 열린 것이라 설정이 기본값이다 — 덮어쓰기 확인이 필요 없다.
 * 사용자가 하던 계산은 openStudyApp이 새 탭으로 열어 지킨다.
 */
import { nextTick } from "vue";
import { useStore, useConfigStore } from "./store";
import { i18n } from "./i18n";
import { customTrainerState } from "./custom-trainer";
import type { CustomTrainerBank, CustomTrainerStudy } from "./custom-trainer";
import { saveCustomTrainerBank } from "./custom-trainer-db";
import { isLocalDataOpen } from "./db";
import { buildFlopStudyLink, FLOP_STUDY_VIEW } from "./flop-study-model";
import { M as reviewLabels } from "./hand-review-labels";
import { SPOT_BET_SIZES } from "./preflop-spots";

/** 플랍 조회·통계가 이 앱에 있던 때의 주소(?view=flop-study&…) */
export const isOldStudyLink = () => {
  const view = new URLSearchParams(location.search).get("view");
  return view === FLOP_STUDY_VIEW || view === "flop-report";
};

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
// (숫자 = store.ts 기본값)
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
    config.rakePercent !== 0 ||
    config.rakeCap !== 0 ||
    config.addAllInThreshold !== 150 ||
    config.forceAllInThreshold !== 20 ||
    config.mergingThreshold !== 10 ||
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

const withParcels = <T>(mode: IDBTransactionMode, run: (parcels: IDBObjectStore) => IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    const open = indexedDB.open(PARCEL_DB, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(PARCEL_STORE);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const tx = open.result.transaction(PARCEL_STORE, mode);
      const request = run(tx.objectStore(PARCEL_STORE));
      tx.oncomplete = () => {
        open.result.close();
        resolve(request.result);
      };
      tx.onerror = () => reject(tx.error);
    };
  });
const readParcel = (key: string) => withParcels<Parcel | undefined>("readonly", (parcels) => parcels.get(key));
const removeParcel = (key: string) => withParcels<undefined>("readwrite", (parcels) => parcels.delete(key));

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

/** @returns 연습을 시작했으면 true · 저장에 실패해 /study/로 되돌아가면 false */
const startPractice = async (bank: CustomTrainerBank, key: string) => {
  const store = useStore();
  try {
    await saveCustomTrainerBank(bank);
  } catch {
    window.alert(reviewLabels[i18n.locale].practiceError);
    const study = bank.origin?.study;
    await removeParcel(key).catch(() => undefined);
    location.replace(`/study/${study ? practiceBackSearch(study, bank.id) : ""}`);
    return false;
  }
  // 복기의 «그 자리 연습»과 같은 넘김: 연습 화면을 이 묶음으로 다시 연다
  customTrainerState.active = false;
  await nextTick();
  customTrainerState.selectedBankId = bank.id;
  customTrainerState.active = true;
  store.navView = "solver";
  store.sideView = "trainer";
  return true;
};

const clearAddress = () => history.replaceState(null, "", location.pathname);

/**
 * `?handoff=<id>`로 들어왔을 때 App이 한 번 부른다. 짐이 없거나 낡았으면 그 화면을 그대로 둔다.
 * 계정 확인이 DB를 바꾸면 관문을 기다리는 동안 페이지가 새로고침된다 — 그래도 받을 수 있게
 * 주소와 짐은 다 받은 뒤에 지운다(주소가 남아 있어 새 페이지가 다시 부른다).
 * 설정은 기다리기 전에 채운다 — 기다리는 사이 사용자가 입력한 값을 덮지 않게.
 */
export const receiveStudyHandoff = async (id: string) => {
  // 예전 /study/ 페이지가 열려 있던 탭은 `handoff=1`과 공용 칸 next로 보낸다
  const key = id === "1" ? "next" : id;
  let parcel: Parcel | null = null;
  try {
    parcel = (await readParcel(key)) ?? null;
  } catch {
    clearAddress(); // 저장소가 막혔으면 빈 화면으로 시작한다
    return;
  }
  const fresh = parcelIsFresh(parcel) ? parcel : null;
  if (fresh?.kind === "solver-setup") applySolverSetup(fresh);
  await isLocalDataOpen();
  if (fresh?.kind === "practice" && !(await startPractice(fresh.bank, key))) return;
  await removeParcel(key).catch(() => undefined);
  clearAddress();
};
