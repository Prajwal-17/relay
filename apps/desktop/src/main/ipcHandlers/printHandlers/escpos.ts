import type {
  RasterLedgerSegments,
  RasterReceiptSegments,
  RawLedgerStatementData,
  RawReceiptData,
  ReceiptCutMode
} from "../../../shared/types";
import {
  buildThermalUpiUri,
  fitThermalText,
  formatThermalReceiptDate,
  receiptDocumentLabel,
  safeThermalText,
  THERMAL_RECEIPT_LINE_WIDTH,
  thermalItemLines,
  thermalLedgerEntryLines,
  wrapThermalText
} from "../../../shared/utils/thermalReceipt";
import { paisaToRupeeString } from "../../../shared/utils/utils";
import { escPosCommands } from "./escposCommands";
import { buildGsV0Raster } from "./raster";

const LINE_WIDTH = THERMAL_RECEIPT_LINE_WIDTH;

function ascii(value: string): Buffer {
  return Buffer.from(safeThermalText(value), "ascii");
}

function line(value = ""): Buffer {
  return Buffer.concat([ascii(value), escPosCommands.lineFeed]);
}

export const wrapText = wrapThermalText;
export const itemLines = thermalItemLines;
const fit = fitThermalText;

function buildNativeQrCode(payload: string): Buffer {
  const data = ascii(payload.trim());
  if (data.length === 0 || data.length > 7_089) {
    throw new Error("QR data must contain between 1 and 7,089 ASCII bytes.");
  }
  return Buffer.concat([
    escPosCommands.qrModel2,
    escPosCommands.qrDotSize6,
    escPosCommands.qrErrorCorrectionMedium,
    escPosCommands.storeQrData(data.length),
    data,
    escPosCommands.printQr
  ]);
}

function paperFinish(extraFeedLines: number, cutMode: ReceiptCutMode): Buffer {
  const chunks: Buffer[] = [];
  if (extraFeedLines > 0) chunks.push(escPosCommands.feedLines(extraFeedLines));
  if (cutMode === "partial") chunks.push(escPosCommands.partialCut);
  if (cutMode === "full") chunks.push(escPosCommands.fullCut);

  return Buffer.concat(chunks);
}

const documentLabel = receiptDocumentLabel;
export const buildUpiUri = buildThermalUpiUri;

export function buildEscPosReceipt(receipt: RawReceiptData): Buffer {
  const chunks: Buffer[] = [
    escPosCommands.reset,
    escPosCommands.alignCenter,
    escPosCommands.boldOn,
    escPosCommands.doubleSizeText
  ];

  for (const storeNameLine of wrapText(receipt.storeName.toUpperCase(), LINE_WIDTH / 2)) {
    chunks.push(line(storeNameLine));
  }
  chunks.push(escPosCommands.normalText, escPosCommands.boldOff);

  for (const addressLine of receipt.addressLines) {
    for (const wrappedLine of wrapText(addressLine, LINE_WIDTH)) chunks.push(line(wrappedLine));
  }

  if (receipt.phone) chunks.push(line(`Phone: ${receipt.phone}`));
  if (receipt.transactionType === "sale" && receipt.gstin) {
    chunks.push(line(`GSTIN: ${receipt.gstin}`));
  }

  const dateText = formatThermalReceiptDate(receipt.dateTime);

  chunks.push(
    escPosCommands.alignLeft,
    line("-".repeat(LINE_WIDTH)),
    line(`${documentLabel(receipt)}: ${receipt.transactionNo}`),
    line("Date: " + dateText),
    ...(receipt.customerName.trim()
      ? wrapText("Customer: " + receipt.customerName, LINE_WIDTH).map((customerLine) =>
          line(customerLine)
        )
      : []),
    line("-".repeat(LINE_WIDTH)),
    escPosCommands.boldOn,
    line(
      `${fit("#", 3)}${fit("ITEM", 22)}${fit("QTY", 6, "right")}${fit("RATE", 8, "right")}${fit("AMT", 9, "right")}`
    ),
    escPosCommands.boldOff,
    line("-".repeat(LINE_WIDTH))
  );

  receipt.items.forEach((item, index) => {
    for (const itemLine of itemLines(index + 1, item)) chunks.push(line(itemLine));
  });

  chunks.push(
    line("-".repeat(LINE_WIDTH)),
    line(`${fit("Subtotal", 39)}${fit(paisaToRupeeString(receipt.subtotalPaisa), 9, "right")}`),
    escPosCommands.boldOn,
    escPosCommands.doubleHeightText,
    line(`${fit("TOTAL", 30)}${fit(`Rs.${paisaToRupeeString(receipt.totalPaisa)}`, 18, "right")}`),
    escPosCommands.normalText,
    escPosCommands.boldOff,
    ...(receipt.savingsPaisa != null && receipt.savingsPaisa > 0
      ? [
          line(),
          escPosCommands.alignCenter,
          escPosCommands.boldOn,
          line("YOU SAVED Rs." + paisaToRupeeString(receipt.savingsPaisa)),
          escPosCommands.boldOff,
          escPosCommands.alignLeft
        ]
      : [])
  );

  const upiUri = buildUpiUri(receipt);
  if (upiUri) {
    chunks.push(
      line(),
      escPosCommands.alignCenter,
      buildNativeQrCode(upiUri),
      line(),
      line("Scan to pay"),
      ...wrapText(receipt.upi?.payeeName ?? "", LINE_WIDTH).map((payeeLine) => line(payeeLine)),
      escPosCommands.alignLeft
    );
  }

  const footerLines = receipt.footerMessage?.trim()
    ? wrapText(receipt.footerMessage, LINE_WIDTH)
    : [];
  if (footerLines.length > 0) {
    chunks.push(line(), escPosCommands.alignCenter, escPosCommands.boldOn);
    for (const footerLine of footerLines) chunks.push(line(footerLine));
    chunks.push(escPosCommands.boldOff);
  }

  chunks.push(paperFinish(receipt.extraFeedLines, receipt.cutMode));
  return Buffer.concat(chunks);
}

