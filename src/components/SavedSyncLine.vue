<template>
  <!-- 저장 목록 아래 한 줄 — 로그인 권유 / 동기화 상태 (설계 참고자료/계정동기화_설계안_2026-10-11.md §3) -->
  <div
    v-if="enabled && (user || hasItems || nudged)"
    class="saved-sync-line text-xs text-neutral-400 leading-relaxed"
    data-testid="saved-sync-line"
    :data-store="storeName"
    :data-state="user ? status.state : full ? 'full' : 'signed-out'"
  >
    <template v-if="!user">
      <!-- 회원 전용 ①: 비회원 저장이 다 찼을 때만 개수 안내(9개까지는 기존 권유 그대로 · 사장님 10-12) ·
           찬 상태에서 [저장]·가져오기를 누르면 팝업 없이 이 줄을 강조한다 -->
      <span
        :class="{ 'saved-sync-nudged': nudged }"
        :data-testid="nudged ? 'saved-sync-nudged' : undefined"
        >{{ nudged === "import" ? M.importOver : full ? M.saveFull : L.invite }}</span
      >
      <span class="inline-flex gap-2 ms-1 align-middle">
        <button
          class="saved-sync-button"
          data-testid="saved-sync-google"
          :disabled="busy"
          @click="start('google')"
        >
          <ProviderIcon provider="google" />{{ L.google }}
        </button>
        <button
          v-if="isKo"
          class="saved-sync-button"
          data-testid="saved-sync-kakao"
          :disabled="busy"
          @click="start('kakao')"
        >
          <ProviderIcon provider="kakao" />{{ L.kakao }}
        </button>
        <button
          class="saved-sync-button"
          data-testid="saved-sync-telegram"
          :disabled="busy"
          @click="start('custom:telegram')"
        >
          <ProviderIcon provider="custom:telegram" />{{ L.telegram }}
        </button>
      </span>
    </template>
    <!-- idle(첫 동기화 전)도 «맞추는 중» — 확인 안 된 «보관 중»은 띄우지 않는다 (MA-433)
         첫 동기화가 limit·pending으로 끝나면 그 문구가 보여야 하므로 idle일 때만 (MA-438) -->
    <template v-else-if="status.state === 'syncing' || (status.state === 'idle' && !status.lastSync)">{{ L.syncing }}</template>
    <template v-else-if="status.state === 'limit'">{{ L.limit }}</template>
    <template v-else-if="status.state === 'pending'">{{ L.pending }}</template>
    <template v-else>{{ L.ok.replace("{time}", time(status.lastSync)) }}</template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, onMounted, PropType, ref, watch } from "vue";
import { i18n } from "../i18n";
import {
  AccountUser,
  getCurrentUser,
  hasStoredSession,
  isClientLoaded,
  onAuthChange,
  setLoginReturnView,
  signIn,
  type LoginProvider,
} from "../account";
import { useStore } from "../store";
import { claimLocalData, type SavedStore } from "../db";
import {
  onSavedReplaced,
  requestSavedSync,
  savedSyncEnabled,
  savedSyncStatus,
  syncSavedStore,
} from "../saved-sync-run";
import { savedSyncLabels } from "../saved-sync-labels";
import { memberLabels, memberLimitsEnabled, SAVE_LIMIT } from "../member-limits";

import ProviderIcon from "./ProviderIcon.vue";

