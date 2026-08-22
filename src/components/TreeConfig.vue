<template>
  <div v-if="!isEditMode">
    <!-- ⚠ flex-wrap 필수 — 라벨이 긴 언어(es·pt)에서는 왼쪽 열이 넓어져
         오른쪽 «저장된 설정» 패널이 화면 밖으로 잘려 나갔다 (2026-08-21 pt 눈검수).
         자리가 모자라면 잘리는 대신 아래로 내려가게 한다. -->
    <div class="flex flex-col md:flex-row md:flex-wrap">
      <div class="shrink-0">
        <div class="mb-2 text-xs text-neutral-500">
          {{ L.chipNote }}
        </div>
        <div class="flex flex-col sm:flex-row my-1 gap-0 sm:gap-8">
          <div>
            <div class="my-1">
              <span class="inline-block w-[7.5rem]">{{ L.startingPot }}</span>
              <input
                v-model="config.startingPot"
                type="number"
                @input="onAmountEdit"
                :class="
                  'w-24 px-2 py-1 rounded-lg text-sm text-center ' +
                  (config.startingPot <= 0 ||
                  config.startingPot > MAX_AMOUNT ||
                  config.startingPot % 1 !== 0
                    ? 'input-error'
                    : '')
                "
                :disabled="hasEdit"
                min="0"
                :max="MAX_AMOUNT"
              />
            </div>

            <div class="my-1">
              <span class="inline-block w-[7.5rem]">{{ L.effectiveStack }}</span>
              <input
                v-model="config.effectiveStack"
                type="number"
                @input="onAmountEdit"
                :class="
                  'w-24 px-2 py-1 rounded-lg text-sm text-center ' +
                  (config.effectiveStack <= 0 ||
                  config.effectiveStack > MAX_AMOUNT ||
                  config.effectiveStack % 1 !== 0
                    ? 'input-error'
                    : '')
                "
                :disabled="hasEdit"
                min="0"
                :max="MAX_AMOUNT"
              />
            </div>
          </div>

          <div>
            <div class="my-1">
              <span class="inline-block w-20">{{ L.rake }}</span>
              <input
                v-model="config.rakePercent"
                type="number"
                :class="
                  'w-24 px-2 py-1 rounded-lg text-sm text-center ' +
                  (config.rakePercent < 0 || config.rakePercent > 100
                    ? 'input-error'
                    : '')
                "
                :disabled="hasEdit"
                min="0"
                max="100"
                step="0.5"
              />
              %
            </div>

            <div class="my-1">
              <span class="inline-block w-20">{{ L.rakeCap }}</span>
              <input
                v-model="config.rakeCap"
                type="number"
                :class="
                  'w-24 px-2 py-1 rounded-lg text-sm text-center ' +
                  (config.rakeCap < 0 || config.rakeCap > 3 * MAX_AMOUNT
                    ? 'input-error'
                    : '')
                "
                :disabled="hasEdit"
                min="0"
                :max="3 * MAX_AMOUNT"
              />
            </div>
          </div>

          <div class="ml-auto p-1">
            <button class="button-base button-blue" @click="clearConfig">
              {{ L.reset }}
            </button>
          </div>
        </div>

        <div
          v-if="errorBasics.length > 0"
          class="flex font-semibold text-red-400"
        >
          <div class="underline">{{ L.error }}</div>
          <div class="ml-2">
            <div v-for="error in errorBasics" :key="error">
              {{ error }}
            </div>
          </div>
        </div>

        <div class="mt-6">
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span class="font-semibold shrink-0">{{ L.oopBetSizes }}</span>
            <label class="inline-block shrink-0 ml-0 md:ml-2">
              <input
                v-model="config.donkOption"
                type="checkbox"
                class="mr-1 align-middle rounded cursor-pointer peer"
                :disabled="hasEdit"
              />
              <span class="cursor-pointer peer-disabled:cursor-not-allowed">
                {{ L.donkOption }}
              </span>
            </label>
            <div class="flex flex-grow justify-center">
              <Tippy
                class="inline-block cursor-help text-neutral-400"
                max-width="500px"
                trigger="mouseenter click"
                placement="bottom"
                :delay="[200, 0]"
                :interactive="true"
              >
                <QuestionMarkCircleIcon class="inline w-5 h-5" />
                <div class="inline-block ml-0.5 text-sm underline">
                  {{ L.howToInput }}
                </div>
                <template #content>
                  <div class="px-1 py-0.5 text-justify">
                    {{ L.inputHelpIntro }}
                    <ul class="pl-6 list-disc">
                      <li class="mt-1">{{ L.inputHelpPercent }}</li>
                      <li class="mt-1">{{ L.inputHelpMultiple }}</li>
                      <li class="mt-1">{{ L.inputHelpAllin }}</li>
                      <li class="mt-1">{{ L.inputHelpFixed }}</li>
                      <li class="mt-1">{{ L.inputHelpGeometric }}</li>
                    </ul>
                  </div>
                </template>
              </Tippy>
            </div>
          </div>

          <div class="flex gap-5 bet-grid">
            <div>
              <div class="my-1 underline">{{ L.flop }}</div>
              <div class="my-1">
                <span class="inline-block w-14">{{ L.bet }}</span>
                <input
                  v-model="config.oopFlopBet"
                  type="text"
                  :class="
                    'w-24 px-2 py-1 rounded-lg text-sm ' +
                    (!config.oopFlopBetSanitized.valid ? 'input-error' : '')
                  "
                  :disabled="hasEdit"
                  @change="
                    config.oopFlopBetSanitized.valid &&
                      (config.oopFlopBet = config.oopFlopBetSanitized.s)
                  "
                />
                %
              </div>
              <div class="my-1">
                <span class="inline-block w-14">{{ L.raise }}</span>
                <input
                  v-model="config.oopFlopRaise"
                  type="text"
                  :class="
                    'w-24 px-2 py-1 rounded-lg text-sm ' +
                    (!config.oopFlopRaiseSanitized.valid ? 'input-error' : '')
                  "
                  :disabled="hasEdit"
                  @change="
                    config.oopFlopRaiseSanitized.valid &&
                      (config.oopFlopRaise = config.oopFlopRaiseSanitized.s)
                  "
                />
                %
              </div>
            </div>

            <div>
              <div class="my-1 underline">{{ L.turn }}</div>
              <div class="my-1">
                <span class="inline-block w-14">{{ L.bet }}</span>
                <input
                  v-model="config.oopTurnBet"
                  type="text"
                  :class="
                    'w-24 px-2 py-1 rounded-lg text-sm ' +
                    (!config.oopTurnBetSanitized.valid ? 'input-error' : '')
                  "
                  :disabled="hasEdit"
                  @change="
                    config.oopTurnBetSanitized.valid &&
                      (config.oopTurnBet = config.oopTurnBetSanitized.s)
                  "
                />
                %
              </div>
              <div class="my-1">
                <span class="inline-block w-14">{{ L.raise }}</span>
                <input
                  v-model="config.oopTurnRaise"
                  type="text"
                  :class="
                    'w-24 px-2 py-1 rounded-lg text-sm ' +
                    (!config.oopTurnRaiseSanitized.valid ? 'input-error' : '')
                  "
                  :disabled="hasEdit"
                  @change="
                    config.oopTurnRaiseSanitized.valid &&
                      (config.oopTurnRaise = config.oopTurnRaiseSanitized.s)
                  "
                />
                %
              </div>
              <div v-if="config.donkOption" class="my-1">
                <span class="inline-block w-14">{{ L.donk }}</span>
                <input
                  v-model="config.oopTurnDonk"
                  type="text"
                  :class="
                    'w-24 px-2 py-1 rounded-lg text-sm ' +
                    (!config.oopTurnDonkSanitized.valid ? 'input-error' : '')
                  "
                  :disabled="hasEdit"
                  @change="
                    config.oopTurnDonkSanitized.valid &&
                      (config.oopTurnDonk = config.oopTurnDonkSanitized.s)
                  "
                />
                %
              </div>
            </div>

            <div>
              <div class="my-1 underline">{{ L.river }}</div>
              <div class="my-1">
                <span class="inline-block w-14">{{ L.bet }}</span>
                <input
                  v-model="config.oopRiverBet"
                  type="text"
                  :class="
                    'w-24 px-2 py-1 rounded-lg text-sm ' +
                    (!config.oopRiverBetSanitized.valid ? 'input-error' : '')
                  "
                  :disabled="hasEdit"
                  @change="
                    config.oopRiverBetSanitized.valid &&
                      (config.oopRiverBet = config.oopRiverBetSanitized.s)
                  "
                />
                %
              </div>
              <div class="my-1">
                <span class="inline-block w-14">{{ L.raise }}</span>
                <input
                  v-model="config.oopRiverRaise"
                  type="text"
                  :class="
                    'w-24 px-2 py-1 rounded-lg text-sm ' +
                    (!config.oopRiverRaiseSanitized.valid ? 'input-error' : '')
                  "
                  :disabled="hasEdit"
                  @change="
                    config.oopRiverRaiseSanitized.valid &&
                      (config.oopRiverRaise = config.oopRiverRaiseSanitized.s)
                  "
                />
                %
              </div>
              <div v-if="config.donkOption" class="my-1">
                <span class="inline-block w-14">{{ L.donk }}</span>
                <input
                  v-model="config.oopRiverDonk"
                  type="text"
                  :class="
                    'w-24 px-2 py-1 rounded-lg text-sm ' +
                    (!config.oopRiverDonkSanitized.valid ? 'input-error' : '')
                  "
                  :disabled="hasEdit"
                  @change="
                    config.oopRiverDonkSanitized.valid &&
                      (config.oopRiverDonk = config.oopRiverDonkSanitized.s)
                  "
                />
                %
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="flex flex-wrap items-center gap-x-4">
            <div class="mt-6 font-semibold shrink-0">{{ L.ipBetSizes }}</div>
            <div class="flex flex-grow items-center justify-center gap-6">
              <button
                class="mt-3 button-base button-blue button-arrow"
                :disabled="errorIp.length > 0 || hasEdit"
                @click="ipToOop"
              >
                ↑
              </button>
              <button
                class="mt-3 button-base button-blue button-arrow"
                :disabled="errorOop.length > 0 || hasEdit"
                @click="oopToIp"
              >
                ↓
              </button>
            </div>
          </div>

          <div class="flex gap-5 bet-grid">
            <div>
              <div class="my-1 underline">{{ L.flop }}</div>
              <div class="my-1">
                <span class="inline-block w-14">{{ L.bet }}</span>
                <input
                  v-model="config.ipFlopBet"
                  type="text"
                  :class="
                    'w-24 px-2 py-1 rounded-lg text-sm ' +
                    (!config.ipFlopBetSanitized.valid ? 'input-error' : '')
                  "
                  :disabled="hasEdit"
                  @change="
                    config.ipFlopBetSanitized.valid &&
                      (config.ipFlopBet = config.ipFlopBetSanitized.s)
                  "
                />
                %
              </div>
              <div class="my-1">
                <span class="inline-block w-14">{{ L.raise }}</span>
                <input
                  v-model="config.ipFlopRaise"
                  type="text"
                  :class="
                    'w-24 px-2 py-1 rounded-lg text-sm ' +
                    (!config.ipFlopRaiseSanitized.valid ? 'input-error' : '')
                  "
                  :disabled="hasEdit"
                  @change="
                    config.ipFlopRaiseSanitized.valid &&
                      (config.ipFlopRaise = config.ipFlopRaiseSanitized.s)
                  "
                />
                %
              </div>
            </div>

            <div>
              <div class="my-1 underline">{{ L.turn }}</div>
              <div class="my-1">
                <span class="inline-block w-14">{{ L.bet }}</span>
                <input
                  v-model="config.ipTurnBet"
                  type="text"
                  :class="
                    'w-24 px-2 py-1 rounded-lg text-sm ' +
                    (!config.ipTurnBetSanitized.valid ? 'input-error' : '')
                  "
                  :disabled="hasEdit"
                  @change="
                    config.ipTurnBetSanitized.valid &&
                      (config.ipTurnBet = config.ipTurnBetSanitized.s)
                  "
                />
                %
              </div>
              <div class="my-1">
                <span class="inline-block w-14">{{ L.raise }}</span>
                <input
                  v-model="config.ipTurnRaise"
                  type="text"
                  :class="
                    'w-24 px-2 py-1 rounded-lg text-sm ' +
                    (!config.ipTurnRaiseSanitized.valid ? 'input-error' : '')
                  "
                  :disabled="hasEdit"
                  @change="
                    config.ipTurnRaiseSanitized.valid &&
                      (config.ipTurnRaise = config.ipTurnRaiseSanitized.s)
                  "
                />
                %
              </div>
            </div>

            <div>
              <div class="my-1 underline">{{ L.river }}</div>
              <div class="my-1">
                <span class="inline-block w-14">{{ L.bet }}</span>
                <input
                  v-model="config.ipRiverBet"
                  type="text"
                  :class="
                    'w-24 px-2 py-1 rounded-lg text-sm ' +
                    (!config.ipRiverBetSanitized.valid ? 'input-error' : '')
                  "
                  :disabled="hasEdit"
                  @change="
                    config.ipRiverBetSanitized.valid &&
                      (config.ipRiverBet = config.ipRiverBetSanitized.s)
                  "
                />
                %
              </div>
              <div class="my-1">
                <span class="inline-block w-14">{{ L.raise }}</span>
                <input
                  v-model="config.ipRiverRaise"
                  type="text"
                  :class="
                    'w-24 px-2 py-1 rounded-lg text-sm ' +
                    (!config.ipRiverRaiseSanitized.valid ? 'input-error' : '')
                  "
                  :disabled="hasEdit"
                  @change="
                    config.ipRiverRaiseSanitized.valid &&
                      (config.ipRiverRaise = config.ipRiverRaiseSanitized.s)
                  "
                />
                %
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="errorOop.length > 0 || errorIp.length > 0"
          class="flex mt-1 font-semibold text-red-400"
        >
          <div class="underline">{{ L.error }}</div>
          <div class="ml-2">
            <div v-for="error in errorOop" :key="error">
              {{ error }}
            </div>
            <div v-for="error in errorIp" :key="error">
              {{ error }}
            </div>
          </div>
        </div>

        <div class="flex mt-6 gap-4">
          <div>
            <div class="my-1">
              <div class="inline-block w-48">
                {{ L.addAllInLabel }}
                <Tippy
                  class="inline-block cursor-help"
                  max-width="420px"
                  trigger="mouseenter click"
                  :delay="[200, 0]"
                  :interactive="true"
                >
                  <QuestionMarkCircleIcon class="w-5 h-5 text-neutral-400" />
                  <template #content>
                    <div class="px-1 py-0.5 text-justify">
                      {{ L.addAllInHelp }}
                    </div>
                  </template>
                </Tippy>
              </div>
              <input
                v-model="config.addAllInThreshold"
                type="number"
                :class="
                  'w-24 px-2 py-1 rounded-lg text-sm text-center ' +
                  (config.addAllInThreshold < 0 ? 'input-error' : '')
                "
                :disabled="hasEdit"
                min="0"
                :max="MAX_AMOUNT * 100"
              />
              %
            </div>

            <div class="my-1">
              <div class="inline-block w-48">
                {{ L.forceAllInLabel }}
                <Tippy
                  class="inline-block cursor-help"
                  max-width="500px"
                  trigger="mouseenter click"
                  :delay="[200, 0]"
                  :interactive="true"
                >
                  <QuestionMarkCircleIcon class="w-5 h-5 text-neutral-400" />
                  <template #content>
                    <div class="px-1 py-0.5 text-justify">
                      <div>
                        {{ L.forceAllInHelp1 }}
                      </div>
                      <div class="mt-3">
                        {{ L.forceAllInHelp2 }}
                      </div>
                      <div class="mt-3">
                        {{ L.forceAllInHelp3 }}
                      </div>
                      <div class="mt-1 text-center">
                        {{ L.forceAllInFormula }}
                      </div>
                    </div>
                  </template>
                </Tippy>
              </div>
              <input
                v-model="config.forceAllInThreshold"
                type="number"
                :class="
                  'w-24 px-2 py-1 rounded-lg text-sm text-center ' +
                  (config.forceAllInThreshold < 0 ? 'input-error' : '')
                "
                :disabled="hasEdit"
                min="0"
                :max="MAX_AMOUNT * 100"
              />
              %
            </div>

            <div class="my-1">
              <div class="inline-block w-48">
                {{ L.mergingLabel }}
                <Tippy
                  class="inline-block cursor-help"
                  max-width="500px"
                  trigger="mouseenter click"
                  :delay="[200, 0]"
                  :interactive="true"
                >
                  <QuestionMarkCircleIcon class="w-5 h-5 text-neutral-400" />
                  <template #content>
                    <div class="px-1 py-0.5 text-justify">
                      <div>
                        {{ L.mergingHelp1 }}
                      </div>
                      <div class="mt-3">
                        {{ L.mergingHelp2 }}
                      </div>
                      <div class="my-1 text-center">
                        {{ L.mergingFormula }}
                      </div>
                      <div>
                        {{ L.mergingHelp3 }}
                      </div>
                    </div>
                  </template>
                </Tippy>
              </div>
              <input
                v-model="config.mergingThreshold"
                type="number"
                :class="
                  'w-24 px-2 py-1 rounded-lg text-sm text-center ' +
                  (config.mergingThreshold < 0 ? 'input-error' : '')
                "
                :disabled="hasEdit"
                min="0"
                :max="MAX_AMOUNT * 100"
              />
              %
            </div>
          </div>

          <div class="flex justify-center flex-grow">
            <div class="flex flex-col justify-center gap-3">
              <button
                class="button-base button-blue"
                :disabled="!isInputValid"
                @click="startEdit"
              >
                {{ L.treePreviewEdit }}
              </button>

              <button
                v-if="hasEdit"
                class="button-base button-red"
                @click="clearEdit"
              >
                {{ L.clearEditUnlock }}
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="errorMisc.length > 0"
          class="flex mt-1 font-semibold text-red-400"
        >
          <div class="underline">{{ L.error }}</div>
          <div class="ml-2">
            <div v-for="error in errorMisc" :key="error">
              {{ error }}
            </div>
          </div>
        </div>

        <div
          v-if="warningMisc.length > 0"
          class="flex mt-1 font-semibold text-orange-400"
        >
          <div class="underline">{{ L.warning }}</div>
          <div class="ml-2">
            <div
              v-for="warning in warningMisc"
              :key="warning"
              class="whitespace-pre-line"
            >
              {{ warning }}
            </div>
          </div>
        </div>
      </div>

      <div class="flex-grow max-w-full md:max-w-[18rem] mt-4 md:mt-1 ml-0 md:ml-6">
        <DbItemPicker
          store-name="configurations"
          :value="dbValue"
          :allow-save="isInputValid"
          @load-item="loadConfig"
        />
      </div>
    </div>

    <div
      v-if="addedLinesArray.length > 0 || removedLinesArray.length > 0"
      class="mt-5"
    >
      <div v-if="addedLinesArray.length > 0" class="flex">
        <div class="font-semibold underline w-[7.75rem]">
          {{ L.addedLines }}
        </div>
        <div class="flex flex-col">
          <div v-for="addedLine in addedLinesArray" :key="addedLine">
            {{ addedLine }}
          </div>
        </div>
      </div>

      <div v-if="removedLinesArray.length > 0" class="flex mt-2">
        <div class="font-semibold underline w-[7.75rem]">
          {{ L.removedLines }}
        </div>
        <div class="flex flex-col">
          <div v-for="removedLine in removedLinesArray" :key="removedLine">
            {{ removedLine }}
          </div>
        </div>
      </div>

      <div
        v-if="
          config.board.length >= 3 &&
          config.expectedBoardLength > 0 &&
          config.board.length !== config.expectedBoardLength
        "
        class="flex mt-2 font-semibold text-orange-400"
      >
        <div class="underline">{{ L.warning }}</div>
        <div class="ml-2">
          {{ L.boardMismatch(config.expectedBoardLength, config.board.length) }}
          <br />
          {{ L.boardMismatchHint }}
        </div>
      </div>
    </div>

    <div
      v-if="errorLines.length > 0"
      class="flex mt-2 font-semibold text-red-400"
    >
      <div class="underline">{{ L.error }}</div>
      <div class="ml-2">
        <div v-for="error in errorLines" :key="error">
          {{ error }}
        </div>
      </div>
    </div>
  </div>

  <div v-else>
    <TreeEditor @save="saveEdit" @cancel="cancelEdit" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { useStore, useConfigStore } from "../store";
