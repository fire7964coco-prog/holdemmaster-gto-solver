<template>
  <button
    :class="
      'relative rounded-lg border select-none enabled:shadow ' +
      (isSelected
        ? 'bg-neutral-700 ring-2 ring-yellow-400 border-yellow-400'
        : 'bg-neutral-800 border-neutral-600 hover:bg-neutral-700')
    "
    :style="{
      '--width': width,
      '--font-size': fontSize,
      width: 'var(--width)',
      'padding-top': 'calc(var(--width) * ' + ratio + ' - 2px)',
    }"
  >
    <span
      :class="'absolute top-0 font-semibold ' + colorClass"
      :style="{
        left: '15%',
        'font-size': 'calc(var(--font-size) * 1.25)',
      }"
    >
      {{ rank }}
    </span>
    <span
      :class="'absolute ' + colorClass"
      :style="{
        bottom: '5%',
        right: '10%',
        'font-size': 'var(--font-size)',
      }"
    >
      {{ suit }}
    </span>
  </button>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { cardText } from "../utils";

export default defineComponent({
  props: {
    cardId: {
      type: Number,
      required: true,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
    width: {
      type: String,
      default: "40px",
    },
    fontSize: {
      type: String,
      default: "1rem",
    },
    // 세로 비율. 모바일은 폭이 좁아 카드가 작아지므로 조금 길게 뽑아
    // 손가락이 닿을 높이를 만든다
    ratio: {
      type: Number,
      default: 1.4,
    },
  },

  setup(props) {
    const { rank, suit, colorClass } = cardText(props.cardId);
    return { rank, suit, colorClass };
  },
});
</script>
