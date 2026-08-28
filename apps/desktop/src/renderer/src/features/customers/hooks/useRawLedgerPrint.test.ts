import { describe, expect, it } from "vitest";
import type { LedgerEntry, LedgerSummary, PrintingConfig, StoreProfile } from "@shared/types";
import { buildRawLedgerStatementData, getPrintedLedgerParticulars } from "./useRawLedgerPrint";

const profile: StoreProfile = {
  id: "store-1",
  storeName: "QuickCart Market",
  ownerName: "Owner",
  phone: "9999999999",
  email: "owner@example.com",
  addressLine1: "12 Market Road",
  addressLine2: "Near Clock Tower",
  country: "India",
  state: "Karnataka",
  pincode: "560001",
  city: "Bengaluru",
  gstin: "29ABCDE1234F1Z5",
  createdAt: "",
  updatedAt: ""
};

const printing: PrintingConfig = {
  printerName: "Everycom",
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
  footerMessage: "Thank you",
  upiQrProfiles: [],
  defaultUpiQrProfileId: null,
  printUpiQrOnSales: false,
  printUpiQrOnEstimates: false,
  includeAmountInUpiQr: true
};

const entries: LedgerEntry[] = [
  {
    id: "entry-1",
    customerId: "customer-1",
    type: "sale",
    saleId: "sale-1",
    invoiceNo: 42,
    amountDue: 51250,
    amountPaid: 0,
    paymentMode: null,
    notes: null,
    runningBalance: 51250,
    createdAt: "2026-08-01T10:30:00.000Z"
  },
  {
    id: "entry-2",
    customerId: "customer-1",
    type: "payment",
    saleId: null,
    invoiceNo: null,
    amountDue: 0,
    amountPaid: 20000,
    paymentMode: "upi",
    notes: "Part payment",
    runningBalance: 31250,
    createdAt: "2026-08-05T09:15:00.000Z"
  }
];

const summary: LedgerSummary = {
  currentBalance: 31250,
  totalDue: 51250,
  totalPaid: 20000,
  openingBalance: 0,
  avgSale: 51250,
  salesCount: 1,
  lastPayment: { amount: 20000, mode: "upi", date: "2026-08-05T09:15:00.000Z" }
};

describe("RAW customer ledger data", () => {
  it("uses Store Profile and complete ledger values with configured details", () => {
    const statement = buildRawLedgerStatementData(
      "Anita",
      entries,
      summary,
      profile,
      printing,
      "2026-08-10T10:00:00.000Z"
    );

    expect(statement).toMatchObject({
      storeName: "QuickCart Market",
      addressLines: ["12 Market Road", "Near Clock Tower", "Bengaluru, Karnataka 560001"],
      phone: "9999999999",
      previousBalancePaisa: 0,
      customerName: "Anita",
      totalDuePaisa: 51250,
      totalPaidPaisa: 20000,
      closingBalancePaisa: 31250,
      extraFeedLines: 4,
      cutMode: "partial",
      footerMessage: "Thank you"
    });
    expect(statement.entries).toEqual([
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
    ]);
  });

  it("prints quick sales as Sale", () => {
    expect(getPrintedLedgerParticulars({ ...entries[0]!, type: "quick_sale" })).toBe("Sale");
  });

  it("omits Store Profile contact details when disabled", () => {
    const statement = buildRawLedgerStatementData("Anita", entries, summary, profile, {
      ...printing,
      showAddress: false,
      showPhone: false,
      showLedgerPaymentMode: false,
      showLedgerNotes: false
    });

    expect(statement.addressLines).toEqual([]);
    expect(statement.phone).toBeUndefined();
  });

  it("uses the selected entries for totals and the ending balance", () => {
    const statement = buildRawLedgerStatementData(
      "Anita",
      entries.slice(1),
      summary,
      profile,
      printing
    );

    expect(statement.previousBalancePaisa).toBe(51250);
    expect(statement.totalDuePaisa).toBe(0);
    expect(statement.totalPaidPaisa).toBe(20000);
    expect(statement.closingBalancePaisa).toBe(31250);
  });
});
