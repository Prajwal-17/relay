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
  sql,
  sum
} from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

import { createDatabase } from "../../db/client";
import {
  dailyEntries,
  dailyPaymentTotals,
  paymentMethods,
  receivedEntries,
  vendorPayments
} from "../../db/schema";
import type { DailyEntry, DaySummary, LocalDate, PaymentMethod, ReceivedEntry } from "./money.types";
import { nowIso } from "./money.utils";

const PRESET_PAYMENT_METHODS = ["Paytm", "PhonePe", "Google Pay", "Other"] as const;

function isUniqueError(error: unknown): boolean {
  return String(error instanceof Error && error.cause ? error.cause : error)
    .toLowerCase()
    .includes("unique");
}

export async function ensureDefaultPaymentMethods(
  database: D1Database,
  userId: string
): Promise<void> {
  const db = createDatabase(database);
  const now = nowIso();
  await db
    .insert(paymentMethods)
    .values(
      PRESET_PAYMENT_METHODS.map((name) => ({
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
      cashAmount: dailyEntries.cashAmount,
      createdAt: dailyEntries.createdAt,
      updatedAt: dailyEntries.updatedAt
    })
    .from(dailyEntries)
    .where(and(eq(dailyEntries.userId, userId), eq(dailyEntries.date, date)))
    .limit(1);

  if (!entry) return null;

  const [paymentTotals, payments] = await Promise.all([
    db
      .select({
        paymentMethodId: paymentMethods.id,
        paymentMethodName: paymentMethods.name,
        amount: dailyPaymentTotals.amount,
        isPaymentMethodArchived: paymentMethods.isArchived
      })
      .from(dailyPaymentTotals)
      .innerJoin(paymentMethods, eq(paymentMethods.id, dailyPaymentTotals.paymentMethodId))
      .where(and(eq(dailyPaymentTotals.userId, userId), eq(dailyPaymentTotals.date, date)))
      .orderBy(desc(paymentMethods.isPreset), paymentMethods.id),
    db
      .select({
        id: vendorPayments.id,
        vendorName: vendorPayments.vendorName,
        amount: vendorPayments.amount,
        note: vendorPayments.note,
        createdAt: vendorPayments.createdAt
      })
      .from(vendorPayments)
      .where(and(eq(vendorPayments.userId, userId), eq(vendorPayments.date, date)))
      .orderBy(vendorPayments.id)
  ]);

  return { ...entry, paymentTotals, vendorPayments: payments };
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
      userId: dailyPaymentTotals.userId,
      date: dailyPaymentTotals.date,
      amount: sum(dailyPaymentTotals.amount).mapWith(Number).as("online_amount")
    })
    .from(dailyPaymentTotals)
    .groupBy(dailyPaymentTotals.userId, dailyPaymentTotals.date)
    .as("online_totals");

  const paidTotals = db
    .select({
      userId: vendorPayments.userId,
      date: vendorPayments.date,
      amount: sum(vendorPayments.amount).mapWith(Number).as("paid_amount")
    })
    .from(vendorPayments)
    .groupBy(vendorPayments.userId, vendorPayments.date)
    .as("paid_totals");

  const rows = await db
    .select({
      date: dailyEntries.date,
      cashAmount: dailyEntries.cashAmount,
      onlineAmount: sql<number>`coalesce(${onlineTotals.amount}, 0)`.mapWith(Number),
      paidAmount: sql<number>`coalesce(${paidTotals.amount}, 0)`.mapWith(Number)
    })
    .from(dailyEntries)
    .leftJoin(
      onlineTotals,
      and(eq(onlineTotals.userId, dailyEntries.userId), eq(onlineTotals.date, dailyEntries.date))
    )
    .leftJoin(
      paidTotals,
      and(eq(paidTotals.userId, dailyEntries.userId), eq(paidTotals.date, dailyEntries.date))
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
    const receivedAmount = row.cashAmount + row.onlineAmount;
    return {
      ...row,
      receivedAmount,
      netAmount: receivedAmount - row.paidAmount
    };
  });
}

export async function listPaymentMethods(
  database: D1Database,
  userId: string,
  includeArchived = false
): Promise<PaymentMethod[]> {
  await ensureDefaultPaymentMethods(database, userId);
  return createDatabase(database)
    .select({
      id: paymentMethods.id,
      name: paymentMethods.name,
      isPreset: paymentMethods.isPreset,
      isArchived: paymentMethods.isArchived
    })
    .from(paymentMethods)
    .where(
      and(
        eq(paymentMethods.userId, userId),
        includeArchived ? undefined : eq(paymentMethods.isArchived, false)
      )
    )
    .orderBy(
      desc(paymentMethods.isPreset),
      sql`CASE WHEN ${paymentMethods.isPreset} THEN ${paymentMethods.id} END`,
      sql`${paymentMethods.name} COLLATE NOCASE`
    );
}

export async function getPaymentMethodsById(
  database: D1Database,
  userId: string,
  ids: number[]
): Promise<PaymentMethod[]> {
  if (ids.length === 0) return [];
  return createDatabase(database)
    .select({
      id: paymentMethods.id,
      name: paymentMethods.name,
      isPreset: paymentMethods.isPreset,
      isArchived: paymentMethods.isArchived
    })
    .from(paymentMethods)
    .where(and(eq(paymentMethods.userId, userId), inArray(paymentMethods.id, ids)));
}

