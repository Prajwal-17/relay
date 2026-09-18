export type LocalDate = string;

export type OnlineChannel = {
  id: number;
  name: string;
  isPreset: boolean;
  isArchived: boolean;
};

export type OnlineReceipt = {
  channelId: number;
  channelName: string;
  amountPaisa: number;
  isChannelArchived: boolean;
};

export type SupplierPayment = {
  id: number;
  payee: string;
  amountPaisa: number;
  note: string | null;
  position: number;
};

export type DailyEntry = {
  date: LocalDate;
  cashPaisa: number;
  onlineReceipts: OnlineReceipt[];
  supplierPayments: SupplierPayment[];
  createdAt: string;
  updatedAt: string;
};

export type OnlineReceiptInput = {
  channelId: number;
  amountPaisa: number;
};

export type SupplierPaymentInput = {
  payee: string;
  amountPaisa: number;
  note?: string;
};

export type DailyEntryInput = {
  date: LocalDate;
  cashPaisa: number;
  onlineReceipts: OnlineReceiptInput[];
  supplierPayments: SupplierPaymentInput[];
};

export type ReceivedPaymentInput = {
  date: LocalDate;
  channelId: number | null;
  amountPaisa: number;
  name?: string;
};

export type VendorPaymentInput = SupplierPaymentInput & {
  date: LocalDate;
};

export type DaySummary = {
  date: LocalDate;
  cashPaisa: number;
  onlinePaisa: number;
  receivedPaisa: number;
  paidPaisa: number;
  netPaisa: number;
};

export type ReceiptEvent = {
  id: number;
  kind: "opening" | "payment" | "adjustment";
  amountPaisa: number;
  balancePaisa: number;
  recordedAt: string | null;
  name: string | null;
};
