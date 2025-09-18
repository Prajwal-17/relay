import * as z from "zod";

export const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, { error: "Name must be more than 2 characters" }),
  weight: z.union([z.coerce.string(), z.null()]).optional(),
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
  isDisabled: z.boolean().optional()
});
