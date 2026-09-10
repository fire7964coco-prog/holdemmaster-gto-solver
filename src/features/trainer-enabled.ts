/*
 * 빌드 2벌 분기의 «이음새» (2026-08-24, 트랙 B ①).
 *
 * 이 앱은 같은 저장소에서 두 벌로 빌드된다:
 *   - 트레이너 빌드(solver.holdemmaster.com) — 전 기능. 이 파일이 쓰인다.
 *   - npokers 빌드(스토어용 순수 솔버) — 트레이너·교육예제·오늘의문제·리더보드·
 *     계정 연동이 «번들에서 물리적으로» 빠진다. trainer-disabled.ts가 대신 쓰인다.
 *
 * 갈아끼우는 곳은 webpack.config.js의 resolve.alias("@features") 하나다.
 * 런타임 분기(호스트 검사 등)가 아니라 빌드 타임 분기인 이유: 번들을 열어보면
 * 「로그인 코드가 없다」를 실증할 수 있어야 하기 때문(작업계획.md 가드레일 G2).
 *
 * ⚠ 여기서 export하는 이름·형태는 trainer-disabled.ts와 반드시 짝을 이뤄야 한다.
 *   한쪽만 고치면 npokers 빌드가 빌드 타임 또는 런타임에 깨진다.
 */
export { default as TrainerPage } from "../components/TrainerPage.vue";
export { default as CustomTrainerEntry } from "../components/CustomTrainerEntry.vue";
export { createCustomTrainerCapture } from "../custom-trainer-capture";
export { default as PresetsPage } from "../components/PresetsPage.vue";
export { bootstrapAccount } from "../account";
export { dailyState, loadDailyState } from "../daily";

/** 이 빌드에 트레이너 일체(교육예제·트레이너·오늘의문제·리더보드·계정)가 있는가 */
export const FEATURE_TRAINER = true;
