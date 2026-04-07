import { z } from "zod";

export const storeIdentitySchema = z.object({
  storeName: z.string().trim().min(3, "Store name is required")
});

export const ownerContactSchema = z.object({
  ownerName: z.string().trim().min(4, "Owner name is required"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z.email("Enter a valid email address").trim()
});

export const locationSchema = z.object({
  addressLine1: z.string().trim().min(1, "Address Line 1 is required"),
  addressLine2: z.string().trim().optional().nullable().default(null),
  country: z.string().min(3, "Country is required").default("India"),
  state: z.string().min(3, "State is required"),
  city: z.string().min(3, "City is required"),
  pincode: z
    .string()
    .trim()
    .min(1, "Pincode is required")
    .regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  gstin: z
    .string()
    .trim()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i,
      "Enter a valid 15-character GSTIN"
    )
    .optional()
    .nullable()
    .default(null)
});

export const onboardingSchema = z.intersection(
  z.intersection(storeIdentitySchema, ownerContactSchema),
  locationSchema
);