export default defineComponent({
  components: { ProviderIcon },
  props: {
    storeName: { type: String as PropType<SavedStore>, required: true },
    /** 저장 목록에 항목이 하나라도 있는가 — 없으면 권유 줄을 띄우지 않는다 */
    hasItems: { type: Boolean, required: true },
    /** 저장 목록이 이 기기에서 바뀔 때마다 1씩 오른다 → 계정에 반영 */
    revision: { type: Number, required: true },
    /** 저장된 항목 수(폴더 제외) — 비회원 저장 한도 판단용 */
    itemCount: { type: Number, default: 0 },
    /** 한도가 찬 상태에서 저장·가져오기를 누를 때마다 1씩 오른다 → 이 줄을 강조 */
    nudge: { type: Number, default: 0 },
    nudgeKind: { type: String as PropType<"save" | "import">, default: "save" },
  },
  // room: 비회원 한도가 걸릴 때 더 저장할 수 있는 수 · 한도가 없으면(로그인·스위치 꺼짐·확인 전) null
  emits: ["replaced", "room"],
  setup(props, { emit }) {
    const store = useStore();
    const enabled = savedSyncEnabled();
    const L = computed(() => savedSyncLabels(i18n.locale));
    const M = computed(() => memberLabels(i18n.locale));
    const isKo = computed(() => i18n.locale === "ko");
    const user = ref<AccountUser | null>(null);
    const busy = ref(false);
    const status = computed(() => savedSyncStatus[props.storeName]);
    // 로그인 여부를 확인하기 전에는 제한하지 않는다(로그인한 사람이 잠깐이라도 막히지 않게)
    const authResolved = ref(false);
    const capped = computed(
      () => enabled && memberLimitsEnabled() && authResolved.value && !user.value
    );
    const full = computed(() => capped.value && props.itemCount >= SAVE_LIMIT);
    watch(
      () => (capped.value ? SAVE_LIMIT - props.itemCount : null),
      (room) => emit("room", room),
      { immediate: true }
    );
    const nudged = ref<"" | "save" | "import">("");
    watch(
      () => props.nudge,
      () => {
        if (capped.value) nudged.value = props.nudgeKind;
      }
    );
    // 목록이 바뀌거나 로그인하면 강조를 거둔다
    watch([() => props.itemCount, user], () => (nudged.value = ""));

    let stopAuth: (() => void) | null = null;
    let stopReplaced: (() => void) | null = null;
    onMounted(async () => {
      if (!enabled) return;
      stopReplaced = onSavedReplaced((s) => {
        if (s === props.storeName) emit("replaced");
      });
      // 로그인한 흔적이 없으면 supabase-js(214KB)를 내려받지 않는다 — 권유 줄만 보인다 (account.ts 원칙)
      if (!hasStoredSession() && !isClientLoaded()) {
        authResolved.value = true;
        return;
      }
      try {
        user.value = await getCurrentUser();
      } finally {
        // 로그인 흔적이 있는데 세션을 못 받았으면(오프라인에서 토큰 만료 등) 회원일 가능성이 높다 → 이 화면에선 제한하지 않는다
        authResolved.value = !!user.value || !hasStoredSession();
      }
      stopAuth = onAuthChange((u) => {
        // 본체에서 다른 계정으로 바뀌었으면 동기화를 기다리지 않고 바로 그 계정의 기기 DB로 새로 연다(MB-388 ①)
        // 로그아웃을 거쳐 온 경우도 — 마지막 계정과 다를 수 있다(5차 F4 잔여)
        if (u && (!user.value || user.value.id !== u.id)) void claimLocalData(u.id).catch(() => undefined);
        const signedIn = !user.value && u;
        user.value = u;
        if (signedIn) void syncSavedStore(props.storeName);
      });
      if (user.value) void syncSavedStore(props.storeName);
    });
    onBeforeUnmount(() => {
      stopAuth?.();
      stopReplaced?.();
    });
    watch(
      () => props.revision,
      () => {
        if (user.value) requestSavedSync(props.storeName);
      }
    );

    const start = async (provider: LoginProvider) => {
      busy.value = true;
      try {
        // 로그인에서 돌아오면 이 화면(레인지·트리 설정)으로 — 트레이너로 가지 않게
        setLoginReturnView(store.sideView);
        await signIn(provider);
      } catch {
        busy.value = false;
      }
    };
    const time = (t: number) =>
      i18n.locale === "ar"
        ? new Date(t).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
        : i18n.locale === "th"
        ? new Date(t).toLocaleTimeString("th-TH-u-ca-gregory-nu-latn", { hour: "2-digit", minute: "2-digit", hour12: false })
        : i18n.locale === "pl"
        ? new Date(t).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", hour12: false })
        : i18n.locale === "it"
        ? new Date(t).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", hour12: false })
        : new Date(t).toLocaleTimeString(i18n.locale === "zh-hant" ? "zh-Hant" : i18n.locale, {
        hour: "2-digit",
        minute: "2-digit",
      });

    return { enabled, L, M, isKo, user, busy, status, start, time, full, nudged };
  },
});
</script>

<style scoped>
.saved-sync-line {
  padding: 2px 2px 0;
}
.saved-sync-nudged {
  color: rgb(252 211 77);
  font-weight: 600;
}
.saved-sync-button {
  padding: 1px 8px;
  border: 1px solid rgb(var(--c-line));
  border-radius: 5px;
  background: rgb(var(--c-bg-2));
  color: rgb(var(--c-text, 229 229 229));
  font-weight: 600;
}
.saved-sync-button:hover {
  background: rgb(var(--c-bg-3));
}
</style>
