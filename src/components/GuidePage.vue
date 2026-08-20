<template>
  <div class="max-w-3xl pb-8">
    <!-- 빠른 시작 -->
    <div
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
          {{ L.quickStep2Before }}
          <span class="font-semibold text-emerald-300">{{ L.quickStep2Btn }}</span>
          {{ L.quickStep2After }}
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
    <h3 class="guide-h">{{ L.trainerTitle }}</h3>
    <p class="text-sm text-neutral-400 leading-relaxed">
      {{ L.trainerIntroBefore }}
      <button class="link-like" @click="store.sideView = 'trainer'">
        {{ L.trainerBtn }}
      </button>
      {{ L.trainerIntroAfter }}
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

    <!-- 홈 화면 설치 · 오프라인 -->
    <h3 class="guide-h">{{ L.installTitle }}</h3>
    <p class="text-sm text-neutral-400 leading-relaxed">
      {{ L.install1 }}<b class="text-neutral-200">{{ L.installBold1 }}</b>{{ L.install2 }}<b class="text-neutral-200">{{ L.installBold2 }}</b>{{ L.install3 }}<b class="text-neutral-200">{{ L.installBold3 }}</b>{{ L.install4 }}
    </p>
    <p class="mt-1.5 text-xs text-neutral-500 leading-relaxed">
      {{ L.samsung1 }}<b class="text-neutral-300">{{ L.samsungBold }}</b>{{ L.samsung2 }}
    </p>
    <div
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
      <li>{{ L.study1 }}</li>
      <li>{{ L.study2 }}</li>
      <li>
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
import { errorState, errorReportText, clearErrors } from "../errors";
import { i18n } from "../i18n";

