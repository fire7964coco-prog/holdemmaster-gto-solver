/*
 * npokers 빌드용 «빈 이음새» — trainer-enabled.ts의 짝.
 *
 * npokers 빌드에서 webpack alias("@features")가 trainer-enabled.ts 대신 이 파일을
 * 물게 한다. 이 파일은 트레이너 쪽 모듈을 하나도 import하지 않으므로, 트레이너·
 * 교육예제·오늘의문제·리더보드·계정(Supabase 포함) 코드가 번들에 아예 들어가지 않는다.
 *
 * ⚠ export 이름·형태는 trainer-enabled.ts와 반드시 짝을 이룰 것.
 * ⚠ 아래 컴포넌트·함수는 «호출되지 않는 것»이 정상이다 — 화면 쪽은 전부
 *   FEATURE_TRAINER로 숨겨져 있고, 이 스텁은 타입과 참조를 만족시키는 안전망이다.
 */
import { defineComponent, reactive } from "vue";

/** 렌더될 일 없는 빈 화면 (sideView가 trainer/presets로 갈 길이 모두 막혀 있다) */
const EmptyPage = defineComponent({ name: "EmptyPage", render: () => null });

export const TrainerPage = EmptyPage;
export const CustomTrainerEntry = EmptyPage;
export const createCustomTrainerCapture = () => null;
export const PresetsPage = EmptyPage;

/** 계정 기능 없음 — 로그인 복귀 처리도 없다 */
export const bootstrapAccount = async (): Promise<boolean> => false;

/** 오늘의 문제 없음 — AboutPage의 완료 표시가 참조하는 최소 형태만 유지 */
export const dailyState = reactive({ done: false, lossBb: 0, streak: 0, bestStreak: 0 });
export const loadDailyState = () => {};

/** 이 빌드에 트레이너 일체(교육예제·트레이너·오늘의문제·리더보드·계정)가 있는가 */
export const FEATURE_TRAINER = false;
