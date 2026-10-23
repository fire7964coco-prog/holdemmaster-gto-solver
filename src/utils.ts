export const ranks = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
  "J",
  "Q",
  "K",
  "A",
];

export const suits = ["♣", "♦", "♥", "♠"];
export const suitLetters = ["c", "d", "h", "s"];

export const rankPat = "[AaKkQqJjTt2-9]";
const cardRegex = new RegExp(`^(${rankPat})([cdhs])$`);

// 다크 테마 4색 덱: ♣초록 ♦파랑 ♥빨강 ♠밝은회색 (GTO Wizard 관행)
const suitClasses = [
  "text-green-500",
  "text-blue-400",
  "text-red-400",
  "text-neutral-100",
];

export const cardText = (card: number) => {
  return {
    rank: ranks[card >>> 2],
    suit: suits[card & 3],
    suitLetter: suitLetters[card & 3],
    colorClass: suitClasses[card & 3],
  };
};

export const cardId = (rank: number, suit: number) => {
  return 4 * rank + suit;
};

export const parseCardString = (text: string) => {
  const match = text.match(cardRegex);
  if (!match) return null;

  const rank = ranks.indexOf(match[1].toUpperCase());
  const suit = suitLetters.indexOf(match[2]);
  return cardId(rank, suit);
};

export const cardPairCellIndex = (card1: number, card2: number) => {
  if (card1 > card2) [card1, card2] = [card2, card1];
  const hr = card2 >>> 2;
  const lr = card1 >>> 2;
  const hs = card2 & 3;
  const ls = card1 & 3;
  const isSuited = hs === ls;
  return {
    row: 12 - (isSuited ? hr : lr),
    col: 12 - (isSuited ? lr : hr),
    index: isSuited
      ? 3 - hs
      : hr === lr
      ? 6 - ((ls * (5 - ls)) / 2 + hs)
      : 11 - (3 * hs + ls - +(hs < ls)),
  };
};

export const cardPairOrder = (pair: number) => {
  let card1 = pair & 0xff;
  let card2 = pair >>> 8;
  if (card2 === 0xff) return card1;
  if (card1 > card2) [card1, card2] = [card2, card1];
  const hr = card2 >>> 2;
  const lr = card1 >>> 2;
  let hs = card2 & 3;
  let ls = card1 & 3;
  const isPair = hr === lr;
  const isSuited = hs === ls;
  if (isPair) [hs, ls] = [ls, hs];
  return ((((hr * 2 + +isPair) * 2 + +isSuited) * 16 + lr) * 4 + hs) * 4 + ls;
};

export const average = (values: number[], weights: number[]): number => {
  let sum = 0;
  let totalWeight = 0;
  for (let i = 0; i < values.length; ++i) {
    sum += values[i] * weights[i];
    totalWeight += weights[i];
  }
  return sum / totalWeight;
};

export const toFixed1 = (value: number) => {
  if (!isFinite(value)) return (value < 0 ? "-" : "") + "∞";
  if (-0.05 < value && value < 0.05) return "0.0";
  return value.toFixed(1);
};

export const toFixed2 = (value: number) => {
  if (-0.005 < value && value < 0.005) return "0.00";
  return value.toFixed(2);
};

export const toFixed3 = (value: number) => {
  if (-0.0005 < value && value < 0.0005) return "0.000";
  return value.toFixed(3);
};

export const toFixed = [toFixed1, toFixed2, toFixed3];

export const toFixedAdaptive = (value: number) => {
  const abs = Math.abs(value);
  if (abs < 10) return toFixed3(value);
  if (abs < 100) return toFixed2(value);
  return toFixed1(value);
};

/** 엔진의 정수 칩 값을 화면 단위로 변환한다 (교육 프리셋은 10 = 1bb). */
export const scaleAmount = (value: number, unitScale = 1) => {
  return value / Math.max(1, unitScale);
};