import {
  MAX_AMOUNT,
  sanitizeBetString,
  ROOT_LINE_STRING,
  INVALID_LINE_STRING,
  readableLineString,
} from "../utils";

import DbItemPicker from "./DbItemPicker.vue";
import TreeEditor from "./TreeEditor.vue";
import { Tippy } from "vue-tippy";
import { QuestionMarkCircleIcon } from "@heroicons/vue/20/solid";
import { i18n, pick } from "../i18n";

const M = {
  ko: {
    chipNote:
      "정수 칩 단위로 입력합니다. bb 환산이 필요하면 10칩=1bb 사용을 권장합니다.",
    startingPot: "스타팅 팟:",
    effectiveStack: "유효 스택:",
    rake: "레이크:",
    rakeCap: "레이크 캡:",
    reset: "초기화",
    error: "오류:",
    warning: "경고:",
    oopBetSizes: "OOP 벳 사이즈",
    donkOption: "덩크 벳에 다른 사이즈 사용",
    howToInput: "입력 방법",
    inputHelpIntro:
      "여러 개의 벳 사이즈를 쉼표 또는 공백으로 구분하여 아래 형식 중 어느 것으로든 입력할 수 있습니다. 비워 두면 벳이나 레이즈를 하지 않습니다.",
    inputHelpPercent:
      '팟 대비 퍼센트를 나타내는 숫자 (예: "50"). 레이즈의 경우, 먼저 콜을 한 뒤 지정한 퍼센트만큼의 벳을 더하는 방식으로 사이즈가 계산됩니다. 예를 들어 벳 전 팟이 100이고 상대가 75를 벳했다면, 50% 레이즈는 75 + (100 + 75 + 75) * 50% = 200이 됩니다.',
    inputHelpMultiple:
      '이전 벳 사이즈의 배수 (예: "2.5x"). 레이즈에만 사용할 수 있습니다.',
    inputHelpAllin: '올인 (예: "a").',
    inputHelpFixed:
      '고정 금액 추가 (예: "100c"). 레이즈의 경우 레이즈 횟수 상한도 지정할 수 있습니다 (예: "20c3r").',
    inputHelpGeometric:
      '지오메트릭 사이즈, 즉 남은 스택을 지정한 횟수의 동일 퍼센트 벳으로 나누는 방식 (예: "3e"). 예를 들어 현재 팟이 100이고 유효 스택이 400이면 "2e"는 100 벳이 됩니다. "e" 앞의 숫자를 생략하면 남은 스트리트 수가 사용됩니다 (플랍=3, 턴=2, 리버=1). 레이즈의 경우 지정한 숫자에서 이전 레이즈 횟수를 뺍니다. 예를 들어 "3e"는 리레이즈 시 "2e"로 바뀝니다. "e" 뒤에 숫자를 붙여 최대 퍼센트 한도를 지정할 수도 있습니다 (예: "2e200").',
    flop: "플랍",
    turn: "턴",
    river: "리버",
    bet: "벳:",
    raise: "레이즈:",
    donk: "덩크:",
    ipBetSizes: "IP 벳 사이즈",
    addAllInLabel: "올인 추가 임계값:",
    addAllInHelp:
      "가능한 최대 벳 사이즈와 팟의 비율이 이 임계값보다 작은 모든 지점에 올인 액션을 추가합니다.",
    forceAllInLabel: "강제 올인 임계값:",
    forceAllInHelp1:
      "상대가 벳 액션을 콜한 후의 SPR (스택/팟 비율)이 이 임계값보다 낮으면 해당 벳 액션을 올인 액션으로 대체합니다. 권장 값은 15% - 20% 정도입니다.",
    forceAllInHelp2:
      '이 옵션은 PioSOLVER의 "all-in threshold"와 유사합니다. PioSOLVER는 초기 스택 대비 팟에 투입한 금액의 비율이 임계값을 초과하면 벳 액션을 올인으로 대체합니다.',
    forceAllInHelp3:
      "소수점 반올림을 무시할 때 변환 공식은 다음과 같습니다 (s = 초기 SPR, r = PioSOLVER의 임계값):",
    forceAllInFormula: "임계값 = s * (1 - r) / (1 + 2 * s * r).",
    mergingLabel: "병합 임계값:",
    mergingHelp1: "비슷한 사이즈의 벳 액션이 있으면 하나로 병합합니다.",
    mergingHelp2:
      "알고리즘은 PioSOLVER와 동일합니다. 즉, 가장 큰 벳 사이즈(= 팟의 X%)를 선택하고, 다음 부등식을 만족하는 사이즈(= 팟의 Y%)의 다른 벳 액션을 모두 제거합니다:",
    mergingFormula: "(100 + X) / (100 + Y) < 1.0 + 임계값.",
    mergingHelp3: "남은 벳 중 다음으로 큰 벳 사이즈로 이 과정을 반복합니다.",
    treePreviewEdit: "트리 미리보기 & 편집",
    clearEditUnlock: "편집 초기화 & 잠금 해제",
    addedLines: "추가된 라인:",
    removedLines: "제거된 라인:",
    boardMismatch: (expected: number, actual: number) =>
      `편집된 트리는 ${expected}장의 보드를 가정하지만, 현재 보드는 ${actual}장으로 구성되어 있습니다.`,
    boardMismatchHint:
      '편집된 트리를 초기화하려면 "편집 초기화 & 잠금 해제" 버튼을 클릭하세요.',
  },
  en: {
    chipNote:
      "Enter amounts in integer chips (custom spots use arbitrary chip units). To think in big blinds, we recommend 10 chips = 1bb.",
    startingPot: "Starting Pot:",
    effectiveStack: "Effective Stack:",
    rake: "Rake:",
    rakeCap: "Rake Cap:",
    reset: "Clear",
    error: "Error:",
    warning: "Warning:",
    oopBetSizes: "OOP Bet Sizes",
    donkOption: "Use different sizes for donk bets",
    howToInput: "How to input",
    inputHelpIntro:
      "You can enter multiple bet sizes separated by commas or spaces, in any of the following formats. If left empty, no bet or raise is made.",
    inputHelpPercent:
      "A number representing the percentage of the pot (e.g., “50”). For raises, the size is computed by first calling and then adding the specified percentage of the resulting pot. For example, if the pot before the bet is 100 and the opponent bets 75, a 50% raise is 75 + (100 + 75 + 75) * 50% = 200.",
    inputHelpMultiple:
      "A multiple of the previous bet size (e.g., “2.5x”). Only available for raises.",
    inputHelpAllin: "All-in (e.g., “a”).",
    inputHelpFixed:
      "Adding a fixed amount (e.g., “100c”). For raises, you can also cap the number of raises (e.g., “20c3r”).",
    inputHelpGeometric:
      "Geometric size, i.e., splitting the remaining stack into the specified number of equal-percentage bets (e.g., “3e”). For example, if the current pot is 100 and the effective stack is 400, “2e” is a bet of 100. If the number before “e” is omitted, the number of remaining streets is used (Flop=3, Turn=2, River=1). For raises, the number of previous raises is subtracted from the specified number; e.g., “3e” becomes “2e” when re-raising. You can also append a number after “e” to set a maximum percentage limit (e.g., “2e200”).",
    flop: "Flop",
    turn: "Turn",
    river: "River",
    bet: "Bet:",
    raise: "Raise:",
    donk: "Donk:",
    ipBetSizes: "IP Bet Sizes",
    addAllInLabel: "Add All-In Threshold:",
    addAllInHelp:
      "Adds an all-in action to every node where the ratio of the maximum possible bet size to the pot is below this threshold.",
    forceAllInLabel: "Force All-In Threshold:",
    forceAllInHelp1:
      "If the SPR (stack-to-pot ratio) after the opponent calls a bet action is below this threshold, that bet action is replaced with an all-in action. A recommended value is around 15–20%.",
    forceAllInHelp2:
      "This option is similar to PioSOLVER's “all-in threshold”. PioSOLVER replaces a bet action with an all-in when the ratio of the amount put into the pot to the initial stack exceeds the threshold.",
    forceAllInHelp3:
      "Ignoring rounding, the conversion formula is as follows (s = initial SPR, r = PioSOLVER's threshold):",
    forceAllInFormula: "Threshold = s * (1 - r) / (1 + 2 * s * r).",
    mergingLabel: "Merging Threshold:",
    mergingHelp1: "Merges bet actions of similar sizes into one.",
    mergingHelp2:
      "The algorithm is the same as PioSOLVER's: pick the largest bet size (= X% of the pot) and remove every other bet action whose size (= Y% of the pot) satisfies the following inequality:",
    mergingFormula: "(100 + X) / (100 + Y) < 1.0 + threshold.",
    mergingHelp3: "Repeat this process with the next largest remaining bet size.",
    treePreviewEdit: "Tree Preview & Edit",
    clearEditUnlock: "Clear Edits & Unlock",
    addedLines: "Added lines:",
    removedLines: "Removed lines:",
    boardMismatch: (expected: number, actual: number) =>
      `The edited tree assumes a ${expected}-card board, but the current board has ${actual} card${actual === 1 ? "" : "s"}.`,
    boardMismatchHint:
      "To discard the edited tree, click the “Clear Edits & Unlock” button.",
  },
  ja: {
    chipNote:
      "金額は整数チップ単位で入力します(カスタムスポットでは任意のチップ単位を使用)。bbで考える場合は10チップ=1bbを推奨します。",
    startingPot: "スターティングポット:",
    effectiveStack: "有効スタック:",
    rake: "レーキ:",
    rakeCap: "レーキキャップ:",
    reset: "クリア",
    error: "エラー:",
    warning: "警告:",
    oopBetSizes: "OOP ベットサイズ",
    donkOption: "ドンクベットに別のサイズを使用",
    howToInput: "入力方法",
    inputHelpIntro:
      "複数のベットサイズをカンマまたはスペースで区切って、以下のいずれの形式でも入力できます。空欄の場合、ベットやレイズは行いません。",
    inputHelpPercent:
      'ポットに対するパーセントを表す数値(例: "50")。レイズの場合、まずコールし、その後のポットに対して指定したパーセント分を上乗せしてサイズを計算します。たとえばベット前のポットが100で相手が75をベットした場合、50%レイズは 75 + (100 + 75 + 75) * 50% = 200 になります。',
    inputHelpMultiple:
      '直前のベットサイズの倍数(例: "2.5x")。レイズでのみ使用できます。',
    inputHelpAllin: 'オールイン(例: "a")。',
    inputHelpFixed:
      '固定額の上乗せ(例: "100c")。レイズの場合はレイズ回数の上限も指定できます(例: "20c3r")。',
    inputHelpGeometric:
      'ジオメトリックサイズ、つまり残りスタックを指定した回数の同一パーセントのベットに分割する方式です(例: "3e")。たとえば現在のポットが100で有効スタックが400の場合、"2e"は100のベットになります。"e"の前の数字を省略すると、残りのストリート数が使われます(フロップ=3、ターン=2、リバー=1)。レイズの場合は指定した数字からそれまでのレイズ回数を引きます。たとえば"3e"はリレイズ時に"2e"になります。"e"の後ろに数字を付けて最大パーセントの上限を指定することもできます(例: "2e200")。',
    flop: "フロップ",
    turn: "ターン",
    river: "リバー",
    bet: "ベット:",
    raise: "レイズ:",
    donk: "ドンク:",
    ipBetSizes: "IP ベットサイズ",
    addAllInLabel: "オールイン追加しきい値:",
    addAllInHelp:
      "可能な最大ベットサイズとポットの比率がこのしきい値を下回るすべてのノードにオールインアクションを追加します。",
    forceAllInLabel: "強制オールインしきい値:",
    forceAllInHelp1:
      "相手がベットアクションをコールした後のSPR(スタック/ポット比)がこのしきい値を下回る場合、そのベットアクションをオールインアクションに置き換えます。推奨値は15%〜20%程度です。",
    forceAllInHelp2:
      "このオプションはPioSOLVERの「all-in threshold」に似ています。PioSOLVERは、ポットに投入した金額と初期スタックの比率がしきい値を超えると、ベットアクションをオールインに置き換えます。",
    forceAllInHelp3:
      "端数の丸めを無視すると、変換式は次のとおりです(s = 初期SPR、r = PioSOLVERのしきい値):",
    forceAllInFormula: "しきい値 = s * (1 - r) / (1 + 2 * s * r).",
    mergingLabel: "マージしきい値:",
    mergingHelp1: "似たサイズのベットアクションを1つにマージします。",
    mergingHelp2:
      "アルゴリズムはPioSOLVERと同じです。つまり、最大のベットサイズ(= ポットのX%)を選び、次の不等式を満たすサイズ(= ポットのY%)の他のベットアクションをすべて削除します:",
    mergingFormula: "(100 + X) / (100 + Y) < 1.0 + しきい値.",
    mergingHelp3:
      "残ったベットのうち次に大きいベットサイズでこの処理を繰り返します。",
    treePreviewEdit: "ツリーのプレビュー & 編集",
    clearEditUnlock: "編集をクリア & ロック解除",
    addedLines: "追加されたライン:",
    removedLines: "削除されたライン:",
    boardMismatch: (expected: number, actual: number) =>
      `編集されたツリーは${expected}枚のボードを想定していますが、現在のボードは${actual}枚です。`,
    boardMismatchHint:
      "編集されたツリーを破棄するには「編集をクリア & ロック解除」ボタンをクリックしてください。",
  },
  es: {
    chipNote:
      "Ingresa los montos en fichas enteras (los spots personalizados usan unidades de ficha arbitrarias). Para pensar en ciegas grandes, recomendamos 10 fichas = 1bb.",
    startingPot: "Bote inicial:",
    effectiveStack: "Stack efectivo:",
    rake: "Rake:",
    rakeCap: "Tope de rake:",
    reset: "Restablecer",
    error: "Error:",
    warning: "Atención:",
    oopBetSizes: "Bet sizes de OOP",
    donkOption: "Usar otros tamaños para donk bets",
    howToInput: "Cómo ingresar los valores",
    inputHelpIntro:
      "Puedes ingresar varios bet sizes separados por comas o espacios, en cualquiera de los siguientes formatos. Si lo dejas vacío, no se hace bet ni raise.",
    inputHelpPercent:
      'Un número que representa el porcentaje del bote (ej. «50»). Para los raises, el tamaño se calcula pagando primero y sumando después el porcentaje indicado del bote resultante. Por ejemplo, si el bote antes del bet es 100 y el rival apuesta 75, un raise del 50% es 75 + (100 + 75 + 75) * 50% = 200.',
    inputHelpMultiple:
      'Un múltiplo del bet anterior (ej. «2.5x»). Solo disponible para raises.',
    inputHelpAllin: 'All-in (ej. «a»).',
    inputHelpFixed:
      'Suma de un monto fijo (ej. «100c»). Para los raises también puedes limitar el número de raises (ej. «20c3r»).',
    inputHelpGeometric:
      'Tamaño geométrico, es decir, dividir el stack restante en el número indicado de bets del mismo porcentaje (ej. «3e»). Por ejemplo, con un bote de 100 y stack efectivo de 400, «2e» es un bet de 100. Si omites el número antes de la «e», se usa el número de calles restantes (flop=3, turn=2, river=1). Para los raises se resta el número de raises previos; ej. «3e» pasa a «2e» al re-raisear. También puedes añadir un número después de la «e» para fijar un porcentaje máximo (ej. «2e200»).',
    flop: "Flop",
    turn: "Turn",
    river: "River",
    bet: "Bet:",
    raise: "Raise:",
    donk: "Donk:",
    ipBetSizes: "Bet sizes de IP",
    addAllInLabel: "Umbral para agregar all-in:",
    addAllInHelp:
      "Agrega una acción de all-in en cada nodo donde la relación entre el bet máximo posible y el bote queda por debajo de este umbral.",
    forceAllInLabel: "Umbral de all-in forzado:",
    forceAllInHelp1:
      "Si el SPR (relación stack/bote) después de que el rival paga un bet queda por debajo de este umbral, ese bet se reemplaza por un all-in. Un valor recomendado ronda el 15% - 20%.",
    forceAllInHelp2:
      'Esta opción es similar al «all-in threshold» de PioSOLVER. PioSOLVER reemplaza un bet por un all-in cuando la relación entre lo invertido en el bote y el stack inicial supera el umbral.',
    forceAllInHelp3:
      "Ignorando el redondeo, la fórmula de conversión es la siguiente (s = SPR inicial, r = umbral de PioSOLVER):",
    forceAllInFormula: "Umbral = s * (1 - r) / (1 + 2 * s * r).",
    mergingLabel: "Umbral de fusión:",
    mergingHelp1: "Fusiona en uno los bets de tamaños parecidos.",
    mergingHelp2:
      "El algoritmo es el mismo de PioSOLVER: se elige el bet más grande (= X% del bote) y se elimina cualquier otro bet cuyo tamaño (= Y% del bote) cumpla la siguiente desigualdad:",
    mergingFormula: "(100 + X) / (100 + Y) < 1.0 + umbral.",
    mergingHelp3: "El proceso se repite con el siguiente bet más grande que quede.",
    treePreviewEdit: "Vista previa y edición del árbol",
    clearEditUnlock: "Borrar cambios y desbloquear",
    addedLines: "Líneas agregadas:",
    removedLines: "Líneas eliminadas:",
    boardMismatch: (expected: number, actual: number) =>
      `El árbol editado asume un board de ${expected} carta${expected === 1 ? "" : "s"}, pero el board actual tiene ${actual}.`,
    boardMismatchHint:
      'Para descartar el árbol editado, haz clic en el botón «Borrar cambios y desbloquear».',
  },
  pt: {
    chipNote:
      "Informe os valores em fichas inteiras (os spots personalizados usam unidades de ficha arbitrárias). Para raciocinar em big blinds, recomendamos 10 fichas = 1bb.",
    startingPot: "Pote inicial:",
    effectiveStack: "Stack efetivo:",
    rake: "Rake:",
    rakeCap: "Cap do rake:",
    reset: "Limpar",
    error: "Erro:",
    warning: "Atenção:",
    oopBetSizes: "Bet sizes do OOP",
    donkOption: "Usar outros tamanhos para donk bets",
    howToInput: "Como informar os valores",
    inputHelpIntro:
      "Você pode informar vários bet sizes separados por vírgulas ou espaços, em qualquer um dos formatos abaixo. Se deixar vazio, não há bet nem raise.",
    inputHelpPercent:
      'Um número que representa a porcentagem do pote (ex.: “50”). Para os raises, o tamanho é calculado pagando primeiro e somando depois a porcentagem indicada do pote resultante. Por exemplo, se o pote antes do bet é 100 e o vilão aposta 75, um raise de 50% é 75 + (100 + 75 + 75) * 50% = 200.',
    inputHelpMultiple:
      'Um múltiplo do bet anterior (ex.: “2.5x”). Disponível apenas para raises.',
    inputHelpAllin: 'All-in (ex.: “a”).',
    inputHelpFixed:
      'Soma de um valor fixo (ex.: “100c”). Para os raises você também pode limitar o número de raises (ex.: “20c3r”).',
    inputHelpGeometric:
      'Tamanho geométrico, ou seja, dividir o stack restante no número indicado de bets da mesma porcentagem (ex.: “3e”). Por exemplo, com um pote de 100 e stack efetivo de 400, “2e” é um bet de 100. Se você omitir o número antes do “e”, é usado o número de streets restantes (Flop=3, Turn=2, River=1). Para os raises, subtrai-se o número de raises anteriores; ex.: “3e” vira “2e” ao dar re-raise. Você também pode acrescentar um número depois do “e” para fixar uma porcentagem máxima (ex.: “2e200”).',
    flop: "Flop",
    turn: "Turn",
    river: "River",
    bet: "Bet:",
    raise: "Raise:",
    donk: "Donk:",
    ipBetSizes: "Bet sizes do IP",
    addAllInLabel: "Limiar para adicionar all-in:",
    addAllInHelp:
      "Adiciona uma ação de all-in em todo nó onde a relação entre o maior bet possível e o pote fica abaixo desse limiar.",
    forceAllInLabel: "Limiar de all-in forçado:",
    forceAllInHelp1:
      "Se o SPR (relação stack/pote) depois de o vilão pagar um bet ficar abaixo desse limiar, esse bet é substituído por um all-in. Um valor recomendado fica em torno de 15% a 20%.",
    forceAllInHelp2:
      'Esta opção é parecida com o “all-in threshold” do PioSOLVER. O PioSOLVER substitui um bet por um all-in quando a relação entre o que já foi investido no pote e o stack inicial ultrapassa o limiar.',
    forceAllInHelp3:
      "Ignorando o arredondamento, a fórmula de conversão é a seguinte (s = SPR inicial, r = limiar do PioSOLVER):",
    forceAllInFormula: "Limiar = s * (1 - r) / (1 + 2 * s * r).",
    mergingLabel: "Limiar de fusão:",
    mergingHelp1: "Funde em um só os bets de tamanhos parecidos.",
    mergingHelp2:
      "O algoritmo é o mesmo do PioSOLVER: escolhe-se o maior bet (= X% do pote) e elimina-se qualquer outro bet cujo tamanho (= Y% do pote) satisfaça a desigualdade a seguir:",
    mergingFormula: "(100 + X) / (100 + Y) < 1,0 + limiar.",
    mergingHelp3: "O processo se repete com o próximo maior bet que sobrar.",
    treePreviewEdit: "Prévia e edição da árvore",
    clearEditUnlock: "Descartar alterações e desbloquear",
    addedLines: "Linhas adicionadas:",
    removedLines: "Linhas removidas:",
    boardMismatch: (expected: number, actual: number) =>
      `A árvore editada pressupõe um board de ${expected} carta${
        expected === 1 ? "" : "s"
      }, mas o board atual tem ${actual} carta${actual === 1 ? "" : "s"}.`,
    boardMismatchHint:
      'Para descartar a árvore editada, clique no botão “Descartar alterações e desbloquear”.',
  },
  de: {
    chipNote:
      "Gib die Werte in ganzen Chips ein (eigene Spots nutzen frei wählbare Chip-Einheiten). Wenn du in Big Blinds denken willst, empfehlen wir 10 Chips = 1bb.",
    startingPot: "Start-Pot:",
    effectiveStack: "Effektiver Stack:",
    rake: "Rake:",
    rakeCap: "Rake-Cap:",
    reset: "Alle Werte leeren",
    error: "Fehler:",
    warning: "Achtung:",
    oopBetSizes: "Bet Sizes OOP",
    donkOption: "Andere Sizes für Donk-Bets verwenden",
    howToInput: "So gibst du die Werte ein",
    inputHelpIntro:
      "Du kannst mehrere Bet Sizes durch Kommas oder Leerzeichen getrennt in jedem der folgenden Formate eingeben. Lässt du das Feld leer, gibt es weder Bet noch Raise.",
    // ⚠ 「2.5x」·「100c」·「2e200」은 사용자가 그대로 입력하는 «문법»이다 — 소수점을 콤마로 바꾸지 말 것
    inputHelpPercent:
      "Eine Zahl als Prozentsatz vom Pot (z. B. „50“). Bei Raises wird die Size so berechnet: erst callen, dann den angegebenen Prozentsatz des dadurch entstandenen Pots draufsetzen. Beispiel: Ist der Pot vor der Bet 100 und der Gegner bettet 75, dann ist ein Raise von 50% gleich 75 + (100 + 75 + 75) * 50% = 200.",
    inputHelpMultiple:
      "Ein Vielfaches der vorherigen Bet (z. B. „2.5x“). Nur bei Raises möglich.",
    inputHelpAllin: "All-in (z. B. „a“).",
    inputHelpFixed:
      "Ein fester Betrag obendrauf (z. B. „100c“). Bei Raises kannst du zusätzlich die Zahl der Raises begrenzen (z. B. „20c3r“).",
    inputHelpGeometric:
      "Geometrische Size, also den verbleibenden Stack in die angegebene Zahl gleich großer prozentualer Bets aufteilen (z. B. „3e“). Beispiel: Bei einem Pot von 100 und einem effektiven Stack von 400 ist „2e“ eine Bet von 100. Lässt du die Zahl vor dem „e“ weg, wird die Zahl der verbleibenden Streets genommen (Flop=3, Turn=2, River=1). Bei Raises wird die Zahl der vorherigen Raises abgezogen; „3e“ wird beim Re-Raise also zu „2e“. Du kannst hinter dem „e“ auch eine Zahl anhängen, um eine maximale Prozentgrenze zu setzen (z. B. „2e200“).",
    flop: "Flop",
    turn: "Turn",
    river: "River",
    bet: "Bet:",
    raise: "Raise:",
    donk: "Donk:",
    ipBetSizes: "Bet Sizes IP",
    addAllInLabel: "Schwelle für zusätzliches All-in:",
    addAllInHelp:
      "Fügt an jedem Knoten, an dem das Verhältnis der größtmöglichen Bet zum Pot unter dieser Schwelle liegt, eine All-in-Aktion hinzu.",
    forceAllInLabel: "Schwelle für erzwungenes All-in:",
    forceAllInHelp1:
      "Liegt der SPR (Stack-zu-Pot-Verhältnis) nach einem Call des Gegners auf eine Bet unter dieser Schwelle, wird diese Bet durch ein All-in ersetzt. Empfohlen sind etwa 15% bis 20%.",
    forceAllInHelp2:
      "Diese Option ähnelt dem „all-in threshold“ von PioSOLVER. PioSOLVER ersetzt eine Bet durch ein All-in, sobald der Anteil des bereits investierten Betrags am Start-Stack die Schwelle überschreitet.",
    forceAllInHelp3:
      "Ohne Rundung lautet die Umrechnungsformel so (s = anfänglicher SPR, r = Schwelle von PioSOLVER):",
    forceAllInFormula: "Schwelle = s * (1 - r) / (1 + 2 * s * r).",
    mergingLabel: "Schwelle zum Zusammenfassen:",
    mergingHelp1: "Bets mit ähnlicher Size werden zu einer zusammengefasst.",
    mergingHelp2:
      "Der Algorithmus ist derselbe wie bei PioSOLVER: Es wird die größte Bet (= X% vom Pot) gewählt und jede andere Bet entfernt, deren Size (= Y% vom Pot) die folgende Ungleichung erfüllt:",
    mergingFormula: "(100 + X) / (100 + Y) < 1,0 + Schwelle.",
    mergingHelp3: "Das wiederholt sich mit der nächstgrößten verbleibenden Bet.",
    treePreviewEdit: "Spielbaum – Vorschau & Bearbeiten",
    clearEditUnlock: "Änderungen verwerfen & entsperren",
    addedLines: "Hinzugefügte Lines:",
    removedLines: "Entfernte Lines:",
    boardMismatch: (expected: number, actual: number) =>
      `Der bearbeitete Spielbaum setzt ein Board mit ${expected} Karte${expected === 1 ? "" : "n"} voraus, das aktuelle Board hat aber ${actual} Karte${actual === 1 ? "" : "n"}.`,
    boardMismatchHint:
      "Um den bearbeiteten Spielbaum zu verwerfen, klicke auf den Button „Änderungen verwerfen & entsperren“.",
  },
  zh: {
    chipNote:
      "金额按整数筹码填写（自定义牌局用的是任意筹码单位）。想按大盲来算的话，建议把 10 筹码当作 1bb。",
    startingPot: "起始底池：",
    effectiveStack: "有效筹码：",
    // rake = 「抽水」(본체 브리프 §1C·§0.5-3). ⚠ 「台费」는 자리·시간당 고정요금이라 다른 말이다
    rake: "抽水：",
    rakeCap: "抽水上限：",
    // clearConfig()는 底池·筹码·抽水·전 스트리트 벳 사이즈를 «전부» 비운다.
    // 레인지·보드는 건드리지 않으므로 「重置」(초기화)가 아니라 «값을 비운다»가 정확하다
    reset: "清空所有数值",
    error: "错误：",
    warning: "注意：",
    oopBetSizes: "OOP 下注尺寸",
    // donk bet = 「领打」. 中扑 매체 다수(摩十客·德扑技巧·德扑GOD)의 정착역 — 리서치 §2 출처.
    // 첫 등장 자리라 영어 원词를 병기했다
    donkOption: "领打（donk bet）用另一套尺寸",
    howToInput: "怎么填",
    inputHelpIntro:
      "可以用逗号或空格隔开，一次填多个下注尺寸，下面几种写法都行。留空就表示不下注，也不加注。",
    // ⚠ “2.5x”·“100c”·“2e200”은 사용자가 «그대로 입력»하는 문법이다.
    //   중국어는 소수점이 «.»라 pt·de 같은 충돌이 없지만, 그래도 이 안의 숫자는 손대지 말 것.
    //   따옴표는 대륙 표준 “ ”를 쓴다 (독일어의 „ “, 영어의 “ ”와 같은 자리)
    inputHelpPercent:
      "一个表示底池百分比的数字（例如“50”）。加注时的算法是：先跟注，再按跟注后形成的底池加上指定百分比。举例来说，下注前底池是 100，对手下注 75，那么 50% 的加注就是 75 + (100 + 75 + 75) * 50% = 200。",
    inputHelpMultiple: "上一次下注额的倍数（例如“2.5x”）。只能用于加注。",
    inputHelpAllin: "全下（例如“a”）。",
    inputHelpFixed:
      "在原有基础上加一个固定金额（例如“100c”）。加注时还可以限制加注次数（例如“20c3r”）。",
    inputHelpGeometric:
      "几何尺寸，也就是把剩下的筹码拆成指定次数、每次百分比相同的下注（例如“3e”）。举例来说，当前底池 100、有效筹码 400 时，“2e”就是下注 100。省略“e”前面的数字，就按剩余的街数来算（翻牌圈=3，转牌圈=2，河牌圈=1）。加注时会从指定的数字里减去之前的加注次数，所以“3e”再加注时会变成“2e”。还可以在“e”后面接一个数字来设定百分比上限（例如“2e200”）。",
    flop: "翻牌",
    turn: "转牌",
    river: "河牌",
    bet: "下注：",
    raise: "加注：",
    donk: "领打：",
    ipBetSizes: "IP 下注尺寸",
    addAllInLabel: "追加全下的阈值：",
    addAllInHelp:
      "如果某个节点上“最大可下注额占底池的比例”低于这个阈值，就在那个节点追加一个全下动作。",
    forceAllInLabel: "强制全下的阈值：",
    forceAllInHelp1:
      "如果对手跟注某个下注之后的 SPR（筹码与底池之比）低于这个阈值，就把那个下注换成全下。建议值在 15%~20% 之间。",
    forceAllInHelp2:
      "这个选项和 PioSOLVER 的“all-in threshold”类似。PioSOLVER 的做法是：当已投入底池的金额占起始筹码的比例超过阈值时，把下注换成全下。",
    forceAllInHelp3:
      "不考虑小数舍入的话，换算公式如下（s = 起始 SPR，r = PioSOLVER 的阈值）：",
    forceAllInFormula: "阈值 = s * (1 - r) / (1 + 2 * s * r)。",
    mergingLabel: "合并阈值：",
    mergingHelp1: "尺寸相近的下注会被合并成一个。",
    mergingHelp2:
      "算法和 PioSOLVER 相同：先挑出最大的下注尺寸（= 底池的 X%），再把所有满足下面这个不等式的下注（尺寸 = 底池的 Y%）删掉：",
    mergingFormula: "(100 + X) / (100 + Y) < 1.0 + 阈值。",
    mergingHelp3: "然后对剩下的下注里第二大的那个，重复同样的过程。",
    treePreviewEdit: "决策树——预览与编辑",
    clearEditUnlock: "清除修改并解锁",
    addedLines: "新增的线路：",
    removedLines: "移除的线路：",
    boardMismatch: (expected: number, actual: number) =>
      `编辑过的决策树以 ${expected} 张公共牌为前提，但当前的公共牌是 ${actual} 张。`,
    boardMismatchHint: "想丢掉编辑过的决策树，点“清除修改并解锁”按钮即可。",
  },
  "zh-hant": {
    chipNote:
      "金額按整數籌碼填寫（自訂牌局用的是任意籌碼單位）。想按大盲來算的話，建議把 10 籌碼當作 1bb。",
    startingPot: "起始底池：",
    effectiveStack: "有效籌碼：",
    // rake = 「抽水」(본체 브리프 §7-C·§7-E). ⚠ 「台費」는 자리·시간당 고정요금이라 다른 말이다
    rake: "抽水：",
    rakeCap: "抽水上限：",
    // clearConfig()는 底池·籌碼·抽水·전 스트리트 벳 사이즈를 «전부» 비운다.
    // 레인지·보드는 건드리지 않으므로 「重設」(초기화)이 아니라 «값을 비운다»가 정확하다
    reset: "全部清空",
    error: "錯誤：",
    warning: "注意：",
    oopBetSizes: "OOP 下注尺寸",
    // donk bet = 「領打」 (본체 브리프 §7-E 「領打(Donk bet)」). 첫 등장이라 영어 원어를 병기했다
    donkOption: "領打（donk bet）用另一套尺寸",
    // ⚠ 이 이름은 오류 메시지(pick 호출)가 그대로 인용한다 — 글자를 바꾸면 그쪽도 같이 고칠 것
    howToInput: "怎麼填",
    inputHelpIntro:
      "可以用逗號或空格隔開，一次填多個下注尺寸，下面幾種寫法都行。留空就表示不下注，也不加注。",
    // ⚠ 「2.5x」·「100c」·「2e200」은 사용자가 «그대로 입력»하는 문법이다.
    //   중국어는 소수점이 «.»라 pt·de 같은 충돌이 없지만, 그래도 이 안의 숫자는 손대지 말 것.
    //   ⚠ 인용부호는 대만·홍콩 관습인 「 」 — 간체판의 “ ”와 «반대»다 (본체 브리프 §8-4)
    inputHelpPercent:
      "一個表示底池百分比的數字（例如「50」）。加注時的計算方式是：先跟注，再按跟注後形成的底池加上指定百分比。舉例來說，下注前底池是 100，對手下注 75，那麼 50% 的加注就是 75 + (100 + 75 + 75) * 50% = 200。",
    inputHelpMultiple: "上一次下注額的倍數（例如「2.5x」）。只能用於加注。",
    inputHelpAllin: "全下（例如「a」）。",
    inputHelpFixed:
      "在原有基礎上加一個固定金額（例如「100c」）。加注時還可以限制加注次數（例如「20c3r」）。",
    inputHelpGeometric:
      "幾何尺寸，也就是把剩下的籌碼拆成指定次數、每次百分比相同的下注（例如「3e」）。舉例來說，目前底池 100、有效籌碼 400 時，「2e」就是下注 100。省略「e」前面的數字，就按剩餘的圈數來算（翻牌圈=3，轉牌圈=2，河牌圈=1）。加注時會從指定的數字裡減去之前的加注次數，所以「3e」再加注時會變成「2e」。還可以在「e」後面接一個數字來設定百分比上限（例如「2e200」）。",
    flop: "翻牌",
    turn: "轉牌",
    river: "河牌",
    bet: "下注：",
    raise: "加注：",
    donk: "領打：",
    ipBetSizes: "IP 下注尺寸",
    addAllInLabel: "追加全下的門檻：",
    addAllInHelp:
      "如果某個節點上「最大可下注額佔底池的比例」低於這個門檻，就在那個節點追加一個全下動作。",
    forceAllInLabel: "強制全下的門檻：",
    forceAllInHelp1:
      "如果對手跟注某個下注之後的 SPR（籌碼與底池之比）低於這個門檻，就把那個下注換成全下。建議值在 15%～20% 之間。",
    forceAllInHelp2:
      "這個選項和 PioSOLVER 的「all-in threshold」類似。PioSOLVER 的做法是：當已投入底池的金額佔起始籌碼的比例超過門檻時，把下注換成全下。",
    forceAllInHelp3:
      "不考慮小數捨入的話，換算公式如下（s = 起始 SPR，r = PioSOLVER 的門檻）：",
    forceAllInFormula: "門檻 = s * (1 - r) / (1 + 2 * s * r)。",
    mergingLabel: "合併門檻：",
    mergingHelp1: "尺寸相近的下注會被合併成一個。",
    mergingHelp2:
      "演演演算法和 PioSOLVER 相同：先挑出最大的下注尺寸（= 底池的 X%），再把所有滿足下面這個不等式的下注（尺寸 = 底池的 Y%）刪掉：",
    mergingFormula: "(100 + X) / (100 + Y) < 1.0 + 門檻。",
    mergingHelp3: "然後對剩下的下注裡第二大的那個，重複同樣的過程。",
    // ⚠ App.vue HEADERS의 treeEdit와 «글자까지» 같아야 한다
    treePreviewEdit: "決策樹——預覽與編輯",
    clearEditUnlock: "清除修改並解鎖",
    addedLines: "新增的線路：",
    removedLines: "移除的線路：",
    boardMismatch: (expected: number, actual: number) =>
      `編輯過的決策樹以 ${expected} 張公共牌為前提，但目前的公共牌是 ${actual} 張。`,
    boardMismatchHint: "想丟掉編輯過的決策樹，按下「清除修改並解鎖」按鈕即可。",
  },
} as const;

