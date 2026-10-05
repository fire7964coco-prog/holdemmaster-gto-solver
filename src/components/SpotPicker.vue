<template>
  <section
    class="spot-picker mb-3 max-w-[34rem] rounded-lg border border-neutral-700 bg-surface-1 px-3 py-2 text-sm"
    data-testid="spot-picker"
  >
    <button
      type="button"
      class="spot-picker-head"
      :aria-expanded="open"
      data-testid="spot-picker-toggle"
      @click="manual = !open"
    >
      <span class="font-semibold">{{ L.title }}</span>
      <span class="text-neutral-400" aria-hidden="true">{{ open ? "▾" : "▸" }}</span>
    </button>

    <div v-if="open" class="mt-1">
      <p class="mb-2 text-[13px] text-neutral-400">{{ L.note }}</p>

      <div class="spot-row" role="group" :aria-label="L.opener">
        <span class="spot-row-label">{{ L.opener }}</span>
        <button
          v-for="pos in OPENERS"
          :key="pos"
          type="button"
          :class="chipStyle(opener === pos)"
          :aria-pressed="opener === pos"
          :data-testid="`spot-opener-${pos}`"
          @click="selectOpener(pos)"
        >
          {{ pos }}
        </button>
      </div>

      <div class="spot-row" role="group" :aria-label="L.caller">
        <span class="spot-row-label">{{ L.caller }}</span>
        <button
          v-for="pos in CALLERS"
          :key="pos"
          type="button"
          :class="chipStyle(caller === pos)"
          :aria-pressed="caller === pos"
          :disabled="!callers.includes(pos)"
          :data-testid="`spot-caller-${pos}`"
          @click="caller = pos"
        >
          {{ pos }}
        </button>
      </div>

      <button
        type="button"
        class="button-base button-primary mt-2"
        data-testid="spot-apply"
        @click="apply"
      >
        {{ L.apply }}
      </button>
    </div>

    <div v-if="status" class="mt-2" role="status" data-testid="spot-applied">
      <p>{{ $n(L.applied(status.spot.oop, status.spot.ip, status.pot, status.stack)) }}</p>
      <p v-if="status.betsFilled" class="mt-0.5 text-[13px] text-neutral-400">
        {{ $n(L.betsFilled(betLabels.flop, betLabels.later, betLabels.raise)) }}
      </p>
      <button
        type="button"
        class="button-base button-blue mt-2"
        data-testid="spot-next"
        @click="store.sideView = 'board'"
      >
        {{ L.next }}
      </button>
    </div>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, ref } from "vue";
import { useStore, useConfigStore } from "../store";
import { formatAmount } from "../utils";
import { i18n } from "../i18n";
import { Position } from "../preflop-charts";
import {
  Caller,
  CALLERS,
  OPENERS,
  SPOT_BET_SIZES,
  SPOT_UNIT_SCALE,
  SrpSpot,
  callersFor,
  srpSpot,
} from "../preflop-spots";

