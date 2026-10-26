import { assertPackMatchesFlop, Hmt1Pack, parseHmt1 } from "./review/hmt1";
import { Hmr1File } from "./review/hmr1";
import { ReviewError } from "./review/errors";
import { SPOT_UNIT_SCALE } from "./preflop-spots";
import { getAccessToken } from "./account";
import { isMemberFreeSample, isMemberScenario } from "./member-limits";
import { HAND_REVIEW_DATA } from "./hand-review-data";
import { TURN_PACK_LINES, TurnPackLine, turnPackDataId } from "./turn-pack-model";

// 턴 팩(설계 참고자료/턴팩_설계안_2026-10-21.md §6-5) — 자료 = 복기와 같은 Worker의 `tp-<상황>/<정규 플랍>/<경로>.hmt`(회원 자료).
// 출시 스위치: 10-26 켬(BTN·CO 턴 팩 R2 업로드 뒤). 끄면 플랍 조회는 옛 문구 그대로다.
export const TURN_PACK_LAUNCHED = true;
/** localhost 검사용: localStorage `solver.turnPack.test` = "1"이면 스위치가 꺼져 있어도 켠다 · `solver.turnPack.base` = 자료 주소 바꾸기. */
const TEST_KEY = "solver.turnPack.test";
const TEST_BASE_KEY = "solver.turnPack.base";

const testValue = (key: string) => {
  try {
    return ["localhost", "127.0.0.1"].includes(location.hostname) ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
};
export const turnPackEnabled = () => TURN_PACK_LAUNCHED || testValue(TEST_KEY) === "1";

// 한 팩 = 대략 1~2.5MB · 풀어 둔 턴은 팩 안 Map에 쌓인다 → 작게.
const MAX_CACHED_PACKS = 4;
const cache = new Map<string, Hmt1Pack>();
const pending = new Map<string, Promise<Hmt1Pack>>();

/**
 * 플랍 조회가 준비된 경로의 찬스 노드에 처음 도착할 때 1파일. 같은 주소를 동시에 부르면 같은 요청을 기다린다.
 * 토큰 없음 = MEMBER_ONLY(요청하지 않음) · 새 토큰으로도 401 = LOAD_FAILED · 404 = MISSING_FILE · 429/503 = RATE_LIMITED.
 * 헤더는 HMT1 기준으로 본다(flopPot/flopStack = 상황 시작, pot/stack = 턴 시작 · 0.3% · turnSet all) + 플랍 파일과의 연결.
 */
export async function loadTurnPack(
  spot: { id: string; startingPot: number; effectiveStack: number },
  flopFile: Hmr1File,
  line: TurnPackLine
): Promise<Hmt1Pack> {
  const dataId = turnPackDataId(spot.id),
    flop = flopFile.header.flop,
    name = `${flop}/${line}.hmt`;
  const base = (testValue(TEST_BASE_KEY) || HAND_REVIEW_DATA.baseUrl).replace(/\/$/, "");
  const url = `${base}/${dataId}/${name}`;
  const member = isMemberScenario(dataId) && !isMemberFreeSample(dataId, name);
  let token = member ? await getAccessToken() : null;
  if (member && !token) throw new ReviewError("MEMBER_ONLY", "Sign-in required", { scenario: dataId });
  const found = cache.get(url);
  if (found) {
    cache.delete(url);
    cache.set(url, found);
    return found;
  }
  const running = pending.get(url);
  if (running) return running;
  const job = (async () => {
    const abort = new AbortController();
    let timeout = setTimeout(() => abort.abort(), HAND_REVIEW_DATA.timeoutMs);
    try {
      const get = () =>
        fetch(url, {
          signal: abort.signal,
          credentials: "omit",
          mode: "cors",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
      let response = await get();
      if (member && response.status === 401) {
        token = await getAccessToken(true);
        if (!token) throw new ReviewError("MEMBER_ONLY", "Sign-in required", { scenario: dataId });
        clearTimeout(timeout);
        timeout = setTimeout(() => abort.abort(), HAND_REVIEW_DATA.timeoutMs);
        response = await get();
      }
      if (member && response.status === 401)
        throw new ReviewError("LOAD_FAILED", "Member token rejected", { scenario: dataId });
      if (response.status === 404) throw new ReviewError("MISSING_FILE", "Turn pack missing");
      if (response.status === 429 || response.status === 503)
        throw new ReviewError("RATE_LIMITED", "Try again later", {
          retryAfter: Number(response.headers.get("Retry-After")) || 60,
        });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const pack = parseHmt1(new Uint8Array(await response.arrayBuffer()));
      const h = pack.header,
        expected: readonly number[] = TURN_PACK_LINES[line];
      if (
        h.scenario !== spot.id ||
        h.flop !== flop ||
        h.pathName !== line ||
        h.flopPath.join() !== expected.join() ||
        h.flopPot !== spot.startingPot ||
        h.flopStack !== spot.effectiveStack ||
        h.unit !== SPOT_UNIT_SCALE ||
        h.targetPct > 0.3 ||
        h.turnSet !== "all"
      )
        throw new ReviewError("UNSUPPORTED_ACCURACY", "Turn pack does not match the selected spot/line");
      assertPackMatchesFlop(pack, flopFile);
      cache.set(url, pack);
      while (cache.size > MAX_CACHED_PACKS) cache.delete(cache.keys().next().value!);
      return pack;
    } finally {
      clearTimeout(timeout);
      pending.delete(url);
    }
  })();
  pending.set(url, job);
  return job;
}
