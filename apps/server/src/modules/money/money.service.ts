import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

import { createDatabase } from "../../db/client";
import { dailyEntries, dailyPaymentTotals, receivedEntries, vendorPayments } from "../../db/schema";
import {
  amountSchema,
  receivedPaymentUpdateSchema,
  vendorPaymentUpdateSchema,
  type ReceivedPaymentUpdateInput,
  type VendorPaymentUpdateInput,
  receivedPaymentSchema,
  type ReceivedPaymentInput,
  vendorPaymentSchema,
  type VendorPaymentInput
} from "./money.schemas";
import {
  createPaymentMethod as insertPaymentMethod,
  getReceivedEntryById,
  getVendorPaymentById,
  getPaymentMethodsById,
  getPaymentMethodTotal,
  getVendorPaymentsTotal,
  getReceivedTotal,
  getMoneyDay,
  listReceivedEntries,
  listVendorNames,
  removeReceivedEntry,
  updatePaymentMethod as patchPaymentMethod
} from "./money.repository";
import { nowIso } from "./money.utils";
import { entryProviderName, UNSUPPORTED_METHOD_MESSAGE } from "./payment-catalog";

export async function createPaymentMethod(database: D1Database, userId: string, name: string) {
  const provider = entryProviderName(name);
  if (!provider) throw new HTTPException(400, { message: UNSUPPORTED_METHOD_MESSAGE });
  return insertPaymentMethod(database, userId, provider);
}

export async function updatePaymentMethod(
  database: D1Database,
  userId: string,
  id: number,
  patch: { name?: string; isArchived?: boolean }
) {
  const [method] = await getPaymentMethodsById(database, userId, [id]);
  if (!method) throw new HTTPException(404, { message: "Payment method not found." });
  // Never relabel historical receipts or reactivate an earlier provider.
  if (
    (patch.name !== undefined && patch.name.toLowerCase() !== method.name.toLowerCase()) ||
    (patch.isArchived === false && !entryProviderName(method.name))
  ) {
    throw new HTTPException(400, { message: UNSUPPORTED_METHOD_MESSAGE });
  }
  if (entryProviderName(method.name) && patch.isArchived === true) {
    throw new HTTPException(400, { message: "PhonePe and Paytm stay available for new entries." });
  }
  return patchPaymentMethod(database, userId, id, { isArchived: patch.isArchived });
}

export async function addReceivedPayment(
  database: D1Database,
  userId: string,
  candidate: ReceivedPaymentInput
) {
  const input = receivedPaymentSchema.parse(candidate);

  if (input.paymentMethodId !== null) {
    const [method] = await getPaymentMethodsById(database, userId, [input.paymentMethodId]);
    if (!method) {
      throw new HTTPException(400, { message: "This payment method is unavailable." });
    }
    if (!entryProviderName(method.name)) {
      throw new HTTPException(400, { message: UNSUPPORTED_METHOD_MESSAGE });
    }
    if (method.isArchived) {
      throw new HTTPException(400, { message: "This payment method is unavailable." });
    }
  }

  const receivedAmount = await getReceivedTotal(database, userId, input.date);
  if (!amountSchema.safeParse(receivedAmount + input.amount).success) {
    throw new HTTPException(400, { message: "Total received amount is too large." });
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
  const insertEntry = db
    .insert(receivedEntries)
    .values({
      userId,
      date: input.date,
      paymentMethodId: input.paymentMethodId,
      amount: input.amount,
      note: input.note || null,
      createdAt: now,
      updatedAt: now
    })
    .returning({
      id: receivedEntries.id,
      amount: receivedEntries.amount,
      note: receivedEntries.note,
      createdAt: receivedEntries.createdAt,
      updatedAt: receivedEntries.updatedAt
    });

  const [, , inserted] = await db.batch([upsertDay, updateTotal, insertEntry]);
  return { day: await getMoneyDay(database, userId, input.date), receivedEntry: inserted[0]! };
}

export async function deleteReceivedPayment(database: D1Database, userId: string, id: number) {
  const entry = await getReceivedEntryById(database, userId, id);
  if (!entry) throw new HTTPException(404, { message: "Payment entry not found." });

  const currentTotal = await getPaymentMethodTotal(
    database,
    userId,
    entry.date,
    entry.paymentMethodId
  );
  if (currentTotal < entry.amount) {
    throw new HTTPException(409, {
      message: "Payment total is out of sync. Refresh and try again."
    });
  }

  await removeReceivedEntry(database, userId, entry, currentTotal - entry.amount);
  return { day: await getMoneyDay(database, userId, entry.date) };
}

export async function addVendorPayment(
  database: D1Database,
  userId: string,
  candidate: VendorPaymentInput
) {
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
    createdAt: now,
    updatedAt: now
  });

  await db.batch([upsertDay, insertPayment]);
  const [day, vendorNames] = await Promise.all([
    getMoneyDay(database, userId, input.date),
    listVendorNames(database, userId)
  ]);
  return { day, vendorNames };
}

export async function getReceivedHistory(
  database: D1Database,
  userId: string,
  date: string,
  paymentMethodId: number | null,
  beforeId: number
) {
  const [entries, total, methods] = await Promise.all([
    listReceivedEntries(database, userId, date, paymentMethodId, beforeId),
    getPaymentMethodTotal(database, userId, date, paymentMethodId),
    paymentMethodId === null
      ? Promise.resolve([])
      : getPaymentMethodsById(database, userId, [paymentMethodId])
  ]);
  const method = methods[0] ?? null;
  if (paymentMethodId !== null && !method)
    throw new HTTPException(404, { message: "Payment method not found." });
  return { entries, total, method, nextCursor: entries.length === 50 ? entries.at(-1)!.id : null };
}

