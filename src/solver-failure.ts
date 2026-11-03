/*
 * 계산 실패의 종류 — 이용 계측 reason과 실패 안내가 같이 쓴다(MB-518 · 2026-11-03).
 * 오류 문장은 밖으로 보내지 않는다. 문장에서 종류만 골라 고정 코드로 바꾼다.
 * 순수 함수만 — Vue·DOM import 금지(Node에서 그대로 검사한다).
 */
export type FailureKind = "memory" | "oob" | "crash" | "worker_lost" | "init_timeout" | "replaced" | "other";
export type FailureStage = "solve" | "finalize";

const GB = 1024 * 1024 * 1024;

const messageOf = (error: unknown) => {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
};

export const failureKind = (error: unknown): FailureKind => {
  const text = messageOf(error);
  if (/SOLVER_WORKER_REPLACED/.test(text)) return "replaced";
  if (/SOLVER_WORKER_INIT_TIMEOUT/.test(text)) return "init_timeout";
  if (/SOLVER_OUT_OF_MEMORY/.test(text)) return "memory";
  // 메모리를 못 얻었다(기기·브라우저 사정) — 같은 계산을 다시 해도 또 난다
  if (/out of memory|allocation failed|could not allocate|cannot allocate|failed to grow|unable to grow|Memory\.grow|maximum memory|Array buffer allocation|OOM/i.test(text)) return "memory";
  // 엔진이 잘못된 칸을 읽었다 — 앱 쪽 결함
  if (/memory access out of bounds/i.test(text)) return "oob";
  if (/unreachable|panicked|RuntimeError/i.test(text)) return "crash";
  if (/SOLVER_WORKER_ERROR|SOLVER_WORKER_MESSAGE_ERROR/.test(text)) return "worker_lost";
  return "other";
};

/** 고른 저장 방식(압축 여부 반영)의 필요 메모리 — 1GB 단위 구간 */
export const memoryBucket = (bytes: number) => `m${Math.min(3, Math.max(0, Math.floor(bytes / GB)))}`;

/** 예) solve_memory_m3_mt — 이용 계측 REASON_VALUE([a-z0-9_]{1,40})에 맞는 고정 코드 */
export const failureReason = (stage: FailureStage, error: unknown, bytes: number, singleThread: boolean) =>
  `${stage}_${failureKind(error)}_${memoryBucket(bytes)}_${singleThread ? "st" : "mt"}`;
