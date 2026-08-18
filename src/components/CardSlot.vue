<template>
  <!--
    에퀴티 계산기의 «카드가 들어갈 자리».
    채워지면 카드 한 장을 보여 주고(누르면 뺀다), 비어 있으면 점선 자리다.
    지금 채울 차례인 칸은 노란 테두리로 표시해 «다음에 고른 카드가 여기로 간다»를 알린다.
  -->
  <button
    :class="
      'relative w-8 h-11 md:w-9 md:h-12 shrink-0 rounded-lg border select-none ' +
      (card === undefined
        ? 'border-dashed ' + (active ? 'border-yellow-400 bg-neutral-800' : 'border-neutral-600')
        : 'bg-neutral-700 border-neutral-500 shadow')
    "
    :data-testid="'card-slot' + (card === undefined ? '-empty' : '')"
  >
    <template v-if="card !== undefined">
      <span :class="'absolute top-0 left-[15%] text-sm font-semibold ' + text.colorClass">
        {{ text.rank }}
      </span>
      <span :class="'absolute bottom-[5%] right-[10%] text-xs ' + text.colorClass">
        {{ text.suit }}
      </span>
    </template>
  </button>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { cardText } from "../utils";

export default defineComponent({
  props: {
    card: { type: Number, default: undefined },
    active: { type: Boolean, default: false },
  },

  setup(props) {
    const text = computed(() =>
      props.card === undefined
        ? { rank: "", suit: "", colorClass: "" }
        : cardText(props.card)
    );
    return { text };
  },
});
</script>
