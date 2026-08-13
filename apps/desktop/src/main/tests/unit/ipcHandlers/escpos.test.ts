import { describe, expect, it } from "vitest";
import type {
  MonochromeRasterData,
  RawLedgerStatementData,
  RawReceiptData
} from "../../../../shared/types";
import {
  buildEscPosLedgerStatement,
  buildEscPosRasterReceipt,
  buildEscPosRasterReceiptWithLedger,
  buildEscPosReceipt,
  buildEscPosReceiptWithLedger,
  buildUpiUri,
  itemLines,
  wrapText
} from "../../../ipcHandlers/printHandlers/escpos";

const ESC = 0x1b;
const GS = 0x1d;

function receipt(overrides: Partial<RawReceiptData> = {}): RawReceiptData {
  return {
    storeName: "QuickCart Market",
    addressLines: ["12 Market Road", "Bengaluru 560001"],
    phone: "9999999999",
    gstin: "29ABCDE1234F1Z5",
    transactionType: "sale",
    transactionNo: 42,
    customerName: "Anita",
    dateTime: "not-a-date",
    items: [
      {
        name: "Long product name that wraps cleanly",
        quantity: "1.25",
        unitPricePaisa: 1250,
        totalPaisa: 1563
      }
    ],
    subtotalPaisa: 1563,
    totalPaisa: 1563,
    extraFeedLines: 4,
    cutMode: "partial",
    footerMessage: "Thank you. Visit again.",
    ...overrides
  };
}

function statement(overrides: Partial<RawLedgerStatementData> = {}): RawLedgerStatementData {
  return {
    storeName: "QuickCart Market",
    addressLines: ["12 Market Road", "Bengaluru 560001"],
    phone: "9999999999",
    customerName: "Anita",
    generatedAt: "not-a-date",
    entries: [
      {
        dateTime: "2026-08-01T10:30:00.000Z",
        particulars: "Sale",
        amountDuePaisa: 51250,
        amountPaidPaisa: 0,
        runningBalancePaisa: 51250
      },
      {
        dateTime: "2026-08-05T09:15:00.000Z",
        particulars: "Payment",
        amountDuePaisa: 0,
        amountPaidPaisa: 20000,
        runningBalancePaisa: 31250
      }
    ],
    totalDuePaisa: 51250,
    totalPaidPaisa: 20000,
    closingBalancePaisa: 31250,
    extraFeedLines: 4,
    cutMode: "partial",
    footerMessage: "Thank you. Visit again.",
    ...overrides
  };
}

function raster(fill: number): MonochromeRasterData {
  return {
    dataBase64: Buffer.alloc(72, fill).toString("base64"),
    width: 576,
    height: 1,
    stride: 72
  };
}

function occurrences(payload: Buffer, command: Buffer): number {
  let count = 0;
  let offset = 0;
  while ((offset = payload.indexOf(command, offset)) >= 0) {
    count += 1;
    offset += command.length;
  }
  return count;
}

