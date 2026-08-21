import type { SyncStatus } from "@/types/renderer.types";
import type { BillStatus, TransactionType } from "@shared/types";

export type LineItem = {
  id: string | null; // saleItem.id | estimateItem.id
  rowId: string;
  productId: string | null;
  name: string;
  productSnapshot: string;
  weight: string | null;
  unit: string | null;
  mrp: number | null;
  price: string;
  quantity: string;
  totalPrice: number; // UI-only
  checkedQty: number;
  position: number;
  isInventoryItem: boolean;
  syncStatus: SyncStatus; // FE-only
  isDeleted: boolean; // delete item flag
  revision: number; // FE-only, incremented for every persistent row edit
};

export type PrefillCustomer = {
  id: string;
  name: string;
};

export type BillingPrintOptions = {
  includeUpiQr: boolean | null;
  includeAmountInUpiQr: boolean | null;
  selectedUpiQrProfileId: string | null;
  includeAccountSummary: boolean;
  accountSummaryStartedAt: number;
};

export type BillingSessionData = {
  metadataRevision: number; // version currently in the UI
  persistedMetadataRevision: number; // latest version after data is persisted
  billingId: string | null; // sales.id | estimates.id
  billingType: TransactionType;
  transactionNo: number | null;
  billingDate: Date;
  customerId: string | null;
  customerName: string;
  isNewCustomer: boolean;
  status: BillStatus;
  isCountColumnVisible: boolean;
  notes: string | null;
  addToAccounting: boolean;
  printOptions: BillingPrintOptions;
  lineItems: LineItem[];
};

export const PERSISTENT_BILLING_FIELDS = [
  "billingDate",
  "customerId",
  "notes",
  "addToAccounting"
] as const satisfies readonly (keyof BillingSessionData)[];

export type PersistentBillingField = (typeof PERSISTENT_BILLING_FIELDS)[number];

type ExpectedUiBillingField = Exclude<
  keyof BillingSessionData,
  | PersistentBillingField
  | "lineItems"
  | "metadataRevision"
  | "persistedMetadataRevision"
  | "printOptions"
>;

export const UI_BILLING_FIELDS = [
  "billingId",
  "billingType",
  "transactionNo",
  "customerName",
  "isNewCustomer",
  "status",
  "isCountColumnVisible"
] as const satisfies readonly ExpectedUiBillingField[];

export type UiBillingField = (typeof UI_BILLING_FIELDS)[number];
