<template>
  <div
    v-if="pwa.showBanner"
    :class="
      'fixed z-40 bottom-0 inset-x-0 md:bottom-4 md:right-4 md:left-auto md:w-[26rem] ' +
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

        <!--
          삼성 인터넷: 설치 자체는 되지만 Play 프로텍트가 「안전하지 않은 앱」으로 막는다.
          브라우저가 만드는 WebAPK를 구글이 신뢰하지 않아서 생기는 문제라 우리가 고칠 수 없다.
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
import { computed, defineComponent } from "vue";
import { pwa, promptInstall, dismissBanner, openInChrome } from "../pwa";
import { i18n } from "../i18n";

const M = {
  ko: {
    iconAlt: "홀덤마스터 트레이너 아이콘",
    title: "홈 화면에 추가할까요?",
    samsung1: "삼성 인터넷은 설치할 때 ",
    samsungB1: "「안전하지 않은 앱 차단됨」",
    samsung2: " 경고가 뜹니다 — 브라우저 쪽 문제라 앱과는 무관합니다. ",
    samsungB2: "크롬으로 열면",
    samsung3: " 경고 없이 설치됩니다.",
    default1: "아이콘 하나로 바로 열리고, ",
    defaultB1: "교육 예제 13종과 트레이너를 기기에 저장",
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
      "여기서 그대로 설치하려면 경고창의 [세부정보 더보기] → [무시하고 설치]를 누르면 됩니다.",
    safety:
      "프로그램이 깔리는 게 아니라 브라우저 바로가기입니다. 권한을 요구하지 않고, 지울 때도 앱처럼 길게 눌러 삭제하면 끝입니다.",
    close: "닫기",
  },
  en: {
    iconAlt: "HoldemMaster GTO Trainer icon",
    title: "Add to your home screen?",
    samsung1: "Samsung Internet may ",
    samsungB1: "block the install for security",
    samsung2: " — that check comes from the browser, not from this app. ",
    samsungB2: "Open it in Chrome",
    samsung3: " and it installs without the warning.",
    default1: "It opens with a single tap, and ",
    defaultB1: "keeps all 13 Study Spots and the Trainer on your device",
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
      "To install here anyway, follow the prompts in the dialog to allow it.",
    safety:
      "Nothing gets installed on your system — it's just a browser shortcut. It asks for no permissions, and you can remove it anytime by long-pressing the icon, just like an app.",
    close: "Close",
  },
  ja: {
    iconAlt: "HoldemMaster GTOトレーナーのアイコン",
    title: "ホーム画面に追加しますか？",
    samsung1: "Samsung Internetでは、ブラウザや端末が",
    samsungB1: "セキュリティ上の理由でインストールをブロック",
    samsung2: "することがあります — ブラウザ側の確認であり、本アプリの問題ではありません。",
    samsungB2: "Chromeで開くと",
    samsung3: "警告なしでインストールできます。",
    default1: "アイコン1つですぐ開けて、",
    defaultB1: "学習スポット13種とトレーナーを端末に保存",
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
      "このままインストールする場合は、表示された画面の案内に従って許可してください。",
    safety:
      "プログラムがインストールされるわけではなく、ブラウザのショートカットです。権限を要求せず、削除するときもアプリと同じようにアイコンを長押しして削除するだけです。",
    close: "閉じる",
  },
  es: {
    iconAlt: "Ícono de HoldemMaster GTO Trainer",
    title: "¿Agregar a tu pantalla de inicio?",
    samsung1: "Samsung Internet puede ",
    samsungB1: "bloquear la instalación por seguridad",
    samsung2: " — es una comprobación del navegador, no un problema de esta app. ",
    samsungB2: "Ábrela en Chrome",
    samsung3: " y se instala sin la advertencia.",
    default1: "Se abre con un solo toque y ",
    defaultB1: "guarda los 13 Spots de estudio y el Entrenador en tu dispositivo",
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
      "Para instalar aquí de todos modos, sigue las indicaciones del aviso para permitirlo.",
    safety:
      "No se instala nada en tu sistema — es solo un acceso directo del navegador. No pide permisos y puedes quitarlo cuando quieras manteniendo presionado el ícono, como cualquier app.",
    close: "Cerrar",
  },
  pt: {
    iconAlt: "Ícone do HoldemMaster GTO Trainer",
    title: "Adicionar à sua tela de início?",
    samsung1: "O Samsung Internet pode ",
    samsungB1: "bloquear a instalação por segurança",
    samsung2: " — é uma verificação do navegador, não um problema deste app. ",
    samsungB2: "Abra no Chrome",
    samsung3: " e a instalação acontece sem o aviso.",
    default1: "Abre com um toque só e ",
    defaultB1: "guarda os 13 Spots de estudo e o Treinador no seu dispositivo",
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
      "Para instalar aqui mesmo assim, siga as instruções do aviso para permitir.",
    safety:
      "Nada é instalado no seu sistema — é apenas um atalho do navegador. Ele não pede permissões e você pode removê-lo quando quiser mantendo o ícone pressionado, como qualquer app.",
    close: "Fechar",
  },
  de: {
    iconAlt: "Icon des HoldemMaster GTO Trainers",
    title: "Zum Startbildschirm hinzufügen?",
    samsung1: "Samsung Internet kann ",
    samsungB1: "die Installation aus Sicherheitsgründen blockieren",
    samsung2:
      " – das ist eine Sicherheitsabfrage des Browsers, kein Problem dieser App. ",
    samsungB2: "Öffne die Seite in Chrome",
    samsung3: ", dann läuft die Installation ohne Warnung.",
    // „Tipp“ ist im Deutschen ein Ratschlag (oder eine Wette) — die Geste heißt Fingertipp
    default1: "Ein Fingertipp genügt zum Öffnen, und ",
    defaultB1: "alle 13 Lernspots und der Trainer bleiben auf deinem Gerät",
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
      "Wenn du trotzdem hier installieren willst, folge den Hinweisen im Dialog und erlaube es.",
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
    samsung2: "——这是浏览器自己做的安全拦截，跟这个应用无关。",
    samsungB2: "改用 Chrome 打开",
    samsung3: "，就不会有这个提示。",
    default1: "点一下图标就能打开，而且",
    defaultB1: "13 个教学案例和训练器都会存到你的设备里",
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
    samsungHint: "如果还是想在这里装，按提示框里的指引选择允许就行。",
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
    samsung2: "——這是瀏覽器自己做的安全攔截，跟這個應用程式無關。",
    samsungB2: "改用 Chrome 開啟",
    samsung3: "，就不會有這個提示。",
    default1: "點一下圖示就能開啟，而且",
    defaultB1: "13 個教學案例和訓練器都會存到你的裝置裡",
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
    samsungHint: "如果還是想在這裡裝，照提示視窗裡的指引選擇允許就行。",
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
    samsungB1: "bloquer l'installation pour des raisons de sécurité",
    samsung2: " — ce contrôle vient du navigateur, pas de cette app. ",
    samsungB2: "Ouvre-la dans Chrome",
    samsung3: " et elle s'installe sans l'avertissement.",
    default1: "Elle s'ouvre d'un seul geste, et ",
    defaultB1: "garde les 13 Spots d'étude et le Trainer sur ton appareil",
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
      "Pour l'installer ici quand même, suis les indications de la boîte de dialogue pour l'autoriser.",
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
    samsungB1: "memblokir pemasangan demi keamanan",
    samsung2: " — pemeriksaan ini datang dari browser, bukan dari aplikasi ini. ",
    samsungB2: "Buka di Chrome",
    samsung3: " dan aplikasi terpasang tanpa peringatan itu.",
    default1: "Terbuka dengan sekali sentuh, dan ",
    defaultB1: "menyimpan 13 Spot belajar serta Trainer di perangkat Anda",
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
      "Kalau tetap ingin memasang di sini, ikuti petunjuk di kotak dialog untuk mengizinkannya.",
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
    samsung2: "। यह जाँच ब्राउज़र या डिवाइस करता है। आप इसे ",
    samsungB2: "Chrome में खोलकर",
    samsung3: " इंस्टॉल करने की कोशिश कर सकते हैं।",
    default1: "एक टैप में खोलें। यह ",
    defaultB1: "सभी 13 अभ्यास स्पॉट और ट्रेनर आपके डिवाइस पर सेव करता है",
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
    samsungHint: "इसी ब्राउज़र में जारी रखने के लिए स्क्रीन पर दिए गए विकल्प पढ़ें और आगे बढ़ें।",
    safety: "यह ब्राउज़र में चलने वाला वेब ऐप है। इंस्टॉल करने के लिए कैमरा, संपर्क, SMS या लोकेशन की अनुमति नहीं माँगता। दूसरे ऐप की तरह इसके आइकन को देर तक दबाकर इसे हटा सकते हैं।",
    close: "बंद करें",
  },
  ms: {
    iconAlt: "Ikon HoldemMaster GTO Trainer",
    title: "Tambah ke skrin utama?",
    // samsung1 + «굵은» samsungB1 + samsung2 + «굵은» samsungB2 + samsung3 로 한 문장이 된다.
    samsung1: "Samsung Internet mungkin ",
    samsungB1: "menyekat pemasangan atas sebab keselamatan",
    samsung2: " — pemeriksaan itu datang daripada pelayar, bukan daripada aplikasi ini. ",
    samsungB2: "Buka dalam Chrome",
    samsung3: " dan ia akan dipasang tanpa amaran tersebut.",
    default1: "Ia terbuka dengan satu ketikan, dan ",
    defaultB1: "menyimpan kesemua 13 Spot belajar serta Trainer GTO pada peranti anda",
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
      "Kalau anda tetap mahu memasang di sini, ikut arahan dalam kotak dialog untuk membenarkannya.",
    safety:
      "Tiada apa-apa yang dipasang pada sistem anda — ini hanya pintasan pelayar. Ia tidak meminta sebarang kebenaran, dan anda boleh membuangnya bila-bila masa dengan menekan lama ikonnya, seperti aplikasi biasa.",
    close: "Tutup",
  },
} as const;

