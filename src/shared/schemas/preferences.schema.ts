import { z } from "zod";

export const updatePreferencesSchema = z.object({
  billing: z
    .object({
      defaultCustomerId: z.string().min(1, "Customer ID is required")
    })
    .optional(),
  exports: z
    .object({
      askBeforeSavingPdf: z.boolean().optional(),
      defaultPdfLocation: z.string().optional(),
      defaultExportFormat: z.string().optional()
    })
    .optional()
});

export type UpdatePreferencesPayload = z.infer<typeof updatePreferencesSchema>;