describe("ESC/POS receipt builder", () => {
  it("word-wraps and hard-wraps within the requested width", () => {
    const wrapped = wrapText("Long product name that should wrap cleanly", 12);

    expect(wrapped).toEqual(["Long product", "name that", "should wrap", "cleanly"]);
    expect(wrapped.every((value) => value.length <= 12)).toBe(true);
    expect(wrapped.join(" ")).toBe("Long product name that should wrap cleanly");
    expect(wrapText("123456 78", 6)).toEqual(["123456", "78"]);
    expect(wrapText("ABCDEFGHIJKLMNOP", 6)).toEqual(["ABCDEF", "GHIJKL", "MNOP"]);
    expect(wrapText("AB ABCDEFGHI JK", 4)).toEqual(["AB", "ABCD", "EFGH", "I JK"]);
    expect(wrapText("  alpha   beta\ngamma  ", 10)).toEqual(["alpha beta", "gamma"]);
    expect(wrapText("Save ₹20 today", 10)).toEqual(["Save Rs.20", "today"]);
    expect(wrapText("   ", 48)).toEqual([""]);
    expect(() => wrapText("text", 0)).toThrow("Text width must be a positive integer.");
  });

  it("uses the exact 3 / 22 / 6 / 8 / 9 item columns", () => {
    const lines = itemLines(1, receipt().items[0]!);

    expect(lines).toEqual([
      "1. Long product name that  1.25   12.50    15.63",
      `   wraps cleanly${" ".repeat(32)}`
    ]);
    expect(lines.every((value) => value.length === 48)).toBe(true);
  });

  it("hard-wraps unbroken product names without shifting the numeric columns", () => {
    const lines = itemLines(7, {
      name: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      quantity: "2",
      unitPricePaisa: 1000,
      totalPaisa: 2000
    });

    expect(lines).toHaveLength(2);
    expect(lines.every((value) => value.length === 48)).toBe(true);
    expect(lines.map((value) => value.slice(3, 25).trim())).toEqual([
      "ABCDEFGHIJKLMNOPQRSTUV",
      "WXYZ0123456789"
    ]);
    expect(lines[0]!.slice(25)).toBe("     2   10.00    20.00");
    expect(lines[1]!.slice(25)).toBe(" ".repeat(23));
  });

  it("keeps compatibility-mode bytes unchanged when raster fulfillment metadata is present", () => {
    const original = receipt();
    const withCheckedQuantity = receipt({
      items: original.items.map((item) => ({ ...item, checkedQty: 0.75 }))
    });

    expect(buildEscPosReceipt(withCheckedQuantity)).toEqual(buildEscPosReceipt(original));
  });

  it("centers, bolds, and applies 2x2 sizing to the store name", () => {
    const payload = buildEscPosReceipt(receipt());

    expect(payload.subarray(0, 10)).toEqual(
      Buffer.from([ESC, 0x40, ESC, 0x61, 0x01, ESC, 0x45, 0x01, GS, 0x21])
    );
    expect(payload[10]).toBe(0x11);
    expect(payload.includes(Buffer.from([GS, 0x21, 0x00, ESC, 0x45, 0x00]))).toBe(true);
  });

  it("bolds the item header and bolds/enlarges the total", () => {
    const payload = buildEscPosReceipt(receipt());
    const header = Buffer.from("#  ITEM                     QTY    RATE      AMT\n", "ascii");

    expect(payload.includes(Buffer.concat([Buffer.from([ESC, 0x45, 0x01]), header]))).toBe(true);
    expect(payload.includes(Buffer.from([ESC, 0x45, 0x01, GS, 0x21, 0x01]))).toBe(true);
  });

  it("uses sale and estimate labels and never prints GSTIN on estimates", () => {
    const saleText = buildEscPosReceipt(receipt()).toString("ascii");
    const estimateText = buildEscPosReceipt(receipt({ transactionType: "estimate" })).toString(
      "ascii"
    );

    expect(saleText).toContain("Invoice no: 42");
    expect(saleText).toContain("GSTIN: 29ABCDE1234F1Z5");
    expect(estimateText).toContain("Estimate no: 42");
    expect(estimateText).not.toContain("GSTIN:");
  });

  it("prints a native size-6, error-correction-M QR only when UPI is configured", () => {
    const withoutQr = buildEscPosReceipt(receipt());
    const withQr = buildEscPosReceipt(
      receipt({
        upi: { id: "shop@bank", payeeName: "QuickCart Market", includeAmount: true }
      })
    );

    expect(withoutQr.includes(Buffer.from([GS, 0x28, 0x6b]))).toBe(false);
    expect(withQr.includes(Buffer.from([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06]))).toBe(true);
    expect(withQr.includes(Buffer.from([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31]))).toBe(true);
    expect(withQr.toString("ascii")).toContain("Scan to pay\nQuickCart Market");
  });

  it("includes or omits the exact two-decimal UPI amount", () => {
    const withAmount = receipt({
      totalPaisa: 1563,
      upi: { id: "shop@bank", payeeName: "QuickCart Market", includeAmount: true }
    });
    const withoutAmount = receipt({
      upi: { id: "shop@bank", payeeName: "QuickCart Market", includeAmount: false }
    });

    expect(buildUpiUri(withAmount)).toBe(
      "upi://pay?pa=shop%40bank&pn=QuickCart%20Market&cu=INR&tr=42&tn=Invoice%20no%2042&am=15.63"
    );
    expect(buildUpiUri(withoutAmount)).not.toContain("&am=");
  });

  it("prints savings and can hide the customer name", () => {
    const text = buildEscPosReceipt(receipt({ customerName: "", savingsPaisa: 313 })).toString(
      "ascii"
    );

    expect(text).not.toContain("Customer:");
    expect(text).toContain("YOU SAVED Rs.3.13");
  });

  it("replaces unsupported RAW text safely and prints rupees as Rs.", () => {
    const text = buildEscPosReceipt(receipt({ footerMessage: "Pay ₹10 — धन्यवाद" })).toString(
      "ascii"
    );

    expect(text).toContain("Pay Rs.10 ? ???????");
    expect(text).not.toContain("₹");
  });

  it("uses the configured feed lines and cut mode", () => {
    const partial = buildEscPosReceipt(receipt());
    expect(partial.subarray(-6)).toEqual(Buffer.from([ESC, 0x64, 0x04, GS, 0x56, 0x01]));

    const full = buildEscPosReceipt(receipt({ extraFeedLines: 7, cutMode: "full" }));
    expect(full.subarray(-6)).toEqual(Buffer.from([ESC, 0x64, 0x07, GS, 0x56, 0x00]));

    const noCut = buildEscPosReceipt(receipt({ extraFeedLines: 2, cutMode: "none" }));
    expect(noCut.subarray(-3)).toEqual(Buffer.from([ESC, 0x64, 0x02]));
    expect(noCut.includes(Buffer.from([GS, 0x56]))).toBe(false);
  });

  it("builds one continuous bill-and-ledger job with one finish", () => {
    const payload = buildEscPosReceiptWithLedger(receipt(), statement());
    const text = payload.toString("ascii");
    const cut = Buffer.from([GS, 0x56, 0x01]);

    expect(text.indexOf("Invoice no: 42")).toBeLessThan(text.indexOf("ACCOUNTS"));
    expect(payload.indexOf(cut)).toBe(payload.lastIndexOf(cut));
    expect(payload.subarray(-6)).toEqual(Buffer.from([ESC, 0x64, 0x04, GS, 0x56, 0x01]));
  });
});

