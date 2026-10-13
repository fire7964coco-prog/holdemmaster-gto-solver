// GTO 트레이너 «모든 플랍» 문구 (설계안 참고자료/트레이너확대_설계안_2026-10-13.md · 3단계 = 15언어)
// 용어는 같은 언어의 기존 화면을 따른다: 다시 시도·불러오는 중 = 복기(hand-review-labels) · «허용» = 트레이너 verdictGood ·
// 교육 예제 = 사이드바 presets · 핸드 = 트레이너 myHand/nextHand.
import type { Locale, LocaleDict } from "./i18n";

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

export type FlopTrainerLabels = typeof ko;

const checkedLabels: LocaleDict<FlopTrainerLabels> = {
  ko,
  en: {
    sourceBasic: "Source: Basic",
    sourceFlop: "Source: All flops",
    sourceHelp:
      "All flops: questions come from spots and flops pre-solved on our server (internet required). Basic: decision points from the study spots (works offline).",
    closeOnly: "Close spots only",
    closeHelp: "Only deals hands where the best and second-best actions are within the “Acceptable” EV margin.",
    loading: "Loading flop…",
    offline: "An internet connection is required.",
    failed: "Couldn't load a question.",
    retry: "Retry",
    useBasic: "Practice basic questions",
    again: "Same hand again",
  },
  ja: {
    sourceBasic: "出題: 基本",
    sourceFlop: "出題: すべてのフロップ",
    sourceHelp:
      "すべてのフロップ: サーバーで事前計算した状況・フロップから出題します（インターネットが必要）。基本: 学習スポットの決定ポイントから出題します（オフラインでも使えます）。",
    closeOnly: "僅差の判断のみ",
    closeHelp: "最善のアクションと2番目のアクションのEV差が「許容」の範囲内にあるハンドだけを出題します。",
    loading: "フロップを取得中…",
    offline: "インターネット接続が必要です。",
    failed: "問題を取得できませんでした。",
    retry: "再試行",
    useBasic: "基本問題で練習する",
    again: "同じハンドをもう一度",
  },
  es: {
    sourceBasic: "Preguntas: básicas",
    sourceFlop: "Preguntas: todos los flops",
    sourceHelp:
      "Todos los flops: las preguntas salen de situaciones y flops precalculados en nuestro servidor (requiere internet). Básicas: puntos de decisión de los spots de estudio (funciona sin conexión).",
    closeOnly: "Solo decisiones ajustadas",
    closeHelp:
      "Solo reparte manos en las que la diferencia de EV entre la mejor acción y la segunda está dentro del margen “Aceptable”.",
    loading: "Cargando flop…",
    offline: "Se necesita conexión a internet.",
    failed: "No se pudo cargar la pregunta.",
    retry: "Reintentar",
    useBasic: "Practicar preguntas básicas",
    again: "Repetir la misma mano",
  },
  pt: {
    sourceBasic: "Questões: básicas",
    sourceFlop: "Questões: todos os flops",
    sourceHelp:
      "Todos os flops: as questões vêm de situações e flops pré-calculados no nosso servidor (requer internet). Básicas: pontos de decisão dos spots de estudo (funciona offline).",
    closeOnly: "Só decisões apertadas",
    closeHelp:
      "Só sorteia mãos em que a diferença de EV entre a melhor ação e a segunda fica dentro da margem “Aceitável”.",
    loading: "Carregando flop…",
    offline: "É preciso conexão com a internet.",
    failed: "Não foi possível carregar a questão.",
    retry: "Tentar de novo",
    useBasic: "Treinar questões básicas",
    again: "Repetir a mesma mão",
  },
  de: {
    sourceBasic: "Aufgaben: Basis",
    sourceFlop: "Aufgaben: Alle Flops",
    sourceHelp:
      "Alle Flops: Die Aufgaben kommen aus Situationen und Flops, die auf unserem Server vorberechnet sind (Internet nötig). Basis: Entscheidungspunkte aus den Lernspots (funktioniert offline).",
    closeOnly: "Nur knappe Entscheidungen",
    closeHelp:
      "Gibt nur Hände, bei denen der EV-Unterschied zwischen bester und zweitbester Aktion innerhalb der Grenze „Vertretbar“ liegt.",
    loading: "Flop wird geladen…",
    offline: "Eine Internetverbindung ist nötig.",
    failed: "Die Aufgabe konnte nicht geladen werden.",
    retry: "Erneut versuchen",
    useBasic: "Basis-Aufgaben üben",
    again: "Gleiche Hand noch mal",
  },
  zh: {
    sourceBasic: "出题：基础",
    sourceFlop: "出题：所有翻牌",
    sourceHelp:
      "所有翻牌：从服务器上预先计算的场景和翻牌中出题（需要联网）。基础：从教学案例的决策点出题（离线也能用）。",
    closeOnly: "只出接近的决策",
    closeHelp: "只出最佳动作与第二动作的 EV 差距在“可以接受”范围内的手牌。",
    loading: "正在加载翻牌…",
    offline: "需要联网。",
    failed: "未能加载题目。",
    retry: "重试",
    useBasic: "改做基础题",
    again: "同一手牌再做一次",
  },
  "zh-hant": {
    sourceBasic: "出題：基礎",
    sourceFlop: "出題：所有翻牌",
    sourceHelp:
      "所有翻牌：從伺服器上預先計算的情境和翻牌中出題（需要網路連線）。基礎：從教學案例的決策點出題（離線也能用）。",
    closeOnly: "只出接近的決策",
    closeHelp: "只出最佳動作與第二動作的 EV 差距在「可以接受」範圍內的手牌。",
    loading: "正在載入翻牌…",
    offline: "需要網路連線。",
    failed: "未能載入題目。",
    retry: "重試",
    useBasic: "改做基礎題",
    again: "同一手牌再做一次",
  },
  fr: {
    sourceBasic: "Questions : de base",
    sourceFlop: "Questions : tous les flops",
    sourceHelp:
      "Tous les flops : les questions viennent de situations et de flops précalculés sur notre serveur (internet requis). De base : points de décision des spots d'étude (fonctionne hors ligne).",
    closeOnly: "Décisions serrées uniquement",
    closeHelp:
      "Ne donne que des mains où l'écart d'EV entre la meilleure action et la deuxième reste dans la marge « Acceptable ».",
    loading: "Chargement du flop…",
    offline: "Une connexion internet est nécessaire.",
    failed: "Impossible de charger la question.",
    retry: "Réessayer",
    useBasic: "S'entraîner sur les questions de base",
    again: "Rejouer la même main",
  },
  id: {
    sourceBasic: "Soal: Dasar",
    sourceFlop: "Soal: Semua flop",
    sourceHelp:
      "Semua flop: soal diambil dari situasi dan flop yang sudah dihitung sebelumnya di server kami (perlu internet). Dasar: titik keputusan dari spot belajar (bisa offline).",
    closeOnly: "Hanya keputusan tipis",
    closeHelp: "Hanya memberi hand yang selisih EV antara aksi terbaik dan aksi kedua masih dalam batas “Cukup baik”.",
    loading: "Memuat flop…",
    offline: "Perlu koneksi internet.",
    failed: "Gagal memuat soal.",
    retry: "Coba lagi",
    useBasic: "Latihan soal dasar",
    again: "Ulangi hand yang sama",
  },
  ms: {
    sourceBasic: "Soalan: Asas",
    sourceFlop: "Soalan: Semua flop",
    sourceHelp:
      "Semua flop: soalan diambil daripada keadaan dan flop yang dikira awal di pelayan kami (perlu internet). Asas: titik keputusan daripada spot belajar (boleh digunakan di luar talian).",
    closeOnly: "Keputusan tipis sahaja",
    closeHelp:
      "Hanya memberi tangan yang beza EV antara tindakan terbaik dengan tindakan kedua masih dalam had “Boleh diterima”.",
    loading: "Memuatkan flop…",
    offline: "Sambungan internet diperlukan.",
    failed: "Soalan gagal dimuatkan.",
    retry: "Cuba semula",
    useBasic: "Berlatih soalan asas",
    again: "Ulang tangan yang sama",
  },
  hi: {
    sourceBasic: "सवाल: बेसिक",
    sourceFlop: "सवाल: सभी Flop",
    sourceHelp:
      "सभी Flop: सवाल हमारे सर्वर पर पहले से गणना की गई स्थितियों और Flop से आते हैं (इंटरनेट ज़रूरी)। बेसिक: अभ्यास स्पॉट के निर्णय बिंदुओं से (ऑफ़लाइन भी चलता है)।",
    closeOnly: "सिर्फ़ करीबी निर्णय",
    closeHelp:
      "सिर्फ़ वे हैंड देता है जिनमें सबसे अच्छे और दूसरे एक्शन के EV का अंतर “स्वीकार्य” सीमा के भीतर हो।",
    loading: "Flop लोड हो रहा है…",
    offline: "इंटरनेट कनेक्शन ज़रूरी है।",
    failed: "सवाल लोड नहीं हो सका।",
    retry: "फिर कोशिश करें",
    useBasic: "बेसिक सवालों से अभ्यास करें",
    again: "वही हैंड फिर से",
  },
  tr: {
    sourceBasic: "Sorular: Temel",
    sourceFlop: "Sorular: Tüm floplar",
    sourceHelp:
      "Tüm floplar: sorular sunucumuzda önceden hesaplanmış durum ve floplardan gelir (internet gerekir). Temel: örnek spotlardaki karar noktalarından gelir (çevrimdışı da çalışır).",
    closeOnly: "Sadece yakın kararlar",
    closeHelp:
      "Yalnızca en iyi aksiyonla ikinci aksiyon arasındaki EV farkı “Kabul edilebilir” sınırı içinde kalan elleri verir.",
    loading: "Flop yükleniyor…",
    offline: "İnternet bağlantısı gerekiyor.",
    failed: "Soru yüklenemedi.",
    retry: "Tekrar dene",
    useBasic: "Temel sorularla çalış",
    again: "Aynı eli tekrar çöz",
  },
  vi: {
    sourceBasic: "Câu hỏi: Cơ bản",
    sourceFlop: "Câu hỏi: Tất cả flop",
    sourceHelp:
      "Tất cả flop: câu hỏi lấy từ các tình huống và flop đã tính sẵn trên máy chủ của chúng tôi (cần internet). Cơ bản: các điểm quyết định trong Spot mẫu (dùng được khi ngoại tuyến).",
    closeOnly: "Chỉ quyết định sát nút",
    closeHelp:
      "Chỉ đưa ra những tay bài có chênh lệch EV giữa hành động tốt nhất và hành động thứ hai nằm trong ngưỡng “Chấp nhận được”.",
    loading: "Đang tải flop…",
    offline: "Cần kết nối internet.",
    failed: "Không tải được câu hỏi.",
    retry: "Thử lại",
    useBasic: "Luyện câu hỏi cơ bản",
    again: "Làm lại tay bài này",
  },
  ru: {
    sourceBasic: "Задачи: базовые",
    sourceFlop: "Задачи: все флопы",
    sourceHelp:
      "Все флопы: задачи берутся из ситуаций и флопов, заранее рассчитанных на нашем сервере (нужен интернет). Базовые: точки решения из учебных спотов (работает офлайн).",
    closeOnly: "Только близкие решения",
    closeHelp: "Даёт только руки, где разница EV между лучшим и вторым действием укладывается в порог «Допустимо».",
    loading: "Загрузка флопа…",
    offline: "Нужно подключение к интернету.",
    failed: "Не удалось загрузить задачу.",
    retry: "Повторить",
    useBasic: "Решать базовые задачи",
    again: "Эту же руку ещё раз",
  },
};

