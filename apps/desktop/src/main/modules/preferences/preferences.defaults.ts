import os from "os";
import path from "path";
import type { AppConfig } from "../../../shared/types";

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

export function getDefaultConfig(): AppConfig {
  return {
    billing: { defaultCustomerId: "", searchDropdown: { scale: 1 } },
    exports: getDefaultExportsConfig()
  };
}
