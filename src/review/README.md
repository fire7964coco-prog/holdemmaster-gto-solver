# R1 / R1b calculation API

These modules perform no I/O, worker calls, DOM access, or runtime imports of Vue/the app.
The caller owns loading bytes and presenting diagnostics. The R2 hand-review screen now consumes them.

1. `canonicalizeFlop(actualFlop)` returns the ascending representative, its `.bin` filename,
   and actual-to-file `perm` / `inversePerm`. Keep this exact permutation for the whole hand.
2. Load bytes outside this package; `parseHmr1(bytes)` parses the complete file. Missing bytes
   produce `MISSING_FILE`; corrupt data produces typed `ReviewError`s. Parsed arrays own their
   memory, including when bytes came from a Node Buffer. Treat returned arrays/maps as read-only.
   Both header versions 1 and 2 use magic `HMR1` and the same body layout. Version 2 requires
   `evMissing: -32768` and `evSemantics: "counterfactual"`. `node.ev` preserves raw i16 values;
   consult action-major `node.evAvailable` (1/0, indexed like `strategy`) before scaling any EV.
   A v2 `-32768` is absent; a v2 `0` is a real stored zero. `evAvailabilitySource` identifies
   `explicit-sentinel` (v2) or `legacy-nonfold-zero-heuristic` (v1). For v1, all actions for a hand
   are marked absent when every non-Fold EV is zero. This conservative heuristic cannot distinguish
   missing EV from genuinely zero or rounded-to-zero EV; it does not consult quantized own reach.
3. `followFlopActions(file, actions)` selects prepared actions and returns `path`, the resulting
   state, and every `matches` record. Bet/Raise/AllIn amounts are the player's **street total** in
   chips, not the additional payment. `actual` and `used` remain in each size-match record.
   Midpoints choose the smaller size. Values outside the supported menu fail; they are not clamped.
   Once a size is approximated, later states describe the prepared line. Preserve the match records
   alongside that line when displaying or saving it.
4. `flopLine(file, path)` follows prepared action indices. `pot` includes all contributed chips,
   including the uncalled wager before a fold payout. `committed` and `stacks` are per player.
   A fold or all-in call is `terminal`; a non-all-in call or check/check is `chance`.
5. `rangeAt(file, path, player)` returns 1326 weights in the file's suit space. It multiplies only
   that player's choices using `q / sum(q)` per hand. A mathematically zero-reach branch can yield
   zero weights; no parsing/path failure is caught and replaced with a zero array.
6. `evaluateFlopDecision(file, path, canonicalHand, selected, trainerPolicy)` returns normalized
   frequencies, EV/loss in bb, thresholds and `best | good | bad`. `selected` is a prepared index
   or an actual action; the latter also returns its size-match record. The browser caller imports
   the four `BEST/GOOD_LOSS_RATIO/FLOOR_BB` exports from `trainer.ts` and supplies them as
   `trainerPolicy`. Their types are imported here, with no copied numeric defaults. A runtime
   import from trainer would initialize Vue/i18n and defeat this package's pure-Node contract.
   Converged targets in (0, 1]% are accepted, including R2's 0.3% corpus; exploitPct must
   not exceed the file's own targetPct. The old 1% corpus/API remains supported.
   Missing EV (`EV_MISSING`), no compatible opponent, unsupported accuracy, and possibly saturated
   EV fail distinctly. Zero hero reach alone does not block a decision with available EVs. Every
   action must have an EV, including unselected alternatives needed to find the best action.
   `EV_MISSING.details` includes `unavailableActions`, `source`, and `legacyZeroAmbiguity`;
   callers can still read strategy/frequency from the parsed node without producing a loss or grade.
   `evResolutionBb` records HMR1's EV quantization step; grades use the stored values. The existing
   thresholds and grading formula are unchanged; R1b does not implement the pending frequency rule.
7. `buildTurnInput(file, completedFlopPath, actualBoard)` returns canonical board/ranges, starting
   pot, effective stack and tree settings (targetExploitabilityPct follows the file's target).
   It removes all board-blocked hands on copies and rejects
   empty or mutually incompatible ranges. It does not start a solve.

For a five-card board, `buildTurnInput` also requires a `RiverContinuation`: the caller's solved
turn chance-node board, source flop path, reached ranges, pot and effective stack. Cards/ranges
must use the original flop permutation. The package checks matching provenance, conserved chips
and nonincreasing reach; it cannot recreate turn strategies absent from HMR1 or authenticate the
caller's turn solver output. Omitting this input fails with `MISSING_TURN_RESULT`.

HMR1 does not record rake, donk sizes or tree thresholds. Later-street requests are restricted to
the known `precompute2-2026-09-28` profile, also retained by precompute3; the omitted settings come from that producer's source.
A future producer with changed settings needs an explicit new profile or format version. HMR1
v1 also lacks flags for non-finite EV/strategy values replaced by zero by its writer; the consumer
cannot retrospectively distinguish those values from genuine zeros. Version 2 fixes EV absence
with an explicit sentinel, while strategy remains u8-quantized. For v2 the engine's explicit
availability is authoritative: no compatible unquantized opponent mass means a sentinel. The
reader does not override available v2 EVs when tiny opponent support rounds to zero in u8 reach.
The legacy v1 compatible-opponent check still uses quantized reach and can conservatively reject
such tiny support. Neither format can restore the original unquantized ranges from u8 strategy.

Verification entry point (project root): `node 도구/e2e/review-data-verify.js`.
Evidence and native source live under `참고자료/사전계산_도구_2026-09-28/reach-dump/`.
For R1b run `node 도구/e2e/review-data-verify.js --data-only`; this checks all 1,755 v1 files and
the public API without native solves or app/wasm builds, preserving the original R1 evidence.
`node 도구/e2e/review-v2-verify.js <BTN Ah7d2c.bin> <BTN Ad7c2c.bin> <BTN Ac7c2c.bin> <CO file.bin>`
checks generated v2 files and injected missing/zero/version/saturation cases. R1b evidence is under
`참고자료/사전계산_도구_2026-09-28/precompute3/verification/reader-*`.
