<template>
  <div v-if="!isEditMode">
    <div class="flex flex-col md:flex-row">
      <div class="shrink-0">
        <div class="mb-2 text-xs text-neutral-500">
          정수 칩 단위로 입력합니다. bb 환산이 필요하면 10칩=1bb 사용을 권장합니다.
        </div>
        <div class="flex flex-col sm:flex-row my-1 gap-0 sm:gap-8">
          <div>
            <div class="my-1">
              <span class="inline-block w-[7.5rem]">스타팅 팟:</span>
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
              <span class="inline-block w-[7.5rem]">유효 스택:</span>
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
              <span class="inline-block w-20">레이크:</span>
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
              <span class="inline-block w-20">레이크 캡:</span>
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
              초기화
            </button>
          </div>
        </div>

        <div
          v-if="errorBasics.length > 0"
          class="flex font-semibold text-red-400"
        >
          <div class="underline">오류:</div>
          <div class="ml-2">
            <div v-for="error in errorBasics" :key="error">
              {{ error }}
            </div>
          </div>
        </div>

        <div class="mt-6">
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span class="font-semibold shrink-0">OOP 벳 사이즈</span>
            <label class="inline-block shrink-0 ml-0 md:ml-2">
              <input
                v-model="config.donkOption"
                type="checkbox"
                class="mr-1 align-middle rounded cursor-pointer peer"
                :disabled="hasEdit"
              />
              <span class="cursor-pointer peer-disabled:cursor-not-allowed">
                덩크 벳에 다른 사이즈 사용
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
                  입력 방법
                </div>
                <template #content>
                  <div class="px-1 py-0.5 text-justify">
                    여러 개의 벳 사이즈를 쉼표 또는 공백으로 구분하여 아래
                    형식 중 어느 것으로든 입력할 수 있습니다. 비워 두면 벳이나
                    레이즈를 하지 않습니다.
                    <ul class="pl-6 list-disc">
                      <li class="mt-1">
                        팟 대비 퍼센트를 나타내는 숫자 (예: "50"). 레이즈의
                        경우, 먼저 콜을 한 뒤 지정한 퍼센트만큼의 벳을 더하는
                        방식으로 사이즈가 계산됩니다. 예를 들어 벳 전 팟이
                        100이고 상대가 75를 벳했다면, 50% 레이즈는 75 + (100 +
                        75 + 75) * 50% = 200이 됩니다.
                      </li>
                      <li class="mt-1">
                        이전 벳 사이즈의 배수 (예: "2.5x"). 레이즈에만 사용할
                        수 있습니다.
                      </li>
                      <li class="mt-1">올인 (예: "a").</li>
                      <li class="mt-1">
                        고정 금액 추가 (예: "100c"). 레이즈의 경우 레이즈 횟수
                        상한도 지정할 수 있습니다 (예: "20c3r").
                      </li>
                      <li class="mt-1">
                        지오메트릭 사이즈, 즉 남은 스택을 지정한 횟수의 동일
                        퍼센트 벳으로 나누는 방식 (예: "3e"). 예를 들어 현재
                        팟이 100이고 유효 스택이 400이면 "2e"는 100 벳이
                        됩니다. "e" 앞의 숫자를 생략하면 남은 스트리트 수가
                        사용됩니다 (플랍=3, 턴=2, 리버=1). 레이즈의 경우 지정한
                        숫자에서 이전 레이즈 횟수를 뺍니다. 예를 들어 "3e"는
                        리레이즈 시 "2e"로 바뀝니다. "e" 뒤에 숫자를 붙여 최대
                        퍼센트 한도를 지정할 수도 있습니다 (예: "2e200").
                      </li>
                    </ul>
                  </div>
                </template>
              </Tippy>
            </div>
          </div>

          <div class="flex gap-5 bet-grid">
            <div>
              <div class="my-1 underline">플랍</div>
              <div class="my-1">
                <span class="inline-block w-14">벳:</span>
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
                <span class="inline-block w-14">레이즈:</span>
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
              <div class="my-1 underline">턴</div>
              <div class="my-1">
                <span class="inline-block w-14">벳:</span>
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
                <span class="inline-block w-14">레이즈:</span>
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
                <span class="inline-block w-14">덩크:</span>
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
              <div class="my-1 underline">리버</div>
              <div class="my-1">
                <span class="inline-block w-14">벳:</span>
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
                <span class="inline-block w-14">레이즈:</span>
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
                <span class="inline-block w-14">덩크:</span>
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
            <div class="mt-6 font-semibold shrink-0">IP 벳 사이즈</div>
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
              <div class="my-1 underline">플랍</div>
              <div class="my-1">
                <span class="inline-block w-14">벳:</span>
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
                <span class="inline-block w-14">레이즈:</span>
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
              <div class="my-1 underline">턴</div>
              <div class="my-1">
                <span class="inline-block w-14">벳:</span>
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
                <span class="inline-block w-14">레이즈:</span>
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
              <div class="my-1 underline">리버</div>
              <div class="my-1">
                <span class="inline-block w-14">벳:</span>
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
                <span class="inline-block w-14">레이즈:</span>
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
          <div class="underline">오류:</div>
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
                올인 추가 임계값:
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
                      가능한 최대 벳 사이즈와 팟의 비율이 이 임계값보다 작은
                      모든 지점에 올인 액션을 추가합니다.
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
                강제 올인 임계값:
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
                        상대가 벳 액션을 콜한 후의 SPR (스택/팟 비율)이 이
                        임계값보다 낮으면 해당 벳 액션을 올인 액션으로
                        대체합니다. 권장 값은 15% - 20% 정도입니다.
                      </div>
                      <div class="mt-3">
                        이 옵션은 PioSOLVER의 "all-in threshold"와 유사합니다.
                        PioSOLVER는 초기 스택 대비 팟에 투입한 금액의 비율이
                        임계값을 초과하면 벳 액션을 올인으로 대체합니다.
                      </div>
                      <div class="mt-3">
                        소수점 반올림을 무시할 때 변환 공식은 다음과 같습니다
                        (s = 초기 SPR, r = PioSOLVER의 임계값):
                      </div>
                      <div class="mt-1 text-center">
                        임계값 = s * (1 - r) / (1 + 2 * s * r).
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
                병합 임계값:
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
                        비슷한 사이즈의 벳 액션이 있으면 하나로 병합합니다.
                      </div>
                      <div class="mt-3">
                        알고리즘은 PioSOLVER와 동일합니다. 즉, 가장 큰 벳
                        사이즈(= 팟의 X%)를 선택하고, 다음 부등식을 만족하는
                        사이즈(= 팟의 Y%)의 다른 벳 액션을 모두 제거합니다:
                      </div>
                      <div class="my-1 text-center">
                        (100 + X) / (100 + Y) &lt; 1.0 + 임계값.
                      </div>
                      <div>
                        남은 벳 중 다음으로 큰 벳 사이즈로 이 과정을
                        반복합니다.
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
                트리 미리보기 & 편집
              </button>

              <button
                v-if="hasEdit"
                class="button-base button-red"
                @click="clearEdit"
              >
                편집 초기화 & 잠금 해제
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="errorMisc.length > 0"
          class="flex mt-1 font-semibold text-red-400"
        >
          <div class="underline">오류:</div>
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
          <div class="underline">경고:</div>
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
          추가된 라인:
        </div>
        <div class="flex flex-col">
          <div v-for="addedLine in addedLinesArray" :key="addedLine">
            {{ addedLine }}
          </div>
        </div>
      </div>

      <div v-if="removedLinesArray.length > 0" class="flex mt-2">
        <div class="font-semibold underline w-[7.75rem]">
          제거된 라인:
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
        <div class="underline">경고:</div>
        <div class="ml-2">
          편집된 트리는 {{ config.expectedBoardLength }}장의 보드를
          가정하지만, 현재 보드는 {{ config.board.length }}장으로 구성되어
          있습니다.
          <br />
          편집된 트리를 초기화하려면 "편집 초기화 & 잠금 해제" 버튼을
          클릭하세요.
        </div>
      </div>
    </div>

    <div
      v-if="errorLines.length > 0"
      class="flex mt-2 font-semibold text-red-400"
    >
      <div class="underline">오류:</div>
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
        errors.push("스타팅 팟은 양수여야 합니다");
      }
      if (config.startingPot > MAX_AMOUNT) {
        errors.push(`스타팅 팟은 ${MAX_AMOUNT} 이하여야 합니다`);
      }
      if (config.startingPot % 1 !== 0) {
        errors.push("스타팅 팟은 정수여야 합니다");
      }
      if (config.effectiveStack <= 0) {
        errors.push("유효 스택은 양수여야 합니다");
      }
      if (config.effectiveStack > MAX_AMOUNT) {
        errors.push(`유효 스택은 ${MAX_AMOUNT} 이하여야 합니다`);
      }
      if (config.effectiveStack % 1 !== 0) {
        errors.push("유효 스택은 정수여야 합니다");
      }
      if (config.rakePercent < 0) {
        errors.push("레이크는 음수일 수 없습니다");
      }
      if (config.rakePercent > 100) {
        errors.push("레이크는 100%를 초과할 수 없습니다");
      }
      if (config.rakeCap < 0) {
        errors.push("레이크 캡은 음수일 수 없습니다");
      }
      if (config.rakeCap > 3 * MAX_AMOUNT) {
        errors.push(`레이크 캡은 ${3 * MAX_AMOUNT} 이하여야 합니다`);
      }
      return errors;
    });

    const errorOop = computed(() => {
      const errors: string[] = [];
      const isDonk = true;
      const betConfig = [
        { name: "OOP 플랍 벳", res: config.oopFlopBetSanitized },
        { name: "OOP 플랍 레이즈", res: config.oopFlopRaiseSanitized },
        { name: "OOP 턴 벳", res: config.oopTurnBetSanitized },
        { name: "OOP 턴 레이즈", res: config.oopTurnRaiseSanitized },
        { name: "OOP 턴 덩크", res: config.oopTurnDonkSanitized, isDonk },
        { name: "OOP 리버 벳", res: config.oopRiverBetSanitized },
        { name: "OOP 리버 레이즈", res: config.oopRiverRaiseSanitized },
        { name: "OOP 리버 덩크", res: config.oopRiverDonkSanitized, isDonk },
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
        { name: "IP 플랍 벳", res: config.ipFlopBetSanitized },
        { name: "IP 플랍 레이즈", res: config.ipFlopRaiseSanitized },
        { name: "IP 턴 벳", res: config.ipTurnBetSanitized },
        { name: "IP 턴 레이즈", res: config.ipTurnRaiseSanitized },
        { name: "IP 리버 벳", res: config.ipRiverBetSanitized },
        { name: "IP 리버 레이즈", res: config.ipRiverRaiseSanitized },
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
        errors.push("올인 추가 임계값은 음수일 수 없습니다");
      }
      if (config.forceAllInThreshold < 0) {
        errors.push("강제 올인 임계값은 음수일 수 없습니다");
      }
      if (config.mergingThreshold < 0) {
        errors.push("병합 임계값은 음수일 수 없습니다");
      }
      return errors;
    });

    const warningMisc = computed(() => {
      const warnings: string[] = [];
      if (config.forceAllInThreshold > 30) {
        warnings.push(
          "강제 올인 임계값을 30%보다 높게 설정하는 것은 권장되지 않습니다.\n의미는 도움말을 참고해 주세요."
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
        errors.push("잘못된 라인이 발견되었습니다 (손상된 설정을 불러왔나요?)");
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
        errors.push("잘못된 설정입니다 (손상된 설정을 불러왔나요?)");
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
      store.headers["tree-config"].push("트리 미리보기 & 편집");
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
      store.headers["tree-config"].pop();
    };

    const cancelEdit = () => {
      isEditMode.value = false;
      if (config.addedLines === "" && config.removedLines === "") {
        config.expectedBoardLength = 0;
      }
      store.headers["tree-config"].pop();
    };

    // 팟·스택을 직접 고치면 더 이상 교육 프리셋 스팟이 아니므로 bb 환산을 끈다
    // (프리셋 로드는 코드에서 값을 넣으므로 이 핸들러가 호출되지 않음)
    const onAmountEdit = () => {
      store.displayUnitScale = 1;
    };

    return {
      MAX_AMOUNT,
      config,
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
