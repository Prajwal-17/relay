import { describe, expect, it } from "vitest";
import type { BillingSessionData } from "@/features/billing/store/billingSession.types";
import {
  createInitialLineItem,
  createInitialSession
} from "@/features/billing/store/billingSession.helpers";
import type { PrintingConfig, StoreProfile } from "@shared/types";
import { buildRawReceiptData, buildRawReceiptPreviewData } from "./useRawReceiptPrint";

const profile: StoreProfile = {
  id: "default",
  storeName: "QuickCart Market",
  ownerName: "Owner",
  phone: "9999999999",
  email: "owner@example.com",
  addressLine1: "12 Market Road",
  addressLine2: "Near Clock Tower",
  country: "IN",
  state: "Karnataka",
  pincode: "560001",
  city: "Bengaluru",
  gstin: "29ABCDE1234F1Z5",
  createdAt: "2026-08-10T00:00:00.000Z",
  updatedAt: "2026-08-10T00:00:00.000Z"
};

const printing: PrintingConfig = {
  printerName: "Everycom EC-801",
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
  upiQrProfiles: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      label: "Primary UPI",
      upiId: "shop@bank",
      payeeName: "QuickCart Market"
    }
  ],
  defaultUpiQrProfileId: "11111111-1111-4111-8111-111111111111",
  printUpiQrOnSales: true,
  printUpiQrOnEstimates: false,
  includeAmountInUpiQr: true
};

function session(type: "sale" | "estimate"): BillingSessionData {
  return {
    ...createInitialSession(),
    billingType: type,
    transactionNo: 42,
    customerName: "Anita",
    lineItems: [
      {
        ...createInitialLineItem(),
        productSnapshot: "Loose rice",
        price: "12.50",
        quantity: "1.25",
        checkedQty: 0.75,
        totalPrice: 1563
      }
    ]
  };
}

describe("RAW receipt data", () => {
  it("applies sale visibility and UPI settings to real synchronized values", () => {
    const data = buildRawReceiptData(session("sale"), profile, {
      ...printing,
      extraFeedLines: 7,
      cutMode: "full",
      showAddress: false,
      showPhone: false
    });

    expect(data).toMatchObject({
      storeName: "QuickCart Market",
      addressLines: [],
      phone: undefined,
      gstin: "29ABCDE1234F1Z5",
      transactionType: "sale",
      transactionNo: 42,
      customerName: "Anita",
      subtotalPaisa: 1563,
      totalPaisa: 1563,
      extraFeedLines: 7,
      cutMode: "full",
      upi: {
        id: "shop@bank",
        payeeName: "QuickCart Market",
        includeAmount: true
      }
    });
    expect(data.items).toEqual([
      {
        name: "Loose rice",
        quantity: "1.25",
        checkedQty: 0.75,
        unitPricePaisa: 1250,
        totalPaisa: 1563,
        mrpPaisa: undefined
      }
    ]);
  });

  it("never includes GSTIN on estimates and follows the estimate QR toggle", () => {
    const withoutQr = buildRawReceiptData(session("estimate"), profile, printing);
    const withQr = buildRawReceiptData(session("estimate"), profile, {
      ...printing,
      printUpiQrOnEstimates: true,
      includeAmountInUpiQr: false
    });

    expect(withoutQr.gstin).toBeUndefined();
    expect(withoutQr.upi).toBeUndefined();
    expect(withQr.gstin).toBeUndefined();
    expect(withQr.upi).toMatchObject({ includeAmount: false });
  });

  it("calculates MRP savings and follows the customer, savings, and threshold settings", () => {
    const sale = session("sale");
    sale.lineItems[0]!.mrp = 1500;

    const shown = buildRawReceiptData(sale, profile, printing);
    const hidden = buildRawReceiptData(sale, profile, {
      ...printing,
      showCustomerName: false,
      showSavings: false
    });
    const belowThreshold = buildRawReceiptData(sale, profile, {
      ...printing,
      savingsThresholdPaisa: 1000
    });

    expect(shown.savingsPaisa).toBe(312);
    expect(shown.items[0]?.mrpPaisa).toBe(1500);
    expect(hidden.customerName).toBe("");
    expect(hidden.savingsPaisa).toBeUndefined();
    expect(belowThreshold.savingsPaisa).toBeUndefined();
  });

  it("builds unsaved thermal previews without weakening print validation", () => {
    const draft = session("sale");
    draft.transactionNo = null;
    draft.lineItems = [];

    const preview = buildRawReceiptPreviewData(draft, profile, {
      ...printing,
      upiQrProfiles: [],
      defaultUpiQrProfileId: null
    });

    expect(preview.transactionNo).toBe(0);
    expect(preview.items).toEqual([]);
    expect(preview.totalPaisa).toBe(0);
    expect(preview.upi).toBeUndefined();
    expect(() => buildRawReceiptData(draft, profile, printing)).toThrow(
      "The bill has not received a transaction number yet."
    );
  });

  it("rejects an enabled QR with incomplete UPI configuration", () => {
    expect(() =>
      buildRawReceiptData(session("sale"), profile, {
        ...printing,
        upiQrProfiles: [],
        defaultUpiQrProfileId: null
      })
    ).toThrow("Add a UPI account in Printing settings.");
  });
});
