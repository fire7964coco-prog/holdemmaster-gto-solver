<template>
  <div
    id="trainer-top"
    :class="'max-w-5xl flex flex-col ' + (evaluation ? 'pb-24 md:pb-10' : 'pb-10')"
  >
    <div
      v-if="loadError"
      class="rounded-lg border border-red-700 bg-red-950 px-4 py-3 text-red-300"
    >
      트레이너 데이터를 불러오지 못했습니다: {{ loadError }}
    </div>
    <div v-else-if="!bank" class="py-8">
      <span class="spinner inline-block mr-3"></span>트레이너 준비 중...
    </div>

    <template v-else>
      <!--
        모바일에서 한 줄 고정: 버튼이 늘고 줄어도 아래 문제가 움직이지 않아야 한다.
        (오답이 생기면 [복습 N개]가 나타나 두 줄이 되면서 문제를 30px 밀어냈다)
      -->
      <div
        class="order-1 filter-row flex flex-nowrap md:flex-wrap items-center gap-1.5 md:gap-2 overflow-x-auto md:overflow-x-visible"
      >
        <button
          v-for="item in categories"
          :key="item"
          :class="
            'button-base filter-btn ' +
            (category === item ? 'button-blue' : 'bg-neutral-700 hover:bg-neutral-600')
          "
          @click="changeCategory(item)"
        >
          {{ trainerCategoryLabel(item) }}
        </button>
        <button
          v-if="reviewAttempts.length"
          :class="
            'button-base filter-btn ml-0 md:ml-2 ' +
            (reviewMode ? 'button-green' : 'bg-neutral-700 hover:bg-neutral-600')
          "
          @click="toggleReview"
        >
          복습 {{ reviewAttempts.length }}개
        </button>
        <!-- 오늘의 문제: 날짜가 씨앗이라 모두 같은 문제를 받는다 -->
        <button
          :class="
            'button-base filter-btn ml-0 md:ml-2 flex items-center gap-1.5 ' +
            (dailyMode
              ? 'bg-[#DFAC2A] text-[#04160C] hover:bg-[#e8bb4a]'
              : 'bg-neutral-700 hover:bg-neutral-600')
          "
          @click="toggleDaily"
        >
          오늘의 문제
          <span v-if="dailyState.done" aria-label="완료">✓</span>
        </button>
      </div>

      <!-- 통계는 칩으로 압축 — 위쪽 공간을 덜 먹어야 문제가 화면 중앙에 온다 -->
      <div id="trainer-stats" class="order-4 md:order-2 flex flex-wrap gap-1.5 mt-3">
        <span class="stat-chip">풀이 <b>{{ attempts.length }}</b></span>
        <span v-if="dailyState.streak" class="stat-chip">
          오늘의 문제 <b>{{ dailyState.streak }}</b>일 연속
          <span v-if="dailyState.bestStreak > dailyState.streak" class="text-neutral-600">
            / 최고 {{ dailyState.bestStreak }}
          </span>
        </span>
        <span class="stat-chip">
          연속 정답
          <b :class="streak >= 3 ? 'text-emerald-300' : ''">{{ streak }}</b>
          <span v-if="bestStreak > 0" class="text-neutral-600">/ 최고 {{ bestStreak }}</span>
        </span>
        <span class="stat-chip">누적 EV 손실 <b>{{ totalLoss.toFixed(3) }}</b>bb</span>
        <span class="stat-chip">평균 EV 손실 <b>{{ averageLoss.toFixed(3) }}</b>bb</span>
        <span class="stat-chip">좋은 선택 <b>{{ excellentRate.toFixed(0) }}</b>%</span>
      </div>

      <!-- 약점 분석: 카테고리별 평균 EV 손실 -->
      <div
        v-if="weakness.rows.some((row) => row.count > 0)"
        class="order-4 md:order-2 mt-3 rounded-lg border border-neutral-700 bg-neutral-900/50 px-3 py-2.5"
      >
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span class="font-semibold text-neutral-300">약점 분석</span>
          <span
            v-for="row in weakness.rows"
            :key="row.category"
            :class="
              weakness.weakest && weakness.weakest.category === row.category
                ? 'text-orange-300 font-semibold'
                : 'text-neutral-400'
            "
          >
            {{ row.label }}
            <template v-if="row.count">
              평균 팟의 {{ row.averageLossPct.toFixed(2) }}%
              <span class="text-neutral-600">({{ row.averageLossBb.toFixed(3) }}bb)</span>
              <span class="text-neutral-600">({{ row.count }}문제)</span>
            </template>
            <span v-else class="text-neutral-600">미풀이</span>
          </span>
        </div>
        <div v-if="weakness.weakest" class="mt-1.5 text-xs text-neutral-400">
          <b class="text-orange-300">{{ weakness.weakest.label }}</b>
          에서 손실이 가장 큽니다 —
          <button class="link-like" @click="changeCategory(weakness.weakest.category)">
            이 상황만 연습하기
          </button>
        </div>
        <div v-else class="mt-1.5 text-xs text-neutral-500">
          상황별로 3문제 이상 풀면 어디가 약한지 알려드립니다.
        </div>
      </div>

      <!-- 계정 보관 (선택) — 로그인 전엔 아무것도 전송되지 않는다 -->
      <div
        v-if="accountEnabled"
        class="order-4 md:order-2 mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-neutral-700 bg-neutral-900/50 px-3 py-2.5 text-xs"
      >
        <template v-if="account">
          <span class="text-neutral-300">
            <b class="text-emerald-300">{{ account.nickname }}</b> 님의 계정에
            보관 중
          </span>
          <span v-if="syncMessage" class="text-neutral-500">{{ syncMessage }}</span>
          <span class="ml-auto flex items-center gap-3">
            <button
              class="link-like"
              :disabled="syncing"
              @click="runSync"
            >
              {{ syncing ? "동기화 중..." : "지금 동기화" }}
            </button>
            <button class="text-neutral-500 hover:text-neutral-300" @click="doSignOut">
              로그아웃
            </button>
          </span>
        </template>
        <template v-else>
          <span class="text-neutral-400">
            학습 기록이 <b class="text-neutral-200">이 기기에만</b> 저장됩니다.
            홀덤마스터 계정에 보관하면 다른 기기에서도 이어서 풀 수 있어요.
          </span>
          <span class="ml-auto flex items-center gap-2">
            <button class="button-base bg-neutral-700 hover:bg-neutral-600 !py-1" @click="doSignIn('google')">
              구글로 계속하기
            </button>
            <button class="button-base bg-neutral-700 hover:bg-neutral-600 !py-1" @click="doSignIn('kakao')">
              카카오
            </button>
          </span>
        </template>
        <div v-if="accountError" class="w-full text-red-300">
          {{ accountError }}
        </div>
      </div>

      <p class="order-4 md:order-2 mt-2 text-right text-xs text-neutral-500">
        13개 교육 프리셋 · {{ decisionCount }}개 결정 노드 · 계산 목표 오차
        {{ bank.targetExploitabilityPct }}%
      </p>

      <!--
        모바일: 성적 한 줄 요약만 위에 남기고 자세한 통계·약점 분석·계정 안내는
        문제 아래로 내렸다. 위쪽 군더더기가 250px를 먹어 액션 버튼이 첫 화면 밖으로
        밀려 있었다(390x844에서 y=848).
      -->
      <div
        class="order-2 md:hidden mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400"
      >
        <span>풀이 <b class="text-neutral-200">{{ attempts.length }}</b></span>
        <span>
          연속 정답
          <b :class="streak >= 3 ? 'text-emerald-300' : 'text-neutral-200'">{{ streak }}</b>
        </span>
        <span v-if="attempts.length">
          좋은 선택 <b class="text-neutral-200">{{ excellentRate.toFixed(0) }}</b>%
        </span>
        <span v-if="dailyState.streak">
          오늘의 문제 <b class="text-[#DFAC2A]">{{ dailyState.streak }}</b>일 연속
        </span>
        <button class="ml-auto link-like" @click="scrollToStats">자세히 ↓</button>
      </div>

      <!-- 좌: 문제 / 우: 채점. 답을 봐도 문제가 화면에서 사라지지 않게 나란히 둔다 -->
      <div
        v-if="question"
        class="order-3 md:order-4 mt-3 md:mt-5 grid gap-4 lg:grid-cols-[1.15fr_1fr] items-start"
      >
      <div class="rounded-xl border border-neutral-700 bg-neutral-800 p-4 md:p-5">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span class="text-sm font-semibold text-blue-300">
            {{ question.presetTitle }}
          </span>
          <span class="text-xs text-neutral-500">
            {{ positionLabel }} ({{ question.node.selectedSpot.player.toUpperCase() }})
            차례
          </span>
          <span class="ml-auto text-xs text-neutral-400">
            팟 {{ amountBb(question.node.selectedSpot.pot ?? question.node.startingPot) }}
            · 스택
            {{ amountBb(question.node.selectedSpot.stack ?? question.node.effectiveStack) }}
          </span>
        </div>

        <div v-if="question.node.history.length" class="mt-3 text-sm text-neutral-400">
          진행:
          <span
            v-for="(action, index) in question.node.history"
            :key="index"
            class="ml-1"
          >
            {{ historyPlayerLabel(action.player) }}
            {{ historyLabel(action) }}<span v-if="index + 1 < question.node.history.length"> →</span>
          </span>
        </div>

        <div
          class="mt-3 md:mt-4 rounded-lg border border-neutral-700/70 bg-neutral-900/50 py-3 md:py-4 flex flex-row items-start md:items-center justify-center gap-6 md:gap-10"
        >
          <div class="text-center">
            <div class="text-xs text-neutral-500 mb-1">보드</div>
            <div class="text-xl md:text-2xl font-bold tracking-wide">
              <span
                v-for="(card, index) in boardCards"
                :key="index"
                :class="'mr-1 ' + card.colorClass"
              >
                {{ card.rank }}{{ card.suit }}
              </span>
            </div>
          </div>
          <div class="text-center">
            <div class="text-xs text-neutral-500 mb-1">내 핸드</div>
            <div class="text-2xl md:text-3xl font-bold tracking-wide">
              <span
                v-for="(card, index) in handCards"
                :key="index"
                :class="'mr-1 ' + card.colorClass"
              >
                {{ card.rank }}{{ card.suit }}
              </span>
            </div>
            <div class="mt-1.5 flex flex-wrap justify-center gap-1">
              <span class="hand-tag bg-neutral-700 text-neutral-200">
                {{ handLabels.made }}
              </span>
              <span
                v-if="handLabels.draw"
                class="hand-tag bg-blue-900/70 text-blue-200"
              >
                {{ handLabels.draw }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-5 text-sm font-semibold">
          {{ evaluation ? "내 선택" : "어떤 액션을 선택하시겠습니까?" }}
        </div>
        <!-- 채점 전에는 액션 이름만. 채점 후에는 버튼 자체가 결과표가 된다 -->
        <div class="grid gap-2 mt-2">
          <button
            v-for="(action, index) in question.node.selectedSpot.actions"
            :key="index"
            :disabled="!!evaluation"
            :class="
              'flex items-center justify-between rounded-lg border px-4 py-2.5 font-semibold transition ' +
              (evaluation && evaluation.selectedAction === index
                ? 'border-yellow-400 bg-yellow-900/50 text-yellow-200'
                : evaluation
                ? 'border-neutral-700 bg-neutral-800 text-neutral-400'
                : 'border-neutral-600 bg-neutral-700 hover:bg-neutral-600')
            "
            @click="choose(index)"
          >
            <span>
              {{
                trainerActionLabel(
                  action,
                  question.node.selectedSpot.pot ?? question.node.startingPot,
                  question.node.unitScale
                )
              }}
            </span>
            <span
              v-if="evaluation"
              class="text-xs font-semibold tabular-nums text-neutral-400"
            >
              {{ (evaluation.actions[index].frequency * 100).toFixed(1) }}%
            </span>
          </button>
        </div>

      </div>

      <!-- 오른쪽: 채점 결과. 아직 안 골랐으면 자리만 잡아둔다(레이아웃이 튀지 않게) -->
      <div
        id="trainer-detail"
        class="rounded-xl border border-neutral-700 bg-neutral-800 p-4 md:p-5"
      >
        <template v-if="evaluation">
          <!-- 모바일은 하단 고정 바가 같은 내용을 이고 있어 여기선 감춘다 -->
          <div :class="'hidden md:block text-lg font-bold ' + verdict.className">
            {{ verdict.text }}
          </div>
          <div class="hidden md:block mt-0.5 text-sm text-neutral-400">
            EV 손실
            <b class="tabular-nums text-neutral-200">
              {{ evaluation.evLossBb.toFixed(3) }}bb
            </b>
          </div>
          <div class="md:hidden text-sm font-semibold text-neutral-300">
            액션별 빈도와 EV
          </div>
          <p class="mt-1 text-xs text-neutral-500">
            혼합 전략은 단순 오답 처리하지 않고 액션 EV 차이로 평가합니다.
          </p>

          <div class="mt-4 space-y-2.5">
            <div v-for="action in evaluation.actions" :key="action.index">
              <div class="flex items-baseline gap-2 text-sm">
                <span :class="action.isBest ? 'font-bold text-emerald-300' : ''">
                  {{ action.label }}{{ action.isBest ? " · 최고 EV" : "" }}
                </span>
                <span class="ml-auto tabular-nums text-xs text-neutral-500">
                  {{ (action.frequency * 100).toFixed(1) }}%
                </span>
                <span class="w-16 text-right tabular-nums">
                  {{ action.evBb.toFixed(3) }}
                </span>
              </div>
              <!-- 숫자를 못 읽어도 차이가 보이게 -->
              <div class="mt-1 h-1 rounded bg-neutral-900 overflow-hidden">
                <div
                  :class="
                    'h-full rounded ' +
                    (action.isBest ? 'bg-emerald-500' : 'bg-blue-600')
                  "
                  :style="{ width: evBarWidth(action.evBb) + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <!--
            오늘의 문제를 푼 뒤: 결과를 커뮤니티에 올리기 쉽게 만든다.
            같은 날 모두가 같은 문제를 받으므로 서로 답을 견줄 수 있고, 그게 글감이 된다.
            정답 자체는 문구에 넣지 않는다 — 아직 안 푼 사람의 재미를 없애면 글이 안 퍼진다.
          -->
          <div
            v-if="dailyMode && dailyState.done"
            class="mt-4 panel-inner border-[#DFAC2A]/40"
          >
            <div class="text-sm font-semibold text-[#DFAC2A]">
              오늘의 문제 완료
              <span v-if="dailyState.streak > 1" class="text-neutral-300">
                · {{ dailyState.streak }}일 연속
              </span>
            </div>
            <div class="mt-1 text-xs text-neutral-400 leading-relaxed">
              오늘은 모두 같은 문제를 풉니다. 결과를 올리면 다른 사람 선택과 비교할 수 있습니다.
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <!-- 커뮤니티보다 단톡방·SNS가 먼저다 — 회원이 적어도 작동하는 유입 장치 -->
              <button
                class="button-base !px-2.5 !py-1 text-xs bg-[#DFAC2A] text-[#04160C] hover:bg-[#e8bb4a]"
                @click="openCard"
              >
                성적 카드 만들기
              </button>
              <button class="button-base button-blue !px-2.5 !py-1 text-xs" @click="copyDaily">
                {{ dailyCopied ? "복사 완료" : "결과 문구 복사" }}
              </button>
              <!-- 복사만 시키고 갈 곳을 안 주면 아무도 안 올린다 -->
              <a
                :href="communityUrl"
                target="_blank"
                rel="noopener"
                class="button-base bg-neutral-700 hover:bg-neutral-600 !px-2.5 !py-1 text-xs"
              >
                커뮤니티 열기 →
              </a>
            </div>
            <div v-if="dailyCopied" class="mt-1.5 text-xs text-neutral-500 leading-relaxed">
              커뮤니티에서 <b class="text-neutral-300">[✏️ 글 쓰기]</b>를 누르고 붙여넣으면 됩니다.
            </div>
          </div>

          <div class="mt-5 flex flex-wrap items-center gap-3">
            <button class="button-base button-green px-6" @click="goNext">
              {{ dailyMode && dailyState.done ? "계속 연습하기" : "다음 문제" }}
            </button>
            <a
              v-if="articleUrl"
              :href="articleUrl"
              target="_blank"
              class="text-sm text-blue-400 hover:underline"
            >
              이 스팟 해설 읽기 →
            </a>
            <button
              class="text-sm text-neutral-400 hover:text-neutral-200"
              @click="openSpot"
            >
              결과 전체 보기
            </button>
          </div>
        </template>

        <template v-else>
          <div class="text-sm font-semibold text-neutral-300">채점 결과</div>
          <p class="mt-2 text-sm leading-relaxed text-neutral-500">
            액션을 고르면 여기에 <b class="text-neutral-400">각 액션의 빈도와 EV</b>,
            그리고 내 선택이 몇 bb 손해였는지가 표시됩니다.
          </p>
          <p class="mt-3 text-xs leading-relaxed text-neutral-600">
            GTO는 같은 핸드도 액션을 섞습니다. 빈도가 낮은 선택이 곧 오답은
            아니며, 기준은 EV 손실입니다 — <b class="text-neutral-400">팟 대비</b>
            0.35% 이하 최적 · 1% 이하 허용 · 그 이상 다시 볼 스팟.
            <template v-if="question">
              이 스팟(팟 {{ limits.potBb.toFixed(1) }}bb)에서는
              {{ limits.bestBb.toFixed(2) }}bb · {{ limits.goodBb.toFixed(2) }}bb입니다.
            </template>
          </p>
        </template>
      </div>
      </div>

      <div class="order-5 mt-4 flex justify-end">
        <button
          v-if="attempts.length"
          class="text-xs text-neutral-500 hover:text-red-300"
          @click="resetHistory"
        >
          학습 기록 초기화
        </button>
      </div>

      <!--
        모바일 채점 바: 판정·EV 손실·[다음 문제]를 화면 하단에 붙여 둔다.
        이게 없으면 답을 고른 뒤 판정(y=1156)과 다음 문제(y=1391)를 보려고
        두 번 더 내렸다가 새 문제를 보려고 다시 올려야 했다.
      -->
      <div
        v-if="evaluation"
        class="md:hidden fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-neutral-700 bg-neutral-900/95 px-3 py-2 backdrop-blur"
      >
        <div class="min-w-0">
          <div :class="'text-sm font-bold ' + verdict.className">{{ verdict.text }}</div>
          <div class="text-xs text-neutral-400">
            EV 손실
            <b class="tabular-nums text-neutral-200">
              {{ evaluation.evLossBb.toFixed(3) }}bb
            </b>
            <button class="link-like ml-2" @click="scrollToDetail">자세히 ↓</button>
          </div>
        </div>
        <button class="button-base button-green ml-auto shrink-0 px-5" @click="goNext">
          {{ dailyMode && dailyState.done ? "계속 연습하기" : "다음 문제" }}
        </button>
      </div>

      <!-- 성적 카드 미리보기 — 기기 안에서 그린 이미지를 공유/저장한다 -->
      <div
        v-if="cardUrl"
        class="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4"
        @click.self="closeCard"
      >
        <div class="w-full max-w-sm rounded-xl border border-neutral-700 bg-neutral-900 p-4">
          <img
            :src="cardUrl"
            alt="오늘의 문제 성적 카드"
            class="w-full max-h-[62vh] object-contain rounded-lg border border-neutral-700"
          />
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <button
              v-if="cardShareable"
              class="button-base bg-[#DFAC2A] text-[#04160C] hover:bg-[#e8bb4a] !px-3 !py-1.5 text-sm"
              @click="shareCardNow"
            >
              카카오톡·SNS로 공유
            </button>
            <button class="button-base button-blue !px-3 !py-1.5 text-sm" @click="saveCardNow">
              이미지 저장
            </button>
            <button
              class="ml-auto text-sm text-neutral-400 hover:text-neutral-200"
              @click="closeCard"
            >
              닫기
            </button>
          </div>
          <p class="mt-2 text-xs text-neutral-500 leading-relaxed">
            저장한 카드를 단톡방이나 SNS에 올려보세요.
            받은 사람도 오늘은 <b class="text-neutral-300">같은 문제</b>를 풉니다.
            카드에 정답은 담기지 않습니다.
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref } from "vue";
import { noteTrainerSolved } from "../pwa";
import {
  dailyState,
  dailyShareText,
  loadDailyState,
  makeDailyQuestion,
  recordDaily,
  todayKey,
} from "../daily";
import { canShareCard, drawDailyCard, saveCard, shareCard } from "../share-card";
import {
  clearTrainerAttempts,
  addTrainerAttempt,
  getTrainerAttempts,
  mergeTrainerAttempts,
  newClientId,
  TrainerAttempt,
} from "../db";
import {
  AccountUser,
  getCurrentUser,
  isAccountEnabled,
  onAuthChange,
  signIn,
  signOut,
  syncAttempts,
  hasStoredSession,
  isReturningFromAuth,
  isClientLoaded,
} from "../account";
import { ARTICLE_URLS, PRESETS } from "../presets";
import { trackOutbound, mainSiteUrl } from "../outbound";
import { useStore } from "../store";
import { cardText, formatBb } from "../utils";
import {
  evaluateTrainerAction,
  makeTrainerQuestion,
  isAcceptable,
  lossLimits,
  TrainerBank,
  TrainerCategory,
  TrainerEvaluation,
  TrainerQuestion,
  trainerActionLabel,
  trainerCardPair,
  trainerCategory,
  trainerCategoryLabel,
  trainerHandLabels,
  trainerStreak,
  trainerWeakness,
  validateTrainerBank,
} from "../trainer";

