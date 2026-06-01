import type { SQL } from "drizzle-orm";
import type z from "zod";
import type { ProductFilterType } from "../../../shared/types";
import type { productSearchSchema } from "./products.schema";

export type ProductSearchParams = {
  query: string;
  pageNo: number;
  pageSize: number;
  filterType: ProductFilterType;
  sortBy: z.infer<typeof productSearchSchema>["sortBy"] | null;
  priceMin: number | null;
  priceMax: number | null;
  hasMrp: boolean;
  hasPurchasePrice: boolean;
  billingMode: boolean;
};

export type ProductSearchQuery = {
  searchTerm: string;
  whereClause: SQL | undefined;
  orderClause: SQL | undefined;
  limit: number;
  offset: number;
  billingMode: boolean;
};
