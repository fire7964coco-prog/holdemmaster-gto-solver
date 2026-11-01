import type { Locale, LocaleDict } from "./i18n";

// 플랍 통계는 /study/ 앱으로 옮겼다. 여기엔 공개 앱에 남은 곳이 쓰는 문구만 둔다:
// 메뉴 이름.
const M = {
  ko: {
    navTitle: "플랍 통계",
  },
  en: {
    navTitle: "Flop reports",
  },
  ja: {
    navTitle: "フロップレポート",
  },
  es: {
    navTitle: "Informes de flop",
  },
  pt: {
    navTitle: "Relatórios de flop",
  },
  de: {
    navTitle: "Flop-Reports",
  },
  zh: {
    navTitle: "翻牌报告",
  },
  "zh-hant": {
    navTitle: "翻牌報告",
  },
  fr: {
    navTitle: "Rapports de flop",
  },
  id: {
    navTitle: "Laporan flop",
  },
  ms: {
    navTitle: "Laporan flop",
  },
  hi: {
    navTitle: "Flop रिपोर्ट",
  },
  tr: {
    navTitle: "Flop raporları",
  },
  vi: {
    navTitle: "Báo cáo flop",
  },
  ru: {
    navTitle: "Отчёты по флопам",
  },
  ar: {
    navTitle: "تقارير الفلوب",
  },
  it: {
    navTitle: "Statistiche flop",
  },
  pl: {
    navTitle: "Statystyki flopów",
  },
  th: {
    navTitle: "สถิติฟลอป",
  },
  uk: {
    navTitle: "Статистика флопів",
  },
};

export type FlopReportLabels = Record<keyof typeof M.ko, string>;
// This assignment checks both the locale set and every required key at build time.
const checkedLabels: LocaleDict<FlopReportLabels> = M;
export const flopReportLabels = (locale: Locale): FlopReportLabels => checkedLabels[locale];
