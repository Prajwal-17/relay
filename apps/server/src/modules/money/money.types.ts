export type LocalDate = string;

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

export interface DailyEntryInput {
  date: LocalDate;
  cashPaisa: number;
  onlineReceipts: OnlineReceiptInput[];
  supplierPayments: SupplierPaymentInput[];
}

export interface ReceivedPaymentInput {
  date: LocalDate;
  channelId: number | null;
  amountPaisa: number;
  name?: string;
}

export interface VendorPaymentInput extends SupplierPaymentInput {
  date: LocalDate;
}

export interface DaySummary {
  date: LocalDate;
  cashPaisa: number;
  onlinePaisa: number;
  receivedPaisa: number;
  paidPaisa: number;
  netPaisa: number;
}

export interface ReceiptEvent {
  id: number;
  kind: "opening" | "payment" | "adjustment";
  amountPaisa: number;
  balancePaisa: number;
  recordedAt: string | null;
  name: string | null;
}
