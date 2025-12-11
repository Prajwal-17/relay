import type { SQL } from "drizzle-orm";
import type { ProductFilterType, ProductsType } from "../../../shared/types";

export type ProductPayload = Omit<ProductsType, "id"> & { isDisabled?: boolean };

export type ProductSearchParams = {
  query: string;
  pageNo: number;
  pageSize: number;
  filterType: ProductFilterType;
};

export type ProductSearchQuery = {
  searchTerms: string[];
  whereClause: SQL | undefined;
  limit: number;
  offset: number;
};
