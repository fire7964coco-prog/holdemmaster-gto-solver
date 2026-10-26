import { parseHmr1, Hmr1File } from "./review/hmr1";
import { ReviewError } from "./review/errors";
import { SPOT_UNIT_SCALE } from "./preflop-spots";
import { getAccessToken } from "./account";
import { isMemberFreeSample, isMemberScenario } from "./member-limits";

// Deployment changes only this configuration. Data is served separately, never bundled.
// 자료 = Cloudflare R2 `holdem-review-data` → Worker(도구/review-data-worker). 자료를 바꿀 땐 v2/로 새로 올린다.
export const HAND_REVIEW_DATA = {
  baseUrl: "https://holdem-review-data.review-data-worker.workers.dev/v1",
  readyScenarios: [
    "srp-btn-bb", "srp-sb-bb", "srp-co-bb", "srp-hj-bb", "srp-utg-bb",
    "srp-co-btn", "srp-hj-btn", "srp-utg-btn", "srp-hj-co", "3bp-btn-bb", "3bp-btn-sb",
    "3bp-co-bb", "3bp-co-btn", "3bp-hj-bb", "3bp-hj-co", "3bp-hj-btn",
    "3bp-utg-bb", "3bp-utg-co", "3bp-utg-btn", "3bp-sb-bb",
    "4bp-btn-bb", "4bp-btn-sb", "4bp-co-bb", "4bp-hj-bb", "4bp-utg-bb", "4bp-sb-bb",
    "4bp-co-btn", "4bp-hj-btn", "4bp-utg-btn", "4bp-hj-co", "4bp-utg-co",
    "limp-sb-bb",
  ] as readonly string[],
  maxCachedFlops: 16,
  timeoutMs: 20000,
};
// 사이드바 메뉴 노출 스위치 — 11상황 자료를 올린 뒤 출시(2026-10-09 사장님 ○) → 20상황 · 10-11 3벳 9개 추가 → 31상황 · 10-11 4벳 11개 추가 → 32상황 · 10-18 림프 팟(회원 전용 · 맛보기 1플랍). 09-29 «중간 공개 없음» 조건 충족.
// ?view=hand-review 직접 주소로는 열린다 (검사·내부 확인용).
export const HAND_REVIEW_LAUNCHED = true;
// 플랍 조회 사이드바 메뉴 스위치 (설계안 참고자료/플랍조회_설계안_2026-10-10.md · 5단계 사장님 ○ 10-12 · 문구 판정 MA-461·469).
// ?view=flop-study 직접 주소로도 열린다. 자료·캐시는 위 복기와 같이 쓴다.
export const FLOP_STUDY_LAUNCHED = true;
// 플랍 통계 사이드바 메뉴 스위치 (설계안 참고자료/플랍통계_설계안_2026-10-12.md · S-079·S-080 판정 OK · 사장님 ○ 10-12에 켬).
// ?view=flop-report 직접 주소로는 열린다. 자료 = 위 baseUrl의 flop-reports/<상황>.json(10-23 앱 정적 파일에서 옮김 · 오프라인 저장 대상 아님).
export const FLOP_REPORT_LAUNCHED = true;
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
  // 회원 전용 상황(맛보기 파일 제외)은 로그인 토큰을 붙인다 — 없으면 요청하지 않고 MEMBER_ONLY(화면은 그 자리 한 줄).
  // 무료 상황 요청에는 머리를 붙이지 않는다(사전 확인 요청이 생기지 않게).
  const member =
    isMemberScenario(spot.id) && !isMemberFreeSample(spot.id, fileName);
  let token = member ? await getAccessToken() : null;
  if (member && !token)
    throw new ReviewError("MEMBER_ONLY", "Sign-in required", {
      scenario: spot.id,
    });
  const found = cache.get(url);
  if (found) {
    cache.delete(url);
    cache.set(url, found);
    return found;
  }
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
    // 토큰이 만료됐으면 한 번 새로 받아 다시 요청 · 그래도 401이면 한 줄로 돌아간다
    if (member && response.status === 401) {
      token = await getAccessToken(true);
      if (!token)
        throw new ReviewError("MEMBER_ONLY", "Sign-in required", {
          scenario: spot.id,
        });
      clearTimeout(timeout);
      timeout = setTimeout(() => abort.abort(), HAND_REVIEW_DATA.timeoutMs);
      response = await get();
    }
    // 새 토큰으로도 401 = 로그인은 돼 있는데 서버 쪽 확인 실패(키 목록 못 받음 등) → 로그인 줄이 아니라 «다시 시도»
    if (member && response.status === 401)
      throw new ReviewError("LOAD_FAILED", "Member token rejected", {
        scenario: spot.id,
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
