import { parseHmr1, Hmr1File } from "./review/hmr1";
import { ReviewError } from "./review/errors";
import { SPOT_UNIT_SCALE } from "./preflop-spots";

// Deployment changes only this configuration. Data is served separately, never bundled.
export const HAND_REVIEW_DATA = {
  baseUrl: "/review-data",
  readyScenarios: ["srp-btn-bb"] as readonly string[],
  maxCachedFlops: 8,
  timeoutMs: 20000,
};
// 출시 전에는 사이드바 메뉴를 숨긴다 — 상황 계산이 다 끝나고 자료를 올린 뒤에 켠다 (사장님 09-29 «중간 공개 없음»).
// ?view=hand-review 직접 주소로는 열린다 (검사·내부 확인용).
export const HAND_REVIEW_LAUNCHED = false;
const cache = new Map<string, Hmr1File>();

export async function loadReviewFlop(
  spot: { id: string; startingPot: number; effectiveStack: number },
  fileName: string
): Promise<Hmr1File> {
  if (!HAND_REVIEW_DATA.readyScenarios.includes(spot.id))
    throw new ReviewError("MISSING_FILE", "Scenario not ready", {
      scenario: spot.id,
    });
  const url = `${HAND_REVIEW_DATA.baseUrl.replace(/\/$/, "")}/${
    spot.id
  }/${fileName}`;
  const found = cache.get(url);
  if (found) {
    cache.delete(url);
    cache.set(url, found);
    return found;
  }
  const abort = new AbortController(),
    timeout = setTimeout(() => abort.abort(), HAND_REVIEW_DATA.timeoutMs);
  try {
    const response = await fetch(url, {
      signal: abort.signal,
      credentials: "omit",
      mode: "cors",
    });
    if (response.status === 404)
      throw new ReviewError("MISSING_FILE", "Flop file missing");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const file = parseHmr1(new Uint8Array(await response.arrayBuffer()));
    if (`${file.header.flop}.bin` !== fileName)
      throw new ReviewError("FLOP_MISMATCH", "File contains a different flop");
    if (
      file.header.scenario !== spot.id ||
      file.header.pot !== spot.startingPot ||
      file.header.stack !== spot.effectiveStack ||
      file.header.unit !== SPOT_UNIT_SCALE ||
      file.header.targetPct > 0.3 ||
      file.header.exploitPct > file.header.targetPct
    )
      throw new ReviewError(
        "UNSUPPORTED_ACCURACY",
        "Review dataset does not match the selected spot/accuracy"
      );
    cache.set(url, file);
    while (cache.size > HAND_REVIEW_DATA.maxCachedFlops)
      cache.delete(cache.keys().next().value!);
    return file;
  } finally {
    clearTimeout(timeout);
  }
}
