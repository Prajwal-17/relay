export type PaginatedQuery = {
  pageNo: number;
  pageSize: number;
};

export type SalesByCustomerParams = PaginatedQuery & {
  customerId: string;
};
