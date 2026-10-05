<template>
  <div class="custom-trainer-entry min-w-0 shrink-0">
    <button
      type="button"
      data-testid="result-custom-train"
      class="button-base button-blue practice-button whitespace-normal text-left text-sm"
      :disabled="disabled || busy"
      :aria-busy="busy"
      @click="start"
    >{{ busy ? L.busy : L.entry }}</button>
    <p v-if="error" role="alert" class="mt-1 max-w-lg text-sm text-red-300">{{ error }}</p>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, ref } from "vue";
import type { PropType } from "vue";
import { createCustomTrainerBank, customTrainerState } from "../custom-trainer";
import type { CustomTrainerCapture } from "../custom-trainer";
import { saveCustomTrainerBank } from "../custom-trainer-db";
import { M } from "../custom-trainer-labels";
import { i18n } from "../i18n";
import { useStore } from "../store";

export default defineComponent({
  props: {
    capture: { type: Function as PropType<() => Promise<CustomTrainerCapture>>, required: true },
    disabled: { type: Boolean, default: false },
  },
  setup(props) {
    const L = computed(() => M[i18n.locale]);
    const busy = ref(false);
    const error = ref("");
    const store = useStore();
    const start = async () => {
      if (busy.value || props.disabled) return;
      busy.value = true;
      error.value = "";
      let saving = false;
      try {
        const bank = await createCustomTrainerBank(await props.capture());
        saving = true;
        await saveCustomTrainerBank(bank);
        // Results navigation can leave the old trainer mounted. Reload its
        // stored snapshot even when this capture replaces the same bank id.
        customTrainerState.active = false;
        await nextTick();
        customTrainerState.selectedBankId = bank.id;
        customTrainerState.active = true;
        store.navView = "solver";
        store.sideView = "trainer";
      } catch {
        error.value = saving ? L.value.saveError : L.value.captureError;
      } finally {
        busy.value = false;
      }
    };
    return { L, busy, error, start };
  },
});
</script>
