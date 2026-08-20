<template>
  <div v-if="!isEditMode">
    <div class="flex flex-col md:flex-row">
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
          pick("스타팅 팟은 양수여야 합니다", "Starting pot must be positive", "スターティングポットには正の数を入力してください", "El bote inicial debe ser positivo")
        );
      }
      if (config.startingPot > MAX_AMOUNT) {
        errors.push(
          pick(
            `스타팅 팟은 ${MAX_AMOUNT} 이하여야 합니다`,
            `Starting pot must not exceed ${MAX_AMOUNT}`,
            `スターティングポットは${MAX_AMOUNT}以下で入力してください`,
            `El bote inicial no debe exceder ${MAX_AMOUNT}`
          )
        );
      }
      if (config.startingPot % 1 !== 0) {
        errors.push(
          pick("스타팅 팟은 정수여야 합니다", "Starting pot must be an integer", "スターティングポットは整数で入力してください", "El bote inicial debe ser un entero")
        );
      }
      if (config.effectiveStack <= 0) {
        errors.push(
          pick(
            "유효 스택은 양수여야 합니다",
            "Effective stack must be positive",
            "有効スタックには正の数を入力してください",
            "El stack efectivo debe ser positivo"
          )
        );
      }
      if (config.effectiveStack > MAX_AMOUNT) {
        errors.push(
          pick(
            `유효 스택은 ${MAX_AMOUNT} 이하여야 합니다`,
            `Effective stack must not exceed ${MAX_AMOUNT}`,
            `有効スタックは${MAX_AMOUNT}以下で入力してください`,
            `El stack efectivo no debe exceder ${MAX_AMOUNT}`
          )
        );
      }
      if (config.effectiveStack % 1 !== 0) {
        errors.push(
          pick(
            "유효 스택은 정수여야 합니다",
            "Effective stack must be an integer",
            "有効スタックは整数で入力してください",
            "El stack efectivo debe ser un entero"
          )
        );
      }
      if (config.rakePercent < 0) {
        errors.push(
          pick("레이크는 음수일 수 없습니다", "Rake must not be negative", "レーキは負の値にできません", "El rake no puede ser negativo")
        );
      }
      if (config.rakePercent > 100) {
        errors.push(
          pick("레이크는 100%를 초과할 수 없습니다", "Rake must not exceed 100%", "レーキは100%を超えることはできません", "El rake no puede exceder el 100%")
        );
      }
      if (config.rakeCap < 0) {
        errors.push(
          pick("레이크 캡은 음수일 수 없습니다", "Rake cap must not be negative", "レーキキャップは負の値にできません", "El tope de rake no puede ser negativo")
        );
      }
      if (config.rakeCap > 3 * MAX_AMOUNT) {
        errors.push(
          pick<string>(
            `레이크 캡은 ${3 * MAX_AMOUNT} 이하여야 합니다`,
            `Rake cap must not exceed ${3 * MAX_AMOUNT}`,
            `レーキキャップは${3 * MAX_AMOUNT}以下で入力してください`,
            `El tope de rake no debe exceder ${3 * MAX_AMOUNT}`
          )
        );
      }
      return errors;
    });

    const errorOop = computed(() => {
      const errors: string[] = [];
      const isDonk = true;
      const betConfig = [
        {
          name: pick("OOP 플랍 벳", "OOP flop bet", "OOP フロップベット", "Bet de flop OOP"),
          res: config.oopFlopBetSanitized,
        },
        {
          name: pick("OOP 플랍 레이즈", "OOP flop raise", "OOP フロップレイズ", "Raise de flop OOP"),
          res: config.oopFlopRaiseSanitized,
        },
        {
          name: pick("OOP 턴 벳", "OOP turn bet", "OOP ターンベット", "Bet de turn OOP"),
          res: config.oopTurnBetSanitized,
        },
        {
          name: pick("OOP 턴 레이즈", "OOP turn raise", "OOP ターンレイズ", "Raise de turn OOP"),
          res: config.oopTurnRaiseSanitized,
        },
        {
          name: pick("OOP 턴 덩크", "OOP turn donk", "OOP ターンドンク", "Donk de turn OOP"),
          res: config.oopTurnDonkSanitized,
          isDonk,
        },
        {
          name: pick("OOP 리버 벳", "OOP river bet", "OOP リバーベット", "Bet de river OOP"),
          res: config.oopRiverBetSanitized,
        },
        {
          name: pick("OOP 리버 레이즈", "OOP river raise", "OOP リバーレイズ", "Raise de river OOP"),
          res: config.oopRiverRaiseSanitized,
        },
        {
          name: pick("OOP 리버 덩크", "OOP river donk", "OOP リバードンク", "Donk de river OOP"),
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
          name: pick("IP 플랍 벳", "IP flop bet", "IP フロップベット", "Bet de flop IP"),
          res: config.ipFlopBetSanitized,
        },
        {
          name: pick("IP 플랍 레이즈", "IP flop raise", "IP フロップレイズ", "Raise de flop IP"),
          res: config.ipFlopRaiseSanitized,
        },
        {
          name: pick("IP 턴 벳", "IP turn bet", "IP ターンベット", "Bet de turn IP"),
          res: config.ipTurnBetSanitized,
        },
        {
          name: pick("IP 턴 레이즈", "IP turn raise", "IP ターンレイズ", "Raise de turn IP"),
          res: config.ipTurnRaiseSanitized,
        },
        {
          name: pick("IP 리버 벳", "IP river bet", "IP リバーベット", "Bet de river IP"),
          res: config.ipRiverBetSanitized,
        },
        {
          name: pick("IP 리버 레이즈", "IP river raise", "IP リバーレイズ", "Raise de river IP"),
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
            "El umbral para agregar all-in no puede ser negativo"
          )
        );
      }
      if (config.forceAllInThreshold < 0) {
        errors.push(
          pick(
            "강제 올인 임계값은 음수일 수 없습니다",
            "Force all-in threshold must not be negative",
            "強制オールインしきい値は負の値にできません",
            "El umbral de all-in forzado no puede ser negativo"
          )
        );
      }
      if (config.mergingThreshold < 0) {
        errors.push(
          pick(
            "병합 임계값은 음수일 수 없습니다",
            "Merging threshold must not be negative",
            "マージしきい値は負の値にできません",
            "El umbral de fusión no puede ser negativo"
          )
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
            "No se recomienda fijar el umbral de all-in forzado por encima del 30%.\nConsulta la ayuda para ver qué significa."
          )
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
            "Se encontró una línea inválida (¿cargaste una configuración dañada?)"
          )
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
            "Configuración inválida (¿cargaste una configuración dañada?)"
          )
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
