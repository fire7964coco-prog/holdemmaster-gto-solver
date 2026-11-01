import type * as Comlink from "comlink";
import type { Handler } from "./worker";
import type { CustomTrainerCapture } from "./custom-trainer";
import type { TrainerDecision } from "./trainer";
import { decodeResults } from "./results-decode";

type CaptureContext = Omit<CustomTrainerCapture, "exportAt" | "restore"> & {
  remote: Comlink.Remote<Handler>;
  cards: number[][];
  startingPot: number;
  effectiveStack: number;
  board: number[];
  originalHistory: number[];
  assertCurrent: () => void;
  release: () => void;
};

// Read the same finalized buffers as ResultNav without moving its selection or
// rebuilding its chance-card UI. The interpreter is returned to its old node.
export function createCustomTrainerCapture(context: CaptureContext): CustomTrainerCapture {
  const { remote, assertCurrent } = context;
  const empty = new Uint32Array();
  const checked = async <T>(operation: Promise<T>): Promise<T> => {
    const value = await operation;
    assertCurrent();
    return value;
  };
  return {
    configSnapshot: context.configSnapshot,
    locks: context.locks,
    unitScale: context.unitScale,
    targetExploitabilityPct: context.targetExploitabilityPct,
    achievedExploitabilityPct: context.achievedExploitabilityPct,
    async exportAt(path): Promise<TrainerDecision | null> {
      assertCurrent();
      if (path.some(index => !Number.isInteger(index) || index < 0 || index > 0xffffffff)) return null;
      const history = Uint32Array.from(path);
      // strategyAt validates paths before the legacy applyHistory API can panic.
      if ((await checked(remote.strategyAt(history))).length === 0) return null;
      await checked(remote.applyHistory(history));
      const player = await checked(remote.currentPlayer());
      if (player !== "oop" && player !== "ip") return null;
      const numActions = await checked(remote.numActions());
      const actions = (await checked(remote.actionsAfter(empty))).split("/");
      const results = decodeResults(await checked(remote.getResults()), context.cards.map(side => side.length), player, numActions);
      const bets = Array.from(await checked(remote.totalBetAmount(empty)));
      return {
        nodeId: path.length ? path.join("-") : "root",
        path: [...path],
        history: [], // collectCustomNodes adds the selected parent actions.
        cards: context.cards.map(side => [...side]),
        selectedSpot: {
          type: "player", index: path.length + 1, player, selectedIndex: -1,
          pot: context.startingPot + bets[0] + bets[1],
          stack: context.effectiveStack - bets[player === "oop" ? 0 : 1],
          actions: actions.map((action, index) => {
            const [name, amount] = action.split(":");
            return { index, name, amount, isSelected: false,
              color: name === "Fold" ? "#3b82f6" :
                name === "Check" || name === "Call" ? "#22c55e" : "#f59e0b" };
          }),
        },
        currentBoard: [...context.board],
        results,
        totalBetAmount: bets,
        startingPot: context.startingPot,
        effectiveStack: context.effectiveStack,
        unitScale: context.unitScale,
      };
    },
    async restore() {
      try {
        assertCurrent();
        await checked(remote.applyHistory(Uint32Array.from(context.originalHistory)));
      } finally {
        context.release();
      }
    },
  };
}
