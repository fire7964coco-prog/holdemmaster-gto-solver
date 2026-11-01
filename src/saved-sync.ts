// 저장 목록(레인지·벳 설정) 계정 동기화 — 합치기 규칙 (설계 참고자료/계정동기화_설계안_2026-10-11.md §3·§4).
// 순수 함수만 둔다: Vue·Dexie·Supabase import 금지 → Node에서 그대로 검사한다 (도구/e2e/saved-sync-check.js).
// 1단계(10-11): 기기 쪽 준비만. 서버 연결·화면은 2단계, 본체 표(S-067)가 생긴 뒤 켠다.

/** 한 항목의 동기화 상태. 기기 행·계정 행·지운 표시를 모두 이 꼴로 바꿔 비교한다. */
export type SyncRow = {
  clientId: string;
  /** 그룹 경로 4단 (DbItemPicker와 같음 · 빈 칸은 "") */
  names: [string, string, string, string];
  isGroup: 0 | 1;
  value: unknown;
  /** 마지막으로 고친 시각(ms) */
  updatedAt: number;
  /** 지운 시각(ms) · 살아 있으면 null */
  deletedAt: number | null;
};

export type MergeResult = {
  /** 이 기기에 남길 행 (살아 있는 것만) */
  live: SyncRow[];
  /** 지운 표시 (이 기기에 남기고 계정에도 올린다) */
  tombstones: SyncRow[];
  /** 계정에 올릴 행 — 계정 값과 다르거나 계정에 없는 것 (지운 표시 포함) */
  upload: SyncRow[];
};

const stamp = (row: SyncRow) => Math.max(row.updatedAt, row.deletedAt ?? 0);

/** 같은 항목(clientId)의 두 상태 중 이기는 쪽 — 나중 시각 · 같으면 지운 쪽 · 그래도 같으면 b(계정). */
export function newer(a: SyncRow, b: SyncRow): SyncRow {
  const sa = stamp(a),
    sb = stamp(b);
  if (sa !== sb) return sa > sb ? a : b;
  if ((a.deletedAt !== null) !== (b.deletedAt !== null))
    return a.deletedAt !== null ? a : b;
  return b;
}

/** 순서까지 같은 깊은 비교 (DbItemPicker의 isEqual과 같은 뜻 · JSON 값만 다룬다). */
export function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

const depthOf = (names: readonly string[]) => {
  const i = names.indexOf("");
  return i < 0 ? 4 : i;
};
const pathKey = (names: readonly string[]) =>
  JSON.stringify(names.slice(0, depthOf(names)));

const sameRow = (a: SyncRow, b: SyncRow) =>
  a.isGroup === b.isGroup &&
  a.deletedAt === b.deletedAt &&
  a.updatedAt === b.updatedAt &&
  pathKey(a.names) === pathKey(b.names) &&
  sameValue(a.value, b.value);

/** 빠진 상위 그룹을 채울 때 쓰는 고유값 — 경로에서 정해지므로 두 기기가 같은 값을 만든다. */
export function autoGroupId(names: readonly string[]) {
  let h = 2166136261;
  for (const ch of pathKey(names)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return `auto-${h.toString(36)}-${depthOf(names)}`;
}

/**
 * 기기 목록 + 기기의 지운 표시 + 계정 목록 → 합친 결과.
 * ① 같은 clientId는 newer()로 하나만 ② 같은 경로에 살아 있는 행이 둘 이상이면 clientId 순으로 첫 행을 남기고,
 *    그룹끼리 · 내용이 같은 항목끼리는 나머지를 지운 표시로, 내용이 다르면 «이름 (2)»로 바꾼다
 *    (JSON 가져오기와 같은 규칙) ③ 상위 그룹이 없는 행은 그룹을 만들어 붙인다.
 * now = 이름을 바꾸거나 지운 표시를 새로 만들 때 찍는 시각.
 */
export function mergeSaved(
  local: readonly SyncRow[],
  localTombstones: readonly SyncRow[],
  remote: readonly SyncRow[],
  now: number
): MergeResult {
  const remoteById = new Map(remote.map((r) => [r.clientId, r]));
  const byId = new Map<string, SyncRow>();
  for (const row of [...local, ...localTombstones, ...remote]) {
    const prev = byId.get(row.clientId);
    byId.set(row.clientId, prev ? newer(prev, row) : row);
  }

  const all = [...byId.values()].map((r) => ({
    ...r,
    names: [...r.names] as SyncRow["names"],
  }));
  const live = all
    .filter((r) => r.deletedAt === null)
    .sort((a, b) =>
      depthOf(a.names) - depthOf(b.names) || (a.clientId < b.clientId ? -1 : 1)
    );

  // ② 같은 경로 겹침
  const taken = new Map<string, SyncRow>();
  /** 항목 이름 끝에 « (2)»·« (3)»…을 붙여 빈 경로로 옮긴다. */
  const moveAside = (item: SyncRow) => {
    const depth = depthOf(item.names),
      name = item.names[depth - 1];
    let key = pathKey(item.names);
    for (let i = 2; taken.has(key); i++) {
      item.names[depth - 1] = `${name} (${i})`;
      key = pathKey(item.names);
    }
    item.updatedAt = now;
    taken.set(key, item);
  };
  for (const row of live) {
    const key = pathKey(row.names);
    const first = taken.get(key);
    if (!first) {
      taken.set(key, row);
      continue;
    }
    if (
      (row.isGroup === 1 && first.isGroup === 1) ||
      (row.isGroup === 0 && first.isGroup === 0 && sameValue(row.value, first.value))
    ) {
      row.deletedAt = now;
      continue;
    }
    // 이름을 비켜 주는 쪽은 항목이다 — 그룹 이름을 바꾸면 안의 행이 떨어져 나간다
    const [keep, mover] = row.isGroup === 1 ? [row, first] : [first, row];
    taken.set(key, keep);
    moveAside(mover);
  }

  // ③ 빠진 상위 그룹
  const result = all.filter((r) => r.deletedAt === null);
  for (const row of [...result]) {
    for (let d = depthOf(row.names) - 1; d >= 1; d--) {
      const names = row.names.map((n, i) => (i < d ? n : "")) as SyncRow["names"];
      const key = pathKey(names),
        existing = taken.get(key);
      if (existing?.isGroup === 1) break;
      // 같은 이름의 항목이 그룹 자리를 차지 — 항목 쪽 이름을 비켜 준다
      if (existing) moveAside(existing);
      const group: SyncRow = {
        clientId: autoGroupId(names),
        names,
        isGroup: 1,
        value: null,
        updatedAt: now,
        deletedAt: null,
      };
      taken.set(key, group);
      result.push(group);
      // 예전에 지운 같은 자동 그룹이 있으면 그 자리를 되살린다
      const old = all.findIndex((r) => r.clientId === group.clientId);
      if (old >= 0) all.splice(old, 1, group);
      else all.push(group);
    }
  }

  const finalLive = result.filter((r) => r.deletedAt === null);
  const tombstones = all.filter((r) => r.deletedAt !== null);
  const upload = [...finalLive, ...tombstones].filter((r) => {
    const remoteRow = remoteById.get(r.clientId);
    return !remoteRow || !sameRow(r, remoteRow);
  });
  return { live: finalLive, tombstones, upload };
}
