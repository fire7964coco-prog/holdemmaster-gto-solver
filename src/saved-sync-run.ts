// 저장 목록(레인지·벳 설정) 계정 동기화 — 실행부 (설계 참고자료/계정동기화_설계안_2026-10-11.md §3·§4).
// 합치기 규칙은 saved-sync.ts(순수 함수). 여기는 기기 DB·Supabase를 잇는다.
// 표 = 본체 운영 DB `solver_saved_items`(MB-244 · 열 이름 = S-067 원안 · 본인 RLS ·
// 상한 «살아 있는 행 1,000 + 전체 3,000» → 오류 문구 `solver_saved_items limit reached`).
// 트레이너 빌드 전용 — npokers 빌드에는 @features 이음새로 들어가지 않는다.
import { reactive } from "vue";
import { getCurrentUser, getSupabase, isAccountEnabled } from "./account";
import {
  DbGroup,
  DbItem,
  getSavedState,
  replaceSavedState,
  SavedStore,
  SavedTombstone,
} from "./db";
import { mergeSaved, SyncRow } from "./saved-sync";

/** 출시 스위치 — 켜기 전에 본체에 MB로 알린다(본체 /solver FAQ 15언어 · MB-244). */
export const SAVED_SYNC_LAUNCHED = false;
/** localhost 검사용: localStorage `solver.savedSync.test` = "1"이면 스위치가 꺼져 있어도 켠다. */
const TEST_KEY = "solver.savedSync.test";

export const savedSyncEnabled = () => {
  if (!isAccountEnabled) return false;
  if (SAVED_SYNC_LAUNCHED) return true;
  try {
    return (
      ["localhost", "127.0.0.1"].includes(location.hostname) &&
      localStorage.getItem(TEST_KEY) === "1"
    );
  } catch {
    return false;
  }
};

const TABLE = "solver_saved_items";
const KIND: Record<SavedStore, "range" | "config"> = {
  ranges: "range",
  configurations: "config",
};
/** 90일 넘은 지운 표시는 기기·계정에서 실제로 지운다 (S-068). */
export const TOMBSTONE_KEEP_MS = 90 * 24 * 60 * 60 * 1000;
const CHUNK = 200;

export type SavedSyncState = "idle" | "syncing" | "ok" | "pending" | "limit";
export const savedSyncStatus = reactive<
  Record<SavedStore, { state: SavedSyncState; lastSync: number | null }>
>({
  ranges: { state: "idle", lastSync: null },
  configurations: { state: "idle", lastSync: null },
});

type RemoteRow = {
  client_id: string;
  name0: string;
  name1: string;
  name2: string;
  name3: string;
  is_group: boolean;
  value: unknown;
  updated_at: string;
  deleted_at: string | null;
};

const fromLocal = (row: DbItem | DbGroup): SyncRow => ({
  clientId: row.clientId!,
  names: [row.name0, row.name1, row.name2, row.name3],
  isGroup: row.isGroup,
  value: row.isGroup ? null : row.value,
  updatedAt: row.updatedAt ?? 0,
  deletedAt: null,
});
const fromTombstone = (t: SavedTombstone): SyncRow => ({
  clientId: t.clientId,
  names: ["", "", "", ""],
  isGroup: 0,
  value: null,
  updatedAt: 0,
  deletedAt: t.deletedAt,
});
const fromRemote = (r: RemoteRow): SyncRow => ({
  clientId: r.client_id,
  names: [r.name0 ?? "", r.name1 ?? "", r.name2 ?? "", r.name3 ?? ""],
  isGroup: r.is_group ? 1 : 0,
  value: r.is_group ? null : r.value,
  updatedAt: Date.parse(r.updated_at),
  deletedAt: r.deleted_at ? Date.parse(r.deleted_at) : null,
});
const toLocal = (r: SyncRow): DbItem | DbGroup => {
  const base = {
    name0: r.names[0],
    name1: r.names[1],
    name2: r.names[2],
    name3: r.names[3],
    clientId: r.clientId,
    updatedAt: r.updatedAt,
  };
  return r.isGroup ? { ...base, isGroup: 1 } : { ...base, isGroup: 0, value: r.value };
};
const toRemote = (r: SyncRow, userId: string, kind: string) => ({
  user_id: userId,
  kind,
  client_id: r.clientId,
  name0: r.names[0],
  name1: r.names[1],
  name2: r.names[2],
  name3: r.names[3],
  is_group: r.isGroup === 1,
  value: r.isGroup ? null : r.value,
  updated_at: new Date(r.updatedAt).toISOString(),
  deleted_at: r.deletedAt === null ? null : new Date(r.deletedAt).toISOString(),
});

