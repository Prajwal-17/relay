import type { receiptEvents } from "@/lib/db/schema";
import type { LocalDate } from "@/types/date.types";

export type { LocalDate } from "@/types/date.types";
export type ReceiptEvent = Omit<typeof receiptEvents.$inferSelect, "date" | "channelId">;
export type ReceiptEventInput = typeof receiptEvents.$inferInsert;

export interface ReceivedPaymentInput {
  date: LocalDate;
  channelId: number | null;
  amountPaisa: number;
  name?: string;
}

export interface OnlineChannel {
  id: number;
  name: string;
  isPreset: boolean;
  isArchived: boolean;
}

export interface OnlineReceipt {
  channelId: number;
  channelName: string;
  amountPaisa: number;
  isChannelArchived: boolean;
}

export interface SupplierPayment {
  id: number;
  payee: string;
  amountPaisa: number;
  note: string | null;
  position: number;
}

export interface DailyEntry {
  date: LocalDate;
  cashPaisa: number;
  onlineReceipts: OnlineReceipt[];
  supplierPayments: SupplierPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface OnlineReceiptInput {
  channelId: number;
  amountPaisa: number;
}

export interface SupplierPaymentInput {
  payee: string;
  amountPaisa: number;
  note?: string;
}

export interface VendorPaymentInput extends SupplierPaymentInput {
  date: LocalDate;
}

export interface DailyEntryInput {
  date: LocalDate;
  cashPaisa: number;
  onlineReceipts: OnlineReceiptInput[];
  supplierPayments: SupplierPaymentInput[];
}

export interface DaySummary {
  date: LocalDate;
  cashPaisa: number;
  onlinePaisa: number;
  receivedPaisa: number;
  paidPaisa: number;
  netPaisa: number;
}