// 자리 이름(UTG·HJ·CO·BTN·SB·BB)은 전 언어가 로마자 그대로 쓴다 (프리플랍 차트와 같다)
const M = {
  ko: {
    title: "자리로 레인지 채우기",
    note: "오픈한 자리와 콜한 자리를 고른 뒤 아래 버튼을 누르면 양쪽 레인지와 팟·스택이 한 번에 들어갑니다. 레인지는 프리플랍 차트와 같습니다 (6맥스 캐시 100bb).",
    opener: "오픈",
    caller: "콜",
    apply: "양쪽 레인지 채우기",
    applied: (oop: string, ip: string, pot: string, stack: string) =>
      `${oop}(OOP) · ${ip}(IP) 레인지를 넣었습니다. 팟 ${pot}bb · 스택 ${stack}bb`,
    betsFilled: (flop: string, later: string, raise: string) =>
      `벳 사이즈가 비어 있어 기본값도 넣었습니다 — 플랍 ${flop} · 턴/리버 ${later} · 레이즈 ${raise}`,
    next: "다음: ③ 보드",
  },
  en: {
    title: "Fill ranges by position",
    note: "Pick who opened and who called, then press the button below — both ranges, the pot and the stack are filled in at once. The ranges are the same as in Preflop Charts (6-max cash, 100bb).",
    opener: "Open",
    caller: "Call",
    apply: "Fill both ranges",
    applied: (oop: string, ip: string, pot: string, stack: string) =>
      `${oop} (OOP) · ${ip} (IP) ranges filled in. Pot ${pot}bb · Stack ${stack}bb`,
    betsFilled: (flop: string, later: string, raise: string) =>
      `Bet sizes were empty, so defaults were filled in too — Flop ${flop} · Turn/River ${later} · Raise ${raise}`,
    next: "Next: ③ Board",
  },
  ja: {
    title: "ポジションでレンジを入力",
    note: "オープンしたポジションとコールしたポジションを選んで下のボタンを押すと、両方のレンジとポット・スタックが一度に入ります。レンジはプリフロップレンジ表と同じです（6maxキャッシュゲーム100bb）。",
    opener: "オープン",
    caller: "コール",
    apply: "両方のレンジを入力",
    applied: (oop: string, ip: string, pot: string, stack: string) =>
      `${oop}（OOP）・${ip}（IP）のレンジを入力しました。ポット ${pot}bb・スタック ${stack}bb`,
    betsFilled: (flop: string, later: string, raise: string) =>
      `ベットサイズが空だったので、初期値も入力しました — フロップ ${flop}・ターン/リバー ${later}・レイズ ${raise}`,
    next: "次へ: ③ ボード",
  },
  es: {
    title: "Llenar rangos por posición",
    note: "Elige quién abrió y quién pagó, y toca el botón de abajo: se llenan a la vez los dos rangos, el bote y el stack. Los rangos son los mismos que en Tablas preflop (cash 6-max, 100bb).",
    opener: "Open",
    caller: "Call",
    apply: "Llenar ambos rangos",
    applied: (oop: string, ip: string, pot: string, stack: string) =>
      `Rangos de ${oop} (OOP) y ${ip} (IP) cargados. Bote ${pot}bb · Stack ${stack}bb`,
    betsFilled: (flop: string, later: string, raise: string) =>
      `Los bet sizes estaban vacíos, así que también se cargaron los valores predeterminados — Flop ${flop} · Turn/River ${later} · Raise ${raise}`,
    next: "Siguiente: ③ Board",
  },
  pt: {
    title: "Preencher ranges por posição",
    note: "Escolha quem abriu e quem pagou e toque no botão abaixo: os dois ranges, o pote e o stack são preenchidos de uma vez. Os ranges são os mesmos das Tabelas pré-flop (cash 6-max, 100bb).",
    opener: "Open",
    caller: "Call",
    apply: "Preencher os dois ranges",
    applied: (oop: string, ip: string, pot: string, stack: string) =>
      `Ranges de ${oop} (OOP) e ${ip} (IP) preenchidos. Pote ${pot}bb · Stack ${stack}bb`,
    betsFilled: (flop: string, later: string, raise: string) =>
      `Os bet sizes estavam vazios, então os valores padrão também foram preenchidos — Flop ${flop} · Turn/River ${later} · Raise ${raise}`,
    next: "Próximo: ③ Board",
  },
  de: {
    title: "Ranges per Position füllen",
    note: "Wähle, wer geöffnet und wer gecallt hat, und tippe auf den Button darunter – beide Ranges, Pot und Stack werden auf einmal eingetragen. Die Ranges sind dieselben wie in den Preflop-Charts (6-max Cashgame, 100bb).",
    opener: "Open",
    caller: "Call",
    apply: "Beide Ranges füllen",
    applied: (oop: string, ip: string, pot: string, stack: string) =>
      `Ranges für ${oop} (OOP) und ${ip} (IP) eingetragen. Pot ${pot}bb · Stack ${stack}bb`,
    betsFilled: (flop: string, later: string, raise: string) =>
      `Die Bet Sizes waren leer, daher wurden auch Standardwerte eingetragen – Flop ${flop} · Turn/River ${later} · Raise ${raise}`,
    next: "Weiter: ③ Board",
  },
  zh: {
    title: "按位置填入范围",
    note: "选好开池的位置和跟注的位置，再点下面的按钮，双方范围、底池和筹码会一次填好。范围与翻前范围表相同（6 人桌现金局 100bb）。",
    opener: "开池",
    caller: "跟注",
    apply: "填入双方范围",
    applied: (oop: string, ip: string, pot: string, stack: string) =>
      `已填入 ${oop}（OOP）和 ${ip}（IP）的范围。底池 ${pot}bb · 筹码 ${stack}bb`,
    betsFilled: (flop: string, later: string, raise: string) =>
      `下注尺寸是空的，所以也填入了默认值——翻牌 ${flop} · 转牌/河牌 ${later} · 加注 ${raise}`,
    next: "下一步：③ 公共牌",
  },
  "zh-hant": {
    title: "按位置填入範圍",
    note: "選好開池的位置和跟注的位置，再點下面的按鈕，雙方範圍、底池和籌碼會一次填好。範圍與翻前範圍表相同（6 人現金桌 100bb）。",
    opener: "開池",
    caller: "跟注",
    apply: "填入雙方範圍",
    applied: (oop: string, ip: string, pot: string, stack: string) =>
      `已填入 ${oop}（OOP）和 ${ip}（IP）的範圍。底池 ${pot}bb · 籌碼 ${stack}bb`,
    betsFilled: (flop: string, later: string, raise: string) =>
      `下注尺寸是空的，所以也填入了預設值——翻牌 ${flop} · 轉牌/河牌 ${later} · 加注 ${raise}`,
    next: "下一步：③ 公共牌",
  },
  fr: {
    title: "Remplir les ranges par position",
    note: "Choisis l'ouvreur et le caller, puis touche le bouton ci-dessous : les deux ranges, le pot et le stack sont remplis d'un coup. Les ranges sont celles des Charts préflop (cash game 6-max, 100bb).",
    opener: "Open",
    caller: "Call",
    apply: "Remplir les deux ranges",
    applied: (oop: string, ip: string, pot: string, stack: string) =>
      `Ranges de ${oop} (OOP) et ${ip} (IP) remplies. Pot ${pot}bb · Stack ${stack}bb`,
    betsFilled: (flop: string, later: string, raise: string) =>
      `Les bet sizes étaient vides, les valeurs par défaut ont donc été ajoutées — Flop ${flop} · Turn/River ${later} · Raise ${raise}`,
    next: "Suivant : ③ Board",
  },
  id: {
    title: "Isi range berdasarkan posisi",
    note: "Pilih posisi yang open dan posisi yang call, lalu ketuk tombol di bawah — kedua range, pot, dan stack langsung terisi. Range-nya sama dengan Chart preflop (cash game 6-max, 100bb).",
    opener: "Open",
    caller: "Call",
    apply: "Isi kedua range",
    applied: (oop: string, ip: string, pot: string, stack: string) =>
      `Range ${oop} (OOP) dan ${ip} (IP) sudah diisi. Pot ${pot}bb · Stack ${stack}bb`,
    betsFilled: (flop: string, later: string, raise: string) =>
      `Bet size masih kosong, jadi nilai default ikut diisi — Flop ${flop} · Turn/River ${later} · Raise ${raise}`,
    next: "Berikutnya: ③ Board",
  },
  ms: {
    title: "Isi range mengikut posisi",
    note: "Pilih posisi yang open dan posisi yang call, kemudian ketik butang di bawah — kedua-dua range, pot dan stack terus diisi. Range ini sama dengan Carta preflop (cash game 6-max, 100bb).",
    opener: "Open",
    caller: "Call",
    apply: "Isi kedua-dua range",
    applied: (oop: string, ip: string, pot: string, stack: string) =>
      `Range ${oop} (OOP) dan ${ip} (IP) telah diisi. Pot ${pot}bb · Stack ${stack}bb`,
    betsFilled: (flop: string, later: string, raise: string) =>
      `Bet size masih kosong, jadi nilai lalai turut diisi — Flop ${flop} · Turn/River ${later} · Raise ${raise}`,
    next: "Seterusnya: ③ Board",
  },
  hi: {
    title: "पोज़िशन चुनकर range भरें",
    note: "Open करने वाली और call करने वाली पोज़िशन चुनें, फिर नीचे का बटन दबाएँ — दोनों ranges, pot और stack एक साथ भर जाएँगे। Ranges वही हैं जो Preflop चार्ट में हैं (6-max cash, 100bb)।",
    opener: "Open",
    caller: "Call",
    apply: "दोनों ranges भरें",
    applied: (oop: string, ip: string, pot: string, stack: string) =>
      `${oop} (OOP) और ${ip} (IP) की ranges भर दी गईं। Pot ${pot}bb · Stack ${stack}bb`,
    betsFilled: (flop: string, later: string, raise: string) =>
      `Bet size खाली थे, इसलिए डिफ़ॉल्ट मान भी भर दिए गए — Flop ${flop} · Turn/River ${later} · Raise ${raise}`,
    next: "आगे: ③ Board",
  },
  tr: {
    title: "Range'leri pozisyona göre doldur",
    note: "Open yapan ve call eden pozisyonu seç, sonra aşağıdaki düğmeye bas — iki range, pot ve stack tek seferde dolar. Range'ler Preflop tablosundakilerle aynı (6-max cash, 100bb).",
    opener: "Açan",
    caller: "Call eden",
    apply: "İki range'i de doldur",
    applied: (oop: string, ip: string, pot: string, stack: string) =>
      `Range'ler dolduruldu: ${oop} (OOP) · ${ip} (IP). Pot ${pot}bb · Stack ${stack}bb`,
    betsFilled: (flop: string, later: string, raise: string) =>
      `Bet boyutları boştu, varsayılanlar da dolduruldu — Flop ${flop} · Turn/River ${later} · Raise ${raise}`,
    next: "Sonraki: ③ Board",
  },
} as const;

