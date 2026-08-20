<template>
  <div
    v-if="store.sharedSpotLoaded"
    class="flex items-center gap-2 mb-3 pl-2.5 pr-3 py-1.5 text-emerald-300 bg-emerald-950 border border-emerald-700 rounded-md text-sm"
  >
    {{ L.sharedSpotBanner }}
    <button
      class="ml-auto px-1 text-emerald-500 hover:text-emerald-300"
      @click="store.sharedSpotLoaded = false"
    >
      ✕
    </button>
  </div>

  <div class="flex my-1 items-center">
    {{ L.numThreadsLabel }}
    <input
      v-model="numThreads"
      type="number"
      :class="
        'w-20 ml-2 px-2 py-1 rounded-lg text-sm text-center ' +
        (numThreads < 1 ||
        numThreads > (isSafari ? 1 : 64) ||
        numThreads % 1 !== 0
          ? 'input-error'
          : '')
      "
      min="1"
      max="64"
    />
    <button
      class="ml-3 button-base button-blue"
      :disabled="
        isTreeBuilding ||
        store.isSolverRunning ||
        store.isFinalizing ||
        numThreads < 1 ||
        numThreads > (isSafari ? 1 : 64) ||
        numThreads % 1 !== 0
      "
      @click="buildTree"
    >
      {{ L.buildTree }}
    </button>

    <button
      class="ml-2 button-base button-green"
      @click="copySpotUrl"
    >
      {{ shareCopied ? L.copied : L.shareSpot }}
    </button>
  </div>

  <div v-if="shareError" class="my-1 text-sm text-orange-400">
    {{ shareError }}
  </div>

  <div class="my-1">{{ L.statusLabel }} {{ treeStatus }}</div>

  <div v-if="isTreeBuilt" class="mt-3">
    <div>
      {{ L.precisionMode }}
      <Tippy
        class="inline-block cursor-help"
        max-width="500px"
        placement="bottom"
        trigger="mouseenter click"
        :delay="[200, 0]"
        :interactive="true"
      >
        <QuestionMarkCircleIcon class="w-5 h-5 text-neutral-400" />
        <template #content>
          <div class="px-1 py-0.5 text-justify">
            {{ L.precisionTipIntro }}
            <ul class="pl-6 list-disc">
              <li class="mt-1">
                {{ L.precisionTipFp }}
              </li>
              <li class="mt-1">
                {{ L.precisionTipInt }}
              </li>
            </ul>
          </div>
        </template>
      </Tippy>
    </div>
    <div class="mt-1 ml-2">
      <label :class="{ 'cursor-pointer': !store.hasSolverRun }">
        <input
          v-model="isCompressionEnabled"
          class="mr-2 cursor-pointer disabled:cursor-default"
          type="radio"
          name="compression"
          :value="false"
          :disabled="store.hasSolverRun"
        />
        <span class="inline-block w-[6.75rem] ml-1">{{ L.fp32Label }}</span>
        {{
          L.ramNeeded(
            memoryUsage >= 1023.5 * 1024 * 1024
              ? (memoryUsage / (1024 * 1024 * 1024)).toFixed(2) + "GB"
              : (memoryUsage / (1024 * 1024)).toFixed(0) + "MB"
          )
        }}
        {{ memoryUsage > maxMemoryUsage ? L.limitExceeded : "" }}
      </label>
    </div>
    <div class="ml-2">
      <label :class="{ 'cursor-pointer': !store.hasSolverRun }">
        <input
          v-model="isCompressionEnabled"
          class="mr-2 cursor-pointer disabled:cursor-default"
          type="radio"
          name="compression"
          :value="true"
          :disabled="store.hasSolverRun"
        />
        <span class="inline-block w-[6.75rem] ml-1">{{ L.int16Label }}</span>
        {{
          L.ramNeeded(
            memoryUsageCompressed >= 1023.5 * 1024 * 1024
              ? (memoryUsageCompressed / (1024 * 1024 * 1024)).toFixed(2) +
                  "GB"
              : (memoryUsageCompressed / (1024 * 1024)).toFixed(0) + "MB"
          )
        }}
        {{ memoryUsageCompressed > maxMemoryUsage ? L.limitExceeded : "" }}
      </label>
    </div>
    <div v-if="memoryUsage > maxMemoryUsage" class="mt-1.5">
      {{ L.ramLimit }}
    </div>

    <div class="mt-4">
      {{ L.targetLabel }}
      <Tippy
        class="inline-block cursor-help"
        max-width="500px"
        placement="bottom"
        trigger="mouseenter click"
        :delay="[200, 0]"
        :interactive="true"
      >
        <QuestionMarkCircleIcon class="w-5 h-5 text-neutral-400" />
        <template #content>
          <div class="px-1 py-0.5 text-justify">
            <div>
              {{ L.exploitTipIntro }}
            </div>
            <div class="mt-3">
              <span class="underline">{{ L.exploitTipDetailLabel }}</span>
              {{ L.exploitTipDetail }}
            </div>
            <div class="my-1 text-center">
              {{ L.exploitTipFormula }}
            </div>
            <div>
              {{ L.exploitTipOutro }}
            </div>
          </div>
        </template>
      </Tippy>
      <input
        v-model="targetExploitability"
        type="number"
        :class="
          'w-20 ml-3 px-2 py-1 rounded-lg text-sm text-center ' +
          (targetExploitability <= 0 ? 'input-error' : '')
        "
        :disabled="store.hasSolverRun && !store.isSolverPaused"
        min="0"
        step="0.05"
      />
      %
    </div>

    <div class="mt-1">
      {{ L.maxIterationsLabel }}
      <input
        v-model="maxIterations"
        type="number"
        :class="
          'w-[5.5rem] ml-2 px-2 py-1 rounded-lg text-sm text-center ' +
          (maxIterations < 0 ||
          maxIterations % 1 !== 0 ||
          maxIterations > 100000
            ? 'input-error'
            : '')
        "
        :disabled="store.hasSolverRun && !store.isSolverPaused"
        min="0"
        max="100000"
      />
    </div>

    <div class="flex mt-6 gap-3">
      <button
        class="button-base button-blue"
        :disabled="
          store.hasSolverRun ||
          memoryUsageSelected > maxMemoryUsage ||
          targetExploitability <= 0 ||
          maxIterations < 0 ||
          maxIterations % 1 !== 0 ||
          maxIterations > 100000
        "
        @click="runSolver"
      >
        {{ L.runSolver }}
      </button>
      <button
        class="button-base button-red"
        :disabled="!store.isSolverRunning"
        @click="() => (terminateFlag = true)"
      >
        {{ L.stop }}
      </button>
      <button
        v-if="!store.isSolverPaused"
        class="button-base button-green"
        :disabled="!store.isSolverRunning"
        @click="() => (pauseFlag = true)"
      >
        {{ L.pause }}
      </button>
      <button
        v-else
        class="button-base button-green"
        :disabled="
          targetExploitability <= 0 ||
          maxIterations < 0 ||
          maxIterations % 1 !== 0 ||
          maxIterations > 100000
        "
        @click="resumeSolver"
      >
        {{ L.resume }}
      </button>
    </div>

    <div v-if="store.hasSolverRun" class="mt-6">
      <div class="flex items-center">
        <span
          v-if="store.isSolverRunning || store.isFinalizing"
          class="spinner inline-block mr-3"
        ></span>
        {{
          store.isSolverRunning
            ? L.solving
            : store.isFinalizing
            ? L.finalizing
            : store.isSolverPaused
            ? L.pausedStatus
            : L.finished
        }}
      </div>
      {{ iterationText }}
      <br />
      {{ exploitabilityText }}
      <br />
      {{ timeText }}
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { init, handler } from "../global-worker";
import { encodeSpotUrl } from "../spot-share";
import { i18n, pick } from "../i18n";
import {
  useStore,
  useConfigStore,
  useTmpConfigStore,
  saveConfig,
  saveConfigTmp,
} from "../store";
import {
  MAX_AMOUNT,
  convertBetString,
  ROOT_LINE_STRING,
  INVALID_LINE_STRING,
  readableLineString,
} from "../utils";
import { detect } from "detect-browser";

