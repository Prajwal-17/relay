import { z } from "zod";

export const upiQrProfileSchema = z.object({
  id: z.string().uuid("UPI account ID is invalid"),
  label: z.string().trim().min(1, "Name is required").max(60, "Name must be 60 characters or less"),
  upiId: z
    .string()
    .trim()
    .min(3, "UPI ID is required")
    .max(100)
    .regex(/^[^\s@]+@[^\s@]+$/, "Enter a valid UPI ID"),
  payeeName: z.string().trim().min(1, "Payee name is required").max(80)
});

type UpiQrProfileInput = z.infer<typeof upiQrProfileSchema>;

function validateUpiProfiles(
  profiles: UpiQrProfileInput[] | undefined,
  defaultProfileId: string | null | undefined,
  context: z.RefinementCtx,
  requireDefault: boolean
) {
  if (!profiles) return;

  const ids = new Set<string>();
  const labels = new Set<string>();
  const upiIds = new Set<string>();

  profiles.forEach((profile, index) => {
    const label = profile.label.toLocaleLowerCase();
    const upiId = profile.upiId.toLocaleLowerCase();

    if (ids.has(profile.id)) {
      context.addIssue({
        code: "custom",
        path: ["upiQrProfiles", index, "id"],
        message: "UPI account IDs must be unique"
      });
    }
    if (labels.has(label)) {
      context.addIssue({
        code: "custom",
        path: ["upiQrProfiles", index, "label"],
        message: "Account names must be unique"
      });
    }
    if (upiIds.has(upiId)) {
      context.addIssue({
        code: "custom",
        path: ["upiQrProfiles", index, "upiId"],
        message: "UPI IDs must be unique"
      });
    }

    ids.add(profile.id);
    labels.add(label);
    upiIds.add(upiId);
  });

  if (profiles.length === 0 && defaultProfileId != null) {
    context.addIssue({
      code: "custom",
      path: ["defaultUpiQrProfileId"],
      message: "Remove the default UPI account when no accounts exist"
    });
  }
  if (profiles.length > 0 && requireDefault && !defaultProfileId) {
    context.addIssue({
      code: "custom",
      path: ["defaultUpiQrProfileId"],
      message: "Choose a default UPI account"
    });
  }
  if (defaultProfileId && !ids.has(defaultProfileId)) {
    context.addIssue({
      code: "custom",
      path: ["defaultUpiQrProfileId"],
      message: "The default UPI account does not exist"
    });
  }
}

const printingFieldsSchema = z.object({
  printerName: z.string(),
  defaultPrintMode: z.enum(["raster", "device-text"]),
  extraFeedLines: z.number().int().min(0).max(10),
  cutMode: z.enum(["partial", "full", "none"]),
  showAddress: z.boolean(),
  showPhone: z.boolean(),
  showGstinOnSales: z.boolean(),
  showCustomerName: z.boolean(),
  showSavings: z.boolean(),
  savingsThresholdPaisa: z.number().int().min(0).max(100_000),
  showLedgerPaymentMode: z.boolean(),
  showLedgerNotes: z.boolean(),
  footerMessage: z.string(),
  upiQrProfiles: z.array(upiQrProfileSchema),
  defaultUpiQrProfileId: z.string().uuid("Default UPI account ID is invalid").nullable(),
  printUpiQrOnSales: z.boolean(),
  printUpiQrOnEstimates: z.boolean(),
  includeAmountInUpiQr: z.boolean()
});

export const printingConfigSchema = printingFieldsSchema.superRefine((printing, context) => {
  validateUpiProfiles(printing.upiQrProfiles, printing.defaultUpiQrProfileId, context, true);
});

const updatePrintingSchema = printingFieldsSchema.partial().superRefine((printing, context) => {
  validateUpiProfiles(
    printing.upiQrProfiles,
    printing.defaultUpiQrProfileId,
    context,
    printing.defaultUpiQrProfileId !== undefined
  );
});

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
  printing: updatePrintingSchema.optional()
});

export type UpdatePreferencesPayload = z.infer<typeof updatePreferencesSchema>;

export const resetSectionParamSchema = z.object({
  section: z.enum(["exports", "printing"])
});

export type ResetSectionParam = z.infer<typeof resetSectionParamSchema>;
