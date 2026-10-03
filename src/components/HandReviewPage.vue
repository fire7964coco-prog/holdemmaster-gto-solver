<template>
  <section class="review-page" data-testid="review-page">
    <div class="review-toolbar">
      <span
        >{{ L.flop }} · {{ L.precomputed }} ·
        {{
          pct((file?.header.targetPct ?? HAND_REVIEW_ACCURACY.turn) / 100)
        }}</span
      >
      <div>
        <button data-testid="review-undo" :disabled="!canUndo" @click="undo">
          {{ L.undo }}</button
        ><button data-testid="review-new" @click="reset">
          {{ L.newHand }}
        </button>
      </div>
    </div>
    <div class="review-columns">
      <section
        class="review-panel review-scenario"
        data-testid="review-scenario"
      >
        <h2>{{ L.situation }}</h2>
        <p class="review-meta">
          {{ spot.opener }} → BB · {{ L.pot }} {{ bb(spot.startingPot) }}
        </p>
        <div class="review-settings">
          <h3>{{ L.opener }}</h3>
          <div class="review-options">
            <button
              v-for="item in spots"
              :key="item.id"
              :data-testid="'review-spot-' + item.id"
              :aria-pressed="spot.id === item.id"
              @click="chooseSpot(item.id)"
            >
              {{ item.opener }}
            </button>
          </div>
          <h3>{{ L.hero }}</h3>
          <div class="review-options">
            <button
              v-for="p in [0, 1]"
              :key="p"
              :data-testid="'review-hero-' + p"
              :aria-pressed="heroPlayer === p"
              @click="chooseHero(p)"
            >
              {{ p === 0 ? spot.oop : spot.ip }}
            </button>
          </div>
          <h3>{{ L.preflop }}</h3>
          <div class="review-options review-pots">
            <button
              v-for="item in potTypes"
              :key="item.id"
              :data-testid="'review-pot-' + item.id"
              :aria-pressed="potType === item.id"
              @click="choosePot(item.id)"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
        <details class="review-scope">
          <summary>{{ L.scopeTitle }}</summary>
          <p>{{ L.scopeNote }}</p>
        </details>
      </section>

      <section class="review-middle" data-testid="review-history">
        <div class="review-panel review-records">
          <div class="review-cards">
            <div class="review-cardline">
              <strong>{{ L.hand }}</strong
              ><span
                v-for="c in heroCards"
                :key="c"
                class="review-playing-card"
                :class="suitClass(c)"
                >{{ card(c) }}</span
              ><span v-if="heroCards.length < 2" class="review-muted">{{
                L.chooseHand
              }}</span>
            </div>
            <div class="review-cardline">
              <strong>{{ L[street] }}</strong
              ><span
                v-for="c in board"
                :key="c"
                class="review-playing-card"
                :class="suitClass(c)"
                >{{ card(c) }}</span
              ><span v-if="!board.length" class="review-muted">{{
                L.chooseFlop
              }}</span>
            </div>
          </div>
          <div class="review-record-list">
            <button
              v-for="(row, i) in records"
              :key="i"
              :data-testid="'review-record-' + i"
              :data-path="row.path.join('/')"
              :data-street="row.street"
              :data-player="row.player"
              :data-action="row.match.actionIndex"
              :data-grade="
                row.verdict?.referenceOnly
                  ? 'reference'
                  : row.verdict?.grade ?? ''
              "
              :data-loss="row.verdict?.lossBb ?? ''"
              :data-frequency="row.verdict?.frequency ?? ''"
              :data-node-prob="row.verdict?.nodeProb ?? ''"
              :data-reference="row.verdict?.referenceOnly ?? false"
              :data-approximated="row.match.approximated"
              :class="[
                'review-record',
                { selected: selected === i, own: row.player === heroPlayer },
              ]"
              @click="selected = i"
            >
              <span
                >{{ L[row.street] }} · {{ seat(row.player) }}
                {{ actionText(row.node.actions[row.match.actionIndex]) }}</span
              >
              <span
                v-if="row.verdict"
                :class="[
                  'review-grade',
                  row.verdict.referenceOnly ? 'reference' : row.verdict.grade,
                ]"
                >{{ verdictText(row.verdict)
                }}<template v-if="row.verdict.lossBb !== null">
                  · {{ loss(row.verdict.lossBb) }}</template
                ></span
              >
              <small v-if="row.match.approximated" class="review-match">{{
                format(L.matchedSize, {
                  actual: bb(row.match.actual!),
                  used: bb(row.match.used!),
                })
              }}</small>
            </button>
          </div>
        </div>

        <div class="review-panel review-picker" data-testid="review-picker">
          <div
            v-if="statusCode"
            class="review-status"
            role="status"
            data-testid="review-status"
            :data-code="statusCode"
          >
            {{ statusText
            }}<button
              v-if="retryable"
              data-testid="review-retry"
              @click="retry"
            >
              {{ L.retry }}
            </button>
          </div>
          <div v-if="loading" role="status">{{ L.loading }}</div>
          <div
            data-testid="review-solve-status"
            :data-state="
              solving
                ? 'solving'
                : solveResult
                ? 'done'
                : solveError
                ? 'error'
                : 'idle'
            "
            :data-threads="solveResult?.threads ?? 0"
          >
            <template v-if="solving"
              ><p>
                {{ L.solving }} · {{ L[street] }} ·
                {{
                  pct((progress?.targetPct ?? HAND_REVIEW_ACCURACY.turn) / 100)
                }}
              </p>
              <progress /><small
                >{{ progress?.iterations ?? 0
                }}<template
                  v-if="
                    progress?.achievedPct !== null &&
                    progress?.achievedPct !== undefined
                  "
                >
                  · {{ pct(progress.achievedPct / 100) }}</template
                ></small
              ><button @click="cancelSolve">{{ L.cancel }}</button></template
            >
          </div>
          <template v-if="canPickCards">
            <h2>{{ cardPrompt }}</h2>
            <div class="review-deck">
              <template v-for="s in [3, 2, 1, 0]" :key="s"
                ><button
                  v-for="r in ranks"
                  :key="r"
                  :data-testid="'review-card-' + (r * 4 + s)"
                  :aria-label="card(r * 4 + s)"
                  :disabled="usedCards.includes(r * 4 + s)"
                  :class="suitClass(r * 4 + s)"
                  @click="chooseCard(r * 4 + s)"
                >
                  {{ card(r * 4 + s) }}
                </button></template
              >
            </div>
          </template>
          <template
            v-else-if="
              currentNode?.kind === 'decision' &&
              !solving &&
              !loading &&
              !fatalStatus
            "
          >
            <h2>
              {{ seat(currentNode.player!) }} · {{ L.chooseAction }}
              <small>{{ L.pot }} {{ bb(currentNode.pot) }}</small>
            </h2>
            <div class="review-action-menu">
              <button
                v-for="(action, i) in currentNode.actions"
                :key="i"
                :data-testid="'review-action-' + i"
                @click="chooseAction(parseAction(action))"
              >
                {{ actionText(action) }}
              </button>
            </div>
            <div v-if="otherSizes.length" class="review-other">
              <span>{{ L.otherSize }}</span
              ><button
                v-for="s in otherSizes"
                :key="s.pct"
                :data-testid="'review-other-size-' + s.pct"
                @click="chooseAction(s.action)"
              >
                {{ pct(s.pct / 100) }} · {{ bb(s.action.amount!) }}
              </button>
            </div>
          </template>
          <p v-else-if="complete && !fatalStatus">{{ L.complete }}</p>
        </div>
      </section>

      <section class="review-panel review-results" data-testid="review-results">
        <div
          class="review-summary"
          data-testid="review-summary"
          :data-loss="totals.loss"
          :data-best="totals.best"
          :data-good="totals.good"
          :data-bad="totals.bad"
          :data-reference="totals.reference"
        >
          <h2>{{ L.result }}</h2>
          <div>
            <span>{{ L.totalLoss }}</span
            ><strong
              data-testid="review-total"
              :data-loss="totals.count ? totals.loss : null"
              >{{ totals.count ? loss(totals.loss) : "—" }}</strong
            >
          </div>
          <p v-if="totals.count" class="review-counts">
            <span>{{ L.best }} {{ totals.best }}</span
            ><span>{{ L.good }} {{ totals.good }}</span
            ><span>{{ L.mistake }} {{ totals.bad }}</span>
          </p>
          <p v-else class="review-muted">{{ records.some(row => row.verdict) ? (totals.reference ? L.referenceOnly : L.unanalysed) : L.noResults }}</p>
        </div>
        <div class="review-details" v-if="selectedRow?.verdict">
          <h3>
            {{ L[selectedRow.street] }} ·
            {{
              actionText(
                selectedRow.node.actions[selectedRow.match.actionIndex]
              )
            }}
          </h3>
          <p class="review-verdict">
            <strong
              :class="[
                'review-grade',
                selectedRow.verdict.referenceOnly
                  ? 'reference'
                  : selectedRow.verdict.grade,
              ]"
              >{{ verdictText(selectedRow.verdict) }}</strong
            ><span v-if="selectedRow.verdict.lossBb !== null">{{
              loss(selectedRow.verdict.lossBb)
            }}</span>
          </p>
          <p v-if="selectedRow.verdict.referenceOnly" class="review-note">
            {{
              format(L.referenceNote, { threshold: pct(REVIEW_REACH_FLOOR) })
            }}
          </p>
          <p
            v-else-if="
              selectedRow.verdict.mixedAction &&
              selectedRow.verdict.rawGrade === 'bad'
            "
            class="review-note"
          >
            {{ L.mixedAction }}
          </p>
          <p
            v-if="selectedRow.verdict.errorCode === 'EV_MISSING'"
            class="review-note"
            data-code="EV_MISSING"
          >
            {{ L.evMissingNote }}
          </p>
          <div
            class="review-frequency"
            v-for="(action, i) in selectedRow.node.actions"
            :key="i"
            :data-testid="'review-frequency-' + i"
            :data-frequency="selectedRow.verdict.frequencies[i] ?? ''"
          >
            <span>{{ actionText(action) }}</span>
            <div class="review-track">
              <i
                :style="{
                  width: 100 * (selectedRow.verdict.frequencies[i] ?? 0) + '%',
                  background: actionColor(action),
                }"
              />
            </div>
            <b>{{
              selectedRow.verdict.frequencies.length
                ? pct(selectedRow.verdict.frequencies[i])
                : "—"
            }}</b>
          </div>
          <div class="review-response" v-if="selectedRow.response">
            <h3>{{ L.opponentResponse }}</h3>
            <span
              v-for="(item, i) in selectedRow.response.actions"
              :key="item.action"
              :data-testid="'review-response-' + i"
              :data-frequency="item.frequency"
              >{{ actionText(item.action) }} {{ pct(item.frequency) }}
            </span>
            <details v-if="selectedRow.response.foldingHands.length">
              <summary>{{ L.foldingHands }}</summary>
              <div class="review-folding">
                <span
                  v-for="(item, i) in selectedRow.response.foldingHands"
                  :key="item.hand.join('-')"
                  :data-testid="'review-fold-hand-' + i"
                  :data-hand="item.hand.join(',')"
                  :data-frequency="item.frequency"
                  >{{ actualHand(item.hand) }} {{ pct(item.frequency) }}</span
                >
              </div>
            </details>
          </div>
          <details class="review-grid-details" open>
            <summary>{{ L.handGrid }}</summary>
            <div class="review-hand-grid" role="img" :aria-label="L.handGrid">
              <div
                v-for="cell in grid"
                :key="cell.key"
                :class="{ hero: cell.key === heroClass }"
                :style="{ background: gridBackground(cell.frequencies) }"
                :title="cell.key"
              >
                {{ cell.key }}
              </div>
            </div>
          </details>
          <p class="review-meta">
            {{ L.reach }} {{ pct(selectedRow.verdict.nodeProb) }} ·
            {{ selectedRow.street === "flop" ? L.precomputed : L.onDevice }}
          </p>
        </div>
        <p v-else class="review-empty">{{ L.chooseAction }}</p>
      </section>
    </div>
  </section>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onBeforeUnmount,
  ref,
  shallowRef,
} from "vue";
import { i18n, localizeNumber } from "../i18n";
import { M } from "../hand-review-labels";
import { SRP_SPOTS, SPOT_UNIT_SCALE } from "../preflop-spots";
import { HAND_REVIEW_DATA, loadReviewFlop } from "../hand-review-data";
import { Hmr1File, Hmr1Hand } from "../review/hmr1";
import {
  canonicalizeFlop,
  applyPerm,
  handIndex,
  SuitPermutation,
} from "../review/flop-canon";
import { ActualAction, ActionMatch, parseAction } from "../review/flop-line";
import { buildTurnInput } from "../review/turn-input";
import { ReviewError } from "../review/errors";
import {
  BEST_LOSS_RATIO,
  GOOD_LOSS_RATIO,
  BEST_LOSS_FLOOR_BB,
  GOOD_LOSS_FLOOR_BB,
} from "../trainer";
import {
  createHandReviewSolver,
  ReviewSolverSnapshot,
  ReviewSolveResult,
  ReviewSolveProgress,
  HAND_REVIEW_ACCURACY,
} from "../hand-review-solver";
import {
  flopNode,
  flopVerdict,
  flopReach,
  laterVerdict,
  matchAction,
  matchLaterAction,
  responseFor,
  gridFor,
  handClass,
  REVIEW_REACH_FLOOR,
  ReviewNode,
  ReviewVerdict,
} from "../hand-review-model";

