import { ReviewError } from "./errors";
import { assertDistinctCards, cardName, Flop } from "./flop-canon";

export type ReviewPlayer = 0 | 1;
export type Hmr1Hand = readonly [number, number];

export interface Hmr1NodeHeader {
  readonly path: readonly number[];
  readonly player: ReviewPlayer;
  readonly actions: readonly string[];
  /** Byte offset relative to the start of the body. */
  readonly offset: number;
}

export interface Hmr1Header {
  readonly version: 1;
  readonly scenario: string;
  readonly flop: string;
  readonly flopCards: Flop;
  readonly flopWeight: number;
  readonly pot: number;
  readonly stack: number;
  readonly unit: number;
  readonly evScale: number;
  readonly flopBet: string;
  readonly laterBet: string;
  readonly raise: string;
  readonly targetPct: number;
  readonly exploitPct: number;
  readonly iterations: number;
  readonly seconds: number;
  readonly compressed: boolean;
  readonly nodes: readonly Hmr1NodeHeader[];
}

export interface Hmr1Player {
  readonly hands: readonly Hmr1Hand[];
  readonly weights: Float32Array;
}

export interface Hmr1Node extends Hmr1NodeHeader {
  /** Quantized action-major probabilities; index = action * hand count + hand. */
  readonly strategy: Uint8Array;
  /** Quantized action-major EVs; chips = value / header.evScale. */
  readonly ev: Int16Array;
}

export interface Hmr1File {
  readonly header: Hmr1Header;
  readonly players: readonly [Hmr1Player, Hmr1Player];
  readonly nodes: readonly Hmr1Node[];
  readonly nodesByPath: ReadonlyMap<string, Hmr1Node>;
  readonly bodyLength: number;
  readonly byteLength: number;
}

function invalid(message: string, details: Readonly<Record<string, unknown>> = {}): never {
  throw new ReviewError("INVALID_FORMAT", message, details);
}

function record(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid("Expected JSON object", { name });
  return value as Record<string, unknown>;
}

function numeric(value: unknown, name: string, min: number, integer = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min ||
      (integer && !Number.isSafeInteger(value))) invalid("Invalid numeric field", { name, value });
  return value;
}

function nonempty(value: unknown, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) invalid("Invalid string field", { name });
  return value;
}

/** Also validates paths from JavaScript callers before constructing a lookup key. */
export function pathKey(path: readonly number[]): string {
  if (!Array.isArray(path) || path.some(v => !Number.isSafeInteger(v) || v < 0)) {
    throw new ReviewError("INVALID_PATH", "Path must contain nonnegative action indices", { path });
  }
  return path.join("/");
}

export function getNode(file: Hmr1File, path: readonly number[]): Hmr1Node {
  const key = pathKey(path);
  const node = file.nodesByPath.get(key);
  if (!node) throw new ReviewError("MISSING_PATH", "No saved decision at path", { path: [...path] });
  return node;
}

function parseHeader(value: unknown): Hmr1Header {
  const raw = record(value, "header");
  if (raw.version !== 1) invalid("Unsupported HMR1 version", { version: raw.version });
  if (!Array.isArray(raw.flopCards)) invalid("Missing flop cards");
  assertDistinctCards(raw.flopCards, 3);
  const flopCards: Flop = [raw.flopCards[0], raw.flopCards[1], raw.flopCards[2]];
  if (!(flopCards[0] < flopCards[1] && flopCards[1] < flopCards[2])) invalid("Flop cards must be sorted ascending");
  const flop = nonempty(raw.flop, "flop");
  if (flop !== [...flopCards].reverse().map(cardName).join("")) invalid("Flop name and cards disagree");
  const stack = numeric(raw.stack, "stack", 1, true);
  if (!Array.isArray(raw.nodes) || raw.nodes.length === 0) invalid("No decision nodes");
  const seen = new Map<string, Hmr1NodeHeader>();
  const nodes: Hmr1NodeHeader[] = raw.nodes.map((item: unknown, index: number) => {
    const n = record(item, `nodes[${index}]`);
    if (!Array.isArray(n.path)) invalid("Missing node path", { index });
    const key = pathKey(n.path);
    if (seen.has(key)) invalid("Duplicate node path", { path: n.path });
    if (n.player !== 0 && n.player !== 1) invalid("Invalid node player", { index, player: n.player });
    if (!Array.isArray(n.actions) || n.actions.length === 0) invalid("Missing node actions", { index });
    const actions = n.actions.map((value: unknown) => {
      const action = nonempty(value, "action");
      const sized = /^(?:Bet|Raise|AllIn)\(([1-9][0-9]*)\)$/.exec(action);
      if (!sized && !["Fold", "Check", "Call"].includes(action)) {
        throw new ReviewError("UNSUPPORTED_ACTION", "Unsupported saved action", { index, action });
      }
      if (sized) {
        const amount = Number(sized[1]);
        if (!Number.isSafeInteger(amount) || amount > stack) invalid("Action exceeds effective stack", { index, action });
      }
      return action;
    });
    if (new Set(actions).size !== actions.length) invalid("Duplicate node action", { index });
    const node: Hmr1NodeHeader = {
      path: [...n.path], player: n.player, actions,
      offset: numeric(n.offset, "node.offset", 0, true),
    };
    if (index === 0) {
      if (key !== "" || node.player !== 0) invalid("First node must be the OOP root");
    } else {
      const parent = seen.get(pathKey(node.path.slice(0, -1)));
      const actionIndex = node.path[node.path.length - 1];
      if (!parent || actionIndex >= parent.actions.length) invalid("Node has no preceding parent action", { path: node.path });
      if (node.player === parent.player) invalid("Flop actors must alternate", { path: node.path });
      const action = parent.actions[actionIndex];
      if (action === "Fold" || action === "Call" || (action === "Check" && parent.player === 1)) {
        invalid("Decision node follows a completed street", { path: node.path });
      }
    }
    seen.set(key, node);
    return node;
  });
  if (typeof raw.compressed !== "boolean") invalid("Invalid compression field");
  const unit = numeric(raw.unit, "unit", 1, true);
  const evScale = numeric(raw.evScale, "evScale", 1, true);
  const pot = numeric(raw.pot, "pot", 1, true);
  if (!Number.isSafeInteger(pot + 2 * stack)) invalid("Chip totals exceed exact integer arithmetic");
  return {
    version: 1, scenario: nonempty(raw.scenario, "scenario"), flop, flopCards,
    flopWeight: numeric(raw.flopWeight, "flopWeight", 1, true),
    pot, stack, unit, evScale,
    flopBet: nonempty(raw.flopBet, "flopBet"), laterBet: nonempty(raw.laterBet, "laterBet"),
    raise: nonempty(raw.raise, "raise"), targetPct: numeric(raw.targetPct, "targetPct", 0),
    exploitPct: numeric(raw.exploitPct, "exploitPct", 0),
    iterations: numeric(raw.iterations, "iterations", 0, true),
    seconds: numeric(raw.seconds, "seconds", 0), compressed: raw.compressed, nodes,
  };
}

