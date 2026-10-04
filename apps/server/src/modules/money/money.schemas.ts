import { z } from "zod";
import {
  calendarWeekday,
  differenceInCalendarDays,
  parseLocalDate
} from "@relay/shared/date-utils";

import { isValidCalendarDate, isValidLedgerDate } from "./money.utils";

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

export const receivedPaymentUpdateSchema = receivedPaymentSchema.omit({ date: true });
export const vendorPaymentUpdateSchema = vendorPaymentSchema.omit({ date: true });

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

export const summariesQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2200),
  month: z.coerce.number().int().min(1).max(12)
});

export const overviewQuerySchema = summariesQuerySchema.extend({ date: localDateSchema });

export const weekQuerySchema = z
  .object({
    startDate: localDateSchema,
    endDate: z.string().refine(isValidCalendarDate, "Choose a valid end date.")
  })
  .refine(
    ({ startDate, endDate }) => {
      const start = parseLocalDate(startDate);
      const end = parseLocalDate(endDate);
      return (
        start !== null &&
        end !== null &&
        calendarWeekday(start) === 0 &&
        differenceInCalendarDays(end, start) === 6
      );
    },
    { message: "Choose one Sunday–Saturday week." }
  );

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

export type ReceivedPaymentUpdateInput = z.infer<typeof receivedPaymentUpdateSchema>;
export type VendorPaymentUpdateInput = z.infer<typeof vendorPaymentUpdateSchema>;