export async function createPaymentMethod(
  database: D1Database,
  userId: string,
  name: string
): Promise<PaymentMethod> {
  const db = createDatabase(database);
  const now = nowIso();
  try {
    const [created] = await db
      .insert(paymentMethods)
      .values({ userId, name, createdAt: now, updatedAt: now })
      .returning({
        id: paymentMethods.id,
        name: paymentMethods.name,
        isPreset: paymentMethods.isPreset,
        isArchived: paymentMethods.isArchived
      });
    if (!created) throw new Error("Payment method was not created.");
    return created;
  } catch (error) {
    if (isUniqueError(error)) {
      throw new HTTPException(409, { message: "A payment method with this name already exists." });
    }
    throw error;
  }
}

export async function updatePaymentMethod(
  database: D1Database,
  userId: string,
  id: number,
  patch: { name?: string; isArchived?: boolean }
): Promise<PaymentMethod> {
  const db = createDatabase(database);
  try {
    const [updated] = await db
      .update(paymentMethods)
      .set({ ...patch, updatedAt: nowIso() })
      .where(
        and(
          eq(paymentMethods.userId, userId),
          eq(paymentMethods.id, id),
          eq(paymentMethods.isPreset, false)
        )
      )
      .returning({
        id: paymentMethods.id,
        name: paymentMethods.name,
        isPreset: paymentMethods.isPreset,
        isArchived: paymentMethods.isArchived
      });
    if (!updated) {
      throw new HTTPException(404, { message: "Custom payment method not found." });
    }
    return updated;
  } catch (error) {
    if (isUniqueError(error)) {
      throw new HTTPException(409, { message: "A payment method with this name already exists." });
    }
    throw error;
  }
}

export async function listReceivedEntries(
  database: D1Database,
  userId: string,
  date: LocalDate,
  paymentMethodId: number | null,
  beforeId: number
): Promise<ReceivedEntry[]> {
  return createDatabase(database)
    .select({
      id: receivedEntries.id,
      amount: receivedEntries.amount,
      note: receivedEntries.note,
      createdAt: receivedEntries.createdAt
    })
    .from(receivedEntries)
    .where(
      and(
        eq(receivedEntries.userId, userId),
        eq(receivedEntries.date, date),
        lt(receivedEntries.id, beforeId),
        paymentMethodId === null
          ? isNull(receivedEntries.paymentMethodId)
          : eq(receivedEntries.paymentMethodId, paymentMethodId)
      )
    )
    .orderBy(desc(receivedEntries.id))
    .limit(50);
}

export async function searchVendorNames(
  database: D1Database,
  userId: string,
  search: string
): Promise<string[]> {
  const db = createDatabase(database);
  const normalizedName = sql<string>`trim(${vendorPayments.vendorName})`;
  const rows = await db
    .select({ name: normalizedName })
    .from(vendorPayments)
    .where(
      and(
        eq(vendorPayments.userId, userId),
        ne(normalizedName, ""),
        sql`instr(lower(${normalizedName}), lower(${search})) > 0`
      )
    )
    .groupBy(sql`${normalizedName} COLLATE NOCASE`)
    .orderBy(desc(max(vendorPayments.id)))
    .limit(6);

  return rows.map((row) => row.name);
}

export async function deleteDailyEntry(
  database: D1Database,
  userId: string,
  date: LocalDate
): Promise<void> {
  const db = createDatabase(database);
  await db.batch([
    db
      .delete(receivedEntries)
      .where(and(eq(receivedEntries.userId, userId), eq(receivedEntries.date, date))),
    db
      .delete(vendorPayments)
      .where(and(eq(vendorPayments.userId, userId), eq(vendorPayments.date, date))),
    db
      .delete(dailyPaymentTotals)
      .where(and(eq(dailyPaymentTotals.userId, userId), eq(dailyPaymentTotals.date, date))),
    db
      .delete(dailyEntries)
      .where(and(eq(dailyEntries.userId, userId), eq(dailyEntries.date, date)))
  ]);
}

export async function getPaymentMethodTotal(
  database: D1Database,
  userId: string,
  date: LocalDate,
  paymentMethodId: number | null
): Promise<number> {
  const db = createDatabase(database);
  const [result] =
    paymentMethodId === null
      ? await db
          .select({ amount: dailyEntries.cashAmount })
          .from(dailyEntries)
          .where(and(eq(dailyEntries.userId, userId), eq(dailyEntries.date, date)))
          .limit(1)
      : await db
          .select({ amount: dailyPaymentTotals.amount })
          .from(dailyPaymentTotals)
          .where(
            and(
              eq(dailyPaymentTotals.userId, userId),
              eq(dailyPaymentTotals.date, date),
              eq(dailyPaymentTotals.paymentMethodId, paymentMethodId)
            )
          )
          .limit(1);

  return result?.amount ?? 0;
}

export async function getVendorPaymentsTotal(
  database: D1Database,
  userId: string,
  date: LocalDate
): Promise<number> {
  const [result] = await createDatabase(database)
    .select({ amount: sum(vendorPayments.amount).mapWith(Number) })
    .from(vendorPayments)
    .where(and(eq(vendorPayments.userId, userId), eq(vendorPayments.date, date)));
  return result?.amount ?? 0;
}
