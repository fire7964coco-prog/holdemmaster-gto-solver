// «메모리 한도 초과» 안내 — 사용법 페이지(GuidePage.vue) tTerm4·tDef4를 글자 그대로 옮긴 사본(11-16 · 새 문구 아님).
// 계산 실행 화면에서 16비트 정수로도 한도를 넘어 [솔버 실행]이 꺼질 때 다음 할 일을 보여 준다.
// 사용법 페이지 문구를 고치면 여기도 같이 고친다.
export const MEMORY_LIMIT_TIP: Record<string, { term: string; def: string }> = {
  ko: { term: "메모리 한도 초과", def: "16비트 정수 모드 선택, 또는 벳 사이즈 수 줄이기" },
  en: { term: "Memory limit exceeded", def: "Switch to 16-bit integer mode, or use fewer bet sizes" },
  ja: { term: "メモリ上限超過", def: "16ビット整数モードを選ぶか、ベットサイズの数を減らす" },
  es: { term: "Límite de memoria superado", def: "Cambia al modo de enteros de 16 bits o usa menos bet sizes" },
  pt: { term: "Limite de memória ultrapassado", def: "Mude para o modo de inteiros de 16 bits ou use menos bet sizes" },
  de: { term: "Speicherlimit überschritten", def: "Wechsle in den 16-Bit-Ganzzahl-Modus oder nimm weniger Bet Sizes" },
  zh: { term: "超出内存上限", def: "改用 16 位整数模式，或者少填几个下注尺寸" },
  "zh-hant": { term: "超出記憶體上限", def: "改用 16 位元整數模式，或者少填幾個下注尺寸" },
  fr: { term: "Limite mémoire dépassée", def: "Passe en mode entier 16 bits, ou réduis le nombre de bet sizes" },
  id: { term: "Batas memori terlampaui", def: "Ganti ke mode integer 16-bit, atau kurangi jumlah bet size" },
  ms: { term: "Had memori dilampaui", def: "Tukar kepada mod integer 16-bit, atau kurangkan bilangan bet size" },
  hi: { term: "मेमोरी की सीमा पार हो गई", def: "16-bit integer मोड चुनें या bet size के विकल्प कम करें" },
  tr: { term: "Bellek sınırı aşıldı", def: "16-bit tam sayı moduna geç ya da daha az bet boyutu kullan" },
  vi: { term: "Vượt giới hạn bộ nhớ", def: "Ở “Độ chính xác:”, chọn Int 16-bit, hoặc dùng ít cỡ cược hơn" },
  ru: { term: "Превышен лимит памяти", def: "В поле «Режим точности:» выбери «16-бит целое» или уменьши число сайзингов" },
  ar: { term: "تجاوز حد الذاكرة", def: "في «وضع الدقة:» اختر «\u206616-bit\u2069 صحيح:»، أو قلّل عدد أحجام الرهان" },
  it: { term: "Limite di memoria superato", def: "Passa alla modalità con interi a 16 bit oppure riduci il numero di dimensioni di puntata" },
  pl: { term: "Przekroczono limit pamięci", def: "Wybierz opcję „16-bit int:” lub zmniejsz liczbę sizingów" },
  th: { term: "ใช้หน่วยความจำเกินขีดจำกัด", def: "เปลี่ยนเป็นโหมดจำ⁠น⁠ว⁠นเต็ม 16 บิต หรือลดจำ⁠น⁠ว⁠นขนาดเ⁠ดิ⁠ม⁠พั⁠น" },
  uk: { term: "Перевищено ліміт пам’яті", def: "Перейди в режим «16-бітні цілі числа:» або зменш кількість розмірів ставок" },
};
