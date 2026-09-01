// @vitest-environment jsdom

import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { BillingProductDTO, PrintingConfig, StoreProfile } from "@shared/types";
import { TRANSACTION_TYPE } from "@shared/types";
import { useBillingSessionStore } from "../store/billingSession.store";
import { useBillingTabsStore } from "../store/billingTabs.store";
import useTransaction from "./useTransaction";
import { buildRawReceiptData } from "./useRawReceiptPrint";

const tabId = "exact-total-tab";

const profile: StoreProfile = {
  id: "default",
  storeName: "Exact Totals Store",
  ownerName: "Owner",
  phone: "9999999999",
  email: "owner@example.com",
  addressLine1: "1 Test Road",
  addressLine2: null,
  country: "IN",
  state: "Karnataka",
  pincode: "560001",
  city: "Bengaluru",
  gstin: null,
  createdAt: "2026-08-20T00:00:00.000Z",
  updatedAt: "2026-08-20T00:00:00.000Z"
};

const printing: PrintingConfig = {
  printerName: "",
  defaultPrintMode: "device-text",
  extraFeedLines: 0,
  cutMode: "none",
  showAddress: false,
  showPhone: false,
  showGstinOnSales: false,
  showCustomerName: true,
  showSavings: false,
  savingsThresholdPaisa: 0,
  showLedgerPaymentMode: false,
  showLedgerNotes: false,
  footerMessage: "",
  upiQrProfiles: [],
  defaultUpiQrProfileId: null,
  printUpiQrOnSales: false,
  printUpiQrOnEstimates: false,
  includeAmountInUpiQr: false
};

function product(name: string, price: number): BillingProductDTO {
  return {
    id: crypto.randomUUID(),
    name,
    productSnapshot: `${name} snapshot`,
    weight: null,
    unit: null,
    mrp: price,
    price,
    purchasePrice: null
  };
}

function initializeExactLine() {
  useBillingTabsStore.setState({
    tabs: [
      {
        id: tabId,
        type: TRANSACTION_TYPE.SALE,
        transactionNo: 42,
        routePath: `/billing/sales/${crypto.randomUUID()}/edit`
      }
    ],
    activeTabId: tabId
  });
  const store = useBillingSessionStore.getState();
  store.initSession(tabId);
  store.hydrateSession(tabId, {
    billingType: TRANSACTION_TYPE.SALE,
    billingId: crypto.randomUUID(),
    transactionNo: 42,
    customerId: crypto.randomUUID(),
    customerName: "Anita"
  });
  const rowId = useBillingSessionStore.getState().sessions[tabId]!.lineItems[0]!.rowId;
  store.addLineItem(tabId, rowId, product("Exact ₹152.34 line", 12_345));
  store.updateLineItem(tabId, rowId, "quantity", "1.234");
  return rowId;
}

beforeEach(() => {
  useBillingSessionStore.setState({ sessions: {} });
  useBillingTabsStore.setState({ tabs: [], activeTabId: null });
});

afterEach(() => {
  cleanup();
});

describe("one exact billing total path", () => {
  it("uses 15,234 paisa for the row, footer, and receipt without rounding to ₹152.00", () => {
    const rowId = initializeExactLine();
    const { result } = renderHook(() => useTransaction());
    const session = useBillingSessionStore.getState().sessions[tabId]!;
    const row = session.lineItems.find((item) => item.rowId === rowId)!;
    const receipt = buildRawReceiptData(session, profile, printing);

    expect.soft(row.totalPrice).toBe(15_234);
    expect.soft(result.current.subtotal).toBe("₹152.34");
    expect.soft(result.current.grandTotal).toBe("₹152.34");
    expect.soft(receipt.items[0]?.totalPaisa).toBe(row.totalPrice);
    expect.soft(receipt.subtotalPaisa).toBe(15_234);
    expect.soft(receipt.totalPaisa).toBe(15_234);
  });

  it("excludes deleted and incomplete rows from both amount and quantity", () => {
    initializeExactLine();
    const store = useBillingSessionStore.getState();
    store.addEmptyLineItem(tabId, "button");
    store.addEmptyLineItem(tabId, "button");
    const session = useBillingSessionStore.getState().sessions[tabId]!;
    const deletedRow = session.lineItems[1]!;
    const incompleteRow = session.lineItems[2]!;
    store.addLineItem(tabId, deletedRow.rowId, product("Deleted line", 10_000));
    store.deleteLineItem(tabId, deletedRow.rowId);
    store.addLineItem(tabId, incompleteRow.rowId, product("Incomplete line", 10_000));
    store.updateLineItem(tabId, incompleteRow.rowId, "productSnapshot", "");

    const { result } = renderHook(() => useTransaction());
    const currentSession = useBillingSessionStore.getState().sessions[tabId]!;
    const receipt = buildRawReceiptData(currentSession, profile, printing);

    expect.soft(result.current.subtotal).toBe("₹152.34");
    expect.soft(result.current.grandTotal).toBe("₹152.34");
    expect.soft(result.current.calcTotalQuantity).toBe(1.234);
    expect.soft(receipt.items).toHaveLength(1);
    expect.soft(receipt.totalPaisa).toBe(15_234);
  });
});
