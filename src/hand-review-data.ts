import { parseHmr1, Hmr1File } from "./review/hmr1";
import { ReviewError } from "./review/errors";
import { SPOT_UNIT_SCALE } from "./preflop-spots";

// Deployment changes only this configuration. Data is served separately, never bundled.
// 자료 = Cloudflare R2 `holdem-review-data` → Worker(도구/review-data-worker). 자료를 바꿀 땐 v2/로 새로 올린다.
export const HAND_REVIEW_DATA = {
  baseUrl: "https://holdem-review-data.review-data-worker.workers.dev/v1",
  readyScenarios: [
    "srp-btn-bb", "srp-sb-bb", "srp-co-bb", "srp-hj-bb", "srp-utg-bb",
    "srp-co-btn", "srp-hj-btn", "srp-utg-btn", "srp-hj-co", "3bp-btn-bb", "3bp-btn-sb",
  ] as readonly string[],
  maxCachedFlops: 8,
  timeoutMs: 20000,
};
// 사이드바 메뉴 노출 스위치 — 11상황 자료를 올린 뒤 출시(2026-10-09 사장님 ○). 09-29 «중간 공개 없음» 조건 충족.
// ?view=hand-review 직접 주소로는 열린다 (검사·내부 확인용).
export const HAND_REVIEW_LAUNCHED = true;
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
