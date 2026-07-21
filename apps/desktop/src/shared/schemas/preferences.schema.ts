import { z } from "zod";

export const updatePreferencesSchema = z.object({
  billing: z
    .object({
      defaultCustomerId: z.string().min(1, "Customer ID is required").optional(),
      searchDropdown: z
        .object({
          scale: z.number().min(0.8).max(1.5)
        })
        .optional()
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

export const resetSectionParamSchema = z.object({
  section: z.enum(["exports"])
});

export type ResetSectionParam = z.infer<typeof resetSectionParamSchema>;
