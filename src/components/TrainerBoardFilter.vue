<template>
  <!-- 보드 고르기 (설계안 §5): 축 4줄(줄 안 «또는» · 줄끼리 «그리고») + 특정 플랍 하나 · 바꿀 때마다 부모가 새 문제를 낸다 -->
  <div
    data-rtl-island="card-filter" dir="ltr" data-testid="trainer-board-panel"
    class="order-1 mt-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-3 text-xs md:text-sm"
  >
    <div class="mb-2 text-neutral-300">{{ B.boardRule }}</div>
    <div v-for="axis in axes" :key="axis" class="board-row" :data-testid="'trainer-board-' + axis">
      <span class="board-axis">{{ T[`group_${axis}`] }}</span>
      <div :class="axis === 'high' ? 'board-ranks' : 'flex flex-wrap gap-1'">
        <button
          v-for="key in keys[axis]"
          :key="key"
          type="button"
          :aria-pressed="picked(axis, key)"
          :aria-label="keyName(axis, key)"
          :class="
            'button-base board-chip ' +
            (picked(axis, key) ? 'button-blue' : 'bg-neutral-700 hover:bg-neutral-600')
          "
          @click="toggleKey(axis, key)"
        >
          {{ axis === "high" ? key : keyName(axis, key) }}
        </button>
      </div>
    </div>
    <div class="board-row" data-testid="trainer-board-specific">
      <span class="board-axis">{{ B.specificFlop }}</span>
      <div class="flex flex-wrap items-center gap-1.5">
        <template v-if="filter.board">
          <span v-for="c in filter.board" :key="c" class="board-card" :class="suitClass(c)">{{ card(c) }}</span>
        </template>
        <button
          type="button"
          data-testid="trainer-board-pick"
          :aria-expanded="picking"
          class="button-base board-chip bg-neutral-700 hover:bg-neutral-600"
          @click="togglePicker"
        >
          {{ picking ? S.closePicker : B.pickCards }}
        </button>
      </div>
    </div>
    <div v-if="picking" class="mt-2" data-testid="trainer-board-picker">
      <div class="mb-1.5 text-neutral-300">{{ format(S.pickPrompt, { count: String(pending.length) }) }}</div>
      <div class="board-deck">
        <template v-for="s in [3, 2, 1, 0]" :key="s"
          ><button
            v-for="r in RANKS"
            :key="r"
            type="button"
            :data-testid="'trainer-board-card-' + (r * 4 + s)"
            :aria-label="card(r * 4 + s)"
            :aria-pressed="pending.includes(r * 4 + s)"
            :class="suitClass(r * 4 + s)"
            @click="pickCard(r * 4 + s)"
          >
            {{ card(r * 4 + s) }}
          </button></template
        >
      </div>
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
      <span data-testid="trainer-board-count" :class="count ? 'text-neutral-300' : 'text-red-400'">
        {{ count ? format(T.flopCount, { count: count.toLocaleString(locale) }) : B.boardEmpty }}
      </span>
      <button v-if="active" type="button" class="link-like" data-testid="trainer-board-reset" @click="emit({})">
        {{ B.boardReset }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from "vue";
import { i18n } from "../i18n";
import { flopBoardLabels } from "../flop-trainer-labels";
import { flopReportLabels, FlopReportLabels } from "../flop-report-labels";
import { flopStudyLabels } from "../flop-study-labels";
import { GROUP_AXES, GROUP_KEYS, GroupAxis } from "../flop-report-model";
import { FlopBoardFilter, isBoardFilterActive } from "../flop-trainer";

const RANKS = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
const format = (text: string, values: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "");

export default defineComponent({
  props: {
    filter: { type: Object as PropType<FlopBoardFilter>, required: true },
    count: { type: Number, required: true },
  },
  emits: ["update"],
  setup(props, { emit: rawEmit }) {
    const B = computed(() => flopBoardLabels(i18n.locale));
    const T = computed(() => flopReportLabels(i18n.locale));
    const S = computed(() => flopStudyLabels(i18n.locale));
    const locale = computed(() => i18n.locale);
    const picking = ref(false);
    const pending = ref<number[]>([]);
    const active = computed(() => isBoardFilterActive(props.filter));
    const emit = (next: FlopBoardFilter) => rawEmit("update", next);

    const picked = (axis: GroupAxis, key: string) => !!props.filter[axis]?.includes(key);
    const keyName = (axis: GroupAxis, key: string) =>
      axis === "high"
        ? format(T.value.highKey, { rank: key })
        : T.value[`key_${key}` as keyof FlopReportLabels];
    // 축 칸을 누르면 특정 플랍은 푼다(특정 플랍이 있으면 축 조건을 보지 않으므로)
    const toggleKey = (axis: GroupAxis, key: string) => {
      const now = props.filter[axis] ?? [];
      const nextKeys = now.includes(key) ? now.filter((k) => k !== key) : [...now, key];
      const next: FlopBoardFilter = {};
      for (const a of GROUP_AXES) {
        const keys = a === axis ? nextKeys : props.filter[a];
        // 화면 순서로 저장해 칩 글자·기억 값이 누른 순서에 따라 달라지지 않게
        if (keys?.length) next[a] = GROUP_KEYS[a].filter((k) => keys.includes(k));
      }
      emit(next);
    };
    const togglePicker = () => {
      picking.value = !picking.value;
      pending.value = [];
    };
    const pickCard = (c: number) => {
      const i = pending.value.indexOf(c);
      if (i >= 0) {
        pending.value.splice(i, 1);
        return;
      }
      pending.value.push(c);
      if (pending.value.length === 3) {
        picking.value = false;
        emit({ board: [...pending.value].sort((a, b) => b - a) });
        pending.value = [];
      }
    };
    const card = (c: number) => "23456789TJQKA"[c >> 2] + "♣♦♥♠"[c & 3];
    const suitClass = (c: number) => ["clubs", "diamonds", "hearts", "spades"][c & 3];

    return {
      B,
      locale,
      T,
      S,
      axes: GROUP_AXES,
      keys: GROUP_KEYS,
      RANKS,
      picking,
      pending,
      active,
      emit,
      picked,
      keyName,
      toggleKey,
      togglePicker,
      pickCard,
      card,
      suitClass,
      format,
    };
  },
});
</script>

<style scoped>
.board-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 6px;
}
.board-axis {
  flex: none;
  width: 6.5rem;
  padding-top: 3px;
  color: rgb(var(--c-neutral-400));
}
.board-chip {
  @apply px-2 py-0.5 text-xs;
}
/* 랭크 13칸은 폰에서도 한 줄 */
.board-ranks {
  display: grid;
  grid-template-columns: repeat(13, minmax(0, 1fr));
  gap: 3px;
  width: 100%;
  max-width: 460px;
}
.board-ranks .board-chip {
  @apply px-0;
}
.board-card {
  background: #f0efec;
  border-radius: 4px;
  padding: 2px 5px;
  font-weight: 700;
  min-width: 26px;
  text-align: center;
}
.board-deck {
  display: grid;
  grid-template-columns: repeat(13, minmax(0, 1fr));
  gap: 3px;
  max-width: 640px;
}
.board-deck button {
  padding: 6px 0;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  background: rgb(var(--c-bg-2));
}
.board-deck button:hover {
  background: rgb(var(--c-bg-3));
}
.board-deck button[aria-pressed="true"] {
  background: rgb(var(--c-brand));
  color: #171717;
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
.board-card.spades {
  color: #18191c;
}
@media (max-width: 767px) {
  .board-row {
    flex-direction: column;
    gap: 3px;
  }
  .board-axis {
    width: auto;
    padding-top: 0;
  }
  .board-deck button {
    min-height: 32px;
  }
}
</style>
