import type { CustomerSortByType, CustomerType } from "../../../shared/types";

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

export type SalesByCustomerParams = PaginatedQuery & {
  customerId: string;
};

export type EstimatesByCustomerParams = PaginatedQuery & {
  customerId: string;
};