import { Tippy } from "vue-tippy";
import { QuestionMarkCircleIcon } from "@heroicons/vue/20/solid";

const M = {
  ko: {
    sharedSpotBanner:
      "공유된 스팟을 불러왔습니다 — [새 트리 만들기] → [솔버 실행]을 누르면 계산됩니다.",
    numThreadsLabel: "스레드 수:",
    buildTree: "새 트리 만들기",
    copied: "복사됨!",
    shareSpot: "🔗 스팟 공유",
    statusLabel: "상태:",
    statusNotLoaded: "모듈이 아직 로드되지 않았습니다",
    statusBuilding: "트리 생성 중...",
    statusError: (message: string) => `오류: ${message}`,
    statusBuilt: (threads: number) => `트리 생성 완료 (스레드 ${threads}개)`,
    precisionMode: "정밀도 모드:",
    precisionTipIntro:
      "정밀도 모드는 주로 메모리 사용량에 영향을 주며, 그 외 몇 가지 차이가 있습니다.",
    precisionTipFp:
      "32비트 부동소수점(FP): 메모리 사용량이 한도(3.9GB) 이하라면 이 모드를 권장합니다. 유효숫자 약 7자리에 성능도 더 좋습니다.",
    precisionTipInt:
      "16비트 정수: 32비트 FP 모드로는 메모리 한도를 넘는 경우의 대안입니다. 유효숫자가 약 4자리라 목표 오차 0.1% 미만에는 적합하지 않고, 성능도 32비트 FP보다 떨어집니다.",
    fp32Label: "32비트 FP:",
    int16Label: "16비트 정수:",
    ramNeeded: (size: string) => `RAM ${size} 필요`,
    limitExceeded: "(한도 초과)",
    ramLimit: "RAM 한도: 3.9GB (= Wasm 한계 4GB - 여유분 0.1GB)",
    targetLabel: "목표 오차(exploitability):",
    exploitTipIntro:
      "내시 균형까지 허용할 오차를 지정합니다. 값이 낮을수록 더 정확한 결과가 나오지만 계산 시간이 길어집니다.",
    exploitTipDetailLabel: "자세한 설명:",
    exploitTipDetail:
      "내시 균형 해에서는 양쪽 플레이어의 전략이 서로에 대한 MES(최대 익스플로잇 전략)가 됩니다. 이 성질을 이용해, 구한 전략과 내시 균형 사이의 거리를 다음과 같이 정의합니다:",
    exploitTipFormula: "거리 = (상대의 MES EV) - (상대의 실제 EV)",
    exploitTipOutro:
      "이 거리는 항상 0 이상이며, 구한 전략이 내시 균형의 일부일 때만 0이 됩니다. 익스플로잇 가능성(exploitability)은 양쪽 플레이어의 평균 거리로 정의됩니다.",
    maxIterationsLabel: "최대 반복 횟수:",
    runSolver: "솔버 실행",
    stop: "중지",
    pause: "일시정지",
    resume: "재개",
    solving: "솔버 계산 중...",
    finalizing: "마무리 중...",
    pausedStatus: "일시정지됨.",
    finished: "계산 완료!",
    allocatingMemory: "메모리 할당 중...",
    iterations: (count: number) => `반복: ${count}회`,
    exploitabilityLine: (value: string, percent: string) =>
      `오차(exploitability): ${value} (${percent})`,
    timeLine: (seconds: string) => `소요 시간: ${seconds}초`,
  },
  en: {
    sharedSpotBanner:
      "Shared spot loaded — press [Build Tree] → [Run Solver] to start solving.",
    numThreadsLabel: "Number of threads:",
    buildTree: "Build Tree",
    copied: "Copied!",
    shareSpot: "🔗 Share Spot",
    statusLabel: "Status:",
    statusNotLoaded: "Module not loaded",
    statusBuilding: "Building tree…",
    statusError: (message: string) => `Error: ${message}`,
    statusBuilt: (threads: number) =>
      `Tree built successfully (${threads} thread${threads === 1 ? "" : "s"})`,
    precisionMode: "Precision mode:",
    precisionTipIntro:
      "The precision mode mainly affects memory usage. There are also a few other differences.",
    precisionTipFp:
      "32-bit floating point (FP): recommended when memory usage is below the limit (3.9GB). About 7 significant digits and better performance.",
    precisionTipInt:
      "16-bit integer: an alternative when the 32-bit FP mode exceeds the memory limit. About 4 significant digits, so it is not suitable for a target exploitability below 0.1%, and it performs worse than 32-bit FP.",
    fp32Label: "32-bit FP:",
    int16Label: "16-bit integer:",
    ramNeeded: (size: string) => `needs ${size} of RAM`,
    limitExceeded: "(limit exceeded)",
    ramLimit: "RAM limit: 3.9GB (= 4GB Wasm limit − 0.1GB margin)",
    targetLabel: "Target exploitability:",
    exploitTipIntro:
      "Specifies the acceptable distance from the Nash equilibrium. A lower value gives a more accurate result, but the computation takes longer.",
    exploitTipDetailLabel: "Details:",
    exploitTipDetail:
      "In a Nash equilibrium, both players' strategies are MES (Maximally Exploitative Strategies) against each other. Using this property, we define the distance between an obtained strategy and the Nash equilibrium as follows:",
    exploitTipFormula: "Distance = (Opponent's MES EV) - (Opponent's actual EV)",
    exploitTipOutro:
      "This distance is always non-negative and is zero only if the obtained strategy is a part of a Nash equilibrium. Exploitability is defined as the average distance of both players.",
    maxIterationsLabel: "Max iterations:",
    runSolver: "Run Solver",
    stop: "Stop",
    pause: "Pause",
    resume: "Resume",
    solving: "Solving…",
    finalizing: "Finalizing…",
    pausedStatus: "Paused.",
    finished: "Solver finished!",
    allocatingMemory: "Allocating memory…",
    iterations: (count: number) => `Iterations: ${count}`,
    exploitabilityLine: (value: string, percent: string) =>
      `Exploitability: ${value} (${percent})`,
    timeLine: (seconds: string) => `Time elapsed: ${seconds}s`,
  },
  ja: {
    sharedSpotBanner:
      "共有されたスポットを読み込みました — [ツリーを作成] → [ソルバーを実行] を押すと計算が始まります。",
    numThreadsLabel: "スレッド数:",
    buildTree: "ツリーを作成",
    copied: "コピーしました",
    shareSpot: "🔗 スポットを共有",
    statusLabel: "ステータス:",
    statusNotLoaded: "モジュールがまだ読み込まれていません",
    statusBuilding: "ツリーを作成中…",
    statusError: (message: string) => `エラー: ${message}`,
    statusBuilt: (threads: number) =>
      `ツリーの作成が完了しました(${threads}スレッド)`,
    precisionMode: "精度モード:",
    precisionTipIntro:
      "精度モードは主にメモリ使用量に影響します。ほかにもいくつかの違いがあります。",
    precisionTipFp:
      "32ビット浮動小数点(FP): メモリ使用量が上限(3.9GB)以下であればこのモードを推奨します。有効数字は約7桁で、パフォーマンスも優れています。",
    precisionTipInt:
      "16ビット整数: 32ビットFPモードでメモリ上限を超える場合の代替手段です。有効数字が約4桁のため、目標誤差0.1%未満には適さず、パフォーマンスも32ビットFPより劣ります。",
    fp32Label: "32ビットFP:",
    int16Label: "16ビット整数:",
    ramNeeded: (size: string) => `RAM ${size} が必要`,
    limitExceeded: "(上限超過)",
    ramLimit: "RAM上限: 3.9GB (= Wasmの上限4GB - 余裕分0.1GB)",
    targetLabel: "目標誤差(exploitability):",
    exploitTipIntro:
      "ナッシュ均衡までの許容誤差を指定します。値が低いほど正確な結果になりますが、計算時間は長くなります。",
    exploitTipDetailLabel: "詳細:",
    exploitTipDetail:
      "ナッシュ均衡の解では、両プレイヤーの戦略が互いに対するMES(最大限にエクスプロイトする戦略)になります。この性質を利用して、得られた戦略とナッシュ均衡との距離を次のように定義します:",
    exploitTipFormula: "距離 = (相手のMESのEV) - (相手の実際のEV)",
    exploitTipOutro:
      "この距離は常に0以上で、得られた戦略がナッシュ均衡の一部である場合にのみ0になります。エクスプロイタビリティ(exploitability)は両プレイヤーの距離の平均として定義されます。",
    maxIterationsLabel: "最大イテレーション数:",
    runSolver: "ソルバーを実行",
    stop: "停止",
    pause: "一時停止",
    resume: "再開",
    solving: "計算中…",
    finalizing: "仕上げ処理中…",
    pausedStatus: "一時停止中。",
    finished: "計算が完了しました！",
    allocatingMemory: "メモリを割り当て中…",
    iterations: (count: number) => `イテレーション: ${count}回`,
    exploitabilityLine: (value: string, percent: string) =>
      `誤差(exploitability): ${value} (${percent})`,
    timeLine: (seconds: string) => `所要時間: ${seconds}秒`,
  },
  es: {
    sharedSpotBanner:
      "Spot compartido cargado — presiona [Crear árbol] → [Ejecutar solver] para calcular.",
    numThreadsLabel: "Número de hilos:",
    buildTree: "Crear árbol",
    copied: "¡Copiado!",
    shareSpot: "🔗 Compartir spot",
    statusLabel: "Estado:",
    statusNotLoaded: "El módulo aún no está cargado",
    statusBuilding: "Creando el árbol…",
    statusError: (message: string) => `Error: ${message}`,
    statusBuilt: (threads: number) =>
      `Árbol creado con éxito (${threads} hilo${threads === 1 ? "" : "s"})`,
    precisionMode: "Modo de precisión:",
    precisionTipIntro:
      "El modo de precisión afecta principalmente el uso de memoria. También hay otras diferencias menores.",
    precisionTipFp:
      "Punto flotante de 32 bits (FP): recomendado cuando el uso de memoria queda por debajo del límite (3.9GB). Unos 7 dígitos significativos y mejor rendimiento.",
    precisionTipInt:
      "Entero de 16 bits: una alternativa cuando el modo FP de 32 bits supera el límite de memoria. Con unos 4 dígitos significativos no es adecuado para un error objetivo menor a 0.1%, y rinde peor que el FP de 32 bits.",
    fp32Label: "FP de 32 bits:",
    int16Label: "Entero de 16 bits:",
    ramNeeded: (size: string) => `necesita ${size} de RAM`,
    limitExceeded: "(límite superado)",
    ramLimit: "Límite de RAM: 3.9GB (= límite Wasm de 4GB - margen de 0.1GB)",
    targetLabel: "Error objetivo (explotabilidad):",
    exploitTipIntro:
      "Define la distancia aceptable al equilibrio de Nash. Un valor más bajo da un resultado más preciso, pero el cálculo tarda más.",
    exploitTipDetailLabel: "Detalles:",
    exploitTipDetail:
      "En un equilibrio de Nash, las estrategias de ambos jugadores son MES (estrategias de máxima explotación) una contra la otra. Usando esta propiedad, definimos la distancia entre una estrategia obtenida y el equilibrio de Nash así:",
    exploitTipFormula: "Distancia = (EV del MES del rival) - (EV real del rival)",
    exploitTipOutro:
      "Esta distancia nunca es negativa y solo es cero si la estrategia obtenida forma parte de un equilibrio de Nash. La explotabilidad se define como la distancia promedio de ambos jugadores.",
    maxIterationsLabel: "Iteraciones máximas:",
    runSolver: "Ejecutar solver",
    stop: "Detener",
    pause: "Pausar",
    resume: "Reanudar",
    solving: "Calculando…",
    finalizing: "Finalizando…",
    pausedStatus: "En pausa.",
    finished: "¡Cálculo terminado!",
    allocatingMemory: "Asignando memoria…",
    iterations: (count: number) => `Iteraciones: ${count}`,
    exploitabilityLine: (value: string, percent: string) =>
      `Exploitability: ${value} (${percent})`,
    timeLine: (seconds: string) => `Tiempo transcurrido: ${seconds} s`,
  },
} as const;

