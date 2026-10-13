// GTO 트레이너 «모든 플랍» 문구 (설계안 참고자료/트레이너확대_설계안_2026-10-13.md · 2단계 = ko·en)
// ⚠ 3단계에서 13언어를 채우고 검수장 판정을 받는다 — 그 전까지 나머지 언어는 en을 보여 준다.
import type { Locale } from "./i18n";

const ko = {
  sourceBasic: "출제: 기본",
  sourceFlop: "출제: 모든 플랍",
  sourceHelp:
    "모든 플랍: 서버에 미리 계산해 둔 상황·플랍에서 문제를 냅니다(인터넷 필요). 기본: 교육 예제의 결정 지점에서 냅니다(오프라인에서도 됨).",
  closeOnly: "가까운 결정만",
  closeHelp: "가장 좋은 액션과 두 번째 액션의 EV 차이가 «허용 가능» 경계 안인 핸드만 냅니다.",
  loading: "플랍을 받는 중…",
  offline: "인터넷 연결이 필요합니다.",
  failed: "문제를 받지 못했습니다.",
  retry: "다시 시도",
  useBasic: "기본 문제로 풀기",
  again: "같은 핸드 다시",
};

const en: typeof ko = {
  sourceBasic: "Source: Basic",
  sourceFlop: "Source: All flops",
  sourceHelp:
    "All flops: questions come from spots and flops pre-solved on our server (internet required). Basic: decision points from the study spots (works offline).",
  closeOnly: "Close spots only",
  closeHelp: "Only deals hands where the best and second-best actions are within the «acceptable» EV margin.",
  loading: "Loading flop…",
  offline: "An internet connection is required.",
  failed: "Couldn't load a question.",
  retry: "Try again",
  useBasic: "Practice basic questions",
  again: "Same hand again",
};

export type FlopTrainerLabels = typeof ko;

export const flopTrainerLabels = (locale: Locale): FlopTrainerLabels => (locale === "ko" ? ko : en);
