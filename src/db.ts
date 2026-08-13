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
};

export type DbGroup = {
  id?: number;
  name0: string;
  name1: string;
  name2: string;
  name3: string;
  isGroup: 1;
};

export type TrainerAttempt = {
  id?: number;
  /** 기기에서 만든 고유값 — 계정 동기화 시 같은 기록을 중복 저장하지 않기 위한 열쇠 */
  clientId: string;
  timestamp: number;
  questionId: string;
  presetId: string;
  category: "srp" | "3bp" | "blind";
  handPair: number;
  selectedAction: number;
  bestAction: number;
  evLossBb: number;
};

class WASMPostflopDB extends Dexie {
  public ranges!: Table<DbItem | DbGroup, number>;
  public configurations!: Table<DbItem | DbGroup, number>;
  public trainerAttempts!: Table<TrainerAttempt, number>;

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
      await table.add(item);

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
      return (await collection.modify({ value: item.value })) === 1;
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

      // update
      return (await table.where(index).equals(key).modify(modifier)) > 0;
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
      await table.add(group);

      return true;
    });
  } catch {
    return false;
  }
};

export const deleteItem = async (store: string, item: DbItem | DbGroup) => {
  try {
    const table = db.table(store);

    return await db.transaction("rw", table, async () => {
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
        return (await table.where(index).equals(key).delete()) > 0;
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
        return (await collection.delete()) === 1;
      }
    });
  } catch {
    return false;
  }
};

export const bulkAdd = async (store: string, items: (DbItem | DbGroup)[]) => {
  try {
    const table = db.table(store);

    return await db.transaction("rw", table, async () => {
      // insert
      await table.bulkAdd(items);

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
