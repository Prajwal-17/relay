import os from "os";
import path from "path";
import { upiQrProfileSchema } from "../../../shared/schemas/preferences.schema";
import type { AppConfig, PrintingConfig, UpiQrProfile } from "../../../shared/types";

export const DEFAULT_EXPORT_FORMAT = "pdf" as const;
export const DEFAULT_ASK_BEFORE_SAVING_PDF = true;
export const DEFAULT_PDF_LOCATION = path.join(os.homedir(), "Downloads", "Receipts");
const LEGACY_UPI_PROFILE_ID = "00000000-0000-4000-8000-000000000001";

type LegacyPrintingConfig = Partial<PrintingConfig> & {
  upiId?: string;
  upiPayeeName?: string;
};

export function getDefaultExportsConfig(): AppConfig["exports"] {
  return {
    askBeforeSavingPdf: DEFAULT_ASK_BEFORE_SAVING_PDF,
    defaultPdfLocation: DEFAULT_PDF_LOCATION,
    defaultExportFormat: DEFAULT_EXPORT_FORMAT
  };
}

export function getDefaultPrintingConfig(): PrintingConfig {
  return {
    printerName: "",
    defaultPrintMode: "raster",
    extraFeedLines: 4,
    cutMode: "partial",
    showAddress: true,
    showPhone: true,
    showGstinOnSales: true,
    showCustomerName: true,
    showSavings: true,
    savingsThresholdPaisa: 0,
    showLedgerPaymentMode: true,
    showLedgerNotes: true,
    footerMessage: "Thank you. Visit again.",
    upiQrProfiles: [],
    defaultUpiQrProfileId: null,
    printUpiQrOnSales: false,
    printUpiQrOnEstimates: false,
    includeAmountInUpiQr: true
  };
}

function normalizeConfiguredProfiles(profiles: unknown): UpiQrProfile[] {
  if (!Array.isArray(profiles)) return [];

  const ids = new Set<string>();
  const labels = new Set<string>();
  const upiIds = new Set<string>();
  const normalized: UpiQrProfile[] = [];

  profiles.forEach((profile) => {
    const result = upiQrProfileSchema.safeParse(profile);
    if (!result.success) return;

    const label = result.data.label.toLocaleLowerCase();
    const upiId = result.data.upiId.toLocaleLowerCase();
    if (ids.has(result.data.id) || labels.has(label) || upiIds.has(upiId)) return;

    ids.add(result.data.id);
    labels.add(label);
    upiIds.add(upiId);
    normalized.push(result.data);
  });

  return normalized;
}

export function normalizePrintingConfig(config?: LegacyPrintingConfig): PrintingConfig {
  const defaultPrintMode = config?.defaultPrintMode;
  const configuredProfiles = normalizeConfiguredProfiles(config?.upiQrProfiles);
  const legacyUpiId = config?.upiId?.trim() ?? "";
  const legacyPayeeName = config?.upiPayeeName?.trim() ?? "";
  const upiQrProfiles =
    configuredProfiles.length > 0
      ? configuredProfiles
      : legacyUpiId && legacyPayeeName
        ? [
            {
              id: LEGACY_UPI_PROFILE_ID,
              label: "Primary UPI",
              upiId: legacyUpiId,
              payeeName: legacyPayeeName
            }
          ]
        : [];
  const defaultUpiQrProfileId =
    upiQrProfiles.find((profile) => profile.id === config?.defaultUpiQrProfileId)?.id ??
    upiQrProfiles[0]?.id ??
    null;
  const remainingConfig = { ...config };
  delete remainingConfig.upiId;
  delete remainingConfig.upiPayeeName;
  delete remainingConfig.upiQrProfiles;
  delete remainingConfig.defaultUpiQrProfileId;

  return {
    ...getDefaultPrintingConfig(),
    ...remainingConfig,
    defaultPrintMode:
      defaultPrintMode === "device-text" || defaultPrintMode === "raster"
        ? defaultPrintMode
        : "raster",
    upiQrProfiles,
    defaultUpiQrProfileId,
    printUpiQrOnSales: upiQrProfiles.length > 0 && Boolean(remainingConfig.printUpiQrOnSales),
    printUpiQrOnEstimates:
      upiQrProfiles.length > 0 && Boolean(remainingConfig.printUpiQrOnEstimates)
  };
}

export function normalizeAppConfig(config: AppConfig | Partial<AppConfig>): AppConfig {
  const defaults = getDefaultConfig();
  return {
    billing: {
      ...defaults.billing,
      ...config.billing,
      searchDropdown: {
        ...defaults.billing.searchDropdown,
        ...config.billing?.searchDropdown
      }
    },
    exports: {
      ...defaults.exports,
      ...config.exports
    },
    printing: normalizePrintingConfig(config.printing)
  };
}

export function getDefaultConfig(): AppConfig {
  return {
    billing: { defaultCustomerId: "", searchDropdown: { scale: 1 } },
    exports: getDefaultExportsConfig(),
    printing: getDefaultPrintingConfig()
  };
}
