import type {
  RawLedgerEntry,
  RawLedgerStatementData,
  RawReceiptData,
  RawReceiptItem,
  StoreProfile
} from "../types";
import { buildUpiPaymentUri } from "./upiQrProfiles";
import { paisaToRupeeString } from "./utils";

export const THERMAL_RECEIPT_LINE_WIDTH = 48;
export const THERMAL_RECEIPT_ITEM_WIDTHS = {
  index: 3,
  name: 22,
  quantity: 6,
  rate: 8,
  amount: 9
} as const;

export function safeThermalText(value: string): string {
  return value
    .replaceAll("₹", "Rs.")
    .normalize("NFKD")
    .replace(/[^\x20-\x7e\n]/g, "?");
}

export function wrapThermalText(value: string, width: number): string[] {
  if (!Number.isInteger(width) || width < 1) {
    throw new Error("Text width must be a positive integer.");
  }

  const words = safeThermalText(value).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (word.length > width) {
      if (current) {
        lines.push(current);
        current = "";
      }
      for (let index = 0; index < word.length; index += width) {
        const part = word.slice(index, index + width);
        if (part.length === width) lines.push(part);
        else current = part;
      }
      continue;
    }

    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= width) current = candidate;
    else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

export function fitThermalText(
  value: string,
  width: number,
  align: "left" | "right" = "left"
): string {
  const clipped = safeThermalText(value).slice(0, width);
  return align === "right" ? clipped.padStart(width) : clipped.padEnd(width);
}

export function buildReceiptAddressLines(profile: StoreProfile): string[] {
  const locality = [profile.city, profile.state]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
  const localityWithPincode = [locality, profile.pincode.trim()].filter(Boolean).join(" ");

  return [profile.addressLine1, profile.addressLine2, localityWithPincode]
    .map((addressLine) => addressLine?.trim())
    .filter((addressLine): addressLine is string => Boolean(addressLine));
}

export function thermalItemLines(index: number, item: RawReceiptItem): string[] {
  const widths = THERMAL_RECEIPT_ITEM_WIDTHS;
  const nameLines = wrapThermalText(item.name, widths.name);
  const rate = (item.unitPricePaisa / 100).toFixed(2);
  const amount = (item.totalPaisa / 100).toFixed(2);

  return nameLines.map((name, lineIndex) =>
    [
      fitThermalText(lineIndex === 0 ? `${index}.` : "", widths.index),
      fitThermalText(name, widths.name),
      fitThermalText(lineIndex === 0 ? item.quantity : "", widths.quantity, "right"),
      fitThermalText(lineIndex === 0 ? rate : "", widths.rate, "right"),
      fitThermalText(lineIndex === 0 ? amount : "", widths.amount, "right")
    ].join("")
  );
}

export function calculateThermalSavings(items: RawReceiptItem[]): number {
  return items.reduce((total, item) => {
    if (item.mrpPaisa == null || item.mrpPaisa <= item.unitPricePaisa) return total;

    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return total;

    const mrpTotalPaisa = Math.round(item.mrpPaisa * quantity);
    return total + Math.max(0, mrpTotalPaisa - item.totalPaisa);
  }, 0);
}

export function formatThermalLedgerDate(dateTime: string): string {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return safeThermalText(dateTime).slice(0, 11);

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata"
  }).format(date);
}

export function thermalLedgerEntryLines(entry: RawLedgerEntry): string[] {
  const amountPaisa = entry.amountPaidPaisa > 0 ? -entry.amountPaidPaisa : entry.amountDuePaisa;
  const label = entry.particulars.trim() || "Entry";

  return [
    formatThermalLedgerDate(entry.dateTime),
    fitThermalText(label, 32) + fitThermalText(formatThermalLedgerAmount(amountPaisa), 16, "right"),
    fitThermalText("Balance", 32) +
      fitThermalText(formatThermalLedgerAmount(entry.runningBalancePaisa), 16, "right"),
    ""
  ];
}

export function formatThermalLedgerAmount(paisa: number): string {
  const sign = paisa < 0 ? "-" : "";
  return sign + "Rs." + paisaToRupeeString(Math.abs(paisa));
}

export function getLedgerPreviousBalance(statement: RawLedgerStatementData): number {
  return (
    statement.previousBalancePaisa ??
    statement.closingBalancePaisa - statement.totalDuePaisa + statement.totalPaidPaisa
  );
}

export function thermalLedgerSummaryLines(statement: RawLedgerStatementData): string[] {
  const rows: Array<readonly [string, number]> = [
    ["PREVIOUS BALANCE", getLedgerPreviousBalance(statement)],
    ["CHARGES", statement.totalDuePaisa],
    ["PAYMENTS", -statement.totalPaidPaisa],
    ["BALANCE", statement.closingBalancePaisa]
  ];

  return rows.map(
    ([label, amount]) =>
      fitThermalText(label, 32) + fitThermalText(formatThermalLedgerAmount(amount), 16, "right")
  );
}

export function receiptDocumentLabel(
  receipt: Pick<RawReceiptData, "transactionType">
): "Invoice no" | "Estimate no" {
  return receipt.transactionType === "sale" ? "Invoice no" : "Estimate no";
}

export function formatThermalReceiptDate(dateTime: string): string {
  const date = new Date(dateTime);
  return Number.isNaN(date.getTime())
    ? dateTime
    : new Intl.DateTimeFormat("en-IN", {
        dateStyle: "short",
        timeStyle: "short",
        hour12: true
      }).format(date);
}

export function buildThermalUpiUri(receipt: RawReceiptData): string | undefined {
  if (!receipt.upi) return undefined;

  const label = receiptDocumentLabel(receipt);
  return buildUpiPaymentUri({
    upiId: receipt.upi.id,
    payeeName: receipt.upi.payeeName,
    transactionRef: receipt.transactionNo,
    note: `${label} ${receipt.transactionNo}`,
    amountPaisa: receipt.upi.includeAmount ? receipt.totalPaisa : undefined
  });
}
