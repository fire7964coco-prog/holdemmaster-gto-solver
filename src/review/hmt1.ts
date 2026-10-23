import { ReviewError } from "./errors";
import { assertDistinctCards, cardName, Flop, representativeTurns } from "./flop-canon";
import { flopLine } from "./flop-line";
import {
  HMR1_EV_MISSING, Hmr1File, Hmr1Node, Hmr1NodeHeader, Hmr1Player, parseDecisionBody, parseNodeHeaders,
} from "./hmr1";

/*
 * HMT1 = one canonical flop × one completed flop line (e.g. check-check) × its turn cards.
 * Producer: 참고자료/사전계산_도구_2026-09-28/turnpack (turn-start solve from the flop line's engine
 * reach, its own target measured against the TURN pot). Layout:
 *   "HMT1" · u32 LE header length · UTF-8 JSON header · body
 * Header fields:
 *   format "HMT1", version 1, evMissing -32768, evSemantics "counterfactual"
 *   scenario, flop, flopCards (ascending, canonical), flopPath (prepared action indices in the
 *   same scenario's HMR1 tree), pathName, flopPot/flopStack (scenario start), pot/stack (turn start)
 *   unit, evScale, flopBet/laterBet/raise, addAllinThreshold 1.5, forceAllinThreshold 0.2,
 *   mergingThreshold 0.1, rakeRate 0, rakeCap 0, donk null, reach "engine-f32"
 *   targetPct, flopExploitPct, flopIterations, turnSet "all" | "sample"
 *   turns: [{ turn, tag, exploitPct, iterations, seconds, offset, length, nodes }] ascending by card
 *   skipped: [{ turn, reason, hands }] (a player has no live hand on that turn)
 * Only representative turns (smallest image under the flop's suit symmetry) are stored; use
 * canonicalizeTurn() for the key and its perm for hands. With turnSet "all", turns ∪ skipped is
 * exactly representativeTurns(flopCards).
 * Each turn blob (body offset..offset+length) has the HMR1 body layout with offsets relative to
 * the blob: weights are the line's unquantized reach (≤ 1), hands exclude all four board cards.
 */

export interface Hmt1TurnHeader {
  readonly turn: number;
  readonly tag: string;
  readonly exploitPct: number;
  readonly iterations: number;
  readonly seconds: number;
  readonly offset: number;
  readonly length: number;
  readonly nodes: readonly Hmr1NodeHeader[];
}

export interface Hmt1Header {
  readonly version: 1;
  readonly scenario: string;
  readonly flop: string;
  readonly flopCards: Flop;
  readonly flopPath: readonly number[];
  readonly pathName: string;
  readonly flopPot: number;
  readonly flopStack: number;
  readonly pot: number;
  readonly stack: number;
  readonly unit: number;
  readonly evScale: number;
  readonly flopBet: string;
  readonly laterBet: string;
  readonly raise: string;
  readonly targetPct: number;
  readonly flopExploitPct: number;
  readonly flopIterations: number;
  readonly turnSet: "all" | "sample";
  readonly turns: readonly Hmt1TurnHeader[];
  readonly skipped: readonly { readonly turn: number; readonly reason: string }[];
}

export interface Hmt1Pack {
  readonly header: Hmt1Header;
  readonly byteLength: number;
  /** Private: body bytes for lazy per-turn parsing. */
  readonly body: Uint8Array;
  readonly parsed: Map<number, Hmt1Turn>;
}

export interface Hmt1Turn {
  readonly turn: number;
  readonly board: readonly [number, number, number, number];
  readonly tag: string;
  /**
   * Turn decisions in the HMR1 shape so flopLine / rangeAt / evaluateFlopDecision work unchanged:
   * header.pot/stack = turn start, flopBet = the turn bet menu, exploitPct = this turn's own solve.
   */
  readonly file: Hmr1File;
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

function text(value: unknown, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) invalid("Invalid string field", { name });
  return value;
}

function exact(raw: Record<string, unknown>, name: string, expected: unknown): void {
  if (raw[name] !== expected) invalid("Unsupported HMT1 tree setting", { name, value: raw[name], expected });
}

function card(value: unknown, name: string): number {
  const c = numeric(value, name, 0, true);
  if (c >= 52) invalid("Invalid card", { name, value });
  return c;
}

