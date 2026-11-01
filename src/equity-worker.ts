/*
 * 에퀴티 계산 워커.
 *
 * 전수 계산은 프리플랍 핸드 vs 핸드만 해도 200만 런아웃이라 메인 스레드에서 돌리면
 * 화면이 몇 초씩 멈춘다. 계산은 여기서 하고 진행률만 화면으로 보낸다.
 * 중단은 화면 쪽에서 워커를 terminate 하는 방식 — 계산 루프에 중단 검사를 넣지 않아도 된다.
 *
 * 솔버 워커(worker.ts)와 달리 Comlink를 쓰지 않는다. 요청 1개 → 진행률 여러 개 → 결과 1개라
 * 평범한 postMessage로 충분하고, wasm도 필요 없어 청크가 가볍다.
 */
import { computeEquity, Combo, EquityResult } from "./equity";

export type EquityRequest = {
  hero: number[];
  villain: Combo[];
  board: number[];
  force?: "exact" | "mc";
  samples?: number;
};

export type EquityResponse =
  | { type: "progress"; value: number }
  | { type: "done"; result: EquityResult }
  | { type: "error"; code: string };

// 워커 전역. lib.dom 기준으로 self는 Window라 필요한 부분만 좁혀서 쓴다.
const ctx = self as unknown as {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage: (data: EquityResponse) => void;
};

ctx.onmessage = (event: MessageEvent) => {
  const request = event.data as EquityRequest;
  try {
    const result = computeEquity(request.hero, request.villain, request.board, {
      force: request.force,
      samples: request.samples,
      onProgress: (value) => ctx.postMessage({ type: "progress", value }),
    });
    ctx.postMessage({ type: "done", result });
  } catch (error) {
    ctx.postMessage({ type: "error", code: (error as Error).message });
  }
};
