import type {
  CreateAdjustmentPayload,
  CreateOpeningBalancePayload,
  CreatePaymentPayload,
  CreateQuickSalePayload,
  LedgerSort,
  LedgerTypeFilter,
  UpdateLedgerEntryPayload
} from "../../../shared/types";

export type GetLedgerParams = {
  customerId: string;
  pageNo: number;
  pageSize: number;
  search: string;
  type: LedgerTypeFilter;
  sort: LedgerSort;
};

export type CreatePaymentParams = {
  customerId: string;
  payload: CreatePaymentPayload;
};

export type CreateAdjustmentParams = {
  customerId: string;
  payload: CreateAdjustmentPayload;
};

export type CreateQuickSaleParams = {
  customerId: string;
  payload: CreateQuickSalePayload;
};

export type CreateOpeningBalanceParams = {
  customerId: string;
  payload: CreateOpeningBalancePayload;
};

export type InsertSaleEntryParams = {
  customerId: string;
  saleId: string;
  amountDue: number;
};

export type OpenSale = {
  id: string;
  grandTotal: number | null;
  amountPaid: number;
  isPaid: boolean;
};

export type FifoAllocation = {
  saleId: string;
  allocatedPaisa: number;
};

export type UpdateLedgerEntryParams = {
  entryId: string;
  customerId: string;
  payload: UpdateLedgerEntryPayload;
};

export type DeleteLedgerEntryParams = {
  entryId: string;
  customerId: string;
};
