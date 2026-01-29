export type PaginatedQuery = {
  pageNo: number;
  pageSize: number;
};

export type EstimatesByCustomerParams = PaginatedQuery & {
  customerId: string;
};
