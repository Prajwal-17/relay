import type { WebContents } from "electron";
import type {
  ApiResponse,
  PrintingConfig,
  RawLedgerStatementData,
  RawPrintResult,
  RawReceiptData,
  SystemPrinterInfo
} from "../../../shared/types";
import { preferencesService } from "../../modules/preferences/preferences.service";
import {
  buildEscPosLedgerStatement,
  buildEscPosRasterLedgerStatement,
  buildEscPosRasterReceipt,
  buildEscPosRasterReceiptWithLedger,
  buildEscPosReceipt,
  buildEscPosReceiptWithLedger
} from "./escpos";
import { validateRasterLedgerSegments, validateRasterReceiptSegments } from "./raster";
import { sendRawToWindowsPrinter, validatePrinterName } from "./windowsRawPrinter";

const STORE_ID = "default";

function errorResponse<T>(error: unknown): ApiResponse<T> {
  console.error("Printer operation failed:", error);
  return {
    status: "error",
    error: {
      message: error instanceof Error ? error.message : "Printer operation failed."
    }
  };
}

function isPaisa(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isSignedPaisa(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

async function getConfiguredPrinting(): Promise<{
  printerName: string;
  printing: PrintingConfig;
}> {
  const preferences = await preferencesService.getPreferences(STORE_ID);
  return {
    printerName: validatePrinterName(preferences.config.printing.printerName),
    printing: preferences.config.printing
  };
}

function withReceiptFinishing(receipt: RawReceiptData, printing: PrintingConfig): RawReceiptData {
  return {
    ...receipt,
    extraFeedLines: printing.extraFeedLines,
    cutMode: printing.cutMode
  };
}

function withLedgerFinishing(
  statement: RawLedgerStatementData,
  printing: PrintingConfig
): RawLedgerStatementData {
  return {
    ...statement,
    extraFeedLines: printing.extraFeedLines,
    cutMode: printing.cutMode
  };
}

export function validateRawReceiptData(
  receipt: unknown,
  options: { validateFinishing?: boolean } = {}
): asserts receipt is RawReceiptData {
  if (!receipt || typeof receipt !== "object") {
    throw new Error("Receipt details are required.");
  }

  const value = receipt as Partial<RawReceiptData>;
  if (!value.storeName?.trim()) throw new Error("The receipt store name is required.");
  if (
    !Array.isArray(value.addressLines) ||
    value.addressLines.some((line) => typeof line !== "string")
  ) {
    throw new Error("Receipt address lines are invalid.");
  }
  if (value.transactionType !== "sale" && value.transactionType !== "estimate") {
    throw new Error("The receipt transaction type is invalid.");
  }
  if (!Number.isInteger(value.transactionNo) || (value.transactionNo ?? 0) < 1) {
    throw new Error("A saved transaction number is required before printing.");
  }
  if (typeof value.customerName !== "string") {
    throw new Error("The receipt customer name is required.");
  }
  if (!value.dateTime?.trim()) throw new Error("The receipt date is required.");
  if (!Array.isArray(value.items) || value.items.length === 0) {
    throw new Error("At least one receipt item is required.");
  }
  for (const item of value.items) {
    const quantity = Number(item?.quantity);
    const checkedQuantity = item?.checkedQty ?? 0;
    if (
      !item ||
      !item.name?.trim() ||
      !item.quantity?.trim() ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(checkedQuantity) ||
      checkedQuantity < 0 ||
      checkedQuantity > quantity ||
      !isPaisa(item.unitPricePaisa) ||
      !isPaisa(item.totalPaisa) ||
      (item.mrpPaisa !== undefined && !isPaisa(item.mrpPaisa))
    ) {
      throw new Error("A receipt item is invalid.");
    }
  }
  if (
    !isPaisa(value.subtotalPaisa) ||
    !isPaisa(value.totalPaisa) ||
    (value.savingsPaisa !== undefined && !isPaisa(value.savingsPaisa))
  ) {
    throw new Error("Receipt totals are invalid.");
  }
  if (options.validateFinishing !== false) {
    if (
      !Number.isInteger(value.extraFeedLines) ||
      value.extraFeedLines! < 0 ||
      value.extraFeedLines! > 10
    ) {
      throw new Error("Receipt feed lines must be between 0 and 10.");
    }
    if (value.cutMode !== "partial" && value.cutMode !== "full" && value.cutMode !== "none") {
      throw new Error("The receipt cut mode is invalid.");
    }
  }
  if (
    value.upi &&
    (!value.upi.id?.trim() ||
      !value.upi.payeeName?.trim() ||
      typeof value.upi.includeAmount !== "boolean")
  ) {
    throw new Error("UPI ID and payee name are required when the payment QR is enabled.");
  }
}

export function validateRawLedgerStatementData(
  statement: unknown,
  options: { validateFinishing?: boolean } = {}
): asserts statement is RawLedgerStatementData {
  if (!statement || typeof statement !== "object") {
    throw new Error("Customer ledger details are required.");
  }

  const value = statement as Partial<RawLedgerStatementData>;
  if (!value.storeName?.trim()) throw new Error("The ledger store name is required.");
  if (
    !Array.isArray(value.addressLines) ||
    value.addressLines.some((addressLine) => typeof addressLine !== "string")
  ) {
    throw new Error("Ledger address lines are invalid.");
  }
  if (!value.customerName?.trim()) throw new Error("The ledger customer name is required.");
  if (!value.generatedAt?.trim()) throw new Error("The ledger print date is required.");
  if (!Array.isArray(value.entries) || value.entries.length === 0) {
    throw new Error("The customer has no ledger entries to print.");
  }
  for (const entry of value.entries) {
    if (
      !entry ||
      !entry.dateTime?.trim() ||
      !entry.particulars?.trim() ||
      !isPaisa(entry.amountDuePaisa) ||
      !isPaisa(entry.amountPaidPaisa) ||
      !isSignedPaisa(entry.runningBalancePaisa) ||
      (entry.paymentMode !== undefined && typeof entry.paymentMode !== "string") ||
      (entry.notes !== undefined && typeof entry.notes !== "string")
    ) {
      throw new Error("A customer ledger entry is invalid.");
    }
  }
  if (
    !isPaisa(value.totalDuePaisa) ||
    !isPaisa(value.totalPaidPaisa) ||
    !isSignedPaisa(value.closingBalancePaisa)
  ) {
    throw new Error("Customer ledger totals are invalid.");
  }
  if (options.validateFinishing !== false) {
    if (
      !Number.isInteger(value.extraFeedLines) ||
      value.extraFeedLines! < 0 ||
      value.extraFeedLines! > 10
    ) {
      throw new Error("Ledger feed lines must be between 0 and 10.");
    }
    if (value.cutMode !== "partial" && value.cutMode !== "full" && value.cutMode !== "none") {
      throw new Error("The ledger cut mode is invalid.");
    }
  }
}

export async function listPrinters(sender: WebContents): Promise<ApiResponse<SystemPrinterInfo[]>> {
  try {
    const printers = await sender.getPrintersAsync();
    return {
      status: "success",
      data: printers.map((printer) => ({
        name: printer.name,
        displayName: printer.displayName || printer.name,
        description: printer.description || ""
      }))
    };
  } catch (error) {
    return errorResponse(error);
  }
}

export async function printReceipt(
  receipt: unknown,
  raster: unknown
): Promise<ApiResponse<RawPrintResult>> {
  try {
    validateRawReceiptData(receipt, { validateFinishing: false });
    const { printerName, printing } = await getConfiguredPrinting();
    const authoritativeReceipt = withReceiptFinishing(receipt, printing);
    validateRawReceiptData(authoritativeReceipt);
    let payload: Buffer;
    let modeUsed = printing.defaultPrintMode;
    let fellBack = false;

    if (printing.defaultPrintMode === "device-text") {
      payload = buildEscPosReceipt(authoritativeReceipt);
    } else {
      try {
        validateRasterReceiptSegments(raster, Boolean(authoritativeReceipt.upi));
        payload = buildEscPosRasterReceipt(authoritativeReceipt, raster);
      } catch (error) {
        console.warn("Raster receipt preparation was rejected; using device text.", error);
        payload = buildEscPosReceipt(authoritativeReceipt);
        modeUsed = "device-text";
        fellBack = true;
      }
    }

    const bytesWritten = await sendRawToWindowsPrinter(printerName, payload);
    return { status: "success", data: { bytesWritten, modeUsed, fellBack } };
  } catch (error) {
    return errorResponse(error);
  }
}

export async function printLedger(
  statement: unknown,
  raster: unknown
): Promise<ApiResponse<RawPrintResult>> {
  try {
    validateRawLedgerStatementData(statement, { validateFinishing: false });
    const { printerName, printing } = await getConfiguredPrinting();
    const authoritativeStatement = withLedgerFinishing(statement, printing);
    validateRawLedgerStatementData(authoritativeStatement);
    let payload: Buffer;
    let modeUsed = printing.defaultPrintMode;
    let fellBack = false;

    if (printing.defaultPrintMode === "device-text") {
      payload = buildEscPosLedgerStatement(authoritativeStatement);
    } else {
      try {
        validateRasterLedgerSegments(raster);
        payload = buildEscPosRasterLedgerStatement(authoritativeStatement, raster);
      } catch (error) {
        console.warn("Raster ledger preparation was rejected; using device text.", error);
        payload = buildEscPosLedgerStatement(authoritativeStatement);
        modeUsed = "device-text";
        fellBack = true;
      }
    }

    const bytesWritten = await sendRawToWindowsPrinter(printerName, payload);
    return { status: "success", data: { bytesWritten, modeUsed, fellBack } };
  } catch (error) {
    return errorResponse(error);
  }
}

export async function printReceiptWithLedger(
  receipt: unknown,
  statement: unknown,
  receiptRaster: unknown,
  ledgerRaster: unknown
): Promise<ApiResponse<RawPrintResult>> {
  try {
    validateRawReceiptData(receipt, { validateFinishing: false });
    validateRawLedgerStatementData(statement, { validateFinishing: false });
    const { printerName, printing } = await getConfiguredPrinting();
    const authoritativeReceipt = withReceiptFinishing(receipt, printing);
    const authoritativeStatement = withLedgerFinishing(statement, printing);
    validateRawReceiptData(authoritativeReceipt);
    validateRawLedgerStatementData(authoritativeStatement);
    let payload: Buffer;
    let modeUsed = printing.defaultPrintMode;
    let fellBack = false;

    if (printing.defaultPrintMode === "device-text") {
      payload = buildEscPosReceiptWithLedger(authoritativeReceipt, authoritativeStatement);
    } else {
      try {
        validateRasterReceiptSegments(receiptRaster, Boolean(authoritativeReceipt.upi));
        validateRasterLedgerSegments(ledgerRaster);
        payload = buildEscPosRasterReceiptWithLedger(
          authoritativeReceipt,
          authoritativeStatement,
          receiptRaster,
          ledgerRaster
        );
      } catch (error) {
        console.warn("Combined raster preparation was rejected; using device text.", error);
        payload = buildEscPosReceiptWithLedger(authoritativeReceipt, authoritativeStatement);
        modeUsed = "device-text";
        fellBack = true;
      }
    }

    const bytesWritten = await sendRawToWindowsPrinter(printerName, payload);
    return { status: "success", data: { bytesWritten, modeUsed, fellBack } };
  } catch (error) {
    return errorResponse(error);
  }
}