export default defineComponent({
  setup() {
    const store = useStore();
    const categories: TrainerCategory[] = ["all", "srp", "3bp", "blind"];
    let unsubscribeAuth: () => void = () => undefined;
    const category = ref<TrainerCategory>("all");
    const bank = ref<TrainerBank | null>(null);
    const question = ref<TrainerQuestion | null>(null);
    const evaluation = ref<TrainerEvaluation | null>(null);
    const attempts = ref<TrainerAttempt[]>([]);
    const loadError = ref("");
    const reviewMode = ref(false);
    const dailyMode = ref(false);
    const dailyCopied = ref(false);
    loadDailyState();
    let reviewIndex = 0;

    const decisionCount = computed(
      () => bank.value?.presets.reduce((sum, item) => sum + item.nodes.length, 0) ?? 0
    );
    const averageLoss = computed(() =>
      attempts.value.length
        ? attempts.value.reduce((sum, item) => sum + item.evLossBb, 0) /
          attempts.value.length
        : 0
    );
    const totalLoss = computed(() =>
      attempts.value.reduce((sum, item) => sum + item.evLossBb, 0)
    );
    const excellentRate = computed(() =>
      attempts.value.length
        ? (attempts.value.filter(isAcceptable).length * 100) /
          attempts.value.length
        : 0
    );
    // 판정 경계는 스팟마다 다르다 (팟이 크면 허용 폭도 커진다)
    const limits = computed(() =>
      lossLimits(question.value?.presetId ?? "srp-dry-ace")
    );

    // attempts는 최신순 — 앞에서부터 세면 현재 연속 기록이 된다
    const streak = computed(() => trainerStreak(attempts.value));
    const bestStreak = computed(() => {
      let best = 0;
      let current = 0;
      for (const attempt of attempts.value) {
        if (isAcceptable(attempt)) {
          current++;
          best = Math.max(best, current);
        } else {
          current = 0;
        }
      }
      return best;
    });
    const weakness = computed(() => trainerWeakness(attempts.value));
    const reviewAttempts = computed(() => {
      const seen = new Set<string>();
      return attempts.value.filter((item) => {
        if (seen.has(item.questionId)) return false;
        seen.add(item.questionId);
        return (
          item.evLossBb > 0.05 &&
          (category.value === "all" || item.category === category.value)
        );
      });
    });

    const restoreQuestion = (attempt: TrainerAttempt) => {
      if (!bank.value) return null;
      const [presetId, nodeId] = attempt.questionId.split(":");
      const presetData = bank.value.presets.find((item) => item.presetId === presetId);
      const node = presetData?.nodes.find((item) => item.nodeId === nodeId);
      if (!node) return null;
      const player = node.selectedSpot.player;
      const playerIndex = player === "oop" ? 0 : 1;
      const handIndex = node.cards[playerIndex].indexOf(attempt.handPair);
      if (handIndex < 0) return null;
      return {
        id: `${presetId}:${nodeId}:${attempt.handPair}`,
        presetId,
        presetTitle: PRESETS.find((item) => item.id === presetId)?.title ?? presetId,
        category: trainerCategory(presetId),
        node,
        handIndex,
        handPair: attempt.handPair,
        player,
      } as TrainerQuestion;
    };

    // 판정 문구·색은 세 곳(데스크톱 패널·모바일 바·공유 문구)에서 쓴다
    const verdict = computed(() => {
      const result = evaluation.value;
      if (!result) return { text: "", className: "" };
      if (result.evLossBb <= limits.value.bestBb)
        return { text: "최적 선택", className: "text-emerald-300" };
      if (result.evLossBb <= limits.value.goodBb)
        return { text: "허용 가능한 선택", className: "text-blue-300" };
      return { text: "다시 볼 스팟", className: "text-orange-300" };
    });

    // 모바일에서 아래를 읽고 있었더라도 다음 문제는 «위»에서 시작해야 한다
    const scrollToId = (id: string) => {
      document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "smooth" });
    };
    const scrollToStats = () => scrollToId("trainer-stats");
    const scrollToDetail = () => scrollToId("trainer-detail");

    const nextQuestion = () => {
      evaluation.value = null;
      if (!bank.value) return;
      if (dailyMode.value) {
        question.value = makeDailyQuestion(bank.value);
      } else if (reviewMode.value && reviewAttempts.value.length) {
        const attempt = reviewAttempts.value[reviewIndex % reviewAttempts.value.length];
        reviewIndex++;
        question.value = restoreQuestion(attempt);
      } else {
        question.value = makeTrainerQuestion(bank.value, category.value);
      }
    };

    const choose = async (actionIndex: number) => {
      if (!question.value || evaluation.value) return;
      evaluation.value = evaluateTrainerAction(question.value, actionIndex);
      const result = evaluation.value;
      await addTrainerAttempt({
        clientId: newClientId(),
        timestamp: Date.now(),
        questionId: question.value.id,
        presetId: question.value.presetId,
        category: question.value.category,
        handPair: question.value.handPair,
        selectedAction: actionIndex,
        bestAction: result.bestAction,
        evLossBb: result.evLossBb,
      });
      attempts.value = await getTrainerAttempts();
      if (dailyMode.value) recordDaily(result.evLossBb);
      noteTrainerSolved();
      // 로그인 상태면 조용히 올린다 (실패해도 풀이 흐름을 막지 않음)
      if (account.value) void runSync(true);
    };

    // 하단 바와 데스크톱 버튼이 같이 쓴다. 오늘의 문제를 끝냈으면 일반 연습으로 돌아간다.
    const goNext = () => {
      if (dailyMode.value && dailyState.done) toggleDaily();
      else nextQuestion();
      scrollToId("trainer-top");
    };

    const changeCategory = (value: TrainerCategory) => {
      category.value = value;
      reviewMode.value = false;
      dailyMode.value = false;
      nextQuestion();
    };
    const toggleReview = () => {
      reviewMode.value = !reviewMode.value;
      dailyMode.value = false;
      reviewIndex = 0;
      nextQuestion();
    };
    const toggleDaily = () => {
      dailyMode.value = !dailyMode.value;
      reviewMode.value = false;
      dailyCopied.value = false;
      nextQuestion();
    };
    const copyDaily = async () => {
      const text = dailyShareText(verdict.value.text);
      try {
        await navigator.clipboard.writeText(text);
        dailyCopied.value = true;
      } catch {
        window.prompt("아래 내용을 복사해 주세요", text);
      }
    };

    /* 성적 카드 — 오늘의 문제 결과를 이미지로 (단톡방·SNS 공유용) */
    const cardUrl = ref("");
    const cardShareable = ref(false);
    let cardCanvas: HTMLCanvasElement | null = null;
    const cardFileName = () => `gto-daily-${todayKey()}.png`;
    const openCard = () => {
      if (!question.value) return;
      // 판정은 오늘 «기록된» 결과(dailyState.lossBb)로 — 같은 문제를 나중에 다시
      // 풀어 다른 결과가 나와도 카드는 처음 기록을 따른다 (공유 문구와 동일 기준)
      const loss = dailyState.lossBb;
      const tone: "best" | "good" | "miss" =
        loss <= limits.value.bestBb
          ? "best"
          : loss <= limits.value.goodBb
          ? "good"
          : "miss";
      const toneText =
        tone === "best"
          ? "최적 선택"
          : tone === "good"
          ? "허용 가능한 선택"
          : "다시 볼 스팟";
      const node = question.value.node;
      cardCanvas = drawDailyCard({
        dateLabel: todayKey().replace(/-/g, "."),
        spotTitle: question.value.presetTitle,
        positionLabel: `${positionLabel.value} (${node.selectedSpot.player.toUpperCase()}) 차례`,
        potLabel: `팟 ${amountBb(node.selectedSpot.pot ?? node.startingPot)}`,
        board: node.currentBoard,
        hand: [question.value.handPair >>> 8, question.value.handPair & 0xff],
        verdictText: toneText,
        verdictTone: tone,
        evLossBb: loss,
        streak: dailyState.streak,
      });
      cardShareable.value = canShareCard();
      cardUrl.value = cardCanvas.toDataURL("image/png");
    };
    const shareCardNow = async () => {
      if (!cardCanvas) return;
      await shareCard(
        cardCanvas,
        cardFileName(),
        "오늘의 GTO 문제 — 나도 풀어보기: https://solver.holdemmaster.com/?view=trainer"
      );
    };
    const saveCardNow = async () => {
      if (cardCanvas) await saveCard(cardCanvas, cardFileName());
    };
    const closeCard = () => {
      cardUrl.value = "";
      cardCanvas = null;
    };
    const resetHistory = async () => {
      if (!confirm("이 기기의 트레이너 학습 기록을 모두 지울까요?")) return;
      await clearTrainerAttempts();
      attempts.value = [];
      reviewMode.value = false;
    };

    /* 계정 보관 (선택 기능) */

    const account = ref<AccountUser | null>(null);
    const syncing = ref(false);
    const syncMessage = ref("");
    const accountError = ref("");

    const runSync = async (silent = false) => {
      if (syncing.value || !account.value) return;
      syncing.value = true;
      accountError.value = "";
      try {
        const local = await getTrainerAttempts();
        const { result, missingLocally } = await syncAttempts(local);
        const merged = await mergeTrainerAttempts(missingLocally);
        if (merged) attempts.value = await getTrainerAttempts();
        if (!silent) {
          syncMessage.value =
            merged > 0
              ? `${result.uploaded}개 보관 · 다른 기기 기록 ${merged}개 가져옴`
              : `${result.uploaded}개 보관됨`;
        }
      } catch (error) {
        accountError.value = `동기화 실패: ${
          error instanceof Error ? error.message : String(error)
        }`;
      } finally {
        syncing.value = false;
      }
    };

    const doSignIn = async (provider: "google" | "kakao") => {
      accountError.value = "";
      try {
        await signIn(provider);
      } catch (error) {
        accountError.value = `로그인 실패: ${
          error instanceof Error ? error.message : String(error)
        }`;
      }
    };

    const doSignOut = async () => {
      await signOut();
      account.value = null;
      syncMessage.value = "";
      // 기기 기록은 남긴다 — 계정에서 뺐다고 지금까지 푼 게 사라지면 곤란
    };

    onMounted(async () => {
      try {
        const response = await fetch("trainer-decisions.json");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const loaded = (await response.json()) as TrainerBank;
        const errors = validateTrainerBank(loaded);
        if (errors.length) throw new Error(errors.slice(0, 3).join(", "));
        bank.value = loaded;
        attempts.value = await getTrainerAttempts();
        nextQuestion();
      } catch (error) {
        loadError.value = error instanceof Error ? error.message : String(error);
      }

      if (!isAccountEnabled) return;
      // 로그인 이력이 없으면 supabase 라이브러리를 아예 내려받지 않는다.
      // (App.vue가 이미 띄웠다면 그대로 이어 쓴다 — 인증 코드 처리는 거기서 끝냄)
      if (!hasStoredSession() && !isReturningFromAuth() && !isClientLoaded()) {
        return;
      }
      account.value = await getCurrentUser();
      // 화면에 들어온 시점엔 결과를 보여준다(몇 개 보관됐는지). 문제를 풀 때마다
      // 도는 동기화만 조용히 처리한다.
      if (account.value) void runSync();
      unsubscribeAuth = onAuthChange((user) => {
        const wasLoggedOut = !account.value;
        account.value = user;
        // 로그인한 순간, 기기에 쌓여 있던 기록을 계정으로 올린다
        if (user && wasLoggedOut) void runSync();
      });
    });

    onUnmounted(() => unsubscribeAuth());

    const boardCards = computed(
      () => question.value?.node.currentBoard.map(cardText) ?? []
    );
    const handCards = computed(() =>
      question.value ? trainerCardPair(question.value.handPair) : []
    );
    /**
     * EV 막대 길이. 액션 간 EV 차이가 0.03bb처럼 작아도 눈에 보이도록
     * 최저~최고를 35~100% 구간에 펼친다(비율 그대로 그리면 전부 같아 보임).
     */
    const evBarWidth = (evBb: number) => {
      const values = (evaluation.value?.actions ?? [])
        .map((item) => item.evBb)
        .filter((value) => Number.isFinite(value));
      if (!values.length || !Number.isFinite(evBb)) return 0;
      const max = Math.max(...values);
      const min = Math.min(...values);
      if (max === min) return 100;
      return 35 + ((evBb - min) / (max - min)) * 65;
    };

    const handLabels = computed(() =>
      question.value
        ? trainerHandLabels(
            question.value.handPair,
            question.value.node.currentBoard
          )
        : { made: "", draw: "" }
    );
    const articleUrl = computed(() =>
      question.value
        ? trackOutbound(
            ARTICLE_URLS[question.value.presetId] ?? "",
            "trainer-feedback"
          )
        : ""
    );
    const openSpot = () => {
      if (!question.value) return;
      store.pendingPresetPreview = question.value.presetId;
      store.sideView = "presets";
    };
    const positionLabel = computed(() => {
      if (!question.value) return "";
      const preset = PRESETS.find((item) => item.id === question.value?.presetId);
      return question.value.player === "oop"
        ? preset?.oopLabel ?? "OOP"
        : preset?.ipLabel ?? "IP";
    });
    const amountBb = (value: number) =>
      formatBb(value, question.value?.node.unitScale || 10);
    const historyLabel = (action: { name: string; amount: string }) =>
      trainerActionLabel(
        action,
        question.value?.node.startingPot || 0,
        question.value?.node.unitScale || 10
      );
    const historyPlayerLabel = (player: "oop" | "ip") => {
      const preset = PRESETS.find((item) => item.id === question.value?.presetId);
      return player === "oop"
        ? preset?.oopLabel ?? "OOP"
        : preset?.ipLabel ?? "IP";
    };

    return {
      categories,
      category,
      bank,
      question,
      evaluation,
      attempts,
      loadError,
      reviewMode,
      decisionCount,
      averageLoss,
      totalLoss,
      excellentRate,
      reviewAttempts,
      limits,
      dailyState,
      communityUrl: mainSiteUrl("/community", "daily-share"),
      dailyMode,
      dailyCopied,
      toggleDaily,
      copyDaily,
      cardUrl,
      cardShareable,
      openCard,
      shareCardNow,
      saveCardNow,
      closeCard,
      verdict,
      goNext,
      scrollToStats,
      scrollToDetail,
      streak,
      bestStreak,
      weakness,
      boardCards,
      handCards,
      handLabels,
      evBarWidth,
      articleUrl,
      openSpot,
      positionLabel,
      trainerCategoryLabel,
      trainerActionLabel,
      amountBb,
      historyLabel,
      historyPlayerLabel,
      accountEnabled: isAccountEnabled,
      account,
      syncing,
      syncMessage,
      accountError,
      runSync,
      doSignIn,
      doSignOut,
      choose,
      nextQuestion,
      changeCategory,
      toggleReview,
      resetHistory,
    };
  },
});
</script>

<style scoped>
/* .stat-chip은 index.css로 옮겼다 — 다른 화면도 같은 칩을 쓴다 */
.hand-tag {
  @apply rounded px-2 py-0.5 text-xs font-semibold;
}
.link-like {
  @apply text-blue-400 underline font-semibold;
}
/* 모바일에서 필터가 두 줄로 76px를 먹어 문제를 아래로 밀었다 */
.filter-btn {
  @apply shrink-0 px-2 py-1 text-xs md:px-3.5 md:py-1.5 md:text-sm;
}
/* 가로 스크롤 막대가 줄 높이를 바꾸지 않게 */
.filter-row {
  scrollbar-width: none;
}
.filter-row::-webkit-scrollbar {
  display: none;
}
</style>
