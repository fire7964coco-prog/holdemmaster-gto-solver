import type { Results } from "./result-types";

// Extracted from ResultNav.getResults. Keep offsets, arrays, and property order
// unchanged: the result exporter also consumes this object.
export function decodeResults(
  buffer: Float64Array,
  lengths: number[],
  currentPlayer: Results["currentPlayer"],
  numActions: number
): Results {
  let offset = 0;
  const weights: number[][] = [[], []];
  const normalizer: number[][] = [[], []];
  const equity: number[][] = [[], []];
  const ev: number[][] = [[], []];
  const eqr: number[][] = [[], []];
  let strategy: number[] = [];
  let actionEv: number[] = [];

  const header = buffer.subarray(offset, offset + 3);
  offset += 3;

  const isEmpty = header[2];
  const eqrBase = [header[0], header[1]];

  weights[0] = Array.from(buffer.subarray(offset, offset + lengths[0]));
  offset += lengths[0];
  weights[1] = Array.from(buffer.subarray(offset, offset + lengths[1]));
  offset += lengths[1];

  normalizer[0] = Array.from(buffer.subarray(offset, offset + lengths[0]));
  offset += lengths[0];
  normalizer[1] = Array.from(buffer.subarray(offset, offset + lengths[1]));
  offset += lengths[1];

  if (!isEmpty) {
    equity[0] = Array.from(buffer.subarray(offset, offset + lengths[0]));
    offset += lengths[0];
    equity[1] = Array.from(buffer.subarray(offset, offset + lengths[1]));
    offset += lengths[1];

    ev[0] = Array.from(buffer.subarray(offset, offset + lengths[0]));
    offset += lengths[0];
    ev[1] = Array.from(buffer.subarray(offset, offset + lengths[1]));
    offset += lengths[1];

    eqr[0] = Array.from(buffer.subarray(offset, offset + lengths[0]));
    offset += lengths[0];
    eqr[1] = Array.from(buffer.subarray(offset, offset + lengths[1]));
    offset += lengths[1];
  }

  if (["oop", "ip"].includes(currentPlayer)) {
    const len = lengths[currentPlayer === "oop" ? 0 : 1];
    strategy = Array.from(
      buffer.subarray(offset, offset + numActions * len)
    );
    offset += numActions * len;
    if (!isEmpty) {
      actionEv = Array.from(
        buffer.subarray(offset, offset + numActions * len)
      );
      offset += numActions * len;
    }
  }

  return {
    currentPlayer,
    numActions,
    isEmpty,
    eqrBase,
    weights,
    normalizer,
    equity,
    ev,
    eqr,
    strategy,
    actionEv,
  };
}
