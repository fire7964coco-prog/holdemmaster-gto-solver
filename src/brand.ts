/*
 * 빌드별 간판 (2026-08-24 트랙 B ① · 2026-10-22 MB-420 정리).
 *
 * 기본 빌드 = solver.holdemmaster.com(전 기능). 다른 빌드는 webpack이 __APP_TARGET__을 박아 넣고
 * src/variant.ts를 그 빌드의 파일로 바꿔 문다(간판·문구는 거기).
 */
import type { Locale } from "./i18n";
import { VARIANT_TEXT } from "./variant";

declare const __APP_TARGET__: "trainer" | "solo";

/** 트레이너 없는 단독 빌드인가 */
export const IS_SOLO = __APP_TARGET__ === "solo";

/** 네비바·인사 화면 등에 찍히는 앱 이름 (언어별) */
// 빌드 타임 분기 — 죽은 쪽 사전은 압축 단계에서 번들에서 빠진다
export const BRAND_NAME: Record<Locale, string> = IS_SOLO ? VARIANT_TEXT!.brandName : {
    /* 간판 교체 (2026-08-24, 트랙 B — 작업계획.md 가드레일 G3):
     * 「홀덤마스터 GTO 솔버」→「홀덤마스터 트레이너」. 솔버 기능·주소는 그대로이고
     * 간판만 바뀐다. ⚠ "GTO 솔버" 검색 키워드는 탭 제목·메타(i18n.ts DOC_META)와
     * index.html의 H1이 계속 지킨다 — 여기서 빠졌다고 지우면 안 된다.
     * ko만 전략 문서의 확정 표기(GTO 없이)이고, 외국어는 기능명이 이미
     * 「GTO Trainer/GTOトレーナー/训练器/訓練器」로 검수돼 있어 그대로 쓴다. */
    ko: "홀덤마스터 트레이너",
    en: "HoldemMaster GTO Trainer",
    ja: "HoldemMaster GTOトレーナー",
    es: "HoldemMaster GTO Trainer",
    pt: "HoldemMaster GTO Trainer",
    de: "HoldemMaster GTO Trainer",
    zh: "HoldemMaster GTO 训练器",
    "zh-hant": "HoldemMaster GTO 訓練器",
    // fr도 라틴계 통일 표기 — 프랑스 코퍼스가 도구명 Trainer를 번역하지 않는다(리서치 §1-2)
    fr: "HoldemMaster GTO Trainer",
    // id도 라틴계 통일 — 인니 코퍼스가 도구명(solver·trainer)을 번역하지 않는다(리서치 §1-2)
    id: "HoldemMaster GTO Trainer",
    // ms도 라틴계 통일 — 말레이시아 GTO 콘텐츠는 영어이고 Jurulatih는 «사람 코치»다(리서치 §1-3)
    ms: "HoldemMaster GTO Trainer",
    hi: "HoldemMaster GTO Trainer",
    // tr도 라틴계 통일 — 확정표 §1-6 «GTO Trainer»
    tr: "HoldemMaster GTO Trainer",
    // vi는 베트남어 어순 «Trainer GTO» — LaunchScreen 2행과 같은 꼴(확정표 ② · vi 문자열 안 «GTO Trainer» 0).
    // 매니페스트 name·short_name·iOS 홈 화면 라벨은 영어 공용 앱 이름이라 그대로 둔다(확정표 ②).
    vi: "HoldemMaster Trainer GTO",
    // ru는 «GTO-тренажёр»(확정표 §3-1 · share-card brand와 같은 꼴 · ru 문자열 안 «GTO Trainer» 0).
    // 매니페스트 name·short_name·iOS 홈 화면 라벨은 영어 공용 앱 이름이라 그대로 둔다(확정표 §8 #26).
    ru: "HoldemMaster GTO-тренажёр",
    // ar은 «مدرّب GTO من HoldemMaster»(share-card brand · InstallBanner iconAlt와 같은 꼴 · ar 문자열 안 «GTO Trainer» 0).
    // 매니페스트 name·short_name·iOS 홈 화면 라벨은 영어 공용 앱 이름이라 그대로 둔다(확정표 §8 #24).
    ar: "مدرّب GTO من HoldemMaster",
    it: "HoldemMaster GTO Trainer",
    pl: "HoldemMaster GTO Trainer",
    th: "HoldemMaster GTO Trainer",
  };
