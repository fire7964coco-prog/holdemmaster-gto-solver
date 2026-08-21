<template>
  <div
    id="trainer-top"
    :class="'max-w-5xl flex flex-col ' + (evaluation ? 'pb-24 md:pb-10' : 'pb-10')"
  >
    <div
      v-if="loadError"
      class="rounded-lg border border-red-700 bg-red-950 px-4 py-3 text-red-300"
    >
      {{ L.loadFailed }} {{ loadError }}
    </div>
    <div v-else-if="!bank" class="py-8">
      <span class="spinner inline-block mr-3"></span>{{ L.loading }}
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
          {{ L.review(reviewAttempts.length) }}
        </button>
        <!-- 오늘의 문제: 날짜가 씨앗이라 모두 같은 문제를 받는다 -->
        <button
          :class="
            'button-base filter-btn ml-0 md:ml-2 flex items-center gap-1.5 ' +
            (dailyMode
              ? 'bg-brand text-brand-ink hover:bg-brand-hover'
              : 'bg-neutral-700 hover:bg-neutral-600')
          "
          @click="toggleDaily"
        >
          {{ L.daily }}
          <span v-if="dailyState.done" :aria-label="L.done">✓</span>
        </button>
      </div>

      <!-- 통계는 칩으로 압축 — 위쪽 공간을 덜 먹어야 문제가 화면 중앙에 온다 -->
      <div id="trainer-stats" class="order-4 md:order-2 flex flex-wrap gap-1.5 mt-3">
        <span class="stat-chip">{{ L.solved }} <b>{{ attempts.length }}</b></span>
        <span v-if="dailyState.streak" class="stat-chip">
          {{ L.daily }} <b>{{ dailyState.streak }}</b>{{ L.dayStreakSuffix }}
          <span v-if="dailyState.bestStreak > dailyState.streak" class="text-neutral-600">
            {{ L.bestPrefix }} {{ dailyState.bestStreak }}
          </span>
        </span>
        <span class="stat-chip">
          {{ L.streakLabel }}
          <b :class="streak >= 3 ? 'text-emerald-300' : ''">{{ streak }}</b>
          <span v-if="bestStreak > 0" class="text-neutral-600">{{ L.bestPrefix }} {{ bestStreak }}</span>
        </span>
        <span class="stat-chip">{{ L.totalLossLabel }} <b>{{ $n(totalLoss.toFixed(3)) }}</b>bb</span>
        <span class="stat-chip">{{ L.avgLossLabel }} <b>{{ $n(averageLoss.toFixed(3)) }}</b>bb</span>
        <span class="stat-chip">{{ L.goodRateLabel }} <b>{{ excellentRate.toFixed(0) }}</b>%</span>
      </div>

      <!-- 약점 분석: 카테고리별 평균 EV 손실 -->
      <div
        v-if="weakness.rows.some((row) => row.count > 0)"
        class="order-4 md:order-2 mt-3 rounded-lg border border-neutral-700 bg-neutral-900/50 px-3 py-2.5"
      >
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span class="font-semibold text-neutral-300">{{ L.weaknessTitle }}</span>
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
              {{ $n(L.avgOfPot(row.averageLossPct.toFixed(2))) }}
              <span class="text-neutral-600">({{ $n(row.averageLossBb.toFixed(3)) }}bb)</span>
              <!-- ⚠ Vue의 whitespace condense가 태그 사이 줄바꿈 공백을 지운다 →
                   «(0,002bb)(1 Hand)»로 붙어 나왔다 (2026-08-21 de 눈검수에서 발견, 전 언어 공통) -->
              <span class="text-neutral-600">&nbsp;{{ L.handCount(row.count) }}</span>
            </template>
            <span v-else class="text-neutral-600">{{ L.notSolved }}</span>
          </span>
        </div>
        <div v-if="weakness.weakest" class="mt-1.5 text-xs text-neutral-400">
          {{ L.weakestBefore }}<b class="text-orange-300">{{ weakness.weakest.label }}</b>{{ L.weakestAfter }}
          <button class="link-like" @click="changeCategory(weakness.weakest.category)">
            {{ L.practiceThis }}
          </button>
        </div>
        <div v-else class="mt-1.5 text-xs text-neutral-500">
          {{ L.weaknessHint }}
        </div>
      </div>

      <!-- 계정 보관 (선택) -->
      <div
        v-if="accountEnabled"
        class="order-4 md:order-2 mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-neutral-700 bg-neutral-900/50 px-3 py-2.5 text-xs"
      >
        <template v-if="account">
          <span class="text-neutral-300">
            {{ L.accountBefore }}<b class="text-emerald-300">{{ account.nickname }}</b>{{ L.accountAfter }}
          </span>
          <span v-if="syncMessage" class="text-neutral-500">{{ syncMessage }}</span>
          <span class="ml-auto flex items-center gap-3">
            <button
              class="link-like"
              :disabled="syncing"
              @click="runSync"
            >
              {{ syncing ? L.syncingNow : L.syncNow }}
            </button>
            <button class="text-neutral-500 hover:text-neutral-300" @click="doSignOut">
              {{ L.signOutLabel }}
            </button>
          </span>
        </template>
        <template v-else>
          <span class="text-neutral-400">
            {{ L.localOnlyBefore }}<b class="text-neutral-200">{{ L.localOnlyBold }}</b>{{ L.localOnlyAfter }}
          </span>
          <span class="ml-auto flex items-center gap-2">
            <button class="button-base bg-neutral-700 hover:bg-neutral-600 !py-1" @click="doSignIn('google')">
              {{ L.googleSignIn }}
            </button>
            <!-- 카카오는 한국어 화면에서만 — 다른 언어권에는 없는 서비스이고,
                 일본어 「カカオ」는 초콜릿 원료로 읽힌다 (사용자 결정 2026-08-21) -->
            <button
              v-if="isKo"
              class="button-base bg-neutral-700 hover:bg-neutral-600 !py-1"
              @click="doSignIn('kakao')"
            >
              {{ L.kakaoSignIn }}
            </button>
          </span>
        </template>
        <div v-if="accountError" class="w-full text-red-300">
          {{ accountError }}
        </div>
      </div>

      <p class="order-4 md:order-2 mt-2 text-right text-xs text-neutral-500">
        {{ $n(L.footerLine(decisionCount, bank.targetExploitabilityPct)) }}
      </p>

      <!--
        모바일: 성적 한 줄 요약만 위에 남기고 자세한 통계·약점 분석·계정 안내는
        문제 아래로 내렸다. 위쪽 군더더기가 250px를 먹어 액션 버튼이 첫 화면 밖으로
        밀려 있었다(390x844에서 y=848).
      -->
      <div
        class="order-2 md:hidden mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400"
      >
        <span>{{ L.solved }} <b class="text-neutral-200">{{ attempts.length }}</b></span>
        <span>
          {{ L.streakLabel }}
          <b :class="streak >= 3 ? 'text-emerald-300' : 'text-neutral-200'">{{ streak }}</b>
        </span>
        <span v-if="attempts.length">
          {{ L.goodRateLabel }} <b class="text-neutral-200">{{ excellentRate.toFixed(0) }}</b>%
        </span>
        <span v-if="dailyState.streak">
          {{ L.daily }} <b class="text-brand">{{ dailyState.streak }}</b>{{ L.dayStreakSuffix }}
        </span>
        <button class="ml-auto link-like" @click="scrollToStats">{{ L.details }}</button>
      </div>

      <!-- 좌: 문제 / 우: 채점. 답을 봐도 문제가 화면에서 사라지지 않게 나란히 둔다 -->
      <div
        v-if="question"
        class="order-3 md:order-4 mt-3 md:mt-5 grid gap-4 lg:grid-cols-[1.15fr_1fr] items-start"
      >
      <div class="rounded-xl border border-neutral-700 bg-neutral-800 p-4 md:p-5">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span class="text-sm font-semibold text-blue-300">
            {{ presetTitle }}
          </span>
          <span class="text-xs text-neutral-500">
            {{ positionLabel }} ({{ question.node.selectedSpot.player.toUpperCase() }})
            {{ L.toAct }}
          </span>
          <span class="ml-auto text-xs text-neutral-400">
            {{ L.potLabel }} {{ amountBb(question.node.selectedSpot.pot ?? question.node.startingPot) }}
            · {{ L.stackLabel }}
            {{ amountBb(question.node.selectedSpot.stack ?? question.node.effectiveStack) }}
          </span>
        </div>

        <div v-if="question.node.history.length" class="mt-3 text-sm text-neutral-400">
          {{ L.lineLabel }}
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
            <div class="text-xs text-neutral-500 mb-1">{{ L.boardLabel }}</div>
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
            <div class="text-xs text-neutral-500 mb-1">{{ L.myHand }}</div>
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
          {{ evaluation ? L.yourChoice : L.prompt }}
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
              {{ $n((evaluation.actions[index].frequency * 100).toFixed(1)) }}%
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
            {{ L.evLoss }}
            <b class="tabular-nums text-neutral-200">
              {{ $n(evaluation.evLossBb.toFixed(3)) }}bb
            </b>
          </div>
          <div class="md:hidden text-sm font-semibold text-neutral-300">
            {{ L.mobileDetailTitle }}
          </div>
          <p class="mt-1 text-xs text-neutral-500">
            {{ L.mixedNote }}
          </p>

          <div class="mt-4 space-y-2.5">
            <div v-for="action in evaluation.actions" :key="action.index">
              <div class="flex items-baseline gap-2 text-sm">
                <span :class="action.isBest ? 'font-bold text-emerald-300' : ''">
                  {{ action.label }}{{ action.isBest ? L.bestEvTag : "" }}
                </span>
                <span class="ml-auto tabular-nums text-xs text-neutral-500">
                  {{ $n((action.frequency * 100).toFixed(1)) }}%
                </span>
                <span class="w-16 text-right tabular-nums">
                  {{ $n(action.evBb.toFixed(3)) }}
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
            class="mt-4 panel-inner border-brand/40"
          >
            <div class="text-sm font-semibold text-brand">
              {{ L.dailyDone }}
              <span v-if="dailyState.streak > 1" class="text-neutral-300">
                · {{ dailyState.streak }}{{ L.dayStreakSuffix }}
              </span>
            </div>
            <div class="mt-1 text-xs text-neutral-400 leading-relaxed">
              {{ L.dailyDoneDesc }}
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <!-- 커뮤니티보다 단톡방·SNS가 먼저다 — 회원이 적어도 작동하는 유입 장치 -->
              <button
                class="button-base !px-2.5 !py-1 text-xs bg-brand text-brand-ink hover:bg-brand-hover"
                @click="openCard"
              >
                {{ L.makeCard }}
              </button>
              <button class="button-base button-blue !px-2.5 !py-1 text-xs" @click="copyDaily">
                {{ dailyCopied ? L.copied : L.copyResult }}
              </button>
              <!-- 복사만 시키고 갈 곳을 안 주면 아무도 안 올린다 (EN은 갈 곳이 없어 숨김) -->
              <a
                v-if="communityUrl"
                :href="communityUrl"
                target="_blank"
                rel="noopener"
                class="button-base bg-neutral-700 hover:bg-neutral-600 !px-2.5 !py-1 text-xs"
              >
                {{ L.openCommunity }}
              </a>
            </div>
            <div v-if="dailyCopied" class="mt-1.5 text-xs text-neutral-500 leading-relaxed">
              {{ L.pasteHintBefore }}<b class="text-neutral-300">{{ L.pasteHintBold }}</b>{{ L.pasteHintAfter }}
            </div>

            <!-- 오늘의 순위 — 구경은 로그인 없이, 이름 올리기만 로그인 (허들 최소화, 2026-08-17) -->
            <div v-if="accountEnabled" class="mt-3 border-t border-neutral-700/60 pt-2">
              <div class="flex items-center gap-2">
                <button class="link-like text-xs" @click="toggleBoard">
                  {{ boardOpen ? L.boardHide : L.boardShow }}
                </button>
                <span v-if="boardLoading" class="text-xs text-neutral-500">
                  {{ L.boardLoading }}
                </span>
              </div>
              <template v-if="boardOpen && board">
                <div class="mt-1.5 text-xs text-neutral-400">
                  {{ L.boardCount(board.total) }}
                  <template v-if="board.myRank"> · {{ L.boardMyRank(board.myRank) }}</template>
                </div>
                <ol class="mt-1 space-y-0.5 text-xs">
                  <li
                    v-for="(row, index) in board.rows"
                    :key="index"
                    :class="row.isMine ? 'text-brand font-semibold' : 'text-neutral-300'"
                  >
                    <span class="inline-block w-6 text-right tabular-nums text-neutral-500">
                      {{ index + 1 }}
                    </span>
                    <span class="ml-2">{{ row.nickname }}</span>
                    <span class="ml-2 tabular-nums text-neutral-500">
                      {{ $n(row.lossBb.toFixed(3)) }}bb
                    </span>
                  </li>
                </ol>
                <div v-if="!account" class="mt-1.5 text-xs text-neutral-500">
                  {{ L.boardLoginHint }}
                </div>
              </template>
              <div
                v-else-if="boardOpen && !boardLoading"
                class="mt-1.5 text-xs text-neutral-500"
              >
                {{ L.boardUnavailable }}
              </div>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap items-center gap-3">
            <button class="button-base button-green px-6" @click="goNext">
              {{ dailyMode && dailyState.done ? L.keepPracticing : L.nextHand }}
            </button>
            <a
              v-if="articleUrl"
              :href="articleUrl"
              target="_blank"
              class="text-sm text-blue-400 hover:underline"
            >
              {{ L.readArticle }}
            </a>
            <button
              class="text-sm text-neutral-400 hover:text-neutral-200"
              @click="openSpot"
            >
              {{ L.viewFull }}
            </button>
          </div>
        </template>

        <template v-else>
          <div class="text-sm font-semibold text-neutral-300">{{ L.resultTitle }}</div>
          <p class="mt-2 text-sm leading-relaxed text-neutral-500">
            {{ L.resultHintBefore }}<b class="text-neutral-400">{{ L.resultHintBold }}</b>{{ L.resultHintAfter }}
          </p>
          <p class="mt-3 text-xs leading-relaxed text-neutral-600">
            {{ L.gtoNoteBefore }}<b class="text-neutral-400">{{ L.gtoNoteBold }}</b>{{ L.gtoNoteAfter }}
            <template v-if="question">
              {{ $n(L.spotLimits(limits.potBb.toFixed(1), limits.bestBb.toFixed(2), limits.goodBb.toFixed(2))) }}
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
          {{ L.resetHistoryLabel }}
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
            {{ L.evLoss }}
            <b class="tabular-nums text-neutral-200">
              {{ $n(evaluation.evLossBb.toFixed(3)) }}bb
            </b>
            <button class="link-like ml-2" @click="scrollToDetail">{{ L.details }}</button>
          </div>
        </div>
        <button class="button-base button-green ml-auto shrink-0 px-5" @click="goNext">
          {{ dailyMode && dailyState.done ? L.keepPracticing : L.nextHand }}
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
            :alt="L.cardAlt"
            class="w-full max-h-[62vh] object-contain rounded-lg border border-neutral-700"
          />
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <button
              v-if="cardShareable"
              class="button-base bg-brand text-brand-ink hover:bg-brand-hover !px-3 !py-1.5 text-sm"
              @click="shareCardNow"
            >
              {{ L.shareApps }}
            </button>
            <button class="button-base button-blue !px-3 !py-1.5 text-sm" @click="saveCardNow">
              {{ L.saveImage }}
            </button>
            <button
              class="ml-auto text-sm text-neutral-400 hover:text-neutral-200"
              @click="closeCard"
            >
              {{ L.close }}
            </button>
          </div>
          <p class="mt-2 text-xs text-neutral-500 leading-relaxed">
            {{ L.cardHintBefore }}<b class="text-neutral-300">{{ L.cardHintBold }}</b>{{ L.cardHintAfter }}
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
import { fetchLeaderboard, submitDailyResult, Leaderboard } from "../leaderboard";
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
import {
  ARTICLE_URLS,
  PRESETS,
  ipLabelOf,
  oopLabelOf,
  presetTitleById,
} from "../presets";
import { i18n, localizeNumber } from "../i18n";
import { trackOutbound, mainSiteUrl } from "../outbound";
import { useStore } from "../store";
import { cardText, formatBb } from "../utils";
import {
  evaluateTrainerAction,
  makeTrainerQuestion,
  isAcceptable,
  lossLimits,
  lossPercentOfPot,
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

const M = {
  ko: {
    loadFailed: "트레이너 데이터를 불러오지 못했습니다:",
    loading: "트레이너 준비 중...",
    review: (n: number) => `복습 ${n}개`,
    daily: "오늘의 문제",
    done: "완료",
    solved: "풀이",
    dayStreakSuffix: "일 연속",
    bestPrefix: "/ 최고",
    streakLabel: "연속 정답",
    totalLossLabel: "누적 EV 손실",
    avgLossLabel: "평균 EV 손실",
    goodRateLabel: "좋은 선택",
    weaknessTitle: "약점 분석",
    avgOfPot: (pct: string) => `평균 팟의 ${pct}%`,
    handCount: (n: number) => `(${n}문제)`,
    notSolved: "미풀이",
    weakestBefore: "",
    weakestAfter: " 에서 손실이 가장 큽니다 —",
    practiceThis: "이 상황만 연습하기",
    weaknessHint: "상황별로 3문제 이상 풀면 어디가 약한지 알려드립니다.",
    accountBefore: "",
    accountAfter: " 님의 계정에 보관 중",
    syncingNow: "동기화 중...",
    syncNow: "지금 동기화",
    signOutLabel: "로그아웃",
    localOnlyBefore: "학습 기록이 ",
    localOnlyBold: "이 기기에만",
    localOnlyAfter:
      " 저장됩니다. 홀덤마스터 계정에 보관하면 다른 기기에서도 이어서 풀 수 있어요.",
    googleSignIn: "구글로 계속하기",
    kakaoSignIn: "카카오",
    footerLine: (nodes: number, pct: number) =>
      `13개 교육 프리셋 · ${nodes}개 결정 노드 · 계산 목표 오차 ${pct}%`,
    details: "자세히 ↓",
    toAct: "차례",
    potLabel: "팟",
    stackLabel: "스택",
    lineLabel: "진행:",
    boardLabel: "보드",
    myHand: "내 핸드",
    yourChoice: "내 선택",
    prompt: "어떤 액션을 선택하시겠습니까?",
    bestEvTag: " · 최고 EV",
    evLoss: "EV 손실",
    mobileDetailTitle: "액션별 빈도와 EV",
    mixedNote: "혼합 전략은 단순 오답 처리하지 않고 액션 EV 차이로 평가합니다.",
    dailyDone: "오늘의 문제 완료",
    dailyDoneDesc:
      "오늘은 모두 같은 문제를 풉니다. 결과를 올리면 다른 사람 선택과 비교할 수 있습니다.",
    makeCard: "성적 카드 만들기",
    boardShow: "오늘의 순위 보기",
    boardHide: "순위 접기",
    boardLoading: "불러오는 중...",
    boardCount: (n: number) => `오늘 ${n}명 참여`,
    boardMyRank: (r: number) => `내 순위 ${r}위`,
    boardLoginHint:
      "로그인하면 내 닉네임도 순위에 올라갑니다. 구경은 로그인 없이 가능합니다.",
    boardUnavailable: "순위표를 아직 열 수 없습니다.",
    copied: "복사 완료",
    copyResult: "결과 문구 복사",
    openCommunity: "커뮤니티 열기 →",
    pasteHintBefore: "커뮤니티에서 ",
    pasteHintBold: "[✏️ 글 쓰기]",
    pasteHintAfter: "를 누르고 붙여넣으면 됩니다.",
    keepPracticing: "계속 연습하기",
    nextHand: "다음 문제",
    readArticle: "이 스팟 해설 읽기 →",
    viewFull: "결과 전체 보기",
    resultTitle: "채점 결과",
    resultHintBefore: "액션을 고르면 여기에 ",
    resultHintBold: "각 액션의 빈도와 EV",
    resultHintAfter: ", 그리고 내 선택이 몇 bb 손해였는지가 표시됩니다.",
    gtoNoteBefore:
      "GTO는 같은 핸드도 액션을 섞습니다. 빈도가 낮은 선택이 곧 오답은 아니며, 기준은 EV 손실입니다 — ",
    gtoNoteBold: "팟 대비",
    gtoNoteAfter: " 0.35% 이하 최적 · 1% 이하 허용 · 그 이상 다시 볼 스팟.",
    spotLimits: (pot: string, best: string, good: string) =>
      `이 스팟(팟 ${pot}bb)에서는 ${best}bb · ${good}bb입니다.`,
    resetHistoryLabel: "학습 기록 초기화",
    cardAlt: "오늘의 문제 성적 카드",
    shareApps: "카카오톡·SNS로 공유",
    saveImage: "이미지 저장",
    close: "닫기",
    cardHintBefore: "저장한 카드를 단톡방이나 SNS에 올려보세요. 받은 사람도 오늘은 ",
    cardHintBold: "같은 문제",
    cardHintAfter: "를 풉니다. 카드에 정답은 담기지 않습니다.",
    verdictBest: "최적 선택",
    verdictGood: "허용 가능한 선택",
    verdictMiss: "다시 볼 스팟",
    promptCopy: "아래 내용을 복사해 주세요",
    shareText:
      "오늘의 GTO 문제 — 나도 풀어보기: https://solver.holdemmaster.com/?view=trainer",
    confirmReset: "이 기기의 트레이너 학습 기록을 모두 지울까요?",
    syncMerged: (uploaded: number, merged: number) =>
      `${uploaded}개 보관 · 다른 기기 기록 ${merged}개 가져옴`,
    syncSaved: (uploaded: number) => `${uploaded}개 보관됨`,
    syncFailed: (msg: string) => `동기화 실패: ${msg}`,
    signInFailed: (msg: string) => `로그인 실패: ${msg}`,
  },
  en: {
    loadFailed: "Failed to load trainer data:",
    loading: "Loading trainer…",
    review: (n: number) => `Review (${n})`,
    daily: "Daily Puzzle",
    done: "Done",
    solved: "Solved",
    dayStreakSuffix: "-day streak",
    bestPrefix: "/ best",
    streakLabel: "Streak",
    totalLossLabel: "Total EV loss",
    avgLossLabel: "Avg EV loss",
    goodRateLabel: "Good-play rate",
    weaknessTitle: "Leak Finder",
    avgOfPot: (pct: string) => `avg ${pct}% of the pot`,
    handCount: (n: number) => `(${n} hand${n === 1 ? "" : "s"})`,
    notSolved: "Not tried",
    weakestBefore: "Biggest losses in ",
    weakestAfter: " —",
    practiceThis: "Drill this spot type",
    weaknessHint: "Solve 3+ hands in each category to see where you're leaking.",
    accountBefore: "Saved to ",
    accountAfter: "'s account",
    syncingNow: "Syncing…",
    syncNow: "Sync now",
    signOutLabel: "Sign out",
    localOnlyBefore: "Your progress is saved ",
    localOnlyBold: "on this device only",
    localOnlyAfter:
      ". Link a HoldemMaster account to pick up where you left off on any device.",
    googleSignIn: "Continue with Google",
    kakaoSignIn: "Continue with Kakao",
    footerLine: (nodes: number, pct: number) =>
      `13 Study Spots · ${nodes} decision nodes · target exploitability ${pct}%`,
    details: "Details ↓",
    toAct: "to act",
    potLabel: "Pot",
    stackLabel: "Stack",
    lineLabel: "Line:",
    boardLabel: "Board",
    myHand: "Your hand",
    yourChoice: "Your choice",
    prompt: "What's your play?",
    bestEvTag: " · Highest EV",
    evLoss: "EV loss",
    mobileDetailTitle: "Frequency & EV by action",
    mixedNote:
      "Mixed strategies aren't marked wrong — grading is based on the EV difference between actions.",
    dailyDone: "Daily Puzzle complete",
    dailyDoneDesc:
      "Everyone gets the same puzzle today. Post your result to compare with other players.",
    makeCard: "Create a result card",
    boardShow: "View today's leaderboard",
    boardHide: "Hide leaderboard",
    boardLoading: "Loading…",
    boardCount: (n: number) => `${n} player${n === 1 ? "" : "s"} today`,
    boardMyRank: (r: number) => `My rank #${r}`,
    boardLoginHint:
      "Sign in to put your name on the board — viewing is open to everyone.",
    boardUnavailable: "The leaderboard isn't available yet.",
    copied: "Copied",
    copyResult: "Copy result text",
    openCommunity: "Open community →",
    pasteHintBefore: "In the community, hit ",
    pasteHintBold: "[✏️ New post]",
    pasteHintAfter: " and paste.",
    keepPracticing: "Keep practicing",
    nextHand: "Next hand",
    readArticle: "Read the spot breakdown →",
    viewFull: "View full solution",
    resultTitle: "Results",
    resultHintBefore: "Pick an action and you'll see ",
    resultHintBold: "each action's frequency and EV",
    resultHintAfter: ", plus how many bb your choice cost.",
    gtoNoteBefore:
      "GTO mixes actions with the same hand — a low-frequency choice isn't automatically a mistake. The measure is EV loss ",
    gtoNoteBold: "relative to the pot",
    gtoNoteAfter: ": ≤0.35% Best play · ≤1% Acceptable · above that, Review this spot.",
    spotLimits: (pot: string, best: string, good: string) =>
      `For this spot (${pot}bb pot) that's Best play ≤${best}bb · Acceptable ≤${good}bb.`,
    resetHistoryLabel: "Reset history",
    cardAlt: "Daily Puzzle result card",
    shareApps: "Share",
    saveImage: "Save image",
    close: "Close",
    cardHintBefore:
      "Post your card to a group chat or social media — anyone who sees it plays the ",
    cardHintBold: "same puzzle",
    cardHintAfter: " today. The card never spoils the answer.",
    verdictBest: "Best play",
    verdictGood: "Acceptable",
    verdictMiss: "Review this spot",
    promptCopy: "Copy the text below",
    shareText:
      "Today's GTO puzzle — try it yourself: https://solver.holdemmaster.com/?view=trainer",
    confirmReset: "Clear all trainer history on this device?",
    syncMerged: (uploaded: number, merged: number) =>
      `${uploaded} saved · ${merged} pulled from other devices`,
    syncSaved: (uploaded: number) => `${uploaded} saved`,
    syncFailed: (msg: string) => `Sync failed: ${msg}`,
    signInFailed: (msg: string) => `Sign-in failed: ${msg}`,
  },
  ja: {
    loadFailed: "トレーナーデータを読み込めませんでした:",
    loading: "トレーナーを準備中…",
    review: (n: number) => `復習 ${n}問`,
    daily: "今日のGTO問題",
    done: "完了",
    solved: "解答数",
    dayStreakSuffix: "日連続",
    bestPrefix: "/ 最高",
    streakLabel: "連続ベスト",
    totalLossLabel: "累計EVロス",
    avgLossLabel: "平均EVロス",
    goodRateLabel: "良い選択",
    weaknessTitle: "弱点分析",
    avgOfPot: (pct: string) => `平均でポットの${pct}%`,
    handCount: (n: number) => `(${n}問)`,
    notSolved: "未挑戦",
    weakestBefore: "",
    weakestAfter: " での損失が最も大きいです —",
    practiceThis: "このスポットだけ練習する",
    weaknessHint: "カテゴリごとに3問以上解くと、どこが弱いかをお知らせします。",
    accountBefore: "",
    accountAfter: " さんのアカウントに保存中",
    syncingNow: "同期中…",
    syncNow: "今すぐ同期",
    signOutLabel: "ログアウト",
    localOnlyBefore: "学習記録は",
    localOnlyBold: "この端末にのみ",
    localOnlyAfter:
      "保存されます。HoldemMasterアカウントに保存すると、他の端末でも続きから解けます。",
    googleSignIn: "Googleで続ける",
    kakaoSignIn: "カカオトークで続ける",
    footerLine: (nodes: number, pct: number) =>
      `13個の学習スポット・${nodes}個の決定ノード・計算目標誤差 ${pct}%`,
    details: "詳細 ↓",
    toAct: "の番",
    potLabel: "ポット",
    stackLabel: "スタック",
    lineLabel: "ライン:",
    boardLabel: "ボード",
    myHand: "自分のハンド",
    yourChoice: "あなたの選択",
    prompt: "どのアクションを選びますか？",
    bestEvTag: "・最高EV",
    evLoss: "EVロス",
    mobileDetailTitle: "アクション別の頻度とEV",
    mixedNote:
      "混合戦略は単純に不正解とせず、アクション間のEV差で評価します。",
    dailyDone: "今日のGTO問題 完了",
    dailyDoneDesc:
      "今日は全員が同じ問題を解きます。結果を投稿すると、他の人の選択と比較できます。",
    makeCard: "リザルトカードを作る",
    boardShow: "今日のランキングを見る",
    boardHide: "ランキングを閉じる",
    boardLoading: "読み込み中…",
    boardCount: (n: number) => `今日 ${n}人参加`,
    boardMyRank: (r: number) => `自分の順位 ${r}位`,
    boardLoginHint:
      "ログインすると自分のニックネームもランキングに載ります。閲覧はログインなしでも可能です。",
    boardUnavailable: "ランキングはまだ利用できません。",
    copied: "コピーしました",
    copyResult: "結果テキストをコピー",
    openCommunity: "コミュニティを開く →",
    pasteHintBefore: "コミュニティで",
    pasteHintBold: "[✏️ 投稿する]",
    pasteHintAfter: "を押して貼り付けてください。",
    keepPracticing: "練習を続ける",
    nextHand: "次の問題",
    readArticle: "このスポットの解説を読む →",
    viewFull: "結果全体を見る",
    resultTitle: "採点結果",
    resultHintBefore: "アクションを選ぶと、ここに",
    resultHintBold: "各アクションの頻度とEV",
    resultHintAfter: "、そして自分の選択が何bbの損だったかが表示されます。",
    gtoNoteBefore:
      "GTOは同じハンドでもアクションをミックスします。頻度が低い選択が即不正解ではなく、基準はEVロスです — ",
    gtoNoteBold: "ポット比",
    gtoNoteAfter: " 0.35%以下は最適な選択・1%以下は許容できる選択・それ以上は復習すべきスポット。",
    spotLimits: (pot: string, best: string, good: string) =>
      `このスポット（ポット${pot}bb）では ${best}bb・${good}bb が境界です。`,
    resetHistoryLabel: "学習記録をリセット",
    cardAlt: "今日のGTO問題のリザルトカード",
    shareApps: "アプリでシェア",
    saveImage: "画像を保存",
    close: "閉じる",
    cardHintBefore:
      "保存したカードをグループチャットやSNSに投稿してみましょう。受け取った人も今日は",
    cardHintBold: "同じ問題",
    cardHintAfter: "を解きます。カードに正解は含まれません。",
    verdictBest: "最適な選択",
    verdictGood: "許容できる選択",
    verdictMiss: "要復習",
    promptCopy: "以下の内容をコピーしてください",
    shareText:
      "今日のGTO問題 — あなたも挑戦: https://solver.holdemmaster.com/?view=trainer",
    confirmReset: "この端末のトレーナー学習記録をすべて削除しますか？",
    syncMerged: (uploaded: number, merged: number) =>
      `${uploaded}件保存・他端末の記録${merged}件を取得`,
    syncSaved: (uploaded: number) => `${uploaded}件保存済み`,
    syncFailed: (msg: string) => `同期失敗: ${msg}`,
    signInFailed: (msg: string) => `ログイン失敗: ${msg}`,
  },
  es: {
    loadFailed: "No se pudieron cargar los datos del entrenador:",
    loading: "Cargando el entrenador…",
    review: (n: number) => `Repasar ${n}`,
    daily: "Reto del día",
    done: "Hecho",
    solved: "Resueltas",
    dayStreakSuffix: " días seguidos",
    bestPrefix: "/ mejor",
    streakLabel: "Racha",
    totalLossLabel: "Pérdida de EV total",
    avgLossLabel: "Pérdida de EV media",
    goodRateLabel: "Buenas decisiones",
    weaknessTitle: "Detector de leaks",
    avgOfPot: (pct: string) => `media ${pct}% del bote`,
    handCount: (n: number) => `(${n} ${n === 1 ? "mano" : "manos"})`,
    notSolved: "sin intentar",
    weakestBefore: "Mayores pérdidas en ",
    weakestAfter: " —",
    practiceThis: "Solo este tipo de spot",
    weaknessHint: "Resuelve 3+ manos en cada categoría para ver dónde pierdes EV.",
    accountBefore: "Guardado en la cuenta de ",
    accountAfter: "",
    syncingNow: "Sincronizando…",
    syncNow: "Sincronizar ahora",
    signOutLabel: "Cerrar sesión",
    localOnlyBefore: "Tu progreso se guarda ",
    localOnlyBold: "solo en este dispositivo",
    localOnlyAfter:
      ". Vincula una cuenta de HoldemMaster para continuar donde te quedaste en cualquier dispositivo.",
    googleSignIn: "Continuar con Google",
    kakaoSignIn: "Kakao",
    footerLine: (nodes: number, pct: number) =>
      `13 presets de estudio · ${nodes} nodos de decisión · error objetivo ${pct}%`,
    details: "Detalles ↓",
    toAct: "por actuar",
    potLabel: "Bote",
    stackLabel: "Stack",
    lineLabel: "Línea:",
    boardLabel: "Board",
    myHand: "Tu mano",
    yourChoice: "Tu elección",
    prompt: "¿Cuál es tu jugada?",
    bestEvTag: " · Mayor EV",
    evLoss: "Pérdida de EV",
    mobileDetailTitle: "Frecuencia y EV por acción",
    mixedNote:
      "Las estrategias mixtas no se marcan como error — la nota se basa en la diferencia de EV entre acciones.",
    dailyDone: "Reto del día completado",
    dailyDoneDesc:
      "Hoy todos reciben el mismo reto. Publica tu resultado para compararlo con otros jugadores.",
    makeCard: "Crear tarjeta de resultado",
    boardShow: "Ver el ranking de hoy",
    boardHide: "Ocultar ranking",
    boardLoading: "Cargando…",
    boardCount: (n: number) => `${n} jugador${n === 1 ? "" : "es"} hoy`,
    boardMyRank: (r: number) => `mi puesto #${r}`,
    boardLoginHint:
      "Inicia sesión para poner tu nombre en el ranking — cualquiera puede verlo.",
    boardUnavailable: "El ranking aún no está disponible.",
    copied: "Copiado",
    copyResult: "Copiar texto del resultado",
    openCommunity: "Abrir comunidad →",
    pasteHintBefore: "En la comunidad, toca ",
    pasteHintBold: "[✏️ Nueva publicación]",
    pasteHintAfter: " y pega.",
    keepPracticing: "Seguir practicando",
    nextHand: "Siguiente mano",
    readArticle: "Leer el análisis del spot →",
    viewFull: "Ver la solución completa",
    resultTitle: "Resultados",
    resultHintBefore: "Elige una acción y verás ",
    resultHintBold: "la frecuencia y el EV de cada acción",
    resultHintAfter: ", además de cuántos bb te costó tu elección.",
    gtoNoteBefore:
      "El GTO mezcla acciones con la misma mano — una elección de baja frecuencia no es automáticamente un error. La medida es la pérdida de EV ",
    gtoNoteBold: "relativa al bote",
    gtoNoteAfter: ": ≤0.35% mejor jugada · ≤1% aceptable · más que eso, repasa el spot.",
    spotLimits: (pot: string, best: string, good: string) =>
      `En este spot (bote de ${pot}bb) eso es ${best}bb · ${good}bb.`,
    resetHistoryLabel: "Borrar historial",
    cardAlt: "Tarjeta de resultado del reto del día",
    shareApps: "Compartir en apps",
    saveImage: "Guardar imagen",
    close: "Cerrar",
    cardHintBefore:
      "Publica tu tarjeta en un chat de grupo o en redes — quien la vea juega el ",
    cardHintBold: "mismo reto",
    cardHintAfter: " hoy. La tarjeta nunca revela la respuesta.",
    verdictBest: "Mejor jugada",
    verdictGood: "Aceptable",
    verdictMiss: "Repasa este spot",
    promptCopy: "Copia el texto de abajo",
    shareText:
      "Reto GTO del día — inténtalo tú también: https://solver.holdemmaster.com/?view=trainer",
    confirmReset: "¿Borrar todo el historial del entrenador en este dispositivo?",
    syncMerged: (uploaded: number, merged: number) =>
      `${uploaded} guardadas · ${merged} traídas de otros dispositivos`,
    syncSaved: (uploaded: number) => `${uploaded} guardadas`,
    syncFailed: (msg: string) => `Error de sincronización: ${msg}`,
    signInFailed: (msg: string) => `Error al iniciar sesión: ${msg}`,
  },
  pt: {
    loadFailed: "Não foi possível carregar os dados do Treinador:",
    loading: "Carregando o treinador…",
    review: (n: number) => `Revisar (${n})`,
    daily: "Desafio do dia",
    done: "Feito",
    solved: "Resolvidas",
    dayStreakSuffix: " em sequência",
    bestPrefix: "/ melhor",
    streakLabel: "Sequência",
    totalLossLabel: "Perda de EV total",
    avgLossLabel: "Perda de EV média",
    goodRateLabel: "Boas decisões",
    weaknessTitle: "Detector de leaks",
    avgOfPot: (pct: string) => `média ${pct}% do pote`,
    handCount: (n: number) => `(${n} ${n === 1 ? "mão" : "mãos"})`,
    notSolved: "sem tentativas",
    weakestBefore: "Maiores perdas em ",
    weakestAfter: " —",
    practiceThis: "Só este tipo de spot",
    weaknessHint: "Resolva 3+ mãos em cada categoria para ver onde você perde EV.",
    accountBefore: "Salvo na conta de ",
    accountAfter: "",
    syncingNow: "Sincronizando…",
    syncNow: "Sincronizar agora",
    signOutLabel: "Sair",
    localOnlyBefore: "O seu progresso é salvo ",
    localOnlyBold: "somente neste dispositivo",
    localOnlyAfter:
      ". Vincule uma conta HoldemMaster para continuar de onde parou em qualquer dispositivo.",
    googleSignIn: "Continuar com o Google",
    kakaoSignIn: "Continuar com o Kakao",
    footerLine: (nodes: number, pct: number) =>
      `13 Spots de estudo · ${nodes} nós de decisão · erro objetivo ${pct}%`,
    details: "Detalhes ↓",
    toAct: "para agir",
    potLabel: "Pote",
    stackLabel: "Stack",
    lineLabel: "Linha:",
    boardLabel: "Board",
    myHand: "Sua mão",
    yourChoice: "Sua escolha",
    prompt: "Qual é a sua jogada?",
    bestEvTag: " · Maior EV",
    evLoss: "Perda de EV",
    mobileDetailTitle: "Frequência e EV por ação",
    mixedNote:
      "As estratégias mistas não são marcadas como erro — a nota se baseia na diferença de EV entre as ações.",
    dailyDone: "Desafio do dia concluído",
    dailyDoneDesc:
      "Hoje todo mundo recebe o mesmo desafio. Publique o seu resultado para comparar com outros jogadores.",
    makeCard: "Criar card de resultado",
    boardShow: "Ver o ranking de hoje",
    boardHide: "Ocultar ranking",
    boardLoading: "Carregando…",
    boardCount: (n: number) => `${n} jogador${n === 1 ? "" : "es"} hoje`,
    boardMyRank: (r: number) => `Minha posição #${r}`,
    boardLoginHint:
      "Faça login para colocar o seu nome no ranking — qualquer pessoa pode ver.",
    boardUnavailable: "O ranking ainda não está disponível.",
    copied: "Copiado",
    copyResult: "Copiar texto do resultado",
    openCommunity: "Abrir comunidade →",
    pasteHintBefore: "Na comunidade, toque em ",
    pasteHintBold: "[✏️ Nova publicação]",
    pasteHintAfter: " e cole.",
    keepPracticing: "Continuar praticando",
    nextHand: "Próxima mão",
    readArticle: "Ler a análise do spot →",
    viewFull: "Ver a solução completa",
    resultTitle: "Resultados",
    resultHintBefore: "Escolha uma ação e você verá ",
    resultHintBold: "a frequência e o EV de cada ação",
    resultHintAfter: ", além de quantos bb a sua escolha custou.",
    gtoNoteBefore:
      "O GTO mistura ações com a mesma mão — uma escolha de baixa frequência não é automaticamente um erro. A medida é a perda de EV ",
    gtoNoteBold: "em relação ao pote",
    gtoNoteAfter:
      ": ≤0,35% Melhor jogada · ≤1% Aceitável · acima disso, Revise este spot.",
    spotLimits: (pot: string, best: string, good: string) =>
      `Neste spot (pote de ${pot}bb): Melhor jogada ≤${best}bb · Aceitável ≤${good}bb.`,
    resetHistoryLabel: "Apagar histórico",
    cardAlt: "Card de resultado do desafio do dia",
    shareApps: "Compartilhar em apps",
    saveImage: "Salvar imagem",
    close: "Fechar",
    cardHintBefore:
      "Publique o seu card em um grupo de conversa ou nas redes — quem vir joga o ",
    cardHintBold: "mesmo desafio",
    cardHintAfter: " hoje. O card nunca revela a resposta.",
    verdictBest: "Melhor jogada",
    verdictGood: "Aceitável",
    verdictMiss: "Revise este spot",
    promptCopy: "Copie o texto abaixo",
    shareText:
      "Desafio GTO do dia — tente você também: https://solver.holdemmaster.com/?view=trainer",
    confirmReset: "Apagar todo o histórico do treinador neste dispositivo?",
    syncMerged: (uploaded: number, merged: number) =>
      `${uploaded} salva${uploaded === 1 ? "" : "s"} · ${merged} trazida${
        merged === 1 ? "" : "s"
      } de outros dispositivos`,
    syncSaved: (uploaded: number) =>
      `${uploaded} salva${uploaded === 1 ? "" : "s"}`,
    syncFailed: (msg: string) => `Erro de sincronização: ${msg}`,
    signInFailed: (msg: string) => `Erro ao fazer login: ${msg}`,
  },
  de: {
    loadFailed: "Die Trainer-Daten konnten nicht geladen werden:",
    loading: "Trainer wird geladen…",
    review: (n: number) => `Wiederholen (${n})`,
    daily: "Tagesaufgabe",
    done: "Erledigt",
    solved: "Gelöst",
    // «3 in Folge»는 명사가 없어 비문 → 수와 무관하게 맞는 «-mal in Folge»로 (1-mal / 3-mal)
    dayStreakSuffix: "-mal in Folge",
    bestPrefix: "/ Bestwert",
    streakLabel: "Serie",
    totalLossLabel: "EV-Verlust gesamt",
    avgLossLabel: "EV-Verlust im Schnitt",
    goodRateLabel: "Gute Entscheidungen",
    weaknessTitle: "Leak-Analyse",
    avgOfPot: (pct: string) => `im Schnitt ${pct}% vom Pot`,
    // 독일어 복수: 1 Hand / 2 Hände
    handCount: (n: number) => `(${n} ${n === 1 ? "Hand" : "Hände"})`,
    notSolved: "Keine Versuche",
    weakestBefore: "Größte Verluste bei ",
    weakestAfter: " –",
    practiceThis: "Nur diesen Spot-Typ üben",
    weaknessHint: "Löse 3+ Hände je Kategorie, um zu sehen, wo du EV verlierst.",
    accountBefore: "Gespeichert im Konto von ",
    accountAfter: "",
    syncingNow: "Wird synchronisiert…",
    syncNow: "Jetzt synchronisieren",
    signOutLabel: "Abmelden",
    localOnlyBefore: "Dein Fortschritt wird ",
    localOnlyBold: "nur auf diesem Gerät",
    localOnlyAfter:
      " gespeichert. Verknüpf ein HoldemMaster-Konto, um auf jedem Gerät dort weiterzumachen, wo du aufgehört hast.",
    googleSignIn: "Weiter mit Google",
    kakaoSignIn: "Weiter mit Kakao",
    footerLine: (nodes: number, pct: number) =>
      `13 Lernspots · ${nodes} Entscheidungsknoten · Zielabweichung ${pct}%`,
    details: "Details ↓",
    toAct: "am Zug",
    potLabel: "Pot",
    stackLabel: "Stack",
    lineLabel: "Line:",
    boardLabel: "Board",
    myHand: "Deine Hand",
    yourChoice: "Deine Wahl",
    prompt: "Was spielst du?",
    bestEvTag: " · Höchster EV",
    evLoss: "EV-Verlust",
    mobileDetailTitle: "Frequenz und EV je Aktion",
    mixedNote:
      "Gemischte Strategien zählen nicht als Fehler – benotet wird nach der EV-Differenz zwischen den Aktionen.",
    dailyDone: "Tagesaufgabe geschafft",
    dailyDoneDesc:
      "Heute bekommen alle dieselbe Aufgabe. Poste dein Ergebnis und vergleiche dich mit anderen.",
    makeCard: "Ergebniskarte erstellen",
    boardShow: "Rangliste von heute ansehen",
    boardHide: "Rangliste ausblenden",
    boardLoading: "Wird geladen…",
    // Spieler ist im Deutschen Singular wie Plural
    boardCount: (n: number) => `${n} Spieler heute`,
    boardMyRank: (r: number) => `Mein Platz #${r}`,
    boardLoginHint:
      "Melde dich an, damit dein Name in der Rangliste steht – ansehen kann sie jeder, auch ohne Anmeldung.",
    boardUnavailable: "Die Rangliste ist noch nicht verfügbar.",
    copied: "Kopiert",
    copyResult: "Ergebnistext kopieren",
    openCommunity: "Community öffnen →",
    pasteHintBefore: "Tippe in der Community auf ",
    pasteHintBold: "[✏️ Neuer Beitrag]",
    pasteHintAfter: " und füge es ein.",
    keepPracticing: "Weiterüben",
    nextHand: "Nächste Hand",
    readArticle: "Analyse zum Spot lesen →",
    viewFull: "Komplette Lösung ansehen",
    resultTitle: "Bewertung",
    resultHintBefore: "Wähle eine Aktion und du siehst ",
    resultHintBold: "Frequenz und EV jeder Aktion",
    resultHintAfter: " – dazu, wie viele bb deine Wahl gekostet hat.",
    gtoNoteBefore:
      "GTO mischt mit derselben Hand mehrere Aktionen – eine seltene Wahl ist nicht automatisch ein Fehler. Gemessen wird der EV-Verlust ",
    gtoNoteBold: "im Verhältnis zum Pot",
    gtoNoteAfter:
      ": ≤0,35% Beste Wahl · ≤1% Vertretbar · darüber Nochmal ansehen.",
    spotLimits: (pot: string, best: string, good: string) =>
      `In diesem Spot (Pot ${pot}bb): Beste Wahl ≤${best}bb · Vertretbar ≤${good}bb.`,
    resetHistoryLabel: "Trainer-Verlauf löschen",
    cardAlt: "Ergebniskarte der Tagesaufgabe",
    shareApps: "In Apps teilen",
    saveImage: "Bild speichern",
    close: "Schließen",
    cardHintBefore:
      "Poste deine Karte in einen Chat oder in die sozialen Netzwerke – wer sie sieht, spielt heute ",
    cardHintBold: "dieselbe Aufgabe",
    cardHintAfter: ". Die Karte verrät nie die Lösung.",
    verdictBest: "Beste Wahl",
    verdictGood: "Vertretbar",
    verdictMiss: "Nochmal ansehen",
    promptCopy: "Kopiere den Text unten",
    shareText:
      "GTO-Tagesaufgabe – probiere sie auch: https://solver.holdemmaster.com/?view=trainer",
    confirmReset: "Den gesamten Trainer-Verlauf auf diesem Gerät löschen?",
    syncMerged: (uploaded: number, merged: number) =>
      `${uploaded} gespeichert · ${merged} von anderen Geräten geholt`,
    syncSaved: (uploaded: number) => `${uploaded} gespeichert`,
    syncFailed: (msg: string) => `Fehler bei der Synchronisierung: ${msg}`,
    signInFailed: (msg: string) => `Fehler beim Anmelden: ${msg}`,
  },
} as const;

export default defineComponent({
  setup() {
    const store = useStore();
    const L = computed(() => M[i18n.locale]);
    // 카카오 로그인은 한국어 화면에서만 (사용자 결정 2026-08-21)
    const isKo = computed(() => i18n.locale === "ko");
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
        return { text: L.value.verdictBest, className: "text-emerald-300" };
      if (result.evLossBb <= limits.value.goodBb)
        return { text: L.value.verdictGood, className: "text-blue-300" };
      return { text: L.value.verdictMiss, className: "text-orange-300" };
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
      if (dailyMode.value) {
        recordDaily(result.evLossBb);
        // 로그인 상태면 오늘의 순위에도 올린다 (첫 기록만 유효 — 서버가 중복 무시)
        if (account.value) void submitToBoard();
      }
      noteTrainerSolved();
      // 로그인 상태면 조용히 올린다 (실패해도 풀이 흐름을 막지 않음)
      if (account.value) void runSync(true);
    };

    /* 오늘의 순위 (리더보드) — 구경은 비로그인 허용, 등록만 로그인 */
    const board = ref<Leaderboard | null>(null);
    const boardOpen = ref(false);
    const boardLoading = ref(false);
    const submitToBoard = async () => {
      if (!dailyState.done || !bank.value) return;
      // 오늘의 문제 스팟은 날짜로 정해지므로 여기서 되찾는다 (팟 대비 % 계산용)
      const dailyQuestion = makeDailyQuestion(bank.value);
      if (!dailyQuestion) return;
      const ok = await submitDailyResult(
        todayKey(),
        dailyState.lossBb,
        lossPercentOfPot({
          presetId: dailyQuestion.presetId,
          evLossBb: dailyState.lossBb,
        })
      );
      if (ok) board.value = null; // 다음 열람 때 새로 읽는다
    };
    const loadBoard = async () => {
      boardLoading.value = true;
      board.value = await fetchLeaderboard(todayKey());
      boardLoading.value = false;
    };
    const toggleBoard = () => {
      boardOpen.value = !boardOpen.value;
      if (boardOpen.value && !board.value) void loadBoard();
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
        window.prompt(L.value.promptCopy, text);
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
          ? L.value.verdictBest
          : tone === "good"
          ? L.value.verdictGood
          : L.value.verdictMiss;
      const node = question.value.node;
      cardCanvas = drawDailyCard({
        dateLabel: todayKey().replace(/-/g, "."),
        spotTitle: presetTitleById(question.value.presetId),
        positionLabel: `${positionLabel.value} (${node.selectedSpot.player.toUpperCase()}) ${L.value.toAct}`,
        potLabel: `${L.value.potLabel} ${amountBb(node.selectedSpot.pot ?? node.startingPot)}`,
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
      await shareCard(cardCanvas, cardFileName(), L.value.shareText);
    };
    const saveCardNow = async () => {
      if (cardCanvas) await saveCard(cardCanvas, cardFileName());
    };
    const closeCard = () => {
      cardUrl.value = "";
      cardCanvas = null;
    };
    const resetHistory = async () => {
      if (!confirm(L.value.confirmReset)) return;
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
              ? L.value.syncMerged(result.uploaded, merged)
              : L.value.syncSaved(result.uploaded);
        }
      } catch (error) {
        accountError.value = L.value.syncFailed(
          error instanceof Error ? error.message : String(error)
        );
      } finally {
        syncing.value = false;
      }
    };

    const doSignIn = async (provider: "google" | "kakao") => {
      accountError.value = "";
      try {
        await signIn(provider);
      } catch (error) {
        accountError.value = L.value.signInFailed(
          error instanceof Error ? error.message : String(error)
        );
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
        // 로그인한 순간, 기기에 쌓여 있던 기록을 계정으로 올린다.
        // 오늘의 문제를 이미 풀었다면 순위에도 뒤늦게 올린다.
        if (user && wasLoggedOut) {
          void runSync();
          void submitToBoard();
        }
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
    const articleUrl = computed(() => {
      // 해설 포스팅은 한국어 블로그뿐이라 EN에서는 링크를 숨긴다 (EN posts don't exist yet)
      if (i18n.locale !== "ko") return "";
      return question.value
        ? trackOutbound(
            ARTICLE_URLS[question.value.presetId] ?? "",
            "trainer-feedback"
          )
        : "";
    });
    const openSpot = () => {
      if (!question.value) return;
      store.pendingPresetPreview = question.value.presetId;
      store.sideView = "presets";
    };
    // presetTitle은 문제 생성 시점에 고정되므로 표시용은 locale 반응형으로 다시 계산
    const presetTitle = computed(() =>
      question.value ? presetTitleById(question.value.presetId) : ""
    );
    const positionLabel = computed(() => {
      if (!question.value) return "";
      const preset = PRESETS.find((item) => item.id === question.value?.presetId);
      return question.value.player === "oop"
        ? (preset && oopLabelOf(preset)) || "OOP"
        : (preset && ipLabelOf(preset)) || "IP";
    });
    const amountBb = (value: number) =>
      localizeNumber(formatBb(value, question.value?.node.unitScale || 10));
    const historyLabel = (action: { name: string; amount: string }) =>
      trainerActionLabel(
        action,
        question.value?.node.startingPot || 0,
        question.value?.node.unitScale || 10
      );
    const historyPlayerLabel = (player: "oop" | "ip") => {
      const preset = PRESETS.find((item) => item.id === question.value?.presetId);
      return player === "oop"
        ? (preset && oopLabelOf(preset)) || "OOP"
        : (preset && ipLabelOf(preset)) || "IP";
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
      // 커뮤니티는 한국어 페이지뿐(/en/community 없음, 2026-08-19 실측 404)
      // → EN에서는 빈 값을 줘서 버튼 자체를 숨긴다 (한국어 사이트로 보내지 않는다)
      communityUrl: computed(() =>
        i18n.locale === "ko" ? mainSiteUrl("/community", "daily-share") : ""
      ),
      dailyMode,
      dailyCopied,
      toggleDaily,
      copyDaily,
      board,
      boardOpen,
      boardLoading,
      toggleBoard,
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
      presetTitle,
      positionLabel,
      L,
      isKo,
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