const maxMemoryUsage = 3.9 * 1024 * 1024 * 1024; // 3.9 GB
const browser = detect();
const isSafari = browser && (browser.name === "safari" || browser.os === "iOS");

const checkConfig = (
  config: ReturnType<typeof useConfigStore>
): string | null => {
  if (config.board.length < 3) {
    return pick(
      "보드에는 최소 3장의 카드가 필요합니다",
      "The board must contain at least 3 cards",
      "ボードには少なくとも3枚のカードが必要です",
      "El board debe tener al menos 3 cartas"
    );
  }

  if (config.startingPot <= 0) {
    return pick(
      "시작 팟은 0보다 커야 합니다",
      "Starting pot must be positive",
      "スターティングポットには正の数を入力してください",
      "El bote inicial debe ser positivo"
    );
  }

  if (config.startingPot > MAX_AMOUNT) {
    return pick("시작 팟이 너무 큽니다", `Starting pot must not exceed ${MAX_AMOUNT}`, "スターティングポットが大きすぎます", "El bote inicial es demasiado grande");
  }

  if (config.startingPot % 1 !== 0) {
    return pick("시작 팟은 정수여야 합니다", "Starting pot must be an integer", "スターティングポットは整数で入力してください", "El bote inicial debe ser un entero");
  }

  if (config.effectiveStack <= 0) {
    return pick(
      "유효 스택은 0보다 커야 합니다",
      "Effective stack must be positive",
      "有効スタックには正の数を入力してください",
      "El stack efectivo debe ser positivo"
    );
  }

  if (config.effectiveStack > MAX_AMOUNT) {
    return pick("유효 스택이 너무 큽니다", "Effective stack is too large", "有効スタックが大きすぎます", "El stack efectivo es demasiado grande");
  }

  if (config.effectiveStack % 1 !== 0) {
    return pick(
      "유효 스택은 정수여야 합니다",
      "Effective stack must be an integer",
      "有効スタックは整数で入力してください",
      "El stack efectivo debe ser un entero"
    );
  }

  const betConfig = [
    {
      s: config.oopFlopBetSanitized,
      kind: pick("OOP 플랍 벳", "OOP flop bet", "OOP フロップベット", "Bet de flop OOP"),
    },
    {
      s: config.oopFlopRaiseSanitized,
      kind: pick("OOP 플랍 레이즈", "OOP flop raise", "OOP フロップレイズ", "Raise de flop OOP"),
    },
    {
      s: config.oopTurnBetSanitized,
      kind: pick("OOP 턴 벳", "OOP turn bet", "OOP ターンベット", "Bet de turn OOP"),
    },
    {
      s: config.oopTurnRaiseSanitized,
      kind: pick("OOP 턴 레이즈", "OOP turn raise", "OOP ターンレイズ", "Raise de turn OOP"),
    },
    {
      s: config.oopRiverBetSanitized,
      kind: pick("OOP 리버 벳", "OOP river bet", "OOP リバーベット", "Bet de river OOP"),
    },
    {
      s: config.oopRiverRaiseSanitized,
      kind: pick("OOP 리버 레이즈", "OOP river raise", "OOP リバーレイズ", "Raise de river OOP"),
    },
    {
      s: config.ipFlopBetSanitized,
      kind: pick("IP 플랍 벳", "IP flop bet", "IP フロップベット", "Bet de flop IP"),
    },
    {
      s: config.ipFlopRaiseSanitized,
      kind: pick("IP 플랍 레이즈", "IP flop raise", "IP フロップレイズ", "Raise de flop IP"),
    },
    {
      s: config.ipTurnBetSanitized,
      kind: pick("IP 턴 벳", "IP turn bet", "IP ターンベット", "Bet de turn IP"),
    },
    {
      s: config.ipTurnRaiseSanitized,
      kind: pick("IP 턴 레이즈", "IP turn raise", "IP ターンレイズ", "Raise de turn IP"),
    },
    {
      s: config.ipRiverBetSanitized,
      kind: pick("IP 리버 벳", "IP river bet", "IP リバーベット", "Bet de river IP"),
    },
    {
      s: config.ipRiverRaiseSanitized,
      kind: pick("IP 리버 레이즈", "IP river raise", "IP リバーレイズ", "Raise de river IP"),
    },
  ];

  for (const { s, kind } of betConfig) {
    if (!s.valid) {
      return `${kind}: ${s.s}`;
    }
  }

  if (config.donkOption) {
    if (!config.oopTurnDonkSanitized.valid) {
      return `${pick("OOP 턴 덩크", "OOP turn donk", "OOP ターンドンク", "Donk de turn OOP")}: ${
        config.oopTurnDonkSanitized.s
      }`;
    }
    if (!config.oopRiverDonkSanitized.valid) {
      return `${pick("OOP 리버 덩크", "OOP river donk", "OOP リバードンク", "Donk de river OOP")}: ${
        config.oopRiverDonkSanitized.s
      }`;
    }
  }

  if (config.addAllInThreshold < 0) {
    return pick(
      "올인 추가 기준값이 잘못되었습니다",
      "Invalid add all-in threshold",
      "オールイン追加のしきい値が無効です",
      "Umbral para agregar all-in inválido"
    );
  }

  if (config.forceAllInThreshold < 0) {
    return pick(
      "강제 올인 기준값이 잘못되었습니다",
      "Invalid force all-in threshold",
      "強制オールインのしきい値が無効です",
      "Umbral de all-in forzado inválido"
    );
  }

  if (config.mergingThreshold < 0) {
    return pick(
      "병합 기준값이 잘못되었습니다",
      "Invalid merging threshold",
      "マージのしきい値が無効です",
      "Umbral de fusión inválido"
    );
  }

  if (
    config.expectedBoardLength > 0 &&
    config.board.length !== config.expectedBoardLength
  ) {
    return pick(
      `보드가 잘못되었습니다 (${config.expectedBoardLength}장이 필요합니다)`,
      `Invalid board (${config.expectedBoardLength} cards required)`,
      `ボードが無効です(${config.expectedBoardLength}枚必要です)`,
      `Board inválido (se requieren ${config.expectedBoardLength} cartas)`
    );
  }

  const addedLinesArray =
    config.addedLines === ""
      ? []
      : config.addedLines.split(",").map(readableLineString);

  const removedLinesArray =
    config.removedLines === ""
      ? []
      : config.removedLines.split(",").map(readableLineString);

  if (
    addedLinesArray.includes(ROOT_LINE_STRING) ||
    addedLinesArray.includes(INVALID_LINE_STRING) ||
    removedLinesArray.includes(ROOT_LINE_STRING) ||
    removedLinesArray.includes(INVALID_LINE_STRING)
  ) {
    return pick(
      "잘못된 라인이 있습니다 (손상된 설정을 불러왔나요?)",
      "Invalid line found (loaded broken configurations?)",
      "無効なラインが見つかりました(破損した設定を読み込みましたか?)",
      "Se encontró una línea inválida (¿cargaste una configuración dañada?)"
    );
  }

  if (
    ![0, 3, 4, 5].includes(config.expectedBoardLength) ||
    (config.expectedBoardLength === 0 &&
      (addedLinesArray.length > 0 || removedLinesArray.length > 0)) ||
    (config.expectedBoardLength > 0 &&
      addedLinesArray.length === 0 &&
      removedLinesArray.length === 0)
  ) {
    return pick(
      "설정이 잘못되었습니다 (손상된 설정을 불러왔나요?)",
      "Invalid configurations (loaded broken configurations?)",
      "設定が無効です(破損した設定を読み込みましたか?)",
      "Configuración inválida (¿cargaste una configuración dañada?)"
    );
  }

  return null;
};

