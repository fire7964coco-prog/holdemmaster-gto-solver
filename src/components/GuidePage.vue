<template>
  <div class="max-w-3xl pb-8">
    <!-- 빠른 시작 -->
    <div
      class="px-4 py-3 rounded-lg bg-emerald-950 border border-emerald-700"
    >
      <div class="font-bold text-emerald-300">
        1분 시작 — 처음이라면 이것부터
      </div>
      <ol class="mt-1.5 ml-5 list-decimal space-y-1 text-sm">
        <li>
          왼쪽에서
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
    <h3 class="guide-h">커스텀 스팟 계산 — 사이드바 번호 ①→⑤ 순서 그대로</h3>
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
          0.01bb 이하 = 최적 선택 · 0.05bb 이하 = 허용 가능 · 그 이상 =
          다시 볼 스팟
        </td>
      </tr>
      <tr>
        <td class="term">복습</td>
        <td>
          손실이 컸던 문제는 [복습] 버튼으로 다시 나옵니다. 기록은 이 기기
          안에만 저장되며 로그인이 필요 없습니다
        </td>
      </tr>
      <tr>
        <td class="term">필터</td>
        <td>싱글레이즈팟 / 3벳팟 / 블라인드전 중 약한 상황만 골라 연습</td>
      </tr>
    </table>

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
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useStore } from "../store";

export default defineComponent({
  setup() {
    const copied = ref("");

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

    return { store: useStore(), exampleRanges, copyRange, copied };
  },
});
</script>

<style scoped>
.guide-h {
  @apply mt-6 mb-2 text-base font-bold text-blue-300 border-l-4 border-blue-600 pl-2.5;
}
.guide-table {
  @apply w-full text-sm;
}
.guide-table td {
  @apply border border-neutral-700 px-3 py-1.5 align-top;
}
.guide-table .term {
  @apply font-semibold text-neutral-200 whitespace-nowrap bg-neutral-800;
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
