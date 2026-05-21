import type { SQL } from "drizzle-orm";
import type { ProductFilterType } from "../../../shared/types";

export type ProductSearchParams = {
  query: string;
  pageNo: number;
  pageSize: number;
  filterType: ProductFilterType;
  sortBy: string | null;
  priceMin: number | null;
  priceMax: number | null;
  hasMrp: boolean;
  hasPurchasePrice: boolean;
};

export type ProductSearchQuery = {
  searchTerm: string;
  whereClause: SQL | undefined;
  orderClause: SQL | undefined;
  limit: number;
  offset: number;
};