export async function updateReceivedPayment(
  database: D1Database,
  userId: string,
  id: number,
  candidate: ReceivedPaymentUpdateInput
) {
  const input = receivedPaymentUpdateSchema.parse(candidate);
  const entry = await getReceivedEntryById(database, userId, id);
  if (!entry) throw new HTTPException(404, { message: "Payment entry not found." });
  const sameMethod = entry.paymentMethodId === input.paymentMethodId;
  // Historical methods remain editable, but cannot receive entries from another method.
  if (!sameMethod && input.paymentMethodId !== null) {
    const [method] = await getPaymentMethodsById(database, userId, [input.paymentMethodId]);
    if (!method || method.isArchived)
      throw new HTTPException(400, { message: "This payment method is unavailable." });
    if (!entryProviderName(method.name))
      throw new HTTPException(400, { message: UNSUPPORTED_METHOD_MESSAGE });
  }
  const [sourceTotal, receivedTotal, targetTotal] = await Promise.all([
    getPaymentMethodTotal(database, userId, entry.date, entry.paymentMethodId),
    getReceivedTotal(database, userId, entry.date),
    sameMethod
      ? Promise.resolve(0)
      : getPaymentMethodTotal(database, userId, entry.date, input.paymentMethodId)
  ]);
  if (sourceTotal < entry.amount)
    throw new HTTPException(409, {
      message: "Payment total is out of sync. Refresh and try again."
    });
  const nextSource = sourceTotal - entry.amount + (sameMethod ? input.amount : 0);
  const nextTarget = targetTotal + input.amount;
  if (
    !amountSchema.safeParse(receivedTotal - entry.amount + input.amount).success ||
    !amountSchema.safeParse(nextSource).success ||
    (!sameMethod && !amountSchema.safeParse(nextTarget).success)
  )
    throw new HTTPException(400, { message: "Total received amount is too large." });
  const db = createDatabase(database);
  const now = nowIso();
  function setTotal(methodId: number | null, amount: number) {
    if (methodId === null)
      return db
        .update(dailyEntries)
        .set({ cashAmount: amount, updatedAt: now })
        .where(and(eq(dailyEntries.userId, userId), eq(dailyEntries.date, entry!.date)));
    if (amount === 0)
      return db
        .delete(dailyPaymentTotals)
        .where(
          and(
            eq(dailyPaymentTotals.userId, userId),
            eq(dailyPaymentTotals.date, entry!.date),
            eq(dailyPaymentTotals.paymentMethodId, methodId)
          )
        );
    return db
      .insert(dailyPaymentTotals)
      .values({ userId, date: entry!.date, paymentMethodId: methodId, amount })
      .onConflictDoUpdate({
        target: [
          dailyPaymentTotals.userId,
          dailyPaymentTotals.date,
          dailyPaymentTotals.paymentMethodId
        ],
        set: { amount }
      });
  }
  const patch = db
    .update(receivedEntries)
    .set({
      paymentMethodId: input.paymentMethodId,
      amount: input.amount,
      note: input.note || null,
      updatedAt: now
    })
    .where(and(eq(receivedEntries.id, id), eq(receivedEntries.userId, userId)));
  const touchDay = db
    .update(dailyEntries)
    .set({ updatedAt: now })
    .where(and(eq(dailyEntries.userId, userId), eq(dailyEntries.date, entry.date)));
  const source = setTotal(entry.paymentMethodId, nextSource);
  if (sameMethod) await db.batch([patch, touchDay, source]);
  else await db.batch([patch, touchDay, source, setTotal(input.paymentMethodId, nextTarget)]);
  const editedEntry = {
    ...entry,
    kind: "received" as const,
    ...input,
    note: input.note || null,
    updatedAt: now
  };
  return {
    day: await getMoneyDay(database, userId, entry.date),
    receivedEntry: editedEntry,
    editedEntry,
    previousPaymentMethodId: entry.paymentMethodId
  };
}

export async function updateVendorPayment(
  database: D1Database,
  userId: string,
  id: number,
  candidate: VendorPaymentUpdateInput
) {
  const input = vendorPaymentUpdateSchema.parse(candidate);
  const entry = await getVendorPaymentById(database, userId, id);
  if (!entry) throw new HTTPException(404, { message: "Vendor payment not found." });
  const paidTotal = await getVendorPaymentsTotal(database, userId, entry.date);
  if (!amountSchema.safeParse(paidTotal - entry.amount + input.amount).success)
    throw new HTTPException(400, { message: "Total vendor payments are too large." });
  const db = createDatabase(database);
  const now = nowIso();
  await db.batch([
    db
      .update(vendorPayments)
      .set({
        vendorName: input.vendorName,
        amount: input.amount,
        note: input.note || null,
        updatedAt: now
      })
      .where(and(eq(vendorPayments.id, id), eq(vendorPayments.userId, userId))),
    db
      .update(dailyEntries)
      .set({ updatedAt: now })
      .where(and(eq(dailyEntries.userId, userId), eq(dailyEntries.date, entry.date)))
  ]);
  const [day, vendorNames] = await Promise.all([
    getMoneyDay(database, userId, entry.date),
    listVendorNames(database, userId)
  ]);
  return {
    day,
    vendorNames,
    editedEntry: {
      ...entry,
      kind: "vendor" as const,
      ...input,
      note: input.note || null,
      updatedAt: now
    }
  };
}
