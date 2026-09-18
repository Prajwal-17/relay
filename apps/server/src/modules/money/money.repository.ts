import { and, asc, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

import { createDatabase } from "../../db/client";
import {
  dailyEntries,
  dailyOnlineReceipts,
  onlineChannels,
  receiptEvents,
  supplierPayments
} from "../../db/schema";
import type { DailyEntry, DaySummary, LocalDate, OnlineChannel, ReceiptEvent } from "./money.types";

const PRESET_CHANNELS = ["Paytm", "PhonePe", "Google Pay", "Other"] as const;

function nowIso(): string {
  return new Date().toISOString();
}

function isUniqueError(error: unknown): boolean {
  return String(error instanceof Error && error.cause ? error.cause : error)
    .toLowerCase()
    .includes("unique");
}

export async function ensureDefaultChannels(database: D1Database, userId: string): Promise<void> {
  const now = nowIso();
  await database.batch(
    PRESET_CHANNELS.map((name) =>
      database
        .prepare(
          `INSERT OR IGNORE INTO online_channels
             (user_id, name, is_preset, is_archived, created_at, updated_at)
           VALUES (?, ?, 1, 0, ?, ?)`
        )
        .bind(userId, name, now, now)
    )
  );
}

export async function getDailyEntry(
  database: D1Database,
  userId: string,
  date: LocalDate
): Promise<DailyEntry | null> {
  const db = createDatabase(database);
  const [entry] = await db
    .select({
      date: dailyEntries.date,
      cashPaisa: dailyEntries.cashPaisa,
      createdAt: dailyEntries.createdAt,
      updatedAt: dailyEntries.updatedAt
    })
    .from(dailyEntries)
    .where(and(eq(dailyEntries.userId, userId), eq(dailyEntries.date, date)))
    .limit(1);

  if (!entry) return null;

  const [onlineReceipts, payments] = await Promise.all([
    db
      .select({
        channelId: onlineChannels.id,
        channelName: onlineChannels.name,
        amountPaisa: dailyOnlineReceipts.amountPaisa,
        isChannelArchived: onlineChannels.isArchived
      })
      .from(dailyOnlineReceipts)
      .innerJoin(
        onlineChannels,
        and(
          eq(onlineChannels.userId, dailyOnlineReceipts.userId),
          eq(onlineChannels.id, dailyOnlineReceipts.channelId)
        )
      )
      .where(and(eq(dailyOnlineReceipts.userId, userId), eq(dailyOnlineReceipts.date, date)))
      .orderBy(desc(onlineChannels.isPreset), onlineChannels.id),
    db
      .select({
        id: supplierPayments.id,
        payee: supplierPayments.payee,
        amountPaisa: supplierPayments.amountPaisa,
        note: supplierPayments.note,
        position: supplierPayments.position
      })
      .from(supplierPayments)
      .where(and(eq(supplierPayments.userId, userId), eq(supplierPayments.date, date)))
      .orderBy(supplierPayments.position, supplierPayments.id)
  ]);

  return { ...entry, onlineReceipts, supplierPayments: payments };
}

type MonthRow = {
  date: string;
  cashPaisa: number;
  onlinePaisa: number;
  paidPaisa: number;
};

export async function listMonthSummaries(
  database: D1Database,
  userId: string,
  year: number,
  month: number
): Promise<DaySummary[]> {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextDate = new Date(Date.UTC(year, month, 1));
  const end = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const result = await database
    .prepare(
      `SELECT d.entry_date AS date,
              d.cash_paisa AS cashPaisa,
              COALESCE((
                SELECT SUM(r.amount_paisa)
                FROM daily_online_receipts r
                WHERE r.user_id = d.user_id AND r.entry_date = d.entry_date
              ), 0) AS onlinePaisa,
              COALESCE((
                SELECT SUM(p.amount_paisa)
                FROM supplier_payments p
                WHERE p.user_id = d.user_id AND p.entry_date = d.entry_date
              ), 0) AS paidPaisa
       FROM daily_entries d
       WHERE d.user_id = ? AND d.entry_date >= ? AND d.entry_date < ?
       ORDER BY d.entry_date ASC`
    )
    .bind(userId, start, end)
    .all<MonthRow>();

  return result.results.map((row) => {
    const cashPaisa = Number(row.cashPaisa);
    const onlinePaisa = Number(row.onlinePaisa);
    const paidPaisa = Number(row.paidPaisa);
    const receivedPaisa = cashPaisa + onlinePaisa;
    return {
      date: row.date,
      cashPaisa,
      onlinePaisa,
      receivedPaisa,
      paidPaisa,
      netPaisa: receivedPaisa - paidPaisa
    };
  });
}

export async function listOnlineChannels(
  database: D1Database,
  userId: string,
  includeArchived = false
): Promise<OnlineChannel[]> {
  await ensureDefaultChannels(database, userId);
  const db = createDatabase(database);
  return db
    .select({
      id: onlineChannels.id,
      name: onlineChannels.name,
      isPreset: onlineChannels.isPreset,
      isArchived: onlineChannels.isArchived
    })
    .from(onlineChannels)
    .where(
      and(
        eq(onlineChannels.userId, userId),
        includeArchived ? undefined : eq(onlineChannels.isArchived, false)
      )
    )
    .orderBy(
      desc(onlineChannels.isPreset),
      sql`CASE WHEN ${onlineChannels.isPreset} THEN ${onlineChannels.id} END`,
      sql`${onlineChannels.name} COLLATE NOCASE`
    );
}

export async function getOnlineChannelsById(
  database: D1Database,
  userId: string,
  ids: number[]
): Promise<OnlineChannel[]> {
  if (!ids.length) return [];
  const db = createDatabase(database);
  return db
    .select({
      id: onlineChannels.id,
      name: onlineChannels.name,
      isPreset: onlineChannels.isPreset,
      isArchived: onlineChannels.isArchived
    })
    .from(onlineChannels)
    .where(and(eq(onlineChannels.userId, userId), inArray(onlineChannels.id, ids)));
}

export async function createOnlineChannel(
  database: D1Database,
  userId: string,
  name: string
): Promise<OnlineChannel> {
  const db = createDatabase(database);
  const now = nowIso();
  try {
    const [created] = await db
      .insert(onlineChannels)
      .values({ userId, name, createdAt: now, updatedAt: now })
      .returning({
        id: onlineChannels.id,
        name: onlineChannels.name,
        isPreset: onlineChannels.isPreset,
        isArchived: onlineChannels.isArchived
      });
    if (!created) throw new Error("Channel was not created.");
    return created;
  } catch (error) {
    if (isUniqueError(error)) {
      throw new HTTPException(409, { message: "A provider with this name already exists." });
    }
    throw error;
  }
}

export async function updateOnlineChannel(
  database: D1Database,
  userId: string,
  id: number,
  patch: { name?: string; isArchived?: boolean }
): Promise<OnlineChannel> {
  const db = createDatabase(database);
  try {
    const [updated] = await db
      .update(onlineChannels)
      .set({ ...patch, updatedAt: nowIso() })
      .where(
        and(
          eq(onlineChannels.userId, userId),
          eq(onlineChannels.id, id),
          eq(onlineChannels.isPreset, false)
        )
      )
      .returning({
        id: onlineChannels.id,
        name: onlineChannels.name,
        isPreset: onlineChannels.isPreset,
        isArchived: onlineChannels.isArchived
      });
    if (!updated) {
      throw new HTTPException(404, { message: "Custom payment provider not found." });
    }
    return updated;
  } catch (error) {
    if (isUniqueError(error)) {
      throw new HTTPException(409, { message: "A provider with this name already exists." });
    }
    throw error;
  }
}

export async function listReceiptEvents(
  database: D1Database,
  userId: string,
  date: LocalDate,
  channelId: number | null,
  beforeId: number
): Promise<ReceiptEvent[]> {
  const db = createDatabase(database);
  return db
    .select({
      id: receiptEvents.id,
      kind: receiptEvents.kind,
      amountPaisa: receiptEvents.amountPaisa,
      balancePaisa: receiptEvents.balancePaisa,
      recordedAt: receiptEvents.recordedAt,
      name: receiptEvents.name
    })
    .from(receiptEvents)
    .where(
      and(
        eq(receiptEvents.userId, userId),
        eq(receiptEvents.date, date),
        lt(receiptEvents.id, beforeId),
        channelId === null
          ? isNull(receiptEvents.channelId)
          : eq(receiptEvents.channelId, channelId)
      )
    )
    .orderBy(desc(receiptEvents.id))
    .limit(50);
}

export async function listRecentVendorNames(
  database: D1Database,
  userId: string,
  search: string
): Promise<string[]> {
  const result = await database
    .prepare(
      `SELECT trim(payee) AS name
       FROM supplier_payments
       WHERE user_id = ?
         AND trim(payee) <> ''
         AND instr(lower(trim(payee)), lower(?)) > 0
       GROUP BY trim(payee) COLLATE NOCASE
       ORDER BY MAX(id) DESC
       LIMIT 6`
    )
    .bind(userId, search.trim())
    .all<{ name: string }>();
  return result.results.map((row) => row.name);
}

export async function deleteDailyEntry(
  database: D1Database,
  userId: string,
  date: LocalDate
): Promise<void> {
  await createDatabase(database)
    .delete(dailyEntries)
    .where(and(eq(dailyEntries.userId, userId), eq(dailyEntries.date, date)));
}

export async function getMethodBalance(
  database: D1Database,
  userId: string,
  date: LocalDate,
  channelId: number | null
): Promise<number> {
  const result =
    channelId === null
      ? await database
          .prepare(
            `SELECT cash_paisa AS amount
             FROM daily_entries WHERE user_id = ? AND entry_date = ?`
          )
          .bind(userId, date)
          .first<{ amount: number }>()
      : await database
          .prepare(
            `SELECT amount_paisa AS amount
             FROM daily_online_receipts
             WHERE user_id = ? AND entry_date = ? AND channel_id = ?`
          )
          .bind(userId, date, channelId)
          .first<{ amount: number }>();
  return Number(result?.amount ?? 0);
}
