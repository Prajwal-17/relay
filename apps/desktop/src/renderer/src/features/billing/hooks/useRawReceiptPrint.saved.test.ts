import type { PrintingConfig, StoreProfile, UnifiedTransctionWithItems } from "@shared/types";
import { describe, expect, it } from "vitest";
import { buildRawReceiptDataFromTransaction } from "./useRawReceiptPrint";

const profile: StoreProfile = {
  id: "default",
  storeName: "QuickCart Market",
  ownerName: "Owner",
  phone: "9999999999",
  email: "owner@example.com",
  addressLine1: "12 Market Road",
  addressLine2: null,
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
  printUpiQrOnSales: false,
  printUpiQrOnEstimates: false,
  includeAmountInUpiQr: true
};

function savedTransaction(): UnifiedTransctionWithItems {
  return {
    type: "sale",
    id: "sale-1",
    transactionNo: 73,
    customerId: "customer-1",
    customer: {
      id: "customer-1",
      name: "Anita",
      contact: null,
      customerType: "account",
      notes: null,
      address: null,
      outstandingBalance: 0,
      isArchived: false,
      archivedAt: null
    },
    notes: null,
    grandTotal: 1563,
    totalQuantity: 1250,
    createdAt: "2026-08-12T10:15:00.000Z",
    items: [
      {
        id: "item-1",
        productId: "product-1",
        name: "Current product name",
        productSnapshot: "Historical loose rice · 1 kg",
        weight: "1",
        unit: "kg",
        price: 1250,
        mrp: 1500,
        quantity: 1250,
        totalPrice: 1563,
        purchasePrice: 900,
        checkedQty: 750,
        position: 1
      }
    ]
  };
}

describe("saved transaction receipt data", () => {
  it("normalizes stored paisa and milli-units while preserving the historical snapshot", () => {
    const data = buildRawReceiptDataFromTransaction(savedTransaction(), profile, printing);

    expect(data).toMatchObject({
      transactionType: "sale",
      transactionNo: 73,
      customerName: "Anita",
      dateTime: "2026-08-12T10:15:00.000Z",
      subtotalPaisa: 1563,
      totalPaisa: 1563
    });
    expect(data.items).toEqual([
      {
        name: "Historical loose rice · 1 kg",
        quantity: "1.25",
        checkedQty: 0.75,
        unitPricePaisa: 1250,
        totalPaisa: 1563,
        mrpPaisa: 1500
      }
    ]);
  });

  it("uses the current default UPI profile when a saved bill is reprinted", () => {
    const currentDefault = {
      id: "22222222-2222-4222-8222-222222222222",
      label: "Current default",
      upiId: "current@bank",
      payeeName: "Current Payee"
    };
    const data = buildRawReceiptDataFromTransaction(savedTransaction(), profile, {
      ...printing,
      upiQrProfiles: [...printing.upiQrProfiles, currentDefault],
      defaultUpiQrProfileId: currentDefault.id,
      printUpiQrOnSales: true
    });

    expect(data.upi).toMatchObject({
      id: "current@bank",
      payeeName: "Current Payee"
    });
  });

  it("applies one-time UPI options when printing a saved sale", () => {
    const alternateProfile = {
      id: "22222222-2222-4222-8222-222222222222",
      label: "Counter UPI",
      upiId: "counter@bank",
      payeeName: "QuickCart Counter"
    };
    const data = buildRawReceiptDataFromTransaction(
      savedTransaction(),
      profile,
      {
        ...printing,
        upiQrProfiles: [...printing.upiQrProfiles, alternateProfile]
      },
      {
        includeUpiQr: true,
        includeAmountInUpiQr: false,
        upiQrProfileId: alternateProfile.id
      }
    );

    expect(data.upi).toEqual({
      id: "counter@bank",
      payeeName: "QuickCart Counter",
      includeAmount: false
    });
  });

  it("supports an exact-amount UPI QR when printing a saved estimate", () => {
    const transaction = savedTransaction();
    transaction.type = "estimate";

    const data = buildRawReceiptDataFromTransaction(transaction, profile, printing, {
      includeUpiQr: true,
      includeAmountInUpiQr: true,
      upiQrProfileId: printing.defaultUpiQrProfileId
    });

    expect(data).toMatchObject({
      transactionType: "estimate",
      upi: {
        id: "shop@bank",
        payeeName: "QuickCart Market",
        includeAmount: true
      }
    });
  });

  it("rejects a saved transaction without a valid persisted date", () => {
    const transaction = savedTransaction();
    transaction.createdAt = undefined;

    expect(() => buildRawReceiptDataFromTransaction(transaction, profile, printing)).toThrow(
      "The saved transaction date is unavailable."
    );
  });
});
