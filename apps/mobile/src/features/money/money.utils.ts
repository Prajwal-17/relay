import type { DailyEntry, DaySummary } from "./money.types";

export function summarizeEntry(entry: DailyEntry): DaySummary {
  const onlineAmount = entry.paymentTotals.reduce((total, row) => total + row.amount, 0);
  const paidAmount = entry.vendorPayments.reduce((total, row) => total + row.amount, 0);
  const receivedAmount = entry.cashAmount + onlineAmount;
  return {
    date: entry.date,
    cashAmount: entry.cashAmount,
    onlineAmount,
    receivedAmount,
    paidAmount,
    netAmount: receivedAmount - paidAmount
  };
}
