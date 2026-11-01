/**
 * 빌드별 덮어쓰기 문구 — 기본 빌드는 없음(null).
 * 다른 빌드는 webpack이 이 모듈을 그 빌드의 파일로 바꿔 문다(build/variants.js).
 */
import type { Locale, pick } from "./i18n";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Partial<Record<Locale, any>>;

export type VariantText = {
  brandName: Record<Locale, string>;
  docMeta: Record<Locale, { title: string; description: string }>;
  launchTitle: string;
  errorLogTitle: Parameters<typeof pick>;
  utmSource: string;
  about: Dict;
  install: Dict;
  guide: Dict;
  treeConfig: Dict;
};

export const VARIANT_TEXT: VariantText | null = null;
