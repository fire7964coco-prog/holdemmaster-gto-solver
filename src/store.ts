import { defineStore } from "pinia";
import { sanitizeBetString } from "./utils";

export type NavView = "solver" | "results";

export type SideView =
  | "about"
  | "guide"
  | "presets"
  | "trainer"
  | "oop-range"
  | "ip-range"
  | "board"
  | "tree-config"
  | "run-solver";

export const saveConfigTmp = () => {
  const config = useConfigStore();
  const tmpConfig = useTmpConfigStore();

  tmpConfig.rangeRaw[0].set(config.rangeRaw[0]);
  tmpConfig.rangeRaw[1].set(config.rangeRaw[1]);

  tmpConfig.$patch({
    board: [...config.board],
    startingPot: config.startingPot,
    effectiveStack: config.effectiveStack,
    rakePercent: config.rakePercent,
    rakeCap: config.rakeCap,
    donkOption: config.donkOption,
    oopFlopBet: config.oopFlopBet,
    oopFlopRaise: config.oopFlopRaise,
    oopTurnBet: config.oopTurnBet,
    oopTurnRaise: config.oopTurnRaise,
    oopTurnDonk: config.oopTurnDonk,
    oopRiverBet: config.oopRiverBet,
    oopRiverRaise: config.oopRiverRaise,
    oopRiverDonk: config.oopRiverDonk,
    ipFlopBet: config.ipFlopBet,
    ipFlopRaise: config.ipFlopRaise,
    ipTurnBet: config.ipTurnBet,
    ipTurnRaise: config.ipTurnRaise,
    ipRiverBet: config.ipRiverBet,
    ipRiverRaise: config.ipRiverRaise,
    addAllInThreshold: config.addAllInThreshold,
    forceAllInThreshold: config.forceAllInThreshold,
    mergingThreshold: config.mergingThreshold,
    expectedBoardLength: config.expectedBoardLength,
    addedLines: config.addedLines,
    removedLines: config.removedLines,
  });
};

export const saveConfig = () => {
  const tmpConfig = useTmpConfigStore();
  const savedConfig = useSavedConfigStore();

  savedConfig.rangeRaw[0].set(tmpConfig.rangeRaw[0]);
  savedConfig.rangeRaw[1].set(tmpConfig.rangeRaw[1]);

  savedConfig.$patch({
    board: tmpConfig.board,
    startingPot: tmpConfig.startingPot,
    effectiveStack: tmpConfig.effectiveStack,
    rakePercent: tmpConfig.rakePercent,
    rakeCap: tmpConfig.rakeCap,
    donkOption: tmpConfig.donkOption,
    oopFlopBet: tmpConfig.oopFlopBet,
    oopFlopRaise: tmpConfig.oopFlopRaise,
    oopTurnBet: tmpConfig.oopTurnBet,
    oopTurnRaise: tmpConfig.oopTurnRaise,
    oopTurnDonk: tmpConfig.oopTurnDonk,
    oopRiverBet: tmpConfig.oopRiverBet,
    oopRiverRaise: tmpConfig.oopRiverRaise,
    oopRiverDonk: tmpConfig.oopRiverDonk,
    ipFlopBet: tmpConfig.ipFlopBet,
    ipFlopRaise: tmpConfig.ipFlopRaise,
    ipTurnBet: tmpConfig.ipTurnBet,
    ipTurnRaise: tmpConfig.ipTurnRaise,
    ipRiverBet: tmpConfig.ipRiverBet,
    ipRiverRaise: tmpConfig.ipRiverRaise,
    addAllInThreshold: tmpConfig.addAllInThreshold,
    forceAllInThreshold: tmpConfig.forceAllInThreshold,
    mergingThreshold: tmpConfig.mergingThreshold,
    expectedBoardLength: tmpConfig.expectedBoardLength,
    addedLines: tmpConfig.addedLines,
    removedLines: tmpConfig.removedLines,
  });
};

export const useStore = defineStore("app", {
  state: () => ({
    navView: "solver" as NavView,
    sideView: "about" as SideView,
    // 트리 편집기가 열려 있는가 — 화면 제목의 «> 트리 미리보기 & 편집» 표시용
    // (제목 문구 자체는 언어별이라 App.vue가 갖는다)
    treeEditOpen: false,
    isSolverRunning: false,
    isFinalizing: false,
    isSolverPaused: false,
    isSolverFinished: false,
    // 프리셋 로더 → RangeEditor로 레인지 텍스트를 전달하는 채널 (적용 후 비워짐)
    pendingRangeText: ["", ""] as [string, string],
    // RangeEditor가 최신 레인지 텍스트를 미러링 (스팟 공유 링크용)
    rangeText: ["", ""] as [string, string],
    // 공유 링크로 들어와 설정이 적용됐음을 알리는 플래그 (RunSolver 안내 배너)
    sharedSpotLoaded: false,
    // 1 = 임의 칩 단위, 10 = 교육 프리셋의 0.1bb 단위
    displayUnitScale: 1,
    // 교육 예제 화면 진입 시 곧바로 열 프리셋 id (트레이너 → 미리보기 이동용)
    pendingPresetPreview: "",
  }),

  getters: {
    hasSolverRun: (state) => {
      return (
        state.isSolverRunning ||
        state.isFinalizing ||
        state.isSolverPaused ||
        state.isSolverFinished
      );
    },
  },
});

