import type { SQL } from "drizzle-orm";
import type z from "zod";
import type { ProductFilterType } from "../../../shared/types";
import type { addProductSchema, updateProductSchema } from "./products.schema";

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

export type AddProductPayload = z.infer<typeof addProductSchema>;
export type UpdateProductPayload = z.infer<typeof updateProductSchema>;
