import Dexie, { Table } from "dexie";
import { ConfigValue1, migrateConfig1to2 } from "./db-migration";

export type DbItem = {
  id?: number;
  name0: string;
  name1: string;
  name2: string;
  name3: string;
  isGroup: 0;
  value: unknown;
  /** v5 계정 동기화 — 기기에서 만든 고유값 (저장 목록 항목마다) */
  clientId?: string;
  /** v5 — 마지막으로 고친 시각(ms). 두 기기가 같은 항목을 고치면 나중 것이 이긴다 */
  updatedAt?: number;
};

export type DbGroup = {
  id?: number;
  name0: string;
  name1: string;
  name2: string;
  name3: string;
  isGroup: 1;
  clientId?: string;
  updatedAt?: number;
};

/** v5 — 지운 항목의 고유값. 계정 동기화 때 다른 기기에서도 지우도록 남겨 둔다 */
export type SavedTombstone = {
  store: SavedStore;
  clientId: string;
  deletedAt: number;
};
export type SavedStore = "ranges" | "configurations";

export type TrainerAttempt = {
  id?: number;
  /** 기기에서 만든 고유값 — 계정 동기화 시 같은 기록을 중복 저장하지 않기 위한 열쇠 */
  clientId: string;
  timestamp: number;
  questionId: string;
  presetId: string;
  category: "srp" | "3bp" | "4bp" | "blind";
  handPair: number;
  selectedAction: number;
  bestAction: number;
  evLossBb: number;
};

class WASMPostflopDB extends Dexie {
  public ranges!: Table<DbItem | DbGroup, number>;
  public configurations!: Table<DbItem | DbGroup, number>;
  public trainerAttempts!: Table<TrainerAttempt, number>;
  public savedTombstones!: Table<SavedTombstone, [string, string]>;

  public constructor() {
    super("WASMPostflopDB");

    this.version(1).stores({
      ranges: "++id, [name0+name1+name2+name3+isGroup]",
      configurations: "++id, [name0+name1+name2+name3+isGroup]",
    });

    this.version(2)
      .stores({
        ranges: "++id, [name0+name1+name2+name3+isGroup]",
        configurations: "++id, [name0+name1+name2+name3+isGroup]",
      })
      .upgrade((tx) => {
        return tx
          .table("configurations")
          .toCollection()
          .modify((item: DbItem | DbGroup) => {
            if (!item.isGroup) {
              item.value = migrateConfig1to2(item.value as ConfigValue1);
            }
          });
      });

    this.version(3).stores({
      ranges: "++id, [name0+name1+name2+name3+isGroup]",
      configurations: "++id, [name0+name1+name2+name3+isGroup]",
      trainerAttempts: "++id, timestamp, category, presetId, evLossBb",
    });

    // v4: 계정 동기화용 clientId 추가. 이전 버전에서 쌓인 기록에도 값을 채워
    // 로그인 시 그대로 올라가게 한다(지금까지 푼 기록이 사라지지 않도록).
    this.version(4)
      .stores({
        ranges: "++id, [name0+name1+name2+name3+isGroup]",
        configurations: "++id, [name0+name1+name2+name3+isGroup]",
        trainerAttempts: "++id, timestamp, category, presetId, evLossBb, &clientId",
      })
      .upgrade((tx) => {
        return tx
          .table("trainerAttempts")
          .toCollection()
          .modify((item: TrainerAttempt) => {
            if (!item.clientId) item.clientId = newClientId();
          });
      });

    // v5: 저장 목록(레인지·벳 설정) 계정 동기화 준비 — 항목마다 clientId·updatedAt을 채우고
    // 지운 항목은 savedTombstones에 남긴다 (설계 참고자료/계정동기화_설계안_2026-10-11.md §4).
    this.version(5)
      .stores({
        ranges: "++id, [name0+name1+name2+name3+isGroup], &clientId",
        configurations: "++id, [name0+name1+name2+name3+isGroup], &clientId",
        trainerAttempts: "++id, timestamp, category, presetId, evLossBb, &clientId",
        savedTombstones: "[store+clientId]",
      })
      .upgrade(async (tx) => {
        const now = Date.now();
        for (const store of ["ranges", "configurations"]) {
          await tx
            .table(store)
            .toCollection()
            .modify((item: DbItem | DbGroup) => {
              if (!item.clientId) item.clientId = newClientId();
              if (!item.updatedAt) item.updatedAt = now;
            });
        }
      });
  }
}

/** 브라우저가 randomUUID를 지원하지 않는 경우까지 대비한 고유값 생성 */
export const newClientId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const db = new WASMPostflopDB();

