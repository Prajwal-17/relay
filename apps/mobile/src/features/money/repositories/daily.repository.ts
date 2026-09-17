import { and, asc, desc, eq, gte, lt, sql, sum } from "drizzle-orm";
import type { SQLiteDatabase } from "expo-sqlite";
import {
  dailyEntries,
  dailyOnlineReceipts,
  onlineChannels,
  supplierPayments
} from "@/lib/db/schema";
import { createMoneyOrm } from "@/lib/db/orm";
import { monthKey, shiftMonth, type LedgerMonth } from "@/lib/format/dates";
import type { DailyEntry, DaySummary, LocalDate } from "../money.types";
import type { MoneyDatabase } from "@/types/database.types";

export async function readDailyEntry(
  db: MoneyDatabase,
  date: LocalDate
): Promise<DailyEntry | null> {
  const entry = await db.select().from(dailyEntries).where(eq(dailyEntries.date, date)).get();
  if (!entry) return null;
  const receipts = await db
    .select({
      channelId: onlineChannels.id,
      channelName: onlineChannels.name,
      amountPaisa: dailyOnlineReceipts.amountPaisa,
      isChannelArchived: onlineChannels.isArchived
    })
    .from(dailyOnlineReceipts)
    .innerJoin(onlineChannels, eq(onlineChannels.id, dailyOnlineReceipts.channelId))
    .where(eq(dailyOnlineReceipts.date, date))
    .orderBy(desc(onlineChannels.isPreset), onlineChannels.id)
    .all();
  const payments = await db
    .select()
    .from(supplierPayments)
    .where(eq(supplierPayments.date, date))
    .orderBy(supplierPayments.position, supplierPayments.id)
    .all();
  return { ...entry, onlineReceipts: receipts, supplierPayments: payments };
}

export async function getDailyEntry(
  client: SQLiteDatabase,
  date: LocalDate
): Promise<DailyEntry | null> {
  return readDailyEntry(createMoneyOrm(client), date);
}

export async function listMonthSummaries(
  client: SQLiteDatabase,
  month: LedgerMonth
): Promise<DaySummary[]> {
  const db = createMoneyOrm(client);
  const online = db
    .select({
      date: dailyOnlineReceipts.date,
      amount: sum(dailyOnlineReceipts.amountPaisa).mapWith(Number).as("online_amount")
    })
    .from(dailyOnlineReceipts)
    .groupBy(dailyOnlineReceipts.date)
    .as("online");
  const paid = db
    .select({
      date: supplierPayments.date,
      amount: sum(supplierPayments.amountPaisa).mapWith(Number).as("paid_amount")
    })
    .from(supplierPayments)
    .groupBy(supplierPayments.date)
    .as("paid");
  const rows = await db
    .select({
      date: dailyEntries.date,
      cashPaisa: dailyEntries.cashPaisa,
      online: online.amount,
      paid: paid.amount
    })
    .from(dailyEntries)
    .leftJoin(online, eq(online.date, dailyEntries.date))
    .leftJoin(paid, eq(paid.date, dailyEntries.date))
    .where(
      and(
        gte(dailyEntries.date, `${monthKey(month)}-01` as LocalDate),
        lt(dailyEntries.date, `${monthKey(shiftMonth(month, 1))}-01` as LocalDate)
      )
    )
    .orderBy(asc(dailyEntries.date))
    .all();
  return rows.map((row) => ({
    date: row.date,
    cashPaisa: row.cashPaisa,
    onlinePaisa: row.online ?? 0,
    receivedPaisa: row.cashPaisa + (row.online ?? 0),
    paidPaisa: row.paid ?? 0,
    netPaisa: row.cashPaisa + (row.online ?? 0) - (row.paid ?? 0)
  }));
}

export async function deleteDailyEntry(client: SQLiteDatabase, date: LocalDate): Promise<void> {
  await createMoneyOrm(client).delete(dailyEntries).where(eq(dailyEntries.date, date)).run();
}

export async function listRecentVendorNames(
  client: SQLiteDatabase,
  search: string
): Promise<string[]> {
  const name = sql<string>`trim(${supplierPayments.payee})`;
  return (
    await createMoneyOrm(client)
      .select({ name })
      .from(supplierPayments)
      .where(and(sql`${name} <> ''`, sql`instr(lower(${name}), lower(${search.trim()})) > 0`))
      .groupBy(sql`${name} COLLATE NOCASE`)
      .orderBy(desc(sql`max(${supplierPayments.id})`))
      .limit(6)
      .all()
  ).map((row) => row.name);
}