export const useConfigStore = defineStore("config", {
  state: () => ({
    range: [
      Array.from({ length: 13 * 13 }, () => 0),
      Array.from({ length: 13 * 13 }, () => 0),
    ],
    rangeRaw: [
      Float32Array.from({ length: (52 * 51) / 2 }, () => 0),
      Float32Array.from({ length: (52 * 51) / 2 }, () => 0),
    ],
    board: [] as number[],
    startingPot: 20,
    effectiveStack: 100,
    rakePercent: 0,
    rakeCap: 0,
    donkOption: false,
    oopFlopBet: "",
    oopFlopRaise: "",
    oopTurnBet: "",
    oopTurnRaise: "",
    oopTurnDonk: "",
    oopRiverBet: "",
    oopRiverRaise: "",
    oopRiverDonk: "",
    ipFlopBet: "",
    ipFlopRaise: "",
    ipTurnBet: "",
    ipTurnRaise: "",
    ipRiverBet: "",
    ipRiverRaise: "",
    addAllInThreshold: 150,
    forceAllInThreshold: 20,
    mergingThreshold: 10,
    expectedBoardLength: 0,
    addedLines: "",
    removedLines: "",
  }),

  getters: {
    oopFlopBetSanitized: (s) => sanitizeBetString(s.oopFlopBet, false),
    oopFlopRaiseSanitized: (s) => sanitizeBetString(s.oopFlopRaise, true),
    oopTurnBetSanitized: (s) => sanitizeBetString(s.oopTurnBet, false),
    oopTurnRaiseSanitized: (s) => sanitizeBetString(s.oopTurnRaise, true),
    oopTurnDonkSanitized: (s) => sanitizeBetString(s.oopTurnDonk, false),
    oopRiverBetSanitized: (s) => sanitizeBetString(s.oopRiverBet, false),
    oopRiverRaiseSanitized: (s) => sanitizeBetString(s.oopRiverRaise, true),
    oopRiverDonkSanitized: (s) => sanitizeBetString(s.oopRiverDonk, false),
    ipFlopBetSanitized: (s) => sanitizeBetString(s.ipFlopBet, false),
    ipFlopRaiseSanitized: (s) => sanitizeBetString(s.ipFlopRaise, true),
    ipTurnBetSanitized: (s) => sanitizeBetString(s.ipTurnBet, false),
    ipTurnRaiseSanitized: (s) => sanitizeBetString(s.ipTurnRaise, true),
    ipRiverBetSanitized: (s) => sanitizeBetString(s.ipRiverBet, false),
    ipRiverRaiseSanitized: (s) => sanitizeBetString(s.ipRiverRaise, true),
  },
});

export const useTmpConfigStore = defineStore("tmpConfig", {
  state: () => ({
    rangeRaw: [
      Float32Array.from({ length: (52 * 51) / 2 }, () => 0),
      Float32Array.from({ length: (52 * 51) / 2 }, () => 0),
    ],
    board: [] as number[],
    startingPot: 0,
    effectiveStack: 0,
    rakePercent: 0,
    rakeCap: 0,
    donkOption: false,
    oopFlopBet: "",
    oopFlopRaise: "",
    oopTurnBet: "",
    oopTurnRaise: "",
    oopTurnDonk: "",
    oopRiverBet: "",
    oopRiverRaise: "",
    oopRiverDonk: "",
    ipFlopBet: "",
    ipFlopRaise: "",
    ipTurnBet: "",
    ipTurnRaise: "",
    ipRiverBet: "",
    ipRiverRaise: "",
    addAllInThreshold: 0,
    forceAllInThreshold: 0,
    mergingThreshold: 0,
    expectedBoardLength: 0,
    addedLines: "",
    removedLines: "",
  }),
});

export const useSavedConfigStore = defineStore("savedConfig", {
  state: () => ({
    rangeRaw: [
      Float32Array.from({ length: (52 * 51) / 2 }, () => 0),
      Float32Array.from({ length: (52 * 51) / 2 }, () => 0),
    ],
    board: [] as number[],
    startingPot: 0,
    effectiveStack: 0,
    rakePercent: 0,
    rakeCap: 0,
    donkOption: false,
    oopFlopBet: "",
    oopFlopRaise: "",
    oopTurnBet: "",
    oopTurnRaise: "",
    oopTurnDonk: "",
    oopRiverBet: "",
    oopRiverRaise: "",
    oopRiverDonk: "",
    ipFlopBet: "",
    ipFlopRaise: "",
    ipTurnBet: "",
    ipTurnRaise: "",
    ipRiverBet: "",
    ipRiverRaise: "",
    addAllInThreshold: 0,
    forceAllInThreshold: 0,
    mergingThreshold: 0,
    expectedBoardLength: 0,
    addedLines: "",
    removedLines: "",
  }),
});