const M = {
  ko: {
    quickTitle: "1분 시작 — 처음이라면 이것부터",
    quickStep1Desktop: "왼쪽에서",
    quickStep1Mobile: "위쪽 탭에서",
    quickStep1Btn: "교육 예제",
    quickStep1After: "클릭",
    quickStep2Before: "아무 예제나",
    quickStep2Btn: "[⚡ 결과 바로 보기]",
    quickStep2After: "클릭 — 결과가 바로 나옵니다",
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
      "로 넘어가세요. 교육 예제 13개의 결정 지점에서 실제 레인지대로 뽑은 핸드를 받고, 액션을 고르면 채점해줍니다.",
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
      "같은 0.05bb라도 작은 팟에서는 큰 실수고 큰 팟에서는 사소한 차이입니다. 절대 bb로 재면 3벳팟이 실제보다 나쁘게 보여서 팟 대비로 바꿨습니다(2026-08-15). 경계에는 하한(0.02bb·0.05bb)이 있는데, 계산을 목표 오차 0.5%까지만 수렴시키므로 그보다 작은 차이는 계산 노이즈와 구분되지 않기 때문입니다.",
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
    quickStep1Desktop: "On the left, click",
    quickStep1Mobile: "In the tabs above, click",
    quickStep1Btn: "Study Spots",
    quickStep1After: "",
    quickStep2Before: "Open any spot and hit",
    quickStep2Btn: "[⚡ View results]",
    quickStep2After: "— the solution appears immediately",
    quickStep3:
      'Then use "Reading the Results Screen" below to make sense of the numbers',

    termsTitle: "Four terms are all you need",
    termRange: "Range",
    defRange:
      "The set of hands a player could be holding (e.g. \"they've probably got AA, KK, or AK\")",
    defPos:
      "Out of position (acts first — a disadvantage) / in position (acts last — an advantage). In BTN vs BB, the BB is OOP",
    termEquity: "Equity",
    defEquity: "Your share of the pot if all-in right now — your win chance (%)",
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
    exOopLabel: "OOP (BB caller)",
    exIpLabel: "IP (BTN opener)",
    copiedLabel: "Copied!",
    copyLabel: "Copy",
    step3Bold: "③ Board",
    step3After: ' — click three flop cards, or hit "Random Flop"',
    step4Bold: "④ Bet Sizes (Tree Settings)",
    step4After:
      " — leave the defaults at first. Just check the starting pot and effective stack",
    step4Hint:
      "Custom-spot inputs are in arbitrary integer chips. To think in bb, use 10 chips = 1bb (e.g. pot 55 = 5.5bb). The Study Spots and Trainer convert on this scale automatically.",
    step5Bold1: "⑤ Run Solver",
    step5Mid:
      ' — hit "Build Tree", then "Run Solver" when it finishes. Once "Solver finished!" appears, open the ',
    step5Bold2: "[Results]",
    step5After: " tab at the top",
    step5Hint:
      "Solving runs on your own machine and takes a few seconds to a few minutes. Use [Share Spot] on screen ⑤ to copy a link to your spot and ask about it in the community",

    resultsTitle: "Reading the Results Screen",
    rTerm1: "Top strip",
    rDef1:
      "A scene picker for the action line (flop → bet → call → turn...). Click a node to see the strategy at that point",
    rTerm2: "13×13 matrix (left)",
    rDef2:
      "Each cell is a hand; the color split inside it shows action frequencies. 🟥 bet/raise (darker = bigger bet) · 🟩 check/call · dimmed cell = not in the range. GTO plays the same hand as a mixed strategy — splitting actions by frequency so your pattern can't be read",
    rTerm3: "Tiles (top right)",
    rDef3: "Action frequencies (%) and combo counts across the whole range",
    rTerm4: "Hand categories (middle right)",
    rDef4:
      "How each range connects with the board (top pair, draws...) — a quick read on who this board favors",
    rTerm5: "Table (bottom right)",
    rDef5:
      "Per-hand weight, equity, EV, and action % — click a column header to sort",

    trainerTitle: "GTO Trainer — from watching to playing",
    trainerIntroBefore:
      "Once you're comfortable reading the results screen, move on to the",
    trainerBtn: "GTO Trainer",
    trainerIntroAfter:
      ". At decision points from the 13 Study Spots, you're dealt hands drawn from the actual ranges — pick an action and it grades you.",
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
      "The same 0.05bb is a big mistake in a small pot and a trivial one in a big pot. Grading in absolute bb made 3-bet pots look worse than they are, so we switched to pot-relative grading (2026-08-15). The cutoffs have floors (0.02bb / 0.05bb): solves only converge to a target exploitability of 0.5%, so differences smaller than that can't be distinguished from solver noise.",
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
    install2: " at the right of the address bar; in Safari on iPhone, tap ",
    installBold2: "Share → Add to Home Screen",
    install3:
      ". Once installed, the 13 Study Spots and the Trainer drills are stored on your device, so you can keep studying ",
    installBold3: "even on the subway with no internet",
    install4: ".",
    samsung1:
      '* Installing from Samsung Internet triggers an "Unsafe app blocked" warning. It appears because Google doesn\'t trust the install package that browser generates — it has nothing to do with this app. ',
    samsungBold: "Open the site in Chrome",
    samsung2:
      " and it installs with no warning; or, to proceed anyway, tap [More details] → [Install anyway] on the warning dialog.",
    offlineDataLabel: "Offline study data",
    offlineSaved: "Saved — Study Spots and Trainer work without internet",
    offlineSaving: "Saving…",
    offlineNotSaved: "Not saved",
    offlineSaveBtn: "Save now (~2.3MB)",
    offlineFootnote:
      "Custom-spot solving works offline only after you've run it online at least once — the solver engine is downloaded on first use.",

    safeTitle: "Is it safe to install?",
    safe1:
      'Yes. "Installing" here doesn\'t mean downloading a program onto your device — it means ',
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
      '* The "Unsafe app blocked" warning in Samsung Internet is not malware detection — Google just hasn\'t added that browser\'s install packages to its trust list yet. It doesn\'t appear when you install from Chrome.',

    studyTitle: "Suggested study plan",
    study1:
      "Work through the 13 Study Spots in order — they're a curriculum that builds as a series",
    study2:
      'Wondering "why does this hand mix in checks?" — compare per-action EVs in the detail table',
    study3:
      "Drill the same spots in the GTO Trainer to make them stick — the weakness report shows which situations cost you the most EV",
    study4: "Keep the ranges, change only the board, and compare (e.g. A72 vs 974)",
    study5:
      "Recreate hands that confused you in real games and review them here",

    troubleTitle: "Troubleshooting",
    tTerm1: "Tree build error",
    tDef1: "Make sure 3 board cards and both ranges are entered",
    tTerm2: "Solving is slow",
    tDef2: "Raise the target exploitability to 0.5%",
    tTerm3: "Results tab is blank",
    tDef3: 'Open it after "Solver finished!" appears',
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
    quickStep2Before: "どれか一つのスポットを開いて",
    quickStep2Btn: "[⚡ 結果をすぐ見る]",
    quickStep2After: "をクリック — 結果がすぐに表示されます",
    quickStep3:
      "下の「結果画面の読み方」を見ながら数字を解釈してみましょう",

    termsTitle: "必須用語は4つだけ",
    termRange: "レンジ",
    defRange:
      "プレイヤーが持っている可能性のあるハンドの集合（例:「相手はAA・KK・AKのどれかだろう」）",
    defPos:
      "先に行動する側（不利）／後に行動する側（有利）。BTN vs BB では BB が OOP",
    termEquity: "エクイティ",
    defEquity: "エクイティ（勝率）— 今この時点で勝てる確率(%)",
    defEv: "期待値 — このアクションで平均どれだけ勝てるか。大きいほど良い",

    customTitleBefore: "カスタムスポットの計算 — ",
    customTitleDesktop: "サイドバー",
    customTitleMobile: "上のタブ",
    customTitleAfter: "の番号 ①→⑤ の順にそのまま",
    step1Bold: "① OOPレンジ / ② IPレンジ",
    step1After:
      " — 13×13の表をクリック・ドラッグで塗るか、テキストで入力: ",
    step1Hint:
      "22+ = すべてのポケットペア · A2s+ = A2s〜AKs · KTo+ = KTo〜KQo。表では対角線=ポケットペア、右上=スーテッド、左下=オフスート",
    exampleHeader:
      "初めての方はこの例をコピーしてレンジ入力欄に貼り付けてください（BTN vs BB 100bb標準 — 学習スポットと同じレンジ）",
    exOopLabel: "OOP (BBコーラー)",
    exIpLabel: "IP (BTNオープン)",
    copiedLabel: "コピーしました！",
    copyLabel: "コピー",
    step3Bold: "③ ボード",
    step3After: " — フロップ3枚をクリックするか「ランダムフロップ」",
    step4Bold: "④ ベットサイズ（ツリー設定）",
    step4After:
      " — 最初はデフォルトのままで。スターティングポットと有効スタックだけ確認",
    step4Hint:
      "カスタム計算の入力値は任意の整数チップ単位です。bbで考えるには10チップ=1bbとして入力してください（例: ポット55 = 5.5bb）。学習スポットとトレーナーはこの基準で自動換算して表示します。",
    step5Bold1: "⑤ 計算実行",
    step5Mid:
      " — 「新しいツリーを作成」→ 完了したら「ソルバー実行」→「計算完了！」が表示されたら上部の ",
    step5Bold2: "[結果]",
    step5After: " タブをクリック",
    step5Hint:
      "計算はお使いの端末上で行われ、数秒〜数分かかります。作ったスポットは⑤画面の[スポット共有]でリンクをコピーして、コミュニティで質問できます",

    resultsTitle: "結果画面の読み方",
    rTerm1: "上部ストリップ",
    rDef1:
      "アクションの流れ（フロップ→ベット→コール→ターン...）のシーン選択。クリックした時点の戦略を表示します",
    rTerm2: "左の13×13マトリクス",
    rDef2:
      "マス=ハンド、マスの中の色の比率=アクションの割合。🟥 ベット/レイズ（濃いほど大きなベット）· 🟩 チェック/コール · 暗いマス=レンジにない。GTOは同じハンドでもアクションを「頻度で混ぜます」— パターンを読まれないためです",
    rTerm3: "右上のタイル",
    rDef3: "レンジ全体でのアクション頻度(%)とコンボ数",
    rTerm4: "右中央の分類",
    rDef4:
      "レンジがボードに何をヒットしているか（トップペア・ドローなど）—「このボードがどちらに有利か」が一目でわかります",
    rTerm5: "右下の表",
    rDef5:
      "ハンドごとの比重・エクイティ・EV・アクション%の数値。列見出しをクリックで並べ替え",

    trainerTitle: "GTOトレーナー — 見るだけから自分で解く段階へ",
    trainerIntroBefore: "結果画面の読み方に慣れてきたら",
    trainerBtn: "GTOトレーナー",
    trainerIntroAfter:
      "に進みましょう。13個の学習スポットの決定ポイントで、実際のレンジから引いたハンドが配られ、アクションを選ぶと採点してくれます。",
    gradTerm: "採点方式",
    gradBefore: "正解/不正解ではなく ",
    gradBold: "EVロス(bb)",
    gradAfter:
      "で評価します。GTOは同じハンドでも複数のアクションを混ぜるため、「頻度の低いアクション」が即ミスというわけではありません — どれだけ損をしたかが基準です",
    verdictTerm: "判定基準",
    verdictBefore: "",
    verdictBold: "ポット比",
    verdictAfter:
      "で測ります — ポットの0.35%以下 = 最適 · 1%以下 = 許容範囲 · それ以上 = 復習すべきスポット。例えばポット5.5bbのシングルレイズポットでは0.02bb・0.06bb、ポット22.5bbの3ベットポットでは0.08bb・0.23bbが境界です。",
    verdictHint:
      "同じ0.05bbでも、小さいポットでは大きなミス、大きいポットでは些細な差です。絶対bbで測ると3ベットポットが実際より悪く見えるため、ポット比の採点に変更しました(2026-08-15)。境界には下限(0.02bb・0.05bb)があります。計算は目標誤差0.5%までしか収束させないため、それより小さい差は計算ノイズと区別できないからです。",
    reviewTerm: "復習",
    reviewBefore:
      "EVロスが大きかった問題は[復習]ボタンで再出題されます。記録はデフォルトで ",
    reviewBold: "この端末の中だけに",
    reviewAfter:
      " 保存されます。HoldemMasterアカウントでログインすると記録がアカウントに保管され、他の端末でも続きから解けます — ログインは任意で、すべての機能はログインなしで使えます",
    filterTerm: "フィルター",
    filterDef:
      "シングルレイズポット / 3ベットポット / ブラインドバトルから、苦手な状況だけ選んで練習",

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
      "※ Samsung Internetからインストールすると「安全でないアプリをブロックしました」という警告が出ます。このブラウザが作るインストールパッケージをGoogleが信頼していないために起きる問題で、アプリ自体とは無関係です。",
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
    tDef3: "「計算完了！」が表示されてからクリック",
    tTerm4: "メモリ上限超過",
    tDef4: "16ビット整数モードを選ぶか、ベットサイズの数を減らす",
    tTerm5: "マトリクスが灰色だけ",
    tDef5:
      "相手の手番のスポットを見ています — 上部ストリップで別のシーンをクリック",

    errTitle: "直すべき問題を見つけたら",
    err1: "画面が崩れたり計算が止まったりすると、この端末にエラー内容が自動的に記録されます。",
    errBold: "記録が端末の外に出ることはありません",
    err2:
      " — 下からコピーしてコミュニティに投稿していただければ、その時に私たちが確認します。レンジや学習記録などの内容は含まれず、エラーメッセージとブラウザの種類だけが入ります。",
    errLoggedLabel: "記録されたエラー",
    errCount: (n: number) => `${n}件`,
    errCopied: "コピーしました",
    errCopyBtn: "エラー内容をコピー",
    errClearBtn: "記録を消去",
    errNone: "まだ記録されたエラーはありません。",
    errPrompt: "以下の内容をコピーしてください",
  },
  es: {
    quickTitle: "Empieza en 1 minuto — si eres nuevo, comienza aquí",
    quickStep1Desktop: "A la izquierda, haz clic en",
    quickStep1Mobile: "En las pestañas de arriba, toca",
    quickStep1Btn: "Spots de estudio",
    quickStep1After: "",
    quickStep2Before: "Abre cualquier spot y toca",
    quickStep2Btn: "[⚡ Ver resultados]",
    quickStep2After: "— la solución aparece de inmediato",
    quickStep3:
      "Luego usa «Cómo leer la pantalla de resultados» más abajo para interpretar los números",

    termsTitle: "Solo necesitas cuatro términos",
    termRange: "Rango",
    defRange:
      "El conjunto de manos que un jugador podría tener (ej. «seguro trae AA, KK o AK»)",
    defPos:
      "Fuera de posición (actúa primero — desventaja) / en posición (actúa al final — ventaja). En BTN vs BB, el BB está OOP",
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
    exIpLabel: "IP (BTN open)",
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
      "Un selector de escenas de la línea de acción (flop → bet → call → turn...). Haz clic en un nodo para ver la estrategia en ese punto",
    rTerm2: "Matriz 13×13 (izquierda)",
    rDef2:
      "Cada celda es una mano; la división de colores muestra las frecuencias de acción. 🟥 bet/raise (más oscuro = bet más grande) · 🟩 check/call · celda apagada = fuera del rango. El GTO juega la misma mano como estrategia mixta — reparte las acciones por frecuencia para que no puedan leer tu patrón",
    rTerm3: "Mosaicos (arriba a la derecha)",
    rDef3: "Frecuencias de acción (%) y número de combos de todo el rango",
    rTerm4: "Clasificación (centro derecha)",
    rDef4:
      "Qué conectó cada rango con el board (top pair, proyectos...) — una lectura rápida de a quién favorece este board",
    rTerm5: "Tabla (abajo a la derecha)",
    rDef5:
      "Peso, equity, EV y % de acción por mano — haz clic en el encabezado de una columna para ordenar",

    trainerTitle: "Entrenador GTO — de mirar a jugar",
    trainerIntroBefore:
      "Cuando ya te sientas cómodo leyendo la pantalla de resultados, pasa al",
    trainerBtn: "Entrenador GTO",
    trainerIntroAfter:
      ". En los puntos de decisión de los 13 Spots de estudio recibes manos sacadas de los rangos reales — eliges una acción y te califica.",
    gradTerm: "Cómo califica",
    gradBefore: "No se califica como correcto/incorrecto sino por ",
    gradBold: "pérdida de EV (bb)",
    gradAfter:
      ". El GTO mezcla varias acciones con la misma mano, así que una acción de baja frecuencia no es automáticamente un error — lo que importa es cuánto EV regala",
    verdictTerm: "Umbrales de veredicto",
    verdictBefore: "Se mide ",
    verdictBold: "en relación al bote",
    verdictAfter:
      " — hasta 0.35% del bote = Mejor jugada · hasta 1% = Aceptable · más allá = Repasa este spot. Por ejemplo, en un single raised pot de 5.5bb los cortes son 0.02bb y 0.06bb; en un bote de 3-bet de 22.5bb son 0.08bb y 0.23bb.",
    verdictHint:
      "Los mismos 0.05bb son un gran error en un bote chico y una diferencia trivial en uno grande. Calificar en bb absolutos hacía ver los botes de 3-bet peor de lo que son, así que cambiamos a la calificación relativa al bote (2026-08-15). Los cortes tienen pisos (0.02bb / 0.05bb): los cálculos solo convergen hasta un error objetivo de 0.5%, y diferencias menores no se distinguen del ruido del solver.",
    reviewTerm: "Repaso",
    reviewBefore:
      "Las manos donde más EV perdiste vuelven con el botón [Repasar]. Por defecto, tu historial se guarda ",
    reviewBold: "solo en este dispositivo",
    reviewAfter:
      ". Inicia sesión con una cuenta de HoldemMaster para guardarlo en tu cuenta y continuar en otros dispositivos — iniciar sesión es opcional y todas las funciones sirven sin hacerlo",
    filterTerm: "Filtros",
    filterDef:
      "Practica solo tus puntos débiles: single raised pots, botes de 3-bet o ciega contra ciega",

    installTitle: "Instálalo en tu pantalla de inicio y estudia offline",
    install1:
      "Puedes instalar este solver en tu pantalla de inicio como una app (sin archivo de instalación). En Chrome o Edge usa el ",
    installBold1: "ícono de instalar",
    install2: " a la derecha de la barra de direcciones; en Safari de iPhone toca ",
    installBold2: "Compartir → Agregar a inicio",
    install3:
      ". Una vez instalado, los 13 Spots de estudio y los retos del Entrenador quedan guardados en tu dispositivo, así puedes seguir estudiando ",
    installBold3: "incluso en el metro sin internet",
    install4: ".",
    samsung1:
      "* Instalar desde Samsung Internet muestra la advertencia «Aplicación no segura bloqueada». Aparece porque Google no confía en el paquete de instalación que genera ese navegador — no tiene nada que ver con esta app. ",
    samsungBold: "Abre el sitio en Chrome",
    samsung2:
      " y se instala sin advertencia; o, para continuar de todos modos, toca [Más detalles] → [Instalar de todos modos] en el cuadro de advertencia.",
    offlineDataLabel: "Datos de estudio offline",
    offlineSaved: "Guardado — los Spots de estudio y el Entrenador funcionan sin internet",
    offlineSaving: "Guardando…",
    offlineNotSaved: "Sin guardar",
    offlineSaveBtn: "Guardar ahora (~2.3MB)",
    offlineFootnote:
      "El «Resolver tú mismo» del spot personalizado solo funciona offline después de haberlo corrido en línea al menos una vez — el motor de cálculo se descarga en el primer uso.",

    safeTitle: "¿Es seguro instalarlo?",
    safe1:
      "Sí. «Instalar» aquí no significa descargar un programa a tu dispositivo — significa ",
    safeBold: "crear un acceso directo que corre dentro de tu navegador",
    safe2:
      ". En Android solo se registra una envoltura delgada que apunta a esta dirección; todo sigue corriendo dentro del motor del navegador. Si tienes dudas, comprueba estas cuatro cosas tú mismo — verificar vale más que nuestra palabra.",
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
      "* La advertencia «Aplicación no segura bloqueada» de Samsung Internet no es detección de malware — Google simplemente aún no agregó los paquetes de instalación de ese navegador a su lista de confianza. No aparece al instalar desde Chrome.",

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
    tDef2: "Sube el error objetivo a 0.5%",
    tTerm3: "La pestaña de resultados está en blanco",
    tDef3: "Ábrela después de que aparezca «¡Cálculo terminado!»",
    tTerm4: "Límite de memoria superado",
    tDef4: "Cambia al modo de enteros de 16 bits o usa menos bet sizes",
    tTerm5: "La matriz está toda gris",
    tDef5:
      "Estás viendo el turno del rival — elige otra escena en la tira superior",

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
} as const;

export default defineComponent({
  setup() {
    const copied = ref("");
    const L = computed(() => M[i18n.locale]);

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
      store: useStore(),
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