export const flopTrainerLabels = (locale: Locale): FlopTrainerLabels => checkedLabels[locale];

// 보드 고르기 (설계안 §5 · 2단계 = ko·en만 · 3단계에서 15언어로 채우고 LocaleDict로 바꾼다).
// 축·칸 이름과 «플랍 n개»는 플랍 통계(flop-report-labels), 카드 고르기 안내·닫기는 플랍 조회(flop-study-labels)를 쓴다.
const boardKo = {
  boardAll: "보드: 전체",
  boardChip: "보드: {value}",
  boardHelp: "출제할 플랍을 높은 카드·무늬·페어·연결성으로 거르거나 특정 플랍 하나로 정합니다.",
  boardRule: "한 줄 안에서는 하나라도 맞으면, 줄끼리는 모두 맞는 플랍만 냅니다.",
  specificFlop: "특정 플랍",
  pickCards: "카드 고르기",
  boardReset: "전체로 되돌리기",
  boardEmpty: "이 조합의 플랍이 없습니다.",
};
export type FlopBoardLabels = typeof boardKo;
const boardLabels: Partial<Record<Locale, FlopBoardLabels>> = {
  ko: boardKo,
  en: {
    boardAll: "Board: All",
    boardChip: "Board: {value}",
    boardHelp: "Filter the flops you get by high card, suits, pairing and connectedness, or fix one specific flop.",
    boardRule: "Within a row any choice can match; across rows, a flop must match every row.",
    specificFlop: "Specific flop",
    pickCards: "Pick cards",
    boardReset: "Reset to all",
    boardEmpty: "No flops match this combination.",
  },
};
export const flopBoardLabels = (locale: Locale): FlopBoardLabels => boardLabels[locale] ?? boardLabels.en!;
