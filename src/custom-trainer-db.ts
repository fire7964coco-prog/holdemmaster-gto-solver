import Dexie, { Table } from "dexie";
import type { CustomTrainerAttempt, CustomTrainerBank } from "./custom-trainer";
import { isCustomTrainerBank, restoreCustomTrainerQuestion } from "./custom-trainer";
import { evaluateTrainerAction } from "./trainer";

export const CUSTOM_TRAINER_BANK_LIMIT = 20;
export const CUSTOM_TRAINER_ATTEMPT_LIMIT = 500;

// Separate database and accessors keep these local snapshots out of preset
// stats, account synchronization, daily questions and leaderboard uploads.
class CustomTrainerDB extends Dexie {
  public customTrainerBanks!: Table<CustomTrainerBank, string>;
  public customTrainerAttempts!: Table<CustomTrainerAttempt, number>;

  constructor() {
    super("GTOZeroCustomTrainerDB");
    this.version(1).stores({
      customTrainerBanks: "id, createdAt",
      customTrainerAttempts: "++id, presetId, timestamp, category, &clientId",
    });
  }
}

const db = new CustomTrainerDB();
const snapshot = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export async function listCustomTrainerBanks() {
  return (await db.customTrainerBanks.orderBy("createdAt").reverse().toArray())
    .filter(isCustomTrainerBank);
}

export async function saveCustomTrainerBank(bank: CustomTrainerBank) {
  const saved = snapshot(bank);
  if (!isCustomTrainerBank(saved)) {
    throw new Error("CUSTOM_TRAINER_INVALID_BANK");
  }
  await db.transaction("rw", db.customTrainerBanks, db.customTrainerAttempts, async () => {
    // A recalculation may change EV despite identical tree/lock identity.
    // Remove older answers with the overwritten snapshot, keeping review honest.
    await db.customTrainerAttempts.where("presetId").equals(saved.id).delete();
    await db.customTrainerBanks.put(saved);
    const excess = await db.customTrainerBanks.orderBy("createdAt").reverse()
      .offset(CUSTOM_TRAINER_BANK_LIMIT).primaryKeys();
    if (excess.length) {
      await db.customTrainerBanks.bulkDelete(excess);
      await db.customTrainerAttempts.where("presetId").anyOf(excess).delete();
    }
  });
}

export async function deleteCustomTrainerBank(bankId: string) {
  await db.transaction("rw", db.customTrainerBanks, db.customTrainerAttempts, async () => {
    await db.customTrainerAttempts.where("presetId").equals(bankId).delete();
    await db.customTrainerBanks.delete(bankId);
  });
}

export async function getCustomTrainerAttempts(bankId?: string) {
  const attempts = bankId
    ? await db.customTrainerAttempts.where("presetId").equals(bankId).toArray()
    : await db.customTrainerAttempts.toArray();
  return attempts.filter(validAttempt)
    .sort((a, b) => b.timestamp - a.timestamp || (b.id ?? 0) - (a.id ?? 0));
}

function validAttempt(attempt: CustomTrainerAttempt): boolean {
  return attempt?.category === "custom" && typeof attempt.presetId === "string" &&
    /^custom:[a-f0-9]{12}$/.test(attempt.presetId) &&
    typeof attempt.questionId === "string" && attempt.questionId.startsWith(`${attempt.presetId}:`) &&
    typeof attempt.clientId === "string" && !!attempt.clientId &&
    Number.isFinite(attempt.timestamp) && Number.isFinite(attempt.bankCreatedAt) &&
    Number.isInteger(attempt.handPair) && Number.isInteger(attempt.selectedAction) &&
    attempt.selectedAction >= 0 && Number.isInteger(attempt.bestAction) && attempt.bestAction >= 0 &&
    Number.isFinite(attempt.evLossBb) && attempt.evLossBb >= 0;
}

export async function addCustomTrainerAttempt(attempt: CustomTrainerAttempt) {
  const saved = snapshot(attempt);
  if (!validAttempt(saved)) {
    throw new Error("CUSTOM_TRAINER_INVALID_ATTEMPT");
  }
  return db.transaction("rw", db.customTrainerBanks, db.customTrainerAttempts, async () => {
    const bank = await db.customTrainerBanks.get(saved.presetId);
    if (!bank || bank.createdAt !== saved.bankCreatedAt) {
      throw new Error("CUSTOM_TRAINER_SNAPSHOT_REPLACED");
    }
    const question = restoreCustomTrainerQuestion(bank, saved);
    if (!question || saved.selectedAction >= question.node.selectedSpot.actions.length) {
      throw new Error("CUSTOM_TRAINER_INVALID_ATTEMPT");
    }
    const evaluation = evaluateTrainerAction(question, saved.selectedAction);
    if (saved.bestAction !== evaluation.bestAction || saved.evLossBb !== evaluation.evLossBb) {
      throw new Error("CUSTOM_TRAINER_INVALID_ATTEMPT");
    }
    const id = await db.customTrainerAttempts.add(saved);
    const attempts = await db.customTrainerAttempts.where("presetId").equals(saved.presetId).toArray();
    const excess = attempts.sort((a, b) =>
      b.timestamp - a.timestamp || (b.id ?? 0) - (a.id ?? 0))
      .slice(CUSTOM_TRAINER_ATTEMPT_LIMIT).map(item => item.id!);
    if (excess.length) await db.customTrainerAttempts.bulkDelete(excess);
    return id;
  });
}
