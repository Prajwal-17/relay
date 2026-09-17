import { and, desc, eq, isNull, lt } from "drizzle-orm";
import type { SQLiteDatabase } from "expo-sqlite";
import { dailyEntries, dailyOnlineReceipts, receiptEvents } from "@/lib/db/schema";
import { createMoneyOrm } from "@/lib/db/orm";
import type { LocalDate, ReceiptEvent, ReceiptEventInput } from "../money.types";
import type { MoneyDatabase } from "@/types/database.types";

export async function insertReceiptEvent(
  db: MoneyDatabase,
  event: ReceiptEventInput
): Promise<void> {
  await db.insert(receiptEvents).values(event).run();
}

export async function getMethodBalance(
  db: MoneyDatabase,
  date: LocalDate,
  channelId: number | null
): Promise<number> {
  const row =
    channelId === null
      ? await db
          .select({ amount: dailyEntries.cashPaisa })
          .from(dailyEntries)
          .where(eq(dailyEntries.date, date))
          .get()
      : await db
          .select({ amount: dailyOnlineReceipts.amountPaisa })
          .from(dailyOnlineReceipts)
          .where(
            and(eq(dailyOnlineReceipts.date, date), eq(dailyOnlineReceipts.channelId, channelId))
          )
          .get();
  return row?.amount ?? 0;
}

export async function setMethodBalance(
  db: MoneyDatabase,
  date: LocalDate,
  channelId: number | null,
  amountPaisa: number
): Promise<void> {
  if (channelId === null)
    await db
      .update(dailyEntries)
      .set({ cashPaisa: amountPaisa })
      .where(eq(dailyEntries.date, date))
      .run();
  else
    await db
      .insert(dailyOnlineReceipts)
      .values({ date, channelId, amountPaisa })
      .onConflictDoUpdate({
        target: [dailyOnlineReceipts.date, dailyOnlineReceipts.channelId],
        set: { amountPaisa }
      })
      .run();
}

export async function listReceiptEvents(
  client: SQLiteDatabase,
  date: LocalDate,
  channelId: number | null,
  beforeId = Number.MAX_SAFE_INTEGER
): Promise<ReceiptEvent[]> {
  return createMoneyOrm(client)
    .select()
    .from(receiptEvents)
    .where(
      and(
        eq(receiptEvents.date, date),
        lt(receiptEvents.id, beforeId),
        channelId === null
          ? isNull(receiptEvents.channelId)
          : eq(receiptEvents.channelId, channelId)
      )
    )
    .orderBy(desc(receiptEvents.id))
    .limit(50)
    .all();
}
