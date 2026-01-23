import type { SQL } from "drizzle-orm";
import type { ProductFilterType } from "../../../shared/types";

export type ProductSearchParams = {
  query: string;
  pageNo: number;
  pageSize: number;
  filterType: ProductFilterType;
};

export type ProductSearchQuery = {
  searchTerm: string;
  whereClause: SQL | undefined;
  limit: number;
  offset: number;
};
