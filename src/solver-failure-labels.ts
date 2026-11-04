// 계산 실패 안내 중 «메모리 부족» 문구 (MB-518 · 2026-11-03 · 판정 전 AI 작성).
// 메모리를 못 얻으면 같은 설정·단일 스레드로 다시 해도 또 실패한다 → 16비트 정수(압축)로 바꾸거나 나무를 줄이게 안내한다.
// «16비트 정수» 이름은 RunSolver.vue int16Label과 같은 말을 쓴다(화면에서 그 칸을 찾을 수 있게).
import { ltrIso } from "./i18n";

type MemoryFailureLabels = { title: string; compress: string; reduce: string; retryCompress: string };

export const MEMORY_FAILURE_LABELS: Record<string, MemoryFailureLabels> = {
  ko: {
    title: "메모리가 부족해 계산하지 못했습니다",
    compress: "이 기기에서 계산에 필요한 메모리를 확보하지 못했습니다. «16비트 정수»로 바꾸면 필요한 메모리가 절반 가까이 줄어듭니다.",
    reduce: "이 기기에서 계산에 필요한 메모리를 확보하지 못했습니다. 같은 설정으로 다시 해도 같은 결과가 납니다. 벳 크기 수나 레인지를 줄여 필요한 메모리를 낮춘 뒤 다시 계산해 주세요.",
    retryCompress: "16비트 정수로 다시 계산",
  },
  en: {
    title: "Not enough memory to solve",
    compress: "This device couldn't provide the memory this solve needs. Switching to «16-bit integer» cuts the memory needed by almost half.",
    reduce: "This device couldn't provide the memory this solve needs. Trying again with the same settings will fail the same way. Use fewer bet sizes or narrower ranges to lower the memory needed, then solve again.",
    retryCompress: "Solve again with 16-bit integer",
  },
  ja: {
    title: "メモリ不足のため計算できませんでした",
    compress: "この端末では計算に必要なメモリを確保できませんでした。「16ビット整数」に切り替えると、必要なメモリがほぼ半分になります。",
    reduce: "この端末では計算に必要なメモリを確保できませんでした。同じ設定でやり直しても同じ結果になります。ベットサイズの数やレンジを減らして必要なメモリ量を下げてから、もう一度計算してください。",
    retryCompress: "16ビット整数で再計算",
  },
  es: {
    title: "No hay memoria suficiente para calcular",
    compress: "Este dispositivo no pudo reservar la memoria que necesita este cálculo. Si cambias a «Entero de 16 bits», la memoria necesaria baja casi a la mitad.",
    reduce: "Este dispositivo no pudo reservar la memoria que necesita este cálculo. Si lo intentas de nuevo con la misma configuración, volverá a fallar. Usa menos tamaños de apuesta o rangos más estrechos para bajar la memoria necesaria y calcula de nuevo.",
    retryCompress: "Calcular de nuevo con entero de 16 bits",
  },
  pt: {
    title: "Memória insuficiente para calcular",
    compress: "Este dispositivo não conseguiu reservar a memória de que este cálculo precisa. Se você mudar para «Inteiro de 16 bits», a memória necessária cai quase pela metade.",
    reduce: "Este dispositivo não conseguiu reservar a memória de que este cálculo precisa. Tentar de novo com as mesmas configurações vai falhar do mesmo jeito. Use menos tamanhos de aposta ou ranges mais estreitos para reduzir a memória necessária e calcule de novo.",
    retryCompress: "Calcular de novo com inteiro de 16 bits",
  },
  de: {
    title: "Nicht genug Speicher für die Berechnung",
    compress: "Dieses Gerät konnte den Speicher für diese Berechnung nicht bereitstellen. Wenn du auf „16-Bit-Ganzzahl“ umstellst, braucht sie fast nur noch halb so viel Speicher.",
    reduce: "Dieses Gerät konnte den Speicher für diese Berechnung nicht bereitstellen. Mit denselben Einstellungen schlägt auch ein neuer Versuch fehl. Nimm weniger Einsatzgrößen oder engere Ranges, damit weniger Speicher nötig ist, und rechne dann erneut.",
    retryCompress: "Mit 16-Bit-Ganzzahl neu berechnen",
  },
  zh: {
    title: "内存不足，无法计算",
    compress: "此设备无法提供这次计算所需的内存。改用“16 位整数”后，所需内存几乎减半。",
    reduce: "此设备无法提供这次计算所需的内存。用相同设置重试仍会失败。请减少下注尺寸的数量或缩小范围，降低所需内存后再计算。",
    retryCompress: "改用 16 位整数重新计算",
  },
  "zh-hant": {
    title: "記憶體不足，無法計算",
    compress: "此裝置無法提供這次計算所需的記憶體。改用「16 位元整數」後，所需記憶體幾乎減半。",
    reduce: "此裝置無法提供這次計算所需的記憶體。用相同設定重試仍會失敗。請減少下注尺寸的數量或縮小範圍，降低所需記憶體後再計算。",
    retryCompress: "改用 16 位元整數重新計算",
  },
  fr: {
    title: "Mémoire insuffisante pour calculer",
    compress: "Cet appareil n'a pas pu fournir la mémoire nécessaire à ce calcul. En passant à « Entier 16 bits », la mémoire nécessaire baisse de près de moitié.",
    reduce: "Cet appareil n'a pas pu fournir la mémoire nécessaire à ce calcul. Un nouvel essai avec les mêmes réglages échouera de la même façon. Utilise moins de tailles de mise ou des ranges plus étroites pour réduire la mémoire nécessaire, puis relance le calcul.",
    retryCompress: "Recalculer en mode « Entier 16 bits »",
  },
  id: {
    title: "Memori tidak cukup untuk menghitung",
    compress: "Perangkat ini tidak bisa menyediakan memori yang dibutuhkan perhitungan ini. Beralih ke «Integer 16-bit» memangkas memori yang dibutuhkan hampir setengahnya.",
    reduce: "Perangkat ini tidak bisa menyediakan memori yang dibutuhkan perhitungan ini. Mencoba lagi dengan pengaturan yang sama akan gagal dengan cara yang sama. Kurangi jumlah ukuran taruhan atau persempit range untuk menurunkan memori yang dibutuhkan, lalu hitung lagi.",
    retryCompress: "Hitung ulang dengan integer 16-bit",
  },
  ms: {
    title: "Memori tidak mencukupi untuk mengira",
    compress: "Peranti ini tidak dapat menyediakan memori yang diperlukan oleh pengiraan ini. Tukar kepada «Integer 16-bit» untuk mengurangkan memori yang diperlukan hampir separuh.",
    reduce: "Peranti ini tidak dapat menyediakan memori yang diperlukan oleh pengiraan ini. Jika anda mencuba semula dengan tetapan yang sama, pengiraan itu tetap akan gagal. Kurangkan bilangan saiz pertaruhan atau sempitkan range untuk mengurangkan memori yang diperlukan, kemudian kira semula.",
    retryCompress: "Kira semula dengan integer 16-bit",
  },
  hi: {
    title: "गणना के लिए पर्याप्त मेमोरी नहीं है",
    compress: "यह डिवाइस इस गणना के लिए ज़रूरी मेमोरी नहीं दे सका। «16-bit integer» पर बदलने से ज़रूरी मेमोरी लगभग आधी हो जाती है।",
    reduce: "यह डिवाइस इस गणना के लिए ज़रूरी मेमोरी नहीं दे सका। उन्हीं सेटिंग्स से दोबारा कोशिश करने पर भी यही होगा। बेट साइज़ की संख्या कम करें या रेंज छोटी करें ताकि ज़रूरी मेमोरी घटे, फिर दोबारा गणना करें।",
    retryCompress: "16-bit integer से फिर गणना करें",
  },
  tr: {
    title: "Hesaplama için yeterli bellek yok",
    compress: "Bu cihaz bu hesaplamanın gerektirdiği belleği sağlayamadı. «16-bit tam sayı» seçeneğine geçersen gereken bellek neredeyse yarıya iner.",
    reduce: "Bu cihaz bu hesaplamanın gerektirdiği belleği sağlayamadı. Aynı ayarlarla yeniden denemek de aynı şekilde başarısız olur. Gereken belleği düşürmek için daha az bahis boyutu ya da daha dar range kullan, sonra yeniden hesapla.",
    retryCompress: "16-bit tam sayıyla yeniden hesapla",
  },
  vi: {
    title: "Không đủ bộ nhớ để tính",
    compress: "Thiết bị này không cấp được bộ nhớ mà phép tính này cần. Chuyển sang «Int 16-bit» sẽ giảm bộ nhớ cần dùng gần một nửa.",
    reduce: "Thiết bị này không cấp được bộ nhớ mà phép tính này cần. Thử lại với cùng thiết lập vẫn sẽ thất bại như vậy. Hãy dùng ít cỡ cược hơn hoặc thu hẹp range để giảm bộ nhớ cần dùng, rồi tính lại.",
    retryCompress: "Tính lại với Int 16-bit",
  },
  ru: {
    title: "Не хватает памяти для расчёта",
    compress: "Это устройство не смогло выделить память, нужную для этого расчёта. Если переключиться на «16-бит целое», нужной памяти станет почти вдвое меньше.",
    reduce: "Это устройство не смогло выделить память, нужную для этого расчёта. Повтор с теми же настройками закончится так же. Уменьши число сайзингов или сузь диапазоны, чтобы уменьшить требуемый объём памяти, и запусти расчёт снова.",
    retryCompress: "Пересчитать в режиме «16-бит целое»",
  },
  ar: {
    title: "لا توجد ذاكرة كافية للحساب",
    compress: `تعذّر على هذا الجهاز توفير الذاكرة التي يحتاجها هذا الحساب. التبديل إلى «${ltrIso("16-bit")} صحيح» يخفّض الذاكرة المطلوبة إلى النصف تقريبًا.`,
    reduce: "تعذّر على هذا الجهاز توفير الذاكرة التي يحتاجها هذا الحساب. إعادة المحاولة بالإعدادات نفسها ستفشل بالطريقة نفسها. قلّل عدد أحجام الرهان أو ضيّق النطاقات لخفض الذاكرة المطلوبة، ثم أعد الحساب.",
    retryCompress: `إعادة الحساب بخيار «${ltrIso("16-bit")} صحيح»`,
  },
  it: {
    title: "Memoria insufficiente per il calcolo",
    compress: "Questo dispositivo non è riuscito a fornire la memoria necessaria per questo calcolo. Passando a «Interi a 16 bit» la memoria necessaria si riduce quasi della metà.",
    reduce: "Questo dispositivo non è riuscito a fornire la memoria necessaria per questo calcolo. Riprovare con le stesse impostazioni darà lo stesso errore. Usa meno dimensioni di puntata o range più stretti per ridurre la memoria necessaria, poi ricalcola.",
    retryCompress: "Ricalcola con interi a 16 bit",
  },
  pl: {
    title: "Za mało pamięci do obliczeń",
    compress: "To urządzenie nie mogło przydzielić pamięci potrzebnej do tych obliczeń. Po przełączeniu na „16-bit int” potrzeba prawie o połowę mniej pamięci.",
    reduce: "To urządzenie nie mogło przydzielić pamięci potrzebnej do tych obliczeń. Ponowna próba z tymi samymi ustawieniami skończy się tak samo. Użyj mniej rozmiarów zakładów albo węższych zakresów, żeby zmniejszyć potrzebną pamięć, i policz ponownie.",
    retryCompress: "Oblicz ponownie w trybie „16-bit int”",
  },
  th: {
    title: "หน่วยความจำไม่พอสำหรับการคำนวณ",
    compress: "อุปกรณ์นี้จัดสรรหน่วยความจำที่การคำนวณนี้ต้องใช้ไม่ได้ หากเปลี่ยนเป็น «จำนวนเต็ม 16 บิต» หน่วยความจำที่ต้องใช้จะลดลงเกือบครึ่ง",
    reduce: "อุปกรณ์นี้จัดสรรหน่วยความจำที่การคำนวณนี้ต้องใช้ไม่ได้ ลองใหม่ด้วยการตั้งค่าเดิมก็จะล้มเหลวแบบเดิม ลดจำนวนขนาดเดิมพันหรือทำเรนจ์ให้แคบลงเพื่อลดหน่วยความจำที่ต้องใช้ แล้วคำนวณใหม่",
    retryCompress: "คำนวณใหม่ด้วยจำนวนเต็ม 16 บิต",
  },
  uk: {
    title: "Не вистачає пам’яті для розрахунку",
    compress: "Цей пристрій не зміг виділити пам’ять, потрібну для цього розрахунку. Якщо перемкнутися на «16-бітні цілі числа», потрібної пам’яті стане майже вдвічі менше.",
    reduce: "Цей пристрій не зміг виділити пам’ять, потрібну для цього розрахунку. Повтор із тими самими налаштуваннями завершиться так само. Зменш кількість розмірів ставок або звузь діапазони, щоб зменшити потрібний обсяг пам’яті, і запусти розрахунок знову.",
    retryCompress: "Перерахувати з 16-бітними цілими числами",
  },
};
