<template>
  <div class="max-w-3xl pb-8">
    <!-- 빠른 시작 (교육 예제로 안내하므로 트레이너 빌드 전용) -->
    <div
      v-if="FEATURE_TRAINER"
      class="px-4 py-3.5 rounded-xl bg-emerald-950 border border-emerald-800"
    >
      <div class="font-bold text-emerald-300">
        {{ L.quickTitle }}
      </div>
      <ol class="mt-1.5 ml-5 list-decimal space-y-1 text-sm">
        <li>
          <span class="hidden md:inline">{{ L.quickStep1Desktop }}</span>
          <span class="md:hidden">{{ L.quickStep1Mobile }}</span>
          <button
            class="link-like"
            @click="store.sideView = 'presets'"
          >
            {{ L.quickStep1Btn }}
          </button>
          {{ L.quickStep1After }}
        </li>
        <li>
          {{ L.quickStep2Before }}{{ sentenceGap
          }}<span class="font-semibold text-emerald-300">{{ L.quickStep2Btn }}</span
          ><!-- 위와 같은 이유로 공백 없음 -->{{ L.quickStep2After }}
        </li>
        <li>{{ L.quickStep3 }}</li>
      </ol>
    </div>

    <!-- 용어 4개 -->
    <h3 class="guide-h">{{ L.termsTitle }}</h3>
    <table class="guide-table">
      <tr>
        <td class="term">{{ L.termRange }}</td>
        <td>{{ L.defRange }}</td>
      </tr>
      <tr>
        <td class="term">OOP / IP</td>
        <td>{{ L.defPos }}</td>
      </tr>
      <tr>
        <td class="term">{{ L.termEquity }}</td>
        <td>{{ L.defEquity }}</td>
      </tr>
      <tr>
        <td class="term">EV</td>
        <td>{{ L.defEv }}</td>
      </tr>
    </table>

    <!-- 커스텀 계산 순서 -->
    <h3 class="guide-h">{{ L.customTitleBefore }}<span class="hidden md:inline">{{ L.customTitleDesktop }}</span><span class="md:hidden">{{ L.customTitleMobile }}</span>{{ L.customTitleAfter }}</h3>
    <ol class="guide-steps">
      <li>
        <b>{{ L.step1Bold }}</b>{{ L.step1After }}
        <code>22+,A2s+,KTo+</code>
        <div class="hint">
          {{ L.step1Hint }}
        </div>
        <div class="mt-2 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="text-xs font-semibold text-neutral-300">
            {{ L.exampleHeader }}
          </div>
          <div
            v-for="ex in exampleRanges"
            :key="ex.label"
            class="flex items-center gap-2 mt-1.5"
          >
            <span class="shrink-0 w-24 text-xs font-semibold">{{ ex.label }}</span>
            <code class="flex-grow min-w-0 truncate">{{ ex.text }}</code>
            <button
              class="button-base button-blue shrink-0 !px-2 !py-0.5 text-xs"
              @click="copyRange(ex)"
            >
              {{ copied === ex.label ? L.copiedLabel : L.copyLabel }}
            </button>
          </div>
        </div>
      </li>
      <li>
        <b>{{ L.step3Bold }}</b>{{ L.step3After }}
      </li>
      <li>
        <b>{{ L.step4Bold }}</b>{{ L.step4After }}
        <div class="hint">
          {{ L.step4Hint }}
        </div>
      </li>
      <li>
        <b>{{ L.step5Bold1 }}</b>{{ L.step5Mid }}<b>{{ L.step5Bold2 }}</b>{{ L.step5After }}
        <div class="hint">
          {{ L.step5Hint }}
        </div>
      </li>
    </ol>

    <!-- 결과 화면 읽는 법 -->
    <h3 class="guide-h">{{ L.resultsTitle }}</h3>
    <table class="guide-table">
      <tr>
        <td class="term">{{ L.rTerm1 }}</td>
        <td>{{ L.rDef1 }}</td>
      </tr>
      <tr>
        <td class="term">{{ L.rTerm2 }}</td>
        <td>
          {{ L.rDef2 }}
        </td>
      </tr>
      <tr>
        <td class="term">{{ L.rTerm3 }}</td>
        <td>{{ L.rDef3 }}</td>
      </tr>
      <tr>
        <td class="term">{{ L.rTerm4 }}</td>
        <td>
          {{ L.rDef4 }}
        </td>
      </tr>
      <tr>
        <td class="term">{{ L.rTerm5 }}</td>
        <td>{{ L.rDef5 }}</td>
      </tr>
    </table>

    <!-- GTO 트레이너 -->
    <template v-if="FEATURE_TRAINER">
    <h3 class="guide-h">{{ L.trainerTitle }}</h3>
    <p class="text-sm text-neutral-400 leading-relaxed">
      {{ L.trainerIntroBefore }}
      <button class="link-like" @click="store.sideView = 'trainer'">
        {{ L.trainerBtn }}
      </button
      ><!-- ⚠ 버튼과 뒷문장 사이에 공백을 두지 않는다 — 중국어는 한자끼리 띄우지 않는다.
             공백이 필요한 언어는 trainerIntroAfter «앞»에 직접 넣는다 -->{{ L.trainerIntroAfter }}
    </p>
    <table class="guide-table">
      <tr>
        <td class="term">{{ L.gradTerm }}</td>
        <td>
          {{ L.gradBefore }}<b>{{ L.gradBold }}</b>{{ L.gradAfter }}
        </td>
      </tr>
      <tr>
        <td class="term">{{ L.verdictTerm }}</td>
        <td>
          {{ L.verdictBefore }}<b class="text-neutral-200">{{ L.verdictBold }}</b>{{ L.verdictAfter }}
          <div class="hint">
            {{ L.verdictHint }}
          </div>
        </td>
      </tr>
      <tr>
        <td class="term">{{ L.reviewTerm }}</td>
        <td>
          {{ L.reviewBefore }}<b>{{ L.reviewBold }}</b>{{ L.reviewAfter }}
        </td>
      </tr>
      <tr>
        <td class="term">{{ L.filterTerm }}</td>
        <td>{{ L.filterDef }}</td>
      </tr>
    </table>
    </template>

    <!-- 홈 화면 설치 · 오프라인 -->
    <h3 class="guide-h">{{ L.installTitle }}</h3>
    <p class="text-sm text-neutral-400 leading-relaxed">
      {{ L.install1 }}<b class="text-neutral-200">{{ L.installBold1 }}</b>{{ L.install2 }}<b class="text-neutral-200">{{ L.installBold2 }}</b>{{ L.install3 }}<b class="text-neutral-200">{{ L.installBold3 }}</b>{{ L.install4 }}
    </p>
    <p class="mt-1.5 text-xs text-neutral-500 leading-relaxed">
      {{ L.samsung1 }}<b class="text-neutral-300">{{ L.samsungBold }}</b>{{ L.samsung2 }}
    </p>
    <!-- 오프라인 «학습 데이터»는 트레이너 빌드 전용 (npokers는 앱 자체가 통째로 캐시된다) -->
    <div
      v-if="FEATURE_TRAINER"
      class="mt-2 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm"
    >
      <div class="flex items-center gap-3 flex-wrap">
        <span class="font-semibold text-neutral-200">{{ L.offlineDataLabel }}</span>
        <span v-if="pwa.offlineTotal && pwa.offlineHave >= pwa.offlineTotal" class="text-emerald-300">
          {{ L.offlineSaved }}
        </span>
        <span v-else-if="pwa.offlineSaving" class="text-neutral-400">{{ L.offlineSaving }}</span>
        <span v-else class="text-neutral-400">
          {{ L.offlineNotSaved }} ({{ pwa.offlineHave }}/{{ pwa.offlineTotal || 14 }})
        </span>
        <button
          v-if="!pwa.offlineSaving && !(pwa.offlineTotal && pwa.offlineHave >= pwa.offlineTotal)"
          class="button-base button-blue !px-2 !py-0.5 text-xs"
          @click="saveOffline"
        >
          {{ L.offlineSaveBtn }}
        </button>
      </div>
      <div class="mt-1 text-xs text-neutral-500">
        {{ L.offlineFootnote }}
      </div>
    </div>

    <h3 class="guide-h">{{ L.safeTitle }}</h3>
    <p class="text-sm text-neutral-400 leading-relaxed">
      {{ L.safe1 }}<b class="text-neutral-200">{{ L.safeBold }}</b>{{ L.safe2 }}
    </p>
    <table class="guide-table">
      <tr>
        <td class="term">{{ L.permTerm }}</td>
        <td>
          {{ L.permBefore }}<b class="text-neutral-200">{{ L.permBold }}</b>{{ L.permAfter }}
        </td>
      </tr>
      <tr>
        <td class="term">{{ L.airplaneTerm }}</td>
        <td>
          {{ L.airplaneBefore }}<b class="text-neutral-200">{{ L.airplaneBold }}</b>{{ L.airplaneAfter }}
        </td>
      </tr>
      <tr>
        <td class="term">{{ L.openTerm }}</td>
        <td>
          {{ L.openBefore }}<a
            class="link-like"
            href="https://github.com/fire7964coco-prog/holdemmaster-gto-solver"
            target="_blank"
            rel="noopener"
            >GitHub</a
          >{{ L.openAfter }}
        </td>
      </tr>
      <tr>
        <td class="term">{{ L.removeTerm }}</td>
        <td>
          {{ L.removeDef }}
        </td>
      </tr>
    </table>
    <p class="mt-2 text-xs text-neutral-500 leading-relaxed">
      {{ L.samsungNote2 }}
    </p>

    <!-- 추천 공부법 -->
    <h3 class="guide-h">{{ L.studyTitle }}</h3>
    <ol class="guide-steps">
      <li v-if="FEATURE_TRAINER">{{ L.study1 }}</li>
      <li>{{ L.study2 }}</li>
      <li v-if="FEATURE_TRAINER">
        {{ L.study3 }}
      </li>
      <li>{{ L.study4 }}</li>
      <li>{{ L.study5 }}</li>
    </ol>

    <!-- 트러블슈팅 -->
    <h3 class="guide-h">{{ L.troubleTitle }}</h3>
    <table class="guide-table">
      <tr><td class="term">{{ L.tTerm1 }}</td><td>{{ L.tDef1 }}</td></tr>
      <tr><td class="term">{{ L.tTerm2 }}</td><td>{{ L.tDef2 }}</td></tr>
      <tr><td class="term">{{ L.tTerm3 }}</td><td>{{ L.tDef3 }}</td></tr>
      <tr><td class="term">{{ L.tTerm4 }}</td><td>{{ L.tDef4 }}</td></tr>
      <tr><td class="term">{{ L.tTerm5 }}</td><td>{{ L.tDef5 }}</td></tr>
    </table>

    <!-- 오류 신고 — 지금은 유저 화면의 문제를 알 수 있는 유일한 통로다 -->
    <h3 class="guide-h">{{ L.errTitle }}</h3>
    <p class="text-sm text-neutral-400 leading-relaxed">
      {{ L.err1 }}<b class="text-neutral-200">{{ L.errBold }}</b>{{ L.err2 }}
    </p>
    <div class="mt-2 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm">
      <div class="flex items-center gap-3 flex-wrap">
        <span class="font-semibold text-neutral-200">{{ L.errLoggedLabel }}</span>
        <span :class="errorState.count ? 'text-orange-300' : 'text-neutral-500'">
          {{ L.errCount(errorState.count) }}
        </span>
        <button
          v-if="errorState.count"
          class="button-base button-blue !px-2 !py-0.5 text-xs"
          @click="copyErrors"
        >
          {{ errorsCopied ? L.errCopied : L.errCopyBtn }}
        </button>
        <button
          v-if="errorState.count"
          class="button-base !px-2 !py-0.5 text-xs"
          @click="clearErrors"
        >
          {{ L.errClearBtn }}
        </button>
      </div>
      <div v-if="!errorState.count" class="mt-1 text-xs text-neutral-500">
        {{ L.errNone }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { useStore } from "../store";
import { pwa, saveOffline, checkOfflineStatus } from "../pwa";
// 빌드 2벌 분기 — npokers 빌드에서는 FEATURE_TRAINER=false (webpack alias, src/features/ 참조)
import { FEATURE_TRAINER } from "@features";
import { errorState, errorReportText, clearErrors } from "../errors";
import { i18n } from "../i18n";

const M = {
  ko: {
    quickTitle: "1분 시작 — 처음이라면 이것부터",
    // ⚠ 끝의 공백은 U+00A0 — Vue가 요소 사이 공백을 지워 버튼과 붙는다 (2026-08-20 눈검수)
    quickStep1Desktop: "왼쪽에서 ",
    quickStep1Mobile: "위쪽 탭에서 ",
    quickStep1Btn: "교육 예제",
    quickStep1After: "클릭",
    quickStep2Before: "아무 예제나",
    quickStep2Btn: "[⚡ 결과 바로 보기]",
    quickStep2After: " 클릭 — 결과가 바로 나옵니다",
    quickStep3: '아래 "결과 화면 읽는 법"을 보면서 숫자를 해석해보세요',

    termsTitle: "필수 용어 4개만 알면 됩니다",
    termRange: "레인지",
    defRange:
      '플레이어가 들고 있을 수 있는 핸드의 묶음 (예: "쟤는 AA·KK·AK 중 하나겠지")',
    defPos:
      "먼저 행동하는 쪽(불리) / 나중에 행동하는 쪽(유리). BTN vs BB면 BB가 OOP",
    termEquity: "에퀴티",
    defEquity: "지금 시점의 승률(%)",
    defEv: "기대값 — 이 액션으로 평균 얼마나 따는지. 클수록 좋음",

    customTitleBefore: "커스텀 스팟 계산 — ",
    customTitleDesktop: "사이드바",
    customTitleMobile: "위쪽 탭",
    customTitleAfter: " 번호 ①→⑤ 순서 그대로",
    step1Bold: "① OOP 레인지 / ② IP 레인지",
    step1After: " — 13×13 표를 클릭·드래그로 칠하거나 텍스트로 입력: ",
    step1Hint:
      "22+ = 모든 포켓페어 · A2s+ = A2s~AKs · KTo+ = KTo~KQo. 표에서 대각선=포켓페어, 오른쪽 위=수티드, 왼쪽 아래=오프수트",
    exampleHeader:
      "처음이라면 이 예시를 복사해서 레인지 입력칸에 붙여넣으세요 (BTN vs BB 100bb 표준 — 교육 예제와 같은 레인지)",
    exOopLabel: "OOP (BB 콜러)",
    exIpLabel: "IP (BTN 오픈)",
    copiedLabel: "복사됨!",
    copyLabel: "복사",
    step3Bold: "③ 보드",
    step3After: ' — 플랍 3장을 클릭하거나 "랜덤 플랍"',
    step4Bold: "④ 벳 사이즈 (트리 설정)",
    step4After: " — 처음엔 기본값 그대로. 스타팅 팟·유효 스택만 확인",
    step4Hint:
      "커스텀 계산의 입력값은 임의의 정수 칩 단위입니다. bb로 보려면 10칩=1bb로 입력하세요(예: 팟 55 = 5.5bb). 교육 예제와 트레이너는 이 기준으로 자동 환산해 표시합니다.",
    step5Bold1: "⑤ 계산 실행",
    step5Mid:
      ' — "새 트리 만들기" → 완료되면 "솔버 실행" → "계산 완료!"가 뜨면 상단의 ',
    step5Bold2: "[결과]",
    step5After: " 탭 클릭",
    step5Hint:
      "계산은 내 컴퓨터에서 몇 초~몇 분 걸립니다. 만든 스팟은 ⑤ 화면의 [스팟 공유]로 링크를 복사해 커뮤니티에 질문할 수 있어요",

    resultsTitle: "결과 화면 읽는 법",
    rTerm1: "상단 스트립",
    rDef1:
      "액션 흐름(플랍→벳→콜→턴...)의 장면 선택기. 클릭한 시점의 전략을 보여줌",
    rTerm2: "왼쪽 13×13 매트릭스",
    rDef2:
      '칸=핸드, 칸 속 색 비율=액션 비율. 🟥 벳/레이즈(진할수록 큰 벳) · 🟩 체크/콜 · 꺼진 칸=레인지에 없음. GTO는 같은 핸드도 액션을 "비율로 섞습니다" — 패턴을 읽히지 않기 위해서예요',
    rTerm3: "오른쪽 위 타일",
    rDef3: "레인지 전체 기준 액션 빈도(%)와 콤보 수",
    rTerm4: "오른쪽 중간 분류",
    rDef4:
      '레인지가 보드에 뭘 맞았는지(탑페어·드로우...) — "이 보드가 누구에게 유리한가"를 한눈에',
    rTerm5: "오른쪽 아래 표",
    rDef5: "핸드별 비중·에퀴티·EV·액션% 숫자. 열 제목 클릭=정렬",

    trainerTitle: "GTO 트레이너 — 눈으로 보는 것에서 직접 풀어보는 것으로",
    trainerIntroBefore: "결과 화면을 읽는 게 익숙해졌다면",
    trainerBtn: "GTO 트레이너",
    trainerIntroAfter:
      " 로 넘어가세요. 교육 예제 13개의 결정 지점에서 실제 레인지대로 뽑은 핸드를 받고, 액션을 고르면 채점해줍니다.",
    gradTerm: "채점 방식",
    gradBefore: "정답/오답이 아니라 ",
    gradBold: "EV 손실(bb)",
    gradAfter:
      '로 평가합니다. GTO는 같은 핸드도 여러 액션을 섞기 때문에, "빈도가 낮은 액션"이 곧 틀린 선택은 아닙니다 — 손해가 얼마인지가 기준입니다',
    verdictTerm: "판정 기준",
    verdictBefore: "",
    verdictBold: "팟 대비",
    verdictAfter:
      "로 잽니다 — 팟의 0.35% 이하 = 최적 선택 · 1% 이하 = 허용 가능 · 그 이상 = 다시 볼 스팟. 예를 들어 팟 5.5bb인 싱글레이즈팟은 0.02bb·0.06bb, 팟 22.5bb인 3벳팟은 0.08bb·0.23bb가 경계입니다.",
    verdictHint:
      "같은 0.08bb라도 작은 팟에서는 큰 실수고 큰 팟에서는 사소한 차이입니다. 절대 bb로 재면 3벳팟이 실제보다 나쁘게 보여서 팟 대비로 바꿨습니다(2026-08-15). 경계에는 하한(0.02bb·0.05bb)이 있는데, 계산을 목표 오차 0.5%까지만 수렴시키므로 그보다 작은 차이는 계산 노이즈와 구분되지 않기 때문입니다.",
    reviewTerm: "복습",
    reviewBefore: "손실이 컸던 문제는 [복습] 버튼으로 다시 나옵니다. 기록은 기본적으로 ",
    reviewBold: "이 기기 안에만",
    reviewAfter:
      " 저장됩니다. 홀덤마스터 계정으로 로그인하면 기록을 계정에 보관해 다른 기기에서도 이어서 풀 수 있습니다 — 로그인은 선택이며, 모든 기능은 로그인 없이 쓸 수 있습니다",
    filterTerm: "필터",
    filterDef: "싱글레이즈팟 / 3벳팟 / 블라인드전 중 약한 상황만 골라 연습",

    installTitle: "홈 화면에 설치하고 오프라인에서 공부하기",
    install1:
      "이 솔버는 앱처럼 홈 화면에 설치할 수 있습니다(설치 파일 없음). 크롬·엣지는 주소창 오른쪽의 ",
    installBold1: "설치 아이콘",
    install2: ", 아이폰 사파리는 ",
    installBold2: "공유 → 홈 화면에 추가",
    install3:
      "입니다. 설치하면 교육 예제 13종과 트레이너 문제가 기기에 저장돼 ",
    installBold3: "인터넷이 없는 지하철에서도",
    install4: " 그대로 풀 수 있습니다.",
    samsung1:
      "※ 삼성 인터넷에서 설치하면 「안전하지 않은 앱 차단됨」 경고가 뜹니다. 이 브라우저가 만드는 설치 파일을 구글이 신뢰하지 않아 생기는 문제로, 앱과는 무관합니다. ",
    samsungBold: "크롬으로 열면",
    samsung2:
      " 경고 없이 설치되고, 그대로 설치하려면 경고창의 [세부정보 더보기] → [무시하고 설치]를 누르면 됩니다.",
    offlineDataLabel: "오프라인 학습 데이터",
    offlineSaved: "저장 완료 — 인터넷 없이도 교육 예제·트레이너 사용 가능",
    offlineSaving: "저장 중…",
    offlineNotSaved: "저장 안 됨",
    offlineSaveBtn: "지금 저장 (약 2.3MB)",
    offlineFootnote:
      "커스텀 스팟 «직접 계산»은 오프라인에서 한 번이라도 돌려본 뒤에만 됩니다 — 계산 엔진은 쓸 때 내려받기 때문입니다.",

    safeTitle: "설치해도 안전한가요?",
    safe1:
      "네. 여기서 말하는 «설치»는 프로그램을 내려받아 기기에 까는 것이 아니라, ",
    safeBold: "브라우저 안에서 도는 바로가기를 만드는 것",
    safe2:
      "입니다. 안드로이드에서는 이 주소를 가리키는 얇은 껍데기만 등록되고, 실제 실행은 그대로 브라우저 엔진 안에서 됩니다. 의심스러우시면 아래 네 가지를 직접 확인해 보세요 — 말보다 확인이 빠릅니다.",
    permTerm: "권한을 안 씁니다",
    permBefore:
      "설치할 때 카메라·연락처·문자·위치 같은 권한을 하나도 요구하지 않습니다. 휴대폰 ",
    permBold: "설정 → 앱 정보 → 권한",
    permAfter: "에서 직접 보실 수 있습니다",
    airplaneTerm: "비행기 모드로 확인",
    airplaneBefore: "인터넷을 끄고도 트레이너가 그대로 돌아갑니다. 계산이 ",
    airplaneBold: "기기 안에서 끝난다",
    airplaneAfter: "는 가장 확실한 증거입니다",
    openTerm: "소스가 공개돼 있습니다",
    openBefore: "이 솔버는 AGPL-3.0 오픈소스입니다 (",
    openAfter: ")",
    removeTerm: "깔끔하게 지워집니다",
    removeDef:
      "다른 앱처럼 길게 눌러 삭제하면 끝입니다. 배경에서 도는 것도, 남는 것도 없습니다",
    samsungNote2:
      "※ 삼성 인터넷에서 뜨는 「안전하지 않은 앱 차단됨」 경고는 악성코드 탐지가 아니라, 그 브라우저가 만드는 설치 파일을 구글이 아직 신뢰 목록에 넣지 않아 생기는 문제입니다. 크롬으로 열면 뜨지 않습니다.",

    studyTitle: "추천 공부법",
    study1: "교육 예제 13개를 순서대로 — 시리즈로 이어지는 커리큘럼입니다",
    study2: '"왜 이 핸드는 체크를 섞지?" 궁금하면 상세 표에서 액션별 EV를 비교',
    study3:
      "같은 스팟을 GTO 트레이너로 풀어 몸에 익히기 — 약점 분석이 어느 상황에서 손실이 큰지 알려줍니다",
    study4: "같은 레인지로 보드만 바꿔 비교 (예: A72 vs 974)",
    study5: "실전에서 헷갈렸던 핸드를 그대로 입력해서 복기",

    troubleTitle: "문제가 생기면",
    tTerm1: "트리 만들기 오류",
    tDef1: "보드 3장 + 레인지 2개가 입력됐는지 확인",
    tTerm2: "계산이 느림",
    tDef2: "목표 오차를 0.5%로 올리기",
    tTerm3: "결과 탭이 빈 화면",
    tDef3: '"계산 완료!"가 뜬 뒤에 클릭',
    tTerm4: "메모리 한도 초과",
    tDef4: "16비트 정수 모드 선택, 또는 벳 사이즈 수 줄이기",
    tTerm5: "매트릭스가 회색뿐",
    tDef5: "상대 차례의 스팟을 보는 중 — 상단 스트립에서 다른 장면 클릭",

    errTitle: "고쳐야 할 문제를 발견하셨다면",
    err1: "화면이 깨지거나 계산이 멈추면 이 기기에 오류 내용이 자동으로 기록됩니다. ",
    errBold: "기록은 기기 밖으로 나가지 않습니다",
    err2:
      " — 아래에서 복사해 커뮤니티에 올려주시면 그때 저희가 보게 됩니다. 레인지·학습 기록 같은 내용은 담기지 않고, 오류 메시지와 브라우저 종류만 들어갑니다.",
    errLoggedLabel: "기록된 오류",
    errCount: (n: number) => `${n}건`,
    errCopied: "복사됨",
    errCopyBtn: "오류 내용 복사",
    errClearBtn: "기록 지우기",
    errNone: "아직 기록된 오류가 없습니다.",
    errPrompt: "아래 내용을 복사해 주세요",
  },
  en: {
    quickTitle: "1-minute start — begin here if you're new",
    quickStep1Desktop: "On the left, click ",
    quickStep1Mobile: "In the tabs above, click ",
    quickStep1Btn: "Study Spots",
    quickStep1After: "",
    quickStep2Before: "Open any spot and hit",
    quickStep2Btn: "[⚡ View results]",
    quickStep2After: " — the solution appears immediately",
    quickStep3:
      "Then use “Reading the results screen” below to make sense of the numbers",

    termsTitle: "Four terms are all you need",
    termRange: "Range",
    defRange:
      "The set of hands a player could be holding (e.g., “they've probably got AA, KK, or AK”)",
    defPos:
      "Out of position (acts first — a disadvantage) / in position (acts last — an advantage). In BTN vs BB, the BB is OOP",
    termEquity: "Equity",
    defEquity: "Your share of the pot if you were all in right now — win% plus half of the ties",
    defEv: "Expected value — how much an action wins on average. Bigger is better",

    customTitleBefore: "Solving a custom spot — follow the ",
    customTitleDesktop: "sidebar",
    customTitleMobile: "tab",
    customTitleAfter: " numbers ① → ⑤ in order",
    step1Bold: "① OOP Range / ② IP Range",
    step1After:
      " — paint the 13×13 grid by clicking and dragging, or type it as text: ",
    step1Hint:
      "22+ = every pocket pair · A2s+ = A2s through AKs · KTo+ = KTo through KQo. On the grid: diagonal = pocket pairs, upper right = suited, lower left = offsuit",
    exampleHeader:
      "New here? Copy these and paste them into the range inputs (standard BTN vs BB 100bb — the same ranges the Study Spots use)",
    exOopLabel: "OOP (BB Caller)",
    exIpLabel: "IP (BTN Opener)",
    copiedLabel: "Copied!",
    copyLabel: "Copy",
    step3Bold: "③ Board",
    step3After: " — click three flop cards, or hit “Random Flop”",
    step4Bold: "④ Bet Sizes (Tree Settings)",
    step4After:
      " — leave the defaults at first. Just check the starting pot and effective stack",
    step4Hint:
      "Custom-spot inputs are in arbitrary integer chips. To think in bb, use 10 chips = 1bb (e.g., pot 55 = 5.5bb). The Study Spots and Trainer convert on this scale automatically.",
    step5Bold1: "⑤ Run Solver",
    step5Mid:
      " — hit “Build Tree”, then “Run Solver” when it finishes. Once “Solver finished!” appears, open the ",
    step5Bold2: "[Results]",
    step5After: " tab at the top",
    step5Hint:
      "Solving runs on your own machine and takes a few seconds to a few minutes. Use [Share Spot] on screen ⑤ to copy a link to your spot and ask about it in the community",

    resultsTitle: "Reading the results screen",
    rTerm1: "Top strip",
    rDef1:
      "A scene picker for the action line (flop → bet → call → turn…). Click a node to see the strategy at that point",
    rTerm2: "13×13 matrix (left)",
    rDef2:
      "Each cell is a hand; the color split inside it shows action frequencies. 🟥 bet/raise (darker = bigger bet) · 🟩 check/call · dimmed cell = not in the range. GTO plays the same hand as a mixed strategy — splitting actions by frequency so your pattern can't be read",
    rTerm3: "Tiles (top right)",
    rDef3: "Action frequencies (%) and combo counts across the whole range",
    rTerm4: "Hand categories (middle right)",
    rDef4:
      "How each range connects with the board (top pair, draws…) — a quick read on who this board favors",
    rTerm5: "Table (bottom right)",
    rDef5:
      "Per-hand weight, equity, EV, and action % — click a column header to sort",

    trainerTitle: "GTO Trainer — from watching to playing",
    trainerIntroBefore:
      "Once you're comfortable reading the results screen, move on to the",
    trainerBtn: "GTO Trainer",
    trainerIntroAfter:
      " . At decision points from the 13 Study Spots, you're dealt hands drawn from the actual ranges — pick an action and it grades you.",
    gradTerm: "How grading works",
    gradBefore: "You're graded not right-or-wrong but by ",
    gradBold: "EV loss (bb)",
    gradAfter:
      ". GTO mixes several actions with the same hand, so a low-frequency action isn't automatically a mistake — what matters is how much EV it gives up",
    verdictTerm: "Verdict thresholds",
    verdictBefore: "Measured ",
    verdictBold: "relative to the pot",
    verdictAfter:
      " — up to 0.35% of the pot = Best play · up to 1% = Acceptable · beyond that = Review this spot. For example, in a 5.5bb single raised pot (SRP) the cutoffs are 0.02bb and 0.06bb; in a 22.5bb 3-bet pot they're 0.08bb and 0.23bb.",
    verdictHint:
      "The same 0.08bb is a big mistake in a small pot and a trivial one in a big pot. Grading in absolute bb made 3-bet pots look worse than they are, so we switched to pot-relative grading (2026-08-15). The cutoffs have floors (0.02bb / 0.05bb): solves only converge to a target exploitability of 0.5%, so differences smaller than that can't be distinguished from solver noise.",
    reviewTerm: "Review",
    reviewBefore:
      "Hands where you lost the most EV come back via the [Review] button. By default, your history is stored ",
    reviewBold: "on this device only",
    reviewAfter:
      ". Sign in with a HoldemMaster account to keep it on your account and continue on other devices — signing in is optional, and every feature works without it",
    filterTerm: "Filters",
    filterDef:
      "Drill just your weak areas: single raised pots, 3-bet pots, or blind vs blind",

    installTitle: "Install to your home screen and study offline",
    install1:
      "You can install this solver to your home screen like an app (no installer file). In Chrome or Edge, use the ",
    installBold1: "install icon",
    install2: " to the right of the address bar; in Safari on iPhone, tap ",
    installBold2: "Share → Add to Home Screen",
    install3:
      ". Once installed, the 13 Study Spots and the Trainer drills are stored on your device, so you can keep studying ",
    installBold3: "even on the subway with no internet",
    install4: ".",
    samsung1:
      "* When you install from Samsung Internet, the browser or your device may block it for security reasons. That check comes from the browser, not from this app. ",
    samsungBold: "Open the site in Chrome",
    samsung2:
      " and it installs without the block; if you'd rather continue here, follow the prompts in the dialog.",
    offlineDataLabel: "Offline study data",
    offlineSaved: "Saved — Study Spots and Trainer work without internet",
    offlineSaving: "Saving…",
    offlineNotSaved: "Not saved",
    offlineSaveBtn: "Save now (~2.3MB)",
    offlineFootnote:
      "Custom-spot solving works offline only after you've run it online at least once — the solver engine is downloaded on first use.",

    safeTitle: "Is it safe to install?",
    safe1:
      "Yes. “Installing” here doesn't mean downloading a program onto your device — it means ",
    safeBold: "creating a shortcut that runs inside your browser",
    safe2:
      ". On Android, only a thin wrapper pointing at this address gets registered; everything still runs inside the browser engine. If you're skeptical, check these four things yourself — verifying beats taking our word for it.",
    permTerm: "No permissions used",
    permBefore:
      "Installation asks for zero permissions — no camera, contacts, SMS, or location. See for yourself under ",
    permBold: "Settings → App info → Permissions",
    permAfter: " on your phone",
    airplaneTerm: "Verify with airplane mode",
    airplaneBefore:
      "Turn the internet off and the Trainer keeps working — the clearest proof that the computation ",
    airplaneBold: "happens entirely on your device",
    airplaneAfter: "",
    openTerm: "The source is public",
    openBefore: "This solver is AGPL-3.0 open source (",
    openAfter: ")",
    removeTerm: "Uninstalls cleanly",
    removeDef:
      "Long-press and delete like any other app, and it's gone. Nothing runs in the background, nothing is left behind",
    samsungNote2:
      "* A security block in Samsung Internet is not malware detection — the browser simply doesn't recognize this kind of install package yet. It doesn't appear when you install from Chrome.",

    studyTitle: "Suggested study plan",
    study1:
      "Work through the 13 Study Spots in order — they're a curriculum that builds as a series",
    study2:
      "If you're wondering “why does this hand mix in checks?”, compare per-action EVs in the detail table",
    study3:
      "Drill the same spots in the GTO Trainer to make them stick — the weakness report shows which situations cost you the most EV",
    study4: "Keep the ranges, change only the board, and compare (e.g., A72 vs 974)",
    study5:
      "Recreate hands that confused you in real games and review them here",

    troubleTitle: "Troubleshooting",
    tTerm1: "Tree build error",
    tDef1: "Make sure 3 board cards and both ranges are entered",
    tTerm2: "Solving is slow",
    tDef2: "Raise the target exploitability to 0.5%",
    tTerm3: "Results tab is blank",
    tDef3: "Open it after “Solver finished!” appears",
    tTerm4: "Memory limit exceeded",
    tDef4: "Switch to 16-bit integer mode, or use fewer bet sizes",
    tTerm5: "Matrix is all gray",
    tDef5:
      "You're viewing the opponent's turn to act — pick another scene in the top strip",

    errTitle: "Found something we should fix?",
    err1: "If the screen breaks or a solve freezes, the error details are logged automatically on this device. ",
    errBold: "Logs never leave your device",
    err2:
      " — we only see them if you copy them below and post them in the community. They contain just the error message and browser type — never your ranges or study history.",
    errLoggedLabel: "Logged errors",
    errCount: (n: number) => `${n}`,
    errCopied: "Copied",
    errCopyBtn: "Copy error details",
    errClearBtn: "Clear log",
    errNone: "No errors logged yet.",
    errPrompt: "Please copy the text below",
  },
  ja: {
    quickTitle: "1分スタート — 初めての方はここから",
    quickStep1Desktop: "左側で",
    quickStep1Mobile: "上のタブで",
    quickStep1Btn: "学習スポット",
    quickStep1After: "をクリック",
    quickStep2Before: "スポットを一つ開いて",
    quickStep2Btn: "[⚡ 結果をすぐ見る]",
    quickStep2After: " をクリック — 結果がすぐに表示されます",
    quickStep3:
      "下の「結果画面の読み方」を見ながら数字を解釈してみましょう",

    termsTitle: "必須用語は4つだけ",
    termRange: "レンジ",
    defRange:
      "プレイヤーが持っている可能性のあるハンドの集合（例:「相手はAA・KK・AKのどれかだろう」）",
    defPos:
      "先に行動する側（不利）/後に行動する側（有利）。BTN vs BB では BB が OOP",
    termEquity: "エクイティ",
    defEquity: "今この時点で勝てる確率（%）",
    defEv: "期待値 — このアクションで平均してどれだけ得をするか。大きいほど良い",

    customTitleBefore: "カスタムスポットの計算 — ",
    customTitleDesktop: "サイドバー",
    customTitleMobile: "上のタブ",
    customTitleAfter: "の番号①→⑤の順に進めます",
    step1Bold: "① OOPレンジ / ② IPレンジ",
    step1After:
      " — 13×13の表をクリック・ドラッグで塗るか、テキストで入力: ",
    step1Hint:
      "22+ = すべてのポケットペア・A2s+ = A2s〜AKs・KTo+ = KTo〜KQo。表では対角線=ポケットペア、右上=スーテッド、左下=オフスート",
    exampleHeader:
      "初めての方はこの例をコピーしてレンジ入力欄に貼り付けてください（BTN vs BB 100bb標準 — 学習スポットと同じレンジ）",
    exOopLabel: "OOP（BBコーラー）",
    exIpLabel: "IP（BTNオープン）",
    copiedLabel: "コピーしました",
    copyLabel: "コピー",
    step3Bold: "③ ボード",
    step3After: " — フロップ3枚をクリックするか「ランダムフロップ」",
    step4Bold: "④ ベットサイズ（ツリー設定）",
    step4After:
      " — 最初はデフォルトのままで。スターティングポットと有効スタックだけ確認",
    step4Hint:
      "カスタム計算の入力値は任意の整数チップ単位です。bbで考えるには10チップ=1bbとして入力してください（例: ポット55 = 5.5bb）。学習スポットとトレーナーはこの基準で自動換算して表示します。",
    step5Bold1: "⑤ ソルバーを実行",
    step5Mid:
      " — 「ツリーを作成」→ 完了したら「ソルバーを実行」→「計算が完了しました！」が表示されたら上部の ",
    step5Bold2: "[結果]",
    step5After: " タブをクリック",
    step5Hint:
      "計算はお使いの端末上で行われ、数秒〜数分かかります。作ったスポットは⑤画面の[スポットを共有]でリンクをコピーして、コミュニティで質問できます",

    resultsTitle: "結果画面の読み方",
    rTerm1: "上部ストリップ",
    rDef1:
      "アクションの流れ（フロップ→ベット→コール→ターン…）のシーン選択。クリックした時点の戦略を表示します",
    rTerm2: "左の13×13マトリクス",
    rDef2:
      "マス=ハンド、マスの中の色の比率=アクションの割合。🟥 ベット/レイズ（濃いほど大きなベット）・🟩 チェック/コール・暗いマス=レンジにない。GTOは同じハンドでもアクションを「頻度で混ぜます」— パターンを読まれないためです",
    rTerm3: "右上のタイル",
    rDef3: "レンジ全体でのアクション頻度(%)とコンボ数",
    rTerm4: "右中央の分類パネル",
    rDef4:
      "レンジがボードとどう噛み合っているか（トップペア・ドローなど）—「このボードがどちらに有利か」が一目でわかります",
    rTerm5: "右下の詳細表",
    rDef5:
      "ハンドごとのウェイト・エクイティ・EV・アクション%の数値。列見出しをクリックで並べ替え",

    trainerTitle: "GTOトレーナー — 見るだけから自分で解く段階へ",
    trainerIntroBefore: "結果画面の読み方に慣れてきたら",
    trainerBtn: "GTOトレーナー",
    trainerIntroAfter:
      " に進みましょう。13個の学習スポットの決定ポイントで、実際のレンジから引いたハンドが配られ、アクションを選ぶと採点してくれます。",
    gradTerm: "採点方式",
    gradBefore: "正解/不正解ではなく ",
    gradBold: "EVロス(bb)",
    gradAfter:
      "で評価します。GTOは同じハンドでも複数のアクションを混ぜるため、「頻度の低いアクション」が即ミスというわけではありません — どれだけ損をしたかが基準です",
    verdictTerm: "判定基準",
    verdictBefore: "",
    verdictBold: "ポット比",
    verdictAfter:
      "で測ります — ポットの0.35%以下 = 最適な選択・1%以下 = 許容できる選択・それ以上 = 復習すべきスポット。例えばポット5.5bbのシングルレイズポットでは0.02bb・0.06bb、ポット22.5bbの3ベットポットでは0.08bb・0.23bbが境界です。",
    verdictHint:
      "同じ0.08bbでも、小さいポットでは大きなミス、大きいポットでは些細な差です。絶対bbで測ると3ベットポットが実際より悪く見えるため、ポット比の採点に変更しました(2026-08-15)。境界には下限(0.02bb・0.05bb)があります。計算を目標誤差0.5%までしか収束させていないため、それより小さい差は計算ノイズと区別できないからです。",
    reviewTerm: "復習",
    reviewBefore:
      "EVロスが大きかった問題は[復習]ボタンで再出題されます。記録はデフォルトで ",
    reviewBold: "この端末の中だけに",
    reviewAfter:
      " 保存されます。HoldemMasterアカウントでログインすると記録がアカウントに保管され、他の端末でも続きから解けます — ログインは任意で、すべての機能はログインなしで使えます",
    filterTerm: "フィルター",
    filterDef:
      "シングルレイズポット / 3ベットポット / ブラインド戦から、苦手な状況だけ選んで練習",

    installTitle: "ホーム画面にインストールしてオフラインで学習",
    install1:
      "このソルバーはアプリのようにホーム画面にインストールできます（インストールファイルなし）。Chrome・Edgeではアドレスバー右の ",
    installBold1: "インストールアイコン",
    install2: "、iPhoneのSafariでは ",
    installBold2: "共有 → ホーム画面に追加",
    install3:
      " です。インストールすると13種の学習スポットとトレーナーの問題が端末に保存され、",
    installBold3: "インターネットのない地下鉄でも",
    install4: " そのまま解けます。",
    samsung1:
      "※ Samsung Internetからインストールすると、ブラウザや端末がセキュリティ上の理由でインストールをブロックすることがあります。ブラウザ側の確認であり、アプリ自体の問題ではありません。",
    samsungBold: "Chromeで開けば",
    samsung2:
      " 警告なしでインストールできます。そのまま進める場合は、警告画面の[詳細] → [無視してインストール]を押してください。",
    offlineDataLabel: "オフライン学習データ",
    offlineSaved: "保存完了 — インターネットなしでも学習スポット・トレーナーが使えます",
    offlineSaving: "保存中…",
    offlineNotSaved: "未保存",
    offlineSaveBtn: "今すぐ保存（約2.3MB）",
    offlineFootnote:
      "カスタムスポットの「自分で計算」は、オンラインで一度でも実行した後にのみオフラインで使えます — 計算エンジンは初回使用時にダウンロードされるためです。",

    safeTitle: "インストールしても安全ですか？",
    safe1:
      "はい。ここでいう「インストール」は、プログラムをダウンロードして端末に入れることではなく、",
    safeBold: "ブラウザの中で動くショートカットを作ること",
    safe2:
      "です。Androidではこのアドレスを指す薄いラッパーが登録されるだけで、実際の実行はそのままブラウザエンジンの中で行われます。不安な場合は、以下の4つをご自身で確かめてみてください — 言葉より確認のほうが早いです。",
    permTerm: "権限を使いません",
    permBefore:
      "インストール時にカメラ・連絡先・SMS・位置情報などの権限を一切要求しません。スマートフォンの ",
    permBold: "設定 → アプリ情報 → 権限",
    permAfter: " で直接確認できます",
    airplaneTerm: "機内モードで確認",
    airplaneBefore:
      "インターネットを切ってもトレーナーはそのまま動きます。計算が ",
    airplaneBold: "端末の中で完結している",
    airplaneAfter: " ことの何よりの証拠です",
    openTerm: "ソースが公開されています",
    openBefore: "このソルバーはAGPL-3.0のオープンソースです（",
    openAfter: "）",
    removeTerm: "きれいに削除できます",
    removeDef:
      "他のアプリと同じく長押しして削除すれば終わりです。バックグラウンドで動くものも、残るものもありません",
    samsungNote2:
      "※ Samsung Internetで出る「安全でないアプリをブロックしました」警告はマルウェア検知ではなく、そのブラウザが作るインストールパッケージをGoogleがまだ信頼リストに入れていないために起きる問題です。Chromeからインストールすれば表示されません。",

    studyTitle: "おすすめの学習法",
    study1:
      "13個の学習スポットを順番に — シリーズとして続くカリキュラムです",
    study2:
      "「なぜこのハンドはチェックを混ぜるの？」と気になったら、詳細表でアクションごとのEVを比較",
    study3:
      "同じスポットをGTOトレーナーで解いて体に覚えさせる — 弱点分析が、どの状況でEVロスが大きいかを教えてくれます",
    study4: "同じレンジでボードだけ変えて比較（例: A72 vs 974）",
    study5:
      "実戦で迷ったハンドをそのまま入力して復習",

    troubleTitle: "トラブルシューティング",
    tTerm1: "ツリー作成エラー",
    tDef1: "ボード3枚とレンジ2つが入力されているか確認",
    tTerm2: "計算が遅い",
    tDef2: "目標誤差を0.5%に上げる",
    tTerm3: "結果タブが真っ白",
    tDef3: "「計算が完了しました！」が表示されてからクリック",
    tTerm4: "メモリ上限超過",
    tDef4: "16ビット整数モードを選ぶか、ベットサイズの数を減らす",
    tTerm5: "マトリクスが灰色だけ",
    tDef5:
      "相手の手番のスポットを見ています — 上部ストリップで別のシーンをクリック",

    errTitle: "直すべき問題を見つけたら",
    err1: "画面が崩れたり計算が止まったりすると、この端末にエラー内容が自動的に記録されます。",
    errBold: "記録が端末の外に出ることはありません",
    err2:
      " — 下からコピーしてコミュニティに投稿していただいて、はじめて私たちが確認できます。レンジや学習記録などの内容は含まれず、エラーメッセージとブラウザの種類だけが入ります。",
    errLoggedLabel: "記録されたエラー",
    errCount: (n: number) => `${n}件`,
    errCopied: "コピーしました",
    errCopyBtn: "エラー内容をコピー",
    errClearBtn: "記録を消去",
    errNone: "まだ記録されたエラーはありません。",
    errPrompt: "以下の内容をコピーしてください",
  },
  es: {
    quickTitle: "Empieza en 1 minuto — si eres nuevo, este es tu punto de partida",
    quickStep1Desktop: "A la izquierda, haz clic en ",
    quickStep1Mobile: "En las pestañas de arriba, toca ",
    quickStep1Btn: "Spots de estudio",
    quickStep1After: "",
    quickStep2Before: "Abre cualquier spot y toca",
    quickStep2Btn: "[⚡ Ver resultados]",
    quickStep2After: " — la solución aparece de inmediato",
    quickStep3:
      "Luego usa «Cómo leer la pantalla de resultados» más abajo para interpretar los números",

    termsTitle: "Solo necesitas cuatro términos",
    termRange: "Rango",
    defRange:
      "El conjunto de manos que un jugador podría tener (ej. «seguro trae AA, KK o AK»)",
    defPos:
      "Fuera de posición (actúa primero — desventaja) / en posición (actúa al final — ventaja). En BTN vs BB, la BB está OOP",
    termEquity: "Equity",
    defEquity: "Tu parte del bote si fueras all-in ahora mismo — tu probabilidad de ganar (%)",
    defEv: "Valor esperado — cuánto gana una acción en promedio. Mientras más grande, mejor",

    customTitleBefore: "Resolver un spot personalizado — sigue los números ",
    customTitleDesktop: "de la barra lateral",
    customTitleMobile: "de las pestañas",
    customTitleAfter: " en orden ① → ⑤",
    step1Bold: "① Rango OOP / ② Rango IP",
    step1After:
      " — pinta la cuadrícula 13×13 con clic y arrastre, o escríbelo como texto: ",
    step1Hint:
      "22+ = todos los pares · A2s+ = de A2s a AKs · KTo+ = de KTo a KQo. En la cuadrícula: diagonal = pares, arriba a la derecha = suited, abajo a la izquierda = offsuit",
    exampleHeader:
      "¿Primera vez? Copia estos ejemplos y pégalos en los campos de rango (BTN vs BB 100bb estándar — los mismos rangos de los Spots de estudio)",
    exOopLabel: "OOP (BB caller)",
    exIpLabel: "IP (BTN open-raiser)",
    copiedLabel: "¡Copiado!",
    copyLabel: "Copiar",
    step3Bold: "③ Board",
    step3After: " — haz clic en tres cartas de flop o usa «Flop aleatorio»",
    step4Bold: "④ Bet sizes (ajustes del árbol)",
    step4After:
      " — al principio deja los valores por defecto. Solo revisa el bote inicial y el stack efectivo",
    step4Hint:
      "Los valores del spot personalizado usan fichas enteras arbitrarias. Para pensar en bb, usa 10 fichas = 1bb (ej. bote 55 = 5.5bb). Los Spots de estudio y el Entrenador convierten con esta escala automáticamente.",
    step5Bold1: "⑤ Calcular",
    step5Mid:
      " — presiona «Crear árbol» y luego «Ejecutar solver». Cuando aparezca «¡Cálculo terminado!», abre la pestaña ",
    step5Bold2: "[Resultados]",
    step5After: " de arriba",
    step5Hint:
      "El cálculo corre en tu propia máquina y tarda de unos segundos a unos minutos. Usa [Compartir spot] en la pantalla ⑤ para copiar un enlace a tu spot y preguntar en la comunidad",

    resultsTitle: "Cómo leer la pantalla de resultados",
    rTerm1: "Tira superior",
    rDef1:
      "Un selector de escenas de la línea de acción (flop → bet → call → turn…). Haz clic en un nodo para ver la estrategia en ese punto",
    rTerm2: "Matriz 13×13 (izquierda)",
    rDef2:
      "Cada celda es una mano; la división de colores muestra las frecuencias de acción. 🟥 bet/raise (más oscuro = bet más grande) · 🟩 check/call · celda apagada = fuera del rango. El GTO juega la misma mano como estrategia mixta — reparte las acciones por frecuencia para que no puedan leer tu patrón",
    rTerm3: "Mosaicos (arriba a la derecha)",
    rDef3: "Frecuencias de acción (%) y número de combos de todo el rango",
    rTerm4: "Clasificación (centro derecha)",
    rDef4:
      "Qué tan bien conecta cada rango con el board (top pair, proyectos…) — una lectura rápida de a quién favorece este board",
    rTerm5: "Tabla (abajo a la derecha)",
    rDef5:
      "Peso, equity, EV y % de acción por mano — haz clic en el encabezado de una columna para ordenar",

    trainerTitle: "Entrenador GTO — de mirar a jugar",
    trainerIntroBefore:
      "Cuando ya te sientas cómodo leyendo la pantalla de resultados, pasa al",
    trainerBtn: "Entrenador GTO",
    trainerIntroAfter:
      " . En los puntos de decisión de los 13 Spots de estudio recibes manos sacadas de los rangos reales — eliges una acción y te califica.",
    gradTerm: "Cómo califica",
    gradBefore: "No se califica como correcto/incorrecto sino por ",
    gradBold: "pérdida de EV (bb)",
    gradAfter:
      ". El GTO mezcla varias acciones con la misma mano, así que una acción de baja frecuencia no es automáticamente un error — lo que importa es cuánto EV regala",
    verdictTerm: "Umbrales de veredicto",
    verdictBefore: "Se mide ",
    verdictBold: "en relación al bote",
    verdictAfter:
      " — hasta el 0.35% del bote = Mejor jugada · hasta el 1% = Aceptable · más allá = Repasa este spot. Por ejemplo, en un single raised pot de 5.5bb los umbrales son 0.02bb y 0.06bb; en un bote de 3-bet de 22.5bb son 0.08bb y 0.23bb.",
    verdictHint:
      "Los mismos 0.08bb son un gran error en un bote chico y una diferencia trivial en uno grande. Calificar en bb absolutos hacía que los botes de 3-bet se vieran peor de lo que son, así que cambiamos a la calificación relativa al bote (2026-08-15). Los umbrales tienen un mínimo (0.02bb / 0.05bb): los cálculos solo convergen hasta un error objetivo del 0.5%, y diferencias menores no se distinguen del ruido del solver.",
    reviewTerm: "Repaso",
    reviewBefore:
      "Las manos donde más EV perdiste vuelven con el botón [Repasar]. Por defecto, tu historial se guarda ",
    reviewBold: "solo en este dispositivo",
    reviewAfter:
      ". Inicia sesión con una cuenta de HoldemMaster para guardarlo en tu cuenta y continuar en otros dispositivos — iniciar sesión es opcional y todas las funciones sirven sin hacerlo",
    filterTerm: "Filtros",
    filterDef:
      "Practica solo tus puntos débiles: single raised pots, botes de 3-bet o guerra de ciegas",

    installTitle: "Instálalo en tu pantalla de inicio y estudia offline",
    install1:
      "Puedes instalar este solver en tu pantalla de inicio como una app (sin archivo de instalación). En Chrome o Edge usa el ",
    installBold1: "ícono de instalar",
    install2: " a la derecha de la barra de direcciones; en Safari de iPhone toca ",
    installBold2: "Compartir → Agregar a pantalla de inicio",
    install3:
      ". Una vez instalado, los 13 Spots de estudio y los retos del Entrenador quedan guardados en tu dispositivo, para que puedas seguir estudiando ",
    installBold3: "incluso en el metro sin internet",
    install4: ".",
    samsung1:
      "* Al instalar desde Samsung Internet, el navegador o tu dispositivo pueden bloquear la instalación por seguridad. Es una comprobación del navegador, no un problema de esta app. ",
    samsungBold: "Abre el sitio en Chrome",
    samsung2:
      " y se instala sin advertencia; o, para continuar de todos modos, toca [Más detalles] → [Instalar de todos modos] en el cuadro de advertencia.",
    offlineDataLabel: "Datos de estudio offline",
    offlineSaved: "Guardado — los Spots de estudio y el Entrenador funcionan sin internet",
    offlineSaving: "Guardando…",
    offlineNotSaved: "Sin guardar",
    offlineSaveBtn: "Guardar ahora (~2.3MB)",
    offlineFootnote:
      "El «Resolver tú mismo» del spot personalizado solo funciona sin conexión después de ejecutarlo en línea al menos una vez — el motor de cálculo se descarga en el primer uso.",

    safeTitle: "¿Es seguro instalarlo?",
    safe1:
      "Sí. «Instalar» aquí no significa descargar un programa a tu dispositivo — significa ",
    safeBold: "crear un acceso directo que corre dentro de tu navegador",
    safe2:
      ". En Android solo se registra una capa ligera que apunta a esta dirección; todo sigue corriendo dentro del motor del navegador. Si tienes dudas, comprueba estas cuatro cosas tú mismo — verificar vale más que nuestra palabra.",
    permTerm: "No usa permisos",
    permBefore:
      "La instalación no pide ningún permiso — ni cámara, ni contactos, ni SMS, ni ubicación. Compruébalo tú mismo en ",
    permBold: "Configuración → Información de la app → Permisos",
    permAfter: " de tu teléfono",
    airplaneTerm: "Verifícalo con el modo avión",
    airplaneBefore:
      "Apaga el internet y el Entrenador sigue funcionando — la prueba más clara de que el cálculo ",
    airplaneBold: "ocurre por completo en tu dispositivo",
    airplaneAfter: "",
    openTerm: "El código es público",
    openBefore: "Este solver es open source AGPL-3.0 (",
    openAfter: ")",
    removeTerm: "Se desinstala limpio",
    removeDef:
      "Mantén presionado y elimina como cualquier otra app, y listo. Nada corre en segundo plano, nada queda atrás",
    samsungNote2:
      "* La advertencia de aplicación no segura de Samsung Internet no es detección de malware — Google simplemente aún no agregó los paquetes de instalación de ese navegador a su lista de confianza. No aparece al instalar desde Chrome.",

    studyTitle: "Plan de estudio sugerido",
    study1:
      "Recorre los 13 Spots de estudio en orden — son un plan de estudios que avanza como serie",
    study2:
      "¿Te preguntas «por qué esta mano mezcla checks»? — compara los EV por acción en la tabla de detalle",
    study3:
      "Repite los mismos spots en el Entrenador GTO para fijarlos — el detector de leaks muestra qué situaciones te cuestan más EV",
    study4: "Mantén los rangos, cambia solo el board y compara (ej. A72 vs 974)",
    study5:
      "Recrea las manos que te confundieron en partidas reales y repásalas aquí",

    troubleTitle: "Solución de problemas",
    tTerm1: "Error al crear el árbol",
    tDef1: "Verifica que estén las 3 cartas del board y ambos rangos",
    tTerm2: "El cálculo va lento",
    tDef2: "Sube el error objetivo al 0.5%",
    tTerm3: "La pestaña de resultados está en blanco",
    tDef3: "Ábrela después de que aparezca «¡Cálculo terminado!»",
    tTerm4: "Límite de memoria superado",
    tDef4: "Cambia al modo de enteros de 16 bits o usa menos bet sizes",
    tTerm5: "La matriz está toda gris",
    tDef5:
      "Estás viendo el punto en el que le toca actuar al rival — elige otra escena en la tira superior",

    errTitle: "¿Encontraste algo que debamos corregir?",
    err1: "Si la pantalla se rompe o un cálculo se congela, los detalles del error se registran automáticamente en este dispositivo. ",
    errBold: "Los registros nunca salen de tu dispositivo",
    err2:
      " — solo los vemos si los copias abajo y los publicas en la comunidad. Contienen únicamente el mensaje de error y el tipo de navegador — nunca tus rangos ni tu historial de estudio.",
    errLoggedLabel: "Errores registrados",
    errCount: (n: number) => `${n}`,
    errCopied: "Copiado",
    errCopyBtn: "Copiar detalles del error",
    errClearBtn: "Borrar registro",
    errNone: "Aún no hay errores registrados.",
    errPrompt: "Copia el texto de abajo",
  },
  pt: {
    quickTitle: "Comece em 1 minuto — é a sua primeira vez? Comece por aqui",
    quickStep1Desktop: "À esquerda, clique em ",
    quickStep1Mobile: "Nas abas de cima, toque em ",
    quickStep1Btn: "Spots de estudo",
    quickStep1After: "",
    quickStep2Before: "Abra qualquer spot e use",
    quickStep2Btn: "[⚡ Ver resultados]",
    quickStep2After: " — a solução aparece na hora",
    quickStep3:
      "Depois use “Como ler a tela de resultados” mais abaixo para interpretar os números",

    termsTitle: "Você só precisa de quatro termos",
    termRange: "Range",
    defRange:
      "O conjunto de mãos que um jogador pode ter (ex.: “com certeza ele tem AA, KK ou AK”)",
    defPos:
      "Fora de posição (age primeiro — desvantagem) / em posição (age por último — vantagem). Em BTN vs BB, a BB está OOP",
    termEquity: "Equity",
    defEquity:
      "A sua parte do pote se vocês estivessem all-in agora mesmo — % de vitórias mais metade dos empates",
    defEv: "Valor esperado — quanto uma ação ganha em média. Quanto maior, melhor",

    customTitleBefore: "Resolver um spot personalizado — siga os números ",
    customTitleDesktop: "da barra lateral",
    customTitleMobile: "das abas",
    customTitleAfter: " na ordem ① → ⑤",
    step1Bold: "① Range OOP / ② Range IP",
    step1After:
      " — pinte a grade 13×13 clicando e arrastando, ou escreva como texto: ",
    step1Hint:
      "22+ = todos os pares · A2s+ = de A2s até AKs · KTo+ = de KTo até KQo. Na grade: diagonal = pares, acima à direita = suited, abaixo à esquerda = offsuit",
    exampleHeader:
      "É a sua primeira vez? Copie estes exemplos e cole nos campos de range (padrão BTN vs BB 100bb — os mesmos ranges dos Spots de estudo)",
    exOopLabel: "OOP (BB caller)",
    exIpLabel: "IP (BTN open-raiser)",
    copiedLabel: "Copiado!",
    copyLabel: "Copiar",
    step3Bold: "③ Board",
    step3After: " — clique em três cartas de flop ou use “Flop aleatório”",
    step4Bold: "④ Bet sizes (ajustes da árvore)",
    step4After:
      " — no começo deixe os valores padrão. Confira apenas o pote inicial e o stack efetivo",
    step4Hint:
      "Os valores do spot personalizado usam fichas inteiras arbitrárias. Para raciocinar em bb, use 10 fichas = 1bb (ex.: pote 55 = 5,5bb). Os Spots de estudo e o Treinador convertem com essa escala automaticamente.",
    step5Bold1: "⑤ Calcular",
    step5Mid:
      " — pressione “Criar árvore” e depois “Executar solver”. Quando aparecer “Cálculo concluído!”, abra a aba ",
    step5Bold2: "[Resultados]",
    step5After: " de cima",
    step5Hint:
      "O cálculo roda na sua própria máquina e leva de alguns segundos a alguns minutos. Use [Compartilhar spot] na tela ⑤ para copiar um link do seu spot e perguntar na comunidade",

    resultsTitle: "Como ler a tela de resultados",
    rTerm1: "Faixa superior",
    rDef1:
      "Um seletor de cenas da linha de ação (flop → bet → call → turn…). Clique em um nó para ver a estratégia naquele ponto",
    rTerm2: "Matriz 13×13 (à esquerda)",
    rDef2:
      "Cada célula é uma mão; a divisão de cores mostra as frequências de ação. 🟥 bet/raise (mais escuro = bet maior) · 🟩 check/call · célula apagada = fora do range. O GTO joga a mesma mão como estratégia mista — distribui as ações por frequência para que ninguém leia o seu padrão",
    rTerm3: "Mosaicos (canto superior direito)",
    rDef3: "Frequências de ação (%) e número de combos do range inteiro",
    rTerm4: "Mãos / Draws (centro à direita)",
    rDef4:
      "O quanto cada range conecta com o board (top pair, draws…) — uma leitura rápida de quem este board favorece",
    rTerm5: "Tabela (canto inferior direito)",
    rDef5:
      "Peso, equity, EV e % de ação por mão — clique no cabeçalho de uma coluna para ordenar",

    trainerTitle: "Treinador GTO — de assistir para jogar",
    trainerIntroBefore:
      "Quando já estiver confortável lendo a tela de resultados, passe para o",
    trainerBtn: "Treinador GTO",
    trainerIntroAfter:
      " . Nos pontos de decisão dos 13 Spots de estudo você recebe mãos tiradas dos ranges reais — escolhe uma ação e recebe a sua nota.",
    gradTerm: "Como a nota é dada",
    gradBefore: "Não é uma nota de certo/errado, e sim por ",
    gradBold: "perda de EV (bb)",
    gradAfter:
      ". O GTO mistura várias ações com a mesma mão, então uma ação de baixa frequência não é automaticamente um erro — o que importa é quanto EV você entrega",
    verdictTerm: "Limiares do veredito",
    verdictBefore: "A medida é ",
    verdictBold: "em relação ao pote",
    verdictAfter:
      " — até 0,35% do pote = Melhor jogada · até 1% = Aceitável · acima disso = Revise este spot. Por exemplo, em um single raised pot de 5,5bb os limiares são 0,02bb e 0,06bb; em um pote de 3-bet de 22,5bb são 0,08bb e 0,23bb.",
    verdictHint:
      "Os mesmos 0,08bb são um erro enorme em um pote pequeno e uma diferença irrelevante em um pote grande. Avaliar em bb absolutos fazia os potes de 3-bet parecerem piores do que são, por isso mudamos para a nota relativa ao pote (15/08/2026). Os limiares têm um mínimo (0,02bb / 0,05bb): os cálculos só convergem até um erro objetivo de 0,5%, e diferenças menores não se distinguem do ruído do solver.",
    reviewTerm: "Revisão",
    reviewBefore:
      "As mãos em que você mais perdeu EV voltam pelo botão [Revisar]. Por padrão, o seu histórico é salvo ",
    reviewBold: "somente neste dispositivo",
    reviewAfter:
      ". Faça login com uma conta HoldemMaster para salvá-lo na sua conta e continuar em outros dispositivos — o login é opcional e todos os recursos funcionam sem ele",
    filterTerm: "Filtros",
    filterDef:
      "Pratique só os seus pontos fracos: single raised pots, potes de 3-bet ou blind vs blind",

    installTitle: "Instale na sua tela de início e estude offline",
    install1:
      "Você pode instalar este solver na sua tela de início como um app (sem arquivo de instalação). No Chrome ou no Edge, use o ",
    installBold1: "ícone de instalar",
    install2: " à direita da barra de endereços; no Safari do iPhone, toque em ",
    installBold2: "Compartilhar → Adicionar à Tela de Início",
    install3:
      ". Depois de instalado, os 13 Spots de estudo e os desafios do Treinador ficam salvos no seu dispositivo, para você continuar estudando ",
    installBold3: "até no metrô sem internet",
    install4: ".",
    samsung1:
      "* Ao instalar pelo Samsung Internet, o navegador ou o seu dispositivo podem bloquear a instalação por segurança. É uma verificação do navegador, não um problema deste app. ",
    samsungBold: "Abra o site no Chrome",
    samsung2:
      " e a instalação acontece sem aviso; ou, se preferir continuar aqui, siga as instruções da própria caixa de aviso.",
    offlineDataLabel: "Dados de estudo offline",
    offlineSaved: "Salvo — os Spots de estudo e o Treinador funcionam sem internet",
    offlineSaving: "Salvando…",
    offlineNotSaved: "Não salvo",
    offlineSaveBtn: "Salvar agora (~2,3 MB)",
    offlineFootnote:
      "O “Resolver você mesmo” do spot personalizado só funciona sem conexão depois de ser executado online pelo menos uma vez — o motor de cálculo é baixado no primeiro uso.",

    safeTitle: "É seguro instalar?",
    safe1:
      "Sim. “Instalar” aqui não significa baixar um programa para o seu dispositivo — significa ",
    safeBold: "criar um atalho que roda dentro do seu navegador",
    safe2:
      ". No Android só é registrada uma camada leve que aponta para este endereço; tudo continua rodando dentro do motor do navegador. Se ficar em dúvida, confira estas quatro coisas você mesmo — verificar vale mais do que a nossa palavra.",
    permTerm: "Não usa permissões",
    permBefore:
      "A instalação não pede nenhuma permissão — nem câmera, nem contatos, nem SMS, nem localização. Confira você mesmo em ",
    permBold: "Configurações → Informações do app → Permissões",
    permAfter: " do seu celular",
    airplaneTerm: "Teste com o modo avião",
    airplaneBefore:
      "Desligue a internet e o Treinador continua funcionando — a prova mais clara de que o cálculo ",
    airplaneBold: "acontece inteiramente no seu dispositivo",
    airplaneAfter: "",
    openTerm: "O código é público",
    openBefore: "Este solver é open source AGPL-3.0 (",
    openAfter: ")",
    removeTerm: "Desinstala sem deixar rastro",
    removeDef:
      "Mantenha pressionado e remova como qualquer outro app, e pronto. Nada roda em segundo plano, nada fica para trás",
    samsungNote2:
      "* O aviso de aplicativo não seguro do Samsung Internet não é detecção de malware — o navegador simplesmente ainda não reconhece esse tipo de pacote de instalação. Ele não aparece quando você instala pelo Chrome.",

    studyTitle: "Plano de estudo sugerido",
    study1:
      "Percorra os 13 Spots de estudo em ordem — eles formam um curso que avança como uma série",
    study2:
      "Ficou com a dúvida “por que esta mão mistura checks?” — compare os EV por ação na tabela de detalhes",
    study3:
      "Repita os mesmos spots no Treinador GTO para fixar — o detector de leaks mostra quais situações custam mais EV a você",
    study4: "Mantenha os ranges, mude só o board e compare (ex.: A72 vs 974)",
    study5:
      "Recrie aqui as mãos que deixaram você na dúvida em partidas reais e revise cada uma",

    troubleTitle: "Solução de problemas",
    tTerm1: "Erro ao criar a árvore",
    tDef1: "Confira se as 3 cartas do board e os dois ranges estão preenchidos",
    tTerm2: "O cálculo está lento",
    tDef2: "Aumente o erro objetivo para 0,5%",
    tTerm3: "A aba de resultados está em branco",
    tDef3: "Abra depois que aparecer “Cálculo concluído!”",
    tTerm4: "Limite de memória ultrapassado",
    tDef4: "Mude para o modo de inteiros de 16 bits ou use menos bet sizes",
    tTerm5: "A matriz está toda cinza",
    tDef5:
      "Você está vendo o ponto em que é a vez do vilão agir — escolha outra cena na faixa superior",

    errTitle: "Encontrou algo que devemos corrigir?",
    err1: "Se a tela quebrar ou um cálculo travar, os detalhes do erro são registrados automaticamente neste dispositivo. ",
    errBold: "Os registros nunca saem do seu dispositivo",
    err2:
      " — só os vemos se você copiá-los abaixo e publicá-los na comunidade. Eles contêm apenas a mensagem de erro e o tipo de navegador — nunca os seus ranges nem o seu histórico de estudo.",
    errLoggedLabel: "Erros registrados",
    errCount: (n: number) => `${n}`,
    errCopied: "Copiado",
    errCopyBtn: "Copiar detalhes do erro",
    errClearBtn: "Apagar registro",
    errNone: "Ainda não há erros registrados.",
    errPrompt: "Copie o texto abaixo",
  },
  de: {
    quickTitle: "In 1 Minute startklar – neu hier? Dann fang hier an",
    // ⚠ 뒤의 공백은 U+00A0 — flex 자리라 일반 공백은 잘린다 (ko/en/ja/es/pt와 동일)
    quickStep1Desktop: "Klicke links auf ",
    quickStep1Mobile: "Tippe oben in den Tabs auf ",
    quickStep1Btn: "Lernspots",
    quickStep1After: "",
    quickStep2Before: "Öffne einen beliebigen Spot und drücke auf",
    quickStep2Btn: "[⚡ Ergebnisse ansehen]",
    quickStep2After: " – die Lösung erscheint sofort",
    quickStep3:
      "Danach hilft dir „So liest du den Ergebnisbildschirm“ weiter unten beim Deuten der Zahlen",

    termsTitle: "Vier Begriffe genügen dir",
    termRange: "Range",
    defRange:
      "Die Menge an Händen, die ein Spieler haben kann (z. B. „er hat wahrscheinlich AA, KK oder AK“)",
    defPos:
      "Out of Position (ist zuerst am Zug – Nachteil) / In Position (ist zuletzt am Zug – Vorteil). Bei BTN vs BB ist die BB OOP",
    termEquity: "Equity",
    defEquity:
      "Dein Anteil am Pot, wenn ihr jetzt sofort all-in wärt – Gewinn-% plus die Hälfte der Splits",
    defEv: "Erwartungswert – wie viel eine Aktion im Schnitt einbringt. Je höher, desto besser",

    customTitleBefore: "Einen eigenen Spot rechnen – folge den Nummern ",
    customTitleDesktop: "in der Seitenleiste",
    customTitleMobile: "in den Tabs",
    customTitleAfter: " der Reihe nach ① → ⑤",
    step1Bold: "① OOP-Range / ② IP-Range",
    step1After:
      " – male das 13×13-Raster durch Klicken und Ziehen aus, oder schreib es als Text: ",
    step1Hint:
      "22+ = alle Pocket Pairs · A2s+ = A2s bis AKs · KTo+ = KTo bis KQo. Im Raster: Diagonale = Pocket Pairs, oben rechts = suited, unten links = offsuit",
    exampleHeader:
      "Zum ersten Mal hier? Kopiere diese Beispiele in die Range-Felder (Standard BTN vs BB 100bb – dieselben Ranges wie in den Lernspots)",
    exOopLabel: "OOP (BB Caller)",
    exIpLabel: "IP (BTN Open-Raiser)",
    copiedLabel: "Kopiert!",
    copyLabel: "Kopieren",
    step3Bold: "③ Board",
    step3After: " – klicke drei Flop-Karten an oder nimm „Zufälliger Flop“",
    step4Bold: "④ Bet Sizes (Spielbaum-Einstellungen)",
    step4After:
      " – lass am Anfang die Standardwerte stehen. Schau nur auf den Start-Pot und den effektiven Stack",
    step4Hint:
      "Die Werte im eigenen Spot sind ganze Chips in einer frei wählbaren Einheit. Wenn du in bb denken willst, nimm 10 Chips = 1bb (z. B. Pot 55 = 5,5bb). Die Lernspots und der Trainer rechnen automatisch mit dieser Skala.",
    step5Bold1: "⑤ Berechnen",
    step5Mid:
      " – drücke auf „Spielbaum erstellen“ und danach auf „Solver starten“. Sobald „Berechnung abgeschlossen!“ erscheint, öffne oben den Tab ",
    step5Bold2: "[Ergebnisse]",
    step5After: "",
    step5Hint:
      "Die Berechnung läuft auf deinem eigenen Rechner und dauert ein paar Sekunden bis ein paar Minuten. Mit [🔗 Spot teilen] auf Bildschirm ⑤ kopierst du einen Link zu deinem Spot und kannst in der Community nachfragen",

    resultsTitle: "So liest du den Ergebnisbildschirm",
    rTerm1: "Obere Leiste",
    rDef1:
      "Eine Auswahlleiste für die Action-Line (Flop → Bet → Call → Turn …). Klicke einen Knoten an, um die Strategie an dieser Stelle zu sehen",
    rTerm2: "13×13-Matrix (links)",
    rDef2:
      "Jede Zelle ist eine Hand; die Farbaufteilung zeigt die Aktionsfrequenzen. 🟥 Bet/Raise (dunkler = größere Bet) · 🟩 Check/Call · blasse Zelle = außerhalb der Range. GTO spielt dieselbe Hand als gemischte Strategie – die Aktionen werden nach Frequenz verteilt, damit niemand dein Muster liest",
    rTerm3: "Kacheln (oben rechts)",
    rDef3: "Aktionsfrequenzen (%) und Anzahl der Combos der gesamten Range",
    rTerm4: "Hände / Draws (Mitte rechts)",
    rDef4:
      "Wie stark jede Range das Board trifft (Top Pair, Draws …) – ein schneller Blick darauf, wem dieses Board hilft",
    rTerm5: "Übersicht (unten rechts)",
    rDef5:
      "Gewicht, Equity, EV und Aktions-% je Hand – klicke auf eine Spaltenüberschrift, um zu sortieren",

    trainerTitle: "GTO-Trainer – vom Zuschauen zum Spielen",
    trainerIntroBefore:
      "Wenn du den Ergebnisbildschirm sicher liest, geh weiter zum",
    trainerBtn: "GTO-Trainer",
    trainerIntroAfter:
      " . An den Entscheidungspunkten der 13 Lernspots bekommst du Hände aus den echten Ranges – du wählst eine Aktion und bekommst deine Note.",
    gradTerm: "Wie benotet wird",
    gradBefore: "Es gibt kein Richtig/Falsch, sondern eine Note nach ",
    gradBold: "EV-Verlust (bb)",
    gradAfter:
      ". GTO mischt mit derselben Hand mehrere Aktionen, eine seltene Aktion ist also nicht automatisch ein Fehler – es zählt, wie viel EV du abgibst",
    verdictTerm: "Schwellen für das Urteil",
    verdictBefore: "Gemessen wird ",
    verdictBold: "im Verhältnis zum Pot",
    verdictAfter:
      " – bis 0,35% vom Pot = Beste Wahl · bis 1% = Vertretbar · darüber = Nochmal ansehen. In einem Single Raised Pot von 5,5bb sind das 0,02bb und 0,06bb; in einem 3-Bet-Pot von 22,5bb 0,08bb und 0,23bb.",
    verdictHint:
      "Dieselben 0,08bb sind in einem kleinen Pot ein grober Fehler und in einem großen Pot kaum der Rede wert. Absolute bb ließen 3-Bet-Pots schlechter aussehen, als sie sind, deshalb benoten wir relativ zum Pot (2026-08-15). Die Schwellen haben eine Untergrenze (0,02bb / 0,05bb): Die Berechnung konvergiert nur bis zu einer Zielabweichung von 0,5%, kleinere Unterschiede sind vom Rauschen des Solvers nicht zu trennen.",
    reviewTerm: "Wiederholen",
    reviewBefore:
      "Die Hände, bei denen du am meisten EV verloren hast, holst du dir über [Wiederholen] zurück. Dein Verlauf wird standardmäßig ",
    reviewBold: "nur auf diesem Gerät",
    reviewAfter:
      " gespeichert. Melde dich mit einem HoldemMaster-Konto an, um ihn im Konto zu sichern und auf anderen Geräten weiterzumachen – die Anmeldung ist freiwillig und alle Funktionen laufen auch ohne sie",
    filterTerm: "Filter",
    filterDef:
      "Übe gezielt deine Schwächen: Single Raised Pots, 3-Bet-Pots oder Blind vs Blind",

    installTitle: "Auf dem Startbildschirm installieren und offline lernen",
    install1:
      "Du kannst diesen Solver wie eine App auf deinem Startbildschirm installieren (ohne Installationsdatei). In Chrome oder Edge nimmst du das ",
    installBold1: "Installations-Symbol",
    install2: " rechts in der Adressleiste; in Safari auf dem iPhone tippst du auf ",
    installBold2: "Teilen → Zum Home-Bildschirm",
    install3:
      ". Nach der Installation liegen die 13 Lernspots und die Trainer-Aufgaben auf deinem Gerät, sodass du ",
    installBold3: "auch in der U-Bahn ohne Netz",
    install4: " weiterlernen kannst.",
    samsung1:
      "* Beim Installieren über Samsung Internet kann der Browser oder dein Gerät die Installation aus Sicherheitsgründen blockieren. Das ist eine Sicherheitsabfrage des Browsers, kein Problem dieser App. ",
    samsungBold: "Öffne die Seite in Chrome",
    samsung2:
      ", dann läuft die Installation ohne Warnung; oder folge den Hinweisen im Warnfenster, wenn du hier bleiben willst.",
    offlineDataLabel: "Offline-Lerndaten",
    offlineSaved: "Gespeichert – Lernspots und Trainer laufen ohne Internet",
    offlineSaving: "Wird gespeichert…",
    offlineNotSaved: "Nicht gespeichert",
    offlineSaveBtn: "Jetzt speichern (~2,3 MB)",
    offlineFootnote:
      "Das „Selbst berechnen“ im eigenen Spot läuft erst offline, nachdem du es mindestens einmal online ausgeführt hast – die Rechen-Engine wird beim ersten Mal heruntergeladen.",

    safeTitle: "Ist das Installieren sicher?",
    safe1:
      "Ja. „Installieren“ heißt hier nicht, ein Programm auf dein Gerät zu laden, sondern ",
    safeBold: "eine Verknüpfung anzulegen, die in deinem Browser läuft",
    safe2:
      ". Unter Android wird nur ein schlanker Wrapper registriert, der auf diese Adresse zeigt; alles läuft weiter in der Browser-Engine. Wenn du unsicher bist, sieh dir diese vier Dinge selbst an – nachsehen ist mehr wert als unser Wort.",
    permTerm: "Keine Berechtigungen",
    permBefore:
      "Die Installation verlangt keinerlei Berechtigungen – keine Kamera, keine Kontakte, keine SMS, keinen Standort. Sieh selbst nach unter ",
    permBold: "Einstellungen → App-Info → Berechtigungen",
    permAfter: " auf deinem Handy",
    airplaneTerm: "Test im Flugmodus",
    airplaneBefore:
      "Schalte das Internet ab und der Trainer läuft weiter – der klarste Beweis dafür, dass die Berechnung ",
    airplaneBold: "vollständig auf deinem Gerät passiert",
    airplaneAfter: "",
    openTerm: "Der Code ist offen",
    openBefore: "Dieser Solver ist Open Source unter AGPL-3.0 (",
    openAfter: ")",
    removeTerm: "Restlos deinstallierbar",
    removeDef:
      "Halte das Icon lange gedrückt und entferne es wie jede andere App – fertig. Nichts läuft im Hintergrund, nichts bleibt zurück",
    samsungNote2:
      "* Die Warnung „unsichere App“ von Samsung Internet ist keine Malware-Erkennung – der Browser kennt diese Art Installationspaket schlicht noch nicht. Beim Installieren über Chrome erscheint sie nicht.",

    studyTitle: "Vorschlag für deinen Lernplan",
    study1:
      "Geh die 13 Lernspots der Reihe nach durch – sie sind als Kurs aufgebaut und bauen aufeinander auf",
    study2:
      "Bleibt die Frage „warum mischt diese Hand Checks?“ – vergleiche den EV je Aktion in der Übersicht",
    study3:
      "Wiederhole dieselben Spots im GTO-Trainer, damit es sitzt – die Leak-Analyse zeigt dir, welche Situationen dich am meisten EV kosten",
    study4: "Lass die Ranges stehen, ändere nur das Board und vergleiche (z. B. A72 vs 974)",
    study5:
      "Baue hier die Hände nach, bei denen du im echten Spiel unsicher warst, und geh sie einzeln durch",

    troubleTitle: "Fehlerbehebung",
    tTerm1: "Fehler beim Erstellen des Spielbaums",
    tDef1: "Sieh nach, ob die 3 Board-Karten und beide Ranges gefüllt sind",
    tTerm2: "Die Berechnung ist langsam",
    tDef2: "Setze die Zielabweichung auf 0,5%",
    tTerm3: "Der Ergebnis-Tab ist leer",
    tDef3: "Öffne ihn erst, wenn „Berechnung abgeschlossen!“ erscheint",
    tTerm4: "Speicherlimit überschritten",
    tDef4: "Wechsle in den 16-Bit-Ganzzahl-Modus oder nimm weniger Bet Sizes",
    tTerm5: "Die Matrix ist komplett grau",
    tDef5:
      "Du siehst gerade den Punkt, an dem der Gegner am Zug ist – wähle in der oberen Leiste einen anderen Knoten",

    errTitle: "Etwas gefunden, das wir korrigieren sollten?",
    err1:
      "Wenn die Anzeige nicht mehr stimmt oder eine Berechnung hängt, werden die Fehlerdetails automatisch auf diesem Gerät protokolliert. ",
    errBold: "Die Protokolle verlassen dein Gerät nie",
    err2:
      " – wir sehen sie nur, wenn du sie unten kopierst und in der Community postest. Sie enthalten nur die Fehlermeldung und den Browsertyp – nie deine Ranges oder deinen Lernverlauf.",
    errLoggedLabel: "Protokollierte Fehler",
    errCount: (n: number) => `${n}`,
    errCopied: "Kopiert",
    errCopyBtn: "Fehlerdetails kopieren",
    errClearBtn: "Protokoll löschen",
    errNone: "Bisher wurden keine Fehler protokolliert.",
    errPrompt: "Kopiere den Text unten",
  },
  zh: {
    quickTitle: "一分钟上手——第一次来就看这里",
    // ⚠ 끝의 공백은 U+00A0 — Vue가 요소 사이 일반 공백을 지워 버튼과 붙는다 (ko·en·de와 같다)
    quickStep1Desktop: "在左边点",
    quickStep1Mobile: "在上方标签里点",
    quickStep1Btn: "教学案例",
    quickStep1After: "",
    quickStep2Before: "随便打开一个案例，点",
    quickStep2Btn: "[⚡ 直接看结果]",
    quickStep2After: "——结果马上就出来",
    quickStep3: "照着下面的“结果画面怎么读”，把这些数字看懂",

    termsTitle: "只要弄懂 4 个词就够了",
    termRange: "范围（range）",
    // ⚠ 「一个玩家」(a player 축자직역)도, 「对手」로 좁히는 것도 안 된다 —
    //   바로 다음 단계 ①②가 «네 레인지»를 넣으라고 하기 때문이다 (검토자 A 지적)
    defRange: "某个人在这个局面可能拿着的那一堆手牌，你自己的也算（比如“他大概拿着 AA、KK、AK 里的一个”）",
    defPos: "先行动的一方（吃亏）/后行动的一方（占便宜）。BTN vs BB 的话，BB 是 OOP",
    termEquity: "胜率（equity）",
    // ⚠ equity는 «획득 확률»이 아니다 — 지금 전부 걸었을 때 팟에서 가져가는 «몫»이다.
    //   en·es·pt·de 넷 다 pot share로 쓴다. EquityPage.how1과 글이 맞아야 한다
    defEquity: "现在就全下的话，你能从底池里拿走的份额——获胜% 加上平局的一半",
    defEv: "期望值——这个动作平均能帮你赢多少。越大越好",

    customTitleBefore: "自己算一个牌局——",
    customTitleDesktop: "侧边栏",
    customTitleMobile: "上方标签",
    customTitleAfter: "里的 ①→⑤，照顺序来就行",
    step1Bold: "① OOP 范围 / ② IP 范围",
    step1After: "——在 13×13 的表格里点击、拖动来涂色，也可以直接输入文字：",
    step1Hint:
      "22+ = 所有口袋对子 · A2s+ = A2s~AKs · KTo+ = KTo~KQo。表格里的对角线是口袋对子，右上是同花（s），左下是非同花（o）",
    exampleHeader:
      "第一次用的话，把下面这两段示例复制粘贴到范围输入框里（BTN vs BB 100bb 标准——和教学案例用的是同一套范围）",
    exOopLabel: "OOP（BB 跟注）",
    exIpLabel: "IP（BTN 开池）",
    copiedLabel: "已复制！",
    copyLabel: "复制",
    step3Bold: "③ 公共牌",
    step3After: "——点选翻牌 3 张，或者按“随机翻牌”",
    step4Bold: "④ 下注尺寸（决策树设置）",
    step4After: "——刚开始保持默认就行，只要确认一下起始底池和有效筹码",
    step4Hint:
      "自己算的时候，输入的数值用的是任意整数筹码单位。想按 bb 来看，就用 10 筹码 = 1bb 输入（比如底池 55 就是 5.5bb）。教学案例和训练器会自动按这个标准换算显示。",
    step5Bold1: "⑤ 运行求解器",
    step5Mid:
      "——先点“新建决策树”，建好之后点“运行求解器”，等到出现“计算完成！”，再点上面的",
    step5Bold2: "[结果]",
    step5After: "标签",
    step5Hint:
      "计算是在你自己的电脑上跑的，几秒到几分钟不等。做好的牌局可以在 ⑤ 号画面用[分享牌局]复制链接，拿到社区去提问",

    resultsTitle: "结果画面怎么读",
    rTerm1: "顶部动作条",
    rDef1:
      "整条动作流程（翻牌→下注→跟注→转牌……）的场景选择器。点哪一步，就显示那一刻的策略",
    rTerm2: "左边 13×13 表格",
    rDef2:
      "一格就是一手牌，格子里的颜色比例就是各个动作的比例。🟥 下注/加注 bet·raise（越深表示下得越大）· 🟩 过牌/跟注 check·call · 灰掉的格子表示不在范围里。GTO 对同一手牌也会“按比例混着打”——就是为了不让人看出规律",
    rTerm3: "右上角的方块",
    rDef3: "以整个范围为分母的动作频率（%）和组合数",
    rTerm4: "右侧中间的分类",
    rDef4:
      "你的范围在这个公共牌上打中了什么（顶对 top pair、听牌 draw……）——一眼看出“这个牌面对谁有利”",
    rTerm5: "右下角的表格",
    rDef5: "每手牌的权重、胜率（EQ）、权益实现（EQR）、EV、动作占比。点列标题可以排序",

    trainerTitle: "GTO 训练器——从“看懂”走到“自己做”",
    trainerIntroBefore: "结果画面读顺了，就可以进",
    trainerBtn: "GTO 训练器",
    // ⚠ 앞 요소(버튼)와 사이에 HTML 공백이 들어가 「训练器 。」로 벌어졌다(실측).
    //   전각 마침표를 앞으로 붙이지 말고 문장을 다시 시작한다
    trainerIntroAfter:
      "试试看。它会在 13 个教学案例的决策点上，按真实范围抽一手牌给你，你选完动作它就打分。",
    gradTerm: "怎么打分",
    gradBefore: "它不是判对错，而是按 ",
    gradBold: "EV 损失（bb）",
    gradAfter:
      "来评价。GTO 对同一手牌本来就会混着打好几个动作，所以“频率低的那个动作”并不等于选错了——标准是你亏了多少",
    verdictTerm: "判定标准",
    verdictBefore: "按",
    verdictBold: "占底池的比例",
    verdictAfter:
      "来量——底池的 0.35% 以内 = 最优选择 · 1% 以内 = 可以接受 · 再多 = 该回头复盘的局面。举个例子，5.5bb 的单加注底池（SRP）对应 0.02bb 和 0.06bb，22.5bb 的 3bet 底池对应 0.08bb 和 0.23bb。",
    verdictHint:
      "同样是 0.08bb，在小底池里是大失误，在大底池里只是小差别。用绝对 bb 来量的话，3bet 底池会显得比实际更糟，所以改成了按占底池的比例（2026-08-15）。这两条线各有一个下限：0.02bb 和 0.05bb。计算只收敛到目标可剥削度 0.5%，比这更小的差别已经和计算噪声分不开了。",
    reviewTerm: "复习",
    reviewBefore: "亏得多的题会通过[复习]按钮再出现一次。记录默认",
    reviewBold: "只保存在这台设备上",
    reviewAfter:
      "。用 HoldemMaster 账号登录，记录就会存到账号里，换台设备也能接着做——登录是可选的，所有功能不登录也能用",
    filterTerm: "筛选",
    filterDef: "在单加注底池/3bet 底池/盲位对战里，挑你弱的那类专门练",

    installTitle: "装到主屏幕，离线也能学",
    install1:
      "这个求解器可以像应用一样装到主屏幕上（没有安装包）。在 Chrome 和 Edge 里，点地址栏右边的",
    installBold1: "安装图标",
    install2: "；iPhone 的 Safari 则是点",
    installBold2: "分享 → 添加到主屏幕",
    install3:
      "。装好之后，13 个教学案例和训练器的题目都会存到设备里，",
    installBold3: "在没信号的地铁上",
    install4: "也照样能做。",
    // 三星浏览器 = Samsung Internet의 중국어 정식 명칭
    // ⚠ 창 제목·버튼 이름을 «단정하지 않는다» — 기기와 안드로이드 버전마다 다르다
    //   (Play 保护机制의 「已屏蔽不安全的应用」· 삼성 OneUI 6.0+의 「自动拦截程序」…).
    //   en·de·pt도 같은 이유로 뭉뚱그렸다. 출처 없는 버튼 이름을 대면 없는 버튼을 누르라는 셈이다
    samsung1:
      "※ 用三星浏览器安装时，浏览器或系统可能会以安全为由拦截安装。这是浏览器那边的安全机制，跟应用本身无关。",
    samsungBold: "改用 Chrome 打开",
    samsung2:
      "就不会被拦；想直接在这里装的话，按提示框里的指引选择允许即可。",
    offlineDataLabel: "离线学习数据",
    offlineSaved: "已保存——没网也能用教学案例和训练器",
    offlineSaving: "保存中…",
    offlineNotSaved: "未保存",
    offlineSaveBtn: "现在保存（约 2.3MB）",
    offlineFootnote:
      "自定义牌局自己算（⑤ 运行求解器）得先联网跑过一次才能离线用——计算引擎是用到的时候才下载的。",

    safeTitle: "装了安全吗？",
    safe1: "安全。这里说的“安装”不是把一个程序下载到你设备上，而是",
    safeBold: "做一个在浏览器里跑的快捷方式",
    safe2:
      "。在安卓上，注册的只是一层指向这个网址的薄壳，真正跑起来还是在浏览器引擎里。要是不放心，下面 4 件事你可以自己验一遍——验一次比听我说管用。",
    permTerm: "它不要权限",
    permBefore:
      "安装的时候，相机、通讯录、短信、位置这些权限一个都不要。你可以在手机的",
    permBold: "设置 → 应用信息 → 权限",
    permAfter: "里自己看",
    airplaneTerm: "开飞行模式验一下",
    airplaneBefore: "断网之后训练器照样能跑。这就是",
    airplaneBold: "计算全在你设备里完成",
    airplaneAfter: "的最直接的证据",
    openTerm: "源代码是公开的",
    openBefore: "这个求解器是 AGPL-3.0 开源的（",
    openAfter: "）",
    removeTerm: "删得干干净净",
    removeDef: "跟别的应用一样长按删掉就行。不会在后台跑，也不会留下什么",
    samsungNote2:
      "※ 三星浏览器那条拦截提示并不代表查出了恶意代码，只是因为 Google 还没把这个浏览器生成的安装包列入信任名单。用 Chrome 打开就不会出现。",

    studyTitle: "推荐的学习路线",
    study1: "把 13 个教学案例按顺序过一遍——它们是连成一套的课程",
    study2: "想不通“这手牌为什么要混着过牌？”的时候，就到右下角的[汇总]表里比较各动作的 EV",
    study3:
      "同一个局面再用 GTO 训练器做一遍，把它练成手感——弱点分析会告诉你哪类局面亏得最多",
    study4: "范围不变，只换公共牌来对比（比如 A72 和 974）",
    study5: "把实战里拿不准的那手牌原样输进来复盘",

    troubleTitle: "出问题了怎么办",
    tTerm1: "生成决策树报错",
    tDef1: "检查一下公共牌 3 张和两个范围是不是都填了",
    tTerm2: "算得很慢",
    tDef2: "把目标可剥削度调到 0.5%",
    tTerm3: "结果标签是空白的",
    tDef3: "等出现“计算完成！”之后再点",
    tTerm4: "超出内存上限",
    tDef4: "改用 16 位整数模式，或者少填几个下注尺寸",
    tTerm5: "表格全是灰的",
    tDef5: "你正在看的是对手行动的那一步——到顶部动作条上点别的场景",

    errTitle: "如果你发现了需要修的问题",
    err1: "画面出错或者计算卡住时，错误内容会自动记在这台设备上。",
    errBold: "这些记录不会离开这台设备",
    err2:
      "——你在下面复制出来发到社区，我们才看得到。里面不含范围、学习记录这类内容，只有错误信息和浏览器类型。",
    errLoggedLabel: "已记录的错误",
    errCount: (n: number) => `${n} 条`,
    errCopied: "已复制",
    errCopyBtn: "复制错误内容",
    errClearBtn: "清空记录",
    errNone: "目前还没有记录到错误。",
    errPrompt: "请复制下面的内容",
  },
  // ⚠ 台灣 표기가 대륙과 «단어»부터 다른 자리들:
  //   飞行模式→飛航模式 · 地铁→捷運 · 信号→訊號 · 短信→簡訊 · 地址栏→網址列 ·
  //   链接→連結 · 后台→背景 · 列(column)→欄 · 安装包→安裝檔 · 恶意代码→惡意程式碼 ·
  //   源代码→原始碼 · 标签(tab)→分頁 · 拖动→拖曳 · 默认→預設 · 条(건수)→筆
  "zh-hant": {
    quickTitle: "一分鐘上手——第一次來就看這裡",
    quickStep1Desktop: "在左邊按下",
    quickStep1Mobile: "在上方分頁裡按下",
    quickStep1Btn: "教學案例",
    quickStep1After: "",
    quickStep2Before: "隨便打開一個案例，按下",
    quickStep2Btn: "[⚡ 直接看結果]",
    quickStep2After: "——結果馬上就出來",
    quickStep3: "照著下面的「結果畫面怎麼讀」，把這些數字看懂",

    termsTitle: "只要弄懂 4 個詞就夠了",
    termRange: "範圍（range）",
    // ⚠ 「一個玩家」(a player 축자직역)도, 「對手」로 좁히는 것도 안 된다 —
    //   바로 다음 단계 ①②가 «네 레인지»를 넣으라고 하기 때문이다
    defRange: "某個人在這個局面可能拿著的那一堆手牌，你自己的也算（比如「他大概拿著 AA、KK、AK 裡的一個」）",
    defPos: "先行動的一方（吃虧）/後行動的一方（佔便宜）。BTN vs BB 的話，BB 是 OOP",
    termEquity: "勝率（equity）",
    // ⚠ equity는 «획득 확률»이 아니다 — 지금 전부 걸었을 때 팟에서 가져가는 «몫»이다.
    //   EquityPage.how1과 글이 맞아야 한다
    defEquity: "現在就全下的話，你能從底池裡拿走的份額——獲勝% 加上平手的一半",
    defEv: "期望值——這個動作平均能幫你贏多少。越大越好",

    customTitleBefore: "自己算一個牌局——",
    customTitleDesktop: "側邊欄",
    customTitleMobile: "上方分頁",
    customTitleAfter: "裡的 ①→⑤，照順序來就行",
    step1Bold: "① OOP 範圍 / ② IP 範圍",
    step1After: "——在 13×13 的表格裡點選、拖曳來塗色，也可以直接輸入文字：",
    step1Hint:
      "22+ = 所有口袋對 · A2s+ = A2s～AKs · KTo+ = KTo～KQo。表格裡的對角線是口袋對，右上是同花（s），左下是不同花（o）",
    exampleHeader:
      "第一次用的話，把下面這兩段範例複製貼上到範圍輸入框裡（BTN vs BB 100bb 標準——和教學案例用的是同一套範圍）",
    exOopLabel: "OOP（BB 跟注）",
    exIpLabel: "IP（BTN 開池）",
    copiedLabel: "已複製！",
    copyLabel: "複製",
    step3Bold: "③ 公共牌",
    step3After: "——點選翻牌 3 張，或者按「隨機翻牌」",
    step4Bold: "④ 下注尺寸（決策樹設定）",
    step4After: "——剛開始保持預設就行，只要確認一下起始底池和有效籌碼",
    step4Hint:
      "自己算的時候，輸入的數值用的是任意整數籌碼單位。想按 bb 來看，就用 10 籌碼 = 1bb 輸入（比如底池 55 就是 5.5bb）。教學案例和訓練器會自動按這個標準換算顯示。",
    step5Bold1: "⑤ 執行解算器",
    // ⚠ 「建立決策樹」·「執行解算器」·「計算完成！」·[結果]는 실제 버튼·탭 이름이다 —
    //   RunSolver.buildTree/runSolver/finished · NavBar.results와 글자까지 같아야 한다
    step5Mid:
      "——先按「建立決策樹」，建好之後按「執行解算器」，等到出現「計算完成！」，再按上面的",
    step5Bold2: "[結果]",
    step5After: "分頁",
    step5Hint:
      "計算是在你自己的電腦上跑的，幾秒到幾分鐘不等。做好的牌局可以在 ⑤ 號畫面用[分享牌局]複製連結，拿到社群去提問",

    resultsTitle: "結果畫面怎麼讀",
    rTerm1: "頂部動作列",
    rDef1:
      "整條動作流程（翻牌→下注→跟注→轉牌……）的場景選擇器。按哪一步，就顯示那一刻的策略",
    rTerm2: "左邊 13×13 表格",
    rDef2:
      "一格就是一手牌，格子裡的顏色比例就是各個動作的頻率。🟥 下注/加注 bet·raise（越深表示下得越大）· 🟩 過牌/跟注 check·call · 灰掉的格子表示不在範圍裡。GTO 對同一手牌也會「按比例混著打」——就是為了不讓人看出規律",
    rTerm3: "右上角的方塊",
    rDef3: "以整個範圍為分母的動作頻率（%）和組合數",
    rTerm4: "右側中間的分類",
    rDef4:
      "你的範圍在這個公共牌上打中了什麼（頂對 top pair、聽牌 draw……）——一眼看出「這個牌面對誰有利」",
    rTerm5: "右下角的表格",
    // EQR = equity realization = 「勝率實現」 (본체 브리프·번체 포스팅 4회. 간체의 「权益实现」과 다르다)
    rDef5: "每手牌的權重、勝率（EQ）、勝率實現（EQR）、EV、動作佔比。按欄標題可以排序",

    trainerTitle: "GTO 訓練器——從「看懂」走到「自己做」",
    trainerIntroBefore: "結果畫面讀順了，就可以進",
    trainerBtn: "GTO 訓練器",
    // ⚠ 앞 요소(버튼)와 사이에 HTML 공백이 들어가 「訓練器 。」로 벌어진다 —
    //   전각 마침표를 앞으로 붙이지 말고 문장을 다시 시작한다
    trainerIntroAfter:
      "試試看。它會在 13 個教學案例的決策點上，按真實範圍抽一手牌給你，你選完動作它就評分。",
    gradTerm: "怎麼評分",
    gradBefore: "它不是判對錯，而是按 ",
    gradBold: "EV 損失（bb）",
    gradAfter:
      "來評價。GTO 對同一手牌本來就會混著打好幾個動作，所以「頻率低的那個動作」並不等於選錯了——標準是你虧了多少",
    verdictTerm: "判定標準",
    verdictBefore: "按",
    verdictBold: "佔底池的比例",
    verdictAfter:
      "來量——底池的 0.35% 以內 = 最佳選擇 · 1% 以內 = 可以接受 · 再多 = 該回頭檢討的局面。舉個例子，5.5bb 的單加注底池（SRP）對應 0.02bb 和 0.06bb，22.5bb 的 3bet 底池對應 0.08bb 和 0.23bb。",
    verdictHint:
      "同樣是 0.08bb，在小底池裡是大失誤，在大底池裡只是小差別。用絕對 bb 來量的話，3bet 底池會顯得比實際更糟，所以改成了按佔底池的比例（2026-08-15）。這兩條線各有一個下限：0.02bb 和 0.05bb。計算只收斂到目標可剝削度 0.5%，比這更小的差別已經和計算雜訊分不開了。",
    reviewTerm: "複習",
    reviewBefore: "虧得多的題會透過[複習]按鈕再出現一次。紀錄預設",
    // ⚠ ErrorToast.bodyB1·TrainerPage.localOnlyBold·errBold와 «글자까지» 같아야 한다
    reviewBold: "只儲存在這台裝置上",
    reviewAfter:
      "。用 HoldemMaster 帳號登入，紀錄就會存到帳號裡，換台裝置也能接著做——登入是選用的，所有功能不登入也能用",
    filterTerm: "篩選",
    filterDef: "在單加注底池/3bet 底池/盲位對戰裡，挑你弱的那類專門練",

    installTitle: "加入主畫面，離線也能學",
    install1:
      "這個解算器可以像應用程式一樣加入主畫面（不用下載安裝檔）。在 Chrome 和 Edge 裡，按網址列右邊的",
    installBold1: "安裝圖示",
    install2: "；iPhone 的 Safari 則是按",
    // iOS Safari 번체 메뉴 이름 (Apple 台灣 표기는 「加入主畫面」 — 간체의 「添加到主屏幕」과 다르다)
    installBold2: "分享 → 加入主畫面",
    install3:
      "。裝好之後，13 個教學案例和訓練器的題目都會存到裝置裡，",
    installBold3: "在沒訊號的地鐵上",
    install4: "也照樣能做。",
    // ⚠ 창 제목·버튼 이름을 «단정하지 않는다» — 기기와 Android 버전마다 다르고 실기 캡처가 없다
    //   (핸드오프 2부 규칙 ②. en·de·pt도 같은 이유로 뭉뚱그렸다)
    samsung1:
      "※ 用三星瀏覽器安裝時，瀏覽器或系統可能會以安全為由攔截安裝。這是瀏覽器那邊的安全機制，跟應用程式本身無關。",
    samsungBold: "改用 Chrome 開啟",
    samsung2:
      "就不會被攔；想直接在這裡裝的話，照提示視窗裡的指引選擇允許即可。",
    offlineDataLabel: "離線學習資料",
    offlineSaved: "已儲存——沒網路也能用教學案例和訓練器",
    offlineSaving: "儲存中…",
    offlineNotSaved: "未儲存",
    offlineSaveBtn: "現在儲存（約 2.3MB）",
    offlineFootnote:
      "自訂牌局自己算（⑤ 執行解算器）得先連網跑過一次才能離線用——計算引擎是用到的時候才下載的。",

    safeTitle: "裝了安全嗎？",
    safe1: "安全。這裡說的「安裝」不是把一個程式下載到你裝置上，而是",
    safeBold: "做一個在瀏覽器裡跑的捷徑",
    safe2:
      "。在 Android 上，註冊的只是一層指向這個網址的薄殼，真正跑起來還是在瀏覽器引擎裡。要是不放心，下面 4 件事你可以自己驗一遍——驗一次比聽我說管用。",
    permTerm: "它不要權限",
    permBefore:
      "安裝的時候，相機、通訊錄、簡訊、位置這些權限一個都不要。你可以在手機的",
    permBold: "設定 → 應用程式資訊 → 權限",
    permAfter: "裡自己看",
    airplaneTerm: "開飛航模式驗一下",
    airplaneBefore: "斷網之後訓練器照樣能跑。這就是",
    airplaneBold: "計算全在你裝置裡完成",
    airplaneAfter: "的最直接證據",
    openTerm: "原始碼是公開的",
    openBefore: "這個解算器是 AGPL-3.0 開源的（",
    openAfter: "）",
    removeTerm: "刪得乾乾淨淨",
    removeDef: "跟別的應用程式一樣長按刪掉就行。不會在背景執行，也不會留下什麼",
    samsungNote2:
      "※ 三星瀏覽器那條攔截提示並不代表查出了惡意程式碼，只是因為 Google 還沒把這個瀏覽器產生的安裝檔列入信任名單。用 Chrome 開啟就不會出現。",

    studyTitle: "推薦的學習路線",
    study1: "把 13 個教學案例按順序過一遍——它們是連成一套的課程",
    study2: "想不通「這手牌為什麼要混著過牌？」的時候，就到右下角的[彙總]表裡比較各動作的 EV",
    study3:
      "同一個局面再用 GTO 訓練器做一遍，把它練成手感——弱點分析會告訴你哪類局面虧得最多",
    study4: "範圍不變，只換公共牌來比較（比如 A72 和 974）",
    study5: "把實戰裡拿不準的那手牌原樣輸進來檢討",

    troubleTitle: "出問題了怎麼辦",
    tTerm1: "建立決策樹出錯",
    tDef1: "檢查一下公共牌 3 張和兩個範圍是不是都填了",
    tTerm2: "算得很慢",
    tDef2: "把目標可剝削度調到 0.5%",
    tTerm3: "結果分頁是空白的",
    tDef3: "等出現「計算完成！」之後再按",
    tTerm4: "超出記憶體上限",
    tDef4: "改用 16 位元整數模式，或者少填幾個下注尺寸",
    tTerm5: "表格全是灰的",
    tDef5: "你正在看的是對手行動的那一步——到頂部動作列上按別的場景",

    errTitle: "如果你發現了需要修的問題",
    err1: "畫面出錯或者計算卡住時，錯誤內容會自動記在這台裝置上。",
    // ⚠ ErrorToast.bodyB1·TrainerPage.localOnlyBold·reviewBold와 같은 약속이다
    errBold: "這些紀錄不會離開這台裝置",
    err2:
      "——你在下面複製出來發到社群，我們才看得到。裡面不含範圍、學習紀錄這類內容，只有錯誤訊息和瀏覽器類型。",
    errLoggedLabel: "已記錄的錯誤",
    errCount: (n: number) => `${n} 筆`,
    errCopied: "已複製",
    errCopyBtn: "複製錯誤內容",
    errClearBtn: "清空紀錄",
    errNone: "目前還沒有記錄到錯誤。",
    errPrompt: "請複製下面的內容",
  },
  fr: {
    quickTitle: "Départ en 1 minute — commence ici si tu débarques",
    quickStep1Desktop: "À gauche, clique sur ",
    quickStep1Mobile: "Dans les onglets du haut, touche ",
    // ⚠ 사이드바 라벨과 «글자까지» 같아야 한다
    quickStep1Btn: "Spots d'étude",
    quickStep1After: "",
    quickStep2Before: "Ouvre n'importe quel spot et appuie sur",
    // ⚠ PresetsPage.infoBtn1·viewResults와 같은 이름
    quickStep2Btn: "[⚡ Voir les résultats]",
    quickStep2After: " — la solution s'affiche immédiatement",
    quickStep3:
      "Ensuite, passe par « Lire l'écran de résultats » ci-dessous pour donner du sens aux chiffres",

    termsTitle: "Quatre termes suffisent",
    termRange: "Range",
    defRange:
      "L'ensemble des mains qu'un joueur peut avoir (ex. « il a sans doute AA, KK ou AK »)",
    defPos:
      "Hors de position (parle en premier — un désavantage) / en position (parle en dernier — un avantage). En BTN vs BB, la BB est OOP",
    termEquity: "Equity",
    defEquity:
      "Ta part du pot si tout partait à tapis maintenant — le % de victoires plus la moitié des égalités",
    defEv: "Espérance de gain (expected value) — ce qu'une action rapporte en moyenne. Plus c'est grand, mieux c'est",

    customTitleBefore: "Calculer un spot personnalisé — suis les numéros ",
    customTitleDesktop: "de la barre latérale",
    customTitleMobile: "des onglets",
    customTitleAfter: " ① → ⑤ dans l'ordre",
    step1Bold: "① Range OOP / ② Range IP",
    step1After:
      " — peins la grille 13×13 par cliquer-glisser, ou écris la range en texte : ",
    step1Hint:
      "22+ = toutes les paires servies · A2s+ = de A2s à AKs · KTo+ = de KTo à KQo. Sur la grille : diagonale = paires servies, en haut à droite = suited, en bas à gauche = offsuit",
    exampleHeader:
      "Nouveau ici ? Copie ces exemples et colle-les dans les champs de range (BTN vs BB 100bb standard — les mêmes ranges que les Spots d'étude)",
    exOopLabel: "OOP (BB caller)",
    exIpLabel: "IP (BTN ouvreur)",
    copiedLabel: "Copié !",
    copyLabel: "Copier",
    step3Bold: "③ Board",
    // ⚠ BoardSelector.randomFlop과 같은 이름
    step3After: " — clique sur trois cartes pour le flop, ou appuie sur « Flop aléatoire »",
    step4Bold: "④ Bet sizes (Réglages)",
    step4After:
      " — laisse d'abord les valeurs par défaut. Vérifie juste le pot initial et le stack effectif",
    step4Hint:
      "Les valeurs du spot personnalisé sont des jetons entiers, dans l'unité de ton choix. Pour raisonner en bb, prends 10 jetons = 1bb (ex. pot 55 = 5,5bb). Les Spots d'étude et le Trainer convertissent automatiquement sur cette échelle.",
    // ⚠ 사이드바 ⑤(Calculer)·RunSolver의 버튼 이름들과 «글자까지» 같아야 한다
    step5Bold1: "⑤ Calculer",
    step5Mid:
      " — appuie sur « Construire l'arbre », puis sur « Lancer le solver » quand c'est prêt. Dès que « Calcul terminé ! » apparaît, ouvre l'onglet ",
    step5Bold2: "[Résultats]",
    step5After: " en haut",
    step5Hint:
      "Le calcul tourne sur ta propre machine et prend de quelques secondes à quelques minutes. Utilise [Partager le spot] sur l'écran ⑤ pour copier un lien vers ton spot et poser ta question dans la communauté",

    resultsTitle: "Lire l'écran de résultats",
    rTerm1: "Barre d'actions du haut",
    rDef1:
      "Un sélecteur de nœud sur la ligne d'action (flop → bet → call → turn…). Clique sur un nœud pour voir la stratégie à ce point",
    rTerm2: "Matrice 13×13 (à gauche)",
    rDef2:
      "Chaque case est une main ; le découpage de couleurs montre les fréquences d'action. 🟥 bet/raise (plus foncé = plus grosse mise) · 🟩 check/call · case éteinte = hors de la range. La GTO joue la même main en stratégie mixte — les actions se répartissent par fréquence pour que ton jeu reste illisible",
    rTerm3: "Tuiles (en haut à droite)",
    rDef3: "Fréquences d'action (%) et nombres de combos sur toute la range",
    rTerm4: "Catégories de mains (au milieu à droite)",
    rDef4:
      "Comment chaque range accroche le board (top paire, tirages…) — pour voir en un coup d'œil qui ce board favorise",
    rTerm5: "Tableau (en bas à droite)",
    rDef5:
      "Poids, equity, EV et % d'action par main — clique sur un en-tête de colonne pour trier",

    trainerTitle: "Trainer GTO — de l'observation au jeu",
    trainerIntroBefore:
      "Une fois à l'aise avec l'écran de résultats, passe au",
    trainerBtn: "Trainer GTO",
    trainerIntroAfter:
      ". Aux points de décision des 13 Spots d'étude, tu reçois des mains tirées des vraies ranges — choisis une action et il te note.",
    gradTerm: "Comment marche la note",
    gradBefore: "Tu n'es pas noté en bonne ou mauvaise réponse, mais en ",
    gradBold: "perte d'EV (bb)",
    gradAfter:
      ". La GTO mixe plusieurs actions avec la même main, donc une action à basse fréquence n'est pas automatiquement une erreur — ce qui compte, c'est combien d'EV elle abandonne",
    verdictTerm: "Seuils de verdict",
    verdictBefore: "Mesurés ",
    verdictBold: "par rapport au pot",
    // ⚠ 판정명은 TrainerPage.verdictBest·verdictGood·verdictMiss와 «글자까지» 같아야 한다
    verdictAfter:
      " — jusqu'à 0,35 % du pot = Meilleur choix · jusqu'à 1 % = Acceptable · au-delà = Spot à revoir. Par exemple, dans un single raised pot (SRP) de 5,5bb, les seuils sont 0,02bb et 0,06bb ; dans un pot 3-bet de 22,5bb, 0,08bb et 0,23bb.",
    verdictHint:
      "La même perte de 0,08bb est une grosse erreur dans un petit pot et une broutille dans un gros pot. Noter en bb absolus faisait paraître les pots 3-bet pires qu'ils ne le sont, donc on est passés à la note relative au pot (15/08/2026). Les seuils ont des planchers (0,02bb / 0,05bb) : les calculs ne convergent que vers une exploitabilité cible de 0,5 %, donc les écarts plus petits ne se distinguent pas du bruit du solver.",
    reviewTerm: "Révision",
    reviewBefore:
      "Les mains où tu as perdu le plus d'EV reviennent via le bouton [Révision]. Par défaut, ton historique est stocké ",
    // ⚠ 앱의 «신뢰 약속» — ErrorToast.bodyB1·TrainerPage.localOnlyBold와 «글자까지» 같아야 한다
    reviewBold: "uniquement sur cet appareil",
    reviewAfter:
      ". Connecte-toi avec un compte HoldemMaster pour le garder sur ton compte et continuer sur d'autres appareils — la connexion est optionnelle, tout fonctionne sans",
    filterTerm: "Filtres",
    filterDef:
      "Bosse juste tes points faibles : single raised pots, pots 3-bet ou blind vs blind",

    installTitle: "Installe-le sur ton écran d'accueil et étudie hors ligne",
    install1:
      "Tu peux installer ce solver sur ton écran d'accueil comme une app (sans fichier d'installation). Dans Chrome ou Edge, utilise l'",
    installBold1: "icône d'installation",
    install2: " à droite de la barre d'adresse ; dans Safari sur iPhone, touche ",
    // ⚠ InstallBanner.iosB2(Apple 프랑스어 메뉴명)와 같은 표기
    installBold2: "Partager → Sur l'écran d'accueil",
    install3:
      ". Une fois installé, les 13 Spots d'étude et les exercices du Trainer sont stockés sur ton appareil, pour continuer à étudier ",
    installBold3: "même dans le métro sans internet",
    install4: ".",
    samsung1:
      "* À l'installation depuis Samsung Internet, le navigateur ou l'appareil peut bloquer l'installation pour des raisons de sécurité. Ce contrôle vient du navigateur, pas de cette app. ",
    samsungBold: "Ouvre le site dans Chrome",
    samsung2:
      " et il s'installe sans blocage ; si tu préfères rester ici, suis les indications de la boîte de dialogue.",
    offlineDataLabel: "Données d'étude hors ligne",
    offlineSaved: "Enregistrées — les Spots d'étude et le Trainer fonctionnent sans internet",
    offlineSaving: "Enregistrement…",
    offlineNotSaved: "Pas encore enregistrées",
    offlineSaveBtn: "Enregistrer maintenant (~2,3 Mo)",
    offlineFootnote:
      "Le calcul de spots personnalisés ne marche hors ligne qu'après l'avoir lancé au moins une fois en ligne — le moteur du solver se télécharge à la première utilisation.",

    safeTitle: "C'est sûr d'installer ?",
    safe1:
      "Oui. « Installer » ici ne veut pas dire télécharger un programme sur ton appareil — ça veut dire ",
    safeBold: "créer un raccourci qui tourne dans ton navigateur",
    safe2:
      ". Sur Android, seul un simple raccourci pointant vers cette adresse est enregistré ; tout continue de tourner dans le moteur du navigateur. Si tu es sceptique, vérifie toi-même ces quatre points — vérifier vaut mieux que nous croire sur parole.",
    permTerm: "Aucune permission utilisée",
    permBefore:
      "L'installation ne demande aucune permission — ni caméra, ni contacts, ni SMS, ni position. Vérifie toi-même dans ",
    permBold: "Paramètres → Infos sur l'app → Autorisations",
    permAfter: " sur ton téléphone",
    airplaneTerm: "Vérifie en mode avion",
    airplaneBefore:
      "Coupe internet et le Trainer continue de marcher — la preuve la plus claire que le calcul ",
    airplaneBold: "se fait entièrement sur ton appareil",
    airplaneAfter: "",
    openTerm: "Le code source est public",
    openBefore: "Ce solver est open source sous AGPL-3.0 (",
    openAfter: ")",
    removeTerm: "Se désinstalle proprement",
    removeDef:
      "Appuie longuement sur l'icône puis supprime, comme n'importe quelle app, et c'est fini. Rien ne tourne en arrière-plan, rien ne reste",
    samsungNote2:
      "* Un blocage de sécurité dans Samsung Internet n'est pas une détection de malware — le navigateur ne reconnaît simplement pas encore ce type de paquet d'installation. Il n'apparaît pas quand tu installes depuis Chrome.",

    studyTitle: "Plan d'étude suggéré",
    study1:
      "Fais les 13 Spots d'étude dans l'ordre — chaque spot s'appuie sur le précédent",
    study2:
      "Si tu te demandes « pourquoi cette main mixe des checks ? », compare les EV par action dans le tableau détaillé",
    study3:
      "Rejoue les mêmes spots dans le Trainer GTO pour les ancrer — le détecteur de leaks montre quelles situations te coûtent le plus d'EV",
    study4: "Garde les ranges, change seulement le board, et compare (ex. A72 vs 974)",
    study5:
      "Reconstruis ici les mains qui t'ont embrouillé en session et analyse-les",

    troubleTitle: "Dépannage",
    tTerm1: "Erreur à la construction de l'arbre",
    tDef1: "Vérifie que 3 cartes de board et les deux ranges sont renseignées",
    tTerm2: "Le calcul est lent",
    tDef2: "Monte l'exploitabilité cible à 0,5 %",
    tTerm3: "L'onglet Résultats est vide",
    tDef3: "Ouvre-le après l'apparition de « Calcul terminé ! »",
    tTerm4: "Limite mémoire dépassée",
    tDef4: "Passe en mode entier 16 bits, ou réduis le nombre de bet sizes",
    tTerm5: "La matrice est toute grise",
    tDef5:
      "Tu regardes le tour de parole de l'adversaire — choisis un autre nœud dans la barre d'actions du haut",

    errTitle: "Tu as trouvé quelque chose à corriger ?",
    err1: "Si quelque chose s'affiche mal ou qu'un calcul se fige, les détails de l'erreur sont enregistrés automatiquement sur cet appareil. ",
    // ⚠ ErrorToast.bodyB1·TrainerPage.localOnlyBold·reviewBold와 같은 약속이다
    errBold: "Ces journaux ne quittent jamais ton appareil",
    err2:
      " — on ne les voit que si tu les copies ci-dessous et les postes dans la communauté. Ils ne contiennent que le message d'erreur et le type de navigateur — jamais tes ranges ni ton historique d'étude.",
    errLoggedLabel: "Erreurs enregistrées",
    errCount: (n: number) => `${n}`,
    errCopied: "Copié",
    errCopyBtn: "Copier les détails de l'erreur",
    errClearBtn: "Vider le journal",
    errNone: "Aucune erreur enregistrée pour l'instant.",
    errPrompt: "Copie le texte ci-dessous",
  },
  // id(인도네시아어): 문체 Anda(본체 브리프 확정). 용어(solver·range·board·equity·EV·bet size·check/call/raise/fold)는
  // 본체 id 코퍼스 43편이 영어 그대로 쓴다 — 참고자료/인도네시아어화_리서치_2026-09-02.md §2.
  id: {
    quickTitle: "Mulai dalam 1 menit — baca ini dulu kalau Anda baru di sini",
    quickStep1Desktop: "Di sebelah kiri, klik ",
    quickStep1Mobile: "Di tab bagian atas, ketuk ",
    // ⚠ 사이드바 라벨과 «글자까지» 같아야 한다
    quickStep1Btn: "Spot belajar",
    quickStep1After: "",
    quickStep2Before: "Buka spot mana saja lalu tekan",
    // ⚠ PresetsPage.infoBtn1·viewResults와 같은 이름
    quickStep2Btn: "[⚡ Lihat hasil]",
    quickStep2After: " — solusinya langsung muncul",
    quickStep3:
      "Setelah itu, baca “Membaca layar hasil” di bawah supaya Anda paham arti angka-angkanya",

    termsTitle: "Cukup empat istilah",
    termRange: "Range",
    defRange:
      "Kumpulan hand yang mungkin dipegang seorang pemain (misalnya “dia mungkin pegang AA, KK, atau AK”)",
    defPos:
      "Out of position (bertindak lebih dulu — kerugian) / in position (bertindak terakhir — keuntungan). Di BTN vs BB, BB adalah OOP",
    termEquity: "Equity",
    defEquity:
      "Bagian pot yang jadi milik Anda kalau semua all-in sekarang — % menang ditambah setengah dari % seri",
    defEv: "Expected value — rata-rata hasil sebuah aksi kalau diulang berkali-kali. Makin besar makin bagus",

    customTitleBefore: "Menghitung spot kustom — ikuti nomor ",
    customTitleDesktop: "di sidebar",
    customTitleMobile: "di tab",
    customTitleAfter: " ① → ⑤ secara berurutan",
    step1Bold: "① Range OOP / ② Range IP",
    step1After:
      " — warnai grid 13×13 dengan klik-dan-seret, atau tulis range-nya sebagai teks: ",
    step1Hint:
      "22+ = semua pocket pair · A2s+ = A2s sampai AKs · KTo+ = KTo sampai KQo. Di grid: diagonal = pocket pair, kanan atas = suited, kiri bawah = offsuit",
    exampleHeader:
      "Baru di sini? Salin contoh ini dan tempel ke kolom range (standar BTN vs BB 100bb — range yang sama dengan Spot belajar)",
    exOopLabel: "OOP (BB caller)",
    exIpLabel: "IP (BTN opener)",
    copiedLabel: "Tersalin!",
    copyLabel: "Salin",
    step3Bold: "③ Board",
    // ⚠ BoardSelector.randomFlop과 같은 이름
    step3After: " — klik tiga kartu untuk flop, atau tekan “Flop acak”",
    step4Bold: "④ Bet size (Pengaturan)",
    step4After:
      " — biarkan nilai default dulu. Cukup periksa Pot awal dan Stack efektif",
    step4Hint:
      "Nilai di spot kustom adalah chip bilangan bulat dalam satuan yang Anda pilih sendiri. Untuk berpikir dalam bb, pakai 10 chip = 1bb (contoh: pot 55 = 5,5bb). Spot belajar dan Trainer otomatis memakai skala ini.",
    // ⚠ 사이드바 ⑤(Hitung)·RunSolver의 버튼 이름들과 «글자까지» 같아야 한다
    step5Bold1: "⑤ Hitung",
    step5Mid:
      " — tekan “Buat Tree”, lalu “Jalankan Solver” setelah tree selesai dibuat. Begitu “Perhitungan selesai!” muncul, buka tab ",
    step5Bold2: "[Hasil]",
    step5After: " di bagian atas",
    step5Hint:
      "Perhitungan berjalan di perangkat Anda sendiri dan memakan waktu beberapa detik sampai beberapa menit. Gunakan [Bagikan Spot] di layar ⑤ untuk menyalin tautan spot Anda dan menanyakannya di komunitas",

    resultsTitle: "Membaca layar hasil",
    rTerm1: "Bilah aksi di atas",
    rDef1:
      "Pemilih node di sepanjang jalur aksi (flop → bet → call → turn…). Klik sebuah node untuk melihat strategi di titik itu",
    rTerm2: "Grid 13×13 (kiri)",
    rDef2:
      "Setiap kotak adalah satu hand; pembagian warnanya menunjukkan frekuensi aksi. 🟥 bet/raise (makin gelap = makin besar taruhannya) · 🟩 check/call · kotak redup = di luar range. GTO memainkan hand yang sama dengan strategi campuran — aksinya dibagi menurut frekuensi supaya permainan Anda sulit dibaca",
    rTerm3: "Kotak ringkasan (kanan atas)",
    rDef3: "Frekuensi aksi (%) dan jumlah combo untuk seluruh range",
    rTerm4: "Kategori hand (kanan tengah)",
    rDef4:
      "Cara setiap range terhubung dengan board (top pair, draw, dan seterusnya) — untuk melihat sekilas siapa yang diuntungkan board ini",
    rTerm5: "Tabel (kanan bawah)",
    rDef5:
      "Bobot, equity, EV, dan % aksi per hand — klik judul kolom untuk mengurutkan",

    trainerTitle: "Trainer GTO — dari mengamati ke bermain",
    trainerIntroBefore:
      "Setelah nyaman membaca layar hasil, lanjut ke",
    trainerBtn: "Trainer GTO",
    trainerIntroAfter:
      ". Di titik keputusan dari 13 Spot belajar, Anda mendapat hand yang diambil dari range sungguhan — pilih aksi dan Anda langsung dinilai.",
    gradTerm: "Cara penilaiannya",
    gradBefore: "Anda tidak dinilai benar atau salah, melainkan berdasarkan ",
    gradBold: "kerugian EV (bb)",
    gradAfter:
      ". GTO mencampur beberapa aksi dengan hand yang sama, jadi aksi berfrekuensi rendah belum tentu salah — yang penting adalah berapa banyak EV yang dilepas",
    verdictTerm: "Ambang penilaian",
    verdictBefore: "Diukur ",
    verdictBold: "relatif terhadap pot",
    // ⚠ 판정명은 TrainerPage.verdictBest·verdictGood·verdictMiss와 «글자까지» 같아야 한다
    verdictAfter:
      " — sampai 0,35% pot = Pilihan terbaik · sampai 1% = Cukup baik · di atas itu = Perlu ditinjau. Contohnya, di single raised pot (SRP) 5,5bb ambangnya 0,02bb dan 0,06bb; di pot 3-bet 22,5bb, 0,08bb dan 0,23bb.",
    verdictHint:
      "Kerugian 0,08bb yang sama adalah kesalahan besar di pot kecil tapi sepele di pot besar. Penilaian dalam bb absolut membuat pot 3-bet terlihat lebih buruk dari kenyataannya, jadi kami beralih ke penilaian relatif terhadap pot (15/08/2026). Ambangnya punya batas bawah (0,02bb / 0,05bb): perhitungan hanya konvergen sampai target exploitability 0,5%, sehingga selisih yang lebih kecil tak bisa dibedakan dari noise solver.",
    reviewTerm: "Tinjau ulang",
    reviewBefore:
      "Hand yang paling banyak membuang EV Anda muncul kembali lewat tombol [Tinjau ulang]. Secara default, riwayat Anda disimpan ",
    // ⚠ 앱의 «신뢰 약속» — ErrorToast.bodyB1·TrainerPage.localOnlyBold와 «글자까지» 같아야 한다
    reviewBold: "hanya di perangkat ini",
    reviewAfter:
      ". Login dengan akun HoldemMaster untuk menyimpannya di akun Anda dan melanjutkan di perangkat lain — login bersifat opsional, semuanya tetap berfungsi tanpa login",
    filterTerm: "Filter",
    filterDef:
      "Fokus ke titik lemah Anda saja: single raised pot, pot 3-bet, atau blind vs blind",

    installTitle: "Pasang ke layar utama dan belajar saat offline",
    install1:
      "Solver ini bisa Anda pasang di layar utama seperti aplikasi (tanpa file instalasi). Di Chrome atau Edge, gunakan ",
    installBold1: "ikon instal",
    install2: " di sebelah kanan bilah alamat; di Safari di iPhone, ketuk ",
    // ⚠ InstallBanner.iosB2(Apple 인니어 메뉴명)와 같은 표기
    installBold2: "Bagikan → Tambah ke Layar Utama",
    install3:
      ". Setelah terpasang, 13 Spot belajar dan soal-soal Trainer tersimpan di perangkat Anda, jadi Anda tetap bisa belajar ",
    installBold3: "bahkan di kereta tanpa internet",
    install4: ".",
    samsung1:
      "* Saat memasang dari Samsung Internet, browser atau perangkat mungkin memblokir pemasangan karena alasan keamanan. Pemeriksaan ini berasal dari browser, bukan dari aplikasi ini. ",
    samsungBold: "Buka situs ini di Chrome",
    samsung2:
      " dan pemasangan berjalan tanpa blokir; kalau ingin tetap di sini, ikuti petunjuk di kotak dialognya.",
    offlineDataLabel: "Data belajar offline",
    offlineSaved: "Tersimpan — Spot belajar dan Trainer berfungsi tanpa internet",
    offlineSaving: "Menyimpan…",
    offlineNotSaved: "Belum tersimpan",
    offlineSaveBtn: "Simpan sekarang (~2,3 MB)",
    offlineFootnote:
      "Perhitungan spot kustom baru bisa dijalankan offline setelah dijalankan minimal sekali saat online — mesin solver diunduh pada pemakaian pertama.",

    safeTitle: "Aman dipasang?",
    safe1:
      "Aman. “Pasang” di sini bukan berarti mengunduh program ke perangkat Anda — melainkan ",
    safeBold: "membuat pintasan yang berjalan di dalam browser Anda",
    safe2:
      ". Di Android, yang tersimpan hanya pintasan sederhana ke alamat ini; semuanya tetap berjalan di mesin browser. Kalau masih ragu, periksa sendiri empat hal berikut — memeriksa lebih baik daripada sekadar percaya kata kami.",
    permTerm: "Tanpa izin apa pun",
    permBefore:
      "Pemasangan tidak meminta izin apa pun — tidak ada izin kamera, kontak, SMS, maupun lokasi. Periksa sendiri di ",
    permBold: "Pengaturan → Info aplikasi → Izin",
    permAfter: " di ponsel Anda",
    airplaneTerm: "Uji dengan mode pesawat",
    airplaneBefore:
      "Matikan internet dan Trainer tetap berjalan — bukti paling jelas bahwa perhitungan ",
    airplaneBold: "sepenuhnya terjadi di perangkat Anda",
    airplaneAfter: "",
    openTerm: "Kode sumbernya terbuka",
    openBefore: "Solver ini open source di bawah lisensi AGPL-3.0 (",
    openAfter: ")",
    removeTerm: "Bisa dihapus bersih",
    removeDef:
      "Tekan lama ikonnya lalu hapus, seperti aplikasi lain, dan selesai. Tidak ada yang berjalan di latar belakang, tidak ada yang tertinggal",
    samsungNote2:
      "* Blokir keamanan di Samsung Internet bukan deteksi malware — browser hanya belum mengenali jenis paket pemasangan ini. Blokir itu tidak muncul kalau Anda memasang dari Chrome.",

    studyTitle: "Saran urutan belajar",
    study1:
      "Kerjakan 13 Spot belajar secara berurutan — setiap spot dibangun di atas spot sebelumnya",
    study2:
      "Kalau Anda bertanya “kenapa hand ini kadang check?”, bandingkan EV tiap aksi di tabel detail",
    study3:
      "Mainkan ulang spot yang sama di Trainer GTO supaya melekat — pendeteksi leak menunjukkan situasi mana yang paling banyak menguras EV Anda",
    study4: "Pertahankan range-nya, ganti board-nya saja, lalu bandingkan (contoh: A72 vs 974)",
    study5:
      "Susun ulang di sini hand yang membingungkan Anda saat bermain sungguhan, lalu analisis hasilnya",

    troubleTitle: "Pemecahan masalah",
    tTerm1: "Error saat membangun tree",
    tDef1: "Pastikan 3 kartu board dan kedua range sudah terisi",
    tTerm2: "Perhitungan lambat",
    tDef2: "Naikkan target exploitability ke 0,5%",
    tTerm3: "Tab Hasil kosong",
    tDef3: "Buka setelah “Perhitungan selesai!” muncul",
    tTerm4: "Batas memori terlampaui",
    tDef4: "Ganti ke mode integer 16-bit, atau kurangi jumlah bet size",
    tTerm5: "Grid abu-abu semua",
    tDef5:
      "Anda sedang melihat giliran lawan — pilih node lain di bilah aksi bagian atas",

    errTitle: "Menemukan sesuatu yang perlu diperbaiki?",
    err1: "Kalau tampilan rusak atau perhitungan macet, detail error-nya otomatis dicatat di perangkat ini. ",
    // ⚠ ErrorToast.bodyB1·TrainerPage.localOnlyBold·reviewBold와 같은 약속이다
    errBold: "Catatan ini tidak pernah keluar dari perangkat Anda",
    err2:
      " — kami hanya melihatnya kalau Anda menyalinnya di bawah dan mempostingnya di komunitas. Isinya hanya pesan error dan jenis browser — tidak pernah range atau riwayat belajar Anda.",
    errLoggedLabel: "Error tercatat",
    errCount: (n: number) => `${n}`,
    errCopied: "Tersalin",
    errCopyBtn: "Salin detail error",
    errClearBtn: "Kosongkan catatan",
    errNone: "Belum ada error yang tercatat.",
    errPrompt: "Salin teks di bawah ini",
  },
  hi: {
    quickTitle: "1 मिनट में शुरुआत — पहली बार यहाँ हैं तो इसे पढ़ें",
    quickStep1Desktop: "बाईं ओर ",
    quickStep1Mobile: "ऊपर दिए टैब में ",
    quickStep1Btn: "अभ्यास स्पॉट",
    quickStep1After: " चुनें",
    quickStep2Before: "कोई स्पॉट खोलें और",
    quickStep2Btn: "[⚡ परिणाम देखें]",
    quickStep2After: " दबाएँ — परिणाम तुरंत दिखेंगे",
    quickStep3: "संख्याएँ समझने के लिए नीचे “परिणाम स्क्रीन कैसे पढ़ें” देखें",
    termsTitle: "बस ये चार शब्द समझ लें",
    termRange: "Range",
    defRange: "किसी खिलाड़ी के पास हो सकने वाले हैंड का समूह, जैसे AA, KK या AK। अलग-अलग हैंड का वज़न भी तय किया जा सकता है।",
    defPos: "OOP पहले एक्शन करता है, IP बाद में। बाद में एक्शन करने पर दूसरे खिलाड़ी का फ़ैसला देखने का फ़ायदा मिलता है। BTN बनाम BB में BB, OOP होता है।",
    termEquity: "Equity",
    defEquity: "अभी all-in होने पर pot में आपकी अपेक्षित हिस्सेदारी — दो खिलाड़ियों में जीतने की संभावना और बराबरी की संभावना का आधा हिस्सा।",
    defEv: "अपेक्षित मूल्य — किसी एक्शन से औसतन मिलने वाला मूल्य। जितना अधिक, उतना बेहतर।",
    customTitleBefore: "अपना स्पॉट हल करें — ",
    customTitleDesktop: "साइडबार",
    customTitleMobile: "टैब",
    customTitleAfter: " में ① → ⑤ के क्रम से चलें",
    step1Bold: "① OOP Range / ② IP Range",
    step1After: " — कंप्यूटर पर 13×13 ग्रिड में क्लिक करके खींचें। फ़ोन पर नीचे दिए उदाहरण कॉपी करके टेक्स्ट इनपुट में पेस्ट कर सकते हैं: ",
    step1Hint: "22+ = सभी pocket pair · A2s+ = A2s से AKs तक · KTo+ = KTo से KQo तक। ग्रिड में तिरछी मुख्य रेखा पर pocket pair, ऊपर दाईं ओर suited और नीचे बाईं ओर offsuit हैंड हैं।",
    exampleHeader: "पहली बार इस्तेमाल कर रहे हैं? इन्हें कॉपी करके range इनपुट में पेस्ट करें (सामान्य BTN बनाम BB 100bb — अभ्यास स्पॉट में भी यही range हैं)",
    exOopLabel: "OOP (BB caller)",
    exIpLabel: "IP (BTN opener)",
    copiedLabel: "कॉपी हो गया!",
    copyLabel: "कॉपी करें",
    step3Bold: "③ Board",
    step3After: " — flop के तीन कार्ड चुनें या रैंडम flop चुनने वाला बटन दबाएँ",
    step4Bold: "④ Bet size (गेम ट्री सेटिंग)",
    step4After: " — शुरुआत में डिफ़ॉल्ट सेटिंग रखें। बस शुरुआती pot और effective stack जाँच लें",
    step4Hint: "अपने स्पॉट के इनपुट पूर्णांक chips में हैं। bb में समझने के लिए 10 chips = 1bb मानें (जैसे pot 55 = 5.5bb)। अभ्यास स्पॉट और ट्रेनर इसी पैमाने पर अपने आप बदलकर दिखाते हैं।",
    step5Bold1: "⑤ गणना करें",
    step5Mid: " — पहले “Tree बनाएँ” दबाएँ, फिर ट्री तैयार होने पर “Solver चलाएँ”। “गणना पूरी हुई!” दिखने पर ऊपर का ",
    step5Bold2: "[परिणाम]",
    step5After: " टैब खोलें",
    step5Hint: "गणना आपके अपने डिवाइस पर होती है और कुछ सेकंड से कुछ मिनट लग सकते हैं। स्क्रीन ⑤ पर स्पॉट शेयर करने वाले बटन से लिंक कॉपी करके कम्युनिटी में उस पर सवाल पूछ सकते हैं।",
    resultsTitle: "परिणाम स्क्रीन कैसे पढ़ें",
    rTerm1: "ऊपर की एक्शन पट्टी",
    rDef1: "अपने स्पॉट की गणना के बाद, एक्शन क्रम में कोई node चुनकर उसकी रणनीति देखें (flop → bet → call → turn…)। अभ्यास स्पॉट का preview केवल flop की पहली बारी दिखाता है।",
    rTerm2: "13×13 ग्रिड (बाईं ओर)",
    rDef2: "हर खाने में एक हैंड है। रंगों का बँटवारा एक्शन की आवृत्ति दिखाता है। 🟥 bet/raise (गहरा रंग = बड़ा bet) · 🟩 check/call · धुंधला खाना = range में नहीं है। GTO में एक ही हैंड से अलग-अलग आवृत्ति पर अलग एक्शन किए जा सकते हैं। इसे mixed strategy कहते हैं।",
    rTerm3: "सारांश बॉक्स (ऊपर दाईं ओर)",
    rDef3: "पूरी range में एक्शन की आवृत्ति (%) और combo की संख्या।",
    rTerm4: "हैंड की श्रेणियाँ (बीच में दाईं ओर)",
    rDef4: "हर range बोर्ड से कैसे जुड़ती है — जैसे Top Pair और draw। इससे दोनों range की बनावट की तुलना कर सकते हैं।",
    rTerm5: "टेबल (नीचे दाईं ओर)",
    rDef5: "हर हैंड का वज़न, equity, EV और एक्शन का %। क्रम बदलने के लिए कॉलम के शीर्षक पर क्लिक करें।",
    trainerTitle: "GTO Trainer — अब खुद फ़ैसले लें",
    trainerIntroBefore: "परिणाम स्क्रीन समझने के बाद",
    trainerBtn: "GTO Trainer",
    trainerIntroAfter: " आज़माएँ। 13 अभ्यास स्पॉट के निर्णय बिंदुओं पर आपको वास्तविक range से हैंड मिलते हैं। एक्शन चुनें और अपना मूल्यांकन देखें।",
    gradTerm: "मूल्यांकन कैसे होता है",
    gradBefore: "सिर्फ़ सही या ग़लत के बजाय ",
    gradBold: "EV नुकसान (bb)",
    gradAfter: " से मूल्यांकन होता है। GTO एक ही हैंड से कई एक्शन मिला सकता है। कम आवृत्ति वाला एक्शन अपने आप गलती नहीं है — सवाल यह है कि उससे कितना EV छूटता है।",
    verdictTerm: "मूल्यांकन की सीमाएँ",
    verdictBefore: "नुकसान ",
    verdictBold: "pot के अनुपात में",
    verdictAfter: " मापा जाता है: pot का 0.35% तक = सर्वोत्तम · 1% तक = स्वीकार्य · इससे अधिक = गलती। उदाहरण के लिए, 5.5bb single raised pot (SRP) में सीमाएँ 0.02bb और 0.06bb हैं। 22.5bb 3-bet pot में ये 0.08bb और 0.23bb हैं।",
    verdictHint: "एक ही 0.08bb नुकसान छोटे pot में गलती और बड़े pot में स्वीकार्य हो सकता है। केवल bb से मूल्यांकन करने पर 3-bet pot में प्रदर्शन ज़रूरत से अधिक ख़राब दिखता था, इसलिए 2026-08-15 से pot के अनुपात वाला तरीका अपनाया गया। सीमाओं के न्यूनतम मान 0.02bb / 0.05bb हैं। लक्ष्य exploitability 0.5% पर गणना रोकी जाती है; बहुत छोटे EV अंतर को सटीक निष्कर्ष मानने से बचने के लिए यह गुंजाइश रखी गई है।",
    reviewTerm: "दोबारा देखें",
    reviewBefore: "सबसे अधिक EV नुकसान वाले हैंड [दोबारा देखें] से फिर मिलते हैं। डिफ़ॉल्ट रूप से इतिहास ",
    reviewBold: "सिर्फ़ इस डिवाइस पर",
    reviewAfter: " सेव होता है। HoldemMaster खाते में लॉग इन करके इसे खाते में रख सकते हैं और दूसरे डिवाइस पर जारी रख सकते हैं। लॉग इन करना ज़रूरी नहीं — उसके बिना भी सभी सुविधाएँ इस्तेमाल कर सकते हैं।",
    filterTerm: "फ़िल्टर",
    filterDef: "कमज़ोर हिस्सों पर ध्यान दें: single raised pot, 3-bet pot या blind बनाम blind।",
    installTitle: "होम स्क्रीन पर जोड़ें और ऑफ़लाइन अभ्यास करें",
    install1: "इस सॉल्वर को ऐप की तरह होम स्क्रीन पर जोड़ सकते हैं। अलग से इंस्टॉलर फ़ाइल डाउनलोड करने की ज़रूरत नहीं। Chrome या Edge में एड्रेस बार के दाईं ओर ",
    installBold1: "इंस्टॉल आइकन",
    install2: " इस्तेमाल करें। iPhone के Safari में ",
    installBold2: "शेयर करें → होम स्क्रीन पर जोड़ें",
    install3: " चुनें। इंस्टॉल होने पर 13 अभ्यास स्पॉट और ट्रेनर का डेटा डिवाइस पर सेव हो जाता है। आप ",
    installBold3: "बिना इंटरनेट, मेट्रो में भी",
    install4: " अभ्यास कर सकते हैं।",
    samsung1: "* Samsung Internet या आपका डिवाइस सुरक्षा कारणों से इंस्टॉल रोक सकता है। यह जाँच ब्राउज़र या डिवाइस करता है। ",
    samsungBold: "साइट Chrome में खोलकर",
    samsung2: " इंस्टॉल करने की कोशिश करें। इसी ब्राउज़र में जारी रखना चाहें तो स्क्रीन पर दिए गए विकल्प पढ़कर आगे बढ़ें।",
    offlineDataLabel: "ऑफ़लाइन अभ्यास का डेटा",
    offlineSaved: "सेव है — अभ्यास स्पॉट और ट्रेनर बिना इंटरनेट चलेंगे",
    offlineSaving: "सेव हो रहा है…",
    offlineNotSaved: "सेव नहीं है",
    offlineSaveBtn: "अभी सेव करें (~2.3MB)",
    offlineFootnote: "अपने स्पॉट की गणना ऑफ़लाइन करने के लिए उसे कम से कम एक बार ऑनलाइन चलाना ज़रूरी है — सॉल्वर इंजन पहली बार इस्तेमाल करने पर डाउनलोड होता है।",
    safeTitle: "इंस्टॉल करने से क्या होता है?",
    safe1: "यहाँ इंस्टॉल करने का मतलब ",
    safeBold: "ब्राउज़र में चलने वाले वेब ऐप का शॉर्टकट बनाना",
    safe2: " है। Android पर इस पते से जुड़ा छोटा ऐप पैकेज दर्ज हो सकता है, लेकिन ऐप ब्राउज़र इंजन में ही चलता है। नीचे दिए तरीके खुद जाँच सकते हैं।",
    permTerm: "डिवाइस की अनुमति नहीं माँगता",
    permBefore: "इंस्टॉल करने के लिए कैमरा, संपर्क, SMS या लोकेशन की अनुमति नहीं माँगी जाती। अपने फ़ोन की ",
    permBold: "सेटिंग में ऐप की अनुमतियाँ",
    permAfter: " खोलकर जाँचें।",
    airplaneTerm: "एयरप्लेन मोड में जाँचें",
    airplaneBefore: "डेटा सेव होने के बाद इंटरनेट बंद करके ट्रेनर चलाकर देखें। इससे जाँच सकते हैं कि अभ्यास के लिए ",
    airplaneBold: "आपका अपना डिवाइस ही काफ़ी है",
    airplaneAfter: "।",
    openTerm: "सोर्स कोड सार्वजनिक है",
    openBefore: "यह सॉल्वर AGPL-3.0 ओपन सोर्स है (",
    openAfter: ")।",
    removeTerm: "आसानी से हटा सकते हैं",
    removeDef: "दूसरे ऐप की तरह आइकन को देर तक दबाकर हटाएँ। सेव किया गया साइट डेटा हटाना हो तो ब्राउज़र की सेटिंग भी देखें।",
    samsungNote2: "* Samsung Internet में इंस्टॉल रुकने का कारण ब्राउज़र या डिवाइस की सुरक्षा जाँच हो सकता है। संदेश ध्यान से पढ़ें। ज़रूरत हो तो साइट Chrome में खोलकर कोशिश करें।",
    studyTitle: "अभ्यास का सुझाया क्रम",
    study1: "13 अभ्यास स्पॉट क्रम से देखें — ये एक-दूसरे से जुड़ी स्थितियों को समझने में मदद करते हैं",
    study2: "सोच रहे हैं कि “इस हैंड से कभी check क्यों होता है?” विवरण टेबल में हर एक्शन के EV की तुलना करें।",
    study3: "उन्हीं स्पॉट का GTO Trainer में अभ्यास करें। कमज़ोरियों की रिपोर्ट बताती है कि किन स्थितियों में सबसे अधिक EV नुकसान होता है",
    study4: "Range वही रखें और सिर्फ़ बोर्ड बदलकर तुलना करें (जैसे A72 और 974)",
    study5: "असली खेल में जिन हैंड ने उलझाया, उन्हें यहाँ बनाकर दोबारा देखें",
    troubleTitle: "परेशानी दूर करें",
    tTerm1: "ट्री नहीं बन रहा",
    tDef1: "जाँचें कि बोर्ड पर 3 कार्ड और दोनों range दर्ज हैं",
    tTerm2: "गणना धीमी है",
    tDef2: "लक्ष्य exploitability को बढ़ाकर 0.5% आज़माएँ",
    tTerm3: "परिणाम टैब खाली है",
    tDef3: "“गणना पूरी हुई!” दिखने के बाद इसे खोलें",
    tTerm4: "मेमोरी की सीमा पार हो गई",
    tDef4: "16-bit integer मोड चुनें या bet size के विकल्प कम करें",
    tTerm5: "पूरा ग्रिड धूसर है",
    tDef5: "यह दूसरे खिलाड़ी की बारी है — ऊपर की एक्शन पट्टी में कोई और स्थिति चुनें",
    errTitle: "कोई समस्या मिली?",
    err1: "स्क्रीन ख़राब दिखे या गणना अटक जाए तो त्रुटि का विवरण इस डिवाइस पर अपने आप दर्ज होता है। ",
    errBold: "लॉग अपने आप बाहर नहीं भेजे जाते",
    err2: "। हमें तभी दिखते हैं जब आप नीचे से कॉपी करके कम्युनिटी में पोस्ट करते हैं। इनमें त्रुटि संदेश और ब्राउज़र की जानकारी होती है, आपकी range या अभ्यास का इतिहास नहीं।",
    errLoggedLabel: "दर्ज त्रुटियाँ",
    errCount: (n: number) => `${n}`,
    errCopied: "कॉपी हो गया",
    errCopyBtn: "त्रुटि का विवरण कॉपी करें",
    errClearBtn: "लॉग हटाएँ",
    errNone: "अभी कोई त्रुटि दर्ज नहीं है।",
    errPrompt: "नीचे दिया गया टेक्स्ट कॉपी करें",
  },
  ms: {
    quickTitle: "Mula dalam 1 minit — kalau anda baru, bermula di sini",
    quickStep1Desktop: "Di sebelah kiri, klik  ",
    quickStep1Mobile: "Pada tab di atas, ketik  ",
    // ⚠ 사이드바 라벨과 «글자까지» 같아야 한다
    quickStep1Btn: "Spot belajar",
    quickStep1After: "",
    quickStep2Before: "Buka mana-mana spot dan tekan",
    // ⚠ PresetsPage.infoBtn1·viewResults와 같은 이름
    quickStep2Btn: "[⚡ Lihat hasil]",
    quickStep2After: " — jawapannya terus keluar",
    quickStep3:
      "Selepas itu, baca “Cara membaca skrin hasil” di bawah supaya anda faham maksud angka-angkanya",

    termsTitle: "Empat istilah ini sudah memadai",
    termRange: "Range",
    defRange:
      "Kumpulan tangan yang mungkin dipegang seorang pemain, iaitu julat tangannya (contoh: “dia mungkin ada AA, KK, atau AK”)",
    defPos:
      "Out of position (bertindak dahulu — kelemahan) / in position (bertindak terakhir — kelebihan). Dalam BTN vs BB, BB ialah OOP",
    termEquity: "Equity",
    defEquity:
      "Bahagian pot yang menjadi milik anda kalau semua all-in sekarang, iaitu ekuiti — % menang campur separuh daripada % seri",
    defEv: "Expected value (nilai jangkaan) — purata hasil sesuatu aksi kalau diulang berkali-kali. Makin besar makin bagus",

    customTitleBefore: "Mengira spot tersuai — ikut nombor ",
    customTitleDesktop: "di bar sisi",
    customTitleMobile: "di tab",
    customTitleAfter: " ① → ⑤ mengikut urutan",
    step1Bold: "① Range OOP / ② Range IP",
    step1After:
      " — warnakan grid 13×13 dengan klik-dan-seret, atau taip range itu sebagai teks: ",
    step1Hint:
      "22+ = semua pocket pair · A2s+ = A2s hingga AKs · KTo+ = KTo hingga KQo. Pada grid: pepenjuru = pocket pair, kanan atas = suited, kiri bawah = offsuit",
    exampleHeader:
      "Baru di sini? Salin contoh ini dan tampal ke kotak range (standard BTN vs BB 100bb — range yang sama dengan Spot belajar)",
    exOopLabel: "OOP (BB caller)",
    exIpLabel: "IP (BTN opener)",
    copiedLabel: "Disalin!",
    copyLabel: "Salin",
    step3Bold: "③ Board",
    // ⚠ BoardSelector.randomFlop과 같은 이름
    step3After: " — klik tiga kad untuk flop, atau tekan “Flop rawak”",
    step4Bold: "④ Bet size (Tetapan)",
    step4After:
      " — biarkan nilai lalai dahulu. Cukup semak Pot permulaan dan Stack efektif",
    step4Hint:
      "Nilai dalam spot tersuai ialah cip integer dalam unit pilihan anda sendiri. Untuk berfikir dalam bb, guna 10 cip = 1bb (contoh: pot 55 = 5.5bb). Spot belajar dan Trainer GTO menggunakan skala ini secara automatik.",
    // ⚠ 사이드바 ⑤(Kira)·RunSolver의 버튼 이름들과 «글자까지» 같아야 한다
    step5Bold1: "⑤ Kira",
    step5Mid:
      " — tekan “Bina Tree”, kemudian “Jalankan Solver” selepas tree siap dibina. Sebaik sahaja “Pengiraan selesai!” muncul, buka tab ",
    step5Bold2: "[Hasil]",
    step5After: " di bahagian atas",
    step5Hint:
      "Pengiraan berjalan pada peranti anda sendiri dan mengambil masa beberapa saat hingga beberapa minit. Guna [Kongsi Spot] pada skrin ⑤ untuk menyalin pautan spot anda dan bertanya tentangnya di komuniti",

    resultsTitle: "Cara membaca skrin hasil",
    rTerm1: "Bar aksi di atas",
    rDef1:
      "Pemilih node di sepanjang laluan aksi (flop → bet → call → turn…). Klik satu node untuk melihat strategi pada titik itu",
    rTerm2: "Grid 13×13 (kiri)",
    rDef2:
      "Setiap kotak ialah satu tangan; pembahagian warna di dalamnya menunjukkan frekuensi aksi. 🟥 bet/raise (makin gelap = makin besar pertaruhannya) · 🟩 check/call · kotak malap = di luar range. GTO memainkan tangan yang sama dengan strategi campuran — aksinya dibahagikan mengikut frekuensi supaya corak permainan anda susah dibaca",
    rTerm3: "Kotak ringkasan (kanan atas)",
    rDef3: "Frekuensi aksi (%) dan bilangan combo untuk keseluruhan range",
    rTerm4: "Kategori tangan (kanan tengah)",
    rDef4:
      "Cara setiap range berinteraksi dengan board (top pair, draw, dan seterusnya) — untuk melihat sekali pandang siapa yang diuntungkan oleh board ini",
    rTerm5: "Jadual (kanan bawah)",
    rDef5:
      "Berat, equity, EV dan % aksi bagi setiap tangan — klik tajuk lajur untuk mengisih",

    trainerTitle: "Trainer GTO — daripada memerhati kepada bermain",
    trainerIntroBefore:
      "Selepas anda selesa membaca skrin hasil, teruskan ke",
    trainerBtn: "Trainer GTO",
    trainerIntroAfter:
      ". Pada titik keputusan daripada 13 Spot belajar, anda diberi tangan yang diambil daripada range sebenar — pilih satu aksi dan anda terus dinilai.",
    gradTerm: "Cara penilaian",
    gradBefore: "Anda tidak dinilai betul atau salah, sebaliknya berdasarkan ",
    gradBold: "kerugian EV (bb)",
    gradAfter:
      ". GTO mencampurkan beberapa aksi dengan tangan yang sama, jadi aksi berfrekuensi rendah belum tentu satu kesilapan — yang penting ialah berapa banyak EV yang dilepaskan",
    verdictTerm: "Ambang penilaian",
    verdictBefore: "Diukur ",
    verdictBold: "berbanding pot",
    // ⚠ 판정명은 TrainerPage.verdictBest·verdictGood·verdictMiss와 «글자까지» 같아야 한다
    verdictAfter:
      " — sehingga 0.35% pot = Pilihan terbaik · sehingga 1% = Boleh diterima · lebih daripada itu = Perlu disemak. Contohnya, dalam single raised pot (SRP) 5.5bb ambangnya 0.02bb dan 0.06bb; dalam pot 3-bet 22.5bb, 0.08bb dan 0.23bb.",
    verdictHint:
      "Kerugian 0.08bb yang sama ialah kesilapan besar dalam pot kecil tetapi remeh dalam pot besar. Penilaian dalam bb mutlak membuatkan pot 3-bet kelihatan lebih teruk daripada keadaan sebenar, jadi kami beralih kepada penilaian berbanding pot (15/08/2026). Ambang ini ada had bawah (0.02bb / 0.05bb): pengiraan hanya menumpu sehingga sasaran exploitability 0.5%, jadi beza yang lebih kecil daripada itu tidak dapat dibezakan daripada noise solver.",
    reviewTerm: "Semak semula",
    reviewBefore:
      "Tangan yang paling banyak membuang EV anda akan muncul semula melalui butang [Semak semula]. Secara lalai, rekod anda disimpan ",
    // ⚠ 앱의 «신뢰 약속» — ErrorToast.bodyB1·TrainerPage.localOnlyBold와 «글자까지» 같아야 한다
    reviewBold: "hanya pada peranti ini",
    reviewAfter:
      ". Log masuk dengan akaun HoldemMaster untuk menyimpannya dalam akaun anda dan menyambung semula pada peranti lain — log masuk tidak diwajibkan, semuanya tetap berfungsi tanpa log masuk",
    filterTerm: "Penapis",
    filterDef:
      "Fokus pada titik lemah anda sahaja: single raised pot, pot 3-bet, atau blind vs blind",

    installTitle: "Tambah ke skrin utama dan belajar di luar talian",
    install1:
      "Solver ini boleh anda pasang pada skrin utama seperti aplikasi (tiada fail pemasangan). Dalam Chrome atau Edge, guna ",
    installBold1: "ikon pasang",
    install2: " di sebelah kanan bar alamat; dalam Safari pada iPhone, ketik ",
    // ⚠ InstallBanner.iosB2(Apple 말레이어 메뉴명)와 같은 표기
    installBold2: "Kongsi → Tambah ke Skrin Utama",
    install3:
      ". Selepas dipasang, 13 Spot belajar dan soalan Trainer GTO tersimpan pada peranti anda, jadi anda boleh terus belajar ",
    installBold3: "walaupun dalam LRT tanpa internet",
    install4: ".",
    samsung1:
      "* Apabila anda memasang daripada Samsung Internet, pelayar atau peranti anda mungkin menyekatnya atas sebab keselamatan. Pemeriksaan itu datang daripada pelayar, bukan daripada aplikasi ini. ",
    samsungBold: "Buka laman ini dalam Chrome",
    samsung2:
      " dan pemasangan berjalan tanpa sekatan; kalau anda mahu teruskan di sini, ikut arahan dalam kotak dialog itu.",
    offlineDataLabel: "Data belajar luar talian",
    offlineSaved: "Tersimpan — Spot belajar dan Trainer GTO berfungsi tanpa internet",
    offlineSaving: "Sedang menyimpan…",
    offlineNotSaved: "Belum disimpan",
    offlineSaveBtn: "Simpan sekarang (~2.3 MB)",
    offlineFootnote:
      "Pengiraan spot tersuai hanya berfungsi di luar talian selepas anda menjalankannya sekurang-kurangnya sekali secara dalam talian — enjin solver dimuat turun pada penggunaan pertama.",

    safeTitle: "Selamatkah untuk dipasang?",
    safe1:
      "Selamat. “Pasang” di sini bukan bermakna memuat turun program ke peranti anda — sebaliknya ",
    safeBold: "membuat pintasan yang berjalan di dalam pelayar anda",
    safe2:
      ". Pada Android, yang didaftarkan hanyalah pintasan ringkas ke alamat ini; semuanya tetap berjalan dalam enjin pelayar. Kalau anda masih ragu, periksa sendiri empat perkara berikut — memeriksa lebih baik daripada sekadar percaya kata kami.",
    permTerm: "Tiada kebenaran digunakan",
    permBefore:
      "Pemasangan tidak meminta sebarang kebenaran — tiada kamera, kenalan, SMS mahupun lokasi. Periksa sendiri di ",
    permBold: "Tetapan → Maklumat apl → Kebenaran",
    permAfter: " pada telefon anda",
    airplaneTerm: "Uji dengan mod pesawat",
    airplaneBefore:
      "Matikan internet dan Trainer GTO tetap berjalan — bukti paling jelas bahawa pengiraan ",
    airplaneBold: "berlaku sepenuhnya pada peranti anda",
    airplaneAfter: "",
    openTerm: "Kod sumbernya terbuka",
    openBefore: "Solver ini ialah open source di bawah lesen AGPL-3.0 (",
    openAfter: ")",
    removeTerm: "Boleh dibuang dengan bersih",
    removeDef:
      "Tekan lama ikonnya lalu padam, seperti aplikasi lain, dan selesai. Tiada apa-apa yang berjalan di latar belakang, tiada apa-apa yang tertinggal",
    samsungNote2:
      "* Sekatan keselamatan dalam Samsung Internet bukan pengesanan malware — pelayar itu cuma belum mengenali jenis pakej pemasangan ini. Sekatan itu tidak muncul kalau anda memasang daripada Chrome.",

    studyTitle: "Cadangan cara belajar",
    study1:
      "Selesaikan 13 Spot belajar mengikut urutan — setiap spot dibina di atas spot sebelumnya",
    study2:
      "Kalau anda tertanya-tanya “kenapa tangan ini kadang-kadang check?”, bandingkan EV setiap aksi dalam jadual terperinci",
    study3:
      "Main semula spot yang sama dalam Trainer GTO supaya lebih mudah diingat — laporan kelemahan menunjukkan situasi mana yang paling banyak menghabiskan EV anda",
    study4: "Kekalkan range-nya, tukar board sahaja, kemudian bandingkan (contoh: A72 vs 974)",
    study5:
      "Bina semula tangan yang mengelirukan anda semasa main sebenar, kemudian semak hasilnya di sini",

    troubleTitle: "Kalau ada masalah",
    tTerm1: "Ralat semasa membina tree",
    tDef1: "Pastikan 3 kad board dan kedua-dua range sudah diisi",
    tTerm2: "Pengiraan lambat",
    tDef2: "Naikkan sasaran exploitability kepada 0.5%",
    tTerm3: "Tab Hasil kosong",
    tDef3: "Buka selepas “Pengiraan selesai!” muncul",
    tTerm4: "Had memori dilampaui",
    tDef4: "Tukar kepada mod integer 16-bit, atau kurangkan bilangan bet size",
    tTerm5: "Grid kelabu semuanya",
    tDef5:
      "Anda sedang melihat giliran lawan — pilih node lain pada bar aksi di bahagian atas",

    errTitle: "Jumpa sesuatu yang perlu kami baiki?",
    err1: "Kalau paparan rosak atau pengiraan tersekat, butiran ralatnya dicatat secara automatik pada peranti ini. ",
    // ⚠ ErrorToast.bodyB1·TrainerPage.localOnlyBold·reviewBold와 같은 약속이다
    errBold: "Rekod ini tidak pernah keluar daripada peranti anda",
    err2:
      " — kami hanya melihatnya kalau anda menyalinnya di bawah dan menyiarkannya di komuniti. Isinya hanya mesej ralat dan jenis pelayar — tidak pernah range atau rekod belajar anda.",
    errLoggedLabel: "Ralat tercatat",
    errCount: (n: number) => `${n}`,
    errCopied: "Disalin",
    errCopyBtn: "Salin butiran ralat",
    errClearBtn: "Kosongkan rekod",
    errNone: "Belum ada ralat yang tercatat.",
    errPrompt: "Salin teks di bawah",
  },
} as const;

/* npokers 빌드에서 설치 문단의 «교육 예제·트레이너 저장» 대목만 «앱 저장»으로 바꾼다.
 * (그 밖의 트레이너 언급은 위 template의 v-if="FEATURE_TRAINER"가 문단째 숨긴다)
 * 죽은 쪽 사전은 압축 단계에서 번들에서 빠진다. */
declare const __APP_TARGET__: "trainer" | "npokers";
const N =
  __APP_TARGET__ === "npokers"
    ? {
        ko: {
          exampleHeader:
            "처음이라면 이 예시를 복사해서 레인지 입력칸에 붙여넣으세요 (BTN vs BB 100bb 표준)",
          step4Hint:
            "커스텀 계산의 입력값은 임의의 정수 칩 단위입니다. bb로 보려면 10칩=1bb로 입력하세요(예: 팟 55 = 5.5bb).",
          airplaneBefore: "인터넷을 끄고도 앱이 그대로 돌아갑니다. 계산이 ",
          install3: "입니다. 설치하면 앱이 기기에 저장돼 ",
          install4: " 그대로 쓸 수 있습니다.",
        },
        en: {
          exampleHeader:
            "New here? Copy these and paste them into the range inputs (standard BTN vs BB 100bb)",
          step4Hint:
            "Custom-spot inputs are in arbitrary integer chips. To think in bb, use 10 chips = 1bb (e.g., pot 55 = 5.5bb).",
          airplaneBefore:
            "Turn the internet off and the app keeps working — the clearest proof that the computation ",
          install3: ". Once installed, the app is stored on your device, so you can keep using it ",
          install4: ".",
        },
        ja: {
          exampleHeader:
            "初めての方はこの例をコピーしてレンジ入力欄に貼り付けてください（BTN vs BB 100bb標準）",
          step4Hint:
            "カスタム計算の入力値は任意の整数チップ単位です。bbで考えるには10チップ=1bbとして入力してください（例: ポット55 = 5.5bb）。",
          airplaneBefore: "インターネットを切ってもアプリはそのまま動きます。計算が ",
          install3: " です。インストールするとアプリが端末に保存され、",
          install4: " そのまま使えます。",
        },
        es: {
          exampleHeader:
            "¿Primera vez? Copia estos ejemplos y pégalos en los campos de rango (BTN vs BB 100bb estándar)",
          step4Hint:
            "Los valores del spot personalizado usan fichas enteras arbitrarias. Para pensar en bb, usa 10 fichas = 1bb (ej. bote 55 = 5.5bb).",
          airplaneBefore:
            "Apaga el internet y la app sigue funcionando — la prueba más clara de que el cálculo ",
          install3: ". Una vez instalado, la app queda guardada en tu dispositivo, para que puedas seguir usándola ",
          install4: ".",
        },
        pt: {
          exampleHeader:
            "É a sua primeira vez? Copie estes exemplos e cole nos campos de range (padrão BTN vs BB 100bb)",
          step4Hint:
            "Os valores do spot personalizado usam fichas inteiras arbitrárias. Para raciocinar em bb, use 10 fichas = 1bb (ex.: pote 55 = 5,5bb).",
          airplaneBefore:
            "Desligue a internet e o app continua funcionando — a prova mais clara de que o cálculo ",
          install3: ". Depois de instalado, o app fica salvo no seu dispositivo, para você continuar usando ",
          install4: ".",
        },
        de: {
          exampleHeader:
            "Zum ersten Mal hier? Kopiere diese Beispiele in die Range-Felder (Standard BTN vs BB 100bb)",
          step4Hint:
            "Die Werte im eigenen Spot sind ganze Chips in einer frei wählbaren Einheit. Wenn du in bb denken willst, nimm 10 Chips = 1bb (z. B. Pot 55 = 5,5bb).",
          airplaneBefore:
            "Schalte das Internet ab und die App läuft weiter – der klarste Beweis dafür, dass die Berechnung ",
          install3: ". Nach der Installation liegt die App auf deinem Gerät, sodass du sie ",
          install4: " weiter nutzen kannst.",
        },
        zh: {
          exampleHeader:
            "第一次用的话，把下面这两段示例复制粘贴到范围输入框里（BTN vs BB 100bb 标准）",
          step4Hint:
            "自己算的时候，输入的数值用的是任意整数筹码单位。想按 bb 来看，就用 10 筹码 = 1bb 输入（比如底池 55 就是 5.5bb）。",
          airplaneBefore: "断网之后应用照样能跑。这就是",
          install3: "。装好之后，应用会存到设备里，",
          install4: "也照样能用。",
        },
        "zh-hant": {
          exampleHeader:
            "第一次用的話，把下面這兩段範例複製貼上到範圍輸入框裡（BTN vs BB 100bb 標準）",
          step4Hint:
            "自己算的時候，輸入的數值用的是任意整數籌碼單位。想按 bb 來看，就用 10 籌碼 = 1bb 輸入（比如底池 55 就是 5.5bb）。",
          airplaneBefore: "斷網之後應用程式照樣能跑。這就是",
          install3: "。裝好之後，應用程式會存到裝置裡，",
          install4: "也照樣能用。",
        },
        fr: {
          exampleHeader:
            "Nouveau ici ? Copie ces exemples et colle-les dans les champs de range (BTN vs BB 100bb standard)",
          step4Hint:
            "Les valeurs du spot personnalisé sont des jetons entiers, dans l'unité de ton choix. Pour raisonner en bb, prends 10 jetons = 1bb (ex. pot 55 = 5,5bb).",
          airplaneBefore:
            "Coupe internet et l'app continue de marcher — la preuve la plus claire que le calcul ",
          install3: ". Une fois installée, l'app est stockée sur ton appareil, pour continuer à l'utiliser ",
          install4: ".",
        },
        // ⚠ npokers 빌드 — Trainer·latihan·Spot belajar 어휘가 새면 npokers-verify(FORBIDDEN id)가 잡는다
        id: {
          exampleHeader:
            "Baru di sini? Salin contoh ini dan tempel ke kolom range (standar BTN vs BB 100bb)",
          step4Hint:
            "Nilai di spot kustom adalah chip bilangan bulat dalam satuan yang Anda pilih sendiri. Untuk berpikir dalam bb, pakai 10 chip = 1bb (contoh: pot 55 = 5,5bb).",
          airplaneBefore:
            "Matikan internet dan aplikasi tetap berjalan — bukti paling jelas bahwa perhitungan ",
          install3: ". Setelah terpasang, aplikasi tersimpan di perangkat Anda, jadi Anda tetap bisa memakainya ",
          install4: ".",
        },
        // ⚠ npokers 빌드 — Trainer·latihan·Spot belajar 어휘가 새면 npokers-verify(FORBIDDEN ms)가 잡는다
        hi: {
          exampleHeader: "पहली बार इस्तेमाल कर रहे हैं? इन्हें कॉपी करके range इनपुट में पेस्ट करें (सामान्य BTN बनाम BB 100bb)",
          rDef1: "अपने स्पॉट की गणना के बाद, एक्शन क्रम में कोई node चुनकर उसकी रणनीति देखें (flop → bet → call → turn…)।",
          step4Hint: "अपने स्पॉट के इनपुट पूर्णांक chips में हैं। bb में समझने के लिए 10 chips = 1bb मानें (जैसे pot 55 = 5.5bb)।",
          airplaneBefore: "ऐप सेव होने के बाद इंटरनेट बंद करके इसे खोलें। इससे जाँच सकते हैं कि इसे चलाने के लिए ",
          install3: " चुनें। इंस्टॉल होने पर ऐप डिवाइस पर सेव हो जाता है। आप ",
          install4: " इसका इस्तेमाल कर सकते हैं।",
        },
        ms: {
          exampleHeader:
            "Baru di sini? Salin contoh ini dan tampal ke kotak range (standard BTN vs BB 100bb)",
          step4Hint:
            "Nilai dalam spot tersuai ialah cip integer dalam unit pilihan anda sendiri. Untuk berfikir dalam bb, guna 10 cip = 1bb (contoh: pot 55 = 5.5bb).",
          airplaneBefore:
            "Matikan internet dan aplikasi tetap berjalan — bukti paling jelas bahawa pengiraan ",
          install3: ". Selepas dipasang, aplikasi tersimpan pada peranti anda, jadi anda boleh terus menggunakannya ",
          install4: ".",
        },
      }
    : null;


export default defineComponent({
  setup() {
    const copied = ref("");
    const L = computed(() =>
      N ? { ...M[i18n.locale], ...N[i18n.locale] } : M[i18n.locale]
    );
    /* 두 조각을 잇는 공백 — CJK는 낱말을 띄우지 않으므로 넣으면 벌어져 보인다.
     * (같은 문장을 쓰는 PresetsPage 배너는 공백 없이 붙는다 — 화면끼리 어긋나 있었다) */
    const sentenceGap = computed(() =>
      i18n.locale === "ja" || i18n.locale === "zh" || i18n.locale === "zh-hant" ? "" : " "
    );

    // 사용법 화면을 열 때마다 실제 저장 상태를 서비스워커에 물어본다
    checkOfflineStatus();

    const errorsCopied = ref(false);
    const copyErrors = async () => {
      try {
        await navigator.clipboard.writeText(errorReportText());
        errorsCopied.value = true;
      } catch {
        window.prompt(L.value.errPrompt, errorReportText());
      }
    };

    // 교육 예제(BTN vs BB 싱글레이즈팟)와 동일한 100bb 표준 레인지 (presets.ts 참조)
    const exampleRanges = computed(() => [
      {
        label: L.value.exOopLabel,
        text: "TT-22,AJs-A2s,KJs-K2s,QJs-Q2s,J4s+,T6s+,96s+,85s+,75s+,64s+,54s,AJo-A2o,K9o+,Q9o+,J9o+,T8o+,98o",
      },
      {
        label: L.value.exIpLabel,
        text: "22+,A2s+,K5s+,Q6s+,J7s+,T7s+,97s+,86s+,75s+,64s+,54s,A2o+,K9o+,Q9o+,J9o+,T8o+,98o",
      },
    ]);

    const copyRange = async (ex: { label: string; text: string }) => {
      try {
        await navigator.clipboard.writeText(ex.text);
      } catch {
        // clipboard API를 못 쓰는 환경 폴백
        const ta = document.createElement("textarea");
        ta.value = ex.text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      copied.value = ex.label;
      setTimeout(() => (copied.value = ""), 1500);
    };

    return {
      sentenceGap,
      store: useStore(),
      FEATURE_TRAINER,
      exampleRanges,
      copyRange,
      copied,
      pwa,
      saveOffline,
      errorState,
      errorsCopied,
      copyErrors,
      clearErrors,
      L,
    };
  },
});
</script>

<style scoped>
/*
 * 톤 정리 (2026-08-15) — 트레이너에서 확정된 원칙을 사용법에도 적용.
 * 제목 색을 파랑에서 흰색으로 바꾸고 강조는 왼쪽 막대에만 남긴다.
 * 파란 글씨가 페이지마다 반복되면 «링크인가?» 싶어 위계가 흐려진다.
 */
.guide-h {
  @apply mt-7 mb-2.5 text-base font-bold text-neutral-100;
  @apply border-l-4 border-blue-600 pl-2.5;
}
/* 표를 «카드»로 만들어 문단과 구분한다 (전부 같은 회색 평면이 문제였다) */
.guide-table {
  @apply w-full text-sm overflow-hidden rounded-xl border border-neutral-700;
}
.guide-table td {
  @apply border-t border-neutral-700 px-3 py-2 align-top;
}
.guide-table tr:first-child td {
  @apply border-t-0;
}
.guide-table .term {
  @apply font-semibold text-neutral-200 whitespace-nowrap bg-neutral-800/70;
  @apply border-r border-neutral-700;
}
.guide-steps {
  @apply ml-5 list-none space-y-2.5 text-sm;
}
.hint {
  @apply mt-0.5 text-xs text-neutral-500;
}
code {
  @apply bg-neutral-800 px-1.5 py-0.5 rounded text-xs;
}
.link-like {
  @apply text-blue-400 underline font-semibold;
}
</style>
