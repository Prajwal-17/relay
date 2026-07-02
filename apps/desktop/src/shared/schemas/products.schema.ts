import z from "zod";
import { ProductSchema } from "./base.schema";

export const productCoreSchema = ProductSchema.omit({
  id: true,
  totalQuantitySold: true,
  disabledAt: true,
  isDeleted: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true
}).extend({
  imageUrl: z.string({ error: "URL is invalid" }).nullable(),
  weight: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? null : val),
    z.union([z.string(), z.null()]).optional()
  ),
  unit: z.preprocess(
    (val) => (typeof val === "string" && (val.trim() === "" || val === "none") ? null : val),
    z.string().nullable().optional()
  ),
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

export const createProductSchema = productCoreSchema.superRefine((data, ctx) => {
  const hasWeight = data.weight !== undefined && data.weight !== null && data.weight.trim() !== "";
  const hasUnit =
    data.unit !== undefined &&
    data.unit !== null &&
    data.unit.trim() !== "" &&
    data.unit !== "none";

  if (hasWeight && !hasUnit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Unit is required when weight is provided",
      path: ["unit"]
    });
  }

  if (hasUnit && !hasWeight) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Weight is required when unit is selected",
      path: ["weight"]
    });
  }
});

export const updateProductSchema = createProductSchema;

export const dirtyFieldsProductSchema = productCoreSchema.partial();
