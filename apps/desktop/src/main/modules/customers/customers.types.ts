import type {
  CustomerSortByType,
  CustomerTxnSort,
  CustomerTxnStatus,
  CustomerType
} from "../../../shared/types";

export type PaginatedQuery = {
  pageNo: number;
  pageSize: number;
};

export type ListCustomersParams = {
  pageNo: number;
  pageSize: number;
  query: string;
  type: CustomerType;
  sort: CustomerSortByType;
};

export type TxnByCustomerParams = {
  customerId: string;
  pageNo: number;
  pageSize: number;
  search: string;
  status: CustomerTxnStatus;
  sort: CustomerTxnSort;
};

export type SalesByCustomerParams = TxnByCustomerParams;

export type EstimatesByCustomerParams = TxnByCustomerParams;

export type ActivityParams = {
  customerId: string;
  limit: number;
};

export type RecentSalesParams = {
  customerId: string;
  limit: number;
};

export type LedgerEventRow = {
  id: string;
  type: string;
  amountDue: number | null;
  amountPaid: number | null;
  paymentMode: string | null;
  notes: string | null;
  createdAt: string;
};
