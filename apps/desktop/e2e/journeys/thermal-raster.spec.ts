import { test, expect } from "../fixtures/developmentElectron.fixture";
import { writeFile } from "node:fs/promises";
import type {
  MonochromeRasterData,
  RasterReceiptSegments,
  RasterLedgerSegments,
  RawReceiptData,
  RawLedgerStatementData
} from "../../src/shared/types";

test("real screen styles cannot break receipt, fresh QR, or ledger image capture", async ({
  developmentElectron
}, testInfo) => {
  const { page } = developmentElectron;
  const result = await page.evaluate(async () => {
    // Import through the running Vite renderer: mocking html2canvas misses CSS parser failures.
    const modulePath = "/src/features/settings/thermalRaster.tsx";
    const { prepareRasterReceipt, prepareRasterLedger } = (await import(modulePath)) as {
      prepareRasterReceipt: (
        receipt: RawReceiptData,
        options?: { omitFooter?: boolean }
      ) => Promise<RasterReceiptSegments>;
      prepareRasterLedger: (
        statement: RawLedgerStatementData,
        options?: { includeHeader?: boolean }
      ) => Promise<RasterLedgerSegments>;
    };
    // Reproduce the rejected theme's colors even after restoring the old palette.
    // This keeps print isolation covered against future screen-style changes.
    document.body.style.backgroundColor = "oklch(97.4% 0.004 110)";
    document.documentElement.style.setProperty("--border-standard", "oklch(88% 0.012 110)");
    const before = getComputedStyle(document.body).backgroundColor;
    const receipt: RawReceiptData = {
      storeName: "Grocery raster regression",
      addressLines: ["12 Market Road"],
      transactionType: "sale",
      transactionNo: 42,
      customerName: "Sample customer",
      dateTime: "2026-10-03T12:00:00.000Z",
      items: [
        {
          name: "Premium Basmati Rice Extra Long Grain",
          quantity: "2.5",
          checkedQty: 1.5,
          unitPricePaisa: 8500,
          totalPaisa: 21250
        }
      ],
      subtotalPaisa: 21250,
      totalPaisa: 21300,
      extraFeedLines: 3,
      cutMode: "partial",
      footerMessage: "Thank you"
    };
    const statement: RawLedgerStatementData = {
      storeName: receipt.storeName,
      addressLines: [],
      customerName: receipt.customerName,
      generatedAt: receipt.dateTime,
      entries: [
        {
          dateTime: receipt.dateTime,
          particulars: "Sale 42",
          amountDuePaisa: 21300,
          amountPaidPaisa: 0,
          runningBalancePaisa: 21300
        }
      ],
      totalDuePaisa: 21300,
      totalPaidPaisa: 0,
      closingBalancePaisa: 21300,
      extraFeedLines: 3,
      cutMode: "partial"
    };
    const plain = await prepareRasterReceipt(receipt);
    const withQr = await prepareRasterReceipt({
      ...receipt,
      upi: { id: "test@bank", payeeName: "Test store", includeAmount: true }
    });
    const changedQr = await prepareRasterReceipt({
      ...receipt,
      totalPaisa: 10000,
      upi: { id: "test@bank", payeeName: "Test store", includeAmount: true }
    });
    const ledger = await prepareRasterLedger(statement);
    const combinedReceipt = await prepareRasterReceipt(receipt, { omitFooter: true });
    const combinedLedger = await prepareRasterLedger(statement, { includeHeader: false });
    const summarize = (raster: MonochromeRasterData) => {
      const bytes = Uint8Array.from(atob(raster.dataBase64), (c) => c.charCodeAt(0));
      return {
        width: raster.width,
        height: raster.height,
        stride: raster.stride,
        bytes: bytes.length,
        inkBytes: bytes.filter((b) => b !== 0).length,
        whiteBytes: bytes.filter((b) => b === 0).length
      };
    };
    const image = (segments: MonochromeRasterData[]) => {
      const canvas = document.createElement("canvas");
      canvas.width = 576;
      canvas.height = segments.reduce((sum, segment) => sum + segment.height, 0);
      const context = canvas.getContext("2d")!;
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "black";
      let top = 0;
      for (const segment of segments) {
        const bytes = atob(segment.dataBase64);
        for (let y = 0; y < segment.height; y++) {
          for (let x = 0; x < segment.width; x++) {
            if (bytes.charCodeAt(y * segment.stride + Math.floor(x / 8)) & (0x80 >> (x % 8))) {
              context.fillRect(x, top + y, 1, 1);
            }
          }
        }
        top += segment.height;
      }
      return canvas.toDataURL("image/png").split(",")[1]!;
    };
    return {
      receiptImage: image([withQr.body, withQr.qr!, withQr.afterQr!]),
      ledgerImage: image([ledger.body]),
      before,
      after: getComputedStyle(document.body).backgroundColor,
      captures: [
        plain.body,
        withQr.body,
        withQr.qr!,
        withQr.afterQr!,
        ledger.body,
        combinedReceipt.body,
        combinedLedger.body
      ].map(summarize),
      qrChanged: withQr.qr!.dataBase64 !== changedQr.qr!.dataBase64,
      remainingCaptureNodes: document.querySelectorAll(
        "[data-thermal-capture], .html2canvas-container"
      ).length
    };
  });

  await writeFile(testInfo.outputPath("receipt.png"), Buffer.from(result.receiptImage, "base64"));
  await writeFile(testInfo.outputPath("ledger.png"), Buffer.from(result.ledgerImage, "base64"));

  expect(result.before).toContain("oklch");
  expect(result.after).toBe(result.before);
  expect(result.qrChanged).toBe(true);
  expect(result.remainingCaptureNodes).toBe(0);
  for (const capture of result.captures) {
    expect(capture.width).toBe(576);
    expect(capture.stride).toBe(72);
    expect(capture.bytes).toBe(capture.height * 72);
    expect(capture.inkBytes).toBeGreaterThan(100);
    expect(capture.whiteBytes).toBeGreaterThan(100);
  }
});
