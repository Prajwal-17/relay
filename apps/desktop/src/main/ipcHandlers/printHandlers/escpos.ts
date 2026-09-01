import type {
  MonochromeRasterData,
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
  thermalLedgerSummaryLines,
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

function receiptMoney(paisa: number) {
  const amount = paisaToRupeeString(Math.abs(paisa));
  return (paisa < 0 ? "-Rs." : "Rs.") + amount;
}

function accountLine(label: string, paisa: number) {
  return fit(label, 30) + fit(receiptMoney(paisa), 18, "right");
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

export function buildEscPosReceipt(
  receipt: RawReceiptData,
  qrRaster?: MonochromeRasterData
): Buffer {
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
    ...(receipt.accountSettlement
      ? [
          line("-".repeat(LINE_WIDTH)),
          line(accountLine("Previous balance", receipt.accountSettlement.previousBalancePaisa)),
          line(accountLine("Current bill (+)", receipt.accountSettlement.currentBillPaisa)),
          ...(receipt.accountSettlement.paymentPaisa > 0
            ? [line(accountLine("Payment (-)", receipt.accountSettlement.paymentPaisa))]
            : []),
          escPosCommands.boldOn,
          line(accountLine("BALANCE", receipt.accountSettlement.balancePaisa)),
          escPosCommands.boldOff
        ]
      : []),
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

  if (receipt.upi) {
    if (!qrRaster) throw new Error("A freshly generated payment QR raster is required.");
    chunks.push(
      line(),
      escPosCommands.alignCenter,
      buildGsV0Raster(qrRaster),
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

  const summaryLines = thermalLedgerSummaryLines(statement);
  chunks.push(line("-".repeat(LINE_WIDTH)));
  for (const summaryLine of summaryLines.slice(0, -1)) chunks.push(line(summaryLine));
  chunks.push(escPosCommands.boldOn, line(summaryLines.at(-1)!), escPosCommands.boldOff);

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
  statement: RawLedgerStatementData,
  qrRaster?: MonochromeRasterData
): Buffer {
  const receiptPart = buildEscPosReceipt(
    {
      ...receipt,
      footerMessage: undefined,
      extraFeedLines: 0,
      cutMode: "none"
    },
    qrRaster
  );
  const ledgerPart = buildEscPosLedgerStatement({
    ...statement,
    storeName: "",
    addressLines: [],
    phone: undefined
  });

  return Buffer.concat([receiptPart, ledgerPart]);
}

export function buildEscPosRasterReceipt(
  receipt: RawReceiptData,
  raster: RasterReceiptSegments
): Buffer {
  const chunks = [escPosCommands.reset, buildGsV0Raster(raster.body)];
  if (receipt.upi) {
    if (!raster.qr) throw new Error("A freshly generated payment QR raster is required.");
    if (!raster.afterQr) throw new Error("The receipt raster after-QR segment is required.");
    chunks.push(buildGsV0Raster(raster.qr), buildGsV0Raster(raster.afterQr));
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
  if (receipt.upi) {
    if (!receiptRaster.qr) {
      throw new Error("A freshly generated payment QR raster is required.");
    }
    if (!receiptRaster.afterQr) {
      throw new Error("The receipt raster after-QR segment is required.");
    }
    chunks.push(buildGsV0Raster(receiptRaster.qr), buildGsV0Raster(receiptRaster.afterQr));
  }
  chunks.push(
    buildGsV0Raster(ledgerRaster.body),
    paperFinish(statement.extraFeedLines, statement.cutMode)
  );
  return Buffer.concat(chunks);
}
