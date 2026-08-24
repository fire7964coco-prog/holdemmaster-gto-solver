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
    };