describe("ESC/POS customer ledger builder", () => {
  it("prints only a readable date, entry type, and amount", () => {
    const payload = buildEscPosLedgerStatement(statement());
    const text = payload.toString("ascii");
    const lines = text.split("\n");

    expect(payload.subarray(0, 11)).toEqual(
      Buffer.from([ESC, 0x40, ESC, 0x61, 0x01, ESC, 0x45, 0x01, GS, 0x21, 0x11])
    );
    expect(text).toContain("ACCOUNTS");
    expect(text).toContain("Customer: Anita");
    expect(lines).toContain("01 Aug 2026");
    expect(lines).toContain("Sale".padEnd(32) + "Rs.512.50".padStart(16));
    expect(lines).toContain("05 Aug 2026");
    expect(lines).toContain("Payment".padEnd(32) + "Rs.200".padStart(16));
    expect(text).not.toContain("Invoice no");
    expect(text).not.toContain("Quick sale");
    expect(text).not.toContain("Mode:");
    expect(text).not.toContain("Note:");
    expect(text).not.toContain("PARTICULARS");
  });

  it("bolds the statement heading, balance, and footer", () => {
    const payload = buildEscPosLedgerStatement(statement());
    const heading = Buffer.from("ACCOUNTS\n", "ascii");

    expect(payload.includes(Buffer.concat([Buffer.from([ESC, 0x45, 0x01]), heading]))).toBe(true);
    expect(payload.toString("ascii")).toContain("TOTAL AMOUNT");
    expect(payload.toString("ascii")).not.toContain("Total sales");
    expect(payload.toString("ascii")).not.toContain("Total paid");
    expect(payload.toString("ascii")).toContain("Thank you. Visit again.");
  });

  it("uses the configured feed and cut and safely replaces unsupported text", () => {
    const payload = buildEscPosLedgerStatement(
      statement({
        customerName: "Anita ₹ —",
        extraFeedLines: 6,
        cutMode: "full"
      })
    );

    expect(payload.toString("ascii")).toContain("Customer: Anita Rs. ?");
    expect(payload.subarray(-6)).toEqual(Buffer.from([ESC, 0x64, 0x06, GS, 0x56, 0x00]));
  });
});