type TreeStatusState =
  | { type: "notLoaded" }
  | { type: "building" }
  | { type: "error"; message: string }
  | { type: "built"; threads: number };

export default defineComponent({
  components: {
    Tippy,
    QuestionMarkCircleIcon,
  },

  setup() {
    const store = useStore();
    const config = useConfigStore();
    const tmpConfig = useTmpConfigStore();
    const L = computed(() => M[i18n.locale]);

    const numThreads = ref((!isSafari && navigator.hardwareConcurrency) || 1);
    const targetExploitability = ref(0.3);
    const maxIterations = ref(1000);

    const isTreeBuilding = ref(false);
    const isTreeBuilt = ref(false);
    const treeStatusState = ref<TreeStatusState>({ type: "notLoaded" });
    const memoryUsage = ref(0);
    const memoryUsageCompressed = ref(0);
    const isCompressionEnabled = ref(false);
    const terminateFlag = ref(false);
    const pauseFlag = ref(false);
    const currentIteration = ref(-1);
    const exploitability = ref(Number.POSITIVE_INFINITY);
    const elapsedTimeMs = ref(-1);

    let startTime = 0;
    let exploitabilityUpdated = false;

    const treeStatus = computed(() => {
      const state = treeStatusState.value;
      const l = L.value;
      if (state.type === "notLoaded") return l.statusNotLoaded;
      if (state.type === "building") return l.statusBuilding;
      if (state.type === "error") return l.statusError(state.message);
      return l.statusBuilt(state.threads);
    });

    const memoryUsageSelected = computed(() => {
      if (isCompressionEnabled.value) {
        return memoryUsageCompressed.value;
      } else {
        return memoryUsage.value;
      }
    });

    const iterationText = computed(() => {
      if (currentIteration.value === -1) {
        return L.value.allocatingMemory;
      } else {
        return L.value.iterations(currentIteration.value);
      }
    });

    const exploitabilityText = computed(() => {
      if (!Number.isFinite(exploitability.value)) {
        return "";
      } else {
        const valueText = exploitability.value.toFixed(2);
        const percent = (exploitability.value * 100) / config.startingPot;
        const percentText = `${percent.toFixed(2)}%`;
        return L.value.exploitabilityLine(valueText, percentText);
      }
    });

    const timeText = computed(() => {
      if (elapsedTimeMs.value === -1 || !store.isSolverFinished) {
        return "";
      } else {
        return L.value.timeLine((elapsedTimeMs.value / 1000).toFixed(2));
      }
    });

    const buildTree = async () => {
      isTreeBuilt.value = false;

      const configError = checkConfig(config);
      if (configError !== null) {
        treeStatusState.value = { type: "error", message: configError };
        return;
      }

      saveConfigTmp();
      isTreeBuilding.value = true;
      store.isSolverPaused = false;
      store.isSolverFinished = false;
      treeStatusState.value = { type: "building" };

      await init(numThreads.value);
      if (!handler) return;

      const errorString = await handler.init(
        tmpConfig.rangeRaw[0],
        tmpConfig.rangeRaw[1],
        new Uint8Array(tmpConfig.board),
        tmpConfig.startingPot,
        tmpConfig.effectiveStack,
        tmpConfig.rakePercent / 100,
        tmpConfig.rakeCap,
        tmpConfig.donkOption,
        convertBetString(tmpConfig.oopFlopBet),
        convertBetString(tmpConfig.oopFlopRaise),
        convertBetString(tmpConfig.oopTurnBet),
        convertBetString(tmpConfig.oopTurnRaise),
        tmpConfig.donkOption ? convertBetString(tmpConfig.oopTurnDonk) : "",
        convertBetString(tmpConfig.oopRiverBet),
        convertBetString(tmpConfig.oopRiverRaise),
        tmpConfig.donkOption ? convertBetString(tmpConfig.oopRiverDonk) : "",
        convertBetString(tmpConfig.ipFlopBet),
        convertBetString(tmpConfig.ipFlopRaise),
        convertBetString(tmpConfig.ipTurnBet),
        convertBetString(tmpConfig.ipTurnRaise),
        convertBetString(tmpConfig.ipRiverBet),
        convertBetString(tmpConfig.ipRiverRaise),
        tmpConfig.addAllInThreshold / 100,
        tmpConfig.forceAllInThreshold / 100,
        tmpConfig.mergingThreshold / 100,
        tmpConfig.addedLines,
        tmpConfig.removedLines
      );

      if (errorString) {
        isTreeBuilding.value = false;
        treeStatusState.value = { type: "error", message: errorString };
        return;
      }

      saveConfig();

      memoryUsage.value = await handler.memoryUsage(false);
      memoryUsageCompressed.value = await handler.memoryUsage(true);

      if (
        memoryUsage.value > maxMemoryUsage &&
        memoryUsageCompressed.value <= maxMemoryUsage
      ) {
        isCompressionEnabled.value = true;
      }

      isTreeBuilding.value = false;
      isTreeBuilt.value = true;
      treeStatusState.value = { type: "built", threads: numThreads.value };
    };

    const runSolver = async () => {
      if (!handler) return;

      terminateFlag.value = false;
      pauseFlag.value = false;
      currentIteration.value = -1;
      exploitability.value = Number.POSITIVE_INFINITY;
      elapsedTimeMs.value = -1;

      store.isSolverRunning = true;

      startTime = performance.now();

      await handler.allocateMemory(isCompressionEnabled.value);

      currentIteration.value = 0;
      exploitability.value = Math.max(await handler.exploitability(), 0);
      exploitabilityUpdated = true;

      await resumeSolver();
    };

    const resumeSolver = async () => {
      if (!handler) return;

      store.isSolverRunning = true;
      store.isSolverPaused = false;

      if (startTime === 0) {
        startTime = performance.now();
      }

      const target = (config.startingPot * targetExploitability.value) / 100;

      while (
        !terminateFlag.value &&
        currentIteration.value < maxIterations.value &&
        exploitability.value > target
      ) {
        if (pauseFlag.value) {
          const end = performance.now();
          elapsedTimeMs.value += end - startTime;
          startTime = 0;
          pauseFlag.value = false;
          store.isSolverRunning = false;
          store.isSolverPaused = true;
          return;
        }

        await handler.iterate(currentIteration.value);
        ++currentIteration.value;
        exploitabilityUpdated = false;

        if (currentIteration.value % 10 === 0) {
          exploitability.value = Math.max(await handler.exploitability(), 0);
          exploitabilityUpdated = true;
        }
      }

      if (!exploitabilityUpdated) {
        exploitability.value = Math.max(await handler.exploitability(), 0);
      }

      store.isSolverRunning = false;
      store.isFinalizing = true;

      await handler.finalize();

      store.isFinalizing = false;
      store.isSolverFinished = true;

      const end = performance.now();
      elapsedTimeMs.value += end - startTime;
    };

    /* 스팟 공유 링크 */
    const shareCopied = ref(false);
    const shareError = ref("");

    const copySpotUrl = async () => {
      shareError.value = "";
      const url = encodeSpotUrl();
      if (!url) {
        shareError.value = pick(
          "공유하려면 OOP·IP 레인지와 보드 3장을 먼저 입력하세요.",
          "To share a spot, enter the OOP and IP ranges and at least 3 board cards first.",
          "スポットを共有するには、OOPとIPのレンジ、そしてボードのカード3枚以上を先に入力してください。",
          "Para compartir un spot, ingresa primero los rangos OOP e IP y al menos 3 cartas del board."
        );
        return;
      }
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      shareCopied.value = true;
      setTimeout(() => (shareCopied.value = false), 1500);
    };

    return {
      store,
      L,
      numThreads,
      isSafari,
      targetExploitability,
      shareCopied,
      shareError,
      copySpotUrl,
      maxIterations,
      isTreeBuilding,
      isTreeBuilt,
      treeStatus,
      maxMemoryUsage,
      memoryUsage,
      memoryUsageCompressed,
      isCompressionEnabled,
      terminateFlag,
      pauseFlag,
      memoryUsageSelected,
      iterationText,
      exploitabilityText,
      timeText,
      buildTree,
      runSolver,
      resumeSolver,
    };
  },
});
</script>