export const formatAmount = (value: number, unitScale = 1) => {
  const scaled = scaleAmount(value, unitScale);
  if (Number.isInteger(scaled)) return String(scaled);
  return scaled.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
};

export const formatBb = (value: number, unitScale = 10) => {
  return `${formatAmount(value, unitScale)}bb`;
};

export const capitalize = (s: string) => {
  return (s && s[0].toUpperCase() + s.slice(1)) || "";
};

export const colorString = (color: {
  red: number;
  green: number;
  blue: number;
}) => {
  const red = color.red.toString(16).padStart(2, "0");
  const green = color.green.toString(16).padStart(2, "0");
  const blue = color.blue.toString(16).padStart(2, "0");
  return `#${red}${green}${blue}`;
};

const parseFloat = (s: string): number => {
  if (!s || /[beox+-]/.test(s)) {
    return Number.NaN;
  } else {
    return Number(s);
  }
};

export const MAX_AMOUNT = 30000;
export const MAX_BET_SIZES = 30;

/** 벳 사이즈 입력 오류의 종류 — 화면 문구는 bet-error-labels.ts가 언어별로 만든다(`s`는 영어 원문 그대로). */
export type BetErrorCode =
  | "tooMany"
  | "empty"
  | "multNotAllowed"
  | "multInvalid"
  | "multLe1"
  | "addInvalid"
  | "addNotInt"
  | "addTooLarge"
  | "capNotAllowed"
  | "capNotPosInt"
  | "capTooLarge"
  | "geoInvalid"
  | "geoNotPosInt"
  | "geoTooLarge"
  | "betInvalid";

export type BetSanitized = {
  s: string;
  valid: boolean;
  error?: { code: BetErrorCode; input: string };
};

const BET_ERROR_EN: Record<BetErrorCode, string> = {
  tooMany: "Too many bet sizes",
  empty: "Found empty string",
  multNotAllowed: "Multiplicative size is not allowed",
  multInvalid: "Invalid multiplicative size",
  multLe1: "Multiplier must be greater than 1",
  addInvalid: "Invalid additive size",
  addNotInt: "Addition size must be an integer",
  addTooLarge: "Addition size too large",
  capNotAllowed: "Addition with raise cap is not allowed",
  capNotPosInt: "Raise cap must be a positive integer",
  capTooLarge: "Raise cap too large",
  geoInvalid: "Invalid geometric size",
  geoNotPosInt: "Geometric size must be a positive integer",
  geoTooLarge: "Geometric size too large",
  betInvalid: "Invalid bet size",
};

const betFail = (code: BetErrorCode, input: string): BetSanitized => ({
  s: input === "" ? BET_ERROR_EN[code] : `${BET_ERROR_EN[code]}: ${input}`,
  valid: false,
  error: { code, input },
});

