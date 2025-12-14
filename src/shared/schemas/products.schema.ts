import z from "zod";
import { ProductSchema } from "./base.schema";

export const createProductSchema = ProductSchema.omit({
  id: true,
  totalQuantitySold: true,
  disabledAt: true,
  isDeleted: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true
}).extend({
  weight: z.union([z.string(), z.null()]).optional(),
  unit: z.string().nullable().optional(),
  mrp: z.preprocess(
    (val) => (val === "" ? null : val),
    z.coerce
      .number({ error: "MRP must be a number" })
      .positive({ error: "MRP must be greater than zero" })
      .nullable()
      .optional()
  ),
  price: z.preprocess(
    (val) => (val === "" ? null : val),
    z.coerce
      .number({ error: "Price must be a number" })
      .positive({ error: "Price must be greater than zero" })
  ),
  purchasePrice: z.preprocess(
    (val) => (val === "" ? null : val),
    z.coerce
      .number({ error: "Purchase Price must be a number" })
      .positive({ error: "Purchase Price must be greater than zero" })
      .nullable()
      .optional()
  ),
  isDisabled: z.boolean().optional().default(false)
});

export const updateProductSchema = createProductSchema;

export const dirtyFieldsProductSchema = updateProductSchema.partial();
