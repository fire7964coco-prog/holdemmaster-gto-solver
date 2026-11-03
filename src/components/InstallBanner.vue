<template>
  <div
    v-if="pwa.showBanner"
    :data-feedback-install="feedbackFeatures.feedback ? '' : undefined /* F1_FEEDBACK_ONLY */"
    :class="
      'fixed z-40 bottom-0 inset-x-0 md:bottom-4 md:end-4 md:start-auto md:w-[26rem] ' +
      'border-t md:border md:rounded-lg border-neutral-600 bg-neutral-800 shadow-2xl ' +
      'px-4 py-3 text-sm'
    "
  >
    <div class="flex items-start gap-3">
      <img
        src="/icons/icon-192.png"
        :alt="L.iconAlt"
        class="w-10 h-10 rounded-lg shrink-0 mt-0.5"
      />

      <div class="flex-grow min-w-0">
        <div class="font-semibold text-neutral-100">{{ L.title }}</div>
        <!-- F1_FEEDBACK_ONLY_START -->
        <FeedbackSummary v-if="feedbackFeatures.summary" />
        <!-- F1_FEEDBACK_ONLY_END -->

        <!--
          삼성 인터넷: 2026-08-15 실기기에서 설치 중 Play 프로텍트 경고를 봤다.
          원인과 크롬 무경고 여부는 기록이 없어 단정하지 않는다(MB-507 · MA-723).
        -->
        <p v-if="pwa.isSamsung" class="mt-1 text-neutral-300 leading-relaxed">
          {{ L.samsung1 }}<b class="text-neutral-100">{{ L.samsungB1 }}</b
          >{{ L.samsung2 }}<b class="text-neutral-100">{{ L.samsungB2 }}</b
          >{{ L.samsung3 }}
        </p>
        <p v-else-if="!pwa.isIOS" class="mt-1 text-neutral-300 leading-relaxed">
          {{ L.default1 }}<b class="text-neutral-100">{{ L.defaultB1 }}</b
          >{{ L.default2 }}
        </p>
        <p v-else class="mt-1 text-neutral-300 leading-relaxed">
          {{ L.ios1 }}<b class="text-neutral-100">{{ L.iosB1 }}</b
          >{{ L.ios2 }}<b class="text-neutral-100">{{ L.iosB2 }}</b
          >{{ L.ios3 }}
        </p>

        <div class="mt-2.5 flex gap-2 flex-wrap">
          <button v-if="pwa.isSamsung" class="button-blue px-3 py-1" @click="openInChrome">
            {{ L.openInChrome }}
          </button>
          <button
            v-else-if="!pwa.isIOS"
            class="button-blue px-3 py-1"
            @click="promptInstall"
          >
            {{ L.install }}
          </button>
          <button class="button-base px-3 py-1" @click="dismissBanner">
            {{ pwa.isIOS ? L.gotIt : L.later }}
          </button>
        </div>

        <p v-if="pwa.isSamsung" class="mt-1.5 text-xs text-neutral-500 leading-relaxed">
          {{ L.samsungHint }}
        </p>
        <!-- 설치를 꺼리는 가장 큰 이유는 «뭐가 깔리는 거지?»다 -->
        <p class="mt-1.5 text-xs text-neutral-500 leading-relaxed">
          {{ L.safety }}
        </p>
      </div>

      <button
        class="text-neutral-400 hover:text-neutral-200 leading-none"
        :title="L.close"
        @click="dismissBanner"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { PRESETS } from "../presets";
import { ruPlural, ukNumberText, ukPlural } from "../i18n";
// 교육 예제 개수 — 문구에 숫자를 박지 않는다(검수장 권고)
const SPOT_COUNT = PRESETS.length;
const ruSpotsNom = () => `${SPOT_COUNT} ${ruPlural(SPOT_COUNT, "учебный спот", "учебных спота", "учебных спотов")}`;
import { computed, defineComponent } from "vue";
import { pwa, promptInstall, dismissBanner, openInChrome } from "../pwa";
import { i18n } from "../i18n";
import { VARIANT_TEXT } from "../variant";
import FeedbackSummary from "./FeedbackSummary.vue"; // F1_FEEDBACK_ONLY
import { feedbackFeatures } from "../solver-feedback-features"; // F1_FEEDBACK_ONLY