/** 새로 넣는 항목에 고유값·시각을 붙인다 (가져온 JSON의 옛 값은 버린다 — 같은 기기 사본과 겹치지 않게) */
const stamped = <T extends DbItem | DbGroup>(item: T): T => {
  const { id: _id, ...rest } = item;
  return { ...rest, clientId: newClientId(), updatedAt: Date.now() } as T;
};

const addTombstones = async (store: string, rows: (DbItem | DbGroup)[]) => {
  if (store !== "ranges" && store !== "configurations") return;
  const deletedAt = Date.now();
  await db.savedTombstones.bulkPut(
    rows
      .filter((row) => row.clientId)
      .map((row) => ({ store, clientId: row.clientId!, deletedAt }))
  );
};

const makeParent = (item: DbItem | DbGroup) => {
  if (item.name3 !== "") {
    return { ...item, name3: "", isGroup: 1 };
  } else if (item.name2 !== "") {
    return { ...item, name2: "", isGroup: 1 };
  } else if (item.name1 !== "") {
    return { ...item, name1: "", isGroup: 1 };
  } else {
    throw new Error("Cannot make parent of top-level item");
  }
};

const makeRenamed = (item: DbItem | DbGroup, newName: string) => {
  if (item.name3 !== "") {
    return { ...item, name3: newName };
  } else if (item.name2 !== "") {
    return { ...item, name2: newName };
  } else if (item.name1 !== "") {
    return { ...item, name1: newName };
  } else {
    return { ...item, name0: newName };
  }
};

export const getArray = async (store: string) => {
  return (await db.table(store).toArray()) as (DbItem | DbGroup)[];
};

export const addItem = async (store: string, item: DbItem) => {
  try {
    const table = db.table(store);

    return await db.transaction("rw", table, async () => {
      // duplicate check
      const count = await table
        .where("[name0+name1+name2+name3]")
        .equals([item.name0, item.name1, item.name2, item.name3])
        .count();
      if (count > 0) {
        return false;
      }

      // parent check
      if (item.name1 !== "") {
        const parent = makeParent(item);
        const count = await table
          .where("[name0+name1+name2+name3+isGroup]")
          .equals([parent.name0, parent.name1, parent.name2, parent.name3, 1])
          .count();
        if (count !== 1) {
          return false;
        }
      }

      // insert
      await table.add(stamped(item));

      return true;
    });
  } catch {
    return false;
  }
};

export const overwriteItem = async (store: string, item: DbItem) => {
  try {
    const table = db.table(store);

    return await db.transaction("rw", table, async () => {
      // get collection
      const collection = table
        .where("[name0+name1+name2+name3+isGroup]")
        .equals([item.name0, item.name1, item.name2, item.name3, 0]);

      // check if exists
      if ((await collection.count()) !== 1) {
        return false;
      }

      // update
      return (
        (await collection.modify({ value: item.value, updatedAt: Date.now() })) === 1
      );
    });
  } catch {
    return false;
  }
};

export const renameItem = async (
  store: string,
  item: DbItem | DbGroup,
  newName: string
) => {
  try {
    const table = db.table(store);

    return await db.transaction("rw", table, async () => {
      const renamed = makeRenamed(item, newName);

      // duplicate check
      const count = await table
        .where("[name0+name1+name2+name3]")
        .equals([renamed.name0, renamed.name1, renamed.name2, renamed.name3])
        .count();
      if (count > 0) {
        return false;
      }

      const [index, key, modifier] =
        item.name3 !== ""
          ? [
              "[name0+name1+name2+name3]",
              [item.name0, item.name1, item.name2, item.name3],
              { name3: newName },
            ]
          : item.name2 !== ""
          ? [
              "[name0+name1+name2]",
              [item.name0, item.name1, item.name2],
              { name2: newName },
            ]
          : item.name1 !== ""
          ? ["[name0+name1]", [item.name0, item.name1], { name1: newName }]
          : ["name0", item.name0, { name0: newName }];

      // update (그룹 이름을 바꾸면 안의 항목 경로도 바뀌므로 모두 시각 갱신)
      return (
        (await table
          .where(index)
          .equals(key)
          .modify({ ...(modifier as object), updatedAt: Date.now() })) > 0
      );
    });
  } catch {
    return false;
  }
};

export const addGroup = async (store: string, group: DbGroup) => {
  if (group.name3 !== "") {
    return false;
  }

  try {
    const table = db.table(store);

    return await db.transaction("rw", table, async () => {
      // duplicate check
      const count = await table
        .where("[name0+name1+name2+name3]")
        .equals([group.name0, group.name1, group.name2, group.name3])
        .count();
      if (count > 0) {
        return false;
      }

      // parent check
      if (group.name1 !== "") {
        const parent = makeParent(group);
        const count = await table
          .where("[name0+name1+name2+name3+isGroup]")
          .equals([parent.name0, parent.name1, parent.name2, parent.name3, 1])
          .count();
        if (count !== 1) {
          return false;
        }
      }

      // insert
      await table.add(stamped(group));

      return true;
    });
  } catch {
    return false;
  }
};