/* npokers 빌드용 덮어쓰기 — 배너의 «교육 예제·트레이너 저장» 대목을 «앱 저장»으로.
 * 죽은 쪽 사전은 압축 단계에서 번들에서 빠진다. */
declare const __APP_TARGET__: "trainer" | "npokers";
const N =
  __APP_TARGET__ === "npokers"
    ? {
        ko: {
          iconAlt: "npokers 아이콘",
          defaultB1: "앱을 기기에 저장",
          default2: "해 인터넷이 없는 곳에서도 쓸 수 있습니다.",
          ios3: "를 선택하세요. 아이콘 하나로 바로 열리고, 앱이 저장돼 인터넷 없이도 쓸 수 있습니다.",
        },
        en: {
          iconAlt: "npokers icon",
          defaultB1: "keeps the app on your device",
          default2: " so you can use it even without an internet connection.",
          ios3: ". It opens with a single tap and works even offline.",
        },
        ja: {
          iconAlt: "npokers のアイコン",
          defaultB1: "アプリを端末に保存",
          default2: "するので、インターネットのない場所でも使えます。",
          ios3: "を選んでください。アイコン1つですぐ開けて、インターネットなしでも使えます。",
        },
        es: {
          iconAlt: "Ícono de npokers",
          defaultB1: "guarda la app en tu dispositivo",
          default2: " para que puedas usarla incluso sin conexión a internet.",
          ios3: ". Se abre con un solo toque y funciona incluso sin conexión.",
        },
        pt: {
          iconAlt: "Ícone do npokers",
          defaultB1: "guarda o app no seu dispositivo",
          default2: " para você usar mesmo sem conexão com a internet.",
          ios3: ". Abre com um toque só e funciona mesmo sem conexão.",
        },
        de: {
          iconAlt: "npokers-Icon",
          defaultB1: "die App bleibt auf deinem Gerät",
          default2: " – so kannst du sie auch ohne Internetverbindung nutzen.",
          ios3: ". Ein Fingertipp genügt zum Öffnen – die App funktioniert auch offline.",
        },
        zh: {
          iconAlt: "npokers 图标",
          defaultB1: "应用会存到你的设备里",
          default2: "，没网也能用。",
          ios3: "。点一下图标就能打开，没网也能用。",
        },
        "zh-hant": {
          iconAlt: "npokers 圖示",
          defaultB1: "應用程式會存到你的裝置裡",
          default2: "，沒網路也能用。",
          ios3: "。點一下圖示就能開啟，沒網路也能用。",
        },
        fr: {
          iconAlt: "Icône de npokers",
          defaultB1: "garde l'app sur ton appareil",
          default2: " pour l'utiliser même sans connexion internet.",
          ios3: ". Elle s'ouvre d'un geste et fonctionne même hors ligne.",
        },
        id: {
          iconAlt: "Ikon npokers",
          defaultB1: "menyimpan aplikasi di perangkat Anda",
          default2: " supaya tetap bisa dipakai tanpa koneksi internet.",
          ios3: ". Terbuka dengan sekali sentuh dan tetap berfungsi saat offline.",
        },
        hi: {
          iconAlt: "npokers का आइकन",
          defaultB1: "ऐप आपके डिवाइस पर सेव करता है",
          default2: ", ताकि आप बिना इंटरनेट भी इसका इस्तेमाल कर सकें।",
          ios3: " चुनें। ऐप एक टैप में खुलेगा और ऑफ़लाइन भी चलेगा।",
        },
        ms: {
          iconAlt: "Ikon npokers",
          defaultB1: "menyimpan aplikasi pada peranti anda",
          default2: " supaya anda boleh menggunakannya walaupun tiada sambungan internet.",
          ios3: ". Ia terbuka dengan satu ketikan dan tetap berfungsi walaupun di luar talian.",
        },
      }
    : null;


export default defineComponent({
  setup() {
    const L = computed(() =>
      N ? { ...M[i18n.locale], ...N[i18n.locale] } : M[i18n.locale]
    );
    return { pwa, promptInstall, dismissBanner, openInChrome, L };
  },
});
</script>
