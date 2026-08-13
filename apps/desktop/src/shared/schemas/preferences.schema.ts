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
    .optional(),
  printing: z
    .object({
      printerName: z.string().optional(),
      defaultPrintMode: z.enum(["raster", "device-text"]).optional(),
      extraFeedLines: z.number().int().min(0).max(10).optional(),
      cutMode: z.enum(["partial", "full", "none"]).optional(),
      showAddress: z.boolean().optional(),
      showPhone: z.boolean().optional(),
      showGstinOnSales: z.boolean().optional(),
      showCustomerName: z.boolean().optional(),
      showSavings: z.boolean().optional(),
      savingsThresholdPaisa: z.number().int().min(0).max(100_000).optional(),
      showLedgerPaymentMode: z.boolean().optional(),
      showLedgerNotes: z.boolean().optional(),
      footerMessage: z.string().optional(),
      upiId: z.string().optional(),
      upiPayeeName: z.string().optional(),
      printUpiQrOnSales: z.boolean().optional(),
      printUpiQrOnEstimates: z.boolean().optional(),
      includeAmountInUpiQr: z.boolean().optional()
    })
    .optional()
});

export type UpdatePreferencesPayload = z.infer<typeof updatePreferencesSchema>;

export const resetSectionParamSchema = z.object({
  section: z.enum(["exports", "printing"])
});

export type ResetSectionParam = z.infer<typeof resetSectionParamSchema>;
