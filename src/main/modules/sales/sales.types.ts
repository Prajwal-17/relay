import type z from "zod";
import type { filterSalesParamsSchema } from "./sales.schema";

export type PaginatedQuery = {
  pageNo: number;
  pageSize: number;
};

export type SalesByCustomerParams = PaginatedQuery & {
  customerId: string;
};

export type FilterSalesParams = z.infer<typeof filterSalesParamsSchema>;