const running = new Map<SavedStore, Promise<boolean>>();
const listeners = new Set<(store: SavedStore) => void>();
/** 동기화가 기기 목록을 바꿨을 때 (저장 목록 화면이 다시 읽는다) */
export const onSavedReplaced = (fn: (store: SavedStore) => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/**
 * 한 목록을 계정과 맞춘다. 로그인 안 했거나 기능이 꺼져 있으면 아무것도 보내지 않고 false.
 * 순서: 계정에서 받기 → 합치기 → 기기에 먼저 쓰기 → 오래된 지운 표시 정리 → 계정에 올리기.
 * 기기에 먼저 쓰므로 올리기가 실패해도 다음 동기화가 다시 올린다(saved-sync-check «실패 뒤 재시도»).
 */
export const syncSavedStore = (store: SavedStore): Promise<boolean> => {
  const prev = running.get(store);
  if (prev) return prev;
  const job = runSync(store).finally(() => running.delete(store));
  running.set(store, job);
  return job;
};

async function runSync(store: SavedStore): Promise<boolean> {
  if (!savedSyncEnabled()) return false;
  const supabase = await getSupabase();
  const user = supabase ? await getCurrentUser() : null;
  if (!supabase || !user) return false;
  const status = savedSyncStatus[store],
    kind = KIND[store];
  status.state = "syncing";
  try {
    const { rows, tombstones } = await getSavedState(store);
    const expected = {
      count: rows.length,
      newest: Math.max(0, ...rows.map((r) => r.updatedAt ?? 0)),
    };
    const { data, error } = await supabase
      .from(TABLE)
      .select("client_id,name0,name1,name2,name3,is_group,value,updated_at,deleted_at")
      .eq("user_id", user.id)
      .eq("kind", kind);
    if (error) throw error;
    const remote = (data as RemoteRow[]).map(fromRemote);

    const now = Date.now(),
      cutoff = now - TOMBSTONE_KEEP_MS;
    const merged = mergeSaved(
      rows.filter((r) => r.clientId).map(fromLocal),
      tombstones.map(fromTombstone),
      remote,
      now
    );
    const expired = (r: SyncRow) => r.deletedAt !== null && r.deletedAt < cutoff;

    const replaced = await replaceSavedState(
      store,
      expected,
      merged.live.map(toLocal),
      merged.tombstones
        .filter((t) => !expired(t))
        .map((t) => ({ store, clientId: t.clientId, deletedAt: t.deletedAt! }))
    );
    if (!replaced) {
      // 읽은 뒤 이 기기에서 저장이 있었다 — 다음 동기화가 다시 합친다
      status.state = "pending";
      return false;
    }
    listeners.forEach((fn) => fn(store));

    // 오래된 지운 표시를 올리기보다 먼저 지운다 — 전체 3,000 한도에 걸려도 저절로 풀리게 (MA-433)
    const remoteIds = new Set(remote.map((r) => r.clientId));
    const purge = merged.tombstones
      .filter((t) => expired(t) && remoteIds.has(t.clientId))
      .map((t) => t.clientId);
    for (let i = 0; i < purge.length; i += CHUNK) {
      await supabase
        .from(TABLE)
        .delete()
        .eq("user_id", user.id)
        .eq("kind", kind)
        .in("client_id", purge.slice(i, i + CHUNK));
    }

    const upload = merged.upload.filter((r) => !expired(r));
    for (let i = 0; i < upload.length; i += CHUNK) {
      const { error: upErr } = await supabase
        .from(TABLE)
        .upsert(
          upload.slice(i, i + CHUNK).map((r) => toRemote(r, user.id, kind)),
          { onConflict: "user_id,kind,client_id" }
        );
      if (upErr) {
        status.state = /limit reached/.test(upErr.message) ? "limit" : "pending";
        return false;
      }
    }

    status.state = "ok";
    status.lastSync = Date.now();
    return true;
  } catch {
    status.state = "pending";
    return false;
  }
}

const timers = new Map<SavedStore, ReturnType<typeof setTimeout>>();
/** 저장·이름 바꾸기·삭제 뒤에 부른다 — 잇달아 고쳐도 한 번만 보낸다. */
export const requestSavedSync = (store: SavedStore, delayMs = 1500) => {
  if (!savedSyncEnabled()) return;
  clearTimeout(timers.get(store));
  timers.set(
    store,
    setTimeout(() => void syncSavedStore(store), delayMs)
  );
};
