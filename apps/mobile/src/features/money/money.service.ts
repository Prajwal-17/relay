import type { SQLiteDatabase } from "expo-sqlite";
import { createMoneyOrm } from "@/lib/db/orm";
import { withLedgerTransaction } from "@/lib/db/money-database";
import type { DailyEntryInput, ReceivedPaymentInput, VendorPaymentInput } from "./money.types";
import { insertVendorPayment } from "./repositories/vendor-payments.repository";
import { receiptAdjustments, validateAmount, validateEntryDate } from "./money.utils";
import { readDailyEntry } from "./repositories/daily.repository";
import { upsertDay, replaceDayBreakdown } from "./repositories/entry-write.repository";
import {
  getMethodBalance,
  setMethodBalance,
  insertReceiptEvent
} from "./repositories/receipts.repository";
import { getOnlineChannel } from "./repositories/channels.repository";

export async function saveDailyEntry(
  client: SQLiteDatabase,
  input: DailyEntryInput
): Promise<void> {
  validateEntryDate(input.date);
  validateAmount(input.cashPaisa);
  for (const receipt of input.onlineReceipts) validateAmount(receipt.amountPaisa, true);
  for (const payment of input.supplierPayments) validateAmount(payment.amountPaisa, true);
  await withLedgerTransaction(client, async (transaction) => {
    const db = createMoneyOrm(transaction);
    const previous = await readDailyEntry(db, input.date);
    const now = new Date().toISOString();
    await upsertDay(db, input.date, now, input.cashPaisa);
    for (const event of receiptAdjustments(previous, input, now))
      await insertReceiptEvent(db, event);
    await replaceDayBreakdown(db, input);
  });
}

export async function addReceivedPayment(
  client: SQLiteDatabase,
  input: ReceivedPaymentInput
): Promise<void> {
  validateEntryDate(input.date);
  validateAmount(input.amountPaisa, true);
  const name = input.name?.trim() || null;
  if (name && name.length > 120) throw new Error("Payment name must be 120 characters or fewer.");
  await withLedgerTransaction(client, async (transaction) => {
    const db = createMoneyOrm(transaction);
    if (input.channelId !== null) {
      const channel = await getOnlineChannel(db, input.channelId);
      if (!channel || channel.isArchived) throw new Error("This payment method is unavailable.");
    }
    const now = new Date().toISOString();
    const balancePaisa =
      (await getMethodBalance(db, input.date, input.channelId)) + input.amountPaisa;
    validateAmount(balancePaisa);
    await upsertDay(db, input.date, now);
    await setMethodBalance(db, input.date, input.channelId, balancePaisa);
    await insertReceiptEvent(db, {
      ...input,
      name,
      kind: "payment",
      balancePaisa,
      recordedAt: now
    });
  });
}

export async function addVendorPayment(
  client: SQLiteDatabase,
  input: VendorPaymentInput
): Promise<void> {
  validateEntryDate(input.date);
  validateAmount(input.amountPaisa, true);
  const payee = input.payee.trim();
  if (!payee) throw new Error("Enter a vendor name.");
  await withLedgerTransaction(client, async (transaction) => {
    const db = createMoneyOrm(transaction);
    const previous = await readDailyEntry(db, input.date);
    const paid = previous?.supplierPayments.reduce((total, row) => total + row.amountPaisa, 0) ?? 0;
    validateAmount(paid + input.amountPaisa);
    await upsertDay(db, input.date, new Date().toISOString());
    await insertVendorPayment(db, { ...input, payee });
  });
}
