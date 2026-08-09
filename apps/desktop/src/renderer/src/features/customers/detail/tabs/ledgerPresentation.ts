import { LEDGER_ENTRY_TYPE, type LedgerEntry } from "@shared/types";
import { formatRupee } from "@shared/utils/utils";

const LEDGER_MONTH_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata"
});

export function getLedgerMonthGroup(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return { key: "unknown", label: "Date unavailable" };

  const parts = LEDGER_MONTH_FORMATTER.formatToParts(date);
  const month = parts.find((part) => part.type === "month")?.value;
  const year = parts.find((part) => part.type === "year")?.value;
  if (!month || !year) return { key: "unknown", label: "Date unavailable" };

  return { key: year + "-" + month, label: month + " " + year };
}

export type BalanceState = "due" | "advance" | "settled";

export function getBalanceState(balance: number): BalanceState {
  if (balance > 0) return "due";
  if (balance < 0) return "advance";
  return "settled";
}

export function getBalanceStateLabel(balance: number) {
  const state = getBalanceState(balance);
  if (state === "due") return "Due";
  if (state === "advance") return "Advance";
  return "Settled";
}

export function getLedgerMovement(entry: LedgerEntry) {
  return entry.amountDue - entry.amountPaid;
}

export function getBalanceBefore(entry: LedgerEntry) {
  return entry.runningBalance - getLedgerMovement(entry);
}

export function formatSignedMovement(entry: LedgerEntry) {
  const movement = getLedgerMovement(entry);
  const sign = movement > 0 ? "+" : movement < 0 ? "−" : "±";
  return `${sign} ${formatRupee(Math.abs(movement))}`;
}

export function sentenceCase(value: string) {
  if (!value) return value;
  if (value.toLowerCase() === "upi") return "UPI";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function getLedgerParticulars(entry: LedgerEntry): {
  label: string;
  detail: string | null;
} {
  switch (entry.type) {
    case LEDGER_ENTRY_TYPE.SALE:
      return {
        label: "Sale",
        detail: entry.invoiceNo == null ? "Invoice" : `INV #${entry.invoiceNo}`
      };
    case LEDGER_ENTRY_TYPE.QUICK_SALE:
      return { label: "Quick sale", detail: entry.notes };
    case LEDGER_ENTRY_TYPE.PAYMENT:
      return {
        label: "Payment",
        detail: entry.paymentMode ? sentenceCase(entry.paymentMode) : null
      };
    case LEDGER_ENTRY_TYPE.ADJUSTMENT:
      return { label: "Adjustment", detail: entry.notes };
    case LEDGER_ENTRY_TYPE.OPENING_BALANCE:
      return {
        label: "Opening balance",
        detail: entry.notes?.trim() || "Account opening balance"
      };
  }
}

export function getLedgerEntryAccessibleName(entry: LedgerEntry) {
  const { label, detail } = getLedgerParticulars(entry);
  return detail ? `${label}, ${detail}` : label;
}
