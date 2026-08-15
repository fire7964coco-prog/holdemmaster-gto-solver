<template>
  <div class="max-w-3xl pb-8">
    <!-- 빠른 시작 -->
    <div
      class="px-4 py-3.5 rounded-xl bg-emerald-950 border border-emerald-800"
    >
      <div class="font-bold text-emerald-300">
        1분 시작 — 처음이라면 이것부터
      </div>
      <ol class="mt-1.5 ml-5 list-decimal space-y-1 text-sm">
        <li>
          <span class="hidden md:inline">왼쪽에서</span>
          <span class="md:hidden">위쪽 탭에서</span>
          <button
            class="link-like"
            @click="store.sideView = 'presets'"
          >
            교육 예제
          </button>
          클릭
        </li>
        <li>
          아무 예제나
          <span class="font-semibold text-emerald-300">[⚡ 결과 바로 보기]</span>
          클릭 — 결과가 바로 나옵니다
        </li>
        <li>아래 "결과 화면 읽는 법"을 보면서 숫자를 해석해보세요</li>
      </ol>
    </div>

    <!-- 용어 4개 -->
    <h3 class="guide-h">필수 용어 4개만 알면 됩니다</h3>
    <table class="guide-table">
      <tr>
        <td class="term">레인지</td>
        <td>플레이어가 들고 있을 수 있는 핸드의 묶음 (예: "쟤는 AA·KK·AK 중 하나겠지")</td>
      </tr>
      <tr>
        <td class="term">OOP / IP</td>
        <td>먼저 행동하는 쪽(불리) / 나중에 행동하는 쪽(유리). BTN vs BB면 BB가 OOP</td>
      </tr>
      <tr>
        <td class="term">에퀴티</td>
        <td>지금 시점의 승률(%)</td>
      </tr>
      <tr>
        <td class="term">EV</td>
        <td>기대값 — 이 액션으로 평균 얼마나 따는지. 클수록 좋음</td>
      </tr>
    </table>

    <!-- 커스텀 계산 순서 -->
    <h3 class="guide-h">커스텀 스팟 계산 — <span class="hidden md:inline">사이드바</span><span class="md:hidden">위쪽 탭</span> 번호 ①→⑤ 순서 그대로</h3>
    <ol class="guide-steps">
      <li>
        <b>① OOP 레인지 / ② IP 레인지</b> — 13×13 표를 클릭·드래그로
        칠하거나 텍스트로 입력:
        <code>22+,A2s+,KTo+</code>
        <div class="hint">
          22+ = 모든 포켓페어 · A2s+ = A2s~AKs · KTo+ = KTo~KQo. 표에서
          대각선=포켓페어, 오른쪽 위=수티드, 왼쪽 아래=오프수트
        </div>
        <div class="mt-2 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700">
          <div class="text-xs font-semibold text-neutral-300">
            처음이라면 이 예시를 복사해서 레인지 입력칸에 붙여넣으세요
            (BTN vs BB 100bb 표준 — 교육 예제와 같은 레인지)
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
              {{ copied === ex.label ? "복사됨!" : "복사" }}
            </button>
          </div>
        </div>
      </li>
      <li>
        <b>③ 보드</b> — 플랍 3장을 클릭하거나 "랜덤 플랍"
      </li>
      <li>
        <b>④ 벳 사이즈 (트리 설정)</b> — 처음엔 기본값 그대로. 스타팅
        팟·유효 스택만 확인
        <div class="hint">
          커스텀 계산의 입력값은 임의의 정수 칩 단위입니다. bb로 보려면
          10칩=1bb로 입력하세요(예: 팟 55 = 5.5bb). 교육 예제와 트레이너는
          이 기준으로 자동 환산해 표시합니다.
        </div>
      </li>
      <li>
        <b>⑤ 계산 실행</b> — "새 트리 만들기" → 완료되면 "솔버 실행" →
        "계산 완료!"가 뜨면 상단의 <b>[결과]</b> 탭 클릭
        <div class="hint">
          계산은 내 컴퓨터에서 몇 초~몇 분 걸립니다. 만든 스팟은 ⑤ 화면의
          [스팟 공유]로 링크를 복사해 커뮤니티에 질문할 수 있어요
        </div>
      </li>
    </ol>

    <!-- 결과 화면 읽는 법 -->
    <h3 class="guide-h">결과 화면 읽는 법</h3>
    <table class="guide-table">
      <tr>
        <td class="term">상단 스트립</td>
        <td>액션 흐름(플랍→벳→콜→턴...)의 장면 선택기. 클릭한 시점의 전략을 보여줌</td>
      </tr>
      <tr>
        <td class="term">왼쪽 13×13 매트릭스</td>
        <td>
          칸=핸드, 칸 속 색 비율=액션 비율. 🟥 벳/레이즈(진할수록 큰 벳) ·
          🟩 체크/콜 · 꺼진 칸=레인지에 없음. GTO는 같은 핸드도 액션을
          "비율로 섞습니다" — 패턴을 읽히지 않기 위해서예요
        </td>
      </tr>
      <tr>
        <td class="term">오른쪽 위 타일</td>
        <td>레인지 전체 기준 액션 빈도(%)와 콤보 수</td>
      </tr>
      <tr>
        <td class="term">오른쪽 중간 분류</td>
        <td>
          레인지가 보드에 뭘 맞았는지(탑페어·드로우...) — "이 보드가
          누구에게 유리한가"를 한눈에
        </td>
      </tr>
      <tr>
        <td class="term">오른쪽 아래 표</td>
        <td>핸드별 비중·에퀴티·EV·액션% 숫자. 열 제목 클릭=정렬</td>
      </tr>
    </table>

    <!-- GTO 트레이너 -->
    <h3 class="guide-h">GTO 트레이너 — 눈으로 보는 것에서 직접 풀어보는 것으로</h3>
    <p class="text-sm text-neutral-400 leading-relaxed">
      결과 화면을 읽는 게 익숙해졌다면
      <button class="link-like" @click="store.sideView = 'trainer'">
        GTO 트레이너
      </button>
      로 넘어가세요. 교육 예제 13개의 결정 지점에서 실제 레인지대로 뽑은
      핸드를 받고, 액션을 고르면 채점해줍니다.
    </p>
    <table class="guide-table">
      <tr>
        <td class="term">채점 방식</td>
        <td>
          정답/오답이 아니라 <b>EV 손실(bb)</b>로 평가합니다. GTO는 같은 핸드도
          여러 액션을 섞기 때문에, "빈도가 낮은 액션"이 곧 틀린 선택은
          아닙니다 — 손해가 얼마인지가 기준입니다
        </td>
      </tr>
      <tr>
        <td class="term">판정 기준</td>
        <td>
          <b class="text-neutral-200">팟 대비</b>로 잽니다 — 팟의 0.35% 이하 =
          최적 선택 · 1% 이하 = 허용 가능 · 그 이상 = 다시 볼 스팟.
          예를 들어 팟 5.5bb인 싱글레이즈팟은 0.02bb·0.06bb,
          팟 22.5bb인 3벳팟은 0.08bb·0.23bb가 경계입니다.
          <div class="hint">
            같은 0.05bb라도 작은 팟에서는 큰 실수고 큰 팟에서는 사소한 차이입니다.
            절대 bb로 재면 3벳팟이 실제보다 나쁘게 보여서 팟 대비로 바꿨습니다(2026-08-15).
            경계에는 하한(0.02bb·0.05bb)이 있는데, 계산을 목표 오차 0.5%까지만
            수렴시키므로 그보다 작은 차이는 계산 노이즈와 구분되지 않기 때문입니다.
          </div>
        </td>
      </tr>
      <tr>
        <td class="term">복습</td>
        <td>
          손실이 컸던 문제는 [복습] 버튼으로 다시 나옵니다. 기록은 기본적으로
          <b>이 기기 안에만</b> 저장되고 로그인이 필요 없습니다. 홀덤마스터
          계정으로 로그인하면 기록을 계정에 보관해 다른 기기에서도 이어서 풀 수
          있습니다 — 로그인하지 않으면 아무것도 전송되지 않습니다
        </td>
      </tr>
      <tr>
        <td class="term">필터</td>
        <td>싱글레이즈팟 / 3벳팟 / 블라인드전 중 약한 상황만 골라 연습</td>
      </tr>
    </table>

    <!-- 홈 화면 설치 · 오프라인 -->
    <h3 class="guide-h">홈 화면에 설치하고 오프라인에서 공부하기</h3>
    <p class="text-sm text-neutral-400 leading-relaxed">
      이 솔버는 앱처럼 홈 화면에 설치할 수 있습니다(설치 파일 없음).
      크롬·엣지는 주소창 오른쪽의 <b class="text-neutral-200">설치 아이콘</b>,
      아이폰 사파리는 <b class="text-neutral-200">공유 → 홈 화면에 추가</b>입니다.
      설치하면 교육 예제 13종과 트레이너 문제가 기기에 저장돼
      <b class="text-neutral-200">인터넷이 없는 지하철에서도</b> 그대로 풀 수 있습니다.
    </p>
    <p class="mt-1.5 text-xs text-neutral-500 leading-relaxed">
      ※ 삼성 인터넷에서 설치하면 「안전하지 않은 앱 차단됨」 경고가 뜹니다. 이 브라우저가
      만드는 설치 파일을 구글이 신뢰하지 않아 생기는 문제로, 앱과는 무관합니다.
      <b class="text-neutral-300">크롬으로 열면</b> 경고 없이 설치되고, 그대로 설치하려면
      경고창의 [세부정보 더보기] → [무시하고 설치]를 누르면 됩니다.
    </p>
    <div
      class="mt-2 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm"
    >
      <div class="flex items-center gap-3 flex-wrap">
        <span class="font-semibold text-neutral-200">오프라인 학습 데이터</span>
        <span v-if="pwa.offlineTotal && pwa.offlineHave >= pwa.offlineTotal" class="text-emerald-300">
          저장 완료 — 인터넷 없이도 교육 예제·트레이너 사용 가능
        </span>
        <span v-else-if="pwa.offlineSaving" class="text-neutral-400">저장 중…</span>
        <span v-else class="text-neutral-400">
          저장 안 됨 ({{ pwa.offlineHave }}/{{ pwa.offlineTotal || 14 }})
        </span>
        <button
          v-if="!pwa.offlineSaving && !(pwa.offlineTotal && pwa.offlineHave >= pwa.offlineTotal)"
          class="button-base button-blue !px-2 !py-0.5 text-xs"
          @click="saveOffline"
        >
          지금 저장 (약 2.3MB)
        </button>
      </div>
      <div class="mt-1 text-xs text-neutral-500">
        커스텀 스팟 «직접 계산»은 오프라인에서 한 번이라도 돌려본 뒤에만 됩니다 —
        계산 엔진은 쓸 때 내려받기 때문입니다.
      </div>
    </div>

    <h3 class="guide-h">설치해도 안전한가요?</h3>
    <p class="text-sm text-neutral-400 leading-relaxed">
      네. 여기서 말하는 «설치»는 프로그램을 내려받아 기기에 까는 것이 아니라,
      <b class="text-neutral-200">브라우저 안에서 도는 바로가기를 만드는 것</b>입니다.
      안드로이드에서는 이 주소를 가리키는 얇은 껍데기만 등록되고, 실제 실행은 그대로
      브라우저 엔진 안에서 됩니다. 의심스러우시면 아래 네 가지를 직접 확인해 보세요 —
      말보다 확인이 빠릅니다.
    </p>
    <table class="guide-table">
      <tr>
        <td class="term">권한을 안 씁니다</td>
        <td>
          설치할 때 카메라·연락처·문자·위치 같은 권한을 하나도 요구하지 않습니다.
          휴대폰 <b class="text-neutral-200">설정 → 앱 정보 → 권한</b>에서 직접 보실 수 있습니다
        </td>
      </tr>
      <tr>
        <td class="term">비행기 모드로 확인</td>
        <td>
          인터넷을 끄고도 트레이너가 그대로 돌아갑니다. 계산이
          <b class="text-neutral-200">기기 안에서 끝나고 서버로 아무것도 보내지 않는다</b>는
          가장 확실한 증거입니다. 로그인하지 않으면 전송되는 데이터가 없습니다
        </td>
      </tr>
      <tr>
        <td class="term">소스가 공개돼 있습니다</td>
        <td>
          이 솔버는 AGPL-3.0 오픈소스라 코드 전체를
          <a
            class="link-like"
            href="https://github.com/fire7964coco-prog/holdemmaster-gto-solver"
            target="_blank"
            rel="noopener"
            >GitHub</a
          >에서 볼 수 있습니다. 숨겨둘 곳이 없습니다
        </td>
      </tr>
      <tr>
        <td class="term">깔끔하게 지워집니다</td>
        <td>
          다른 앱처럼 길게 눌러 삭제하면 끝입니다. 배경에서 도는 것도, 남는 것도 없습니다
        </td>
      </tr>
    </table>
    <p class="mt-2 text-xs text-neutral-500 leading-relaxed">
      ※ 삼성 인터넷에서 뜨는 「안전하지 않은 앱 차단됨」 경고는 악성코드 탐지가 아니라,
      그 브라우저가 만드는 설치 파일을 구글이 아직 신뢰 목록에 넣지 않아 생기는 문제입니다.
      크롬으로 열면 뜨지 않습니다.
    </p>

    <!-- 추천 공부법 -->
    <h3 class="guide-h">추천 공부법</h3>
    <ol class="guide-steps">
      <li>교육 예제 13개를 순서대로 — 시리즈로 이어지는 커리큘럼입니다</li>
      <li>"왜 이 핸드는 체크를 섞지?" 궁금하면 상세 표에서 액션별 EV를 비교</li>
      <li>
        같은 스팟을 GTO 트레이너로 풀어 몸에 익히기 — 약점 분석이 어느
        상황에서 손실이 큰지 알려줍니다
      </li>
      <li>같은 레인지로 보드만 바꿔 비교 (예: A72 vs 974)</li>
      <li>실전에서 헷갈렸던 핸드를 그대로 입력해서 복기</li>
    </ol>

    <!-- 트러블슈팅 -->
    <h3 class="guide-h">문제가 생기면</h3>
    <table class="guide-table">
      <tr><td class="term">트리 만들기 오류</td><td>보드 3장 + 레인지 2개가 입력됐는지 확인</td></tr>
      <tr><td class="term">계산이 느림</td><td>목표 오차를 0.5%로 올리기</td></tr>
      <tr><td class="term">결과 탭이 빈 화면</td><td>"계산 완료!"가 뜬 뒤에 클릭</td></tr>
      <tr><td class="term">메모리 한도 초과</td><td>16비트 정수 모드 선택, 또는 벳 사이즈 수 줄이기</td></tr>
      <tr><td class="term">매트릭스가 회색뿐</td><td>상대 차례의 스팟을 보는 중 — 상단 스트립에서 다른 장면 클릭</td></tr>
    </table>

    <!-- 오류 신고 — 지금은 유저 화면의 문제를 알 수 있는 유일한 통로다 -->
    <h3 class="guide-h">고쳐야 할 문제를 발견하셨다면</h3>
    <p class="text-sm text-neutral-400 leading-relaxed">
      화면이 깨지거나 계산이 멈추면 이 기기에 오류 내용이 자동으로 기록됩니다.
      <b class="text-neutral-200">기록은 기기 밖으로 나가지 않습니다</b> — 아래에서 복사해
      커뮤니티에 올려주시면 그때 저희가 보게 됩니다. 레인지·학습 기록 같은 내용은 담기지
      않고, 오류 메시지와 브라우저 종류만 들어갑니다.
    </p>
    <div class="mt-2 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm">
      <div class="flex items-center gap-3 flex-wrap">
        <span class="font-semibold text-neutral-200">기록된 오류</span>
        <span :class="errorState.count ? 'text-orange-300' : 'text-neutral-500'">
          {{ errorState.count }}건
        </span>
        <button
          v-if="errorState.count"
          class="button-base button-blue !px-2 !py-0.5 text-xs"
          @click="copyErrors"
        >
          {{ errorsCopied ? "복사됨" : "오류 내용 복사" }}
        </button>
        <button
          v-if="errorState.count"
          class="button-base !px-2 !py-0.5 text-xs"
          @click="clearErrors"
        >
          기록 지우기
        </button>
      </div>
      <div v-if="!errorState.count" class="mt-1 text-xs text-neutral-500">
        아직 기록된 오류가 없습니다.
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useStore } from "../store";
import { pwa, saveOffline, checkOfflineStatus } from "../pwa";
import { errorState, errorReportText, clearErrors } from "../errors";

export default defineComponent({
  setup() {
    const copied = ref("");

    // 사용법 화면을 열 때마다 실제 저장 상태를 서비스워커에 물어본다
    checkOfflineStatus();

    const errorsCopied = ref(false);
    const copyErrors = async () => {
      try {
        await navigator.clipboard.writeText(errorReportText());
        errorsCopied.value = true;
      } catch {
        window.prompt("아래 내용을 복사해 주세요", errorReportText());
      }
    };

    // 교육 예제(BTN vs BB 싱글레이즈팟)와 동일한 100bb 표준 레인지 (presets.ts 참조)
    const exampleRanges = [
      {
        label: "OOP (BB 콜러)",
        text: "TT-22,AJs-A2s,KJs-K2s,QJs-Q2s,J4s+,T6s+,96s+,85s+,75s+,64s+,54s,AJo-A2o,K9o+,Q9o+,J9o+,T8o+,98o",
      },
      {
        label: "IP (BTN 오픈)",
        text: "22+,A2s+,K5s+,Q6s+,J7s+,T7s+,97s+,86s+,75s+,64s+,54s,A2o+,K9o+,Q9o+,J9o+,T8o+,98o",
      },
    ];

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
