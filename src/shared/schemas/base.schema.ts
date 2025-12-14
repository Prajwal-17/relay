import * as z from "zod";

export const ProductSchema = z.object({
  id: z.uuidv4(),
  name: z.string().trim().min(2, { error: "Name must be more than 2 characters" }),
  weight: z.string().nullable(),
  unit: z.string().nullable(),
  mrp: z.number().int().nonnegative().nullable(),
  price: z.number().int().nonnegative(),
  purchasePrice: z.number().int().nonnegative().nullable(),
  totalQuantitySold: z.number().nonnegative(),
  isDisabled: z.boolean(),
  disabledAt: z.iso.datetime().nullable(),
  isDeleted: z.boolean().default(false),
  deletedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime().nullable(),
  updatedAt: z.iso.datetime().nullable()
});

// -----------

// export const CustomerSchema = z.object({
//   id: z.string().optional(),
//   name: z.string().trim().min(3, { error: "Name must have atleast 3 characters" }),
//   contact: z
//     .string()
//     .refine((val) => !isNaN(Number(val)), {
//       message: "Contact must contain only numbers"
//     })
//     .length(10, { error: "Contact must contain 10 digits" })
//     .nullable(),
//   customerType: z.enum(["cash", "account", "hotel"])
// });
