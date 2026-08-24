/*
 * 빌드별 간판 (2026-08-24, 트랙 B ① 빌드 2벌 분기).
 *
 * 같은 저장소가 두 벌로 빌드된다 — webpack DefinePlugin이 __APP_TARGET__을 박아 넣고,
 * 죽은 쪽 사전은 압축 단계에서 번들에서 빠진다.
 *   - "trainer"  = solver.holdemmaster.com (전 기능)
 *   - "npokers"  = 스토어용 순수 솔버 (npokers.com 예정)
 *
 * ⚠ npokers 이름은 «소문자 워드마크»로 통일한다(도메인 npokers.com 표기 그대로).
 *   대소문자 표기를 바꾸려면 여기 + 매니페스트(public-npokers/) + index-npokers.html
 *   세 곳을 함께 고칠 것.
 */
import type { Locale } from "./i18n";

declare const __APP_TARGET__: "trainer" | "npokers";

export const APP_TARGET = __APP_TARGET__;
export const IS_NPOKERS = __APP_TARGET__ === "npokers";

/** 네비바·인사 화면 등에 찍히는 앱 이름 (언어별) */
export const BRAND_NAME: Record<Locale, string> = IS_NPOKERS
  ? {
      ko: "npokers",
      en: "npokers",
      ja: "npokers",
      es: "npokers",
      pt: "npokers",
      de: "npokers",
      zh: "npokers",
      "zh-hant": "npokers",
    }
  : {
      ko: "홀덤마스터 GTO 솔버",
      en: "HoldemMaster GTO Solver",
      ja: "HoldemMaster GTOソルバー",
      es: "HoldemMaster GTO Solver",
      pt: "HoldemMaster GTO Solver",
      de: "HoldemMaster GTO Solver",
      // 「求解器」=간체 / 「解算器」=번체 정착역 — NavBar.vue의 기존 주석 참조
      zh: "HoldemMaster GTO 求解器",
      "zh-hant": "HoldemMaster GTO 解算器",
    };
