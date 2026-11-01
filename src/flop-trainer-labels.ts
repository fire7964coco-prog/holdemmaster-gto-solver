// GTO 트레이너 «출제» 칩 · «같은 핸드 다시». «모든 플랍» 문제 자체는 /study/ 앱으로 옮겼다.
import type { Locale, LocaleDict } from "./i18n";

const ko = {
  sourceBasic: "출제: 기본",
  sourceHelp:
    "모든 플랍: 서버에 미리 계산해 둔 상황·플랍에서 문제를 냅니다(인터넷 필요). 기본: 교육 예제의 결정 지점에서 냅니다(오프라인에서도 됨).",
  again: "같은 핸드 다시",
};

export type FlopTrainerLabels = typeof ko;

const checkedLabels: LocaleDict<FlopTrainerLabels> = {
  ko,
  en: {
    sourceBasic: "Source: Basic",
    sourceHelp:
      "All flops: questions come from spots and flops pre-solved on our server (internet required). Basic: decision points from the study spots (works offline).",
    again: "Same hand again",
  },
  ja: {
    sourceBasic: "出題: 基本",
    sourceHelp:
      "すべてのフロップ: サーバーで事前計算した状況・フロップから出題します（インターネットが必要）。基本: 学習スポットの決定ポイントから出題します（オフラインでも使えます）。",
    again: "同じハンドをもう一度",
  },
  es: {
    sourceBasic: "Preguntas: básicas",
    sourceHelp:
      "Todos los flops: las preguntas salen de situaciones y flops precalculados en nuestro servidor (requiere internet). Básicas: puntos de decisión de los spots de estudio (funciona sin conexión).",
    again: "Repetir la misma mano",
  },
  pt: {
    sourceBasic: "Questões: básicas",
    sourceHelp:
      "Todos os flops: as questões vêm de situações e flops pré-calculados no nosso servidor (requer internet). Básicas: pontos de decisão dos spots de estudo (funciona offline).",
    again: "Repetir a mesma mão",
  },
  de: {
    sourceBasic: "Aufgaben: Basis",
    sourceHelp:
      "Alle Flops: Die Aufgaben kommen aus Situationen und Flops, die auf unserem Server vorberechnet sind (Internet nötig). Basis: Entscheidungspunkte aus den Lernspots (funktioniert offline).",
    again: "Gleiche Hand noch mal",
  },
  zh: {
    sourceBasic: "出题：基础",
    sourceHelp:
      "所有翻牌：从服务器上预先计算的场景和翻牌中出题（需要联网）。基础：从教学案例的决策点出题（离线也能用）。",
    again: "同一手牌再做一次",
  },
  "zh-hant": {
    sourceBasic: "出題：基礎",
    sourceHelp:
      "所有翻牌：從伺服器上預先計算的情境和翻牌中出題（需要網路連線）。基礎：從教學案例的決策點出題（離線也能用）。",
    again: "同一手牌再做一次",
  },
  fr: {
    sourceBasic: "Questions : de base",
    sourceHelp:
      "Tous les flops : les questions viennent de situations et de flops précalculés sur notre serveur (internet requis). De base : points de décision des spots d'étude (fonctionne hors ligne).",
    again: "Rejouer la même main",
  },
  id: {
    sourceBasic: "Soal: Dasar",
    sourceHelp:
      "Semua flop: soal diambil dari situasi dan flop yang sudah dihitung sebelumnya di server kami (perlu internet). Dasar: titik keputusan dari spot belajar (bisa offline).",
    again: "Ulangi hand yang sama",
  },
  ms: {
    sourceBasic: "Soalan: Asas",
    sourceHelp:
      "Semua flop: soalan diambil daripada keadaan dan flop yang dikira awal di pelayan kami (perlu internet). Asas: titik keputusan daripada spot belajar (boleh digunakan di luar talian).",
    again: "Ulang tangan yang sama",
  },
  hi: {
    sourceBasic: "सवाल: बेसिक",
    sourceHelp:
      "सभी Flop: सवाल हमारे सर्वर पर पहले से गणना की गई स्थितियों और Flop से आते हैं (इंटरनेट ज़रूरी)। बेसिक: अभ्यास स्पॉट के निर्णय बिंदुओं से (ऑफ़लाइन भी चलता है)।",
    again: "वही हैंड फिर से",
  },
  tr: {
    sourceBasic: "Sorular: Temel",
    sourceHelp:
      "Tüm floplar: sorular sunucumuzda önceden hesaplanmış durum ve floplardan gelir (internet gerekir). Temel: örnek spotlardaki karar noktalarından gelir (çevrimdışı da çalışır).",
    again: "Aynı eli tekrar çöz",
  },
  vi: {
    sourceBasic: "Câu hỏi: Cơ bản",
    sourceHelp:
      "Tất cả flop: câu hỏi lấy từ các tình huống và flop đã tính sẵn trên máy chủ của chúng tôi (cần internet). Cơ bản: các điểm quyết định trong Spot mẫu (dùng được khi ngoại tuyến).",
    again: "Làm lại tay bài này",
  },
  ru: {
    sourceBasic: "Задачи: базовые",
    sourceHelp:
      "Все флопы: задачи берутся из ситуаций и флопов, заранее рассчитанных на нашем сервере (нужен интернет). Базовые: точки решения из учебных спотов (работает офлайн).",
    again: "Эту же руку ещё раз",
  },
  ar: {
    sourceBasic: "الأسئلة: الأساسية",
    sourceHelp:
      "كل الفلوبات: الأسئلة مأخوذة من مواقف وفلوبات محسوبة مسبقًا على خادمنا (يتطلب الإنترنت). الأساسية: نقاط القرار من المواقف التدريبية (تعمل دون اتصال).",
    again: "اليد نفسها مرة أخرى",
  },
  it: {
    sourceBasic: "Fonte: Base",
    sourceHelp:
      "[Fonte: Tutti i flop]: domande da spot e flop precalcolati sul nostro server (serve internet). [Fonte: Base]: decisioni tratte dagli «Esempi» (disponibili offline).",
    again: "Ripeti la stessa mano",
  },
  pl: {
    sourceBasic: "Źródło: podstawowe",
    sourceHelp:
      "„Źródło: wszystkie flopy” — pytania pochodzą ze spotów i flopów obliczonych na naszym serwerze (wymagany internet). „Źródło: podstawowe” — decyzje z przykładów do nauki (działa offline).",
    again: "Powtórz tę rękę",
  },
  th: {
    sourceBasic: "แหล่งโจทย์: พื้นฐาน",
    sourceHelp:
      "“แหล่งโจทย์: ฟลอปทั้งหมด” ใช้โจทย์จากสถานการณ์และฟลอปที่คำนวณไว้บนเซิร์ฟเวอร์ของเรา (ต้⁠อ⁠งเชื่อมต่ออิ⁠น⁠เ⁠ท⁠อ⁠ร์⁠เ⁠น็⁠ต) ส่วน “แหล่งโจทย์: พื้นฐาน” ใช้จุดตัดสินใจจากสถานการณ์สำหรับศึกษา (ใช้แบบอ⁠อ⁠ฟ⁠ไ⁠ล⁠น์ได้)",
    again: "ฝึกมือเดิมอีกครั้ง",
  },
};

export const flopTrainerLabels = (locale: Locale): FlopTrainerLabels => checkedLabels[locale];