export const deleteItem = async (store: string, item: DbItem | DbGroup) => {
  try {
    const table = db.table(store);

    return await db.transaction("rw", table, db.savedTombstones, async () => {
      if (item.isGroup) {
        // check if exists
        const count = await table
          .where("[name0+name1+name2+name3+isGroup]")
          .equals([item.name0, item.name1, item.name2, item.name3, 1])
          .count();
        if (count !== 1) {
          return false;
        }

        const [index, key] =
          item.name2 !== ""
            ? ["[name0+name1+name2]", [item.name0, item.name1, item.name2]]
            : item.name1 !== ""
            ? ["[name0+name1]", [item.name0, item.name1]]
            : ["name0", item.name0];

        // delete
        const doomed = table.where(index).equals(key);
        await addTombstones(store, await doomed.toArray());
        return (await doomed.delete()) > 0;
      } else {
        // get collection
        const collection = table
          .where("[name0+name1+name2+name3+isGroup]")
          .equals([item.name0, item.name1, item.name2, item.name3, 0]);

        // check if exists
        if ((await collection.count()) !== 1) {
          return false;
        }

        // delete
        await addTombstones(store, await collection.toArray());
        return (await collection.delete()) === 1;
      }
    });
  } catch {
    return false;
  }
};

/* ── 계정 동기화(saved-sync-run.ts)가 쓰는 통째 읽기·쓰기 ─────────── */

/** 저장 목록 한 벌 + 지운 표시 (동기화 직전 상태) */
export const getSavedState = async (store: SavedStore) => {
  const rows = (await db.table(store).toArray()) as (DbItem | DbGroup)[];
  const tombstones = await db.savedTombstones.filter((t) => t.store === store).toArray();
  return { rows, tombstones };
};

/**
 * 합친 결과로 저장 목록을 통째로 바꾼다. 읽은 뒤 다른 탭에서 바뀌었으면(행 수·시각이 다르면)
 * 쓰지 않고 false — 다음 동기화가 다시 합친다.
 */
export const replaceSavedState = async (
  store: SavedStore,
  expected: { count: number; newest: number },
  rows: (DbItem | DbGroup)[],
  tombstones: SavedTombstone[]
) => {
  const table = db.table(store);
  return await db.transaction("rw", table, db.savedTombstones, async () => {
    const current = (await table.toArray()) as (DbItem | DbGroup)[];
    const newest = Math.max(0, ...current.map((r) => r.updatedAt ?? 0));
    if (current.length !== expected.count || newest !== expected.newest) return false;
    await table.clear();
    await table.bulkAdd(rows.map(({ id: _id, ...rest }) => rest));
    await db.savedTombstones.filter((t) => t.store === store).delete();
    await db.savedTombstones.bulkPut(tombstones);
    return true;
  });
};

export const bulkAdd = async (store: string, items: (DbItem | DbGroup)[]) => {
  try {
    const table = db.table(store);

    return await db.transaction("rw", table, async () => {
      // insert
      await table.bulkAdd(items.map(stamped));

      return true;
    });
  } catch {
    return false;
  }
};

export const addTrainerAttempt = async (attempt: TrainerAttempt) => {
  const id = await db.trainerAttempts.add(attempt);
  const count = await db.trainerAttempts.count();
  if (count > 500) {
    const oldest = await db.trainerAttempts
      .orderBy("timestamp")
      .limit(count - 500)
      .primaryKeys();
    await db.trainerAttempts.bulkDelete(oldest);
  }
  return id;
};

export const getTrainerAttempts = async (limit = 500) => {
  return db.trainerAttempts.orderBy("timestamp").reverse().limit(limit).toArray();
};

export const clearTrainerAttempts = async () => {
  await db.trainerAttempts.clear();
};

/**
 * 계정에서 내려받은 기록 중 기기에 없는 것만 넣는다.
 * clientId가 겹치면(이미 있는 기록) 조용히 건너뛴다.
 */
export const mergeTrainerAttempts = async (attempts: TrainerAttempt[]) => {
  if (!attempts.length) return 0;
  const existing = new Set(
    (await db.trainerAttempts.toArray()).map((item) => item.clientId)
  );
  const fresh = attempts.filter((item) => !existing.has(item.clientId));
  if (!fresh.length) return 0;
  await db.trainerAttempts.bulkPut(fresh);
  return fresh.length;
};
