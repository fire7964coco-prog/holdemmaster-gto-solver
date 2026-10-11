import type { Locale, LocaleDict } from "./i18n";

// 저장 목록 계정 동기화 한 줄 문구 (15언어 · 3단계). 어휘·말투는 TrainerPage 계정 보관 문구와 맞춘다
// (동기화·계정·기기 용어 · es·pt·de·fr·tr·ru 반말 · hi आप). 카카오 버튼은 한국어 화면에만 보인다.
// 동작 대조: 기기 저장은 언제나 먼저 됨(saved-sync-run.ts) · 실패분은 다음 동기화(화면을 열거나 저장할 때)에 다시 올림 ·
// 한도 = 본체 상한 «살아 있는 항목 1,000»(MB-244).
const ko = {
  invite: "로그인하면 저장한 목록을 폰·PC 어디서나 불러올 수 있어요",
  google: "구글로 계속하기",
  kakao: "카카오로 계속하기",
  syncing: "계정과 맞추는 중…",
  ok: "계정에 보관 중 · 마지막 동기화 {time}",
  kept: "계정에 보관 중",
  pending: "아직 계정에 올리지 못했어요 — 다음에 이 화면을 열거나 저장할 때 다시 올립니다",
  limit: "계정 보관 한도(1,000개)에 닿았어요 — 이 기기에는 계속 저장됩니다",
};
const en: typeof ko = {
  invite: "Sign in to open your saved list on any phone or PC",
  google: "Continue with Google",
  kakao: "Continue with Kakao",
  syncing: "Syncing with your account…",
  ok: "Kept in your account · last synced {time}",
  kept: "Kept in your account",
  pending: "Not uploaded yet — we'll retry next time you open this screen or save",
  limit: "Account limit reached (1,000 items) — still saving on this device",
};
const ja: typeof ko = {
  invite: "ログインすると、保存したリストをスマホでもPCでも開けます",
  google: "Googleで続ける",
  kakao: "Kakaoで続ける",
  syncing: "アカウントと同期中…",
  ok: "アカウントに保存中 · 最終同期 {time}",
  kept: "アカウントに保存中",
  pending: "まだアカウントに保存できていません — 次にこの画面を開くか保存したときに再送します",
  limit: "アカウントの保存上限（1,000件）に達しました — この端末には引き続き保存されます",
};
const es: typeof ko = {
  invite: "Inicia sesión para abrir tu lista guardada en cualquier móvil o PC",
  google: "Continuar con Google",
  kakao: "Continuar con Kakao",
  syncing: "Sincronizando con tu cuenta…",
  ok: "Guardado en tu cuenta · última sincronización {time}",
  kept: "Guardado en tu cuenta",
  pending: "Aún no se ha subido a tu cuenta — se reintentará la próxima vez que abras esta pantalla o guardes",
  limit: "Límite de la cuenta alcanzado (1000 elementos) — se sigue guardando en este dispositivo",
};
const pt: typeof ko = {
  invite: "Entre na sua conta para abrir sua lista salva em qualquer celular ou PC",
  google: "Continuar com Google",
  kakao: "Continuar com Kakao",
  syncing: "Sincronizando com sua conta…",
  ok: "Salvo na sua conta · última sincronização {time}",
  kept: "Salvo na sua conta",
  pending: "Ainda não foi enviado para sua conta — vamos tentar de novo quando você abrir esta tela ou salvar",
  limit: "Limite da conta atingido (1.000 itens) — continua salvando neste dispositivo",
};
const de: typeof ko = {
  invite: "Melde dich an, um deine gespeicherte Liste auf jedem Handy oder PC zu öffnen",
  google: "Weiter mit Google",
  kakao: "Weiter mit Kakao",
  syncing: "Wird mit deinem Konto synchronisiert…",
  ok: "In deinem Konto gespeichert · zuletzt synchronisiert {time}",
  kept: "In deinem Konto gespeichert",
  pending: "Noch nicht hochgeladen – wir versuchen es erneut, wenn du diese Ansicht öffnest oder speicherst",
  limit: "Kontolimit erreicht (1.000 Einträge) – auf diesem Gerät wird weiter gespeichert",
};
const zh: typeof ko = {
  invite: "登录后，手机和电脑都能打开你保存的列表",
  google: "使用 Google 继续",
  kakao: "使用 Kakao 继续",
  syncing: "正在与账号同步…",
  ok: "已保存在账号里 · 最近同步 {time}",
  kept: "已保存在账号里",
  pending: "还没上传到账号——下次打开这个页面或保存时会再试",
  limit: "已达到账号保存上限（1,000 项）——仍会继续保存在这台设备上",
};
const zhHant: typeof ko = {
  invite: "登入後，手機和電腦都能開啟你儲存的清單",
  google: "使用 Google 繼續",
  kakao: "使用 Kakao 繼續",
  syncing: "正在與帳號同步…",
  ok: "已保存在帳號裡 · 最近同步 {time}",
  kept: "已保存在帳號裡",
  pending: "還沒上傳到帳號——下次開啟這個頁面或儲存時會再試",
  limit: "已達帳號保存上限（1,000 項）——仍會繼續儲存在這台裝置上",
};
const fr: typeof ko = {
  invite: "Connecte-toi pour ouvrir ta liste enregistrée sur n'importe quel téléphone ou PC",
  google: "Continuer avec Google",
  kakao: "Continuer avec Kakao",
  syncing: "Synchronisation avec ton compte…",
  ok: "Conservé dans ton compte · dernière synchronisation {time}",
  kept: "Conservé dans ton compte",
  pending: "Pas encore envoyé — nouvel essai la prochaine fois que tu ouvres cet écran ou que tu enregistres",
  limit: "Limite du compte atteinte (1 000 éléments) — l'enregistrement continue sur cet appareil",
};
const id: typeof ko = {
  invite: "Masuk untuk membuka daftar tersimpan di HP atau PC mana pun",
  google: "Lanjutkan dengan Google",
  kakao: "Lanjutkan dengan Kakao",
  syncing: "Menyinkronkan dengan akun…",
  ok: "Tersimpan di akun · terakhir disinkronkan {time}",
  kept: "Tersimpan di akun",
  pending: "Belum terunggah ke akun — akan dicoba lagi saat layar ini dibuka atau saat menyimpan",
  limit: "Batas akun tercapai (1.000 item) — tetap tersimpan di perangkat ini",
};
const ms: typeof ko = {
  invite: "Log masuk untuk membuka senarai simpanan di mana-mana telefon atau PC",
  google: "Teruskan dengan Google",
  kakao: "Teruskan dengan Kakao",
  syncing: "Sedang menyegerakkan dengan akaun…",
  ok: "Disimpan dalam akaun · penyegerakan terakhir {time}",
  kept: "Disimpan dalam akaun",
  pending: "Belum dimuat naik ke akaun — akan dicuba lagi apabila skrin ini dibuka atau semasa menyimpan",
  limit: "Had akaun dicapai (1,000 item) — masih disimpan pada peranti ini",
};
const hi: typeof ko = {
  invite: "लॉग इन करें, फिर सेव की गई लिस्ट किसी भी फ़ोन या PC पर खोलें",
  google: "Google से जारी रखें",
  kakao: "Kakao से जारी रखें",
  syncing: "खाते से सिंक हो रहा है…",
  ok: "खाते में सेव है · आख़िरी सिंक {time}",
  kept: "खाते में सेव है",
  pending: "अभी खाते में अपलोड नहीं हुआ — अगली बार यह स्क्रीन खोलने या सेव करने पर फिर कोशिश होगी",
  limit: "खाते की सीमा (1,000 आइटम) पूरी हो गई — इस डिवाइस पर सेव होता रहेगा",
};
const tr: typeof ko = {
  invite: "Kayıtlı listeni her telefonda veya PC'de açmak için giriş yap",
  google: "Google ile devam et",
  kakao: "Kakao ile devam et",
  syncing: "Hesabınla eşitleniyor…",
  ok: "Hesabında saklanıyor · son eşitleme {time}",
  kept: "Hesabında saklanıyor",
  pending: "Henüz hesaba yüklenmedi — bu ekranı bir sonraki açışında veya kaydettiğinde yeniden denenecek",
  limit: "Hesap sınırına ulaşıldı (1.000 öğe) — bu cihaza kaydetmeye devam ediliyor",
};
const vi: typeof ko = {
  invite: "Đăng nhập để mở danh sách đã lưu trên mọi điện thoại hoặc PC",
  google: "Tiếp tục với Google",
  kakao: "Tiếp tục với Kakao",
  syncing: "Đang đồng bộ với tài khoản…",
  ok: "Đã lưu trong tài khoản · đồng bộ lần cuối {time}",
  kept: "Đã lưu trong tài khoản",
  pending: "Chưa tải lên tài khoản — sẽ thử lại khi bạn mở màn hình này hoặc lưu lần tới",
  limit: "Đã đạt giới hạn tài khoản (1.000 mục) — vẫn tiếp tục lưu trên thiết bị này",
};
const ru: typeof ko = {
  invite: "Войди, чтобы открывать сохранённый список на любом телефоне или ПК",
  google: "Войти через Google",
  kakao: "Войти через Kakao",
  syncing: "Синхронизация с аккаунтом…",
  ok: "Хранится в аккаунте · последняя синхронизация {time}",
  kept: "Хранится в аккаунте",
  pending: "Ещё не загружено в аккаунт — повторим, когда снова откроешь этот экран или сохранишь",
  limit: "Достигнут лимит аккаунта (1000 элементов) — на этом устройстве сохранение продолжается",
};
export type SavedSyncLabels = Record<keyof typeof ko, string>;
// This assignment checks both the locale set and every required key at build time.
const checkedLabels: LocaleDict<SavedSyncLabels> = {
  ko, en, ja, es, pt, de, zh, "zh-hant": zhHant,
  fr, id, ms, hi, tr, vi, ru,
};
export const savedSyncLabels = (locale: Locale): SavedSyncLabels => checkedLabels[locale];
