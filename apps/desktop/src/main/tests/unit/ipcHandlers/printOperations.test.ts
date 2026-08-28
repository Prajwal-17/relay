import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  PrintingConfig,
  RawLedgerStatementData,
  RawReceiptData
} from "../../../../shared/types";

const mocks = vi.hoisted(() => ({
  getPreferences: vi.fn(),
  sendRaw: vi.fn()
}));

vi.mock("../../../modules/preferences/preferences.service", () => ({
  preferencesService: { getPreferences: mocks.getPreferences }
}));

vi.mock("../../../ipcHandlers/printHandlers/windowsRawPrinter", async () => {
  const actual = await vi.importActual<
    typeof import("../../../ipcHandlers/printHandlers/windowsRawPrinter")
  >("../../../ipcHandlers/printHandlers/windowsRawPrinter");
  return {
    ...actual,
    sendRawToWindowsPrinter: mocks.sendRaw
  };
});

import {
  printLedger,
  printReceipt,
  printReceiptWithLedger
} from "../../../ipcHandlers/printHandlers/printOperations";

function printing(overrides: Partial<PrintingConfig> = {}): PrintingConfig {
  return {
    printerName: "Persisted POS Printer",
    defaultPrintMode: "raster",
    extraFeedLines: 6,
    cutMode: "full",
    showAddress: true,
    showPhone: true,
    showGstinOnSales: true,
    showCustomerName: true,
    showSavings: true,
    savingsThresholdPaisa: 0,
    showLedgerPaymentMode: true,
    showLedgerNotes: true,
    footerMessage: "Thank you",
    upiQrProfiles: [],
    defaultUpiQrProfileId: null,
    printUpiQrOnSales: false,
    printUpiQrOnEstimates: false,
    includeAmountInUpiQr: true,
    ...overrides
  };
}

function receipt(): RawReceiptData {
  return {
    storeName: "QuickCart Market",
    addressLines: [],
    transactionType: "sale",
    transactionNo: 42,
    customerName: "Anita",
    dateTime: "2026-08-10T10:00:00.000Z",
    items: [
      {
        name: "Rice",
        quantity: "1",
        unitPricePaisa: 1000,
        totalPaisa: 1000
      }
    ],
    subtotalPaisa: 1000,
    totalPaisa: 1000,
    extraFeedLines: 0,
    cutMode: "none"
  };
}

function statement(): RawLedgerStatementData {
  return {
    storeName: "QuickCart Market",
    addressLines: [],
    customerName: "Anita",
    generatedAt: "2026-08-10T10:00:00.000Z",
    entries: [
      {
        dateTime: "2026-08-10T10:00:00.000Z",
        particulars: "Sale",
        amountDuePaisa: 1000,
        amountPaidPaisa: 0,
        runningBalancePaisa: 1000
      }
    ],
    totalDuePaisa: 1000,
    totalPaidPaisa: 0,
    closingBalancePaisa: 1000,
    extraFeedLines: 0,
    cutMode: "none"
  };
}

function raster(fill = 0x11) {
  return {
    body: {
      dataBase64: Buffer.alloc(72, fill).toString("base64"),
      width: 576,
      height: 1,
      stride: 72
    }
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.sendRaw.mockResolvedValue(512);
  mocks.getPreferences.mockResolvedValue({
    config: { printing: printing() }
  });
});

describe("authoritative RAW print operations", () => {
  it("uses the persisted printer, raster mode, feed, and cut", async () => {
    const rendererReceipt = {
      ...receipt(),
      extraFeedLines: 99,
      cutMode: "renderer-value"
    };
    const result = await printReceipt(rendererReceipt, raster());

    expect(result).toEqual({
      status: "success",
      data: { bytesWritten: 512, modeUsed: "raster", fellBack: false }
    });
    expect(mocks.sendRaw).toHaveBeenCalledTimes(1);
    const [printerName, payload] = mocks.sendRaw.mock.calls[0] as [string, Buffer];
    expect(printerName).toBe("Persisted POS Printer");
    expect(payload.includes(Buffer.from([0x1d, 0x76, 0x30, 0x00]))).toBe(true);
    expect(payload.subarray(-6)).toEqual(Buffer.from([0x1b, 0x64, 0x06, 0x1d, 0x56, 0x00]));
  });

  it("uses device text and ignores raster data when persisted mode requires it", async () => {
    mocks.getPreferences.mockResolvedValue({
      config: { printing: printing({ defaultPrintMode: "device-text" }) }
    });
    const result = await printReceipt(receipt(), { malformed: true });

    expect(result).toMatchObject({
      status: "success",
      data: { modeUsed: "device-text", fellBack: false }
    });
    const payload = mocks.sendRaw.mock.calls[0]![1] as Buffer;
    expect(payload.includes(Buffer.from([0x1d, 0x76, 0x30, 0x00]))).toBe(false);
    expect(payload.toString("ascii")).toContain("Invoice no: 42");
  });

  it("rejects checked quantities outside the item quantity before transport", async () => {
    const invalidReceipt = receipt();
    invalidReceipt.items[0] = { ...invalidReceipt.items[0]!, checkedQty: 2 };

    const result = await printReceipt(invalidReceipt, raster());

    expect(result).toEqual({
      status: "error",
      error: { message: "A receipt item is invalid." }
    });
    expect(mocks.sendRaw).not.toHaveBeenCalled();
  });

  it.each([
    ["missing", undefined],
    ["invalid", { body: { ...raster().body, width: 575 } }]
  ])("falls back before transport for %s receipt raster data", async (_label, value) => {
    const result = await printReceipt(receipt(), value);

    expect(result).toMatchObject({
      status: "success",
      data: { modeUsed: "device-text", fellBack: true }
    });
    expect(mocks.sendRaw).toHaveBeenCalledTimes(1);
    expect((mocks.sendRaw.mock.calls[0]![1] as Buffer).toString("ascii")).toContain(
      "Invoice no: 42"
    );
  });

  it("falls back the complete combined job when either raster document is unavailable", async () => {
    const result = await printReceiptWithLedger(receipt(), statement(), raster(), undefined);

    expect(result).toMatchObject({
      status: "success",
      data: { modeUsed: "device-text", fellBack: true }
    });
    const text = (mocks.sendRaw.mock.calls[0]![1] as Buffer).toString("ascii");
    expect(text).toContain("Invoice no: 42");
    expect(text).toContain("ACCOUNTS");
    expect(mocks.sendRaw).toHaveBeenCalledTimes(1);
  });

  it("prints a validated ledger raster in raster mode", async () => {
    const result = await printLedger(statement(), raster(0x22));
    expect(result).toMatchObject({
      status: "success",
      data: { modeUsed: "raster", fellBack: false }
    });
  });

  it("does not retry after Windows transport starts", async () => {
    mocks.sendRaw.mockRejectedValueOnce(new Error("Windows spooler rejected the job."));
    const result = await printReceipt(receipt(), raster());

    expect(result).toMatchObject({
      status: "error",
      error: { message: "Windows spooler rejected the job." }
    });
    expect(mocks.sendRaw).toHaveBeenCalledTimes(1);
  });
});
