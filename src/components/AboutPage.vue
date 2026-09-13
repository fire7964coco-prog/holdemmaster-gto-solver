<template>
  <div class="app-home max-w-3xl">
    <!-- 히어로 -->
    <div class="home-intro">
      <!-- 은색 스페이드 심볼 -->
      <div
        class="silver-text text-4xl leading-none select-none"
        aria-hidden="true"
      >
        ♠
      </div>
      <div class="mt-2 text-xs font-semibold text-ink-secondary tracking-wide">
        {{ L.community }}
      </div>
      <h1
        class="mt-2 text-[1.75rem] md:text-[2rem] font-semibold tracking-tight leading-[1.2] text-ink-primary"
      >
        {{ L.heroTitle1 }}<br />
        {{ L.heroTitle2 }}
      </h1>
      <p class="mt-3 text-sm text-ink-secondary leading-relaxed">
        <!-- 아래에 «홈 화면에 설치» 버튼이 붙으므로 «설치 파일»이라고 못박는다 -->
        <!-- ⚠ 사이에 공백을 두지 않는다 — 모바일(390px)에서는 <br>이 숨겨져서
             그 공백만 남는다. 공백이 필요한 언어는 heroSub2 «앞»에 직접 넣는다
             (중국어는 전각 쉼표 뒤를 띄우지 않으므로 넣지 않는다) -->
        {{ L.heroSub1 }}<br class="hidden md:block" />{{ L.heroSub2 }}
      </p>

      <div class="flex flex-wrap items-center gap-2 mt-5">
        <!-- 교육예제·트레이너·오늘의문제는 트레이너 빌드 전용 (npokers에는 화면 자체가 없다) -->
        <button
          v-if="FEATURE_TRAINER"
          class="button-base button-blue button-primary"
          @click="store.sideView = 'presets'"
        >
          {{ L.ctaPresets }}
        </button>
        <!-- npokers에서는 프리플랍 차트가 첫 번째(흰) 버튼을 물려받는다 -->
        <button
          v-else
          class="button-base button-blue button-primary"
          @click="store.sideView = 'preflop'"
        >
          {{ L.ctaPreflop }}
        </button>
        <button
          v-if="FEATURE_TRAINER"
          class="button-base bg-surface-3 text-ink-primary border border-neutral-700 hover:bg-surface-4"
          @click="store.sideView = 'trainer'"
        >
          {{ L.ctaTrainer }}
        </button>
        <button
          v-else
          class="button-base bg-surface-3 text-ink-primary border border-neutral-700 hover:bg-surface-4"
          @click="store.sideView = 'equity'"
        >
          {{ L.ctaEquity }}
        </button>
        <!-- 매일 하나뿐이라 «오늘 건 풀었나»가 돌아올 이유가 된다 -->
        <button
          v-if="FEATURE_TRAINER"
          class="button-base bg-surface-3 text-ink-primary border border-neutral-700 hover:bg-surface-4 flex items-center gap-2"
          @click="store.sideView = 'trainer'"
        >
          {{ L.ctaDaily }}
          <span v-if="dailyState.done" class="text-emerald-400" :aria-label="L.dailyDone">✓</span>
          <span v-else class="text-brand">●</span>
        </button>
        <button
          class="button-base bg-surface-3 text-ink-primary border border-neutral-700 hover:bg-surface-4"
          @click="store.sideView = 'guide'"
        >
          {{ L.ctaGuide }}
        </button>
        <!-- 설치 가능한 환경에서만 노출 (이미 설치해서 실행 중이면 숨김) -->
        <button
          v-if="canShowInstallButton()"
          :class="
            'button-base bg-surface-3 border border-neutral-700 hover:bg-surface-4 ' +
            'text-ink-primary flex items-center gap-2'
          "
          @click="requestInstall"
        >
          <span aria-hidden="true">&#9824;</span>
          {{ L.ctaInstall }}
        </button>
      </div>
      <p v-if="canShowInstallButton()" class="mt-2.5 text-xs text-neutral-500">
        <!-- ⚠ 두 문장 사이의 «이음새». 줄바꿈을 그대로 두면 Vue가 공백 하나를 넣는데,
             CJK는 「。」가 이미 여백을 품고 있어 «權限。 安全嗎？»처럼 벌어진다.
             그래서 공백을 HTML이 아니라 «코드»(sentenceGap)가 정한다 (TrainerPage와 같은 처리) -->
        {{ L.installNote }}{{ sentenceGap
        }}<button class="underline hover:text-neutral-300" @click="store.sideView = 'guide'">
          {{ L.installSafe }}
        </button>
      </p>
    </div>

    <!-- 특징 -->
    <!-- 특징: 헤어라인 나열 → 패널로 묶어 다른 화면(트레이너·사용법)과 결을 맞춤 -->
    <div class="panel mt-4" data-w2="features">
      <!-- 본문 폭이 48rem이라 4열은 «데스크톱 솔 / 버 수준»처럼 어색하게 끊긴다 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <div v-for="f in L.features" :key="f.title">
          <div class="text-sm font-semibold text-neutral-100">{{ f.title }}</div>
          <div class="mt-1 text-[0.8125rem] leading-relaxed text-neutral-500">
            {{ f.desc }}
          </div>
        </div>
        <div data-w2="lock-feature">
          <div class="text-sm font-semibold text-neutral-100" data-w2="lock-feature-title">
            {{ L.featureLockTitle }}
          </div>
          <div class="mt-1 text-[0.8125rem] leading-relaxed text-neutral-500" data-w2="lock-feature-desc">
            {{ L.featureLockDesc }}
          </div>
        </div>
      </div>
    </div>

    <!-- 시작 안내 -->
    <div class="panel mt-4" data-w2="steps">
      <div class="section-title">{{ L.stepsTitle }}</div>
      <div class="mt-3 space-y-2.5">
        <div v-for="(s, i) in L.steps" :key="i" class="flex items-baseline gap-3">
          <span
            class="shrink-0 w-5 text-right text-sm font-semibold text-brand tabular-nums"
            >{{ i + 1 }}</span
          >
          <span class="text-sm text-neutral-300">{{ s }}</span>
        </div>
        <div class="flex items-baseline gap-3" data-w2="lock-step">
          <span class="shrink-0 w-5 text-right text-sm font-semibold text-brand tabular-nums">
            {{ L.steps.length + 1 }}
          </span>
          <span class="text-sm text-neutral-300" data-w2="lock-step-text">
            {{ FEATURE_TRAINER ? L.step5Trainer : L.step5Solver }}
          </span>
        </div>
      </div>
      <!-- 본체 랜딩(정보형 콘텐츠)으로 연결 — 앱은 도구, 랜딩은 설명 역할 분담 -->
      <!-- 그 언어의 랜딩이 본체에 없으면 문단째 숨긴다.
           2026-08-27 라이브 실측 기준 9개 언어 전부 /xx/solver가 200이라 지금은 전부 보인다 —
           숨김 경로는 본체가 새 언어를 늘리는 동안의 과도기용으로 남겨 둔다 -->
      <div
        v-if="landingUrl"
        class="mt-5 pt-4 border-t border-neutral-700 text-[0.8125rem] text-neutral-500"
      >
        {{ L.landingBefore }}
        <a
          :href="landingUrl"
          class="text-neutral-300 underline decoration-neutral-600 underline-offset-2 hover:text-white"
          target="_blank"
          >{{ L.landingLink }}</a
        >{{ L.landingAfter }}
      </div>
    </div>

    <!-- 알아둘 점 + 크레딧 -->
    <div class="mt-6 pt-4 border-t border-white/10 text-[0.8125rem] leading-relaxed text-neutral-500">
      <p>
        {{ L.notes }}
      </p>
      <p class="mt-3">
        {{ L.creditBefore }}
        <a
          href="https://github.com/b-inary/wasm-postflop"
          class="text-neutral-400 underline decoration-neutral-600 underline-offset-2 hover:text-neutral-200"
          target="_blank"
          >WASM Postflop</a
        >{{ L.creditMid1 }}
        <a
          :href="creditUrl"
          class="text-neutral-400 underline decoration-neutral-600 underline-offset-2 hover:text-neutral-200"
          target="_blank"
          >{{ L.creditBrand }}</a
        >{{ L.creditMid2 }}
        <a
          href="https://github.com/fire7964coco-prog/holdemmaster-gto-solver"
          class="text-neutral-400 underline decoration-neutral-600 underline-offset-2 hover:text-neutral-200"
          target="_blank"
          >GitHub</a
        >{{ L.creditAfter }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { requestInstall, canShowInstallButton } from "../pwa";
// 빌드 2벌 분기 — npokers 빌드에서는 스텁이 들어온다 (webpack alias, src/features/ 참조)
import { dailyState, loadDailyState, FEATURE_TRAINER } from "@features";
import { useStore } from "../store";
import { mainSiteUrl } from "../outbound";
import { i18n } from "../i18n";

const M = {
  ko: {
    community: "홀덤마스터 커뮤니티",
    heroTitle1: "GTO 전략,",
    heroTitle2: "브라우저에서 바로.",
    heroSub1: "설치 파일도, 결제도 없습니다. 레인지와 보드를 넣으면",
    heroSub2: " 상황별 최적 전략을 내 컴퓨터에서 직접 계산합니다.",
    ctaPresets: "예제 결과 바로 보기",
    ctaTrainer: "GTO 트레이너",
    ctaDaily: "오늘의 문제",
    dailyDone: "완료",
    ctaGuide: "사용법 보기",
    ctaInstall: "홈 화면에 설치",
    installNote:
      "설치하면 교육 예제와 트레이너가 기기에 저장돼 인터넷이 끊겨도 문제를 풀 수 있습니다. 프로그램이 아니라 브라우저 바로가기라 권한을 요구하지 않습니다 —",
    installSafe: "안전한가요?",
    features: [
      { title: "무료", desc: "횟수 제한 없이 모든 기능을 그대로" },
      // 「설치 없음」은 홈 화면 설치를 넣은 뒤로 앞뒤가 안 맞아 뺐다 (2026-08-15)
      { title: "오프라인 학습", desc: "홈 화면에 설치하면 인터넷 없이도" },
      { title: "빠른 계산", desc: "멀티스레드로 데스크톱 솔버 수준" },
      { title: "GTO 트레이너", desc: "문제를 풀고 팟 대비 EV 손실로 채점받기" },
    ],
    featureLockTitle: "전략 고정(노드락)",
    featureLockDesc: "상대 전략을 내가 정해 놓고 다시 계산 — 상대가 실수하면 내 전략이 어떻게 바뀌는지",
    step5Trainer: "계산이 끝나면 「이 노드의 전략 고정」으로 상대 전략을 바꿔 보고, 「이 스팟으로 연습」으로 그 스팟을 문제로 풀어보세요",
    step5Solver: "계산이 끝나면 「이 노드의 전략 고정」으로 상대 전략을 바꿔 보세요",
    stepsTitle: "처음이라면",
    steps: [
      "교육 예제에서 아무 스팟이나 [결과 바로 보기] — 기다림 없이 결과가 나옵니다",
      "사용법에서 결과 화면 읽는 법을 확인하세요",
      "GTO 트레이너에서 문제를 풀어보세요 — 내 선택이 몇 bb 손해인지 알려줍니다",
      "익숙해지면 커스텀 스팟(①~⑤)으로 내 핸드를 직접 계산해보세요",
    ],
    landingBefore: "GTO 솔버가 무엇인지, 결과를 어떻게 읽는지 글로 먼저 보고 싶다면",
    landingLink: "홀덤마스터 솔버 소개·사용법",
    landingAfter: "을 참고하세요.",
    notes:
      "iOS·Safari에서는 브라우저 제약으로 단일 스레드로 동작해 계산이 느립니다 — macOS에서는 Chrome을 권장합니다. 사용 가능한 메모리는 4GB로 제한되며(WebAssembly 한계), 큰 스팟의 직접 계산은 PC에서 더 쾌적합니다.",
    creditBefore: "이 프로그램은",
    creditMid1: " (Wataru Inariba 작, AGPL-3.0)을 기반으로",
    creditBrand: "홀덤마스터",
    creditMid2: "가 한국어화·개선한 버전이며, 수정된 전체 소스코드는",
    creditAfter: "에 동일한 라이선스로 공개되어 있습니다.",
  },
  en: {
    community: "HoldemMaster Community",
    heroTitle1: "GTO strategy,",
    heroTitle2: "right in your browser.",
    heroSub1: "Nothing to install, nothing to pay. Enter your ranges and a board,",
    heroSub2: " and the optimal strategy is computed right on your own device.",
    ctaPresets: "View Study Spots",
    ctaTrainer: "GTO Trainer",
    ctaDaily: "Daily Puzzle",
    dailyDone: "Done",
    ctaGuide: "How to Use",
    ctaInstall: "Add to Home Screen",
    installNote:
      "Installing saves the Study Spots and Trainer to your device, so you can keep practicing even when you're offline. It's a browser shortcut, not a program — it never asks for any permissions.",
    installSafe: "Is it safe?",
    features: [
      { title: "Free", desc: "Every feature, no usage limits" },
      { title: "Offline Study", desc: "Add it to your home screen and practice without an internet connection" },
      { title: "Fast Solving", desc: "Multithreaded — desktop-solver speed" },
      { title: "GTO Trainer", desc: "Play spots, graded on EV loss relative to the pot" },
    ],
    featureLockTitle: "Strategy locking (node lock)",
    featureLockDesc: "Set the opponent’s strategy and solve again — see how your strategy changes when the opponent makes mistakes",
    step5Trainer: "After solving, use [Lock this node’s strategy] to try changing the opponent’s strategy, then [Practice this spot] to answer questions about that spot",
    step5Solver: "After solving, use [Lock this node’s strategy] to try changing the opponent’s strategy",
    stepsTitle: "New here?",
    steps: [
      "Open any spot under Study Spots and hit [View results] — solutions appear instantly",
      "Check How to Use to learn how to read the results screen",
      "Try the GTO Trainer — it shows exactly how many bb each decision costs you",
      "Once you're comfortable, solve your own hands with Custom Spot (①–⑤)",
    ],
    landingBefore:
      "Prefer to read up first on what a GTO solver is and how to interpret the output? See",
    landingLink: "the HoldemMaster solver guide",
    landingAfter: ".",
    notes:
      "On iOS and Safari, browser limitations force single-threaded solving, so it runs slower — on macOS we recommend Chrome. Available memory is capped at 4GB (a WebAssembly limit), so solving big spots yourself is smoother on a PC.",
    creditBefore: "This app is based on",
    creditMid1: " (by Wataru Inariba, AGPL-3.0), localized and enhanced by",
    creditBrand: "HoldemMaster",
    creditMid2: ". The full modified source code is published on",
    creditAfter: " under the same license.",
  },
  ja: {
    community: "HoldemMaster コミュニティ",
    heroTitle1: "GTO戦略を、",
    heroTitle2: "ブラウザですぐに。",
    heroSub1: "インストールも支払いも不要です。レンジとボードを入力すると、",
    heroSub2: " 状況ごとの最適戦略をお使いの端末上で直接計算します。",
    ctaPresets: "例題の結果をすぐ見る",
    ctaTrainer: "GTOトレーナー",
    ctaDaily: "今日のGTO問題",
    dailyDone: "完了",
    ctaGuide: "使い方を見る",
    ctaInstall: "ホーム画面に追加",
    installNote:
      "インストールすると学習スポットとトレーナーが端末に保存され、インターネットが切れても問題を解けます。プログラムではなくブラウザのショートカットなので、権限を要求しません —",
    installSafe: "安全ですか？",
    features: [
      { title: "無料", desc: "回数制限なく全機能を利用できます" },
      { title: "オフライン学習", desc: "ホーム画面に追加すればインターネットなしでも学習できます" },
      { title: "高速計算", desc: "マルチスレッドでデスクトップソルバー級" },
      { title: "GTOトレーナー", desc: "問題を解いてポット比のEVロスで採点" },
    ],
    featureLockTitle: "戦略固定（ノードロック）",
    featureLockDesc: "相手の戦略を決めて再計算 — 相手のミスで自分の戦略がどう変わるかを見る",
    step5Trainer: "計算が終わったら[このノードの戦略を固定]で相手の戦略を変え、[このスポットで練習]でそのスポットを問題として解いてみましょう",
    step5Solver: "計算が終わったら[このノードの戦略を固定]で相手の戦略を変えてみましょう",
    stepsTitle: "初めての方へ",
    steps: [
      "学習スポットからどれか一つを開いて[結果をすぐ見る]を押してください — 待ち時間なしで結果が表示されます",
      "使い方で結果画面の読み方を確認しましょう",
      "GTOトレーナーで問題を解いてみましょう — 自分の選択が何bbの損失かを教えてくれます",
      "慣れてきたらカスタムスポット（①〜⑤）で自分のハンドを直接計算してみましょう",
    ],
    landingBefore: "GTOソルバーとは何か、結果をどう読むかを先に記事で読みたい方は",
    landingLink: "HoldemMasterソルバーの紹介・使い方",
    landingAfter: "をご覧ください。",
    notes:
      "iOS・Safariではブラウザの制約によりシングルスレッドで動作するため、計算が遅くなります — macOSではChromeを推奨します。使用可能なメモリは4GBに制限されており（WebAssemblyの上限）、大きなスポットの直接計算はPCの方が快適です。",
    creditBefore: "本アプリは",
    creditMid1: "（Wataru Inariba作、AGPL-3.0）をベースに",
    creditBrand: "HoldemMaster",
    creditMid2: "がローカライズ・改良したバージョンで、修正した全ソースコードは",
    creditAfter: "に同じライセンスで公開されています。",
  },
  es: {
    community: "Comunidad HoldemMaster",
    heroTitle1: "Estrategia GTO,",
    heroTitle2: "directo en tu navegador.",
    heroSub1: "Nada que instalar, nada que pagar. Ingresa tus rangos y un board,",
    heroSub2: " y la estrategia óptima se calcula en tu propio dispositivo.",
    ctaPresets: "Ver ejemplos resueltos",
    ctaTrainer: "Entrenador GTO",
    ctaDaily: "Reto del día",
    dailyDone: "Hecho",
    ctaGuide: "Cómo usarlo",
    ctaInstall: "Agregar a inicio",
    installNote:
      "Al instalarlo, los Spots de estudio y el Entrenador se guardan en tu dispositivo, para que puedas seguir practicando incluso sin conexión. Es un acceso directo del navegador, no un programa — nunca pide permisos.",
    installSafe: "¿Es seguro?",
    features: [
      { title: "Gratis", desc: "Todas las funciones, sin límites de uso" },
      { title: "Estudio offline", desc: "Agrégalo a tu pantalla de inicio y practica sin internet" },
      { title: "Cálculo rápido", desc: "Multihilo — velocidad de solver de escritorio" },
      { title: "Entrenador GTO", desc: "Juega spots; tu nota sale de la pérdida de EV respecto al bote" },
    ],
    featureLockTitle: "Estrategia fija (node lock)",
    featureLockDesc: "Define la estrategia del rival y vuelve a calcular — mira cómo cambia tu estrategia cuando el rival comete errores",
    step5Trainer: "Al terminar el cálculo, prueba a cambiar la estrategia del rival con [Fijar la estrategia de este nodo] y resuelve ejercicios de ese spot con [Practicar este spot]",
    step5Solver: "Al terminar el cálculo, prueba a cambiar la estrategia del rival con [Fijar la estrategia de este nodo]",
    stepsTitle: "¿Primera vez aquí?",
    steps: [
      "Abre cualquier spot en Spots de estudio y toca [Ver resultados] — las soluciones aparecen al instante",
      "Revisa Cómo usarlo para aprender a leer la pantalla de resultados",
      "Prueba el Entrenador GTO — te muestra exactamente cuántos bb te cuesta cada decisión",
      "Cuando te sientas a gusto, resuelve tus propias manos con el Spot personalizado (①~⑤)",
    ],
    landingBefore:
      "¿Prefieres leer primero qué es un solver GTO y cómo interpretar sus resultados? Consulta",
    landingLink: "la guía del solver de HoldemMaster",
    landingAfter: ".",
    notes:
      "En iOS y Safari, las limitaciones del navegador fuerzan el cálculo con un solo hilo, así que corre más lento — en macOS recomendamos Chrome. La memoria disponible está limitada a 4GB (límite de WebAssembly), por lo que resolver spots grandes resulta más cómodo en una PC.",
    creditBefore: "Esta app está basada en",
    creditMid1: " (de Wataru Inariba, AGPL-3.0), localizada y mejorada por",
    creditBrand: "HoldemMaster",
    creditMid2: ". El código fuente modificado completo está publicado en",
    creditAfter: " bajo la misma licencia.",
  },
  pt: {
    community: "Comunidade HoldemMaster",
    heroTitle1: "Estratégia GTO,",
    heroTitle2: "direto no seu navegador.",
    heroSub1: "Nada para instalar, nada para pagar. Informe seus ranges e um board,",
    heroSub2: " e a estratégia ótima é calculada no seu próprio dispositivo.",
    ctaPresets: "Ver os Spots de estudo",
    ctaTrainer: "Treinador GTO",
    ctaDaily: "Desafio do dia",
    dailyDone: "Feito",
    ctaGuide: "Como usar",
    ctaInstall: "Adicionar à tela",
    installNote:
      "Ao instalar, os Spots de estudo e o Treinador ficam salvos no seu dispositivo, para você continuar praticando mesmo sem conexão. É um atalho do navegador, não um programa — ele nunca pede permissões.",
    installSafe: "É seguro?",
    features: [
      { title: "Grátis", desc: "Todos os recursos, sem limite de uso" },
      { title: "Estudo offline", desc: "Adicione à tela de início e pratique sem internet" },
      { title: "Cálculo rápido", desc: "Multithread — velocidade de solver de desktop" },
      { title: "Treinador GTO", desc: "Jogue spots; sua nota vem da perda de EV em relação ao pote" },
    ],
    featureLockTitle: "Estratégia fixa (node lock)",
    featureLockDesc: "Defina a estratégia do adversário e calcule de novo — veja como sua estratégia muda quando ele comete erros",
    step5Trainer: "Quando o cálculo terminar, experimente mudar a estratégia do adversário com [Fixar a estratégia deste nó] e responda a questões desse spot com [Praticar este spot]",
    step5Solver: "Quando o cálculo terminar, experimente mudar a estratégia do adversário com [Fixar a estratégia deste nó]",
    stepsTitle: "É a sua primeira vez aqui?",
    steps: [
      "Abra qualquer spot em Spots de estudo e use [Ver resultados] — as soluções aparecem na hora",
      "Veja Como usar para aprender a ler a tela de resultados",
      "Experimente o Treinador GTO — ele mostra exatamente quantos bb cada decisão custa a você",
      "Quando estiver à vontade, resolva suas próprias mãos com o Spot personalizado (① → ⑤)",
    ],
    landingBefore:
      "Prefere ler primeiro o que é um solver GTO e como interpretar os resultados? Confira",
    landingLink: "o guia do solver da HoldemMaster",
    landingAfter: ".",
    notes:
      "No iOS e no Safari, as limitações do navegador forçam o cálculo em uma única thread, então tudo roda mais devagar — no macOS recomendamos o Chrome. A memória disponível é limitada a 4 GB (limite do WebAssembly), por isso resolver spots grandes fica mais confortável em um PC.",
    creditBefore: "Este app é baseado no",
    creditMid1: " (de Wataru Inariba, AGPL-3.0), localizado e aprimorado pela",
    creditBrand: "HoldemMaster",
    creditMid2: ". Todo o código-fonte modificado está publicado no",
    creditAfter: " sob a mesma licença.",
  },
  de: {
    community: "HoldemMaster Community",
    heroTitle1: "GTO-Strategie,",
    heroTitle2: "direkt im Browser.",
    heroSub1:
      "Nichts zu installieren, nichts zu bezahlen. Gib deine Ranges und ein Board ein,",
    heroSub2:
      " und die optimale Strategie wird direkt auf deinem Gerät berechnet.",
    ctaPresets: "Lernspots ansehen",
    ctaTrainer: "GTO-Trainer",
    ctaDaily: "Tagesaufgabe",
    dailyDone: "Erledigt",
    ctaGuide: "Anleitung",
    ctaInstall: "Zum Startbildschirm hinzufügen",
    installNote:
      "Nach der Installation liegen die Lernspots und der Trainer auf deinem Gerät, sodass du auch offline weiterüben kannst. Es ist eine Browser-Verknüpfung, kein Programm – sie fragt nie nach Berechtigungen.",
    installSafe: "Ist das sicher?",
    features: [
      { title: "Kostenlos", desc: "Alle Funktionen, ohne Nutzungslimit" },
      {
        title: "Offline lernen",
        desc: "Zum Startbildschirm hinzufügen und ohne Internet üben",
      },
      { title: "Schnelles Solving", desc: "Multithreaded – Tempo eines Desktop-Solvers" },
      { title: "GTO-Trainer", desc: "Spots spielen, benotet nach EV-Verlust im Verhältnis zum Pot" },
    ],
    featureLockTitle: "Strategie fixieren (Node Lock)",
    featureLockDesc: "Lege die Strategie des Gegners fest und berechne neu – sieh, wie sich deine Strategie ändert, wenn er Fehler macht",
    step5Trainer: "Wenn die Berechnung fertig ist, ändere mit [Strategie dieses Knotens fixieren] die Strategie des Gegners und löse mit [Diesen Spot üben] Aufgaben zu diesem Spot",
    step5Solver: "Wenn die Berechnung fertig ist, probiere mit [Strategie dieses Knotens fixieren] eine andere Strategie des Gegners aus",
    stepsTitle: "Neu hier?",
    steps: [
      "Öffne einen beliebigen Spot unter Lernspots und starte [Ergebnisse ansehen] – die Lösung erscheint sofort",
      "Schau in die Anleitung, wie du den Ergebnisbildschirm liest",
      "Probiere den GTO-Trainer – er zeigt dir, wie viele bb dich jede Entscheidung kostet",
      "Wenn du dich sicher fühlst, berechne eigene Hände unter Eigener Spot (①–⑤)",
    ],
    landingBefore:
      "Du willst erst nachlesen, was ein GTO-Solver ist und wie du die Ausgabe liest? Dann schau in",
    landingLink: "den Solver-Guide von HoldemMaster",
    landingAfter: ".",
    notes:
      "Unter iOS und Safari erzwingen Einschränkungen des Browsers das Rechnen mit nur einem Thread, deshalb läuft es langsamer – unter macOS empfehlen wir Chrome. Der verfügbare Speicher ist auf 4 GB begrenzt (ein WebAssembly-Limit), große Spots rechnest du also bequemer am PC.",
    creditBefore: "Diese App basiert auf",
    creditMid1: " (von Wataru Inariba, AGPL-3.0), lokalisiert und erweitert von",
    creditBrand: "HoldemMaster",
    creditMid2: ". Der vollständige geänderte Quellcode ist auf",
    creditAfter: " unter derselben Lizenz veröffentlicht.",
  },
  // 중국어 인용부호는 대륙 표준인 “ ”를 쓴다 — 「 」는 대만·홍콩·일본 관습이라
  // 간체판에 섞이면 «번체 냄새»가 난다 (본체 브리프 §6 간체자 철저 원칙의 연장)
  zh: {
    community: "HoldemMaster 社区",
    heroTitle1: "GTO 策略，",
    heroTitle2: "打开浏览器就能算。",
    heroSub1: "不用装软件，也不用花钱。填好范围和公共牌，",
    heroSub2: "最优策略就会在你自己的设备上算出来。",
    ctaPresets: "去看教学案例",
    ctaTrainer: "GTO 训练器",
    ctaDaily: "今日题目",
    dailyDone: "已完成",
    ctaGuide: "查看使用方法",
    ctaInstall: "添加到主屏幕",
    installNote:
      "装上之后，教学案例和训练器都会存到你的设备里，断网也能接着练。它只是一个浏览器快捷方式，不是软件，从不索取任何权限。",
    installSafe: "安全吗？",
    features: [
      { title: "免费", desc: "全部功能，不限次数" },
      { title: "离线学习", desc: "添加到主屏幕，没网也能练" },
      { title: "算得快", desc: "多线程——接近桌面版求解器的速度" },
      { title: "GTO 训练器", desc: "做题，按占底池的 EV 损失打分" },
    ],
    featureLockTitle: "固定策略（node lock）",
    featureLockDesc: "自己设定对手策略后重新计算——看看对手犯错时，你的策略会怎么变",
    step5Trainer: "计算结束后，用“固定此节点的策略”试着改变对手的策略，再用“用这个场景练习”把这个场景变成题目来练习",
    step5Solver: "计算结束后，用“固定此节点的策略”试着改变对手的策略",
    stepsTitle: "第一次来？",
    steps: [
      "在教学案例里随便打开一个牌局，点[直接看结果]——不用等，结果马上出来",
      "去[使用方法]看看结果画面该怎么读",
      "试试 GTO 训练器——它会告诉你每个选择亏了多少 bb",
      "上手之后，用自定义牌局（①~⑤）算你自己的手牌",
    ],
    // ✅ 살아났다 — 본체 /zh/solver 200 (2026-08-27 라이브 실측. 08-21에는 404였다).
    //   outbound.ts LOCALE_PATHS.zh에 "/solver"를 넣어 v-if="landingUrl"이 열렸다.
    landingBefore: "想先读文章，弄清 GTO 求解器是什么、结果怎么看？可以看",
    landingLink: "HoldemMaster 求解器使用指南",
    landingAfter: "。",
    notes:
      "在 iOS 上、以及在 Safari 里，浏览器的限制会让计算只能走单线程，所以会慢一些——macOS 上建议用 Chrome。可用内存上限是 4GB（WebAssembly 的限制），计算量大的牌局自己算的话，在电脑上更顺畅。",
    creditBefore: "本应用基于",
    // 앞뒤 링크와 붙는 조각이다. 「WASM Postflop（…」처럼 라틴문자 뒤 전각 괄호는 띄우지 않는다
    creditMid1: "（Wataru Inariba 制作，AGPL-3.0），由",
    creditBrand: "HoldemMaster",
    // 앞의 공백은 «필요»하다 — 템플릿에서 </a> 바로 뒤에 붙어 「HoldemMaster本地化」가 되어 버린다.
    // 중국어 조판은 한자와 라틴문자 사이를 띄운다
    creditMid2: " 本地化并改进。修改后的完整源代码发布在",
    creditAfter: "，采用相同的开源许可协议。",
  },
  // ⚠ 台灣 소프트웨어 표기는 대륙과 «단어 자체»가 다르다:
  //   社区→社群 · 浏览器→瀏覽器 · 软件→軟體 · 设备→裝置 · 线程→執行緒 · 内存→記憶體 ·
  //   快捷方式→捷徑 · 源代码→原始碼 · 许可协议→授權條款 · 本地化→在地化 · 主屏幕→主畫面
  "zh-hant": {
    community: "HoldemMaster 社群",
    heroTitle1: "GTO 策略，",
    heroTitle2: "打開瀏覽器就能算。",
    heroSub1: "不用裝軟體，也不用花錢。填好範圍和公共牌，",
    heroSub2: "最佳策略就會在你自己的裝置上算出來。",
    ctaPresets: "去看教學案例",
    ctaTrainer: "GTO 訓練器",
    ctaDaily: "今日題目",
    dailyDone: "已完成",
    ctaGuide: "查看使用方法",
    // 우리 앱의 버튼 이름이다 — 台灣 iOS·Android가 쓰는 「主畫面」에 맞춘다(대륙은 「主屏幕」)
    ctaInstall: "加入主畫面",
    installNote:
      "裝上之後，教學案例和訓練器都會存到你的裝置裡，沒網路也能接著練。它只是一個瀏覽器捷徑，不是軟體，從不索取任何權限。",
    installSafe: "安全嗎？",
    features: [
      { title: "免費", desc: "全部功能，不限次數" },
      { title: "離線學習", desc: "加入主畫面，沒網路也能練" },
      { title: "算得快", desc: "多執行緒——接近桌面版解算器的速度" },
      { title: "GTO 訓練器", desc: "做題，按佔底池的 EV 損失評分" },
    ],
    featureLockTitle: "固定策略（node lock）",
    featureLockDesc: "自己設定對手策略後重新計算——看看對手犯錯時，你的策略會怎麼變",
    step5Trainer: "計算結束後，用「固定此節點的策略」試著改變對手的策略，再用「用這個場景練習」把這個場景變成題目來練習",
    step5Solver: "計算結束後，用「固定此節點的策略」試著改變對手的策略",
    stepsTitle: "第一次來？",
    steps: [
      "在教學案例裡隨便打開一個牌局，按下[⚡ 直接看結果]——不用等，結果馬上出來",
      "去[使用方法]看看結果畫面該怎麼讀",
      "試試 GTO 訓練器——它會告訴你每個選擇虧了多少 bb",
      "上手之後，用自訂牌局（①～⑤）算你自己的手牌",
    ],
    // ✅ 살아났다 — 본체 /zh-hant/solver 200 (2026-08-27 라이브 실측. 08-22에는 폴더 자체가 없었다).
    //   outbound.ts LOCALE_PATHS["zh-hant"]에 "/solver"를 넣어 v-if="landingUrl"이 열렸다.
    landingBefore: "想先讀文章，弄清 GTO 解算器是什麼、結果怎麼看？可以看",
    landingLink: "HoldemMaster 解算器使用指南",
    landingAfter: "。",
    notes:
      "在 iOS 和 Safari 上，瀏覽器的限制會讓計算只能以單一執行緒計算，所以會慢一些——macOS 上建議用 Chrome。可用記憶體上限是 4GB（WebAssembly 的限制），計算量大的牌局自己算的話，在電腦上更順暢。",
    creditBefore: "本應用程式基於",
    // 앞뒤 링크와 붙는 조각이다. 「WASM Postflop（…」처럼 라틴문자 뒤 전각 괄호는 띄우지 않는다
    creditMid1: "（Wataru Inariba 製作，AGPL-3.0），由",
    creditBrand: "HoldemMaster",
    // 앞의 공백은 «필요»하다 — 템플릿에서 </a> 바로 뒤에 붙어 「HoldemMaster在地化」가 되어 버린다.
    // 중국어 조판은 한자와 라틴문자 사이를 띄운다
    creditMid2: " 在地化並改進。修改後的完整原始碼發布在",
    creditAfter: "，採用相同的開源授權條款。",
  },
  fr: {
    community: "Communauté HoldemMaster",
    heroTitle1: "La stratégie GTO,",
    heroTitle2: "directement dans ton navigateur.",
    heroSub1: "Rien à installer, rien à payer. Saisis tes ranges et un board,",
    heroSub2: " et la stratégie optimale se calcule directement sur ton appareil.",
    ctaPresets: "Voir les Spots d'étude",
    ctaTrainer: "Trainer GTO",
    ctaDaily: "Défi du jour",
    dailyDone: "Terminé",
    ctaGuide: "Mode d'emploi",
    ctaInstall: "Ajouter à l'écran d'accueil",
    installNote:
      "L'installation garde les Spots d'étude et le Trainer sur ton appareil, pour continuer à t'entraîner même hors ligne. C'est un raccourci du navigateur, pas un programme — il ne demande jamais aucune permission.",
    installSafe: "C'est sûr ?",
    features: [
      { title: "Gratuit", desc: "Toutes les fonctions, sans limite d'usage" },
      { title: "Étude hors ligne", desc: "Ajoute-le à ton écran d'accueil et entraîne-toi sans connexion" },
      { title: "Calcul rapide", desc: "Multithread — la vitesse d'un solver de bureau" },
      { title: "Trainer GTO", desc: "Joue des spots, notés sur la perte d'EV par rapport au pot" },
    ],
    featureLockTitle: "Stratégie fixée (node lock)",
    featureLockDesc: "Définis la stratégie adverse et recalcule — vois comment ta stratégie change quand ton adversaire fait des erreurs",
    step5Trainer: "Une fois le calcul terminé, essaie de changer la stratégie adverse avec [Fixer la stratégie de ce nœud], puis résous des exercices sur ce spot avec [Travailler ce spot]",
    step5Solver: "Une fois le calcul terminé, essaie de changer la stratégie adverse avec [Fixer la stratégie de ce nœud]",
    stepsTitle: "Nouveau ici ?",
    // 버튼 이름 인용은 PresetsPage.viewResults·SideBar와 «글자까지» 같아야 한다
    steps: [
      "Ouvre n'importe quel spot dans Spots d'étude et appuie sur [Voir les résultats] — les solutions s'affichent aussitôt",
      "Passe par Mode d'emploi pour apprendre à lire l'écran de résultats",
      "Essaie le Trainer GTO — il te montre exactement combien de bb chaque décision te coûte",
      "Une fois à l'aise, calcule tes propres mains avec Spot personnalisé (①–⑤)",
    ],
    // ✅ 살아났다 — 본체 /fr/solver 200 (2026-08-27 라이브 실측. 08-24에는 404였다).
    //   outbound.ts LOCALE_PATHS.fr에 "/solver"를 넣어 v-if="landingUrl"이 열렸다.
    landingBefore:
      "Tu préfères d'abord lire ce qu'est un solver GTO et comment interpréter ses résultats ? Va voir",
    landingLink: "le guide du solver HoldemMaster",
    landingAfter: ".",
    notes:
      "Sur iOS et Safari, les limites du navigateur imposent un calcul monothread, donc plus lent — sur macOS, on recommande Chrome. La mémoire disponible est plafonnée à 4 Go (une limite de WebAssembly), donc les gros spots se calculent plus confortablement sur PC.",
    creditBefore: "Cette app est basée sur",
    creditMid1: " (de Wataru Inariba, AGPL-3.0), localisée et enrichie par",
    creditBrand: "HoldemMaster",
    creditMid2: ". Le code source modifié complet est publié sur",
    creditAfter: " sous la même licence.",
  },
  // 인도네시아어 — Anda체(본체 브리프 확정). solver·range·board·Trainer는 본체 id 코퍼스가 영어 그대로 쓴다
  // (리서치 §1·§2). 설치 문구는 «프로그램이 아니라 브라우저 바로가기» 골자를 그대로 옮겼다.
  id: {
    community: "Komunitas HoldemMaster",
    heroTitle1: "Strategi GTO,",
    heroTitle2: "langsung di browser Anda.",
    heroSub1: "Tanpa instal, tanpa bayar. Masukkan range dan board,",
    heroSub2: " lalu strategi optimalnya dihitung langsung di perangkat Anda.",
    ctaPresets: "Lihat Spot belajar",
    ctaTrainer: "Trainer GTO",
    ctaDaily: "Tantangan Harian",
    dailyDone: "Selesai",
    ctaGuide: "Cara pakai",
    ctaInstall: "Pasang ke layar utama",
    installNote:
      "Setelah dipasang, Spot belajar dan Trainer tersimpan di perangkat Anda, jadi latihan tetap berjalan meski offline. Ini pintasan browser, bukan program — tidak pernah meminta izin apa pun.",
    installSafe: "Amankah?",
    features: [
      { title: "Gratis", desc: "Semua fitur, tanpa batas pemakaian" },
      { title: "Belajar offline", desc: "Pasang ke layar utama dan berlatih tanpa koneksi internet" },
      { title: "Perhitungan cepat", desc: "Multithread — secepat solver desktop" },
      { title: "Trainer GTO", desc: "Mainkan spot dan dapatkan skor kerugian EV relatif terhadap pot" },
    ],
    featureLockTitle: "Node lock",
    featureLockDesc: "Tentukan strategi lawan dan hitung ulang — lihat bagaimana strategi Anda berubah saat lawan membuat kesalahan",
    step5Trainer: "Setelah perhitungan selesai, coba ubah strategi lawan dengan [Kunci strategi di node ini], lalu kerjakan soal dari spot itu dengan [Latih spot ini]",
    step5Solver: "Setelah perhitungan selesai, coba ubah strategi lawan dengan [Kunci strategi di node ini]",
    stepsTitle: "Baru di sini?",
    // 버튼 이름 인용은 PresetsPage.viewResults·SideBar와 «글자까지» 같아야 한다
    steps: [
      "Buka spot mana pun di Spot belajar lalu tekan [Lihat hasil] — solusinya langsung tampil",
      "Baca Cara pakai untuk belajar membaca layar hasil",
      "Coba Trainer GTO — Anda akan tahu persis berapa bb yang hilang di setiap keputusan",
      "Setelah terbiasa, hitung hand Anda sendiri lewat Spot kustom (①–⑤)",
    ],
    // ⚠ 이 세 줄이 가리키는 본체 /id/solver는 없다 (2026-09-02 실측 404) —
    //   AboutPage 템플릿의 v-if="landingUrl"이 통째로 숨긴다. 본체에 /id/solver가 생기면
    //   outbound.ts LOCALE_PATHS.id에 "/solver" 한 줄만 더하면 살아난다
    landingBefore:
      "Ingin memahami dulu apa itu solver GTO dan cara membaca hasilnya? Lihat",
    landingLink: "panduan solver HoldemMaster",
    landingAfter: ".",
    notes:
      "Di iOS dan Safari, batasan browser memaksa perhitungan satu thread sehingga lebih lambat — di macOS kami sarankan Chrome. Memori yang tersedia dibatasi 4 GB (batas WebAssembly), jadi spot besar lebih nyaman dihitung di PC.",
    creditBefore: "Aplikasi ini dibangun di atas",
    creditMid1: " (karya Wataru Inariba, AGPL-3.0), dilokalkan dan diperluas oleh",
    creditBrand: "HoldemMaster",
    creditMid2: ". Kode sumber lengkap hasil modifikasi dipublikasikan di",
    creditAfter: " dengan lisensi yang sama.",
  },
  ms: {
    community: "Komuniti HoldemMaster",
    heroTitle1: "Strategi GTO,",
    heroTitle2: "terus dalam pelayar anda.",
    heroSub1: "Tiada pemasangan, tiada bayaran. Masukkan range dan board anda,",
    heroSub2: " dan strategi optimum dikira terus pada peranti anda sendiri.",
    ctaPresets: "Lihat Spot belajar",
    ctaTrainer: "Trainer GTO",
    ctaDaily: "Cabaran Harian",
    dailyDone: "Selesai",
    ctaGuide: "Cara guna",
    ctaInstall: "Tambah ke skrin utama",
    installNote:
      "Selepas dipasang, Spot belajar dan Trainer GTO tersimpan pada peranti anda, jadi anda boleh terus berlatih walaupun di luar talian. Ini pintasan pelayar, bukan program — ia tidak pernah meminta sebarang kebenaran.",
    installSafe: "Selamatkah?",
    features: [
      { title: "Percuma", desc: "Semua ciri, tanpa had penggunaan" },
      { title: "Belajar luar talian", desc: "Tambah ke skrin utama dan berlatih tanpa sambungan internet" },
      { title: "Pengiraan pantas", desc: "Multithread — sepantas solver desktop" },
      { title: "Trainer GTO", desc: "Main spot dan dapatkan skor kerugian EV berbanding pot" },
    ],
    featureLockTitle: "Node lock",
    featureLockDesc: "Tetapkan strategi pihak lawan dan kira semula — lihat bagaimana strategi anda berubah apabila pihak lawan melakukan kesilapan",
    step5Trainer: "Selepas pengiraan selesai, cuba ubah strategi pihak lawan melalui [Kunci strategi pada nod ini], kemudian jawab soalan daripada spot itu melalui [Berlatih spot ini]",
    step5Solver: "Selepas pengiraan selesai, cuba ubah strategi pihak lawan melalui [Kunci strategi pada nod ini]",
    stepsTitle: "Baru di sini?",
    // 버튼 이름 인용은 PresetsPage.viewResults·SideBar와 «글자까지» 같아야 한다
    steps: [
      "Buka mana-mana spot dalam Spot belajar lalu tekan [Lihat hasil] — penyelesaiannya terus muncul",
      "Baca Cara guna untuk belajar membaca skrin hasil",
      "Cuba Trainer GTO — ia menunjukkan dengan tepat berapa bb yang anda rugi pada setiap keputusan",
      "Selepas anda biasa, kira tangan anda sendiri dengan Spot tersuai (①–⑤)",
    ],
    // ⚠ 이 세 줄이 가리키는 본체 /ms/solver는 없다 (2026-09-03 실측 404) —
    //   AboutPage 템플릿의 v-if="landingUrl"이 통째로 숨긴다. 본체에 /ms/solver가 생기면
    //   outbound.ts LOCALE_PATHS.ms에 "/solver" 한 줄만 더하면 살아난다
    landingBefore:
      "Mahu faham dahulu apa itu solver GTO dan cara membaca hasilnya? Lihat",
    landingLink: "panduan solver HoldemMaster",
    landingAfter: ".",
    notes:
      "Pada iOS dan Safari, batasan pelayar memaksa pengiraan satu thread, jadi lebih perlahan — pada macOS kami syorkan Chrome. Memori yang tersedia dihadkan kepada 4 GB (had WebAssembly), jadi spot besar lebih baik dikira pada PC.",
    creditBefore: "Aplikasi ini dibina berasaskan",
    creditMid1: " (karya Wataru Inariba, AGPL-3.0), diterjemah dan ditambah baik oleh",
    creditBrand: "HoldemMaster",
    creditMid2: ". Keseluruhan kod sumber yang diubah suai diterbitkan di",
    creditAfter: " di bawah lesen yang sama.",
  },
  hi: {
    community: "HoldemMaster कम्युनिटी",
    heroTitle1: "GTO रणनीति,",
    heroTitle2: "सीधे आपके ब्राउज़र में।",
    heroSub1: "इंस्टॉल करने या पैसे देने की ज़रूरत नहीं। Range और बोर्ड चुनें,",
    heroSub2: " फिर आपका डिवाइस उस स्पॉट की GTO रणनीति की गणना करता है।",
    ctaPresets: "अभ्यास स्पॉट देखें",
    ctaTrainer: "GTO Trainer",
    ctaDaily: "आज की चुनौती",
    dailyDone: "पूरा हुआ",
    ctaGuide: "कैसे इस्तेमाल करें",
    ctaInstall: "होम स्क्रीन पर जोड़ें",
    installNote: "इंस्टॉल करने पर अभ्यास स्पॉट और ट्रेनर आपके डिवाइस पर सेव हो जाते हैं, ताकि आप ऑफ़लाइन भी अभ्यास कर सकें। यह ब्राउज़र में चलने वाला वेब ऐप है। इंस्टॉल करने के लिए कैमरा, संपर्क, SMS या लोकेशन की अनुमति नहीं माँगता।",
    installSafe: "इंस्टॉल के बारे में जानें",
    features: [{
       title: "मुफ़्त",
       desc: "सभी सुविधाएँ, इस्तेमाल की कोई सीमा नहीं",
     }, {
       title: "ऑफ़लाइन अभ्यास",
       desc: "होम स्क्रीन पर जोड़ें और बिना इंटरनेट अभ्यास करें",
     }, {
       title: "तेज़ गणना",
       desc: "कई थ्रेड का इस्तेमाल करके गणना करता है",
     }, {
       title: "GTO Trainer",
       desc: "स्पॉट खेलें और pot के अनुपात में EV नुकसान पर अपना प्रदर्शन देखें",
     }],
    featureLockTitle: "रणनीति लॉक (node lock)",
    featureLockDesc: "विरोधी की रणनीति तय करके फिर गणना करें — देखें कि विरोधी की गलतियों से आपकी रणनीति कैसे बदलती है",
    step5Trainer: "गणना पूरी होने पर [इस नोड की रणनीति लॉक करें] से विरोधी की रणनीति बदलकर देखें और [इस स्पॉट का अभ्यास करें] से उसी स्पॉट के सवाल हल करें",
    step5Solver: "गणना पूरी होने पर [इस नोड की रणनीति लॉक करें] से विरोधी की रणनीति बदलकर देखें",
    stepsTitle: "पहली बार इस्तेमाल कर रहे हैं?",
    steps: ["अभ्यास स्पॉट में कोई स्पॉट खोलें और [परिणाम देखें] दबाएँ — परिणाम तुरंत दिखेंगे", "परिणाम स्क्रीन समझने के लिए [कैसे इस्तेमाल करें] गाइड पढ़ें।", "GTO Trainer आज़माएँ — देखें कि हर फ़ैसले में कितने bb का EV नुकसान होता है", "तैयार होने पर अपना स्पॉट (①–⑤) में खुद के हैंड की गणना करें"],
    landingBefore: "पहले समझना चाहते हैं कि GTO सॉल्वर क्या है और इसके परिणाम कैसे पढ़ें? देखें: ",
    landingLink: "HoldemMaster की सॉल्वर गाइड",
    landingAfter: "।",
    notes: "iOS और Safari में ब्राउज़र की सीमाओं के कारण गणना एक ही थ्रेड पर चलती है और धीमी होती है। macOS पर Chrome इस्तेमाल कर सकते हैं। WebAssembly की सीमा के कारण उपलब्ध मेमोरी अधिकतम 4GB है। बड़े स्पॉट की गणना PC पर अधिक सुविधाजनक है।",
    creditBefore: "यह ऐप आधारित है ",
    creditMid1: " पर (Wataru Inariba, AGPL-3.0)। इसका अनुवाद और विस्तार ",
    creditBrand: "HoldemMaster",
    creditMid2: " ने किया है। संशोधित सोर्स कोड पूरा का पूरा ",
    creditAfter: " पर उसी लाइसेंस के तहत उपलब्ध है।",
  },
} as const;

/* npokers 빌드에서 위 사전을 덮어쓰는 조각 — 트레이너·교육예제·오늘의문제 언급을 걷어내고
 * 프리플랍 차트·에퀴티 계산기를 앞세운다. 문구는 이미 원어민 검수를 거친
 * 기존 사전(App HEADERS·SideBar 라벨·이 파일의 문장)에서 조합했다 — 새 창작을 최소화.
 * 죽은 쪽(트레이너 빌드에서는 이 사전 전체)은 압축 단계에서 번들에서 빠진다. */
declare const __APP_TARGET__: "trainer" | "npokers";
const N =
  __APP_TARGET__ === "npokers"
    ? {
        ko: {
          community: "npokers.com",
          ctaPreflop: "프리플랍 차트",
          ctaEquity: "에퀴티 계산기",
          installNote:
            "설치하면 인터넷이 끊겨도 앱이 열립니다. 프로그램이 아니라 브라우저 바로가기라 권한을 요구하지 않습니다 —",
          features: [
            { title: "무료", desc: "횟수 제한 없이 모든 기능을 그대로" },
            { title: "오프라인", desc: "홈 화면에 설치하면 인터넷 없이도" },
            { title: "빠른 계산", desc: "멀티스레드로 데스크톱 솔버 수준" },
            { title: "프리플랍 차트·에퀴티", desc: "오픈·수비 레인지 표와 핸드·레인지 승률" },
          ],
          steps: [
            "프리플랍 차트에서 오픈 & 수비 레인지를 먼저 훑어보세요",
            "사용법에서 결과 화면 읽는 법을 확인하세요",
            "익숙해지면 커스텀 스팟(①~⑤)으로 내 핸드를 직접 계산해보세요",
          ],
        },
        en: {
          community: "npokers.com",
          ctaPreflop: "Preflop Charts",
          ctaEquity: "Equity Calculator",
          installNote:
            "Installing saves the app to your device, so it opens even when you're offline. It's a browser shortcut, not a program — it never asks for any permissions.",
          features: [
            { title: "Free", desc: "Every feature, no usage limits" },
            { title: "Offline", desc: "Add it to your home screen and use it without an internet connection" },
            { title: "Fast Solving", desc: "Multithreaded — desktop-solver speed" },
            { title: "Charts & Equity", desc: "Opening & defense ranges, plus hand and range equity" },
          ],
          steps: [
            "Skim the opening & defense ranges under Preflop Charts",
            "Check How to Use to learn how to read the results screen",
            "Once you're comfortable, solve your own hands with Custom Spot (①–⑤)",
          ],
        },
        ja: {
          community: "npokers.com",
          ctaPreflop: "プリフロップレンジ表",
          ctaEquity: "エクイティ計算機",
          installNote:
            "インストールするとアプリが端末に保存され、インターネットが切れても開けます。プログラムではなくブラウザのショートカットなので、権限を要求しません —",
          features: [
            { title: "無料", desc: "回数制限なく全機能を利用できます" },
            { title: "オフライン", desc: "ホーム画面に追加すればインターネットなしでも使えます" },
            { title: "高速計算", desc: "マルチスレッドでデスクトップソルバー級" },
            { title: "レンジ表・エクイティ", desc: "オープン & ディフェンスのレンジ表とハンド・レンジの勝率" },
          ],
          steps: [
            "プリフロップレンジ表でオープン & ディフェンスのレンジを眺めてみましょう",
            "使い方で結果画面の読み方を確認しましょう",
            "慣れてきたらカスタムスポット（①〜⑤）で自分のハンドを直接計算してみましょう",
          ],
        },
        es: {
          community: "npokers.com",
          ctaPreflop: "Tablas preflop",
          ctaEquity: "Calculadora de equity",
          installNote:
            "Al instalarla, la app se guarda en tu dispositivo y se abre incluso sin conexión. Es un acceso directo del navegador, no un programa — nunca pide permisos.",
          features: [
            { title: "Gratis", desc: "Todas las funciones, sin límites de uso" },
            { title: "Offline", desc: "Agrégala a tu pantalla de inicio y úsala sin internet" },
            { title: "Cálculo rápido", desc: "Multihilo — velocidad de solver de escritorio" },
            { title: "Tablas y equity", desc: "Rangos de open y defensa, y equity de mano y rango" },
          ],
          steps: [
            "Echa un vistazo a los rangos de open y defensa en Tablas preflop",
            "Revisa Cómo usarlo para aprender a leer la pantalla de resultados",
            "Cuando te sientas a gusto, resuelve tus propias manos con el Spot personalizado (①~⑤)",
          ],
        },
        pt: {
          community: "npokers.com",
          ctaPreflop: "Tabelas pré-flop",
          ctaEquity: "Calculadora de equity",
          installNote:
            "Ao instalar, o app fica salvo no seu dispositivo e abre mesmo sem conexão. É um atalho do navegador, não um programa — ele nunca pede permissões.",
          features: [
            { title: "Grátis", desc: "Todos os recursos, sem limite de uso" },
            { title: "Offline", desc: "Adicione à tela de início e use sem internet" },
            { title: "Cálculo rápido", desc: "Multithread — velocidade de solver de desktop" },
            { title: "Tabelas e equity", desc: "Ranges de open e defesa, e equity de mão e range" },
          ],
          steps: [
            "Dê uma olhada nos ranges de open e defesa em Tabelas pré-flop",
            "Veja Como usar para aprender a ler a tela de resultados",
            "Quando estiver à vontade, resolva suas próprias mãos com o Spot personalizado (① → ⑤)",
          ],
        },
        de: {
          community: "npokers.com",
          ctaPreflop: "Preflop-Charts",
          ctaEquity: "Equity-Rechner",
          installNote:
            "Nach der Installation liegt die App auf deinem Gerät und öffnet sich auch offline. Es ist eine Browser-Verknüpfung, kein Programm – sie fragt nie nach Berechtigungen.",
          features: [
            { title: "Kostenlos", desc: "Alle Funktionen, ohne Nutzungslimit" },
            { title: "Offline", desc: "Zum Startbildschirm hinzufügen und ohne Internet nutzen" },
            { title: "Schnelles Solving", desc: "Multithreaded – Tempo eines Desktop-Solvers" },
            { title: "Charts & Equity", desc: "Open- und Defense-Ranges plus Equity für Hand und Range" },
          ],
          steps: [
            "Wirf zuerst einen Blick auf die Open- und Defense-Ranges unter Preflop-Charts",
            "Schau in die Anleitung, wie du den Ergebnisbildschirm liest",
            "Wenn du dich sicher fühlst, berechne eigene Hände unter Eigener Spot (①–⑤)",
          ],
        },
        zh: {
          community: "npokers.com",
          ctaPreflop: "翻前范围表",
          ctaEquity: "胜率计算器",
          installNote:
            "装上之后，应用会存到你的设备里，断网也能打开。它只是一个浏览器快捷方式，不是软件，从不索取任何权限。",
          features: [
            { title: "免费", desc: "全部功能，不限次数" },
            { title: "离线可用", desc: "添加到主屏幕，没网也能用" },
            { title: "算得快", desc: "多线程——接近桌面版求解器的速度" },
            { title: "范围表与胜率", desc: "开池与防守范围表，加上手牌与范围的胜率" },
          ],
          steps: [
            "先去翻前范围表看看开池与防守范围",
            "去[使用方法]看看结果画面该怎么读",
            "上手之后，用自定义牌局（①~⑤）算你自己的手牌",
          ],
        },
        "zh-hant": {
          community: "npokers.com",
          ctaPreflop: "翻前範圍表",
          ctaEquity: "勝率計算器",
          installNote:
            "裝上之後，應用程式會存到你的裝置裡，沒網路也能打開。它只是一個瀏覽器捷徑，不是軟體，從不索取任何權限。",
          features: [
            { title: "免費", desc: "全部功能，不限次數" },
            { title: "離線可用", desc: "加入主畫面，沒網路也能用" },
            { title: "算得快", desc: "多執行緒——接近桌面版解算器的速度" },
            { title: "範圍表與勝率", desc: "開池與防守範圍表，加上手牌與範圍的勝率" },
          ],
          steps: [
            "先去翻前範圍表看看開池與防守範圍",
            "去[使用方法]看看結果畫面該怎麼讀",
            "上手之後，用自訂牌局（①～⑤）算你自己的手牌",
          ],
        },
        fr: {
          community: "npokers.com",
          ctaPreflop: "Charts préflop",
          ctaEquity: "Calculateur d'equity",
          installNote:
            "L'installation garde l'app sur ton appareil : elle s'ouvre même hors ligne. C'est un raccourci du navigateur, pas un programme — il ne demande jamais aucune permission.",
          features: [
            { title: "Gratuit", desc: "Toutes les fonctions, sans limite d'usage" },
            { title: "Hors ligne", desc: "Ajoute-la à ton écran d'accueil et utilise-la sans connexion" },
            { title: "Calcul rapide", desc: "Multithread — la vitesse d'un solver de bureau" },
            { title: "Charts & equity", desc: "Ranges d'open et de défense, plus l'equity de main et de range" },
          ],
          steps: [
            "Commence par les charts préflop pour parcourir les ranges d'open et de défense",
            "Passe par Mode d'emploi pour apprendre à lire l'écran de résultats",
            "Une fois à l'aise, calcule tes propres mains avec Spot personnalisé (①–⑤)",
          ],
        },
        // ⚠ 트레이너 어휘 금지(Trainer·Pelatih·latihan·berlatih·Spot belajar·Tantangan) — npokers-verify FORBIDDEN id
        id: {
          community: "npokers.com",
          ctaPreflop: "Chart preflop",
          ctaEquity: "Kalkulator equity",
          installNote:
            "Setelah dipasang, aplikasi tersimpan di perangkat Anda dan tetap bisa dibuka saat offline. Ini pintasan browser, bukan program — tidak pernah meminta izin apa pun.",
          features: [
            { title: "Gratis", desc: "Semua fitur, tanpa batas pemakaian" },
            { title: "Offline", desc: "Pasang ke layar utama dan pakai tanpa koneksi internet" },
            { title: "Perhitungan cepat", desc: "Multithread — secepat solver desktop" },
            { title: "Chart & equity", desc: "Range open dan defend, plus equity hand dan range" },
          ],
          steps: [
            "Mulai dari Chart preflop untuk melihat range open dan defend",
            "Baca Cara pakai untuk belajar membaca layar hasil",
            "Setelah terbiasa, hitung hand Anda sendiri lewat Spot kustom (①–⑤)",
          ],
        },
        // ⚠ 트레이너 어휘 금지(Trainer·Jurulatih·latihan·berlatih·Spot belajar·Cabaran) — npokers-verify FORBIDDEN ms
        ms: {
          community: "npokers.com",
          ctaPreflop: "Carta preflop",
          ctaEquity: "Kalkulator equity",
          installNote:
            "Selepas dipasang, aplikasi tersimpan pada peranti anda dan tetap boleh dibuka di luar talian. Ini pintasan pelayar, bukan program — ia tidak pernah meminta sebarang kebenaran.",
          features: [
            { title: "Percuma", desc: "Semua ciri, tanpa had penggunaan" },
            { title: "Luar talian", desc: "Tambah ke skrin utama dan guna tanpa sambungan internet" },
            { title: "Pengiraan pantas", desc: "Multithread — sepantas solver desktop" },
            { title: "Carta & equity", desc: "Range open dan defend, serta equity tangan dan range" },
          ],
          steps: [
            "Mulakan dengan Carta preflop untuk melihat range open dan defend",
            "Baca Cara guna untuk belajar membaca skrin hasil",
            "Selepas anda biasa, kira tangan anda sendiri dengan Spot tersuai (①–⑤)",
          ],
        },
        hi: {
          community: "npokers.com",
          ctaPreflop: "Preflop चार्ट",
          ctaEquity: "Equity कैलकुलेटर",
          installNote: "इंस्टॉल करने पर ऐप आपके डिवाइस पर सेव हो जाता है, ताकि आप ऑफ़लाइन भी इसे खोल सकें। यह ब्राउज़र में चलने वाला वेब ऐप है। इंस्टॉल करने के लिए कैमरा, संपर्क, SMS या लोकेशन की अनुमति नहीं माँगता।",
          features: [{
             title: "मुफ़्त",
             desc: "सभी सुविधाएँ, इस्तेमाल की कोई सीमा नहीं",
           }, {
             title: "ऑफ़लाइन",
             desc: "होम स्क्रीन पर जोड़ें और बिना इंटरनेट इस्तेमाल करें",
           }, {
             title: "तेज़ गणना",
             desc: "कई थ्रेड का इस्तेमाल करके गणना करता है",
           }, {
             title: "चार्ट और Equity",
             desc: "Open और बचाव की range, साथ में हैंड और range की equity",
           }],
          steps: ["Preflop चार्ट में open और बचाव की range देखें", "परिणाम स्क्रीन समझने के लिए [कैसे इस्तेमाल करें] गाइड पढ़ें।", "तैयार होने पर अपना स्पॉट (①–⑤) में खुद के हैंड की गणना करें"],
        },
      }
    : null;

export default defineComponent({
  setup() {
    const L = computed(() =>
      N ? { ...M[i18n.locale], ...N[i18n.locale] } : { ctaPreflop: "", ctaEquity: "", ...M[i18n.locale] }
    );
    /* installNote와 「안전한가요?」 버튼을 잇는 공백.
     * ⚠ 언어마다 «문장이 끝나는 방식»이 달라서 로케일 목록이 TrainerPage와 다르다:
     *   ko·ja는 installNote가 «— »(줄표)로 끝나 버튼이 문장을 이어받는다 → 공백 «필요»
     *   zh·zh-hant는 「。」로 끝나고, 전각 마침표가 이미 여백을 품고 있다 → 공백 «금지»
     * (2026-08-22 joint-shot.js 실측으로 ja가 «— 安全ですか»에서 붙어 버리는 것을 잡았다) */
    const sentenceGap = computed(() =>
      i18n.locale === "zh" || i18n.locale === "zh-hant" ? "" : " "
    );

    loadDailyState();

    return {
      sentenceGap,
      store: useStore(),
      dailyState,
      FEATURE_TRAINER,
      L,
      requestInstall,
      canShowInstallButton,
      // EN이면 /en/solver·/en으로 — 언어 전환에 따라가도록 computed
      landingUrl: computed(() => mainSiteUrl("/solver", "about-landing")),
      creditUrl: computed(() => mainSiteUrl("", "about-credit")),
    };
  },
});
</script>

<style scoped>
.home-intro {
  @apply rounded-lg border border-neutral-700 bg-surface-1 p-4 md:p-5;
}
.app-home h1 {
  text-wrap: balance;
}
.app-home p {
  text-wrap: pretty;
}

/* 애플식 메탈릭 실버 — 위에서 아래로 밝은 은색 → 어두운 은색 */
.silver-text {
  background-image: linear-gradient(
    180deg,
    rgb(var(--c-metal-1)) 0%,
    rgb(var(--c-metal-2)) 35%,
    rgb(var(--c-metal-4)) 75%,
    rgb(var(--c-metal-5)) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