export function buildEscPosLedgerStatement(statement: RawLedgerStatementData): Buffer {
  const chunks: Buffer[] = [
    escPosCommands.reset,
    escPosCommands.alignCenter,
    escPosCommands.boldOn,
    escPosCommands.doubleSizeText
  ];

  for (const storeNameLine of wrapText(statement.storeName.toUpperCase(), LINE_WIDTH / 2)) {
    chunks.push(line(storeNameLine));
  }
  chunks.push(escPosCommands.normalText, escPosCommands.boldOff);

  for (const addressLine of statement.addressLines) {
    for (const wrappedLine of wrapText(addressLine, LINE_WIDTH)) chunks.push(line(wrappedLine));
  }
  if (statement.phone) chunks.push(line(`Phone: ${statement.phone}`));

  chunks.push(
    line("-".repeat(LINE_WIDTH)),
    escPosCommands.boldOn,
    line("ACCOUNTS"),
    escPosCommands.boldOff,
    escPosCommands.alignLeft
  );

  for (const customerLine of wrapText(`Customer: ${statement.customerName}`, LINE_WIDTH)) {
    chunks.push(line(customerLine));
  }
  chunks.push(line("-".repeat(LINE_WIDTH)));

  for (const entry of statement.entries) {
    for (const entryLine of thermalLedgerEntryLines(entry)) chunks.push(line(entryLine));
  }

  chunks.push(
    line("-".repeat(LINE_WIDTH)),
    escPosCommands.boldOn,
    line(
      fit("TOTAL AMOUNT", 32) +
        fit("Rs." + paisaToRupeeString(statement.closingBalancePaisa), 16, "right")
    ),
    escPosCommands.boldOff
  );

  const footerLines = statement.footerMessage?.trim()
    ? wrapText(statement.footerMessage, LINE_WIDTH)
    : [];
  if (footerLines.length > 0) {
    chunks.push(line(), escPosCommands.alignCenter, escPosCommands.boldOn);
    for (const footerLine of footerLines) chunks.push(line(footerLine));
    chunks.push(escPosCommands.boldOff);
  }

  chunks.push(paperFinish(statement.extraFeedLines, statement.cutMode));
  return Buffer.concat(chunks);
}

export function buildEscPosReceiptWithLedger(
  receipt: RawReceiptData,
  statement: RawLedgerStatementData
): Buffer {
  const receiptPart = buildEscPosReceipt({
    ...receipt,
    footerMessage: undefined,
    extraFeedLines: 0,
    cutMode: "none"
  });
  const ledgerPart = buildEscPosLedgerStatement({
    ...statement,
    storeName: "",
    addressLines: [],
    phone: undefined
  });

  return Buffer.concat([receiptPart, ledgerPart]);
}

function nativeQrSection(receipt: RawReceiptData): Buffer {
  const upiUri = buildUpiUri(receipt);
  if (!upiUri) return Buffer.alloc(0);
  return Buffer.concat([
    escPosCommands.alignCenter,
    buildNativeQrCode(upiUri),
    escPosCommands.alignLeft
  ]);
}

export function buildEscPosRasterReceipt(
  receipt: RawReceiptData,
  raster: RasterReceiptSegments
): Buffer {
  const chunks = [escPosCommands.reset, buildGsV0Raster(raster.body)];
  const upiUri = buildUpiUri(receipt);
  if (upiUri) {
    if (!raster.afterQr) throw new Error("The receipt raster after-QR segment is required.");
    chunks.push(nativeQrSection(receipt), buildGsV0Raster(raster.afterQr));
  }
  chunks.push(paperFinish(receipt.extraFeedLines, receipt.cutMode));
  return Buffer.concat(chunks);
}

export function buildEscPosRasterLedgerStatement(
  statement: RawLedgerStatementData,
  raster: RasterLedgerSegments
): Buffer {
  return Buffer.concat([
    escPosCommands.reset,
    buildGsV0Raster(raster.body),
    paperFinish(statement.extraFeedLines, statement.cutMode)
  ]);
}

export function buildEscPosRasterReceiptWithLedger(
  receipt: RawReceiptData,
  statement: RawLedgerStatementData,
  receiptRaster: RasterReceiptSegments,
  ledgerRaster: RasterLedgerSegments
): Buffer {
  const chunks = [escPosCommands.reset, buildGsV0Raster(receiptRaster.body)];
  const upiUri = buildUpiUri(receipt);
  if (upiUri) {
    if (!receiptRaster.afterQr) {
      throw new Error("The receipt raster after-QR segment is required.");
    }
    chunks.push(nativeQrSection(receipt), buildGsV0Raster(receiptRaster.afterQr));
  }
  chunks.push(
    buildGsV0Raster(ledgerRaster.body),
    paperFinish(statement.extraFeedLines, statement.cutMode)
  );
  return Buffer.concat(chunks);
}