export const sanitizeBetString = (
  s: string,
  is_raise: boolean
): BetSanitized => {
  const trimmed = s.trim();
  if (trimmed === "") return { s: "", valid: true };

  const split = trimmed.split(",").flatMap((s) => s.trim().split(" "));
  const elements = split.map((s) => s.toLowerCase());

  if (elements[elements.length - 1] === "") {
    elements.pop();
  }

  if (elements.length > MAX_BET_SIZES) {
    return betFail("tooMany", "");
  }

  let sanitized = "";

  for (const e of elements) {
    if (sanitized !== "") {
      sanitized += ", ";
    }
    if (e === "") {
      return betFail("empty", "");
    } else if (e.endsWith("x")) {
      // Previous bet relative
      if (!is_raise) {
        return betFail("multNotAllowed", e);
      } else {
        const float = parseFloat(e.slice(0, -1));
        if (Number.isNaN(float)) {
          return betFail("multInvalid", e);
        } else if (float <= 1.0) {
          return betFail("multLe1", e);
        } else {
          sanitized += `${float}x`;
        }
      }
    } else if (e.includes("c")) {
      // Additive
      const split = e.split("c");
      if (split.length !== 2) {
        return betFail("addInvalid", e);
      }
      const float1 = parseFloat(split[0]);
      if (Number.isNaN(float1)) {
        return betFail("addInvalid", e);
      } else if (float1 % 1 !== 0) {
        return betFail("addNotInt", e);
      } else if (float1 > MAX_AMOUNT) {
        return betFail("addTooLarge", e);
      }
      if (split[1] === "") {
        sanitized += `${float1}c`;
      } else {
        if (!split[1].endsWith("r")) {
          return betFail("addInvalid", e);
        }
        if (!is_raise) {
          return betFail("capNotAllowed", e);
        }
        const float2 = parseFloat(split[1].slice(0, -1));
        if (Number.isNaN(float2)) {
          return betFail("addInvalid", e);
        } else if (float2 % 1 !== 0 || float2 === 0) {
          return betFail("capNotPosInt", e);
        } else if (float2 > 100) {
          return betFail("capTooLarge", e);
        }
        sanitized += `${float1}c${float2}r`;
      }
    } else if (e.includes("e")) {
      // Geometric
      const split = e.split("e");
      if (split.length !== 2) {
        return betFail("geoInvalid", e);
      }
      const float1 = split[0] === "" ? null : parseFloat(split[0]);
      const float2 = split[1] === "" ? null : parseFloat(split[1]);
      if (float1 !== null) {
        if (Number.isNaN(float1)) {
          return betFail("geoInvalid", e);
        } else if (float1 % 1 !== 0 || float1 === 0) {
          return betFail("geoNotPosInt", e);
        } else if (float1 > 100) {
          return betFail("geoTooLarge", e);
        }
      }
      if (float2 !== null && Number.isNaN(float2)) {
        return betFail("geoInvalid", e);
      }
      sanitized += `${float1 ?? ""}e${float2 ?? ""}`;
    } else if (e === "a") {
      // All-in
      sanitized += "a";
    } else {
      // Pot relative
      const float = parseFloat(e);
      if (Number.isNaN(float)) {
        return betFail("betInvalid", e);
      }
      sanitized += `${float}`;
    }
  }

  return { s: sanitized, valid: true };
};

export const convertBetString = (s: string): string => {
  if (s === "") return s;
  return s
    .split(",")
    .map((e) => e.trim())
    .map((e) => ("acerx".includes(e[e.length - 1]) ? e : e + "%"))
    .join(",");
};

const parseBetAmount = (s: string, index: number) => {
  let indexEnd = index;
  while (indexEnd < s.length && /\d/.test(s[indexEnd])) indexEnd++;
  const amount = Number(s.slice(index, indexEnd));
  return { amount, indexEnd };
};

export const ROOT_LINE_STRING = "(Root)";
export const INVALID_LINE_STRING = "Invalid line string";

export const readableLineString = (s: string): string => {
  if (s === ROOT_LINE_STRING) return s;

  let ret = "";
  let index = 0;
  let isSeparatorExpected = false;

  while (index < s.length) {
    let isOk = false;

    switch (s[index]) {
      case "-":
      case "|": {
        ret += s[index] === "-" ? " - " : ", ";
        index += 1;
        isOk = isSeparatorExpected;
        break;
      }
      case "F":
      case "X":
      case "C": {
        ret += { F: "Fold", X: "Check", C: "Call" }[s[index]];
        index += 1;
        isOk = !isSeparatorExpected;
        break;
      }
      case "B":
      case "R":
      case "A": {
        const { amount, indexEnd } = parseBetAmount(s, index + 1);
        ret += { B: "Bet", R: "Raise", A: "All-in" }[s[index]] + ` ${amount}`;
        index = indexEnd;
        isOk = !isSeparatorExpected && amount > 0;
        break;
      }
    }

    if (!isOk) {
      return INVALID_LINE_STRING;
    }

    isSeparatorExpected = !isSeparatorExpected;
  }

  if (!isSeparatorExpected) {
    return INVALID_LINE_STRING;
  }

  return ret;
};
