import { HTTPException } from "hono/http-exception";

import { getDailyEntry, getMethodBalance, getOnlineChannelsById } from "./money.repository";
import type {
  DailyEntry,
  DailyEntryInput,
  LocalDate,
  ReceivedPaymentInput,
  VendorPaymentInput
} from "./money.types";

function todayInIndia(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function validateLedgerDate(date: LocalDate): void {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new HTTPException(400, { message: "Use a valid ledger date." });
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const valid =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
  if (!valid || date > todayInIndia()) {
    throw new HTTPException(400, { message: "Choose today or an earlier date." });
  }
}

function validateAmount(amount: number, positive = false): void {
  if (!Number.isSafeInteger(amount) || amount < (positive ? 1 : 0)) {
    throw new HTTPException(400, {
      message: positive
        ? "Enter an amount greater than zero, within the supported range."
        : "Amount is outside the supported range."
    });
  }
}

function safeTotal(values: number[]): number {
  const total = values.reduce((sum, value) => sum + value, 0);
  validateAmount(total);
  return total;
}

async function requireOwnedChannels(
  database: D1Database,
  userId: string,
  channelIds: number[]
): Promise<void> {
  const uniqueIds = [...new Set(channelIds)];
  const channels = await getOnlineChannelsById(database, userId, uniqueIds);
  if (channels.length !== uniqueIds.length) {
    throw new HTTPException(400, { message: "A payment provider is unavailable." });
  }
}

type ReceiptAdjustment = {
  channelId: number | null;
  amountPaisa: number;
  balancePaisa: number;
};

function receiptAdjustments(
  previous: DailyEntry | null,
  input: DailyEntryInput
): ReceiptAdjustment[] {
  const before = new Map<number | null, number>([
    [null, previous?.cashPaisa ?? 0],
    ...(previous?.onlineReceipts.map((receipt): [number, number] => [
      receipt.channelId,
      receipt.amountPaisa
    ]) ?? [])
  ]);
  const after = new Map<number | null, number>([
    [null, input.cashPaisa],
    ...input.onlineReceipts.map((receipt): [number, number] => [
      receipt.channelId,
      receipt.amountPaisa
    ])
  ]);

  const adjustments: ReceiptAdjustment[] = [];
  for (const channelId of new Set([...before.keys(), ...after.keys()])) {
    const balancePaisa = after.get(channelId) ?? 0;
    const amountPaisa = balancePaisa - (before.get(channelId) ?? 0);
    if (amountPaisa !== 0) adjustments.push({ channelId, amountPaisa, balancePaisa });
  }
  return adjustments;
}

export async function saveDailyEntry(
  database: D1Database,
  userId: string,
  input: DailyEntryInput
): Promise<void> {
  validateLedgerDate(input.date);
  validateAmount(input.cashPaisa);
  input.onlineReceipts.forEach((receipt) => validateAmount(receipt.amountPaisa, true));
  input.supplierPayments.forEach((payment) => validateAmount(payment.amountPaisa, true));
  const received = safeTotal([
    input.cashPaisa,
    ...input.onlineReceipts.map((receipt) => receipt.amountPaisa)
  ]);
  const paid = safeTotal(input.supplierPayments.map((payment) => payment.amountPaisa));
  if (received === 0 && paid === 0) {
    throw new HTTPException(400, { message: "Add at least one received or paid amount." });
  }

  await requireOwnedChannels(
    database,
    userId,
    input.onlineReceipts.map((receipt) => receipt.channelId)
  );
  const previous = await getDailyEntry(database, userId, input.date);
  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [
    database
      .prepare(
        `INSERT INTO daily_entries
           (user_id, entry_date, cash_paisa, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id, entry_date) DO UPDATE SET
           cash_paisa = excluded.cash_paisa,
           updated_at = excluded.updated_at`
      )
      .bind(userId, input.date, input.cashPaisa, now, now),
    database
      .prepare("DELETE FROM daily_online_receipts WHERE user_id = ? AND entry_date = ?")
      .bind(userId, input.date),
    database
      .prepare("DELETE FROM supplier_payments WHERE user_id = ? AND entry_date = ?")
      .bind(userId, input.date)
  ];

  for (const receipt of input.onlineReceipts) {
    statements.push(
      database
        .prepare(
          `INSERT INTO daily_online_receipts
             (user_id, entry_date, channel_id, amount_paisa)
           VALUES (?, ?, ?, ?)`
        )
        .bind(userId, input.date, receipt.channelId, receipt.amountPaisa)
    );
  }

  for (const [position, payment] of input.supplierPayments.entries()) {
    statements.push(
      database
        .prepare(
          `INSERT INTO supplier_payments
             (user_id, entry_date, payee, amount_paisa, note, position)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(
          userId,
          input.date,
          payment.payee.trim(),
          payment.amountPaisa,
          payment.note?.trim() || null,
          position
        )
    );
  }

  for (const adjustment of receiptAdjustments(previous, input)) {
    statements.push(
      database
        .prepare(
          `INSERT INTO receipt_events
             (user_id, entry_date, channel_id, kind, amount_paisa, balance_paisa, recorded_at)
           VALUES (?, ?, ?, 'adjustment', ?, ?, ?)`
        )
        .bind(
          userId,
          input.date,
          adjustment.channelId,
          adjustment.amountPaisa,
          adjustment.balancePaisa,
          now
        )
    );
  }

  await database.batch(statements);
}

export async function addReceivedPayment(
  database: D1Database,
  userId: string,
  input: ReceivedPaymentInput
): Promise<void> {
  validateLedgerDate(input.date);
  validateAmount(input.amountPaisa, true);
  const name = input.name?.trim() || null;

  if (input.channelId !== null) {
    const [channel] = await getOnlineChannelsById(database, userId, [input.channelId]);
    if (!channel || channel.isArchived) {
      throw new HTTPException(400, { message: "This payment provider is unavailable." });
    }
  }

  const current = await getMethodBalance(database, userId, input.date, input.channelId);
  const balance = current + input.amountPaisa;
  validateAmount(balance);
  const now = new Date().toISOString();
  const upsertDay = database
    .prepare(
      `INSERT INTO daily_entries
         (user_id, entry_date, cash_paisa, created_at, updated_at)
       VALUES (?, ?, 0, ?, ?)
       ON CONFLICT(user_id, entry_date) DO UPDATE SET updated_at = excluded.updated_at`
    )
    .bind(userId, input.date, now, now);
  const setBalance =
    input.channelId === null
      ? database
          .prepare(
            "UPDATE daily_entries SET cash_paisa = ?, updated_at = ? WHERE user_id = ? AND entry_date = ?"
          )
          .bind(balance, now, userId, input.date)
      : database
          .prepare(
            `INSERT INTO daily_online_receipts
               (user_id, entry_date, channel_id, amount_paisa)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(user_id, entry_date, channel_id) DO UPDATE SET
               amount_paisa = excluded.amount_paisa`
          )
          .bind(userId, input.date, input.channelId, balance);
  const event = database
    .prepare(
      `INSERT INTO receipt_events
         (user_id, entry_date, channel_id, kind, amount_paisa, balance_paisa, recorded_at, name)
       VALUES (?, ?, ?, 'payment', ?, ?, ?, ?)`
    )
    .bind(userId, input.date, input.channelId, input.amountPaisa, balance, now, name);

  await database.batch([upsertDay, setBalance, event]);
}

export async function addVendorPayment(
  database: D1Database,
  userId: string,
  input: VendorPaymentInput
): Promise<void> {
  validateLedgerDate(input.date);
  validateAmount(input.amountPaisa, true);
  const payee = input.payee.trim();
  if (!payee) throw new HTTPException(400, { message: "Enter a vendor name." });

  const current = await database
    .prepare(
      `SELECT COALESCE(SUM(amount_paisa), 0) AS amount
       FROM supplier_payments WHERE user_id = ? AND entry_date = ?`
    )
    .bind(userId, input.date)
    .first<{ amount: number }>();
  validateAmount(Number(current?.amount ?? 0) + input.amountPaisa);

  const now = new Date().toISOString();
  await database.batch([
    database
      .prepare(
        `INSERT INTO daily_entries
           (user_id, entry_date, cash_paisa, created_at, updated_at)
         VALUES (?, ?, 0, ?, ?)
         ON CONFLICT(user_id, entry_date) DO UPDATE SET updated_at = excluded.updated_at`
      )
      .bind(userId, input.date, now, now),
    database
      .prepare(
        `INSERT INTO supplier_payments
           (user_id, entry_date, payee, amount_paisa, note, position)
         VALUES (
           ?, ?, ?, ?, ?,
           COALESCE((
             SELECT MAX(position) + 1 FROM supplier_payments
             WHERE user_id = ? AND entry_date = ?
           ), 0)
         )`
      )
      .bind(
        userId,
        input.date,
        payee,
        input.amountPaisa,
        input.note?.trim() || null,
        userId,
        input.date
      )
  ]);
}