/**
 * No I/O: the caller supplies a whole HMR1 file. Arrays own copies of the input.
 * Treat returned arrays as read-only; missing/corrupt data never becomes an empty range.
 */
export function parseHmr1(bytes: Uint8Array | null | undefined): Hmr1File {
  if (bytes == null) throw new ReviewError("MISSING_FILE", "No HMR1 bytes supplied");
  if (!(bytes instanceof Uint8Array)) invalid("HMR1 input must be Uint8Array");
  if (bytes.byteLength < 8) invalid("Truncated HMR1 prefix");
  if (bytes[0] !== 72 || bytes[1] !== 77 || bytes[2] !== 82 || bytes[3] !== 49) invalid("Invalid HMR1 magic");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const headerLength = view.getUint32(4, true);
  const bodyStart = 8 + headerLength;
  if (headerLength === 0 || bodyStart > bytes.byteLength) invalid("Invalid HMR1 header length", { headerLength });
  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(8, bodyStart)));
  } catch {
    invalid("HMR1 header must be valid UTF-8 JSON");
  }
  const header = parseHeader(json);
  let position = bodyStart;
  const ensure = (count: number): void => {
    if (!Number.isSafeInteger(count) || count < 0 || position + count > bytes.byteLength) {
      invalid("Truncated HMR1 body", { offset: position - bodyStart, count });
    }
  };
  const readPlayer = (player: ReviewPlayer): Hmr1Player => {
    ensure(2);
    const count = view.getUint16(position, true);
    position += 2;
    if (count === 0 || count > 1176) invalid("Invalid flop hand count", { player, count });
    ensure(count * 6);
    const hands: Hmr1Hand[] = [];
    const seen = new Set<string>();
    for (let h = 0; h < count; h++) {
      const a = bytes[position++];
      const b = bytes[position++];
      assertDistinctCards([a, b, ...header.flopCards], 5);
      if (a >= b) invalid("Private hand cards must be sorted ascending", { player, hand: h });
      const key = `${a}/${b}`;
      if (seen.has(key)) invalid("Duplicate private hand", { player, hand: h });
      seen.add(key);
      hands.push([a, b]);
    }
    const weights = new Float32Array(count);
    for (let h = 0; h < count; h++) {
      const weight = view.getFloat32(position, true);
      position += 4;
      if (!Number.isFinite(weight) || weight < 0 || weight > 1) invalid("Invalid root hand weight", { player, hand: h, weight });
      weights[h] = weight;
    }
    if (!weights.some(weight => weight > 0)) invalid("Player root range is empty", { player });
    return { hands, weights };
  };
  const players: [Hmr1Player, Hmr1Player] = [readPlayer(0), readPlayer(1)];
  const nodesByPath = new Map<string, Hmr1Node>();
  const nodes = header.nodes.map(metadata => {
    if (metadata.offset !== position - bodyStart) invalid("Noncontiguous or incorrect node offset", { path: metadata.path, expected: position - bodyStart, actual: metadata.offset });
    const handCount = players[metadata.player].hands.length;
    const count = handCount * metadata.actions.length;
    ensure(count * 3);
    // Buffer.slice() is a shared view even though Buffer extends Uint8Array.
    const strategy = Uint8Array.from(bytes.subarray(position, position + count));
    position += count;
    const ev = new Int16Array(count);
    for (let i = 0; i < count; i++) {
      ev[i] = view.getInt16(position, true);
      position += 2;
      if (ev[i] === -32768) invalid("EV is outside the HMR1 writer range", { path: metadata.path, index: i });
    }
    for (let h = 0; h < handCount; h++) {
      if (players[metadata.player].weights[h] <= 0) continue;
      let sum = 0;
      for (let a = 0; a < metadata.actions.length; a++) sum += strategy[a * handCount + h];
      if (Math.abs(sum - 255) > 3) invalid("Invalid quantized strategy sum", { path: metadata.path, hand: h, sum });
    }
    const node: Hmr1Node = { ...metadata, strategy, ev };
    nodesByPath.set(pathKey(node.path), node);
    return node;
  });
  if (position !== bytes.byteLength) invalid("Unexpected trailing HMR1 bytes", { expected: position, actual: bytes.byteLength });
  return { header, players, nodes, nodesByPath, bodyLength: position - bodyStart, byteLength: bytes.byteLength };
}
