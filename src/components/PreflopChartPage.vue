<template>
  <div class="pb-6 max-w-5xl">
    <!--
      모드별로 다른 것(탭·격자·범례·통계·안내문·버튼·설명)은 전부 script의 `modes`
      서술자에 데이터로 들어 있다. 새 모드를 추가할 때 여기에 분기를 더하지 말고
      서술자 배열에 항목을 하나 더할 것.
    -->
    <div class="flex flex-wrap gap-1.5 mb-3">
      <button
        v-for="m in modes"
        :key="m.key"
        :class="modeStyle(m.key)"
        @click="mode = m.key"
      >
        {{ m.label }}
      </button>
    </div>

    <p class="text-sm md:text-base text-neutral-400 mb-4">{{ active.intro }}</p>

    <!-- 포지션 탭(오픈) / 조합 탭(수비·vs 3벳) -->
    <div class="flex flex-wrap gap-1.5 md:gap-2 mb-4">
      <button
        v-for="tab in active.tabs"
        :key="tab.key"
        :class="
          'px-3 md:px-4 py-1.5 rounded-xl text-sm md:text-[0.9375rem] font-semibold transition-colors ' +
          (tab.active
            ? 'bg-yellow-500 text-neutral-900'
            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700')
        "
        @click="tab.select()"
      >
        {{ tab.label }}
        <span
          :class="
            'ml-1 text-xs font-normal ' +
            (tab.active ? 'text-neutral-700' : 'text-neutral-500')
          "
        >
          {{ $n(tab.percent) }}%
        </span>
      </button>
    </div>

    <div class="flex flex-col lg:flex-row gap-4 lg:gap-6">
      <!-- 13×13 격자 -->
      <div class="shrink-0 w-full max-w-[26rem] lg:max-w-[28rem]">
        <table
          class="w-full border-collapse shadow-md select-none"
          data-testid="preflop-grid"
        >
          <tr v-for="row in 13" :key="row">
            <td
              v-for="col in 13"
              :key="col"
              class="relative border-[0.5px] border-black p-0"
              style="width: 7.69%"
            >
              <div class="pb-[100%]"></div>
              <div
                :class="
                  'absolute inset-0 ' +
                  (row === col ? 'bg-neutral-700' : 'bg-neutral-800')
                "
              >
                <template v-if="!active.dual">
                  <div
                    class="absolute inset-0 bg-bottom bg-no-repeat"
                    :style="{
                      'background-image': `linear-gradient(${yellow500} 0% 100%)`,
                      'background-size': `100% ${cellFreq(row, col)}%`,
                    }"
                  ></div>
                </template>
                <template v-else>
                  <!-- 콜(초록)을 바닥에, 레이즈(빨강)를 그 위에 쌓는다 — 전체 높이 = 계속 빈도 -->
                  <div
                    class="absolute left-0 w-full"
                    :style="{
                      bottom: '0',
                      height: cellCall(row, col) + '%',
                      background: green500,
                    }"
                  ></div>
                  <div
                    class="absolute left-0 w-full"
                    :style="{
                      bottom: cellCall(row, col) + '%',
                      height: cellRaise(row, col) + '%',
                      background: red500,
                    }"
                  ></div>
                </template>
                <span
                  :class="
                    'absolute top-0 left-0.5 z-10 text-[0.5rem] md:text-[0.6875rem] leading-tight text-shadow ' +
                    (cellActive(row, col) ? 'text-white' : 'text-neutral-500')
                  "
                >
                  {{ cellLabel(row, col) }}
                </span>
              </div>
            </td>
          </tr>
        </table>

        <!-- 범례 -->
        <div
          v-if="!active.dual"
          class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-neutral-400"
        >
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded-sm bg-yellow-500"></span>
            {{ L.legendOpen }}
          </span>
          <span class="flex items-center gap-1.5">
            <span
              class="inline-block w-3 h-3 rounded-sm bg-neutral-800 border border-neutral-600 bg-bottom bg-no-repeat"
              :style="{
                'background-image': `linear-gradient(${yellow500} 0% 100%)`,
                'background-size': '100% 50%',
              }"
            ></span>
            {{ L.legendMixed }}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded-sm bg-neutral-800 border border-neutral-600"></span>
            {{ L.legendFold }}
          </span>
        </div>
        <div
          v-else
          class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-neutral-400"
        >
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded-sm" :style="{ background: red500 }"></span>
            {{ active.legendRaise }}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded-sm" :style="{ background: green500 }"></span>
            {{ L.legendCall }}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded-sm bg-neutral-800 border border-neutral-600"></span>
            {{ L.legendFold }}
          </span>
          <span>{{ active.legendNote }}</span>
        </div>
      </div>

      <!-- 우측: 통계·동작·설명 -->
      <div class="flex-grow min-w-0">
        <div class="flex flex-wrap gap-2 mb-4">
          <div v-for="s in active.stats" :key="s.label" class="stat-chip">
            {{ s.label }} <b :data-testid="s.testid">{{ $n(s.value) }}</b>
          </div>
        </div>

        <p v-if="active.note" class="text-sm text-neutral-400 mb-4">
          {{ active.note }}
        </p>

        <div class="flex flex-wrap gap-2 mb-5">
          <button
            v-for="a in active.actions"
            :key="a.key"
            :class="a.cls"
            :disabled="a.disabled"
            @click="a.run()"
          >
            {{ a.label }}
          </button>
        </div>

        <div class="panel mb-4">
          <div class="section-title">{{ L.howTitle }}</div>
          <ul class="list-disc pl-5 text-sm text-neutral-300 space-y-1.5">
            <li v-for="(line, i) in active.how" :key="i">{{ line }}</li>
          </ul>
        </div>

        <div class="panel">
          <div class="section-title">{{ L.sourceTitle }}</div>
          <p class="text-sm text-neutral-400 leading-relaxed">
            {{ L.sourceBody }}
          </p>
          <p class="text-xs text-neutral-500 mt-2">
            {{ L.sourceList }}
          </p>
          <p class="text-xs text-neutral-500 mt-2">
            {{ L.phase2 }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { useStore } from "../store";
import { i18n } from "../i18n";
import { noteToolUsed } from "../pwa";
import {
  POSITIONS,
  Position,
  SCENARIOS,
  ScenarioId,
  VS3BET_SCENARIOS,
  Vs3BetId,
  VS4BET_SCENARIOS,
  Vs4BetId,
  gridFor,
  statsFor,
  rangeTextFor,
  defendGridsFor,
  defendStatsFor,
  defendRangeTextFor,
  vs3betGridsFor,
  vs3betStatsFor,
  vs3betRangeTextFor,
  vs4betGridsFor,
  vs4betStatsFor,
  vs4betRangeTextFor,
} from "../preflop-charts";
import { ranks } from "../utils";

import { C } from "../theme";

const yellow500 = C.accent;
const red500 = "#ef4444"; // 3벳 (결과 매트릭스의 벳 색과 같은 계열)
const green500 = "#22c55e"; // 콜

const M = {
  ko: {
    modeRfi: "오픈 (RFI)",
    modeDefend: "vs 오픈 (수비)",
    mode3bet: "vs 3벳 (오픈 후)",
    mode4bet: "vs 4벳 (3벳 후)",
    intro4bet:
      "내가 3벳했는데 4벳을 받았을 때의 대응 — 빨강은 5벳(올인), 초록은 콜, " +
      "나머지는 폴드입니다. 빈도는 «3벳했다면» 기준이라 3벳하지 않는 핸드는 " +
      "비어 있습니다. 6맥스 캐시 100bb, BB 3벳 11bb → 4벳 24bb / SB 3벳 10bb → 4벳 22bb 기준.",
    legend5bet: "5벳 (올인)",
    legendCond4bet: "빈 칸 = 애초에 3벳 안 함",
    stat5bet: "5벳 비율",
    statContinue4bet: "계속(3벳 대비)",
    copy5bet: "5벳 레인지 복사",
    note4bet:
      "통계는 «3벳 레인지 대비» 비율입니다. 100bb에서 5벳은 사실상 올인 한 가지입니다 — " +
      "밸류는 AA·KK 중심(가끔 콜로 트랩)이고 QQ·AK는 5벳과 콜을 섞습니다. 콜은 팟 오즈가 " +
      "아니라 실현율이 기준입니다: 포지션 없이 낮은 SPR로 싸우므로 페어와 최상위 수딧만 " +
      "남기되, 상대 4벳에 A5s-A4s 같은 블러프가 섞여 있어 전부 접지는 않습니다.",
    how4bet2:
      "빨강+초록이 칸을 다 채우지 못하면 그만큼 폴드입니다. 두 색이 함께면 5벳과 콜을 " +
      "혼합합니다. 3벳 레인지에 없는 핸드는 이 상황 자체가 생기지 않아 비어 있습니다.",
    intro3bet:
      "내가 오픈 레이즈했는데 3벳을 받았을 때의 대응 — 빨강은 4벳, 초록은 콜, " +
      "나머지는 폴드입니다. 빈도는 «오픈했다면» 기준이라 오픈하지 않는 핸드는 " +
      "비어 있습니다. 6맥스 캐시 100bb, 오픈 2.5bb, 3벳 약 10~11bb 기준.",
    legend4bet: "4벳",
    legendCond: "빈 칸 = 애초에 오픈 안 함",
    stat4bet: "4벳 비율",
    statContinue: "계속(오픈 대비)",
    copy4bet: "4벳 레인지 복사",
    note3bet:
      "통계는 전체 핸드가 아니라 «오픈 레인지 대비» 비율입니다. 4벳 밸류는 " +
      "QQ+/AK 중심이고, A5s-A4s 같은 블러프를 소량 섞습니다. 콜은 포지션이 " +
      "있으니 페어·수딧 브로드웨이·커넥터까지 넓게 가져갑니다.",
    squeezeNote:
      "스퀴즈 = 오픈과 콜러가 모두 있는 상태에서의 3벳(여기서는 약 11~12bb). " +
      "콜러가 있으면 헤즈업 수비보다 전체 수비는 좁아지고 3벳은 밸류 중심이 " +
      "됩니다. 오버콜은 멀티웨이에서 너트를 만들 수 있는 수딧·커넥티드 핸드 위주입니다.",
    how3bet2:
      "빨강+초록이 칸을 다 채우지 못하면 그만큼 폴드입니다. 두 색이 함께면 4벳과 " +
      "콜을 혼합합니다. 오픈 레인지에 없는 핸드는 이 상황 자체가 생기지 않아 비어 있습니다.",
    intro:
      "포지션별 오픈 레인지(RFI) — 앞 사람이 모두 폴드했을 때 어떤 핸드로 " +
      "레이즈해야 할까요? 6맥스 캐시 100bb, 오픈 2.5bb 기준입니다. " +
      "부분 채움은 혼합 빈도(가끔만 오픈)를 뜻합니다.",
    introDefend:
      "상대가 먼저 오픈 레이즈했을 때의 대응 — 자주 나오는 조합들입니다. " +
      "빨강은 3벳, 초록은 콜, 두 색이 쌓인 높이가 수비 빈도입니다. " +
      "6맥스 캐시 100bb, 오픈 2.5bb(SB 오픈은 3bb) 기준.",
    legendOpen: "오픈 (100%)",
    legendMixed: "혼합 빈도 (채움 높이 = 오픈 %)",
    legendFold: "폴드",
    legend3bet: "3벳",
    legendCall: "콜",
    legendMixedDefend: "채움 높이 = 빈도 (섞인 칸은 그 비율로 혼합)",
    stat3bet: "3벳 비율",
    statCall: "콜 비율",
    statTotal: "총 수비",
    copy3bet: "3벳 레인지 복사",
    copyCall: "콜 레인지 복사",
    sbNote:
      "SB는 BTN 오픈에 사실상 «3벳 아니면 폴드»로 대응합니다 — 포지션도 없고 " +
      "BB가 아직 뒤에 남아 있어, 콜은 두 가지 불리함을 동시에 안기 때문입니다.",
    ipNote:
      "포지션이 있어도 앞 포지션의 오픈은 레인지가 강하고, 콜하면 뒤에 남은 " +
      "블라인드의 스퀴즈 위험까지 안습니다. 그래서 IP 수비는 3벳 중심의 좁은 " +
      "레인지가 되고, 콜은 페어·최상위 수딧 위주로만 남습니다.",
    statPercent: "오픈 비율",
    statCombos: "오픈 콤보",
    statHands: "오픈 핸드",
    statMixed: "혼합 핸드",
    copy: "레인지 텍스트 복사",
    copied: "✓ 복사됨",
    sendOop: "① OOP 레인지로 보내기",
    sendIp: "② IP 레인지로 보내기",
    howTitle: "읽는 법",
    how1: "좌상단→우하단 대각선이 페어, 그 위(오른쪽)가 수티드, 아래(왼쪽)가 오프수트입니다.",
    how2: "혼합 빈도 핸드(부분 채움)는 «항상»이 아니라 그 비율만큼만 오픈합니다. 경계 핸드라 어느 쪽을 택해도 EV 차이가 작습니다.",
    how3: "[레인지로 보내기]를 누르면 이 레인지가 커스텀 스팟의 레인지 입력에 채워집니다 — 플랍 이후를 직접 계산해 보세요.",
    howDefend2:
      "빨강+초록이 칸을 다 채우지 못하면 그만큼 폴드가 섞인 핸드입니다. 두 색이 함께 있는 칸은 3벳과 콜을 그 비율로 혼합합니다.",
    howDefend3:
      "[레인지 복사]로 얻은 텍스트를 커스텀 스팟의 ①/② 레인지 입력에 붙여넣으면 이 수비 레인지로 플랍 이후를 직접 계산할 수 있습니다.",
    sourceTitle: "이 차트는 어떻게 만들었나요?",
    sourceBody:
      "공개된 무료 GTO 자료 여러 개를 " +
      "핸드 단위로 교차 검증해 «합의 레인지»를 만들고, 자료마다 판단이 갈리는 경계 " +
      "핸드는 혼합 빈도로 표기했습니다. BTN·SB는 이 앱의 교육 예제에 쓰이는 " +
      "솔버 검증 레인지와도 대조했습니다.",
    sourceList:
      "교차 검증에 쓴 공개 자료: nlh.poker · Preflop Wizard · HoldemPro · " +
      "The Felt(about-poker.com) · BeyondGTO · ThinkGTO(BB vs SB 실측 빈도) · " +
      "GTO Gecko·RiverOdds(수비 빈도 앵커) · GTO Wizard 블로그·FreeBetRange" +
      "(IP 수비·스퀴즈 원칙) · 888poker·Run It Once(vs 3벳 빈도) + " +
      "자체 교육 프리셋 레인지 (2026-08 수집)",
    phase2: "수비 조합과 시나리오는 계속 추가될 예정입니다.",
  },
  hi: {

    modeRfi: "Open (RFI)",
    modeDefend: "Open के सामने",
    mode3bet: "3-bet के सामने (open के बाद)",
    mode4bet: "4-bet के सामने (3-bet के बाद)",
    intro4bet: "आपके 3-bet पर 4-bet आने के बाद की रणनीति: लाल = 5-bet (all-in), हरा = call, बाकी = fold। आवृत्तियाँ आपके 3-bet कर चुकने की शर्त पर हैं, इसलिए जिन हैंड से आप 3-bet नहीं करते, वे खाली हैं। आधार: 6-max cash, 100bb; BB का 11bb 3-bet → 24bb 4-bet, SB का 10bb 3-bet → 22bb 4-bet।",
    legend5bet: "5-bet (all-in)",
    legendCond4bet: "खाली = इस हैंड से 3-bet नहीं होता",
    stat5bet: "5-bet %",
    statContinue4bet: "आगे खेलने का % (3-bet range में से)",
    copy5bet: "5-bet range कॉपी करें",
    note4bet: "ये आँकड़े आपकी 3-bet range के हिस्से हैं। 100bb पर 5-bet लगभग हमेशा all-in होता है। Value के लिए मुख्य हैंड AA·KK हैं (कभी call करके trap), जबकि QQ·AK में 5-bet और call मिलते हैं। Call करते समय pot odds के साथ equity realization भी देखें: कम SPR पर OOP खेलना होता है, इसलिए मुख्यतः pairs और सबसे मज़बूत suited हैंड बचते हैं। विरोधी की 4-bet range में A5s–A4s जैसे bluffs भी हैं, इसलिए हर हैंड fold करना सही नहीं होगा।",
    how4bet2: "लाल और हरे हिस्से के बाद बचा खाली हिस्सा fold है। दोनों रंग वाले खाने में 5-bet और call मिलते हैं। 3-bet range से बाहर के हैंड इस स्थिति तक नहीं पहुँचते, इसलिए उनके खाने खाली हैं।",
    intro3bet: "आपके open-raise पर 3-bet आने के बाद की रणनीति: लाल = 4-bet, हरा = call, बाकी = fold। आवृत्तियाँ आपके open कर चुकने की शर्त पर हैं, इसलिए जिन हैंड से आप open नहीं करते, वे खाली हैं। आधार: 6-max cash, 100bb, 2.5bb open, लगभग 10–11bb 3-bet।",
    legend4bet: "4-bet",
    legendCond: "खाली = इस हैंड से open नहीं होता",
    stat4bet: "4-bet %",
    statContinue: "आगे खेलने का % (open range में से)",
    copy4bet: "4-bet range कॉपी करें",
    note3bet: "ये आँकड़े आपकी opening range के हिस्से हैं, सभी हैंड के नहीं। 4-bet की value range मुख्यतः QQ+/AK है, जिसमें A5s-A4s जैसे कुछ bluffs मिलते हैं। IP होने पर calling range में pairs, suited broadways और connectors भी शामिल रहते हैं।",
    squeezeNote: "Opener और caller दोनों pot में हों, तब किया गया 3-bet squeeze कहलाता है (यहाँ लगभग 11–12bb)। Caller की मौजूदगी में कुल defend range heads-up से छोटी होती है और 3-bet में value हैंड का हिस्सा बढ़ता है। Overcall में ऐसे suited, connected हैंड काम आते हैं जो multiway pot में nuts बना सकें।",
    how3bet2: "लाल और हरे हिस्से के बाद बचा खाली हिस्सा fold है। दोनों रंग वाले खाने में 4-bet और call मिलते हैं। Opening range से बाहर के हैंड इस स्थिति तक नहीं पहुँचते, इसलिए उनके खाने खाली हैं।",
    intro: "पोज़िशन के हिसाब से opening ranges (RFI): आपके पहले सभी fold कर दें, तो किन हैंड से raise करें? आधार: 6-max cash, 100bb, 2.5bb open। आधे-अधूरे भरे खाने mixed-frequency opens दिखाते हैं।",
    introDefend: "आपसे पहले किसी के open-raise करने पर की रणनीति — आम matchups। लाल = 3-bet, हरा = call; दोनों रंगों की कुल ऊँचाई defend की आवृत्ति है। आधार: 6-max cash, 100bb, 2.5bb open (SB से 3bb)।",
    legendOpen: "Open (100%)",
    legendMixed: "मिश्रित आवृत्ति (भराव की ऊँचाई = open %)",
    legendFold: "Fold",
    legend3bet: "3-bet",
    legendCall: "Call",
    legendMixedDefend: "भराव की ऊँचाई = आवृत्ति (2 रंग = मिश्रण)",
    stat3bet: "3-bet %",
    statCall: "Call %",
    statTotal: "कुल defend",
    copy3bet: "3-bet range कॉपी करें",
    copyCall: "Call range कॉपी करें",
    sbNote: "BTN के open के सामने SB की रणनीति मुख्यतः 3-bet या fold है। आप OOP हैं और BB की बारी भी बाकी है; call करने पर दोनों मुश्किलें साथ आती हैं।",
    ipNote: "IP होने पर भी early-position opener की range मज़बूत होती है। Call करने से पीछे बचे blinds के squeeze का जोखिम भी रहता है। इसलिए IP defend range छोटी और 3-bet पर केंद्रित रहती है; calls मुख्यतः pairs और premium suited हैंड से होते हैं।",
    statPercent: "Open %",
    statCombos: "Open किए गए combos",
    statHands: "Open किए गए हैंड",
    statMixed: "मिश्रित हैंड",
    copy: "Range टेक्स्ट कॉपी करें",
    copied: "✓ कॉपी हो गया",
    sendOop: "① OOP Range में भेजें",
    sendIp: "② IP Range में भेजें",
    howTitle: "इसे कैसे पढ़ें",
    how1: "ऊपर बाएँ से नीचे दाएँ जाने वाली तिरछी लाइन पर pairs हैं। उसके ऊपर (दाएँ) suited और नीचे (बाएँ) offsuit हैंड हैं।",
    // hi: consensus-source disagreement is not proof of a solver-derived near-indifference EV.
    how2: "आधा-अधूरा भराव बताता है कि यह हैंड हर बार open नहीं होता। इस चार्ट में स्रोतों के मतभेद को mixed frequency से दिखाया गया है; इसे हर हैंड की सॉल्वर से निकली सटीक आवृत्ति न मानें।",
    how3: "[Range में भेजें] बटन यह range [अपना स्पॉट] के range editor में लोड करते हैं। फिर postflop रणनीति की गणना खुद करके देखें।",
    howDefend2: "लाल और हरे हिस्से के बाद बचा खाली हिस्सा fold है। दोनों रंग वाले खाने में दिए गए अनुपात से 3-bet और call मिलते हैं।",
    howDefend3: "कॉपी की गई range को [अपना स्पॉट] के range इनपुट (① / ②) में पेस्ट करें और इस defend range के साथ postflop रणनीति की गणना करें।",
    sourceTitle: "यह चार्ट कैसे बनाया गया?",
    sourceBody: "हमने मुफ़्त उपलब्ध कई GTO स्रोतों की हैंड-दर-हैंड तुलना करके एक consensus range बनाई। जिन हैंड पर स्रोतों में मतभेद था, उन्हें mixed frequency दी गई। BTN और SB को इस ऐप के अभ्यास स्पॉट में इस्तेमाल होने वाली solver-verified ranges से भी मिलाया गया।",
    sourceList: "तुलना किए गए सार्वजनिक स्रोत: nlh.poker · Preflop Wizard · HoldemPro · The Felt (about-poker.com) · BeyondGTO · ThinkGTO (BB vs SB की solved frequencies) · GTO Gecko · RiverOdds (defense anchors) · GTO Wizard blog · FreeBetRange (IP defense और squeeze के सिद्धांत) · 888poker · Run It Once (3-bet के सामने आवृत्तियाँ) + हमारे अभ्यास स्पॉट की ranges (संग्रह: 2026-08)",
    phase2: "आगे और matchups व स्थितियाँ जोड़ी जाएँगी।",
  },
  en: {
    modeRfi: "Opening (RFI)",
    modeDefend: "vs Open (Defense)",
    mode3bet: "vs 3-bet (after opening)",
    mode4bet: "vs 4-bet (after 3-betting)",
    intro4bet:
      "How to respond when your 3-bet gets 4-bet — red is 5-bet (all-in), green " +
      "is call, everything else is a fold. Frequencies are conditional on having 3-bet, so " +
      "hands you never 3-bet are blank. 6-max cash, 100bb; BB 3-bets 11bb " +
      "and faces a 24bb 4-bet; SB 3-bets 10bb and faces 22bb.",
    legend5bet: "5-bet (all-in)",
    legendCond4bet: "Blank = never 3-bet in the first place",
    stat5bet: "5-bet %",
    statContinue4bet: "Continue % (of 3-bets)",
    copy5bet: "Copy 5-bet range",
    note4bet:
      "The stats are shares of your 3-betting range. At 100bb the 5-bet is " +
      "effectively all-in — value centers on AA·KK (occasionally trapping with a " +
      "call), and QQ·AK mix 5-bets with calls. Calls are driven by equity realization, " +
      "not pot odds: you fight out of position at a low SPR, so only pairs and " +
      "top suited hands continue — but don't fold everything, because their " +
      "4-betting range mixes in bluffs like A5s–A4s.",
    how4bet2:
      "If red + green don't fill the cell, the rest is folded. Cells with both " +
      "colors mix 5-bets and calls. Hands outside the 3-betting range never " +
      "face this spot, so they are blank.",
    intro3bet:
      "How to respond when your open-raise gets 3-bet — red is 4-bet, green is " +
      "call, everything else is a fold. Frequencies are conditional on having opened, so " +
      "hands you never open are blank. 6-max cash, 100bb, 2.5bb open, ~10-11bb 3-bet.",
    legend4bet: "4-bet",
    legendCond: "Blank = never opened in the first place",
    stat4bet: "4-bet %",
    statContinue: "Continue % (of opens)",
    copy4bet: "Copy 4-bet range",
    note3bet:
      "The stats are shares of your opening range, not of all hands. 4-bet value " +
      "centers on QQ+/AK with a few bluffs like A5s-A4s mixed in. With position, " +
      "the calling range stays wide: pairs, suited broadways, and connectors.",
    squeezeNote:
      "A squeeze is a 3-bet with both an opener and a caller in the pot (about " +
      "11-12bb here). The caller makes total defense tighter than heads-up and " +
      "pushes the 3-bet toward value. Overcalls favor suited, connected hands " +
      "that can make the nuts multiway.",
    how3bet2:
      "If red + green don't fill the cell, the rest is folded. Cells with both " +
      "colors mix 4-bets and calls. Hands outside the opening range never face " +
      "this spot, so they are blank.",
    intro:
      "Opening ranges by position (RFI) — which hands should you raise when " +
      "everyone folds to you? Based on 6-max cash, 100bb, 2.5bb open. " +
      "Partially filled cells are mixed-frequency opens.",
    introDefend:
      "How to respond when someone open-raises before you — the most " +
      "common matchups. Red is 3-bet, green is call, and the stacked height is " +
      "your total defend frequency. 6-max cash, 100bb, 2.5bb open (3bb for SB opens).",
    legendOpen: "Open (100%)",
    legendMixed: "Mixed frequency (fill height = open %)",
    legendFold: "Fold",
    legend3bet: "3-bet",
    legendCall: "Call",
    legendMixedDefend: "Fill height = frequency (split cells are mixed)",
    stat3bet: "3-bet %",
    statCall: "Call %",
    statTotal: "Total defend",
    copy3bet: "Copy 3-bet range",
    copyCall: "Copy call range",
    sbNote:
      "In the SB you're essentially 3-bet-or-fold against a BTN open — you're " +
      "out of position with BB still left to act, so calling saddles you with " +
      "both disadvantages at once.",
    ipNote:
      "Even with position, an early-position opening range is strong, and " +
      "calling risks a squeeze from the blinds still left to act. In-position " +
      "defense is therefore a narrow, 3-bet-centric range, with calls mostly " +
      "limited to pairs and premium suited hands.",
    statPercent: "Open %",
    statCombos: "Combos opened",
    statHands: "Hands opened",
    statMixed: "Mixed hands",
    copy: "Copy range text",
    copied: "✓ Copied",
    sendOop: "① Send to OOP Range",
    sendIp: "② Send to IP Range",
    howTitle: "How to read this",
    how1: "The top-left to bottom-right diagonal is pairs; above it (right) is suited, below it (left) is offsuit.",
    how2: "Mixed-frequency hands (partial fill) are opened only that fraction of the time — they are borderline, so either choice loses little EV.",
    how3: "The [Send to Range] buttons load this range into the custom-spot range editor — try solving the postflop play yourself.",
    howDefend2:
      "If red + green don't fill the whole cell, the rest is folded. Cells showing both colors mix 3-bets and calls at those ratios.",
    howDefend3:
      "Paste a copied range into the custom-spot range inputs (① / ②) to solve the postflop play with this defense range yourself.",
    sourceTitle: "How was this chart built?",
    sourceBody:
      "We cross-checked several " +
      "freely published GTO resources hand by hand to build a consensus range, " +
      "marking hands the sources disagree on as mixed frequencies. BTN and SB " +
      "were also checked against the solver-verified ranges used by this app's Study Spots.",
    sourceList:
      "Public sources cross-checked: nlh.poker · Preflop Wizard · HoldemPro · " +
      "The Felt (about-poker.com) · BeyondGTO · ThinkGTO (BB vs SB solved frequencies) · " +
      "GTO Gecko · RiverOdds (defense anchors) · GTO Wizard blog · FreeBetRange " +
      "(IP defense & squeeze principles) · 888poker · Run It Once (vs 3-bet " +
      "frequencies) + our own study-spot ranges (collected 2026-08)",
    phase2: "We'll keep adding more matchups and scenarios.",
  },
  ja: {
    modeRfi: "オープン (RFI)",
    modeDefend: "vs オープン",
    mode3bet: "vs 3ベット",
    mode4bet: "vs 4ベット",
    intro4bet:
      "自分が3ベットした後に4ベットを受けたときの対応です — 赤は5ベット（オールイン）、" +
      "緑はコール、残りはフォールドです。頻度は「3ベットした場合」を基準としているため、" +
      "3ベットしないハンドは空欄です。6maxキャッシュゲーム100bb、BBの3ベット11bb → 4ベット24bb / " +
      "SBの3ベット10bb → 4ベット22bbが基準です。",
    legend5bet: "5ベット（オールイン）",
    legendCond4bet: "空欄 = そもそも3ベットしない",
    stat5bet: "5ベット率",
    statContinue4bet: "継続（3ベット比）",
    copy5bet: "5ベットレンジをコピー",
    note4bet:
      "統計は「3ベットレンジに対する」割合です。100bbでは5ベットは実質オールイン一択です — " +
      "バリューはAA・KKが中心（まれにコールでトラップ）で、QQ・AKは5ベットとコールを混ぜます。" +
      "コールの基準はポットオッズではなくエクイティ実現率です。ポジションなしの低SPRで戦うため、" +
      "ペアと最上位のスーテッドだけを残しますが、相手の4ベットにはA5s-A4sのようなブラフも" +
      "混ざっているので、すべてを降りるわけではありません。",
    how4bet2:
      "赤＋緑がマスを満たさない分はフォールドです。両色が重なるマスは5ベットとコールを" +
      "混合します。3ベットレンジにないハンドはこの状況自体が起こらないため空欄です。",
    intro3bet:
      "自分がオープンレイズした後に3ベットを受けたときの対応です — 赤は4ベット、緑はコール、" +
      "残りはフォールドです。頻度は「オープンした場合」を基準としているため、オープンしない" +
      "ハンドは空欄です。6maxキャッシュゲーム100bb、オープン2.5bb、3ベット約10〜11bbが基準です。",
    legend4bet: "4ベット",
    legendCond: "空欄 = そもそもオープンしない",
    stat4bet: "4ベット率",
    statContinue: "継続（オープン比）",
    copy4bet: "4ベットレンジをコピー",
    note3bet:
      "統計は全ハンドではなく「オープンレンジに対する」割合です。4ベットのバリューは" +
      "QQ+/AKが中心で、A5s-A4sのようなブラフを少量混ぜます。コールはポジションが" +
      "あるため、ペア・スーテッドブロードウェイ・コネクターまで広く続行します。",
    squeezeNote:
      "スクイーズ = オープンとコーラーが両方いる状況での3ベット（ここでは約11〜12bb）です。" +
      "コーラーがいるとヘッズアップのディフェンスより全体の続行は狭くなり、3ベットは" +
      "バリュー中心になります。オーバーコールはマルチウェイでナッツを作れる" +
      "スーテッドコネクター系のハンドが中心です。",
    how3bet2:
      "赤＋緑がマスを満たさない分はフォールドです。両色が重なるマスは4ベットとコールを" +
      "混合します。オープンレンジにないハンドはこの状況自体が起こらないため空欄です。",
    intro:
      "ポジション別のオープンレンジ（RFI）です — 前の全員がフォールドしたとき、どのハンドで" +
      "レイズすべきでしょうか？6maxキャッシュゲーム100bb、オープン2.5bbが基準です。" +
      "部分的な塗りは混合頻度（ときどきだけオープン）を表します。",
    introDefend:
      "相手が先にオープンレイズしたときの対応 — よく出る組み合わせです。" +
      "赤は3ベット、緑はコール、2色を積み上げた高さがディフェンス頻度です。" +
      "6maxキャッシュゲーム100bb、オープン2.5bb（SBオープンは3bb）が基準です。",
    legendOpen: "オープン (100%)",
    legendMixed: "混合頻度（塗りの高さ = オープン%）",
    legendFold: "フォールド",
    legend3bet: "3ベット",
    legendCall: "コール",
    legendMixedDefend: "塗りの高さ = 頻度（2色のマスはその比率で混合）",
    stat3bet: "3ベット率",
    statCall: "コール率",
    statTotal: "ディフェンス合計",
    copy3bet: "3ベットレンジをコピー",
    copyCall: "コールレンジをコピー",
    sbNote:
      "SBはBTNのオープンに対して実質「3ベットかフォールド」で対応します — ポジションがなく、" +
      "BBがまだ後ろに残っているため、コールは2つの不利を同時に抱えることになるからです。",
    ipNote:
      "ポジションがあっても、アーリーポジションのオープンはレンジが強く、コールすると" +
      "後ろに残るブラインドのスクイーズのリスクも抱えます。そのためIPのディフェンスは" +
      "3ベット中心の狭いレンジになり、コールはペアと最上位のスーテッドが中心になります。",
    statPercent: "オープン率",
    statCombos: "オープンコンボ",
    statHands: "オープンハンド",
    statMixed: "混合ハンド",
    copy: "レンジテキストをコピー",
    copied: "✓ コピーしました",
    sendOop: "① OOPレンジへ送る",
    sendIp: "② IPレンジへ送る",
    howTitle: "読み方",
    how1: "左上→右下の対角線がペア、その上（右側）がスーテッド、下（左側）がオフスートです。",
    how2: "混合頻度のハンド（部分的な塗り）は「常に」ではなく、その割合だけオープンします。境界ハンドなので、どちらを選んでもEVの差はわずかです。",
    how3: "[レンジへ送る]を押すと、このレンジがカスタムスポットのレンジ入力に読み込まれます — フロップ以降を自分で計算してみましょう。",
    howDefend2:
      "赤＋緑がマスを満たさない分はフォールドが混ざるハンドです。両色が重なるマスは3ベットとコールをその比率で混合します。",
    howDefend3:
      "コピーしたレンジをカスタムスポットの①/②のレンジ入力に貼り付けると、このディフェンスレンジでフロップ以降を自分で計算できます。",
    sourceTitle: "このレンジ表はどうやって作られていますか？",
    sourceBody:
      "公開されている無料のGTO資料を複数、" +
      "ハンド単位で相互検証して「合意レンジ」を作り、資料ごとに判断が分かれる境界ハンドは" +
      "混合頻度として表記しました。BTN・SBは、本アプリの学習スポットに使われている" +
      "ソルバー検証済みレンジとも照合しています。",
    sourceList:
      "相互検証に使った公開資料：nlh.poker・Preflop Wizard・HoldemPro・" +
      "The Felt (about-poker.com)・BeyondGTO・ThinkGTO（BB vs SBの実測頻度）・" +
      "GTO Gecko・RiverOdds（ディフェンス頻度のアンカー）・GTO Wizardブログ・FreeBetRange" +
      "（IPディフェンス・スクイーズの原則）・888poker・Run It Once（vs 3ベット頻度） + " +
      "自社の学習プリセットレンジ（2026-08収集）",
    phase2: "組み合わせとシナリオは今後も追加していく予定です。",
  },
  es: {
    modeRfi: "Open (RFI)",
    modeDefend: "vs Open (defensa)",
    mode3bet: "vs 3-bet (tras abrir)",
    mode4bet: "vs 4-bet (tras 3-betear)",
    intro4bet:
      "Cómo responder cuando tu 3-bet recibe un 4-bet — el rojo es 5-bet (all-in), el verde " +
      "es call y el resto se retira. Las frecuencias son condicionales a haber 3-beteado, así que " +
      "las manos que nunca 3-beteas quedan en blanco. Cash 6-max, 100bb; la BB 3-betea 11bb " +
      "y enfrenta un 4-bet de 24bb, la SB 3-betea 10bb y enfrenta 22bb.",
    legend5bet: "5-bet (all-in)",
    legendCond4bet: "En blanco = nunca se 3-betea",
    stat5bet: "% de 5-bet",
    statContinue4bet: "Continúa (de los 3-bets)",
    copy5bet: "Copiar rango de 5-bet",
    note4bet:
      "Las estadísticas son proporciones de tu rango de 3-bet. A 100bb el 5-bet es en la práctica " +
      "all-in — el valor se centra en AA·KK (a veces solo pagando para tender una trampa), y QQ·AK mezclan 5-bets " +
      "con calls. Los calls se guían por la realización, no por las pot odds: peleas fuera de " +
      "posición con SPR bajo, así que solo continúan los pares y las mejores manos suited — pero " +
      "no lo foldees todo, porque el rango de 4-bet mezcla bluffs como A5s-A4s.",
    how4bet2:
      "Si el rojo + verde no llenan la celda, el resto se retira. Las celdas con ambos colores " +
      "mezclan 5-bets y calls. Las manos fuera del rango de 3-bet nunca enfrentan este spot, " +
      "por eso están en blanco.",
    intro3bet:
      "Cómo responder cuando tu open-raise recibe un 3-bet — el rojo es 4-bet, el verde es call " +
      "y el resto se retira. Las frecuencias son condicionales a haber abierto, así que las manos " +
      "que nunca abres quedan en blanco. Cash 6-max, 100bb, open de 2.5bb, 3-bet de ~10-11bb.",
    legend4bet: "4-bet",
    legendCond: "En blanco = nunca se abre",
    stat4bet: "% de 4-bet",
    statContinue: "Continúa (de los opens)",
    copy4bet: "Copiar rango de 4-bet",
    note3bet:
      "Las estadísticas son proporciones de tu rango de apertura, no de todas las manos. El valor " +
      "del 4-bet se centra en QQ+/AK con algunos bluffs como A5s-A4s. Con posición, el rango de " +
      "call se mantiene amplio: pares, broadways suited y conectores.",
    squeezeNote:
      "Un squeeze es un 3-bet con un opener y un caller ya en el bote (aquí de unos 11-12bb). " +
      "El caller hace que la defensa total sea más estrecha que en heads-up y empuja el 3-bet " +
      "hacia el valor. Los overcalls favorecen manos suited y conectadas que pueden ligar los nuts multiway.",
    how3bet2:
      "Si el rojo + verde no llenan la celda, el resto se retira. Las celdas con ambos colores " +
      "mezclan 4-bets y calls. Las manos fuera del rango de apertura nunca enfrentan este spot, " +
      "por eso están en blanco.",
    intro:
      "Rangos de apertura por posición (RFI) — ¿con qué manos deberías subir cuando todos se " +
      "retiran antes que tú? Basado en cash 6-max, 100bb, open de 2.5bb. Las celdas parcialmente " +
      "llenas son opens de frecuencia mixta.",
    introDefend:
      "Cómo responder cuando alguien abre antes que tú — los enfrentamientos más comunes. El rojo " +
      "es 3-bet, el verde es call, y la altura total de la barra es tu frecuencia de defensa. " +
      "Cash 6-max, 100bb, open de 2.5bb (3bb para opens de SB).",
    legendOpen: "Open (100%)",
    legendMixed: "Frecuencia mixta (altura = % de open)",
    legendFold: "Fold",
    legend3bet: "3-bet",
    legendCall: "Call",
    legendMixedDefend: "Altura del relleno = frecuencia (las celdas divididas son mixtas)",
    stat3bet: "% de 3-bet",
    statCall: "% de call",
    statTotal: "Defensa total",
    copy3bet: "Copiar rango de 3-bet",
    copyCall: "Copiar rango de call",
    sbNote:
      "La SB juega prácticamente 3-bet-o-fold contra un open del BTN — estás fuera de posición " +
      "y la BB todavía queda por hablar, así que pagar carga con las dos desventajas a la vez.",
    ipNote:
      "Incluso con posición, un open de posición temprana es un rango fuerte, y pagar te expone " +
      "a un squeeze de las ciegas que quedan por hablar. La defensa en posición es, por eso, un " +
      "rango estrecho centrado en el 3-bet, con calls limitados sobre todo a pares y las mejores manos suited.",
    statPercent: "% de open",
    statCombos: "Combos abiertos",
    statHands: "Manos que abres",
    statMixed: "Manos mixtas",
    copy: "Copiar texto del rango",
    copied: "✓ Copiado",
    sendOop: "① Enviar al rango OOP",
    sendIp: "② Enviar al rango IP",
    howTitle: "Cómo leerlo",
    how1: "La diagonal de arriba-izquierda a abajo-derecha son los pares; arriba (derecha) es suited, abajo (izquierda) es offsuit.",
    how2: "Las manos de frecuencia mixta (relleno parcial) se abren solo esa fracción de las veces — son manos límite, así que cualquiera de las dos opciones pierde poco EV.",
    how3: "Los botones [Enviar al rango] cargan este rango en el editor del spot personalizado — intenta resolver tú mismo el juego postflop.",
    howDefend2:
      "Si el rojo + verde no llenan toda la celda, el resto se retira. Las celdas con ambos colores mezclan 3-bets y calls en esas proporciones.",
    howDefend3:
      "Pega un rango copiado en los campos de rango del spot personalizado (① / ②) para resolver tú mismo el postflop con este rango de defensa.",
    sourceTitle: "¿Cómo se construyó esta tabla?",
    sourceBody:
      "Cotejamos a mano varios recursos GTO publicados gratuitamente para construir un rango de " +
      "consenso, marcando como frecuencia mixta las manos en las que las fuentes difieren. BTN y SB " +
      "también se contrastaron con los rangos verificados por solver que usan los Spots de estudio de esta app.",
    sourceList:
      "Fuentes públicas cotejadas: nlh.poker · Preflop Wizard · HoldemPro · " +
      "The Felt (about-poker.com) · BeyondGTO · ThinkGTO (frecuencias resueltas de BB vs SB) · " +
      "GTO Gecko · RiverOdds (anclas de defensa) · blog de GTO Wizard · FreeBetRange " +
      "(defensa IP y principios de squeeze) · 888poker · Run It Once (frecuencias vs 3-bet) + " +
      "nuestros propios rangos de estudio (recopilado 2026-08)",
    phase2: "Se seguirán agregando más enfrentamientos y escenarios.",
  },
  pt: {
    modeRfi: "Open (RFI)",
    modeDefend: "vs Open (defesa)",
    mode3bet: "vs 3-bet (depois de abrir)",
    mode4bet: "vs 4-bet (depois do 3-bet)",
    intro4bet:
      "Como responder quando o seu 3-bet leva um 4-bet — o vermelho é 5-bet (all-in), o verde " +
      "é call e o resto dá fold. As frequências são condicionais a ter dado 3-bet, então " +
      "as mãos com que você nunca dá 3-bet ficam em branco. Cash 6-max, 100bb; a BB dá 3-bet de 11bb " +
      "e enfrenta um 4-bet de 24bb, a SB dá 3-bet de 10bb e enfrenta 22bb.",
    legend5bet: "5-bet (all-in)",
    legendCond4bet: "Em branco = nunca dá 3-bet",
    stat5bet: "% de 5-bet",
    statContinue4bet: "% de continuação (dos 3-bets)",
    copy5bet: "Copiar range de 5-bet",
    note4bet:
      "As estatísticas são proporções do seu range de 3-bet. Com 100bb o 5-bet é na prática " +
      "all-in — o valor se concentra em AA·KK (às vezes só pagando para armar uma armadilha), e QQ·AK misturam 5-bets " +
      "com calls. Os calls se guiam pela realização de equity, não pelas pot odds: você briga fora de " +
      "posição com SPR baixo, então só continuam os pares e as melhores mãos suited — mas " +
      "não dê fold em tudo, porque o range de 4-bet mistura blefes como A5s-A4s.",
    how4bet2:
      "Se o vermelho + verde não preencherem a célula, o resto dá fold. As células com as duas cores " +
      "misturam 5-bets e calls. As mãos fora do range de 3-bet nunca enfrentam este spot, " +
      "por isso estão em branco.",
    intro3bet:
      "Como responder quando o seu open-raise leva um 3-bet — o vermelho é 4-bet, o verde é call " +
      "e o resto dá fold. As frequências são condicionais a ter aberto, então as mãos " +
      "com que você nunca abre ficam em branco. Cash 6-max, 100bb, open de 2,5bb, 3-bet de ~10-11bb.",
    legend4bet: "4-bet",
    legendCond: "Em branco = nunca abre",
    stat4bet: "% de 4-bet",
    statContinue: "% de continuação (dos opens)",
    copy4bet: "Copiar range de 4-bet",
    note3bet:
      "As estatísticas são proporções do seu range de abertura, não de todas as mãos. O valor " +
      "do 4-bet se concentra em QQ+/AK com alguns blefes como A5s-A4s. Com posição, o range de " +
      "call continua amplo: pares, broadways suited e connectors.",
    squeezeNote:
      "Um squeeze é um 3-bet com um opener e um caller já no pote (aqui de uns 11-12bb). " +
      "O caller faz a defesa total ficar mais estreita que no heads-up e empurra o 3-bet " +
      "para o valor. Os overcalls favorecem mãos suited e conectadas que podem ligar os nuts multiway.",
    how3bet2:
      "Se o vermelho + verde não preencherem a célula, o resto dá fold. As células com as duas cores " +
      "misturam 4-bets e calls. As mãos fora do range de abertura nunca enfrentam este spot, " +
      "por isso estão em branco.",
    intro:
      "Ranges de abertura por posição (RFI) — com que mãos você deve abrir quando todos " +
      "dão fold antes de você? Baseado em cash 6-max, 100bb, open de 2,5bb. As células " +
      "parcialmente preenchidas são opens de frequência mista.",
    introDefend:
      "Como responder quando alguém abre antes de você — os confrontos mais comuns. O vermelho " +
      "é 3-bet, o verde é call, e a altura total da barra é a sua frequência de defesa. " +
      "Cash 6-max, 100bb, open de 2,5bb (3bb para opens da SB).",
    legendOpen: "Open (100%)",
    legendMixed: "Frequência mista (altura = % de open)",
    legendFold: "Fold",
    legend3bet: "3-bet",
    legendCall: "Call",
    legendMixedDefend: "Altura do preenchimento = frequência (as células divididas são mistas)",
    stat3bet: "% de 3-bet",
    statCall: "% de call",
    statTotal: "Defesa total",
    copy3bet: "Copiar range de 3-bet",
    copyCall: "Copiar range de call",
    sbNote:
      "Na SB você joga praticamente 3-bet ou fold contra um open do BTN — você está fora de posição " +
      "e a BB ainda vai falar, então pagar carrega as duas desvantagens ao mesmo tempo.",
    ipNote:
      "Mesmo com posição, um open de posição inicial é um range forte, e pagar deixa você exposto " +
      "a um squeeze das blinds que ainda vão falar. Por isso a defesa em posição é um " +
      "range estreito centrado no 3-bet, com calls limitados sobretudo a pares e às melhores mãos suited.",
    statPercent: "% de open",
    statCombos: "Combos de open",
    statHands: "Mãos que você abre",
    statMixed: "Mãos mistas",
    copy: "Copiar texto do range",
    copied: "✓ Copiado",
    sendOop: "① Enviar para o range OOP",
    sendIp: "② Enviar para o range IP",
    howTitle: "Como ler",
    how1: "A diagonal de cima à esquerda até embaixo à direita são os pares; acima (à direita) é suited, abaixo (à esquerda) é offsuit.",
    how2: "As mãos de frequência mista (preenchimento parcial) só abrem essa fração das vezes — são mãos limítrofes, então qualquer uma das duas opções perde pouco EV.",
    how3: "Os botões [Enviar para o range] carregam este range no editor do spot personalizado — tente resolver você mesmo o jogo pós-flop.",
    howDefend2:
      "Se o vermelho + verde não preencherem a célula inteira, o resto dá fold. As células com as duas cores misturam 3-bets e calls nessas proporções.",
    howDefend3:
      "Cole um range copiado nos campos de range do spot personalizado (① / ②) para resolver você mesmo o pós-flop com este range de defesa.",
    sourceTitle: "Como esta tabela foi montada?",
    sourceBody:
      "Cruzamos mão a mão vários materiais de GTO publicados gratuitamente para montar um range de " +
      "consenso, marcando como frequência mista as mãos em que as fontes divergem. BTN e SB " +
      "também foram confrontados com os ranges verificados por solver que os Spots de estudo deste app usam.",
    sourceList:
      "Fontes públicas cruzadas: nlh.poker · Preflop Wizard · HoldemPro · " +
      "The Felt (about-poker.com) · BeyondGTO · ThinkGTO (frequências resolvidas de BB vs SB) · " +
      "GTO Gecko · RiverOdds (âncoras de defesa) · blog da GTO Wizard · FreeBetRange " +
      "(defesa IP e princípios de squeeze) · 888poker · Run It Once (frequências vs 3-bet) + " +
      "os nossos próprios ranges de estudo (compilado em agosto de 2026)",
    phase2: "Novos confrontos e cenários continuarão sendo adicionados.",
  },
  de: {
    modeRfi: "Open (RFI)",
    modeDefend: "vs Open (Verteidigung)",
    mode3bet: "vs 3-Bet (nach dem Open)",
    // die Bet ist weiblich (본체 브리프 §7-9 실측) → «nach der 3-Bet»
    mode4bet: "vs 4-Bet (nach der 3-Bet)",
    intro4bet:
      "Wie du reagierst, wenn deine 3-Bet eine 4-Bet kassiert – Rot ist 5-Bet (All-in), Grün ist " +
      "Call, der Rest foldet. Die Frequenzen gelten unter der Bedingung, dass du 3-bettest; " +
      "Hände, die du nie 3-bettest, bleiben leer. 6-max Cashgame, 100bb: die BB 3-bettet auf " +
      "11bb und bekommt eine 4-Bet auf 24bb, die SB 3-bettet auf 10bb und bekommt 22bb.",
    legend5bet: "5-Bet (All-in)",
    legendCond4bet: "Leer = wird hier nie 3-gebettet",
    stat5bet: "5-Bet-Anteil",
    statContinue4bet: "Continue-Anteil (von den 3-Bets)",
    copy5bet: "5-Bet-Range kopieren",
    note4bet:
      "Die Statistik zeigt Anteile deiner 3-Bet-Range. Mit 100bb ist die 5-Bet praktisch immer " +
      "All-in – der Value liegt bei AA·KK (manchmal nur gecallt, um eine Falle zu stellen), " +
      "QQ·AK mischen 5-Bet und Call. Die Calls richten sich nach der Equity-Realisierung, nicht " +
      "nach den Pot Odds: Du spielst ohne Position mit niedrigem SPR, deshalb bleiben nur Paare " +
      "und die besten suited Hände – aber folde nicht alles, denn die 4-Bet-Range mischt Bluffs " +
      "wie A5s-A4s hinein.",
    how4bet2:
      "Füllen Rot und Grün die Zelle nicht ganz, wird der Rest gefoldet. Zellen mit beiden Farben " +
      "mischen 5-Bet und Call. Hände außerhalb der 3-Bet-Range geraten nie in diesen Spot und " +
      "bleiben deshalb leer.",
    intro3bet:
      "Wie du reagierst, wenn dein Open-Raise eine 3-Bet kassiert – Rot ist 4-Bet, Grün ist Call, " +
      "der Rest foldet. Die Frequenzen gelten unter der Bedingung, dass du geöffnet hast; Hände, " +
      "die du nie eröffnest, bleiben leer. 6-max Cashgame, 100bb, Open auf 2,5bb, 3-Bet auf ca. 10–11bb.",
    legend4bet: "4-Bet",
    legendCond: "Leer = wird nie eröffnet",
    stat4bet: "4-Bet-Anteil",
    statContinue: "Continue-Anteil (von den Opens)",
    copy4bet: "4-Bet-Range kopieren",
    note3bet:
      "Die Statistik zeigt Anteile deiner Open-Range, nicht aller Hände. Der Value der 4-Bet liegt " +
      "bei QQ+/AK, dazu ein paar Bluffs wie A5s-A4s. Mit Position bleibt die Call-Range breit: " +
      "Paare, suited Broadways und Connectors.",
    squeezeNote:
      "Ein Squeeze ist eine 3-Bet, wenn schon ein Opener und ein Caller im Pot sind (hier etwa " +
      "11–12bb). Der Caller macht die Gesamtverteidigung enger als im Heads-up und schiebt die " +
      "3-Bet Richtung Value. Overcalls bevorzugen suited Hände und Connectors, die multiway die " +
      "Nuts treffen können.",
    how3bet2:
      "Füllen Rot und Grün die Zelle nicht ganz, wird der Rest gefoldet. Zellen mit beiden Farben " +
      "mischen 4-Bet und Call. Hände außerhalb der Open-Range geraten nie in diesen Spot und " +
      "bleiben deshalb leer.",
    intro:
      "Open-Ranges nach Position (RFI) – mit welchen Händen solltest du eröffnen, wenn vor dir alle " +
      "folden? Basis: 6-max Cashgame, 100bb, Open auf 2,5bb. Teilweise gefüllte Zellen sind Opens " +
      "mit gemischter Frequenz.",
    introDefend:
      "Wie du reagierst, wenn vor dir jemand öffnet – die häufigsten Konstellationen. Rot ist " +
      "3-Bet, Grün ist Call, und die Gesamthöhe des Balkens ist deine Verteidigungsfrequenz. " +
      "6-max Cashgame, 100bb, Open auf 2,5bb (3bb bei Opens der SB).",
    legendOpen: "Open (100%)",
    legendMixed: "Gemischte Frequenz (Füllhöhe = Open-%)",
    legendFold: "Fold",
    legend3bet: "3-Bet",
    legendCall: "Call",
    legendMixedDefend: "Füllhöhe = Frequenz (geteilte Zellen sind gemischt)",
    stat3bet: "3-Bet-Anteil",
    statCall: "Call-Anteil",
    statTotal: "Gesamtverteidigung",
    copy3bet: "3-Bet-Range kopieren",
    copyCall: "Call-Range kopieren",
    sbNote:
      "In der SB spielst du gegen ein BTN-Open praktisch nur 3-Bet oder Fold – du bist ohne " +
      "Position und die BB ist noch nicht durch, ein Call vereint also beide Nachteile.",
    ipNote:
      "Auch mit Position ist die Open-Range aus früher Position stark, und ein Call setzt " +
      "dich dem Squeeze der Blinds aus, die noch nicht durch sind. Deshalb ist die Verteidigung in " +
      "Position eng und dreht sich um die 3-Bet; Calls bleiben vor allem Paaren und den besten " +
      "suited Händen vorbehalten.",
    statPercent: "Open-Anteil",
    statCombos: "Open-Combos",
    statHands: "Hände, die du eröffnest",
    statMixed: "Gemischte Hände",
    copy: "Range-Text kopieren",
    copied: "✓ Kopiert",
    sendOop: "① An OOP-Range senden",
    sendIp: "② An IP-Range senden",
    howTitle: "So liest du das",
    how1:
      "Die Diagonale von links oben nach rechts unten sind die Paare; darüber (rechts) steht suited, darunter (links) offsuit.",
    how2:
      "Hände mit gemischter Frequenz (teilweise gefüllt) werden nur in diesem Anteil der Fälle eröffnet – es sind Grenzhände, bei denen beide Optionen kaum EV kosten.",
    how3:
      "Die Buttons [① An OOP-Range senden] / [② An IP-Range senden] laden diese Range in den Editor des eigenen Spots – versuche dich selbst am Postflop-Spiel.",
    howDefend2:
      "Füllen Rot und Grün die Zelle nicht ganz, wird der Rest gefoldet. Zellen mit beiden Farben mischen 3-Bet und Call in diesem Verhältnis.",
    howDefend3:
      "Füge eine kopierte Range in die Range-Felder des eigenen Spots (① / ②) ein, um mit dieser Verteidigungs-Range den Postflop selbst zu rechnen.",
    sourceTitle: "Wie ist diese Tabelle entstanden?",
    sourceBody:
      "Wir haben mehrere frei veröffentlichte GTO-Materialien Hand für Hand abgeglichen und daraus " +
      "eine Konsens-Range gebaut; Hände, bei denen die Quellen auseinandergehen, sind als " +
      "gemischte Frequenz markiert. BTN und SB wurden zusätzlich mit den solvergeprüften Ranges " +
      "abgeglichen, die die Lernspots dieser App verwenden.",
    sourceList:
      "Abgeglichene öffentliche Quellen: nlh.poker · Preflop Wizard · HoldemPro · " +
      "The Felt (about-poker.com) · BeyondGTO · ThinkGTO (gelöste BB-vs-SB-Frequenzen) · " +
      "GTO Gecko · RiverOdds (Anker für Verteidigungsfrequenzen) · GTO-Wizard-Blog · FreeBetRange " +
      "(IP-Verteidigung und Squeeze-Prinzipien) · 888poker · Run It Once (Frequenzen vs 3-Bet) + " +
      "unsere eigenen Lern-Ranges (Stand August 2026)",
    phase2: "Weitere Konstellationen und Szenarien kommen nach und nach dazu.",
  },
  // ⚠ 3bet·4bet·5bet·c-bet·GTO·SPR·squeeze는 «영어 그대로» 둔다 — 본체 브리프 §1C의
  // 「강제 영어」 목록이다(「三次加注」는 존재해도 아무도 안 읽는다). 반대로 동작어
  // (开池·跟注·弃牌·加注)와 스트리트(翻牌·转牌·河牌)는 중국어가 표준이다(§1A·§1B).
  // ⚠ 숫자는 영어와 같은 표기다 — 2.5bb·10~11bb의 «.»를 «,»로 바꾸지 말 것 (§3)
  zh: {
    modeRfi: "开池（RFI）",
    modeDefend: "vs 开池（防守）",
    mode3bet: "vs 3bet（开池之后）",
    mode4bet: "vs 4bet（3bet 之后）",
    intro4bet:
      "你 3bet 之后被 4bet 该怎么办——红色是 5bet（全下），绿色是跟注，其余弃牌。" +
      "这里的频率是在“假设你 3bet 了”的前提下算的，所以你根本不会 3bet 的手牌是空白的。" +
      "基准：6 人桌现金局 100bb，BB 3bet 到 11bb → 4bet 到 24bb；SB 3bet 到 10bb → 4bet 到 22bb。",
    legend5bet: "5bet（all-in）",
    legendCond4bet: "空白 = 这里本来就不 3bet",
    stat5bet: "5bet 比例",
    statContinue4bet: "继续比例（占 3bet 范围）",
    copy5bet: "复制 5bet 范围",
    note4bet:
      "统计是“占你 3bet 范围”的比例。100bb 深度下，5bet 实际上只有全下这一种——" +
      "价值牌以 AA、KK 为主（偶尔只跟注做陷阱），QQ 和 AK 则混着 5bet 和跟注。" +
      "跟注看的不是底池赔率，而是权益实现（equity realization）。" +
      "你没有位置、SPR 又低，所以只留对子和最强的同花手牌；" +
      "但也别全弃——对手的 4bet 范围里混着 A5s、A4s 这类诈唬。",
    how4bet2:
      "红色加绿色没把格子填满，剩下的那部分就是弃牌。两种颜色同时出现，表示按这个比例混着 5bet 和跟注。" +
      "不在 3bet 范围里的手牌，压根碰不到这个局面，所以留空。",
    intro3bet:
      "你开池加注之后被 3bet 该怎么办——红色是 4bet，绿色是跟注，其余弃牌。" +
      "这里的频率是在“假设你开池了”的前提下算的，所以你根本不会开池的手牌是空白的。" +
      "基准：6 人桌现金局 100bb，开池 2.5bb，3bet 大约 10~11bb。",
    legend4bet: "4bet",
    legendCond: "空白 = 这里本来就不开池",
    stat4bet: "4bet 比例",
    statContinue: "继续比例（占开池范围）",
    copy4bet: "复制 4bet 范围",
    note3bet:
      "统计是“占你开池范围”的比例，不是占全部手牌。4bet 的价值牌以 QQ+、AK 为主，" +
      "再掺一点 A5s、A4s 这样的诈唬。跟注这边因为你有位置，可以拿得很宽：" +
      "对子、同花大牌、连牌都能留。",
    squeezeNote:
      "挤压（squeeze）指的是前面已经有人开池、又有人跟注时的 3bet（这里大约 11~12bb）。" +
      "有跟注者在，总的防守范围会比单挑时更窄，3bet 也更偏价值。跟着一起跟注（overcall）" +
      "时，优先选多人底池里能做出坚果牌的同花手牌和连张。",
    how3bet2:
      "红色加绿色没把格子填满，剩下的那部分就是弃牌。两种颜色同时出现，表示按这个比例混着 4bet 和跟注。" +
      "不在开池范围里的手牌，压根碰不到这个局面，所以留空。",
    intro:
      "按位置分的开池范围（RFI）——前面的人全都弃牌时，你该拿哪些牌加注？" +
      "基准是 6 人桌现金局 100bb、开池 2.5bb。格子只填了一部分，表示这手牌用的是混合频率（只在一部分时候开池）。",
    introDefend:
      "别人先开池加注时你该怎么应对——这里列的是最常遇到的几种组合。" +
      "红色是 3bet，绿色是跟注，两色叠起来的高度就是你的防守频率。" +
      "基准：6 人桌现金局 100bb，开池 2.5bb（SB 开池按 3bb）。",
    legendOpen: "开池（100%）",
    legendMixed: "混合频率（填充高度 = 开池 %）",
    legendFold: "弃牌",
    legend3bet: "3bet",
    legendCall: "跟注",
    legendMixedDefend: "填充高度 = 频率（双色格按该比例混合）",
    stat3bet: "3bet 比例",
    statCall: "跟注比例",
    statTotal: "总防守",
    copy3bet: "复制 3bet 范围",
    copyCall: "复制跟注范围",
    sbNote:
      "在 SB 面对 BTN 开池时，你基本上只有“3bet 或弃牌”两条路——你没有位置，" +
      "身后 BB 还没说话，跟注等于同时背上这两个坏处。",
    ipNote:
      "就算你有位置，前位（EP）开池的范围也很强；而且你一跟注，身后还没行动的盲位玩家就可能挤压你。" +
      "所以有位置时的防守反而是窄的，以 3bet 为主，跟注只留给对子和最强的同花手牌。",
    statPercent: "开池比例",
    statCombos: "开池组合数",
    statHands: "开池手牌数",
    statMixed: "混合频率手牌",
    // ⚠ 이 문구는 EquityPage.rangeNote가 «글자 그대로» 인용한다 — 고치면 그쪽도 같이 고칠 것
    copy: "复制范围文本",
    copied: "✓ 已复制",
    sendOop: "① 发送到 OOP 范围",
    sendIp: "② 发送到 IP 范围",
    howTitle: "怎么看",
    how1: "左上到右下的那条对角线是口袋对子；对角线上方（右边）是同花（s），下方（左边）是非同花（o）。",
    how2:
      "混合频率的手牌（格子只填了一部分）不是“每次都开池”，而是只按那个比例开池。" +
      "它们是边缘牌，选哪边 EV 差别都很小。",
    how3:
      "点[① 发送到 OOP 范围]/[② 发送到 IP 范围]，这个范围就会填进自定义牌局的范围输入框——" +
      "翻牌之后的打法你可以自己算算看。",
    howDefend2:
      "红色加绿色没把格子填满，剩下的那部分就是弃牌。两种颜色同时出现的格子，" +
      "表示按该比例混着 3bet 和跟注。",
    howDefend3:
      "把复制好的范围文本粘进自定义牌局的 ①/② 范围输入框，就能用这套防守范围自己算翻牌之后的打法。",
    sourceTitle: "这张表是怎么做出来的？",
    sourceBody:
      "我们把多份公开免费的 GTO 资料逐手对照，做出一份“共识范围”；各家判断不一致的边缘牌，" +
      "则标成混合频率。BTN 和 SB 还多做了一步：拿本应用教学案例用的范围（经求解器验证）又对照了一遍。",
    sourceList:
      "交叉验证用到的公开资料：nlh.poker · Preflop Wizard · HoldemPro · " +
      "The Felt（about-poker.com）· BeyondGTO · ThinkGTO（BB vs SB 的实测频率）· " +
      "GTO Gecko · RiverOdds（防守频率的锚点）· GTO Wizard 博客 · FreeBetRange" +
      "（有位置防守与挤压原则）· 888poker · Run It Once（vs 3bet 频率）+ " +
      "我们自己的教学范围（2026 年 8 月整理）",
    phase2: "防守组合和更多场景会陆续补上。",
  },
  // ⚠ 번체 용어는 본체 브리프 translation-terms-zh-hant.md가 정답지다:
  //   equity realization→勝率實現(번체 포스팅 4회, 權益實現 0회 ─ 간체의 「权益实现 EqR」과 다르다) ·
  //   fold→蓋牌 · offsuit→不同花(§7-C Natural8) · EP→早期位 · nuts→堅果 · cash game→現金桌 ·
  //   blog→部落格 · text→文字 · send→傳送 · copy→複製
  "zh-hant": {
    modeRfi: "開池（RFI）",
    modeDefend: "vs 開池（防守）",
    mode3bet: "vs 3bet（開池之後）",
    mode4bet: "vs 4bet（3bet 之後）",
    intro4bet:
      "你 3bet 之後被 4bet 該怎麼辦——紅色是 5bet（全下），綠色是跟注，其餘蓋牌。" +
      "這裡的頻率是在「假設你 3bet 了」的前提下算的，所以你根本不會 3bet 的手牌是空白的。" +
      "基準：6 人現金桌 100bb，BB 3bet 到 11bb → 4bet 到 24bb；SB 3bet 到 10bb → 4bet 到 22bb。",
    legend5bet: "5bet（all-in）",
    legendCond4bet: "空白 = 這裡本來就不 3bet",
    stat5bet: "5bet 比例",
    statContinue4bet: "繼續比例（佔 3bet 範圍）",
    copy5bet: "複製 5bet 範圍",
    note4bet:
      "統計是「佔你 3bet 範圍」的比例。100bb 深度下，5bet 實際上只有全下這一種——" +
      "價值牌以 AA、KK 為主（偶爾只跟注做陷阱），QQ 和 AK 則混著 5bet 和跟注。" +
      "跟注看的不是底池賠率，而是勝率實現（equity realization）。" +
      "你沒有位置，SPR 又低，所以只留對子和最強的同花手牌；" +
      "但也別全蓋——對手的 4bet 範圍裡混著 A5s、A4s 這類詐唬。",
    how4bet2:
      "紅色加綠色沒把格子填滿，剩下的那部分就是蓋牌。兩種顏色同時出現，表示按這個比例混著 5bet 和跟注。" +
      "不在 3bet 範圍裡的手牌，根本碰不到這個局面，所以留空。",
    intro3bet:
      "你開池加注之後被 3bet 該怎麼辦——紅色是 4bet，綠色是跟注，其餘蓋牌。" +
      "這裡的頻率是在「假設你開池了」的前提下算的，所以你根本不會開池的手牌是空白的。" +
      "基準：6 人現金桌 100bb，開池 2.5bb，3bet 大約 10～11bb。",
    legend4bet: "4bet",
    legendCond: "空白 = 這裡本來就不開池",
    stat4bet: "4bet 比例",
    statContinue: "繼續比例（佔開池範圍）",
    copy4bet: "複製 4bet 範圍",
    note3bet:
      "統計是「佔你開池範圍」的比例，不是佔全部手牌。4bet 的價值牌以 QQ+、AK 為主，" +
      "再摻一點 A5s、A4s 這樣的詐唬。跟注這邊因為你有位置，可以拿得很寬：" +
      "對子、同花百老匯、連張都能留。",
    squeezeNote:
      "擠壓（squeeze）指的是前面已經有人開池，又有人跟注時的 3bet（這裡大約 11～12bb）。" +
      "有跟注者在，總的防守範圍會比單挑時更窄，3bet 也更偏價值。跟著一起跟注（overcall）" +
      "時，優先選多人底池裡能做出堅果的同花手牌和連張。",
    how3bet2:
      "紅色加綠色沒把格子填滿，剩下的那部分就是蓋牌。兩種顏色同時出現，表示按這個比例混著 4bet 和跟注。" +
      "不在開池範圍裡的手牌，根本碰不到這個局面，所以留空。",
    intro:
      "按位置分的開池範圍（RFI）——前面的人全都蓋牌時，你該拿哪些牌加注？" +
      "基準：6 人現金桌 100bb，開池 2.5bb。格子只填了一部分，表示這手牌用的是混合頻率（只在一部分時候開池）。",
    introDefend:
      "別人先開池加注時你該怎麼應對——這裡列的是最常遇到的幾種組合。" +
      "紅色是 3bet，綠色是跟注，兩色疊起來的高度就是你的防守頻率。" +
      "基準：6 人現金桌 100bb，開池 2.5bb（SB 開池按 3bb）。",
    legendOpen: "開池（100%）",
    legendMixed: "混合頻率（填充高度 = 開池 %）",
    legendFold: "蓋牌",
    legend3bet: "3bet",
    legendCall: "跟注",
    legendMixedDefend: "填充高度 = 頻率（雙色格按該比例混合）",
    stat3bet: "3bet 比例",
    statCall: "跟注比例",
    statTotal: "總防守",
    copy3bet: "複製 3bet 範圍",
    copyCall: "複製跟注範圍",
    sbNote:
      "在 SB 面對 BTN 開池時，你基本上只有「3bet 或蓋牌」兩條路——你沒有位置，" +
      "身後 BB 還沒說話，跟注等於同時背上這兩個壞處。",
    ipNote:
      "就算你有位置，早期位（EP）開池的範圍也很強；而且你一跟注，身後還沒行動的盲位玩家就可能擠壓你。" +
      "所以有位置時的防守反而是窄的，以 3bet 為主，跟注只留給對子和最強的同花手牌。",
    statPercent: "開池比例",
    statCombos: "開池組合數",
    statHands: "開池手牌數",
    statMixed: "混合頻率手牌",
    // ⚠ 이 문구는 EquityPage.rangeNote가 «글자 그대로» 인용한다 — 고치면 그쪽도 같이 고칠 것
    copy: "複製範圍文字",
    copied: "✓ 已複製",
    sendOop: "① 填入 OOP 範圍",
    sendIp: "② 填入 IP 範圍",
    howTitle: "怎麼看",
    how1: "左上到右下的那條對角線是口袋對；對角線上方（右邊）是同花（s），下方（左邊）是不同花（o）。",
    how2:
      "混合頻率的手牌（格子只填了一部分）不是「每次都開池」，而是只按那個比例開池。" +
      "它們是邊緣牌，選哪邊 EV 差別都很小。",
    how3:
      "按下[① 填入 OOP 範圍]/[② 填入 IP 範圍]，這個範圍就會填進自訂牌局的範圍輸入框——" +
      "翻牌之後的打法你可以自己算算看。",
    howDefend2:
      "紅色加綠色沒把格子填滿，剩下的那部分就是蓋牌。兩種顏色同時出現的格子，" +
      "表示按該比例混著 3bet 和跟注。",
    howDefend3:
      "把複製好的範圍文字貼進自訂牌局的 ①/② 範圍輸入框，就能用這套防守範圍自己算翻牌之後的打法。",
    sourceTitle: "這張表是怎麼做出來的？",
    sourceBody:
      "我們把多份公開免費的 GTO 資料逐手對照，做出一份「共識範圍」；各家判斷不一致的邊緣牌，" +
      "則標成混合頻率。BTN 和 SB 還多做了一步：又和本應用程式教學案例所用的範圍（經解算器驗證）對照了一遍。",
    sourceList:
      "交叉驗證用到的公開資料：nlh.poker · Preflop Wizard · HoldemPro · " +
      "The Felt（about-poker.com）· BeyondGTO · ThinkGTO（BB vs SB 的實測頻率）· " +
      "GTO Gecko · RiverOdds（防守頻率的錨點）· GTO Wizard 部落格 · FreeBetRange" +
      "（有位置防守與擠壓原則）· 888poker · Run It Once（vs 3bet 頻率）+ " +
      "我們自己的教學範圍（2026 年 8 月整理）",
    phase2: "防守組合和更多場景會陸續補上。",
  },
  fr: {
    modeRfi: "Open (RFI)",
    modeDefend: "vs open (défense)",
    mode3bet: "vs 3-bet (après ton open)",
    mode4bet: "vs 4-bet (après ton 3-bet)",
    // ⚠ 산문의 소수·%는 프랑스식 — 2,5bb · «N %» (U+202F). §13 값 자체는 불변
    intro4bet:
      "Comment réagir quand ton 3-bet se fait 4-bet — rouge = 5-bet (tapis), vert = call, " +
      "tout le reste est un fold. Les fréquences sont conditionnées au fait d'avoir 3-bet, donc " +
      "les mains que tu ne 3-bet jamais restent vides. Cash game 6-max, 100bb ; BB 3-bet à 11bb " +
      "face à un 4-bet de 24bb ; SB 3-bet à 10bb face à 22bb.",
    legend5bet: "5-bet (tapis)",
    legendCond4bet: "Vide = jamais 3-bet au départ",
    stat5bet: "% de 5-bet",
    statContinue4bet: "% de continuation (des 3-bets)",
    copy5bet: "Copier la range de 5-bet",
    note4bet:
      "Les stats sont des parts de ta range de 3-bet. À 100bb, le 5-bet est en pratique " +
      "un tapis — la value se concentre sur AA·KK (avec parfois un call pour piéger), et " +
      "QQ·AK mixent 5-bet et call. Les calls se justifient par la capacité à concrétiser " +
      "son equity, pas par la cote du pot : tu joues hors de position à SPR bas, donc seules " +
      "les paires et les meilleures mains suited continuent — mais ne fold pas tout : " +
      "la range de 4-bet adverse mélange aussi des bluffs comme A5s-A4s.",
    how4bet2:
      "Si le rouge + le vert ne remplissent pas la case, le reste est foldé. Les cases " +
      "bicolores mixent 5-bet et call. Les mains hors de la range de 3-bet ne rencontrent " +
      "jamais ce spot, donc elles restent vides.",
    intro3bet:
      "Comment réagir quand ton open se fait 3-bet — rouge = 4-bet, vert = call, tout le " +
      "reste est un fold. Les fréquences sont conditionnées au fait d'avoir ouvert, donc les " +
      "mains que tu n'ouvres jamais restent vides. Cash game 6-max, 100bb, open 2,5bb, 3-bet d'environ 10-11bb.",
    legend4bet: "4-bet",
    legendCond: "Vide = jamais ouvert au départ",
    stat4bet: "% de 4-bet",
    statContinue: "% de continuation (des opens)",
    copy4bet: "Copier la range de 4-bet",
    note3bet:
      "Les stats sont des parts de ta range d'open, pas de toutes les mains. La value du " +
      "4-bet se concentre sur QQ+/AK, avec quelques bluffs comme A5s-A4s. Avec la position, " +
      "la range de call reste large : paires, broadways suited et connecteurs.",
    squeezeNote:
      "Un squeeze est un 3-bet quand il y a déjà un ouvreur et un caller dans le coup " +
      "(environ 11-12bb ici). Le caller rend la défense totale plus serrée qu'en heads-up " +
      "et pousse le 3-bet vers la value. L'overcall (payer après qu'un joueur a déjà payé " +
      "l'open) favorise les mains suited et connectées qui peuvent faire les nuts en multiway.",
    how3bet2:
      "Si le rouge + le vert ne remplissent pas la case, le reste est foldé. Les cases " +
      "bicolores mixent 4-bet et call. Les mains hors de la range d'open ne rencontrent " +
      "jamais ce spot, donc elles restent vides.",
    intro:
      "Les ranges d'open par position (RFI) — quelles mains relancer quand tout le monde " +
      "a foldé avant toi ? Base : cash game 6-max, 100bb, open 2,5bb. " +
      "Les cases partiellement remplies sont des opens à fréquence mixte.",
    introDefend:
      "Comment réagir quand quelqu'un ouvre avant toi — les configurations les plus " +
      "courantes. Rouge = 3-bet, vert = call, et la hauteur empilée est ta fréquence totale " +
      "de défense. Cash game 6-max, 100bb, open 2,5bb (3bb pour un open de SB).",
    legendOpen: "Open (100 %)",
    legendMixed: "Fréquence mixte (hauteur = % d'open)",
    legendFold: "Fold",
    legend3bet: "3-bet",
    legendCall: "Call",
    legendMixedDefend: "Hauteur = fréquence (cases bicolores = mix)",
    stat3bet: "% de 3-bet",
    statCall: "% de call",
    statTotal: "Défense totale",
    copy3bet: "Copier la range de 3-bet",
    copyCall: "Copier la range de call",
    sbNote:
      "En SB, face à un open du BTN, c'est en gros 3-bet ou fold — tu es hors de position " +
      "avec la BB encore à parler, donc caller te fait cumuler les deux désavantages.",
    ipNote:
      "Même avec la position, une range d'open en early (premières positions) est forte, et caller risque un squeeze " +
      "des blindes encore à parler. La défense en position est donc une range étroite, " +
      "centrée sur le 3-bet, avec des calls surtout limités aux paires et aux meilleures mains suited.",
    statPercent: "% d'open",
    statCombos: "Combos ouverts",
    statHands: "Mains ouvertes",
    statMixed: "Mains mixtes",
    // ⚠ EquityPage.rangeNote가 이 버튼 이름을 «글자까지» 그대로 인용한다
    copy: "Copier la range en texte",
    copied: "✓ Copié",
    // «Range OOP / Range IP» = 사이드바 ①·②와 같은 글자
    sendOop: "① Envoyer vers Range OOP",
    sendIp: "② Envoyer vers Range IP",
    howTitle: "Comment lire ce chart",
    how1: "La diagonale, du coin en haut à gauche au coin en bas à droite, ce sont les paires ; au-dessus de la diagonale, le suited ; en dessous, l'offsuit.",
    how2: "Les mains à fréquence mixte (remplissage partiel) ne sont ouvertes que cette fraction du temps — elles sont limites, donc les deux choix perdent peu d'EV.",
    how3: "Les boutons [Envoyer vers Range] chargent cette range dans l'éditeur du spot personnalisé — essaie de calculer toi-même le jeu postflop.",
    howDefend2:
      "Si le rouge + le vert ne remplissent pas toute la case, le reste est foldé. Les cases bicolores mixent 3-bet et call à ces ratios.",
    howDefend3:
      "Colle une range copiée dans les champs de range du spot personnalisé (① / ②) pour calculer toi-même le jeu postflop avec cette range de défense.",
    sourceTitle: "Comment ce chart a-t-il été construit ?",
    sourceBody:
      "Nous avons recoupé main par main plusieurs ressources GTO publiées librement pour " +
      "construire une range de consensus, en marquant comme fréquences mixtes les mains où " +
      "les sources divergent. BTN et SB ont aussi été comparés aux ranges vérifiées au solver " +
      "des Spots d'étude de cette app.",
    // ⚠ 날짜도 언어다 — fr는 MM/YYYY (브리프 §표기 JJ/MM/AAAA와 같은 결)
    sourceList:
      "Sources publiques recoupées : nlh.poker · Preflop Wizard · HoldemPro · " +
      "The Felt (about-poker.com) · BeyondGTO · ThinkGTO (fréquences résolues BB vs SB) · " +
      "GTO Gecko · RiverOdds (ancres de défense) · blog GTO Wizard · FreeBetRange " +
      "(défense IP & principes de squeeze) · 888poker · Run It Once (fréquences vs 3-bet) " +
      "+ nos propres ranges des Spots d'étude (collecte 08/2026)",
    phase2: "D'autres configurations et scénarios arriveront au fur et à mesure.",
  },
  // 인도네시아어 — 문체는 Anda체(본체 브리프 확정). range·board·open·defend·call·fold·3-bet은
  // 본체 id 코퍼스가 영어 그대로 쓴다(리서치 §2). 접두사+영어 동사는 하이픈(«di-3-bet» — 코퍼스 실사용).
  // ⚠ 모드 라벨은 모바일 390px 폭 제약이 있다(preflop-verify) — fr보다 짧게 잡았다.
  id: {
    modeRfi: "Open (RFI)",
    modeDefend: "vs open (defend)",
    mode3bet: "vs 3-bet (setelah open)",
    mode4bet: "vs 4-bet (setelah 3-bet)",
    // 산문의 소수는 인니식 2,5bb — § 13 값 자체는 불변. % 앞 공백 없음
    intro4bet:
      "Cara merespons saat 3-bet Anda di-4-bet — merah = 5-bet (all-in), hijau = call, " +
      "sisanya fold. Frekuensinya dihitung hanya dari hand yang memang Anda 3-bet, jadi hand yang tidak pernah Anda 3-bet dibiarkan kosong. Cash game 6-max, 100bb; BB 3-bet ke 11bb " +
      "menghadapi 4-bet 24bb; SB 3-bet ke 10bb menghadapi 22bb.",
    legend5bet: "5-bet (all-in)",
    legendCond4bet: "Kosong = tidak pernah 3-bet sejak awal",
    stat5bet: "% 5-bet",
    statContinue4bet: "% lanjut (dari 3-bet)",
    copy5bet: "Salin range 5-bet",
    note4bet:
      "Statistiknya adalah bagian dari range 3-bet Anda. Di 100bb, 5-bet praktis berarti " +
      "all-in — value terpusat di AA·KK (sesekali call untuk menjebak), sedangkan QQ·AK " +
      "mencampur 5-bet dan call. Call dibenarkan oleh kemampuan merealisasikan equity, bukan " +
      "oleh pot odds: Anda bermain out of position dengan SPR rendah, jadi hanya pair dan " +
      "hand suited terbaik yang lanjut — tetapi jangan fold semuanya: range 4-bet lawan juga " +
      "berisi bluff seperti A5s-A4s.",
    how4bet2:
      "Jika merah + hijau tidak memenuhi kotak, sisanya di-fold. Kotak dua warna mencampur " +
      "5-bet dan call. Hand di luar range 3-bet tidak pernah sampai ke spot ini, jadi tetap kosong.",
    intro3bet:
      "Cara merespons saat open Anda di-3-bet — merah = 4-bet, hijau = call, sisanya fold. " +
      "Frekuensinya dihitung hanya dari hand yang memang Anda open, jadi hand yang tidak pernah Anda open dibiarkan kosong. Cash game 6-max, 100bb, open 2,5bb, 3-bet sekitar 10-11bb.",
    legend4bet: "4-bet",
    legendCond: "Kosong = tidak pernah open sejak awal",
    stat4bet: "% 4-bet",
    statContinue: "% lanjut (dari open)",
    copy4bet: "Salin range 4-bet",
    note3bet:
      "Statistiknya adalah bagian dari range open Anda, bukan dari semua hand. Value 4-bet " +
      "terpusat di QQ+/AK, ditambah beberapa bluff seperti A5s-A4s. Dengan posisi, range call " +
      "tetap lebar: pair, broadway suited, dan connector.",
    squeezeNote:
      "Squeeze adalah 3-bet saat sudah ada yang open dan ada yang call (sekitar 11-12bb di sini). " +
      "Adanya caller membuat total defend lebih ketat daripada heads-up dan mendorong 3-bet ke " +
      "arah value. Overcall (call setelah pemain lain sudah call open) lebih cocok untuk hand " +
      "suited dan connected yang bisa jadi nuts di pot multiway.",
    how3bet2:
      "Jika merah + hijau tidak memenuhi kotak, sisanya di-fold. Kotak dua warna mencampur " +
      "4-bet dan call. Hand di luar range open tidak pernah sampai ke spot ini, jadi tetap kosong.",
    intro:
      "Range open per posisi (RFI) — hand mana yang di-raise saat semua orang sudah fold " +
      "sebelum Anda? Asumsi: cash game 6-max, 100bb, open 2,5bb. " +
      "Kotak yang terisi sebagian adalah open dengan frekuensi campuran.",
    introDefend:
      "Cara merespons saat ada yang open sebelum Anda — matchup yang paling umum. " +
      "Merah = 3-bet, hijau = call, dan tinggi isian kotak (merah + hijau) adalah total frekuensi defend Anda. " +
      "Cash game 6-max, 100bb, open 2,5bb (3bb untuk open dari SB).",
    legendOpen: "Open (100%)",
    legendMixed: "Frekuensi campuran (tinggi = % open)",
    legendFold: "Fold",
    legend3bet: "3-bet",
    legendCall: "Call",
    legendMixedDefend: "Tinggi = frekuensi (kotak dua warna = campuran)",
    stat3bet: "% 3-bet",
    statCall: "% call",
    statTotal: "Total defend",
    copy3bet: "Salin range 3-bet",
    copyCall: "Salin range call",
    sbNote:
      "Di SB, menghadapi open dari BTN, pilihannya praktis 3-bet atau fold — Anda out of position " +
      "dan BB masih belum bertindak, jadi call membuat Anda menanggung dua kerugian sekaligus.",
    ipNote:
      "Meski punya posisi, range open dari early position kuat, dan call berisiko kena squeeze " +
      "dari blind yang belum bertindak. Karena itu defend in position adalah range sempit yang " +
      "berpusat pada 3-bet, dengan call terbatas terutama pada pair dan hand suited terbaik.",
    statPercent: "% open",
    statCombos: "Combo di-open",
    statHands: "Hand di-open",
    statMixed: "Hand campuran",
    // ⚠ EquityPage.rangeNote가 이 버튼 이름을 «글자까지» 그대로 인용한다
    copy: "Salin teks range",
    copied: "✓ Tersalin",
    // «Range OOP / Range IP» = 사이드바 ①·②와 같은 글자
    sendOop: "① Kirim ke Range OOP",
    sendIp: "② Kirim ke Range IP",
    howTitle: "Cara membaca chart ini",
    how1: "Diagonal dari kiri atas ke kanan bawah adalah pair; di atas diagonal adalah suited; di bawahnya offsuit.",
    how2: "Hand dengan frekuensi campuran (terisi sebagian) hanya di-open sebagian waktu — hand ini marginal, jadi kedua pilihan hanya kehilangan sedikit EV.",
    how3: "Tombol [Kirim ke Range] memuat range ini ke editor Spot kustom — coba hitung sendiri permainan postflop-nya.",
    howDefend2:
      "Jika merah + hijau tidak memenuhi seluruh kotak, sisanya di-fold. Kotak dua warna mencampur 3-bet dan call dengan rasio tersebut.",
    howDefend3:
      "Tempel range yang disalin ke kolom range Spot kustom (① / ②) untuk menghitung sendiri permainan postflop dengan range defend ini.",
    sourceTitle: "Bagaimana chart ini dibuat?",
    sourceBody:
      "Kami membandingkan hand demi hand beberapa sumber GTO yang tersedia untuk umum untuk membangun range konsensus, lalu menandai hand yang berbeda antarsumber sebagai " +
      "frekuensi campuran. BTN dan SB juga dibandingkan dengan range hasil verifikasi solver " +
      "dari Spot belajar di aplikasi ini.",
    // 날짜도 언어다 — id는 MM/YYYY (브리프 §표기 DD/MM/YYYY와 같은 결)
    sourceList:
      "Sumber publik yang dibandingkan: nlh.poker · Preflop Wizard · HoldemPro · " +
      "The Felt (about-poker.com) · BeyondGTO · ThinkGTO (frekuensi solved BB vs SB) · " +
      "GTO Gecko · RiverOdds (acuan defend) · blog GTO Wizard · FreeBetRange " +
      "(defend IP & prinsip squeeze) · 888poker · Run It Once (frekuensi vs 3-bet) " +
      "+ range Spot belajar kami sendiri (dikumpulkan 08/2026)",
    phase2: "Matchup dan skenario lain akan ditambahkan secara bertahap.",
  },
  ms: {
    // ⚠ 모드 버튼 4개는 390px 폰에서 한 줄로 서야 한다 — id판보다 길게 쓰지 말 것
    modeRfi: "Open (RFI)",
    modeDefend: "vs open (defend)",
    mode3bet: "vs 3-bet (selepas open)",
    mode4bet: "vs 4-bet (selepas 3-bet)",
    // 산문의 소수는 영어식 2.5bb (리서치 §1-2). % 앞 공백 없음
    intro4bet:
      "Cara bertindak balas apabila 3-bet anda di-4-bet — merah = 5-bet (all-in), hijau = call, " +
      "selebihnya fold. Frekuensinya dikira hanya daripada tangan yang memang anda 3-bet, jadi tangan yang tidak pernah anda 3-bet dibiarkan kosong. Cash game 6-max, 100bb; BB 3-bet ke 11bb " +
      "menghadapi 4-bet 24bb; SB 3-bet ke 10bb menghadapi 22bb.",
    legend5bet: "5-bet (all-in)",
    legendCond4bet: "Kosong = tidak pernah 3-bet dari awal",
    stat5bet: "% 5-bet",
    statContinue4bet: "% meneruskan (daripada 3-bet)",
    copy5bet: "Salin range 5-bet",
    note4bet:
      "Statistik ini ialah bahagian daripada range 3-bet anda. Pada 100bb, 5-bet pada dasarnya " +
      "bermakna all-in — value tertumpu pada AA·KK (sekali-sekala call untuk memerangkap), " +
      "manakala QQ·AK mencampurkan 5-bet dengan call. Call ditentukan oleh keupayaan " +
      "merealisasikan equity, bukan oleh pot odds: anda bermain out of position dengan SPR " +
      "rendah, jadi hanya pair dan tangan suited terbaik yang meneruskan — tetapi jangan fold " +
      "semuanya, kerana range 4-bet lawan turut mengandungi bluff seperti A5s-A4s.",
    how4bet2:
      "Jika merah + hijau tidak memenuhi kotak, selebihnya di-fold. Kotak dua warna mencampurkan " +
      "5-bet dengan call. Tangan di luar range 3-bet tidak pernah sampai ke spot ini, jadi ia kekal kosong.",
    intro3bet:
      "Cara bertindak balas apabila open anda di-3-bet — merah = 4-bet, hijau = call, selebihnya fold. " +
      "Frekuensinya dikira hanya daripada tangan yang memang anda open, jadi tangan yang tidak pernah anda open dibiarkan kosong. Cash game 6-max, 100bb, open 2.5bb, 3-bet sekitar 10-11bb.",
    legend4bet: "4-bet",
    legendCond: "Kosong = tidak pernah open dari awal",
    stat4bet: "% 4-bet",
    statContinue: "% meneruskan (daripada open)",
    copy4bet: "Salin range 4-bet",
    note3bet:
      "Statistik ini ialah bahagian daripada range open anda, bukan daripada semua tangan. Value " +
      "4-bet tertumpu pada QQ+/AK, ditambah sedikit bluff seperti A5s-A4s. Dengan posisi, range " +
      "call kekal luas: pair, broadway suited, dan connector.",
    squeezeNote:
      "Squeeze ialah 3-bet apabila sudah ada yang open dan ada yang call (sekitar 11-12bb di sini). " +
      "Kehadiran caller menjadikan jumlah defend lebih ketat berbanding heads-up dan menolak 3-bet " +
      "ke arah value. Overcall (call selepas pemain lain sudah call open) lebih sesuai untuk tangan " +
      "suited dan connected yang boleh jadi nuts dalam pot multiway.",
    how3bet2:
      "Jika merah + hijau tidak memenuhi kotak, selebihnya di-fold. Kotak dua warna mencampurkan " +
      "4-bet dengan call. Tangan di luar range open tidak pernah sampai ke spot ini, jadi ia kekal kosong.",
    intro:
      "Range open mengikut posisi (RFI) — tangan mana yang patut anda raise apabila semua orang " +
      "sudah fold sebelum anda? Andaian: cash game 6-max, 100bb, open 2.5bb. " +
      "Kotak yang terisi separuh ialah open dengan frekuensi campuran.",
    introDefend:
      "Cara bertindak balas apabila ada yang open sebelum anda — matchup yang paling kerap berlaku. " +
      "Merah = 3-bet, hijau = call, dan tinggi isian kotak (merah + hijau) ialah jumlah frekuensi defend anda. " +
      "Cash game 6-max, 100bb, open 2.5bb (3bb untuk open dari SB).",
    legendOpen: "Open (100%)",
    legendMixed: "Frekuensi campuran (tinggi = % open)",
    legendFold: "Fold",
    legend3bet: "3-bet",
    legendCall: "Call",
    legendMixedDefend: "Tinggi = frekuensi (kotak dua warna = campuran)",
    stat3bet: "% 3-bet",
    statCall: "% call",
    statTotal: "Jumlah defend",
    copy3bet: "Salin range 3-bet",
    copyCall: "Salin range call",
    sbNote:
      "Di SB, menghadapi open dari BTN, pilihannya pada dasarnya 3-bet atau fold — anda out of " +
      "position dan BB masih belum bertindak, jadi call membuatkan anda menanggung dua kelemahan sekali gus.",
    ipNote:
      "Walaupun anda ada posisi, range open dari early position memang kuat, dan call berisiko kena " +
      "squeeze oleh blind yang belum bertindak. Sebab itu defend in position ialah range sempit " +
      "yang berpaksikan 3-bet, dengan call terhad terutamanya kepada pair dan tangan suited terbaik.",
    statPercent: "% open",
    statCombos: "Combo di-open",
    statHands: "Tangan di-open",
    statMixed: "Tangan campuran",
    // ⚠ EquityPage.rangeNote가 이 버튼 이름을 «글자까지» 그대로 인용한다
    copy: "Salin teks range",
    copied: "✓ Disalin",
    // «Range OOP / Range IP» = 사이드바 ①·②와 같은 글자
    sendOop: "① Hantar ke Range OOP",
    sendIp: "② Hantar ke Range IP",
    howTitle: "Cara membaca carta ini",
    how1: "Garis pepenjuru dari kiri atas ke kanan bawah ialah pair; di atas pepenjuru ialah suited; di bawahnya offsuit.",
    how2: "Tangan dengan frekuensi campuran (terisi separuh) hanya di-open sebahagian masa — tangan ini marginal, jadi kedua-dua pilihan hanya kehilangan sedikit EV.",
    how3: "Butang [Hantar ke Range] memuatkan range ini ke editor Spot tersuai — cuba kira sendiri permainan postflop-nya.",
    howDefend2:
      "Jika merah + hijau tidak memenuhi seluruh kotak, selebihnya di-fold. Kotak dua warna mencampurkan 3-bet dengan call mengikut nisbah tersebut.",
    howDefend3:
      "Tampal range yang disalin ke ruangan range Spot tersuai (① / ②) untuk mengira sendiri permainan postflop dengan range defend ini.",
    sourceTitle: "Bagaimana carta ini dibina?",
    sourceBody:
      "Kami membandingkan beberapa sumber GTO yang terbuka kepada umum, tangan demi tangan, untuk membina range konsensus, lalu menandakan tangan yang berbeza antara sumber sebagai " +
      "frekuensi campuran. BTN dan SB turut dibandingkan dengan range yang disahkan solver " +
      "daripada Spot belajar dalam aplikasi ini.",
    // 날짜도 언어다 — ms는 DD/MM/YYYY 계열이라 여기서는 MM/YYYY (리서치 §1-2)
    sourceList:
      "Sumber awam yang dibandingkan: nlh.poker · Preflop Wizard · HoldemPro · " +
      "The Felt (about-poker.com) · BeyondGTO · ThinkGTO (frekuensi solved BB vs SB) · " +
      "GTO Gecko · RiverOdds (rujukan defend) · blog GTO Wizard · FreeBetRange " +
      "(defend IP & prinsip squeeze) · 888poker · Run It Once (frekuensi vs 3-bet) " +
      "+ range Spot belajar kami sendiri (dikumpulkan 08/2026)",
    phase2: "Matchup dan senario lain akan ditambah secara berperingkat.",
  },
} as const;

type ModeKey = "rfi" | "defend" | "vs3bet" | "vs4bet";

/**
 * 모드 서술자 — 모드마다 다른 것을 전부 여기 데이터로 모은다.
 * 템플릿에는 `mode === "..."` 분기가 없다. 모드를 추가할 때는 이 배열에 항목 하나를 더한다.
 *  - dual  : 격자가 두 겹(레이즈 빨강 + 콜 초록)인가. false면 단색 한 겹(오픈 빈도).
 *  - single/raise/call : 격자 데이터. dual이면 raise·call, 아니면 single을 쓴다.
 *  - testid: 검증 스크립트(preflop-verify.js)가 잡는 지점 — 바꾸면 검증이 깨진다.
 */
type ChartMode = {
  key: ModeKey;
  label: string;
  intro: string;
  dual: boolean;
  tabs: {
    key: string;
    label: string;
    percent: string;
    active: boolean;
    select: () => void;
  }[];
  legendRaise: string;
  legendNote: string;
  single: number[] | null;
  raise: number[] | null;
  call: number[] | null;
  stats: { label: string; value: string; testid?: string }[];
  note: string;
  actions: {
    key: string;
    label: string;
    cls: string;
    disabled: boolean;
    run: () => void;
  }[];
  how: string[];
};

export default defineComponent({
  setup() {
    const store = useStore();
    const L = computed(() => M[i18n.locale]);

    // npokers 빌드의 설치 배너 «써봤다» 조건 (트레이너 빌드에서는 아무 일도 안 한다)
    noteToolUsed();

    const mode = ref<ModeKey>("rfi");
    const selected = ref<Position>("UTG");
    const selectedScenario = ref<ScenarioId>("bb-vs-btn");
    const selectedVs3bet = ref<Vs3BetId>("btn-vs-bb-3bet");
    const selectedVs4bet = ref<Vs4BetId>("bb-vs-btn-4bet");
    const copied = ref(false);
    const copiedAction = ref<"" | "threeBet" | "fourBet" | "fiveBet" | "call">("");

    const grid = computed(() => gridFor(selected.value));
    const stats = computed(() => statsFor(selected.value));
    const defendGrids = computed(() => defendGridsFor(selectedScenario.value));
    const defendStats = computed(() => defendStatsFor(selectedScenario.value));
    const vs3Grids = computed(() => vs3betGridsFor(selectedVs3bet.value));
    const vs3betStats = computed(() => vs3betStatsFor(selectedVs3bet.value));
    const vs4Grids = computed(() => vs4betGridsFor(selectedVs4bet.value));
    const vs4betStats = computed(() => vs4betStatsFor(selectedVs4bet.value));

    const percentOf = (pos: Position) => statsFor(pos).percent.toFixed(1);
    const defendPercentOf = (id: ScenarioId) =>
      defendStatsFor(id).totalPercent.toFixed(1);
    const vs3betPercentOf = (id: Vs3BetId) =>
      vs3betStatsFor(id).continuePercent.toFixed(1);
    const vs4betPercentOf = (id: Vs4BetId) =>
      vs4betStatsFor(id).continuePercent.toFixed(1);

    // IP 수비 조합(BTN·CO가 히어로) — 3벳 중심으로 좁은 이유를 안내
    const isIpScenario = computed(
      () =>
        selectedScenario.value.startsWith("btn-") ||
        selectedScenario.value.startsWith("co-")
    );
    const isSqueezeScenario = computed(() =>
      selectedScenario.value.startsWith("sq-")
    );
    // 콜 레인지가 아예 없는 조합(SB 계열) — 복사 버튼 비활성
    const callEmpty = computed(() =>
      defendGrids.value.call.every((f) => f === 0)
    );

    // 수비 모드의 안내문. 원본 템플릿의 v-if 순서를 그대로 유지한다 — 세 조건은 서로
    // 배타적이지만, 리팩터가 «동작 무변경»임을 눈으로 확인할 수 있게 순서를 보존.
    const defendNote = (t: {
      sbNote: string;
      squeezeNote: string;
      ipNote: string;
    }) => {
      if (selectedScenario.value === "sb-vs-btn") return t.sbNote;
      if (isSqueezeScenario.value) return t.squeezeNote;
      if (isIpScenario.value) return t.ipNote;
      return "";
    };

    const writeClipboard = async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // clipboard API를 못 쓰는 환경 폴백
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
    };

    const copyRange = async () => {
      await writeClipboard(rangeTextFor(selected.value));
      copied.value = true;
      setTimeout(() => (copied.value = false), 1500);
    };

    const copyDefend = async (action: "threeBet" | "call") => {
      await writeClipboard(defendRangeTextFor(selectedScenario.value, action));
      copiedAction.value = action;
      setTimeout(() => (copiedAction.value = ""), 1500);
    };

    const copyVs3bet = async (action: "fourBet" | "call") => {
      await writeClipboard(vs3betRangeTextFor(selectedVs3bet.value, action));
      copiedAction.value = action;
      setTimeout(() => (copiedAction.value = ""), 1500);
    };

    const copyVs4bet = async (action: "fiveBet" | "call") => {
      await writeClipboard(vs4betRangeTextFor(selectedVs4bet.value, action));
      copiedAction.value = action;
      setTimeout(() => (copiedAction.value = ""), 1500);
    };

    // 레인지를 커스텀 스팟 에디터로 — RangeEditor가 watch로 받아 적용한다
    const sendToEditor = (player: 0 | 1) => {
      store.pendingRangeText[player] = rangeTextFor(selected.value);
      store.sideView = player === 0 ? "oop-range" : "ip-range";
    };

    const modes = computed<ChartMode[]>(() => {
      const t = L.value;
      const s = stats.value;
      const d = defendStats.value;
      const v = vs3betStats.value;
      const v4 = vs4betStats.value;
      return [
        {
          key: "rfi",
          label: t.modeRfi,
          intro: t.intro,
          dual: false,
          tabs: POSITIONS.map((pos) => ({
            key: pos,
            label: pos,
            percent: percentOf(pos),
            active: selected.value === pos,
            select: () => (selected.value = pos),
          })),
          legendRaise: "",
          legendNote: "",
          single: grid.value,
          raise: null,
          call: null,
          stats: [
            {
              label: t.statPercent,
              value: `${percentOf(selected.value)}%`,
              testid: "preflop-percent",
            },
            { label: t.statCombos, value: `${Math.round(s.combos)} / 1326` },
            { label: t.statHands, value: `${s.hands} / 169` },
            { label: t.statMixed, value: String(s.mixedHands) },
          ],
          note: "",
          actions: [
            {
              key: "copy",
              label: copied.value ? t.copied : t.copy,
              cls: "button-base button-blue",
              disabled: false,
              run: copyRange,
            },
            {
              key: "sendOop",
              label: t.sendOop,
              cls: "button-base bg-neutral-700 hover:bg-neutral-600",
              disabled: false,
              run: () => sendToEditor(0),
            },
            {
              key: "sendIp",
              label: t.sendIp,
              cls: "button-base bg-neutral-700 hover:bg-neutral-600",
              disabled: false,
              run: () => sendToEditor(1),
            },
          ],
          how: [t.how1, t.how2, t.how3],
        },
        {
          key: "defend",
          label: t.modeDefend,
          intro: t.introDefend,
          dual: true,
          tabs: SCENARIOS.map((sc) => ({
            key: sc.id,
            label: `${sc.hero} vs ${sc.villain}`,
            percent: defendPercentOf(sc.id),
            active: selectedScenario.value === sc.id,
            select: () => (selectedScenario.value = sc.id),
          })),
          legendRaise: t.legend3bet,
          legendNote: t.legendMixedDefend,
          single: null,
          raise: defendGrids.value.threeBet,
          call: defendGrids.value.call,
          stats: [
            {
              label: t.stat3bet,
              value: `${d.threeBetPercent.toFixed(1)}%`,
              testid: "preflop-3bet",
            },
            { label: t.statCall, value: `${d.callPercent.toFixed(1)}%` },
            {
              label: t.statTotal,
              value: `${d.totalPercent.toFixed(1)}%`,
              testid: "preflop-percent",
            },
            { label: t.statMixed, value: String(d.mixedHands) },
          ],
          note: defendNote(t),
          actions: [
            {
              key: "copy3bet",
              label: copiedAction.value === "threeBet" ? t.copied : t.copy3bet,
              cls: "button-base button-red",
              disabled: false,
              run: () => copyDefend("threeBet"),
            },
            {
              key: "copyCall",
              label: copiedAction.value === "call" ? t.copied : t.copyCall,
              cls: "button-base button-green",
              disabled: callEmpty.value,
              run: () => copyDefend("call"),
            },
          ],
          how: [t.how1, t.howDefend2, t.howDefend3],
        },
        {
          key: "vs3bet",
          label: t.mode3bet,
          intro: t.intro3bet,
          dual: true,
          tabs: VS3BET_SCENARIOS.map((sc) => ({
            key: sc.id,
            label: `${sc.hero} vs ${sc.villain}`,
            percent: vs3betPercentOf(sc.id),
            active: selectedVs3bet.value === sc.id,
            select: () => (selectedVs3bet.value = sc.id),
          })),
          legendRaise: t.legend4bet,
          legendNote: t.legendCond,
          single: null,
          raise: vs3Grids.value.fourBet,
          call: vs3Grids.value.call,
          stats: [
            {
              label: t.stat4bet,
              value: `${v.fourBetPercent.toFixed(1)}%`,
              testid: "preflop-4bet",
            },
            { label: t.statCall, value: `${v.callPercent.toFixed(1)}%` },
            {
              label: t.statContinue,
              value: `${v.continuePercent.toFixed(1)}%`,
              testid: "preflop-continue",
            },
            { label: t.statMixed, value: String(v.mixedHands) },
          ],
          note: t.note3bet,
          actions: [
            {
              key: "copy4bet",
              label: copiedAction.value === "fourBet" ? t.copied : t.copy4bet,
              cls: "button-base button-red",
              disabled: false,
              run: () => copyVs3bet("fourBet"),
            },
            {
              key: "copyCall",
              label: copiedAction.value === "call" ? t.copied : t.copyCall,
              cls: "button-base button-green",
              disabled: false,
              run: () => copyVs3bet("call"),
            },
          ],
          how: [t.how1, t.how3bet2, t.howDefend3],
        },
        {
          key: "vs4bet",
          label: t.mode4bet,
          intro: t.intro4bet,
          dual: true,
          tabs: VS4BET_SCENARIOS.map((sc) => ({
            key: sc.id,
            label: `${sc.hero} vs ${sc.villain}`,
            percent: vs4betPercentOf(sc.id),
            active: selectedVs4bet.value === sc.id,
            select: () => (selectedVs4bet.value = sc.id),
          })),
          legendRaise: t.legend5bet,
          legendNote: t.legendCond4bet,
          single: null,
          raise: vs4Grids.value.fiveBet,
          call: vs4Grids.value.call,
          stats: [
            {
              label: t.stat5bet,
              value: `${v4.fiveBetPercent.toFixed(1)}%`,
              testid: "preflop-5bet",
            },
            { label: t.statCall, value: `${v4.callPercent.toFixed(1)}%` },
            {
              label: t.statContinue4bet,
              value: `${v4.continuePercent.toFixed(1)}%`,
              testid: "preflop-continue",
            },
            { label: t.statMixed, value: String(v4.mixedHands) },
          ],
          note: t.note4bet,
          actions: [
            {
              key: "copy5bet",
              label: copiedAction.value === "fiveBet" ? t.copied : t.copy5bet,
              cls: "button-base button-red",
              disabled: false,
              run: () => copyVs4bet("fiveBet"),
            },
            {
              key: "copyCall",
              label: copiedAction.value === "call" ? t.copied : t.copyCall,
              cls: "button-base button-green",
              disabled: false,
              run: () => copyVs4bet("call"),
            },
          ],
          how: [t.how1, t.how4bet2, t.howDefend3],
        },
      ];
    });

    const active = computed(
      () => modes.value.find((m) => m.key === mode.value) as ChartMode
    );

    // RangeEditor·RangeMiniViewer와 같은 격자 관례
    const cellAt = (row: number, col: number) => 13 * (row - 1) + col - 1;
    const cellFreq = (row: number, col: number) =>
      active.value.single?.[cellAt(row, col)] ?? 0;
    const cellRaise = (row: number, col: number) =>
      active.value.raise?.[cellAt(row, col)] ?? 0;
    const cellCall = (row: number, col: number) =>
      active.value.call?.[cellAt(row, col)] ?? 0;
    const cellActive = (row: number, col: number) =>
      active.value.dual
        ? cellRaise(row, col) + cellCall(row, col) > 0
        : cellFreq(row, col) > 0;

    const cellLabel = (row: number, col: number) => {
      const r1 = 13 - Math.min(row, col);
      const r2 = 13 - Math.max(row, col);
      return ranks[r1] + ranks[r2] + ["s", "", "o"][Math.sign(row - col) + 1];
    };

    const modeStyle = (value: ModeKey) =>
      "px-3 py-1 rounded-lg text-sm font-semibold transition-colors " +
      (mode.value === value
        ? "bg-neutral-700 text-white"
        : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700");

    return {
      yellow500,
      red500,
      green500,
      mode,
      modes,
      active,
      modeStyle,
      cellFreq,
      cellRaise,
      cellCall,
      cellActive,
      cellLabel,
      L,
    };
  },
});
</script>
