import { z } from "zod";

export const updateStoreProfileSchema = z.object({
  storeName: z.string().trim().min(3, "Store name must be at least 3 characters").optional(),
  ownerName: z.string().trim().min(4, "Owner name must be at least 4 characters").optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
    .optional(),
  email: z.string().trim().email("Enter a valid email address").optional(),
  addressLine1: z.string().trim().min(1, "Address Line 1 is required").optional(),
  addressLine2: z.string().trim().nullable().optional(),
  country: z.string().min(3, "Country is required").optional(),
  state: z.string().min(3, "State is required").optional(),
  city: z.string().min(3, "City is required").optional(),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit pincode")
    .optional(),
  gstin: z
    .string()
    .trim()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i,
      "Enter a valid 15-character GSTIN"
    )
    .nullable()
    .optional()
});

export type UpdateStoreProfilePayload = z.infer<typeof updateStoreProfileSchema>;
