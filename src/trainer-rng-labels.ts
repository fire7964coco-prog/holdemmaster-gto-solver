// RNG 연습 문구 — 15언어(3단계) · GTO 트레이너와 «내 스팟» 연습이 같이 쓴다 · 판정명(최선·허용)은 같은 언어 verdictBest·verdictGood 용어를 따른다
import type { LocaleDict } from "./i18n";

export const RNG_M = {
  ko: {
    mode: { off: "RNG: 끔", high: "RNG: High", low: "RNG: Low" },
    modeHelp:
      "무작위 숫자(1~100) 연습 — 문제마다 숫자를 받고 그 숫자에 해당하는 액션을 고릅니다. High: 높은 숫자일수록 공격적인 액션 · Low: 낮은 숫자일수록 공격적인 액션. 오늘의 문제에는 쓰지 않습니다.",
    bandsTitle: "숫자 구간",
    yourNumber: "내 숫자",
    noteBest: (action: string) => `숫자에 맞는 액션(${action})을 골랐습니다.`,
    noteMixed: (action: string) => `솔버가 섞는 액션이라 허용 — 이 숫자에선 ${action}입니다.`,
    noteOther: (action: string) => `이 숫자에선 ${action}입니다.`,
  },
  en: {
    mode: { off: "RNG: Off", high: "RNG: High", low: "RNG: Low" },
    modeHelp:
      "Random number (1–100) practice — each hand gets a number, and you pick the action that number points to. High: higher numbers mean more aggressive actions · Low: lower numbers mean more aggressive actions. Not used for the Daily Puzzle.",
    bandsTitle: "RNG ranges",
    yourNumber: "Your number",
    noteBest: (action: string) => `You picked the action for this number (${action}).`,
    noteMixed: (action: string) =>
      `Acceptable — the solver mixes this action, but this number calls for ${action}.`,
    noteOther: (action: string) => `This number calls for ${action}.`,
  },
  ja: {
    mode: { off: "RNG: オフ", high: "RNG: High", low: "RNG: Low" },
    modeHelp:
      "乱数（1〜100）練習 — 問題ごとに数字が出て、その数字に対応するアクションを選びます。High: 数字が大きいほどアグレッシブなアクション · Low: 数字が小さいほどアグレッシブなアクション。今日のGTO問題では使いません。",
    bandsTitle: "数字の範囲",
    yourNumber: "あなたの数字",
    noteBest: (action: string) => `数字に合ったアクション（${action}）を選びました。`,
    noteMixed: (action: string) => `ソルバーが混ぜるアクションなので許容 — この数字では${action}です。`,
    noteOther: (action: string) => `この数字では${action}です。`,
  },
  es: {
    mode: { off: "RNG: Apagado", high: "RNG: High", low: "RNG: Low" },
    modeHelp:
      "Práctica con número aleatorio (1–100): cada mano recibe un número y eliges la acción que ese número indica. High: cuanto más alto el número, más agresiva la acción · Low: cuanto más bajo el número, más agresiva la acción. No se usa en el Reto del día.",
    bandsTitle: "Rangos de RNG",
    yourNumber: "Tu número",
    noteBest: (action: string) => `Elegiste la acción de este número (${action}).`,
    noteMixed: (action: string) =>
      `Aceptable: el solver mezcla esta acción, pero este número indica ${action}.`,
    noteOther: (action: string) => `Este número indica ${action}.`,
  },
  pt: {
    mode: { off: "RNG: Desligado", high: "RNG: High", low: "RNG: Low" },
    modeHelp:
      "Treino com número aleatório (1–100): cada mão recebe um número e você escolhe a ação que esse número indica. High: quanto maior o número, mais agressiva a ação · Low: quanto menor o número, mais agressiva a ação. Não é usado no Desafio do dia.",
    bandsTitle: "Faixas de RNG",
    yourNumber: "Seu número",
    noteBest: (action: string) => `Você escolheu a ação deste número (${action}).`,
    noteMixed: (action: string) =>
      `Aceitável: o solver mistura esta ação, mas este número indica ${action}.`,
    noteOther: (action: string) => `Este número indica ${action}.`,
  },
  de: {
    mode: { off: "RNG: Aus", high: "RNG: High", low: "RNG: Low" },
    modeHelp:
      "Zufallszahl-Training (1–100): Jede Hand bekommt eine Zahl, und du wählst die Aktion, auf die diese Zahl zeigt. High: Je höher die Zahl, desto aggressiver die Aktion · Low: Je niedriger die Zahl, desto aggressiver die Aktion. Nicht für die Tagesaufgabe.",
    bandsTitle: "RNG-Bereiche",
    yourNumber: "Deine Zahl",
    noteBest: (action: string) => `Du hast die Aktion für diese Zahl gewählt (${action}).`,
    noteMixed: (action: string) =>
      `Vertretbar – der Solver mischt diese Aktion, aber diese Zahl verlangt ${action}.`,
    noteOther: (action: string) => `Diese Zahl verlangt ${action}.`,
  },
  zh: {
    mode: { off: "RNG：关", high: "RNG：High", low: "RNG：Low" },
    modeHelp:
      "随机数（1–100）练习 — 每题给一个数字，按这个数字选出对应的动作。High：数字越大，动作越激进 · Low：数字越小，动作越激进。今日题目不使用。",
    bandsTitle: "数字区间",
    yourNumber: "我的数字",
    noteBest: (action: string) => `选对了这个数字对应的动作（${action}）。`,
    noteMixed: (action: string) => `求解器会混合使用这个动作，可以接受 — 但这个数字对应${action}。`,
    noteOther: (action: string) => `这个数字对应${action}。`,
  },
  "zh-hant": {
    mode: { off: "RNG：關", high: "RNG：High", low: "RNG：Low" },
    modeHelp:
      "隨機數（1–100）練習 — 每題給一個數字，依這個數字選出對應的動作。High：數字越大，動作越激進 · Low：數字越小，動作越激進。今日題目不使用。",
    bandsTitle: "數字區間",
    yourNumber: "我的數字",
    noteBest: (action: string) => `選對了這個數字對應的動作（${action}）。`,
    noteMixed: (action: string) => `解算器會混合使用這個動作，可以接受 — 但這個數字對應${action}。`,
    noteOther: (action: string) => `這個數字對應${action}。`,
  },
  fr: {
    mode: { off: "RNG : désactivé", high: "RNG : High", low: "RNG : Low" },
    modeHelp:
      "Entraînement au nombre aléatoire (1–100) : chaque main reçoit un nombre, et tu choisis l'action que ce nombre indique. High : plus le nombre est élevé, plus l'action est agressive · Low : plus le nombre est bas, plus l'action est agressive. Non utilisé pour le Défi du jour.",
    bandsTitle: "Plages RNG",
    yourNumber: "Ton nombre",
    noteBest: (action: string) => `Tu as choisi l'action de ce nombre (${action}).`,
    noteMixed: (action: string) =>
      `Acceptable — le solver mixe cette action, mais ce nombre indique ${action}.`,
    noteOther: (action: string) => `Ce nombre indique ${action}.`,
  },
  id: {
    mode: { off: "RNG: Mati", high: "RNG: High", low: "RNG: Low" },
    modeHelp:
      "Latihan angka acak (1–100) — setiap hand mendapat satu angka, lalu Anda memilih aksi yang ditunjuk angka itu. High: makin tinggi angkanya, makin agresif aksinya · Low: makin rendah angkanya, makin agresif aksinya. Tidak dipakai untuk Tantangan Harian.",
    bandsTitle: "Rentang RNG",
    yourNumber: "Angka Anda",
    noteBest: (action: string) => `Anda memilih aksi untuk angka ini (${action}).`,
    noteMixed: (action: string) =>
      `Cukup baik — solver mencampur aksi ini, tetapi angka ini menunjuk ${action}.`,
    noteOther: (action: string) => `Angka ini menunjuk ${action}.`,
  },
  hi: {
    mode: { off: "RNG: बंद", high: "RNG: High", low: "RNG: Low" },
    modeHelp:
      "रैंडम नंबर (1–100) अभ्यास — हर हैंड पर एक नंबर मिलता है, और आप वह एक्शन चुनते हैं जो वह नंबर बताता है। High: नंबर जितना बड़ा, एक्शन उतना आक्रामक · Low: नंबर जितना छोटा, एक्शन उतना आक्रामक। आज की चुनौती में इसका उपयोग नहीं होता।",
    bandsTitle: "RNG रेंज",
    yourNumber: "आपका नंबर",
    noteBest: (action: string) => `आपने इस नंबर वाला एक्शन (${action}) चुना।`,
    noteMixed: (action: string) =>
      `स्वीकार्य — सॉल्वर यह एक्शन मिलाकर खेलता है, पर इस नंबर पर ${action} है।`,
    noteOther: (action: string) => `इस नंबर पर ${action} है।`,
  },
  ms: {
    mode: { off: "RNG: Tutup", high: "RNG: High", low: "RNG: Low" },
    modeHelp:
      "Latihan nombor rawak (1–100) — setiap tangan diberi satu nombor, dan anda memilih tindakan yang ditunjukkan oleh nombor itu. High: makin tinggi nombor, makin agresif tindakannya · Low: makin rendah nombor, makin agresif tindakannya. Tidak digunakan untuk Cabaran Harian.",
    bandsTitle: "Julat RNG",
    yourNumber: "Nombor anda",
    noteBest: (action: string) => `Anda memilih tindakan untuk nombor ini (${action}).`,
    noteMixed: (action: string) =>
      `Boleh diterima — solver mencampurkan tindakan ini, tetapi nombor ini menunjukkan ${action}.`,
    noteOther: (action: string) => `Nombor ini menunjukkan ${action}.`,
  },
  tr: {
    mode: { off: "RNG: Kapalı", high: "RNG: High", low: "RNG: Low" },
    modeHelp:
      "Rastgele sayı (1–100) alıştırması — her ele bir sayı verilir ve o sayının gösterdiği aksiyonu seçersin. High: sayı büyüdükçe aksiyon daha agresif · Low: sayı küçüldükçe aksiyon daha agresif. Günün sorusunda kullanılmaz.",
    bandsTitle: "RNG aralıkları",
    yourNumber: "Senin sayın",
    noteBest: (action: string) => `Bu sayının aksiyonunu seçtin (${action}).`,
    noteMixed: (action: string) =>
      `Kabul edilebilir — solver bu aksiyonu karıştırıyor, ama bu sayıda doğru aksiyon: ${action}.`,
    noteOther: (action: string) => `Bu sayıda doğru aksiyon: ${action}.`,
  },
  vi: {
    mode: { off: "RNG: Tắt", high: "RNG: High", low: "RNG: Low" },
    modeHelp:
      "Luyện với số ngẫu nhiên (1–100) — mỗi ván nhận một số, bạn chọn hành động mà số đó chỉ định. High: số càng cao, hành động càng hung hăng · Low: số càng thấp, hành động càng hung hăng. Không dùng cho Thử thách hôm nay.",
    bandsTitle: "Khoảng số RNG",
    yourNumber: "Số của bạn",
    noteBest: (action: string) => `Bạn đã chọn hành động ứng với số này (${action}).`,
    noteMixed: (action: string) =>
      `Chấp nhận được — solver có trộn hành động này, nhưng số này ứng với ${action}.`,
    noteOther: (action: string) => `Số này ứng với ${action}.`,
  },
  ru: {
    mode: { off: "RNG: Выкл", high: "RNG: High", low: "RNG: Low" },
    modeHelp:
      "Тренировка со случайным числом (1–100) — в каждой раздаче выпадает число, и ты выбираешь действие, на которое оно указывает. High: чем больше число, тем агрессивнее действие · Low: чем меньше число, тем агрессивнее действие. В задаче дня не используется.",
    bandsTitle: "Диапазоны RNG",
    yourNumber: "Твоё число",
    noteBest: (action: string) => `Выбрано действие для этого числа (${action}).`,
    noteMixed: (action: string) =>
      `Допустимо — солвер смешивает это действие, но для этого числа нужно: ${action}.`,
    noteOther: (action: string) => `Для этого числа нужно: ${action}.`,
  },
  ar: {
    mode: { off: "RNG: إيقاف", high: "RNG: High", low: "RNG: Low" },
    modeHelp:
      "تدريب بالرقم العشوائي (1–100) — تحصل كل يد على رقم، وتختار القرار الذي يشير إليه هذا الرقم. High: كلما ارتفع الرقم كان القرار أكثر عدوانية · Low: كلما انخفض الرقم كان القرار أكثر عدوانية. لا يُستخدم في سؤال اليوم.",
    bandsTitle: "نطاقات RNG",
    yourNumber: "رقمك",
    noteBest: (action: string) => `اختيارك صحيح لهذا الرقم (${action}).`,
    noteMixed: (action: string) =>
      `مقبول — يمزج السولفر هذا القرار، لكن المطلوب لهذا الرقم: ${action}.`,
    noteOther: (action: string) => `المطلوب لهذا الرقم: ${action}.`,
  },
  it: {
    mode: { off: "RNG: No", high: "RNG: High", low: "RNG: Low" },
    modeHelp:
      "Allenamento con un numero casuale (1–100): ogni mano riceve un numero e tu scegli l’azione corrispondente. High: i numeri più alti indicano azioni più aggressive · Low: i numeri più bassi indicano azioni più aggressive. Non si usa nella [Sfida del giorno].",
    bandsTitle: "Intervalli RNG",
    yourNumber: "Il tuo numero",
    noteBest: (action: string) => `Hai scelto l’azione corrispondente a questo numero (${action}).`,
    noteMixed: (action: string) =>
      `Accettabile: il solver usa anche questa azione nella strategia mista, ma a questo numero corrisponde «${action}».`,
    noteOther: (action: string) => `A questo numero corrisponde l’azione «${action}».`,
  },
} satisfies LocaleDict<{
  mode: Record<"off" | "high" | "low", string>;
  modeHelp: string;
  bandsTitle: string;
  yourNumber: string;
  noteBest: (action: string) => string;
  noteMixed: (action: string) => string;
  noteOther: (action: string) => string;
}>;
