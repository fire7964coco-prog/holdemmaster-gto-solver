import { ReviewError } from "./errors";
import { handIndex } from "./flop-canon";
import { flopLine } from "./flop-line";
import { getNode, Hmr1File } from "./hmr1";

/** Own reach only, in the FILE'S suit space; never multiply the opponent's decisions. */
export function rangeAt(file: Hmr1File, path: readonly number[], player: 0 | 1): Float32Array {
  if (player !== 0 && player !== 1) throw new ReviewError("INVALID_PLAYER", "Player must be zero or one");
  flopLine(file, path); // Also validates unstored chance / terminal endpoints.
  const { hands, weights } = file.players[player];
  const reached = Float64Array.from(weights);
  for (let depth = 0; depth < path.length; depth++) {
    const node = getNode(file, path.slice(0, depth));
    if (node.player !== player) continue;
    for (let h = 0; h < hands.length; h++) {
      let sum = 0;
      for (let a = 0; a < node.actions.length; a++) sum += node.strategy[a * hands.length + h];
      if (sum === 0) {
        if (reached[h] !== 0) throw new ReviewError("INVALID_STRATEGY", "Zero strategy on a reached hand", { path: node.path, player, hand: hands[h] });
        continue;
      }
      reached[h] *= node.strategy[path[depth] * hands.length + h] / sum;
    }
  }
  const result = new Float32Array(1326);
  hands.forEach(([a, b], h) => { result[handIndex(a, b)] = reached[h]; });
  return result;
}
