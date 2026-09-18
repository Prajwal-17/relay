import { z } from "zod";

import { isValidLedgerDate } from "./money.utils";

const MAX_AMOUNT = Number.MAX_SAFE_INTEGER;

export const localDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
  .refine(isValidLedgerDate, "Choose a valid date that is not in the future.");

export const amountSchema = z.number().int().min(0).max(MAX_AMOUNT);
export const positiveIdSchema = z.coerce.number().int().positive();
export const positiveAmountSchema = amountSchema.min(1);

export const receivedPaymentSchema = z.object({
  date: localDateSchema,
  paymentMethodId: positiveIdSchema.nullable(),
  amount: positiveAmountSchema,
  note: z.string().trim().max(240).optional()
});

export const vendorPaymentSchema = z.object({
  date: localDateSchema,
  vendorName: z.string().trim().min(1).max(120),
  amount: positiveAmountSchema,
  note: z.string().trim().max(240).optional()
});

export const paymentMethodCreateSchema = z.object({
  name: z.string().trim().min(1).max(60)
});

export const paymentMethodUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    isArchived: z.boolean().optional()
  })
  .refine((value) => value.name !== undefined || value.isArchived !== undefined, {
    message: "Provide a payment method change."
  });

export const overviewQuerySchema = z.object({
  date: localDateSchema,
  year: z.coerce.number().int().min(2000).max(2200),
  month: z.coerce.number().int().min(1).max(12)
});

export const receivedEntriesQuerySchema = z.object({
  date: localDateSchema,
  paymentMethod: z.union([z.literal("cash"), positiveIdSchema]),
  beforeId: positiveIdSchema.default(Number.MAX_SAFE_INTEGER)
});

export const vendorSearchSchema = z.object({
  q: z.string().trim().max(120).default("")
});

export type ReceivedPaymentInput = z.infer<typeof receivedPaymentSchema>;
export type VendorPaymentInput = z.infer<typeof vendorPaymentSchema>;
