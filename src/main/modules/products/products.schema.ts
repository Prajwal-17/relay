import z from "zod";
import { ProductSchema } from "../../../shared/schemas/base.schema";
import { PRODUCT_FILTER } from "../../../shared/types";

export const productSearchSchema = z.object({
  query: z.string().default(" "),
  pageNo: z.coerce.number().min(1).nonnegative().default(1),
  pageSize: z.coerce.number().nonnegative().max(100).default(20),
  filterType: z.enum(PRODUCT_FILTER).default(PRODUCT_FILTER.ACTIVE)
});

export const addProductSchema = ProductSchema.omit({
  id: true,
  totalQuantitySold: true,
  disabledAt: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true
}).extend({
  isDisabled: z.boolean().optional().default(true)
});

export const updateProductSchema = ProductSchema.omit({
  totalQuantitySold: true,
  disabledAt: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true
}).extend({
  isDisabled: z.boolean().optional().default(true)
});
