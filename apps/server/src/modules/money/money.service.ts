import { and, eq, max, sum } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { HTTPException } from "hono/http-exception";

import { createDatabase } from "../../db/client";
import {
  dailyEntries,
  dailyOnlineReceipts,
  receiptEvents,
  supplierPayments
} from "../../db/schema";

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

type SqliteBatch = [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]];

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
  const adjustments = receiptAdjustments(previous, input);
  const now = new Date().toISOString();
  const db = createDatabase(database);
  const statements: SqliteBatch = [
    db
      .insert(dailyEntries)
      .values({
        userId,
        date: input.date,
        cashPaisa: input.cashPaisa,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: [dailyEntries.userId, dailyEntries.date],
        set: { cashPaisa: input.cashPaisa, updatedAt: now }
      }),
    db
      .delete(dailyOnlineReceipts)
      .where(
        and(
          eq(dailyOnlineReceipts.userId, userId),
          eq(dailyOnlineReceipts.date, input.date)
        )
      ),
    db
      .delete(supplierPayments)
      .where(
        and(eq(supplierPayments.userId, userId), eq(supplierPayments.date, input.date))
      )
  ];

  if (input.onlineReceipts.length > 0) {
    statements.push(
      db.insert(dailyOnlineReceipts).values(
        input.onlineReceipts.map((receipt) => ({
          userId,
          date: input.date,
          channelId: receipt.channelId,
          amountPaisa: receipt.amountPaisa
        }))
      )
    );
  }

  if (input.supplierPayments.length > 0) {
    statements.push(
      db.insert(supplierPayments).values(
        input.supplierPayments.map((payment, position) => ({
          userId,
          date: input.date,
          payee: payment.payee.trim(),
          amountPaisa: payment.amountPaisa,
          note: payment.note?.trim() || null,
          position
        }))
      )
    );
  }

  if (adjustments.length > 0) {
    statements.push(
      db.insert(receiptEvents).values(
        adjustments.map((adjustment) => ({
          userId,
          date: input.date,
          channelId: adjustment.channelId,
          kind: "adjustment" as const,
          amountPaisa: adjustment.amountPaisa,
          balancePaisa: adjustment.balancePaisa,
          recordedAt: now
        }))
      )
    );
  }

  await db.batch(statements);
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
  const db = createDatabase(database);
  const upsertDay = db
    .insert(dailyEntries)
    .values({ userId, date: input.date, cashPaisa: 0, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [dailyEntries.userId, dailyEntries.date],
      set: { updatedAt: now }
    });
  const setBalance =
    input.channelId === null
      ? db
          .update(dailyEntries)
          .set({ cashPaisa: balance, updatedAt: now })
          .where(and(eq(dailyEntries.userId, userId), eq(dailyEntries.date, input.date)))
      : db
          .insert(dailyOnlineReceipts)
          .values({
            userId,
            date: input.date,
            channelId: input.channelId,
            amountPaisa: balance
          })
          .onConflictDoUpdate({
            target: [
              dailyOnlineReceipts.userId,
              dailyOnlineReceipts.date,
              dailyOnlineReceipts.channelId
            ],
            set: { amountPaisa: balance }
          });
  const event = db.insert(receiptEvents).values({
    userId,
    date: input.date,
    channelId: input.channelId,
    kind: "payment",
    amountPaisa: input.amountPaisa,
    balancePaisa: balance,
    recordedAt: now,
    name
  });

  await db.batch([upsertDay, setBalance, event]);
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

  const db = createDatabase(database);
  const [current] = await db
    .select({
      amountPaisa: sum(supplierPayments.amountPaisa).mapWith(Number),
      lastPosition: max(supplierPayments.position)
    })
    .from(supplierPayments)
    .where(and(eq(supplierPayments.userId, userId), eq(supplierPayments.date, input.date)));
  validateAmount((current?.amountPaisa ?? 0) + input.amountPaisa);

  const now = new Date().toISOString();
  const upsertDay = db
    .insert(dailyEntries)
    .values({ userId, date: input.date, cashPaisa: 0, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [dailyEntries.userId, dailyEntries.date],
      set: { updatedAt: now }
    });
  const insertPayment = db.insert(supplierPayments).values({
    userId,
    date: input.date,
    payee,
    amountPaisa: input.amountPaisa,
    note: input.note?.trim() || null,
    position: (current?.lastPosition ?? -1) + 1
  });

  await db.batch([upsertDay, insertPayment]);
}
