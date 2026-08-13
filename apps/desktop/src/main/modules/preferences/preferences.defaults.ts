import os from "os";
import path from "path";
import type { AppConfig, PrintingConfig } from "../../../shared/types";

export const DEFAULT_EXPORT_FORMAT = "pdf" as const;
export const DEFAULT_ASK_BEFORE_SAVING_PDF = true;
export const DEFAULT_PDF_LOCATION = path.join(os.homedir(), "Downloads", "Receipts");

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
    upiId: "",
    upiPayeeName: "",
    printUpiQrOnSales: false,
    printUpiQrOnEstimates: false,
    includeAmountInUpiQr: true
  };
}

export function normalizePrintingConfig(config?: Partial<PrintingConfig>): PrintingConfig {
  const defaultPrintMode = config?.defaultPrintMode;
  return {
    ...getDefaultPrintingConfig(),
    ...config,
    defaultPrintMode:
      defaultPrintMode === "device-text" || defaultPrintMode === "raster"
        ? defaultPrintMode
        : "raster"
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