function parseHeader(value: unknown): Hmt1Header {
  const raw = record(value, "header");
  if (raw.format !== "HMT1" || raw.version !== 1) invalid("Unsupported HMT1 version", { format: raw.format, version: raw.version });
  if (raw.evMissing !== HMR1_EV_MISSING || raw.evSemantics !== "counterfactual") invalid("Invalid HMT1 EV contract");
  if (!Array.isArray(raw.flopCards)) invalid("Missing flop cards");
  assertDistinctCards(raw.flopCards, 3);
  const flopCards: Flop = [raw.flopCards[0], raw.flopCards[1], raw.flopCards[2]];
  if (!(flopCards[0] < flopCards[1] && flopCards[1] < flopCards[2])) invalid("Flop cards must be sorted ascending");
  const flop = text(raw.flop, "flop");
  if (flop !== [...flopCards].reverse().map(cardName).join("")) invalid("Flop name and cards disagree");
  if (!Array.isArray(raw.flopPath) || raw.flopPath.some(v => !Number.isSafeInteger(v) || v < 0)) invalid("Invalid flop path");
  const flopPot = numeric(raw.flopPot, "flopPot", 1, true);
  const flopStack = numeric(raw.flopStack, "flopStack", 1, true);
  const pot = numeric(raw.pot, "pot", 1, true);
  const stack = numeric(raw.stack, "stack", 1, true);
  if (pot < flopPot || stack > flopStack || pot + 2 * stack !== flopPot + 2 * flopStack) {
    invalid("Turn start must conserve the flop's chips", { flopPot, flopStack, pot, stack });
  }
  exact(raw, "addAllinThreshold", 1.5);
  exact(raw, "forceAllinThreshold", 0.2);
  exact(raw, "mergingThreshold", 0.1);
  exact(raw, "rakeRate", 0);
  exact(raw, "rakeCap", 0);
  exact(raw, "donk", null);
  exact(raw, "reach", "engine-f32");
  const targetPct = numeric(raw.targetPct, "targetPct", 0);
  if (targetPct <= 0 || targetPct > 1) invalid("Unsupported target", { targetPct });
  if (raw.turnSet !== "all" && raw.turnSet !== "sample") invalid("Invalid turn set", { turnSet: raw.turnSet });
  if (!Array.isArray(raw.turns) || !Array.isArray(raw.skipped)) invalid("Missing turn lists");
  const reps = new Set(representativeTurns(flopCards));
  const seen = new Set<number>();
  const claim = (c: number) => {
    if (!reps.has(c)) invalid("Turn is not a representative card for this flop", { turn: c });
    if (seen.has(c)) invalid("Duplicate turn", { turn: c });
    seen.add(c);
  };
  let expectedOffset = 0;
  const turns: Hmt1TurnHeader[] = raw.turns.map((item: unknown, index: number) => {
    const t = record(item, `turns[${index}]`);
    const turn = card(t.turn, "turn");
    claim(turn);
    if (index > 0 && turn <= (raw.turns as { turn: number }[])[index - 1].turn) invalid("Turns must be ascending");
    const offset = numeric(t.offset, "turn.offset", 0, true);
    const length = numeric(t.length, "turn.length", 1, true);
    if (offset !== expectedOffset) invalid("Noncontiguous turn blob", { turn, expected: expectedOffset, actual: offset });
    expectedOffset += length;
    return {
      turn, tag: typeof t.tag === "string" ? t.tag : "",
      exploitPct: numeric(t.exploitPct, "turn.exploitPct", 0),
      iterations: numeric(t.iterations, "turn.iterations", 0, true),
      seconds: numeric(t.seconds, "turn.seconds", 0),
      offset, length, nodes: parseNodeHeaders(t.nodes, stack),
    };
  });
  const skipped = raw.skipped.map((item: unknown, index: number) => {
    const s = record(item, `skipped[${index}]`);
    const turn = card(s.turn, "skipped.turn");
    claim(turn);
    return { turn, reason: text(s.reason, "skipped.reason") };
  });
  if (raw.turnSet === "all" && seen.size !== reps.size) invalid("Incomplete turn set", { stored: seen.size, expected: reps.size });
  return {
    version: 1, scenario: text(raw.scenario, "scenario"), flop, flopCards, flopPath: [...raw.flopPath],
    pathName: text(raw.pathName, "pathName"), flopPot, flopStack, pot, stack,
    unit: numeric(raw.unit, "unit", 1, true), evScale: numeric(raw.evScale, "evScale", 1, true),
    flopBet: text(raw.flopBet, "flopBet"), laterBet: text(raw.laterBet, "laterBet"), raise: text(raw.raise, "raise"),
    targetPct, flopExploitPct: numeric(raw.flopExploitPct, "flopExploitPct", 0),
    flopIterations: numeric(raw.flopIterations, "flopIterations", 0, true),
    turnSet: raw.turnSet, turns, skipped,
  };
}

/** No I/O. Validates the header and blob layout; each turn's body is parsed on first use. */
export function parseHmt1(bytes: Uint8Array | null | undefined): Hmt1Pack {
  if (bytes == null) throw new ReviewError("MISSING_FILE", "No HMT1 bytes supplied");
  if (!(bytes instanceof Uint8Array)) invalid("HMT1 input must be Uint8Array");
  if (bytes.byteLength < 8) invalid("Truncated HMT1 prefix");
  if (bytes[0] !== 72 || bytes[1] !== 77 || bytes[2] !== 84 || bytes[3] !== 49) invalid("Invalid HMT1 magic");
  const headerLength = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(4, true);
  const bodyStart = 8 + headerLength;
  if (headerLength === 0 || bodyStart > bytes.byteLength) invalid("Invalid HMT1 header length", { headerLength });
  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(8, bodyStart)));
  } catch {
    invalid("HMT1 header must be valid UTF-8 JSON");
  }
  const header = parseHeader(json);
  const last = header.turns[header.turns.length - 1];
  const bodyLength = last ? last.offset + last.length : 0;
  if (bodyStart + bodyLength !== bytes.byteLength) invalid("HMT1 body length mismatch", { expected: bodyStart + bodyLength, actual: bytes.byteLength });
  // Own a copy, like parseHmr1: a later mutation of the caller's buffer cannot change parsed turns.
  return { header, byteLength: bytes.byteLength, body: bytes.slice(bodyStart), parsed: new Map() };
}

