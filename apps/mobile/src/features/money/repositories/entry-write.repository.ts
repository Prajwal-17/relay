import { eq } from "drizzle-orm";
import {
  dailyEntries,
  dailyOnlineReceipts,
  supplierPayments
} from "@/lib/db/schema";
import type { MoneyDatabase } from "@/types/database.types";
import type { DailyEntryInput, LocalDate } from "../money.types";

export async function upsertDay(
  db: MoneyDatabase,
  date: LocalDate,
  now: string,
  cashPaisa?: number
): Promise<void> {
  await db
    .insert(dailyEntries)
    .values({ date, cashPaisa: cashPaisa ?? 0, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: dailyEntries.date,
      set: { updatedAt: now, ...(cashPaisa === undefined ? {} : { cashPaisa }) }
    })
    .run();
}

export async function replaceDayBreakdown(
  db: MoneyDatabase,
  input: DailyEntryInput
): Promise<void> {
  await db.delete(dailyOnlineReceipts).where(eq(dailyOnlineReceipts.date, input.date)).run();
  await db.delete(supplierPayments).where(eq(supplierPayments.date, input.date)).run();
  for (const receipt of input.onlineReceipts) {
    await db
      .insert(dailyOnlineReceipts)
      .values({ date: input.date, ...receipt })
      .run();
  }
  for (const [position, payment] of input.supplierPayments.entries()) {
    await db
      .insert(supplierPayments)
      .values({ ...payment, date: input.date, position, note: payment.note?.trim() || null })
      .run();
  }
}