type Street = "flop" | "turn" | "river";
type Row = {
  street: Street;
  path: number[];
  player: 0 | 1;
  match: ActionMatch;
  node: ReviewNode;
  verdict: ReviewVerdict | null;
  response: ReturnType<typeof responseFor>;
};
const policy = {
  BEST_LOSS_RATIO,
  GOOD_LOSS_RATIO,
  BEST_LOSS_FLOOR_BB,
  GOOD_LOSS_FLOOR_BB,
} as const;

export default defineComponent({
  setup() {
    const L = computed(() => M[i18n.locale]);
    const spots = SRP_SPOTS.filter((s) => s.caller === "BB");
    const spotId = ref("srp-btn-bb"),
      heroPlayer = ref<0 | 1>(1),
      potType = ref("srp");
    const spot = computed(() => spots.find((s) => s.id === spotId.value)!);
    const heroCards = ref<number[]>([]),
      board = ref<number[]>([]),
      records = shallowRef<Row[]>([]),
      selected = ref(-1);
    const file = shallowRef<Hmr1File | null>(null),
      currentNode = shallowRef<ReviewNode | null>(null);
    const path = ref<number[]>([]),
      flopPath = ref<number[]>([]),
      turnPath = ref<number[]>([]);
    const street = ref<Street>("flop"),
      loading = ref(false),
      solving = ref(false),
      solveError = ref(false),
      errorCode = ref("");
    const progress = shallowRef<ReviewSolveProgress | null>(null),
      solveResult = shallowRef<ReviewSolveResult | null>(null);
    let epoch = 0;
    const solvers: Partial<
      Record<Street, ReturnType<typeof createHandReviewSolver>>
    > = {};
    const solveResults: Partial<Record<Street, ReviewSolveResult>> = {};
    const mapping = computed(() =>
      board.value.length >= 3 ? canonicalizeFlop(board.value.slice(0, 3)) : null
    );
    const canonicalHero = computed(
      () =>
        heroCards.value.map((c) => applyPerm(c, mapping.value!.perm)) as [
          number,
          number,
        ]
    );
    const usedCards = computed(() => [...heroCards.value, ...board.value]);
    const statusCode = computed(() =>
      potType.value !== "srp"
        ? potType.value === "3bet"
          ? "THREE_BET"
          : "MULTIWAY"
        : !HAND_REVIEW_DATA.readyScenarios.includes(spotId.value)
        ? "SCENARIO_NOT_READY"
        : errorCode.value
    );
    const fatalStatus = computed(
      () =>
        !!statusCode.value &&
        !["UNSUPPORTED_ACTION", "SIZE_OUT_OF_RANGE", "INVALID_AMOUNT"].includes(
          statusCode.value
        )
    );
    const statusLabel = (code: string) =>
      code === "SCENARIO_NOT_READY"
        ? L.value.unavailableScenario
        : code === "THREE_BET"
        ? L.value.comingSoon
        : code === "MULTIWAY"
        ? L.value.notSupported
        : code === "MISSING_FILE"
        ? L.value.fileMissing
        : code === "EV_MISSING"
        ? L.value.evMissing
        : code === "HAND_NOT_IN_RANGE"
        ? L.value.heroOutsideRange
        : code === "NO_COMPATIBLE_HANDS"
        ? L.value.noCompatibleHands
        : code === "UNSUPPORTED_ACTION"
        ? L.value.unsupportedAction
        : code === "SIZE_OUT_OF_RANGE" || code === "INVALID_AMOUNT"
        ? L.value.unsupportedSize
        : code === "SOLVE_FAILED"
        ? L.value.solveFailed
        : code === "LOAD_FAILED"
        ? L.value.loadFailed
        : L.value.invalidData;
    const statusText = computed(() => statusLabel(statusCode.value));
    const complete = computed(
      () =>
        currentNode.value?.kind === "terminal" ||
        (street.value === "river" && currentNode.value?.kind === "chance")
    );
    const canPickCards = computed(
      () =>
        !fatalStatus.value &&
        !loading.value &&
        !solving.value &&
        (heroCards.value.length < 2 ||
          board.value.length < 3 ||
          (currentNode.value?.kind === "chance" && street.value !== "river"))
    );
    const cardPrompt = computed(() =>
      heroCards.value.length < 2
        ? L.value.chooseHand
        : board.value.length < 3
        ? L.value.chooseFlop
        : board.value.length === 3
        ? L.value.chooseTurn
        : L.value.chooseRiver
    );
    const retryable = computed(() =>
      ["MISSING_FILE", "LOAD_FAILED", "SOLVE_FAILED"].includes(statusCode.value)
    );
    const canUndo = computed(
      () =>
        !!(heroCards.value.length || board.value.length || records.value.length)
    );
    const selectedRow = computed(() => records.value[selected.value] ?? null);
    const grid = computed(() =>
      selectedRow.value ? gridFor(selectedRow.value.node) : []
    );
    const heroClass = computed(() =>
      heroCards.value.length === 2
        ? handClass(heroCards.value as [number, number])
        : ""
    );
    const totals = computed(() =>
      records.value.reduce(
        (s, r) => {
          const v = r.verdict;
          if (v?.referenceOnly) s.reference++;
          if (v?.grade && !v.referenceOnly && v.lossBb !== null) {
            s.count++;
            s.loss += v.lossBb;
            s[v.grade]++;
          }
          return s;
        },
        { count: 0, loss: 0, best: 0, good: 0, bad: 0, reference: 0 }
      )
    );
    const potTypes = computed(() => [
      { id: "srp", label: L.value.singleRaised },
      { id: "3bet", label: L.value.threeBet },
      { id: "multiway", label: L.value.multiway },
    ]);
    const bb = (chips: number) =>
      localizeNumber(
        `${(chips / SPOT_UNIT_SCALE).toFixed(2).replace(/\.?0+$/, "")}bb`
      );
    const pct = (fraction: number) =>
      localizeNumber(
        `${(fraction * 100).toFixed(
          Math.abs(fraction - 0.035) < 0.001 ||
            Math.abs(fraction - 0.05) < 0.001
            ? 3
            : 1
        )}%`
      );
    const loss = (value: number) => localizeNumber(`${value.toFixed(3)}bb`);
    const format = (template: string, values: Record<string, string>) =>
      template.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "");
    const card = (c: number) => "23456789TJQKA"[c >> 2] + "♣♦♥♠"[c & 3];
    const suitClass = (c: number) =>
      ["clubs", "diamonds", "hearts", "spades"][c & 3];
    const seat = (p: number) => (p === 0 ? spot.value.oop : spot.value.ip);
    const actionText = (raw: string) => {
      const a = parseAction(raw);
      const key = {
        Fold: "fold",
        Check: "check",
        Call: "call",
        Bet: "bet",
        Raise: "raise",
        AllIn: "allin",
      } as const;
      return (
        L.value[key[a.kind]] +
        (a.amount === undefined ? "" : " " + bb(a.amount))
      );
    };
    const actionColor = (raw: string) =>
      raw === "Fold"
        ? "#537fae"
        : raw === "Check" || raw === "Call"
        ? "#41966f"
        : raw.startsWith("AllIn")
        ? "#9c3d66"
        : "#b9535d";
    const verdictText = (v: ReviewVerdict) =>
      v.errorCode
        ? statusLabel(v.errorCode)
        : v.referenceOnly
        ? L.value.referenceOnly
        : v.grade === "best"
        ? L.value.best
        : v.grade === "good"
        ? L.value.good
        : L.value.mistake;
    const actualHand = (hand: Hmr1Hand) =>
      hand.map((c) => card(applyPerm(c, mapping.value!.inversePerm))).join(" ");
    const gridBackground = (frequencies: number[]) => {
      if (!frequencies.length) return "#24272a";
      let from = 0;
      return `linear-gradient(to right,${frequencies
        .map((f, i) => {
          const to = from + f * 100;
          const segment = `${actionColor(
            selectedRow.value!.node.actions[i]
          )} ${from}% ${to}%`;
          from = to;
          return segment;
        })
        .join(",")})`;
    };
    const otherSizes = computed(() => {
      const node = currentNode.value;
      if (
        !node ||
        node.player === null ||
        !node.actions.some((a) => /^(Bet|Raise|AllIn)/.test(a))
      )
        return [];
      const p = node.player,
        facing = node.committed[p ^ 1] - node.committed[p],
        kind = facing > 0 ? "Raise" : "Bet";
      return [25, 50, 100].map((size) => ({
        pct: size,
        action: {
          kind,
          amount:
            kind === "Bet"
              ? (node.pot * size) / 100
              : node.committed[p ^ 1] + ((node.pot + facing) * size) / 100,
        } as ActualAction,
      }));
    });

    function disposeStreet(s: Street) {
      solvers[s]?.dispose();
      delete solvers[s];
      delete solveResults[s];
    }
    function reset() {
      epoch++;
      for (const s of ["turn", "river"] as Street[]) disposeStreet(s);
      heroCards.value = [];
      board.value = [];
      records.value = [];
      selected.value = -1;
      file.value = null;
      currentNode.value = null;
      path.value = [];
      flopPath.value = [];
      turnPath.value = [];
      street.value = "flop";
      errorCode.value = "";
      loading.value = false;
      solving.value = false;
      solveError.value = false;
      solveResult.value = null;
      progress.value = null;
    }
    function chooseSpot(id: string) {
      reset();
      spotId.value = id;
    }
    function chooseHero(p: number) {
      reset();
      heroPlayer.value = p as 0 | 1;
    }
    function choosePot(id: string) {
      reset();
      potType.value = id;
    }
    async function loadFlop() {
      const token = ++epoch;
      loading.value = true;
      errorCode.value = "";
      try {
        const result = await loadReviewFlop(
          spot.value,
          mapping.value!.fileName
        );
        if (token !== epoch) return;
        file.value = result;
        currentNode.value = flopNode(result, []);
        path.value = [];
      } catch (error) {
        if (token === epoch)
          errorCode.value =
            error instanceof ReviewError ? error.code : "LOAD_FAILED";
      } finally {
        if (token === epoch) loading.value = false;
      }
    }
    async function chooseCard(c: number) {
      if (usedCards.value.includes(c) || !canPickCards.value) return;
      if (heroCards.value.length < 2) {
        heroCards.value.push(c);
        return;
      }
      board.value.push(c);
      if (board.value.length === 3) await loadFlop();
      else if (board.value.length > 3) await solveStreet();
    }
    function toNode(snapshot: ReviewSolverSnapshot): ReviewNode {
      return {
        kind: snapshot.kind,
        player: snapshot.player,
        actions: snapshot.actions,
        hands: snapshot.privateCards,
        strategy: snapshot.frequencies,
        evBb: snapshot.evBb,
        available: snapshot.evAvailable,
        pot: snapshot.pot,
        committed: snapshot.committed,
        stacks: snapshot.stacks,
        ranges: snapshot.privateCards.map((hands, p) =>
          Float64Array.from(
            hands,
            ([a, b]) => snapshot.reachedRanges[p][handIndex(a, b)]
          )
        ) as [Float64Array, Float64Array],
      };
    }
    function laterProbability(node: ReviewNode) {
      return [0, 1]
        .map(
          (p) =>
            Array.from(node.ranges[p]).reduce((s, v) => s + v, 0) /
            file.value!.players[p].weights.reduce((s, v) => s + v, 0)
        )
        .reduce((a, b) => a * b, 1);
    }
    async function solveStreet() {
      const token = ++epoch;
      const next: Street = board.value.length === 4 ? "turn" : "river";
      if (next === "turn") flopPath.value = path.value.slice();
      else turnPath.value = path.value.slice();
      street.value = next;
      path.value = [];
      errorCode.value = "";
      solving.value = true;
      solveError.value = false;
      solveResult.value = null;
      disposeStreet(next);
      const engine = createHandReviewSolver();
      solvers[next] = engine;
      try {
        const continuation =
          next === "river"
            ? await solvers.turn!.riverContinuation(
                turnPath.value,
                flopPath.value
              )
            : undefined;
        const input = buildTurnInput(
          file.value!,
          flopPath.value,
          board.value,
          continuation
        );
        const result = await engine.solve(input, {
          heroPlayer: heroPlayer.value,
          canonicalHero: canonicalHero.value,
          mobile: window.innerWidth < 768,
          onProgress: (p) => {
            if (token === epoch) progress.value = p;
          },
        });
        if (token !== epoch) return;
        const rootNode = toNode(await engine.snapshot([]));
        if (token !== epoch) return;
        solveResults[next] = result;
        solveResult.value = result;
        currentNode.value = rootNode;
      } catch (error) {
        if (token === epoch) {
          errorCode.value = "SOLVE_FAILED";
          solveError.value = true;
          solveResult.value = null;
          currentNode.value = null;
        }
      } finally {
        if (token === epoch) solving.value = false;
      }
    }
    async function chooseAction(actual: ActualAction) {
      const node = currentNode.value;
      if (!node || node.player === null || loading.value || solving.value)
        return;
      const token = epoch,
        oldPath = path.value.slice(),
        s = street.value;
      errorCode.value = "";
      try {
        const match =
          s === "flop"
            ? matchAction(file.value!, oldPath, actual)
            : matchLaterAction(node, actual);
        const verdict =
          node.player === heroPlayer.value
            ? s === "flop"
              ? flopVerdict(
                  file.value!,
                  oldPath,
                  canonicalHero.value,
                  match.actionIndex,
                  policy
                )
              : laterVerdict(
                  node,
                  canonicalHero.value,
                  match.actionIndex,
                  laterProbability(node),
                  SPOT_UNIT_SCALE,
                  policy
                )
            : null;
        const nextPath = [...oldPath, match.actionIndex];
        loading.value = true;
        const after =
          s === "flop"
            ? flopNode(file.value!, nextPath)
            : toNode(await solvers[s]!.snapshot(nextPath));
        if (token !== epoch) return;
        const row: Row = {
          street: s,
          path: oldPath,
          player: node.player,
          match,
          node,
          verdict,
          response:
            after.kind === "decision"
              ? responseFor(after, canonicalHero.value)
              : null,
        };
        records.value = [...records.value, row];
        if (verdict) selected.value = records.value.length - 1;
        path.value = nextPath;
        currentNode.value = after;
      } catch (error) {
        if (token === epoch) {
          const code = error instanceof ReviewError ? error.code : "SOLVE_FAILED";
          const inputError = ["UNSUPPORTED_ACTION", "SIZE_OUT_OF_RANGE", "INVALID_AMOUNT"].includes(code);
          errorCode.value = s === "flop" || inputError ? code : "SOLVE_FAILED";
          if (errorCode.value === "SOLVE_FAILED") { solveError.value = true; solveResult.value = null; }
        }
      } finally {
        if (token === epoch) loading.value = false;
      }
    }
    async function undo() {
      epoch++;
      errorCode.value = "";
      loading.value = false;
      solving.value = false;
      solveError.value = false;
      const last = records.value[records.value.length - 1];
      if (street.value !== "flop" && (!last || last.street !== street.value)) {
        const old = street.value;
        disposeStreet(old);
        board.value.pop();
        street.value = old === "river" ? "turn" : "flop";
        path.value = (old === "river" ? turnPath : flopPath).value.slice();
        currentNode.value =
          street.value === "flop"
            ? flopNode(file.value!, path.value)
            : toNode(await solvers.turn!.snapshot(path.value));
        solveResult.value = solveResults[street.value] ?? null;
        return;
      }
      if (last) {
        records.value = records.value.slice(0, -1);
        street.value = last.street;
        path.value = last.path.slice();
        currentNode.value = last.node;
        selected.value = records.value
          .map((r) => !!r.verdict)
          .lastIndexOf(true);
        return;
      }
      file.value = null;
      currentNode.value = null;
      path.value = [];
      if (board.value.length) board.value.pop();
      else heroCards.value.pop();
    }
    function cancelSolve() {
      void undo();
    }
    async function retry() {
      if (board.value.length === 3) await loadFlop();
      else {
        // A new solve starts this street at its root. Keep earlier streets only,
        // so retrying after a worker failure cannot count old decisions twice.
        records.value = records.value.filter(row => row.street === "flop" || street.value === "river" && row.street === "turn");
        selected.value = records.value.map(row => !!row.verdict).lastIndexOf(true);
        path.value = (
          street.value === "turn" ? flopPath : turnPath
        ).value.slice();
        await solveStreet();
      }
    }
    const snapshot = () => ({
      street: street.value,
      path: path.value.slice(),
      heroPlayer: heroPlayer.value,
      heroCards: heroCards.value.slice(),
      board: board.value.slice(),
      records: records.value.map((r) => ({
        street: r.street,
        path: r.path,
        player: r.player,
        match: r.match,
        verdict: r.verdict,
      })),
      loading: loading.value,
      solving: solving.value,
      errorCode: statusCode.value,
      workerThreads: solveResult.value?.threads ?? 0,
      solveResult: solveResult.value,
      actions: currentNode.value?.actions ?? [],
    });
    const exposed = { snapshot };
    (window as Window & { __review?: typeof exposed }).__review = exposed;
    onBeforeUnmount(() => {
      epoch++;
      disposeStreet("turn");
      disposeStreet("river");
      delete (window as Window & { __review?: typeof exposed }).__review;
    });
    return {
      L,
      spots,
      spot,
      file,
      heroPlayer,
      potType,
      heroCards,
      board,
      records,
      selected,
      street,
      loading,
      solving,
      solveError,
      solveResult,
      progress,
      currentNode,
      statusCode,
      statusText,
      fatalStatus,
      retryable,
      canUndo,
      canPickCards,
      cardPrompt,
      complete,
      selectedRow,
      grid,
      heroClass,
      totals,
      potTypes,
      usedCards,
      ranks: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
      otherSizes,
      REVIEW_REACH_FLOOR,
      HAND_REVIEW_ACCURACY,
      bb,
      pct,
      loss,
      format,
      card,
      suitClass,
      seat,
      actionText,
      actionColor,
      verdictText,
      actualHand,
      gridBackground,
      parseAction,
      reset,
      chooseSpot,
      chooseHero,
      choosePot,
      chooseCard,
      chooseAction,
      undo,
      retry,
      cancelSolve,
    };
  },
});
</script>