const BET_FIELDS = [
  "oopFlopBet",
  "oopFlopRaise",
  "oopTurnBet",
  "oopTurnRaise",
  "oopRiverBet",
  "oopRiverRaise",
  "ipFlopBet",
  "ipFlopRaise",
  "ipTurnBet",
  "ipTurnRaise",
  "ipRiverBet",
  "ipRiverRaise",
] as const;

type Applied = {
  spot: SrpSpot;
  betsFilled: boolean;
  /** 적용 직후 RangeEditor가 정규화한 레인지 — 그 뒤 손으로 고쳤는지 가리는 기준 */
  ranges: [string, string];
};

export default defineComponent({
  setup() {
    const store = useStore();
    const config = useConfigStore();
    const L = computed(() => M[i18n.locale]);

    const opener = ref<Position>("BTN");
    const caller = ref<Caller>("BB");
    const callers = computed(() => callersFor(opener.value));

    const selectOpener = (pos: Position) => {
      opener.value = pos;
      if (!callersFor(pos).includes(caller.value)) caller.value = "BB";
    };

    // 레인지가 둘 다 비어 있을 때만 펼쳐 둔다 — 채운 뒤에는 한 줄로 접혀 격자를 가리지 않는다
    const manual = ref<boolean | null>(null);
    const bothEmpty = computed(
      () => !config.range[0].some(Boolean) && !config.range[1].some(Boolean)
    );
    const open = computed(() => manual.value ?? bothEmpty.value);

    const applied = ref<Applied | null>(null);

    const apply = async () => {
      const spot = srpSpot(opener.value, caller.value);
      if (!spot) return;

      config.startingPot = spot.startingPot;
      config.effectiveStack = spot.effectiveStack;
      store.displayUnitScale = SPOT_UNIT_SCALE;

      // 팟·스택이 바뀌면 편집해 둔 트리 줄이 맞지 않는다 (교육 예제 로드와 같다)
      config.expectedBoardLength = 0;
      config.addedLines = "";
      config.removedLines = "";

      // 벳 사이즈는 «전부 비어 있을 때만» 채운다 — 유저가 넣어 둔 값은 건드리지 않는다
      const betsEmpty =
        BET_FIELDS.every((field) => config[field].trim() === "") &&
        config.oopTurnDonk.trim() === "" &&
        config.oopRiverDonk.trim() === "";
      if (betsEmpty) {
        for (const field of BET_FIELDS) {
          config[field] = field.endsWith("Raise")
            ? SPOT_BET_SIZES.raise
            : field.includes("Flop")
            ? SPOT_BET_SIZES.flopBet
            : SPOT_BET_SIZES.laterBet;
        }
      }

      // 레인지는 RangeEditor가 watch로 받아 자체 파이프라인으로 적용
      store.pendingRangeText = [spot.oopRange, spot.ipRange];
      await nextTick();
      applied.value = {
        spot,
        betsFilled: betsEmpty,
        ranges: [store.rangeText[0], store.rangeText[1]],
      };
      manual.value = null;
    };

    // 넣은 뒤 레인지·팟·스택을 고치면(손으로든 교육 예제로든) 안내를 내린다 — 낡은 안내는 거짓말이 된다
    const status = computed(() => {
      const a = applied.value;
      if (
        !a ||
        store.rangeText[0] !== a.ranges[0] ||
        store.rangeText[1] !== a.ranges[1] ||
        config.startingPot !== a.spot.startingPot ||
        config.effectiveStack !== a.spot.effectiveStack
      ) {
        return null;
      }
      return {
        spot: a.spot,
        betsFilled: a.betsFilled,
        pot: formatAmount(a.spot.startingPot, SPOT_UNIT_SCALE),
        stack: formatAmount(a.spot.effectiveStack, SPOT_UNIT_SCALE),
      };
    });

    const percent = (sizes: string) =>
      sizes
        .split(",")
        .map((size) => `${size}%`)
        .join(" · ");
    const betLabels = {
      flop: percent(SPOT_BET_SIZES.flopBet),
      later: percent(SPOT_BET_SIZES.laterBet),
      raise: percent(SPOT_BET_SIZES.raise),
    };

    const chipStyle = (active: boolean) =>
      "spot-chip px-3 py-1.5 rounded-md text-sm font-semibold transition-colors " +
      (active
        ? "bg-brand text-brand-ink"
        : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700");

    return {
      store,
      L,
      OPENERS,
      CALLERS,
      opener,
      caller,
      callers,
      selectOpener,
      manual,
      open,
      apply,
      status,
      betLabels,
      chipStyle,
    };
  },
});
</script>

<style scoped>
.spot-picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  min-height: 32px;
  text-align: left;
}
.spot-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.375rem;
}
.spot-row-label {
  min-width: 3.25rem;
  color: rgb(var(--c-text-secondary));
  font-size: 13px;
}
.spot-chip:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.spot-chip:disabled:hover {
  @apply bg-neutral-800;
}
@media (max-width: 767px) {
  .spot-picker-head,
  .spot-chip {
    min-height: 40px;
  }
}
</style>