describe("hybrid GS v 0 jobs", () => {
  const rasterHeader = Buffer.from([GS, 0x76, 0x30, 0x00, 72, 0, 1, 0]);
  const qrCommand = Buffer.from([GS, 0x28, 0x6b]);

  it("prints a raster receipt without QR commands when UPI is disabled", () => {
    const payload = buildEscPosRasterReceipt(receipt(), { body: raster(0x11) });

    expect(payload.includes(rasterHeader)).toBe(true);
    expect(payload.includes(qrCommand)).toBe(false);
    expect(payload.includes(Buffer.from([0x89, 0x50, 0x4e, 0x47]))).toBe(false);
    expect(occurrences(payload, Buffer.from([GS, 0x56, 0x01]))).toBe(1);
  });

  it("places native QR commands between body and after-QR raster segments", () => {
    const withUpi = receipt({
      upi: { id: "shop@bank", payeeName: "QuickCart Market", includeAmount: true }
    });
    const payload = buildEscPosRasterReceipt(withUpi, {
      body: raster(0x11),
      afterQr: raster(0x22)
    });
    const bodyIndex = payload.indexOf(rasterHeader);
    const qrIndex = payload.indexOf(qrCommand);
    const afterQrIndex = payload.indexOf(rasterHeader, bodyIndex + rasterHeader.length);

    expect(bodyIndex).toBeGreaterThanOrEqual(0);
    expect(qrIndex).toBeGreaterThan(bodyIndex);
    expect(afterQrIndex).toBeGreaterThan(qrIndex);
    expect(occurrences(payload, Buffer.from([ESC, 0x64, 0x04]))).toBe(1);
    expect(occurrences(payload, Buffer.from([GS, 0x56, 0x01]))).toBe(1);
  });

  it("prints receipt and ledger rasters in order with one final feed and cut", () => {
    const receiptBody = raster(0x33);
    const ledgerBody = raster(0x44);
    const payload = buildEscPosRasterReceiptWithLedger(
      receipt(),
      statement({ cutMode: "full" }),
      { body: receiptBody },
      { body: ledgerBody }
    );
    const firstRaster = payload.indexOf(Buffer.alloc(72, 0x33));
    const secondRaster = payload.indexOf(Buffer.alloc(72, 0x44));

    expect(firstRaster).toBeGreaterThanOrEqual(0);
    expect(secondRaster).toBeGreaterThan(firstRaster);
    expect(occurrences(payload, Buffer.from([ESC, 0x64, 0x04]))).toBe(1);
    expect(occurrences(payload, Buffer.from([GS, 0x56, 0x00]))).toBe(1);
    expect(payload.subarray(-6)).toEqual(Buffer.from([ESC, 0x64, 0x04, GS, 0x56, 0x00]));
  });
});