type ConfigValue = {
  startingPot: number;
  effectiveStack: number;
  rakePercent: number;
  rakeCap: number;
  donkOption: number;
  oopFlopBet: string;
  oopFlopRaise: string;
  oopTurnBet: string;
  oopTurnRaise: string;
  oopTurnDonk: string;
  oopRiverBet: string;
  oopRiverRaise: string;
  oopRiverDonk: string;
  ipFlopBet: string;
  ipFlopRaise: string;
  ipTurnBet: string;
  ipTurnRaise: string;
  ipRiverBet: string;
  ipRiverRaise: string;
  addAllInThreshold: number;
  forceAllInThreshold: number;
  mergingThreshold: number;
  expectedBoardLength: number;
  addedLines: string;
  removedLines: string;
};

export default defineComponent({
  components: {
    DbItemPicker,
    TreeEditor,
    Tippy,
    QuestionMarkCircleIcon,
  },

  setup() {
    const store = useStore();
    const config = useConfigStore();
    const L = computed(() => M[i18n.locale]);

    const isEditMode = ref(false);

    const hasEdit = computed(
      () => config.addedLines.length > 0 || config.removedLines.length > 0
    );

    const addedLinesArray = computed(() =>
      config.addedLines === ""
        ? []
        : config.addedLines.split(",").map(readableLineString)
    );

    const removedLinesArray = computed(() =>
      config.removedLines === ""
        ? []
        : config.removedLines.split(",").map(readableLineString)
    );

    const errorBasics = computed(() => {
      const errors: string[] = [];
      if (config.startingPot <= 0) {
        errors.push(
          pick("스타팅 팟은 양수여야 합니다", "Starting pot must be positive", "スターティングポットには正の数を入力してください", "El bote inicial debe ser positivo", "O pote inicial deve ser positivo", "Der Start-Pot muss größer als 0 sein", "起始底池必须是正数", "起始底池必須是正數")
        );
      }
      if (config.startingPot > MAX_AMOUNT) {
        errors.push(
          pick(
            `스타팅 팟은 ${MAX_AMOUNT} 이하여야 합니다`,
            `Starting pot must not exceed ${MAX_AMOUNT}`,
            `スターティングポットは${MAX_AMOUNT}以下で入力してください`,
            `El bote inicial no debe exceder ${MAX_AMOUNT}`,
            `O pote inicial não pode passar de ${MAX_AMOUNT}`,
            `Der Start-Pot darf höchstens ${MAX_AMOUNT} sein`
          ,
            `起始底池不能超过 ${MAX_AMOUNT}`, `起始底池不能超過 ${MAX_AMOUNT}`)
        );
      }
      if (config.startingPot % 1 !== 0) {
        errors.push(
          pick("스타팅 팟은 정수여야 합니다", "Starting pot must be an integer", "スターティングポットは整数で入力してください", "El bote inicial debe ser un entero", "O pote inicial deve ser um número inteiro", "Der Start-Pot muss eine ganze Zahl sein", "起始底池必须是整数", "起始底池必須是整數")
        );
      }
      if (config.effectiveStack <= 0) {
        errors.push(
          pick(
            "유효 스택은 양수여야 합니다",
            "Effective stack must be positive",
            "有効スタックには正の数を入力してください",
            "El stack efectivo debe ser positivo",
            "O stack efetivo deve ser positivo",
            "Der effektive Stack muss größer als 0 sein"
          ,
            "有效筹码必须是正数", "有效籌碼必須是正數")
        );
      }
      if (config.effectiveStack > MAX_AMOUNT) {
        errors.push(
          pick(
            `유효 스택은 ${MAX_AMOUNT} 이하여야 합니다`,
            `Effective stack must not exceed ${MAX_AMOUNT}`,
            `有効スタックは${MAX_AMOUNT}以下で入力してください`,
            `El stack efectivo no debe exceder ${MAX_AMOUNT}`,
            `O stack efetivo não pode passar de ${MAX_AMOUNT}`,
            `Der effektive Stack darf höchstens ${MAX_AMOUNT} sein`
          ,
            `有效筹码不能超过 ${MAX_AMOUNT}`, `有效籌碼不能超過 ${MAX_AMOUNT}`)
        );
      }
      if (config.effectiveStack % 1 !== 0) {
        errors.push(
          pick(
            "유효 스택은 정수여야 합니다",
            "Effective stack must be an integer",
            "有効スタックは整数で入力してください",
            "El stack efectivo debe ser un entero",
            "O stack efetivo deve ser um número inteiro",
            "Der effektive Stack muss eine ganze Zahl sein"
          ,
            "有效筹码必须是整数", "有效籌碼必須是整數")
        );
      }
      if (config.rakePercent < 0) {
        errors.push(
          pick("레이크는 음수일 수 없습니다", "Rake must not be negative", "レーキは負の値にできません", "El rake no puede ser negativo", "O rake não pode ser negativo", "Der Rake darf nicht negativ sein", "抽水不能是负数", "抽水不能是負數")
        );
      }
      if (config.rakePercent > 100) {
        errors.push(
          pick("레이크는 100%를 초과할 수 없습니다", "Rake must not exceed 100%", "レーキは100%を超えることはできません", "El rake no puede exceder el 100%", "O rake não pode passar de 100%", "Der Rake darf 100% nicht überschreiten", "抽水不能超过 100%", "抽水不能超過 100%")
        );
      }
      if (config.rakeCap < 0) {
        errors.push(
          pick("레이크 캡은 음수일 수 없습니다", "Rake cap must not be negative", "レーキキャップは負の値にできません", "El tope de rake no puede ser negativo", "O teto do rake não pode ser negativo", "Das Rake-Cap darf nicht negativ sein", "抽水上限不能是负数", "抽水上限不能是負數")
        );
      }
      if (config.rakeCap > 3 * MAX_AMOUNT) {
        errors.push(
          pick<string>(
            `레이크 캡은 ${3 * MAX_AMOUNT} 이하여야 합니다`,
            `Rake cap must not exceed ${3 * MAX_AMOUNT}`,
            `レーキキャップは${3 * MAX_AMOUNT}以下で入力してください`,
            `El tope de rake no debe exceder ${3 * MAX_AMOUNT}`,
            `O teto do rake não pode passar de ${3 * MAX_AMOUNT}`,
            `Das Rake-Cap darf höchstens ${3 * MAX_AMOUNT} sein`
          ,
            `抽水上限不能超过 ${3 * MAX_AMOUNT}`)
        );
      }
      return errors;
    });

    const errorOop = computed(() => {
      const errors: string[] = [];
      const isDonk = true;
      const betConfig = [
        {
          name: pick("OOP 플랍 벳", "OOP flop bet", "OOP フロップベット", "Bet de flop OOP", "Bet de flop OOP", "OOP Flop-Bet", "OOP 翻牌下注", "OOP 翻牌下注"),
          res: config.oopFlopBetSanitized,
        },
        {
          name: pick("OOP 플랍 레이즈", "OOP flop raise", "OOP フロップレイズ", "Raise de flop OOP", "Raise de flop OOP", "OOP Flop-Raise", "OOP 翻牌加注", "OOP 翻牌加注"),
          res: config.oopFlopRaiseSanitized,
        },
        {
          name: pick("OOP 턴 벳", "OOP turn bet", "OOP ターンベット", "Bet de turn OOP", "Bet de turn OOP", "OOP Turn-Bet", "OOP 转牌下注", "OOP 轉牌下注"),
          res: config.oopTurnBetSanitized,
        },
        {
          name: pick("OOP 턴 레이즈", "OOP turn raise", "OOP ターンレイズ", "Raise de turn OOP", "Raise de turn OOP", "OOP Turn-Raise", "OOP 转牌加注", "OOP 轉牌加注"),
          res: config.oopTurnRaiseSanitized,
        },
        {
          name: pick("OOP 턴 덩크", "OOP turn donk", "OOP ターンドンク", "Donk de turn OOP", "Donk de turn OOP", "OOP Turn-Donk", "OOP 转牌领打", "OOP 轉牌領打"),
          res: config.oopTurnDonkSanitized,
          isDonk,
        },
        {
          name: pick("OOP 리버 벳", "OOP river bet", "OOP リバーベット", "Bet de river OOP", "Bet de river OOP", "OOP River-Bet", "OOP 河牌下注", "OOP 河牌下注"),
          res: config.oopRiverBetSanitized,
        },
        {
          name: pick("OOP 리버 레이즈", "OOP river raise", "OOP リバーレイズ", "Raise de river OOP", "Raise de river OOP", "OOP River-Raise", "OOP 河牌加注", "OOP 河牌加注"),
          res: config.oopRiverRaiseSanitized,
        },
        {
          name: pick("OOP 리버 덩크", "OOP river donk", "OOP リバードンク", "Donk de river OOP", "Donk de river OOP", "OOP River-Donk", "OOP 河牌领打", "OOP 河牌領打"),
          res: config.oopRiverDonkSanitized,
          isDonk,
        },
      ];
      for (const { name, res, isDonk } of betConfig) {
        if (!res.valid && (!isDonk || config.donkOption)) {
          errors.push(`${name}: ${res.s}`);
        }
      }
      return errors;
    });

    const errorIp = computed(() => {
      const errors: string[] = [];
      const betConfig = [
        {
          name: pick("IP 플랍 벳", "IP flop bet", "IP フロップベット", "Bet de flop IP", "Bet de flop IP", "IP Flop-Bet", "IP 翻牌下注", "IP 翻牌下注"),
          res: config.ipFlopBetSanitized,
        },
        {
          name: pick("IP 플랍 레이즈", "IP flop raise", "IP フロップレイズ", "Raise de flop IP", "Raise de flop IP", "IP Flop-Raise", "IP 翻牌加注", "IP 翻牌加注"),
          res: config.ipFlopRaiseSanitized,
        },
        {
          name: pick("IP 턴 벳", "IP turn bet", "IP ターンベット", "Bet de turn IP", "Bet de turn IP", "IP Turn-Bet", "IP 转牌下注", "IP 轉牌下注"),
          res: config.ipTurnBetSanitized,
        },
        {
          name: pick("IP 턴 레이즈", "IP turn raise", "IP ターンレイズ", "Raise de turn IP", "Raise de turn IP", "IP Turn-Raise", "IP 转牌加注", "IP 轉牌加注"),
          res: config.ipTurnRaiseSanitized,
        },
        {
          name: pick("IP 리버 벳", "IP river bet", "IP リバーベット", "Bet de river IP", "Bet de river IP", "IP River-Bet", "IP 河牌下注", "IP 河牌下注"),
          res: config.ipRiverBetSanitized,
        },
        {
          name: pick("IP 리버 레이즈", "IP river raise", "IP リバーレイズ", "Raise de river IP", "Raise de river IP", "IP River-Raise", "IP 河牌加注", "IP 河牌加注"),
          res: config.ipRiverRaiseSanitized,
        },
      ];
      for (const { name, res } of betConfig) {
        if (!res.valid) {
          errors.push(`${name}: ${res.s}`);
        }
      }
      return errors;
    });

    const errorMisc = computed(() => {
      const errors: string[] = [];
      if (config.addAllInThreshold < 0) {
        errors.push(
          pick(
            "올인 추가 임계값은 음수일 수 없습니다",
            "Add all-in threshold must not be negative",
            "オールイン追加しきい値は負の値にできません",
            "El umbral para agregar all-in no puede ser negativo",
            "O limiar para adicionar all-in não pode ser negativo",
            "Die Schwelle für zusätzliches All-in darf nicht negativ sein"
          ,
            "追加全下的阈值不能是负数", "追加全下的門檻不能是負數")
        );
      }
      if (config.forceAllInThreshold < 0) {
        errors.push(
          pick(
            "강제 올인 임계값은 음수일 수 없습니다",
            "Force all-in threshold must not be negative",
            "強制オールインしきい値は負の値にできません",
            "El umbral de all-in forzado no puede ser negativo",
            "O limiar de all-in forçado não pode ser negativo",
            "Die Schwelle für erzwungenes All-in darf nicht negativ sein"
          ,
            "强制全下的阈值不能是负数", "強制全下的門檻不能是負數")
        );
      }
      if (config.mergingThreshold < 0) {
        errors.push(
          pick(
            "병합 임계값은 음수일 수 없습니다",
            "Merging threshold must not be negative",
            "マージしきい値は負の値にできません",
            "El umbral de fusión no puede ser negativo",
            "O limiar de fusão não pode ser negativo",
            "Die Schwelle zum Zusammenfassen darf nicht negativ sein"
          ,
            "合并阈值不能是负数", "合併門檻不能是負數")
        );
      }
      return errors;
    });

    const warningMisc = computed(() => {
      const warnings: string[] = [];
      if (config.forceAllInThreshold > 30) {
        warnings.push(
          pick(
            "강제 올인 임계값을 30%보다 높게 설정하는 것은 권장되지 않습니다.\n의미는 도움말을 참고해 주세요.",
            "Setting the force all-in threshold higher than 30% is not recommended.\nSee the help text for what this setting does.",
            "強制オールインのしきい値を30%より高く設定することは推奨されません。\n詳しくはヘルプをご覧ください。",
            "No se recomienda fijar el umbral de all-in forzado por encima del 30%.\nConsulta la ayuda para ver qué significa.",
            "Não é recomendado definir o limiar de all-in forçado acima de 30%.\nConsulte a ajuda para ver o que isso significa.",
            "Es wird nicht empfohlen, die Schwelle für erzwungenes All-in auf über 30% zu setzen.\nWas die Einstellung bewirkt, steht unter „So gibst du die Werte ein“."
          ,
            "不建议把强制全下的阈值设到 30% 以上。\n想知道这个设置是做什么的，看上面的“怎么填”。", "不建議把強制全下的門檻設到 30% 以上。\n想知道這個設定是做什麼的，請看上面的「怎麼填」。")
        );
      }
      return warnings;
    });

    const errorLines = computed(() => {
      const errors: string[] = [];
      if (
        addedLinesArray.value.includes(ROOT_LINE_STRING) ||
        addedLinesArray.value.includes(INVALID_LINE_STRING) ||
        removedLinesArray.value.includes(ROOT_LINE_STRING) ||
        removedLinesArray.value.includes(INVALID_LINE_STRING)
      ) {
        errors.push(
          pick(
            "잘못된 라인이 발견되었습니다 (손상된 설정을 불러왔나요?)",
            "Invalid line found (loaded a broken configuration?)",
            "無効なラインが見つかりました(破損した設定を読み込みましたか?)",
            "Se encontró una línea inválida (¿cargaste una configuración dañada?)",
            "Foi encontrada uma linha inválida (você carregou uma configuração corrompida?)",
            "Ungültige Line gefunden (beschädigte Einstellung geladen?)"
          ,
            "发现了无效的线路（是不是加载了损坏的设置？）", "發現了無效的線路（是不是載入了損壞的設定？）")
        );
      }
      if (
        ![0, 3, 4, 5].includes(config.expectedBoardLength) ||
        (config.expectedBoardLength === 0 &&
          (addedLinesArray.value.length > 0 ||
            removedLinesArray.value.length > 0)) ||
        (config.expectedBoardLength > 0 &&
          addedLinesArray.value.length === 0 &&
          removedLinesArray.value.length === 0)
      ) {
        errors.push(
          pick(
            "잘못된 설정입니다 (손상된 설정을 불러왔나요?)",
            "Invalid configuration (loaded a broken configuration?)",
            "無効な設定です(破損した設定を読み込みましたか?)",
            "Configuración inválida (¿cargaste una configuración dañada?)",
            "Configuração inválida (você carregou uma configuração corrompida?)",
            "Ungültige Einstellung (beschädigte Einstellung geladen?)"
          ,
            "设置不正确（是不是加载了损坏的设置？）", "設定不正確（是不是載入了損壞的設定？）")
        );
      }
      return errors;
    });

    const isInputValid = computed(
      () =>
        errorBasics.value.length === 0 &&
        errorOop.value.length === 0 &&
        errorIp.value.length === 0 &&
        errorMisc.value.length === 0 &&
        errorLines.value.length === 0
    );

    const clearConfig = () => {
      config.startingPot = 0;
      config.effectiveStack = 0;
      config.rakePercent = 0;
      config.rakeCap = 0;
      config.donkOption = false;
      config.oopFlopBet = "";
      config.oopFlopRaise = "";
      config.oopTurnBet = "";
      config.oopTurnRaise = "";
      config.oopTurnDonk = "";
      config.oopRiverBet = "";
      config.oopRiverRaise = "";
      config.oopRiverDonk = "";
      config.ipFlopBet = "";
      config.ipFlopRaise = "";
      config.ipTurnBet = "";
      config.ipTurnRaise = "";
      config.ipRiverBet = "";
      config.ipRiverRaise = "";
      config.addAllInThreshold = 0;
      config.forceAllInThreshold = 0;
      config.mergingThreshold = 0;
      config.expectedBoardLength = 0;
      config.addedLines = "";
      config.removedLines = "";
    };

    const oopToIp = () => {
      config.ipFlopBet = config.oopFlopBet;
      config.ipFlopRaise = config.oopFlopRaise;
      config.ipTurnBet = config.oopTurnBet;
      config.ipTurnRaise = config.oopTurnRaise;
      config.ipRiverBet = config.oopRiverBet;
      config.ipRiverRaise = config.oopRiverRaise;
    };

    const ipToOop = () => {
      config.oopFlopBet = config.ipFlopBet;
      config.oopFlopRaise = config.ipFlopRaise;
      config.oopTurnBet = config.ipTurnBet;
      config.oopTurnRaise = config.ipTurnRaise;
      config.oopRiverBet = config.ipRiverBet;
      config.oopRiverRaise = config.ipRiverRaise;
    };

    const dbValue = computed(
      (): ConfigValue => ({
        startingPot: config.startingPot,
        effectiveStack: config.effectiveStack,
        rakePercent: config.rakePercent,
        rakeCap: config.rakeCap,
        donkOption: Number(config.donkOption),
        oopFlopBet: config.oopFlopBet,
        oopFlopRaise: config.oopFlopRaise,
        oopTurnBet: config.oopTurnBet,
        oopTurnRaise: config.oopTurnRaise,
        oopTurnDonk: config.donkOption ? config.oopTurnDonk : "",
        oopRiverBet: config.oopRiverBet,
        oopRiverRaise: config.oopRiverRaise,
        oopRiverDonk: config.donkOption ? config.oopRiverDonk : "",
        ipFlopBet: config.ipFlopBet,
        ipFlopRaise: config.ipFlopRaise,
        ipTurnBet: config.ipTurnBet,
        ipTurnRaise: config.ipTurnRaise,
        ipRiverBet: config.ipRiverBet,
        ipRiverRaise: config.ipRiverRaise,
        addAllInThreshold: config.addAllInThreshold,
        forceAllInThreshold: config.forceAllInThreshold,
        mergingThreshold: config.mergingThreshold,
        expectedBoardLength: config.expectedBoardLength,
        addedLines: config.addedLines,
        removedLines: config.removedLines,
      })
    );

    const loadConfig = (value: unknown) => {
      const configValue = value as ConfigValue;
      config.startingPot = Number(configValue.startingPot);
      config.effectiveStack = Number(configValue.effectiveStack);
      config.rakePercent = Number(configValue.rakePercent);
      config.rakeCap = Number(configValue.rakeCap);
      config.donkOption = Boolean(configValue.donkOption);
      config.addAllInThreshold = Number(configValue.addAllInThreshold);
      config.forceAllInThreshold = Number(configValue.forceAllInThreshold);
      config.mergingThreshold = Number(configValue.mergingThreshold);
      config.expectedBoardLength = Number(configValue.expectedBoardLength);
      config.addedLines = String(configValue.addedLines);
      config.removedLines = String(configValue.removedLines);

      const betMembers = [
        "oopFlopBet",
        "oopFlopRaise",
        "oopTurnBet",
        "oopTurnRaise",
        "oopTurnDonk",
        "oopRiverBet",
        "oopRiverRaise",
        "oopRiverDonk",
        "ipFlopBet",
        "ipFlopRaise",
        "ipTurnBet",
        "ipTurnRaise",
        "ipRiverBet",
        "ipRiverRaise",
      ] as const;

      for (const member of betMembers) {
        const str = String(configValue[member]);
        const sanitized = sanitizeBetString(str, member.endsWith("Raise"));
        config[member] = sanitized.valid ? sanitized.s : str;
      }
    };

    const startEdit = () => {
      isEditMode.value = true;
      if (config.expectedBoardLength === 0) {
        config.expectedBoardLength = Math.max(config.board.length, 3);
      }
      store.treeEditOpen = true;
    };

    const clearEdit = () => {
      config.expectedBoardLength = 0;
      config.addedLines = "";
      config.removedLines = "";
    };

    const saveEdit = (addedLines: string, removedLines: string) => {
      isEditMode.value = false;
      config.addedLines = addedLines;
      config.removedLines = removedLines;
      if (config.addedLines === "" && config.removedLines === "") {
        config.expectedBoardLength = 0;
      }
      store.treeEditOpen = false;
    };

    const cancelEdit = () => {
      isEditMode.value = false;
      if (config.addedLines === "" && config.removedLines === "") {
        config.expectedBoardLength = 0;
      }
      store.treeEditOpen = false;
    };

    // 팟·스택을 직접 고치면 더 이상 교육 프리셋 스팟이 아니므로 bb 환산을 끈다
    // (프리셋 로드는 코드에서 값을 넣으므로 이 핸들러가 호출되지 않음)
    const onAmountEdit = () => {
      store.displayUnitScale = 1;
    };

    return {
      MAX_AMOUNT,
      config,
      L,
      onAmountEdit,
      isEditMode,
      addedLinesArray,
      removedLinesArray,
      hasEdit,
      errorBasics,
      errorOop,
      errorIp,
      errorMisc,
      warningMisc,
      errorLines,
      isInputValid,
      clearConfig,
      oopToIp,
      ipToOop,
      dbValue,
      loadConfig,
      startEdit,
      clearEdit,
      saveEdit,
      cancelEdit,
    };
  },
});
</script>

