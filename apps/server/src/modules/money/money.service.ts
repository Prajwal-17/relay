import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

import { createDatabase } from "../../db/client";
import {
  dailyEntries,
  dailyPaymentTotals,
  receivedEntries,
  vendorPayments
} from "../../db/schema";
import {
  amountSchema,
  receivedPaymentSchema,
  type ReceivedPaymentInput,
  vendorPaymentSchema,
  type VendorPaymentInput
} from "./money.schemas";
import {
  getPaymentMethodsById,
  getPaymentMethodTotal,
  getVendorPaymentsTotal
} from "./money.repository";
import { nowIso } from "./money.utils";

export async function addReceivedPayment(
  database: D1Database,
  userId: string,
  candidate: ReceivedPaymentInput
): Promise<void> {
  const input = receivedPaymentSchema.parse(candidate);

  if (input.paymentMethodId !== null) {
    const [method] = await getPaymentMethodsById(database, userId, [input.paymentMethodId]);
    if (!method || method.isArchived) {
      throw new HTTPException(400, { message: "This payment method is unavailable." });
    }
  }

  const currentAmount = await getPaymentMethodTotal(
    database,
    userId,
    input.date,
    input.paymentMethodId
  );
  const nextAmountResult = amountSchema.safeParse(currentAmount + input.amount);
  if (!nextAmountResult.success) {
    throw new HTTPException(400, { message: "Total received amount is too large." });
  }
  const nextAmount = nextAmountResult.data;
  const now = nowIso();
  const db = createDatabase(database);
  const upsertDay = db
    .insert(dailyEntries)
    .values({ userId, date: input.date, cashAmount: 0, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [dailyEntries.userId, dailyEntries.date],
      set: { updatedAt: now }
    });
  const updateTotal =
    input.paymentMethodId === null
      ? db
          .update(dailyEntries)
          .set({ cashAmount: nextAmount, updatedAt: now })
          .where(and(eq(dailyEntries.userId, userId), eq(dailyEntries.date, input.date)))
      : db
          .insert(dailyPaymentTotals)
          .values({
            userId,
            date: input.date,
            paymentMethodId: input.paymentMethodId,
            amount: nextAmount
          })
          .onConflictDoUpdate({
            target: [
              dailyPaymentTotals.userId,
              dailyPaymentTotals.date,
              dailyPaymentTotals.paymentMethodId
            ],
            set: { amount: nextAmount }
          });
  const insertEntry = db.insert(receivedEntries).values({
    userId,
    date: input.date,
    paymentMethodId: input.paymentMethodId,
    amount: input.amount,
    note: input.note || null,
    createdAt: now
  });

  await db.batch([upsertDay, updateTotal, insertEntry]);
}

export async function addVendorPayment(
  database: D1Database,
  userId: string,
  candidate: VendorPaymentInput
): Promise<void> {
  const input = vendorPaymentSchema.parse(candidate);
  const paidAmount = await getVendorPaymentsTotal(database, userId, input.date);
  if (!amountSchema.safeParse(paidAmount + input.amount).success) {
    throw new HTTPException(400, { message: "Total vendor payments are too large." });
  }

  const now = nowIso();
  const db = createDatabase(database);
  const upsertDay = db
    .insert(dailyEntries)
    .values({ userId, date: input.date, cashAmount: 0, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [dailyEntries.userId, dailyEntries.date],
      set: { updatedAt: now }
    });
  const insertPayment = db.insert(vendorPayments).values({
    userId,
    date: input.date,
    vendorName: input.vendorName,
    amount: input.amount,
    note: input.note || null,
    createdAt: now
  });

  await db.batch([upsertDay, insertPayment]);
}