/**
 * `turn` is the representative card from canonicalizeTurn(). A skipped turn throws TURN_SKIPPED,
 * an absent one MISSING_TURN, an unconverged one UNSUPPORTED_ACCURACY.
 */
export function getTurn(pack: Hmt1Pack, turn: number): Hmt1Turn {
  const cached = pack.parsed.get(turn);
  if (cached) return cached;
  const h = pack.header;
  const meta = h.turns.find(t => t.turn === turn);
  if (!meta) {
    const skip = h.skipped.find(s => s.turn === turn);
    if (skip) throw new ReviewError("TURN_SKIPPED", "No live hands on this turn", { turn, reason: skip.reason });
    throw new ReviewError("MISSING_TURN", "Turn not in this pack", { turn });
  }
  if (meta.exploitPct > h.targetPct) {
    throw new ReviewError("UNSUPPORTED_ACCURACY", "Turn solve did not reach the target", { turn, exploitPct: meta.exploitPct });
  }
  const board = [...h.flopCards, turn] as [number, number, number, number];
  const blob = pack.body.subarray(meta.offset, meta.offset + meta.length);
  const { players, nodes, nodesByPath, end } = parseDecisionBody(blob, 0, 2, meta.nodes, board);
  if (end !== meta.length) invalid("Turn blob length mismatch", { turn, expected: meta.length, actual: end });
  const file: Hmr1File = {
    header: {
      version: 2, evMissing: HMR1_EV_MISSING, evSemantics: "counterfactual",
      scenario: h.scenario, flop: h.flop, flopCards: h.flopCards, flopWeight: 1,
      pot: h.pot, stack: h.stack, unit: h.unit, evScale: h.evScale,
      flopBet: h.laterBet, laterBet: h.laterBet, raise: h.raise,
      targetPct: h.targetPct, exploitPct: meta.exploitPct, iterations: meta.iterations,
      seconds: meta.seconds, compressed: false, nodes: meta.nodes,
    },
    players, nodes, nodesByPath, bodyLength: meta.length, byteLength: meta.length,
  };
  const result: Hmt1Turn = { turn, board, tag: meta.tag, file };
  pack.parsed.set(turn, result);
  return result;
}

/**
 * Turn-card comparison input without parsing the whole turn: both players' turn-start hands/reach and
 * the first (OOP) decision only. Not cached in pack.parsed. Same errors as getTurn.
 */
export function getTurnRoot(pack: Hmt1Pack, turn: number): { players: readonly [Hmr1Player, Hmr1Player]; root: Hmr1Node } {
  const h = pack.header;
  const meta = h.turns.find(t => t.turn === turn);
  if (!meta) {
    const skip = h.skipped.find(s => s.turn === turn);
    if (skip) throw new ReviewError("TURN_SKIPPED", "No live hands on this turn", { turn, reason: skip.reason });
    throw new ReviewError("MISSING_TURN", "Turn not in this pack", { turn });
  }
  if (meta.exploitPct > h.targetPct) {
    throw new ReviewError("UNSUPPORTED_ACCURACY", "Turn solve did not reach the target", { turn, exploitPct: meta.exploitPct });
  }
  const blob = pack.body.subarray(meta.offset, meta.offset + meta.length);
  const { players, nodes } = parseDecisionBody(blob, 0, 2, meta.nodes.slice(0, 1), [...h.flopCards, turn]);
  return { players, root: nodes[0] };
}

/** The pack must continue this exact HMR1 flop file's line (same scenario, tree, path and chips). */
export function assertPackMatchesFlop(pack: Hmt1Pack, flopFile: Hmr1File): void {
  const h = pack.header;
  const f = flopFile.header;
  const strip = (s: string) => s.replace(/\s/g, "");
  if (h.scenario !== f.scenario || h.flop !== f.flop || h.flopPot !== f.pot || h.flopStack !== f.stack ||
      h.unit !== f.unit || strip(h.flopBet) !== strip(f.flopBet) || strip(h.laterBet) !== strip(f.laterBet) ||
      strip(h.raise) !== strip(f.raise)) {
    throw new ReviewError("PACK_MISMATCH", "Turn pack belongs to another flop file", { pack: h.flop, flop: f.flop });
  }
  const line = flopLine(flopFile, h.flopPath);
  if (line.kind !== "chance" || line.pot !== h.pot || line.effectiveStack !== h.stack) {
    throw new ReviewError("PACK_MISMATCH", "Flop path does not end at this turn start", { flopPath: h.flopPath, kind: line.kind });
  }
}
