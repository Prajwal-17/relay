import { z } from "zod";

const MAX_MONEY = Number.MAX_SAFE_INTEGER;

export const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.");
export const amountSchema = z.number().int().min(0).max(MAX_MONEY);
export const positiveAmountSchema = z.number().int().min(1).max(MAX_MONEY);

export const dailyEntryBodySchema = z
  .object({
    cashPaisa: amountSchema,
    onlineReceipts: z
      .array(
        z.object({
          channelId: z.number().int().positive(),
          amountPaisa: positiveAmountSchema
        })
      )
      .max(100),
    supplierPayments: z
      .array(
        z.object({
          payee: z.string().trim().min(1).max(120),
          amountPaisa: positiveAmountSchema,
          note: z.string().trim().max(240).optional()
        })
      )
      .max(250)
  })
  .superRefine((value, context) => {
    const ids = new Set<number>();
    for (const receipt of value.onlineReceipts) {
      if (ids.has(receipt.channelId)) {
        context.addIssue({
          code: "custom",
          path: ["onlineReceipts"],
          message: "Each payment provider can appear only once."
        });
        return;
      }
      ids.add(receipt.channelId);
    }
  });

export const receivedPaymentSchema = z.object({
  date: localDateSchema,
  channelId: z.number().int().positive().nullable(),
  amountPaisa: positiveAmountSchema,
  name: z.string().trim().max(120).optional()
});

export const vendorPaymentSchema = z.object({
  date: localDateSchema,
  payee: z.string().trim().min(1).max(120),
  amountPaisa: positiveAmountSchema,
  note: z.string().trim().max(240).optional()
});

export const channelCreateSchema = z.object({
  name: z.string().trim().min(1).max(60)
});

export const channelUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    isArchived: z.boolean().optional()
  })
  .refine((value) => value.name !== undefined || value.isArchived !== undefined, {
    message: "Provide a channel change."
  });

export const overviewQuerySchema = z.object({
  date: localDateSchema,
  year: z.coerce.number().int().min(2000).max(2200),
  month: z.coerce.number().int().min(1).max(12)
});
