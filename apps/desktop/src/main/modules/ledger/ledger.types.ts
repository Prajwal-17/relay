import type {
  CreateAdjustmentPayload,
  CreateOpeningBalancePayload,
  CreatePaymentPayload,
  CreateQuickSalePayload,
  LedgerSort,
  LedgerTypeFilter
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
  debit: number;
};
