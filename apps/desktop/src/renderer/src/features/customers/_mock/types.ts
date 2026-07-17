/**
 * UI-only types for the Customer Module V3 mock layer.
 * No backend equivalent yet — these exist purely to scaffold the
 * ledger/accounting UI before real schemas land (see plan §8).
 *
 * ALL monetary values are integers in **paisa** (per AGENTS.md).
 */

export type CustomerType = "cash" | "account" | "hotel";

export type CustomerMock = {
  id: string;
  name: string;
  contact: string | null;
  customerType: CustomerType;
  gstin?: string;
  billingAddress?: string;
  shippingAddress?: string;
  openingBalance: number;
  creditLimit: number;
  /** + = Due (they owe), - = Advance (prepaid) */
  outstanding: number;
  totalSales: number;
  lastPurchase?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
};

export type TxnStatus = "paid" | "unpaid";

export type SaleMock = {
  id: string;
  invoiceNo: string;
  date: string;
  status: TxnStatus;
  amount: number;
};

export type EstimateMock = {
  id: string;
  estimateNo: string;
  date: string;
  status: TxnStatus;
  amount: number;
};

export type ActivityEvent = {
  id: string;
  date: string;
  kind: "sale" | "payment" | "edit" | "estimate" | "note" | "system";
  title: string;
  description: string;
};

export type NoteMock = {
  id: string;
  date: string;
  author: string;
  body: string;
  pinned: boolean;
};

export type AttachmentMock = {
  id: string;
  name: string;
  kind: "pdf" | "image" | "doc";
  sizeKb: number;
  date: string;
};