<style scoped>
.review-cards {
  display: contents;
}
.review-page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  color: rgb(var(--c-text-primary));
}
.review-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: rgb(var(--c-text-muted));
  font-size: 11px;
  flex: none;
}
.review-toolbar > div {
  display: flex;
  gap: 5px;
}
button {
  border: 1px solid rgb(var(--c-line));
  border-radius: 6px;
  padding: 7px 9px;
  background: rgb(var(--c-bg-2));
  line-height: 1.3;
  transition: background 0.15s;
}
button:hover {
  background: rgb(var(--c-bg-3));
}
button:focus-visible,
summary:focus-visible {
  outline: 2px solid rgb(var(--c-brand));
  outline-offset: 2px;
}
button:disabled {
  opacity: 0.3;
  cursor: default;
}
button[aria-pressed="true"] {
  background: rgb(var(--c-brand));
  border-color: rgb(var(--c-brand));
  color: #171717;
  font-weight: 700;
}
.review-columns {
  display: grid;
  grid-template-columns: minmax(150px, 0.72fr) minmax(280px, 1.4fr) minmax(
      270px,
      1.35fr
    );
  gap: 10px;
  min-height: 0;
  flex: 1;
}
.review-panel {
  background: rgb(var(--c-bg-1));
  border: 1px solid rgb(var(--c-line));
  border-radius: 9px;
  padding: 12px;
  min-width: 0;
  min-height: 0;
}
h2 {
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 9px;
}
h3 {
  font-weight: 600;
  margin: 10px 0 6px;
  font-size: 12px;
}
p {
  margin: 0;
}
.review-meta,
.review-muted {
  color: rgb(var(--c-text-muted));
  font-size: 10px;
  line-height: 1.5;
}
.review-options {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.review-options button {
  padding: 7px 8px;
}
.review-pots {
  flex-direction: column;
}
.review-scenario {
  overflow: auto;
}
.review-scope {
  color: rgb(var(--c-text-muted));
  font-size: 10px;
  line-height: 1.65;
  margin-top: 18px;
}
.review-middle {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: 10px;
}
.review-records {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
.review-cardline {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  padding-bottom: 9px;
  border-bottom: 1px solid rgb(var(--c-line));
  margin-bottom: 9px;
  flex: none;
}
.review-cardline strong {
  font-size: 11px;
  margin-right: 3px;
}
.review-playing-card {
  background: #f0efec;
  border-radius: 4px;
  padding: 6px 5px;
  font-size: 16px;
  font-weight: 700;
  min-width: 29px;
  text-align: center;
}
.clubs {
  color: #287c59;
}
.diamonds {
  color: #4a89d5;
}
.hearts {
  color: #df6266;
}
.spades {
  color: #b9c1cd;
}
.review-playing-card.spades {
  color: #18191c;
}
.review-record-list {
  overflow: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.review-record {
  font-size: 11px;
  text-align: left;
  padding: 7px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
}
.review-record.own {
  border-left: 3px solid rgb(var(--c-brand));
}
.review-record.selected {
  background: rgb(var(--c-bg-3));
  outline: 1px solid rgb(var(--c-brand));
}
.review-match {
  width: 100%;
  color: rgb(var(--c-brand));
  font-size: 10px;
}
.review-grade {
  font-size: 11px;
  color: rgb(var(--c-text-muted));
}
.review-grade.best {
  color: #6ac292;
}
.review-grade.good {
  color: #8bc2b3;
}
.review-grade.bad {
  color: #f47d83;
}
.review-note {
  font-size: 10px;
  line-height: 1.5;
  color: rgb(var(--c-text-muted));
  margin: 5px 0;
}
.review-picker {
  flex: none;
}
.review-picker h2 {
  margin-bottom: 8px;
}
.review-picker h2 small {
  font-size: 10px;
  font-weight: 400;
  float: right;
}
.review-deck {
  display: grid;
  grid-template-columns: repeat(13, minmax(0, 1fr));
  gap: 3px;
}
.review-deck button {
  padding: 7px 0;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}
.review-action-menu {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.review-action-menu button {
  flex: 1;
  min-width: 68px;
  font-weight: 600;
  min-height: 38px;
}
.review-other {
  margin-top: 8px;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  align-items: center;
  font-size: 10px;
}
.review-other button {
  padding: 5px;
  font-size: 10px;
}
.review-status {
  color: rgb(var(--c-brand));
  line-height: 1.5;
  padding: 4px 0 9px;
}
.review-status button {
  margin-left: 8px;
}
.review-picker progress {
  width: 100%;
  height: 6px;
  accent-color: rgb(var(--c-brand));
}
.review-results {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.review-summary {
  padding-bottom: 10px;
  border-bottom: 1px solid rgb(var(--c-line));
  flex: none;
}
.review-summary > div {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  align-items: baseline;
}
.review-summary strong {
  font-size: 23px;
  font-variant-numeric: tabular-nums;
}
.review-counts {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  margin-top: 6px;
  font-size: 10px;
}
.review-counts span {
  background: rgb(var(--c-bg-3));
  padding: 3px 6px;
  border-radius: 12px;
}
.review-details {
  overflow: auto;
  min-height: 0;
}
.review-verdict {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 7px;
}
.review-frequency {
  display: grid;
  grid-template-columns: minmax(62px, auto) minmax(20px, 1fr) 45px;
  gap: 6px;
  align-items: center;
  font-size: 10px;
  margin: 6px 0;
}
.review-frequency b {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
.review-track {
  height: 6px;
  border-radius: 5px;
  background: rgb(var(--c-bg-3));
  overflow: hidden;
}
.review-track i {
  display: block;
  height: 100%;
  border-radius: 5px;
}
.review-response {
  border-top: 1px solid rgb(var(--c-line));
  margin-top: 10px;
  font-size: 10px;
  line-height: 1.7;
}
.review-response > span {
  display: inline-block;
  margin-right: 6px;
}
.review-folding {
  max-height: 92px;
  overflow: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 3px 9px;
}
.review-grid-details {
  margin-top: 8px;
}
.review-grid-details summary {
  font-size: 10px;
  color: rgb(var(--c-text-secondary));
  margin-bottom: 6px;
  cursor: pointer;
}
.review-hand-grid {
  display: grid;
  grid-template-columns: repeat(13, minmax(0, 1fr));
  gap: 1px;
  aspect-ratio: 1.75;
}
.review-hand-grid > div {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  color: #f3f3f3;
  min-width: 0;
}
.review-hand-grid > div.hero {
  outline: 2px solid rgb(var(--c-brand));
  outline-offset: -2px;
  font-weight: 700;
}
.review-empty {
  color: rgb(var(--c-text-muted));
  margin: auto;
  text-align: center;
  padding: 20px;
}
@media (max-width: 1100px) and (min-width: 768px) {
  .review-columns {
    grid-template-columns: minmax(128px, 0.6fr) minmax(220px, 1fr) minmax(
        225px,
        1.1fr
      );
  }
  .review-panel {
    padding: 9px;
  }
  .review-deck button {
    font-size: 9px;
  }
  .review-hand-grid > div {
    font-size: 7px;
  }
}
@media (max-width: 767px) {
  .review-page {
    gap: 5px;
    font-size: 11px;
  }
  .review-toolbar {
    font-size: 9px;
  }
  .review-toolbar button {
    padding: 5px 8px;
    min-height: 30px;
  }
  .review-columns {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr) auto;
    gap: 6px;
    position: relative;
  }
  .review-panel {
    padding: 8px;
  }
  .review-scenario {
    grid-row: 1;
    overflow: visible;
  }
  .review-scenario h2,
  .review-scenario > .review-meta,
  .review-scope {
    display: none;
  }
  .review-settings {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px 8px;
  }
  .review-settings h3 {
    font-size: 10px;
    margin: 0;
  }
  .review-options {
    gap: 3px;
  }
  .review-options button {
    font-size: 10px;
    padding: 5px;
    min-height: 28px;
  }
  .review-pots {
    flex-direction: row;
  }
  .review-middle {
    display: contents;
  }
  .review-results {
    grid-row: 2;
    min-height: 0;
    padding: 8px;
  }
  .review-summary {
    padding-bottom: 5px;
  }
  .review-summary h2 {
    display: none;
  }
  .review-summary strong {
    font-size: 20px;
  }
  .review-counts {
    margin-top: 3px;
  }
  .review-details {
    padding-bottom: 4px;
  }
  .review-details h3 {
    margin: 6px 0 4px;
  }
  .review-frequency {
    margin: 4px 0;
    font-size: 10px;
  }
  .review-note {
    margin: 2px 0;
  }
  .review-response {
    margin-top: 5px;
  }
  .review-grid-details {
    margin-top: 5px;
  }
  .review-hand-grid {
    max-width: 275px;
    margin: auto;
    aspect-ratio: 1.5;
  }
  .review-hand-grid > div {
    font-size: 8px;
  }
  .review-records {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 188px;
    height: 69px;
    border-bottom: 0;
    border-radius: 8px 8px 0 0;
    z-index: 2;
    background: rgb(var(--c-bg-1));
    padding: 5px 8px;
  }
  .review-cardline {
    display: inline-flex;
    flex-wrap: nowrap;
    border: 0;
    padding: 0;
    margin: 0 5px 3px 0;
    gap: 3px;
  }
  .review-playing-card {
    padding: 2px 4px;
    min-width: 0;
    font-size: 12px;
  }
  .review-cardline strong,
  .review-cardline .review-muted {
    font-size: 9px;
  }
  .review-record-list {
    flex-direction: row;
    overflow-x: auto;
    flex: 1;
    gap: 4px;
  }
  .review-record {
    flex: none;
    max-width: 260px;
    font-size: 9px;
    padding: 3px 5px;
    gap: 2px 5px;
  }
  .review-record .review-grade,
  .review-match {
    font-size: 9px;
  }
  .review-picker {
    grid-row: 3;
    position: sticky;
    bottom: 0;
    z-index: 3;
    height: 188px;
    overflow: auto;
    border-radius: 0 0 8px 8px;
    flex: none;
  }
  .review-results {
    margin-bottom: 69px;
  }
  .review-deck {
    gap: 3px;
  }
  .review-deck button {
    padding: 6px 0;
    font-size: 12px;
    min-height: 29px;
  }
  .review-picker h2 {
    font-size: 11px;
    margin-bottom: 5px;
  }
  .review-action-menu button {
    min-height: 38px;
  }
  .review-other {
    margin-top: 6px;
  }
  .review-status {
    font-size: 11px;
  }
  .review-empty {
    padding: 8px;
  }
  .review-folding {
    max-height: 60px;
  }
}
@media (max-width: 767px) {
  .review-scope {
    display: block;
    margin-top: 4px;
    font-size: 9px;
    line-height: 1.4;
  }
  .review-scope p {
    padding-top: 4px;
  }
  .review-cards {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    flex: none;
  }
  .review-records {
    height: 82px;
  }
  .review-results {
    margin-bottom: 82px;
  }
  .review-record-list {
    min-height: 37px;
  }
}
</style>
