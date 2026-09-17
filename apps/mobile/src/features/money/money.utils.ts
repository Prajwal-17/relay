import type {
  DailyEntry,
  DailyEntryInput,
  DaySummary,
  LocalDate,
  ReceiptEventInput
} from "./money.types";
import { isFutureDate, parseLocalDate } from "@/lib/format/dates";

export function receiptAdjustments(
  previous: DailyEntry | null,
  input: DailyEntryInput,
  now: string
): ReceiptEventInput[] {
  const before = new Map<number | null, number>([
    [null, previous?.cashPaisa ?? 0],
    ...(previous?.onlineReceipts.map((r): [number, number] => [r.channelId, r.amountPaisa]) ?? [])
  ]);
  const after = new Map<number | null, number>([
    [null, input.cashPaisa],
    ...input.onlineReceipts.map((r): [number, number] => [r.channelId, r.amountPaisa])
  ]);
  const events: ReceiptEventInput[] = [];
  for (const channelId of new Set([...before.keys(), ...after.keys()])) {
    const balancePaisa = after.get(channelId) ?? 0;
    const amountPaisa = balancePaisa - (before.get(channelId) ?? 0);
    if (amountPaisa)
      events.push({
        date: input.date,
        channelId,
        kind: "adjustment",
        amountPaisa,
        balancePaisa,
        recordedAt: now
      });
  }
  return events;
}

export function summarizeEntry(entry: DailyEntry): DaySummary {
  const onlinePaisa = entry.onlineReceipts.reduce((total, row) => total + row.amountPaisa, 0);
  const paidPaisa = entry.supplierPayments.reduce((total, row) => total + row.amountPaisa, 0);
  const receivedPaisa = entry.cashPaisa + onlinePaisa;
  return {
    date: entry.date,
    cashPaisa: entry.cashPaisa,
    onlinePaisa,
    receivedPaisa,
    paidPaisa,
    netPaisa: receivedPaisa - paidPaisa
  };
}

export function validateAmount(amount: number, positive = false): void {
  if (!Number.isSafeInteger(amount) || amount < (positive ? 1 : 0)) {
    throw new Error(
      positive
        ? "Enter an amount greater than zero, within the supported range."
        : "Amount is outside the supported range."
    );
  }
}

export function validateEntryDate(date: LocalDate): void {
  if (!parseLocalDate(date) || isFutureDate(date))
    throw new Error("Choose today or an earlier date.");
}