<style scoped>
input {
  @apply disabled:cursor-not-allowed;
}

/*
  벳 사이즈 입력: 데스크톱은 플랍·턴·리버 3단이지만, 390px에서는 한 칸이 110px로
  눌려 입력칸이 손톱만해지고 «%»가 아래로 밀려 한 스트리트가 6줄을 먹었다.
  모바일에서는 스트리트를 세로로 쌓고, 한 줄 안에 [스트리트] 벳 [__]% 레이즈 [__]% 를 넣는다.
*/
@media (max-width: 767px) {
  .bet-grid {
    display: block;
  }
  /* 스트리트 한 덩어리 */
  .bet-grid > div {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem 0.5rem;
    margin-top: 0.5rem;
  }
  /* 스트리트 이름 (플랍·턴·리버) */
  .bet-grid > div > .underline {
    width: 2.25rem;
    flex: none;
    margin: 0;
  }
  /* 벳·레이즈·덩크 한 칸 */
  .bet-grid > div > .my-1:not(.underline) {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex: 1 1 8.5rem;
    margin: 0;
  }
  .bet-grid > div > .my-1:not(.underline) > span {
    width: auto;
    flex: none;
  }
  .bet-grid > div > .my-1:not(.underline) > input {
    width: 100%;
    min-width: 0;
  }
}

.button-arrow {
  @apply px-2 py-1 text-lg;
}
</style>
