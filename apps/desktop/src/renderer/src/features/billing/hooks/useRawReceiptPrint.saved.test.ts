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
  upiId: "shop@bank",
  upiPayeeName: "QuickCart Market",
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

  it("rejects a saved transaction without a valid persisted date", () => {
    const transaction = savedTransaction();
    transaction.createdAt = undefined;

    expect(() => buildRawReceiptDataFromTransaction(transaction, profile, printing)).toThrow(
      "The saved transaction date is unavailable."
    );
  });
});
