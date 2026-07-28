import type { SyncStatus } from "@/types";
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
};

export type PrefillCustomer = {
  id: string;
  name: string;
};

export type BillingSessionData = {
  isMetaDataDirty: boolean;
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
  lineItems: LineItem[];
};