const M = {
  ko: {
    iconAlt: "홀덤마스터 트레이너 아이콘",
    title: "홈 화면에 추가할까요?",
    samsung1: "삼성 인터넷은 설치할 때 ",
    samsungB1: "「안전하지 않은 앱 차단됨」",
    samsung2: " 경고가 뜰 수 있습니다 — 제목만으로는 막힌 이유를 알 수 없습니다. ",
    samsungB2: "크롬으로 열어",
    samsung3: " 먼저 설치해 보세요.",
    default1: "아이콘 하나로 바로 열리고, ",
    defaultB1: `교육 예제 ${SPOT_COUNT}종과 트레이너를 기기에 저장`,
    default2: "해 인터넷이 없는 곳에서도 공부할 수 있습니다.",
    ios1: "아래 ",
    iosB1: "공유 버튼",
    ios2: "을 누른 뒤 ",
    iosB2: "「홈 화면에 추가」",
    ios3: "를 선택하세요. 아이콘 하나로 바로 열리고, 교육 예제와 트레이너를 저장해 인터넷 없이도 공부할 수 있습니다.",
    openInChrome: "크롬으로 열기",
    install: "홈 화면에 추가",
    gotIt: "알겠습니다",
    later: "나중에",
    samsungHint:
      "여기서 계속하려면 경고창의 [세부정보 더보기]에서 이유를 읽고 계속할지 정하세요.",
    safety:
      "프로그램이 깔리는 게 아니라 브라우저 바로가기입니다. 권한을 요구하지 않고, 지울 때도 앱처럼 길게 눌러 삭제하면 끝입니다.",
    close: "닫기",
  },
  en: {
    iconAlt: "HoldemMaster GTO Trainer icon",
    title: "Add to your home screen?",
    samsung1: "Samsung Internet may ",
    samsungB1: "show a warning during install",
    samsung2: " — the warning title alone doesn't say why. ",
    samsungB2: "Open it in Chrome",
    samsung3: " and try installing there first.",
    default1: "It opens with a single tap, and ",
    defaultB1: `keeps all ${SPOT_COUNT} Study Spots and the Trainer on your device`,
    default2: " so you can study even without an internet connection.",
    ios1: "Tap the ",
    iosB1: "Share button",
    ios2: " below, then choose ",
    iosB2: "“Add to Home Screen”",
    ios3: ". It opens with a single tap, with the Study Spots and Trainer saved for offline use.",
    openInChrome: "Open in Chrome",
    install: "Add to Home Screen",
    gotIt: "Got it",
    later: "Later",
    samsungHint:
      "If you stay here, open the warning's details and read the reason before deciding whether to continue.",
    safety:
      "Nothing gets installed on your system — it's just a browser shortcut. It asks for no permissions, and you can remove it anytime by long-pressing the icon, just like an app.",
    close: "Close",
  },
  ja: {
    iconAlt: "HoldemMaster GTOトレーナーのアイコン",
    title: "ホーム画面に追加しますか？",
    samsung1: "Samsung Internetでは、ブラウザや端末が",
    samsungB1: "セキュリティ上の理由でインストールをブロック",
    samsung2: "することがあります — 警告の見出しだけでは理由はわかりません。",
    samsungB2: "Chromeで開いて",
    samsung3: "、先にそちらでインストールしてみてください。",
    default1: "アイコン1つですぐ開けて、",
    defaultB1: `学習スポット${SPOT_COUNT}種とトレーナーを端末に保存`,
    default2: "するので、インターネットのない場所でも学習できます。",
    ios1: "下の",
    iosB1: "「共有」ボタン",
    ios2: "をタップし、",
    iosB2: "「ホーム画面に追加」",
    ios3: "を選んでください。アイコン1つですぐ開けて、学習スポットとトレーナーを保存するのでインターネットなしでも学習できます。",
    openInChrome: "Chromeで開く",
    install: "ホーム画面に追加",
    gotIt: "わかりました",
    later: "あとで",
    samsungHint:
      "Samsung Internetを使う場合は、警告の詳細で理由を確認してから、インストールを続けるか決めてください。",
    safety:
      "プログラムがインストールされるわけではなく、ブラウザのショートカットです。権限を要求せず、削除するときもアプリと同じようにアイコンを長押しして削除するだけです。",
    close: "閉じる",
  },
  es: {
    iconAlt: "Ícono de HoldemMaster GTO Trainer",
    title: "¿Agregar a tu pantalla de inicio?",
    samsung1: "Samsung Internet puede ",
    samsungB1: "mostrar un aviso al instalar",
    samsung2: " — el título del aviso no explica el motivo. ",
    samsungB2: "Ábrela en Chrome",
    samsung3: " y prueba primero a instalarla allí.",
    default1: "Se abre con un solo toque y ",
    defaultB1: `guarda los ${SPOT_COUNT} Spots de estudio y el Entrenador en tu dispositivo`,
    default2: " para que puedas estudiar incluso sin conexión a internet.",
    ios1: "Toca el ",
    iosB1: "botón Compartir",
    ios2: " de abajo y elige ",
    iosB2: "«Agregar a pantalla de inicio»",
    ios3: ". Se abre con un solo toque, con los Spots de estudio y el Entrenador guardados para usarlos sin conexión.",
    openInChrome: "Abrir en Chrome",
    install: "Agregar a inicio",
    gotIt: "Entendido",
    later: "Después",
    samsungHint:
      "Si sigues aquí, abre los detalles del aviso y lee el motivo antes de decidir si continúas.",
    safety:
      "No se instala nada en tu sistema — es solo un acceso directo del navegador. No pide permisos y puedes quitarlo cuando quieras manteniendo presionado el ícono, como cualquier app.",
    close: "Cerrar",
  },
  pt: {
    iconAlt: "Ícone do HoldemMaster GTO Trainer",
    title: "Adicionar à sua tela de início?",
    samsung1: "O Samsung Internet pode ",
    samsungB1: "mostrar um aviso ao instalar",
    samsung2: " — o título do aviso não explica o motivo. ",
    samsungB2: "Abra no Chrome",
    samsung3: " e tente instalar por lá primeiro.",
    default1: "Abre com um toque só e ",
    defaultB1: `guarda os ${SPOT_COUNT} Spots de estudo e o Treinador no seu dispositivo`,
    default2: " para você estudar mesmo sem conexão com a internet.",
    ios1: "Toque no ",
    iosB1: "botão Compartilhar",
    ios2: " abaixo e escolha ",
    iosB2: "“Adicionar à Tela de Início”",
    ios3: ". Abre com um toque só, com os Spots de estudo e o Treinador guardados para usar sem conexão.",
    openInChrome: "Abrir no Chrome",
    install: "Adicionar à tela",
    gotIt: "Entendi",
    later: "Depois",
    samsungHint:
      "Se continuar aqui, abra os detalhes do aviso e leia o motivo antes de decidir se prossegue.",
    safety:
      "Nada é instalado no seu sistema — é apenas um atalho do navegador. Ele não pede permissões e você pode removê-lo quando quiser mantendo o ícone pressionado, como qualquer app.",
    close: "Fechar",
  },
  de: {
    iconAlt: "Icon des HoldemMaster GTO Trainers",
    title: "Zum Startbildschirm hinzufügen?",
    samsung1: "Samsung Internet kann ",
    samsungB1: "beim Installieren eine Warnung anzeigen",
    samsung2:
      " – der Titel der Warnung allein nennt den Grund nicht. ",
    samsungB2: "Öffne die Seite in Chrome",
    samsung3: " und versuche es zuerst dort.",
    // „Tipp“ ist im Deutschen ein Ratschlag (oder eine Wette) — die Geste heißt Fingertipp
    default1: "Ein Fingertipp genügt zum Öffnen, und ",
    defaultB1: `alle ${SPOT_COUNT} Lernspots und der Trainer bleiben auf deinem Gerät`,
    default2: " – so kannst du auch ohne Internetverbindung lernen.",
    ios1: "Tippe unten auf das ",
    iosB1: "Teilen-Symbol",
    ios2: " und wähle ",
    // iOS Safari의 실제 독일어 메뉴 이름 (버튼명 대조 — 지시서 §6-④)
    iosB2: "„Zum Home-Bildschirm“",
    ios3: ". Ein Fingertipp genügt zum Öffnen – die Lernspots und der Trainer sind offline gespeichert.",
    openInChrome: "In Chrome öffnen",
    install: "Zum Startbildschirm",
    gotIt: "Alles klar",
    later: "Später",
    samsungHint:
      "Wenn du hier bleibst, öffne die Details der Warnung und lies den Grund, bevor du entscheidest, ob du fortfährst.",
    safety:
      "Es wird kein Programm installiert – es ist nur eine Browser-Verknüpfung: keine Berechtigungen, und du kannst sie jederzeit entfernen, indem du das Icon lange gedrückt hältst, wie bei jeder App.",
    close: "Schließen",
  },
  zh: {
    iconAlt: "HoldemMaster GTO 训练器图标",
    title: "要添加到主屏幕吗？",
    // samsung1 + «굵은» samsungB1 + samsung2 + «굵은» samsungB2 + samsung3 로 한 문장이 된다
    samsung1: "三星浏览器或系统在安装时可能会",
    samsungB1: "以安全为由拦截安装",
    samsung2: "——仅凭提示标题看不出原因。",
    samsungB2: "改用 Chrome 打开",
    samsung3: "，先在那里试着安装。",
    default1: "点一下图标就能打开，而且",
    defaultB1: `${SPOT_COUNT} 个教学案例和训练器都会存到你的设备里`,
    default2: "，没网也能学。",
    ios1: "点下面的",
    iosB1: "分享按钮",
    ios2: "，然后选",
    // iOS Safari 간체 중국어의 «실제» 메뉴 이름이다 (버튼명 대조 — 지시서 §6-⑤)
    iosB2: "“添加到主屏幕”",
    ios3: "。点一下图标就能打开，教学案例和训练器也都会离线存好。",
    openInChrome: "用 Chrome 打开",
    install: "添加到主屏幕",
    gotIt: "知道了",
    later: "以后再说",
    samsungHint: "如果还想在这里继续，请打开提示的详细信息，读完原因再决定是否继续。",
    safety:
      "这不会在你的系统里装任何程序——它只是一个浏览器快捷方式：不索取任何权限；不想要了，长按图标删掉即可，跟普通应用一样。",
    close: "关闭",
  },
  "zh-hant": {
    // 台灣 표기: 图标→圖示 · 主屏幕→主畫面 · 应用→應用程式 · 快捷方式→捷徑 · 设备→裝置
    iconAlt: "HoldemMaster GTO 訓練器圖示",
    title: "要加入主畫面嗎？",
    // samsung1 + «굵은» samsungB1 + samsung2 + «굵은» samsungB2 + samsung3 로 한 문장이 된다.
    // ⚠ 삼성 경고창의 «제목·버튼 이름»은 적지 않는다 — 기기·버전마다 다르고 실기 캡처가 없다
    //   (핸드오프 2부 규칙 ②. 간체 세션이 여기서 셋을 창작했다가 검수에서 전부 걷어냈다)
    samsung1: "三星瀏覽器或系統在安裝時可能會",
    samsungB1: "以安全為由攔截安裝",
    samsung2: "——僅憑提示標題看不出原因。",
    samsungB2: "改用 Chrome 開啟",
    samsung3: "，先在那裡試著安裝。",
    default1: "點一下圖示就能開啟，而且",
    defaultB1: `${SPOT_COUNT} 個教學案例和訓練器都會存到你的裝置裡`,
    default2: "，沒網路也能學。",
    ios1: "點下面的",
    iosB1: "分享按鈕",
    ios2: "，然後選",
    // iOS Safari 번체 중국어의 메뉴 이름. Apple 台灣 표기는 「加入主畫面」이다
    // (간체의 「添加到主屏幕」과 «단어가 다르다» — 검수 대상 ④)
    iosB2: "「加入主畫面」",
    ios3: "。點一下圖示就能開啟，教學案例和訓練器也都會離線存好。",
    openInChrome: "用 Chrome 開啟",
    install: "加入主畫面",
    gotIt: "知道了",
    later: "以後再說",
    samsungHint: "如果還想在這裡繼續，請打開提示的詳細資訊，讀完原因再決定是否繼續。",
    safety:
      "這不會在你的系統裡裝任何程式——它只是一個瀏覽器捷徑：不索取任何權限；不想要了，長按圖示刪掉即可，跟一般的應用程式一樣。",
    close: "關閉",
  },
  fr: {
    iconAlt: "Icône du HoldemMaster GTO Trainer",
    title: "Ajouter à l'écran d'accueil ?",
    // samsung1 + «굵은» samsungB1 + samsung2 + «굵은» samsungB2 + samsung3 로 한 문장이 된다.
    // ⚠ 삼성 경고창의 «제목·버튼 이름»은 적지 않는다 — 기기·버전마다 다르고 실기 캡처가 없다
    samsung1: "Samsung Internet peut ",
    samsungB1: "afficher un avertissement à l'installation",
    samsung2: " — le titre de l'avertissement n'en donne pas la raison. ",
    samsungB2: "Ouvre-la dans Chrome",
    samsung3: " et essaie d'abord de l'installer là.",
    default1: "Elle s'ouvre d'un seul geste, et ",
    defaultB1: `garde les ${SPOT_COUNT} Spots d'étude et le Trainer sur ton appareil`,
    default2: " pour étudier même sans connexion internet.",
    ios1: "Touche le ",
    iosB1: "bouton Partager",
    ios2: " en bas, puis choisis ",
    // iOS Safari 프랑스어의 실제 메뉴 이름 — Apple 프랑스어 표기는 «Sur l'écran d'accueil»
    iosB2: "« Sur l'écran d'accueil »",
    ios3: ". Elle s'ouvre d'un geste, avec les Spots d'étude et le Trainer disponibles hors ligne.",
    openInChrome: "Ouvrir dans Chrome",
    install: "Ajouter à l'écran d'accueil",
    gotIt: "Compris",
    later: "Plus tard",
    samsungHint:
      "Si tu restes ici, ouvre les détails de l'avertissement et lis la raison avant de décider de continuer ou non.",
    safety:
      "Rien ne s'installe sur ton système — c'est juste un raccourci du navigateur. Il ne demande aucune permission, et tu peux le retirer à tout moment en maintenant l'icône, comme une app.",
    close: "Fermer",
  },
  // 인도네시아어 — Anda체. 삼성 경고창의 «제목·버튼 이름»은 적지 않는다(실기 캡처 없음 — 확정_결정 규칙 2)
  id: {
    iconAlt: "Ikon HoldemMaster GTO Trainer",
    title: "Pasang ke layar utama?",
    // samsung1 + «굵은» samsungB1 + samsung2 + «굵은» samsungB2 + samsung3 로 한 문장이 된다.
    samsung1: "Samsung Internet mungkin ",
    samsungB1: "menampilkan peringatan saat pemasangan",
    samsung2: " — judul peringatan saja tidak menjelaskan alasannya. ",
    samsungB2: "Buka di Chrome",
    samsung3: " dan coba pasang di sana dulu.",
    default1: "Terbuka dengan sekali sentuh, dan ",
    defaultB1: `menyimpan ${SPOT_COUNT} Spot belajar serta Trainer di perangkat Anda`,
    default2: " supaya tetap bisa belajar tanpa koneksi internet.",
    ios1: "Ketuk ",
    iosB1: "tombol Bagikan",
    ios2: " di bagian bawah, lalu pilih ",
    // iOS Safari 인니어의 실제 메뉴 이름 — Apple 인니어 표기는 «Tambah ke Layar Utama»
    iosB2: "“Tambah ke Layar Utama”",
    ios3: ". Terbuka dengan sekali sentuh, dan Spot belajar serta Trainer tetap tersedia saat offline.",
    openInChrome: "Buka di Chrome",
    install: "Pasang ke layar utama",
    gotIt: "Mengerti",
    later: "Nanti saja",
    samsungHint:
      "Kalau tetap di sini, buka detail peringatan dan baca alasannya sebelum memutuskan untuk lanjut atau tidak.",
    safety:
      "Tidak ada yang terpasang ke sistem Anda — ini hanya pintasan browser. Tidak meminta izin apa pun, dan bisa Anda hapus kapan saja dengan menahan ikonnya, seperti aplikasi biasa.",
    close: "Tutup",
  },
  // 말레이어 — anda(소문자)체. 삼성 경고창의 «제목·버튼 이름»은 적지 않는다(실기 캡처 없음 — 확정_결정 규칙 2)
  hi: {
    iconAlt: "HoldemMaster GTO Trainer का आइकन",
    title: "होम स्क्रीन पर जोड़ें?",
    samsung1: "Samsung Internet या आपका डिवाइस ",
    samsungB1: "सुरक्षा कारणों से इंस्टॉल रोक सकता है",
    samsung2: "। चेतावनी के शीर्षक से कारण पता नहीं चलता। पहले इसे ",
    samsungB2: "Chrome में खोलकर",
    samsung3: " इंस्टॉल करने की कोशिश करें।",
    default1: "एक टैप में खोलें। यह ",
    defaultB1: `सभी ${SPOT_COUNT} अभ्यास स्पॉट और ट्रेनर आपके डिवाइस पर सेव करता है`,
    default2: ", ताकि आप बिना इंटरनेट भी अभ्यास कर सकें।",
    ios1: "नीचे ",
    iosB1: "शेयर करें",
    ios2: " पर टैप करें, फिर ",
    iosB2: "“होम स्क्रीन पर जोड़ें”",
    ios3: " चुनें। ऐप एक टैप में खुलेगा और अभ्यास स्पॉट व ट्रेनर ऑफ़लाइन इस्तेमाल के लिए सेव होंगे।",
    openInChrome: "Chrome में खोलें",
    install: "होम स्क्रीन पर जोड़ें",
    gotIt: "ठीक है",
    later: "बाद में",
    samsungHint: "यहीं जारी रखना हो तो पहले चेतावनी का विवरण खोलकर कारण पढ़ें, फिर तय करें कि आगे बढ़ना है या नहीं।",
    safety: "यह ब्राउज़र में चलने वाला वेब ऐप है। इंस्टॉल करने के लिए कैमरा, संपर्क, SMS या लोकेशन की अनुमति नहीं माँगता। दूसरे ऐप की तरह इसके आइकन को देर तक दबाकर इसे हटा सकते हैं।",
    close: "बंद करें",
  },
  ms: {
    iconAlt: "Ikon HoldemMaster GTO Trainer",
    title: "Tambah ke skrin utama?",
    // samsung1 + «굵은» samsungB1 + samsung2 + «굵은» samsungB2 + samsung3 로 한 문장이 된다.
    samsung1: "Samsung Internet mungkin ",
    samsungB1: "memaparkan amaran semasa pemasangan",
    samsung2: " — tajuk amaran sahaja tidak menerangkan sebabnya. ",
    samsungB2: "Buka dalam Chrome",
    samsung3: " dan cuba pasang di sana dahulu.",
    default1: "Ia terbuka dengan satu ketikan, dan ",
    defaultB1: `menyimpan kesemua ${SPOT_COUNT} Spot belajar serta Trainer GTO pada peranti anda`,
    default2: " supaya anda boleh belajar walaupun tiada sambungan internet.",
    ios1: "Ketik ",
    iosB1: "butang Kongsi",
    ios2: " di bawah, kemudian pilih ",
    // iOS Safari 말레이어의 실제 메뉴 이름 — Apple ms-my 표기는 «Tambah ke Skrin Utama».
    // ⚠ 인니어판(위 id 블록)과 낱말이 다르다 — 복사해 오지 말 것
    iosB2: "“Tambah ke Skrin Utama”",
    ios3: ". Ia terbuka dengan satu ketikan, dan Spot belajar serta Trainer GTO tersimpan untuk kegunaan luar talian.",
    openInChrome: "Buka dalam Chrome",
    install: "Tambah ke skrin utama",
    gotIt: "Faham",
    later: "Nanti dulu",
    samsungHint:
      "Kalau anda kekal di sini, buka butiran amaran dan baca sebabnya sebelum memutuskan sama ada mahu teruskan.",
    safety:
      "Tiada apa-apa yang dipasang pada sistem anda — ini hanya pintasan pelayar. Ia tidak meminta sebarang kebenaran, dan anda boleh membuangnya bila-bila masa dengan menekan lama ikonnya, seperti aplikasi biasa.",
    close: "Tutup",
  },
  // 튀르키예어 — sen체. iOS 메뉴 이름은 Apple tr-tr 표기 «Ana Ekrana Ekle», 공유 버튼은 «Paylaş»(용어확정표 §3-3)
  tr: {
    iconAlt: "HoldemMaster GTO Trainer simgesi",
    title: "Ana ekrana eklensin mi?",
    samsung1: "Samsung Internet ",
    samsungB1: "yükleme sırasında uyarı gösterebilir",
    samsung2: " — uyarının başlığı tek başına nedenini söylemez. ",
    samsungB2: "Chrome'da aç",
    samsung3: " ve önce orada yüklemeyi dene.",
    default1: "Tek dokunuşla açılır ve ",
    defaultB1: `${SPOT_COUNT} örnek spotun tamamını ve GTO Trainer'ı cihazına kaydeder`,
    default2: "; böylece internet bağlantısı olmadan da çalışabilirsin.",
    ios1: "Önce ",
    iosB1: "Paylaş düğmesine",
    ios2: " dokun, ardından ",
    iosB2: "“Ana Ekrana Ekle”",
    ios3: " seçeneğini seç. Tek dokunuşla açılır; örnek spotlar ve GTO Trainer çevrimdışı kullanım için kaydedilir.",
    openInChrome: "Chrome'da aç",
    install: "Ana Ekrana Ekle",
    gotIt: "Anladım",
    later: "Daha sonra",
    samsungHint:
      "Burada kalacaksan uyarının ayrıntılarını aç ve devam edip etmeyeceğine karar vermeden önce nedeni oku.",
    safety:
      "Cihazına hiçbir program yüklenmez — bu yalnızca bir tarayıcı kısayolu. Hiçbir izin istemez; bir uygulama gibi simgesine basılı tutarak istediğin zaman kaldırabilirsin.",
    close: "Kapat",
  },
  // 베트남어 — bạn체. iOS 메뉴 인용은 실물 글자 «Thêm vào MH chính», 우리 버튼은 풀어 쓴 꼴(확정표 §3-3·⑬)
  vi: {
    iconAlt: "Biểu tượng HoldemMaster Trainer GTO",
    title: "Thêm vào màn hình chính?",
    samsung1: "Samsung Internet có thể ",
    samsungB1: "hiện cảnh báo khi cài đặt",
    samsung2: " — chỉ riêng tiêu đề cảnh báo không cho biết lý do. ",
    samsungB2: "Mở trong Chrome",
    samsung3: " và thử cài ở đó trước.",
    default1: "Ứng dụng mở chỉ với một chạm, và ",
    defaultB1: `lưu cả ${SPOT_COUNT} spot mẫu cùng Trainer GTO vào thiết bị`,
    default2: " để bạn học được cả khi không có mạng.",
    ios1: "Nhấn ",
    iosB1: "nút Chia sẻ",
    ios2: " bên dưới, rồi chọn ",
    iosB2: "“Thêm vào MH chính”",
    ios3: ". Ứng dụng mở chỉ với một chạm; Spot mẫu và Trainer GTO được lưu để dùng ngoại tuyến.",
    openInChrome: "Mở trong Chrome",
    install: "Thêm vào màn hình chính",
    gotIt: "Đã hiểu",
    later: "Để sau",
    samsungHint:
      "Nếu vẫn ở đây, hãy mở chi tiết cảnh báo và đọc lý do trước khi quyết định có tiếp tục hay không.",
    safety:
      "Không có gì được cài vào máy — đây chỉ là lối tắt của trình duyệt. Ứng dụng không xin quyền nào, và bạn có thể gỡ bất cứ lúc nào bằng cách nhấn giữ biểu tượng, như mọi ứng dụng khác.",
    close: "Đóng",
  },
  // 러시아어 — ты체. iOS 메뉴 인용은 Apple ru 실물 «На экран "Домой"»(안쪽 ASCII 따옴표 예외 · 확정표 §2-4·§3-3),
  // 공유 버튼은 «Поделиться», 우리 버튼은 풀어 쓴 꼴 «Добавить на главный экран»
  ru: {
    iconAlt: "Значок GTO-тренажёра HoldemMaster",
    title: "Добавить на главный экран?",
    samsung1: "Samsung Internet может ",
    samsungB1: "показать предупреждение при установке",
    samsung2: " — заголовок предупреждения сам по себе не объясняет причину. ",
    samsungB2: "Открой в Chrome",
    samsung3: " и сначала попробуй установить там.",
    default1: "Открывается одним нажатием и ",
    defaultB1: `сохраняет на устройстве все ${ruSpotsNom()} и GTO-тренажёр`,
    default2: ", так что заниматься можно даже без интернета.",
    ios1: "Нажми кнопку ",
    iosB1: "Поделиться",
    ios2: " внизу, затем выбери ",
    iosB2: '«На экран "Домой"»',
    ios3: ". Приложение открывается одним нажатием, а учебные споты и GTO-тренажёр сохраняются для работы офлайн.",
    openInChrome: "Открыть в Chrome",
    install: "Добавить на главный экран",
    gotIt: "Понятно",
    later: "Позже",
    samsungHint:
      "Если остаёшься здесь, открой подробности предупреждения и прочитай причину, прежде чем решать, продолжать ли.",
    safety:
      "В систему ничего не устанавливается — это просто ярлык браузера. Приложение не запрашивает никаких разрешений, а удалить его можно в любой момент долгим нажатием на значок, как обычное приложение.",
    close: "Закрыть",
  },
  // 아랍어 — أنت·MSA. iOS 메뉴 인용 = Apple ar 실물 «إضافة إلى الشاشة الرئيسية»(우리 버튼·제목도 같은 글자 · 확정표 §3-3)
  ar: {
    iconAlt: "أيقونة مدرّب GTO من HoldemMaster",
    title: "إضافة إلى الشاشة الرئيسية؟",
    samsung1: "قد يعرض \u2066Samsung Internet\u2069 ",
    samsungB1: "تحذيرًا أثناء التثبيت",
    samsung2: " — عنوان التحذير وحده لا يوضّح السبب. ",
    samsungB2: "افتح في Chrome",
    samsung3: " وجرّب التثبيت هناك أولًا.",
    default1: "يُفتح بضغطة واحدة و",
    defaultB1: `يحفظ على جهازك كل المواقف التدريبية (${SPOT_COUNT}) ومدرّب GTO`,
    default2: "، فتتدرّب حتى دون اتصال.",
    ios1: "اضغط على زر ",
    iosB1: "مشاركة",
    ios2: " في الأسفل، ثم اختر ",
    iosB2: "إضافة إلى الشاشة الرئيسية",
    ios3: ". يُفتح التطبيق بضغطة واحدة، وتُحفظ المواقف التدريبية ومدرّب GTO للعمل دون اتصال.",
    openInChrome: "افتح في Chrome",
    install: "إضافة إلى الشاشة الرئيسية",
    gotIt: "فهمت",
    later: "لاحقًا",
    samsungHint:
      "إذا بقيت هنا، فافتح تفاصيل التحذير واقرأ السبب قبل أن تقرر المتابعة.",
    safety:
      "لا يُثبَّت شيء في النظام — إنه اختصار للمتصفح فقط. لا يطلب التطبيق أي أذونات، ويمكنك حذفه في أي وقت بضغطة مطوّلة على الأيقونة كأي تطبيق.",
    close: "إغلاق",
  },
  it: {
    iconAlt: "Icona di HoldemMaster GTO Trainer",
    title: "Vuoi aggiungere l’app alla schermata Home?",
    samsung1: "Samsung Internet può ",
    samsungB1: "mostrare un avviso durante l’installazione",
    samsung2: ": il titolo dell’avviso da solo non spiega il motivo. ",
    samsungB2: "Apri in Chrome",
    samsung3: " e prova prima a installare da lì.",
    default1: "Si apre con un tocco e ",
    defaultB1: `salva sul dispositivo tutti i ${SPOT_COUNT} esempi e il Trainer GTO`,
    default2: ", così puoi studiare anche senza connessione.",
    ios1: "Tocca il pulsante ",
    iosB1: "Condividi",
    ios2: " qui sotto, poi scegli ",
    iosB2: "«Aggiungi alla schermata Home»",
    ios3: ". Si apre con un tocco e salva gli esempi e il Trainer GTO per l’uso offline.",
    openInChrome: "Apri in Chrome",
    install: "Installa",
    gotIt: "Ho capito",
    later: "Più tardi",
    samsungHint:
      "Se resti qui, apri i dettagli dell’avviso e leggi il motivo prima di decidere se continuare.",
    safety:
      "Non si installa nulla nel sistema: è solo un collegamento del browser. L’app non richiede autorizzazioni e puoi rimuoverla in qualsiasi momento tenendo premuta l’icona, come per le altre app.",
    close: "Chiudi",
  },
  pl: {
    iconAlt: "Ikona HoldemMaster GTO Trainer",
    title: "Dodać do ekranu głównego?",
    samsung1: "Samsung Internet może ",
    samsungB1: "wyświetlić ostrzeżenie podczas instalacji",
    samsung2: " — sam tytuł ostrzeżenia nie mówi, dlaczego. ",
    samsungB2: "Otwórz stronę w Chrome",
    samsung3: " i najpierw spróbuj zainstalować tam.",
    default1: "Otworzysz aplikację jednym dotknięciem, a ",
    defaultB1: `wszystkie przykłady (${SPOT_COUNT}) i Trener GTO zostaną zapisane na urządzeniu`,
    default2: ", więc możesz uczyć się także bez internetu.",
    ios1: "Dotknij przycisku ",
    iosB1: "„Udostępnij”",
    ios2: " poniżej, a następnie wybierz ",
    iosB2: "„Do ekranu głównego”",
    ios3: ". Aplikację otworzysz jednym dotknięciem, a przykłady i Trener GTO będą zapisane do użytku offline.",
    openInChrome: "Otwórz w Chrome",
    install: "Dodaj do ekranu głównego",
    gotIt: "Rozumiem",
    later: "Później",
    samsungHint: "Jeśli zostajesz tutaj, otwórz szczegóły ostrzeżenia i przeczytaj powód, zanim zdecydujesz, czy kontynuować.",
    safety: "To tylko skrót w przeglądarce, bez instalowania programu w systemie. Nie wymaga żadnych uprawnień. Możesz go usunąć w dowolnej chwili, przytrzymując ikonę — tak jak w przypadku aplikacji.",
    close: "Zamknij",
  },

  th: {
    iconAlt: "ไอคอนฝึก GTO ของ HoldemMaster",
    title: "เพิ่มไปยังหน้าจอโฮมหรือไม่?",
    samsung1: "Samsung Internet อาจ",
    samsungB1: "แสดงคำเตือนระหว่างการติดตั้ง",
    samsung2: " หัวข้อคำเตือนอย่างเดียวไม่ได้บ⁠อ⁠กเหตุผล ลอง",
    samsungB2: "เปิดใน Chrome",
    samsung3: " แล้วติดตั้งที่นั่นก่อน",
    default1: "เปิดได้ด้วยการแตะครั้งเดียว และ",
    defaultB1: `เก็บสถานการณ์สำหรับศึกษาทั้ง ${SPOT_COUNT} สถานการณ์และฝึก GTO ไว้บนอุ⁠ป⁠ก⁠ร⁠ณ์ของคุณ`,
    default2: " จึงศึกษาได้แม้ไม่มีอิ⁠น⁠เ⁠ท⁠อ⁠ร์⁠เ⁠น็⁠ต",
    ios1: "แตะ",
    iosB1: "ปุ่มแชร์",
    ios2: "ด้านล่าง แล้วเลือกตัวเลือกเพื่อ",
    iosB2: "เพิ่มไปยังหน้าจอโฮม",
    ios3: " เปิดได้ด้วยการแตะครั้งเดียว พร้อมบันทึกสถานการณ์สำหรับศึกษาและฝึก GTO ไว้ใช้งานอ⁠อ⁠ฟ⁠ไ⁠ล⁠น์",
    openInChrome: "เปิดใน Chrome",
    install: "เพิ่มไปยังหน้าจอโฮม",
    gotIt: "เข้าใจแล้ว",
    later: "ไว้ภายหลัง",
    samsungHint:
      "ถ้าจะใช้ต่อที่นี่ ให้เปิดรายละเอียดของคำเตือนและอ่านเหตุผลก่อนตัดสินใจว่าจะติดตั้งต่อหรือไม่",
    safety:
      "ไม่มีการติดตั้งโปรแกรมลงในระบบ เป็นเพียงทางลัดของเ⁠บ⁠ร⁠า⁠ว์⁠เ⁠ซ⁠อ⁠ร์ ไม่ขอสิทธิ์ใด ๆ และลบได้ทุกเมื่อด้วยการกดไอคอนค้างไว้เหมือนแอปทั่วไป",
    close: "ปิด",
  },
  uk: {
    iconAlt: "Значок тренажера GTO HoldemMaster",
    title: "Додати на початковий екран?",
    samsung1: "Samsung Internet може ",
    samsungB1: "показати попередження під час встановлення",
    samsung2: " — сам заголовок попередження не пояснює причину. ",
    samsungB2: "Відкрий у Chrome",
    samsung3: " і спершу спробуй установити там.",
    default1: "Відкривається одним дотиком і ",
    defaultB1: `зберігає на пристрої ${ukNumberText(SPOT_COUNT, 0)} ${ukPlural(SPOT_COUNT, { one: "навчальний спот", few: "навчальні споти", many: "навчальних спотів", other: "навчального споту" }, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} та тренажер`,
    default2: " — так можна навчатися навіть без інтернету.",
    ios1: "Натисни кнопку ",
    iosB1: "«Поширити»",
    ios2: " внизу, потім обери ",
    iosB2: "«На початковий екран»",
    ios3: ". Застосунок відкривається одним дотиком. Навчальні споти й тренажер зберігаються для роботи офлайн.",
    openInChrome: "Відкрити в Chrome",
    install: "Додати на початковий екран",
    gotIt: "Зрозуміло",
    later: "Пізніше",
    samsungHint:
      "Якщо залишаєшся тут, відкрий докладніші відомості в попередженні й прочитай причину, перш ніж вирішувати, чи продовжувати.",
    safety:
      "У систему нічого не встановлюється — це лише ярлик браузера. Застосунок не запитує дозволів. Його можна видалити будь-коли довгим натисканням значка, як звичайний застосунок.",
    close: "Закрити",
  },
} as const;

/* 다른 빌드의 덮어쓰기(src/variant.ts) — 기본 빌드는 없음 */
const N = VARIANT_TEXT?.install ?? null;


export default defineComponent({
  components: { FeedbackSummary }, // F1_FEEDBACK_ONLY
  setup() {
    const L = computed(() =>
      N ? { ...M[i18n.locale], ...N[i18n.locale] } : M[i18n.locale]
    );
    return {
      feedbackFeatures, // F1_FEEDBACK_ONLY
      pwa, promptInstall, dismissBanner, openInChrome, L,
    };
  },
});
</script>
