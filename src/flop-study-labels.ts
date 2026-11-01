import type { Locale, LocaleDict } from "./i18n";

// 플랍 조회는 /study/ 앱으로 옮겼다. 여기엔 공개 앱에 남은 곳이 쓰는 문구만 둔다:
// 메뉴 이름 · /study/ 앱에서 넘어온 연습의 출처·돌아가기.
const M = {
  ko: {
    navTitle: "플랍 조회",
    practiceSource: "턴 카드 비교에서 가져온 자리 · {method} · 목표 오차 {target}% · 달성 {achieved}%",
    backToStudy: "턴 카드 비교로 돌아가기",
    backToTurnView: "이 턴 전략 보기로 돌아가기",
  },
  en: {
    navTitle: "Flop study",
    practiceSource: "Spot from turn card comparison · {method} · Target error {target}% · Achieved {achieved}%",
    backToStudy: "Back to turn card comparison",
    backToTurnView: "Back to this turn's strategy",
  },
  ja: {
    navTitle: "フロップスタディ",
    practiceSource: "ターンカード比較のスポット · {method} · 目標誤差 {target}% · 到達 {achieved}%",
    backToStudy: "ターンカード比較に戻る",
    backToTurnView: "このターンの戦略に戻る",
  },
  es: {
    navTitle: "Estudiar flop",
    practiceSource: "Spot de Comparar cartas del turn · {method} · Error objetivo {target}% · Alcanzado {achieved}%",
    backToStudy: "Volver a Comparar cartas del turn",
    backToTurnView: "Volver a la estrategia de este turn",
  },
  pt: {
    navTitle: "Estudar flop",
    practiceSource: "Spot de Comparar cartas do turn · {method} · Erro objetivo {target}% · Atingido {achieved}%",
    backToStudy: "Voltar a Comparar cartas do turn",
    backToTurnView: "Voltar à estratégia deste turn",
  },
  de: {
    navTitle: "Flops studieren",
    practiceSource: "Spot aus «Turn-Karten vergleichen» · {method} · Zielfehler {target}% · Erreicht {achieved}%",
    backToStudy: "Zurück zu «Turn-Karten vergleichen»",
    backToTurnView: "Zurück zur Strategie dieses Turns",
  },
  zh: {
    navTitle: "翻牌查询",
    practiceSource: "来自转牌比较的场景 · {method} · 目标误差 {target}% · 已达 {achieved}%",
    backToStudy: "返回转牌比较",
    backToTurnView: "返回这张转牌的策略",
  },
  "zh-hant": {
    navTitle: "翻牌查詢",
    practiceSource: "來自轉牌比較的場景 · {method} · 目標誤差 {target}% · 已達 {achieved}%",
    backToStudy: "返回轉牌比較",
    backToTurnView: "返回這張轉牌的策略",
  },
  fr: {
    navTitle: "Étudier un flop",
    practiceSource: "Spot issu de « Comparer les cartes du turn » · {method} · Erreur cible {target} % · Atteinte {achieved} %",
    backToStudy: "Retour à « Comparer les cartes du turn »",
    backToTurnView: "Retour à la stratégie de ce turn",
  },
  id: {
    navTitle: "Studi flop",
    practiceSource: "Spot dari Bandingkan kartu turn · {method} · Target galat {target}% · Tercapai {achieved}%",
    backToStudy: "Kembali ke Bandingkan kartu turn",
    backToTurnView: "Kembali ke strategi turn ini",
  },
  ms: {
    navTitle: "Kajian flop",
    practiceSource: "Spot daripada Bandingkan kad turn · {method} · Ralat sasaran {target}% · Dicapai {achieved}%",
    backToStudy: "Kembali ke Bandingkan kad turn",
    backToTurnView: "Kembali ke strategi turn ini",
  },
  hi: {
    navTitle: "Flop अध्ययन",
    practiceSource: "Turn कार्ड तुलना से लिया गया स्पॉट · {method} · लक्ष्य त्रुटि {target}% · प्राप्त {achieved}%",
    backToStudy: "Turn कार्ड तुलना पर वापस जाएँ",
    backToTurnView: "इस Turn की रणनीति पर वापस जाएँ",
  },
  tr: {
    navTitle: "Flop çalışması",
    practiceSource: "Turn kartı karşılaştırmasından gelen spot · {method} · Hedef exploitability %{target} · Ulaşılan %{achieved}",
    backToStudy: "Turn kartı karşılaştırmasına dön",
    backToTurnView: "Bu turn'ün stratejisine dön",
  },
  vi: {
    navTitle: "Tra cứu flop",
    practiceSource: "Spot từ So sánh lá turn · {method} · Exploitability mục tiêu {target}% · Đạt {achieved}%",
    backToStudy: "Quay lại So sánh lá turn",
    backToTurnView: "Quay lại chiến lược turn này",
  },
  ru: {
    navTitle: "Стратегии флопа",
    practiceSource: "Спот из сравнения карт тёрна · {method} · целевая погрешность {target}% · достигнуто {achieved}%",
    backToStudy: "Назад к сравнению карт тёрна",
    backToTurnView: "Назад к стратегии на этом тёрне",
  },
  ar: {
    navTitle: "دراسة الفلوب",
    practiceSource: "موقف من مقارنة أوراق التيرن · {method} · الخطأ المستهدف ⁦{target}%⁩ · المحقَّق ⁦{achieved}%⁩",
    backToStudy: "رجوع إلى مقارنة أوراق التيرن",
    backToTurnView: "رجوع إلى استراتيجية هذا التيرن",
  },
  it: {
    navTitle: "Studio dei flop",
    practiceSource: "Spot da «Confronto delle carte del turn» · {method} · Errore obiettivo {target}% · Errore raggiunto {achieved}%",
    backToStudy: "Torna al confronto delle carte del turn",
    backToTurnView: "Torna alla strategia di questo turn",
  },
  pl: {
    navTitle: "Przegląd flopów",
    practiceSource: "Spot z porównania kart turnu · {method} · Docelowy błąd {target}% · Osiągnięty błąd {achieved}%",
    backToStudy: "Wróć do porównania kart turnu",
    backToTurnView: "Wróć do strategii na tym turnie",
  },
  th: {
    navTitle: "ศึกษาฟลอป",
    practiceSource: "สถานการณ์จาก “เปรียบเทียบไพ่เทิร์น” · {method} · ค่าคลาดเคลื่อนเป้าหมาย {target}% · ค่าคลาดเคลื่อนที่ได้ {achieved}%",
    backToStudy: "กลับไปเปรียบเทียบไพ่เทิร์น",
    backToTurnView: "กลับไปดูกลยุทธ์ของเทิร์นนี้",
  },
};
export type FlopStudyLabels = Record<keyof typeof M.ko, string>;
// This assignment checks both the locale set and every required key at build time.
const checkedLabels: LocaleDict<FlopStudyLabels> = M;
export const flopStudyLabels = (locale: Locale): FlopStudyLabels => checkedLabels[locale];
