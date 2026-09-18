import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  max,
  ne,
  sql
} from "drizzle-orm";
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
  const db = createDatabase(database);
  const now = nowIso();
  await db
    .insert(onlineChannels)
    .values(
      PRESET_CHANNELS.map((name) => ({
        userId,
        name,
        isPreset: true,
        createdAt: now,
        updatedAt: now
      }))
    )
    .onConflictDoNothing();
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

export async function listMonthSummaries(
  database: D1Database,
  userId: string,
  year: number,
  month: number
): Promise<DaySummary[]> {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextDate = new Date(Date.UTC(year, month, 1));
  const end = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const db = createDatabase(database);

  const onlineTotals = db
    .select({
      userId: dailyOnlineReceipts.userId,
      date: dailyOnlineReceipts.date,
      amountPaisa: sql<number>`coalesce(sum(${dailyOnlineReceipts.amountPaisa}), 0)`
        .mapWith(Number)
        .as("online_paisa")
    })
    .from(dailyOnlineReceipts)
    .groupBy(dailyOnlineReceipts.userId, dailyOnlineReceipts.date)
    .as("online_totals");

  const paymentTotals = db
    .select({
      userId: supplierPayments.userId,
      date: supplierPayments.date,
      amountPaisa: sql<number>`coalesce(sum(${supplierPayments.amountPaisa}), 0)`
        .mapWith(Number)
        .as("paid_paisa")
    })
    .from(supplierPayments)
    .groupBy(supplierPayments.userId, supplierPayments.date)
    .as("payment_totals");

  const rows = await db
    .select({
      date: dailyEntries.date,
      cashPaisa: dailyEntries.cashPaisa,
      onlinePaisa: sql<number>`coalesce(${onlineTotals.amountPaisa}, 0)`.mapWith(Number),
      paidPaisa: sql<number>`coalesce(${paymentTotals.amountPaisa}, 0)`.mapWith(Number)
    })
    .from(dailyEntries)
    .leftJoin(
      onlineTotals,
      and(
        eq(onlineTotals.userId, dailyEntries.userId),
        eq(onlineTotals.date, dailyEntries.date)
      )
    )
    .leftJoin(
      paymentTotals,
      and(
        eq(paymentTotals.userId, dailyEntries.userId),
        eq(paymentTotals.date, dailyEntries.date)
      )
    )
    .where(
      and(
        eq(dailyEntries.userId, userId),
        gte(dailyEntries.date, start),
        lt(dailyEntries.date, end)
      )
    )
    .orderBy(asc(dailyEntries.date));

  return rows.map((row) => {
    const receivedPaisa = row.cashPaisa + row.onlinePaisa;
    return {
      ...row,
      receivedPaisa,
      netPaisa: receivedPaisa - row.paidPaisa
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
  const db = createDatabase(database);
  const normalizedName = sql<string>`trim(${supplierPayments.payee})`;
  const rows = await db
    .select({ name: normalizedName })
    .from(supplierPayments)
    .where(
      and(
        eq(supplierPayments.userId, userId),
        ne(normalizedName, ""),
        sql`instr(lower(${normalizedName}), lower(${search.trim()})) > 0`
      )
    )
    .groupBy(sql`${normalizedName} COLLATE NOCASE`)
    .orderBy(desc(max(supplierPayments.id)))
    .limit(6);

  return rows.map((row) => row.name);
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
  const db = createDatabase(database);
  const [result] =
    channelId === null
      ? await db
          .select({ amount: dailyEntries.cashPaisa })
          .from(dailyEntries)
          .where(and(eq(dailyEntries.userId, userId), eq(dailyEntries.date, date)))
          .limit(1)
      : await db
          .select({ amount: dailyOnlineReceipts.amountPaisa })
          .from(dailyOnlineReceipts)
          .where(
            and(
              eq(dailyOnlineReceipts.userId, userId),
              eq(dailyOnlineReceipts.date, date),
              eq(dailyOnlineReceipts.channelId, channelId)
            )
          )
          .limit(1);

  return result?.amount ?? 0;
}
