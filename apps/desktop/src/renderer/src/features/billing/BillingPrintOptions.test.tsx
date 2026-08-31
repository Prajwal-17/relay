// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TRANSACTION_TYPE } from "@shared/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BillingPrintOptions } from "./BillingPrintOptions";
import { useBillingSessionStore } from "./store/billingSession.store";
import { useBillingTabsStore } from "./store/billingTabs.store";

const tabId = "visual-print-options";

const preferences = vi.hoisted(() => ({
  billing: { defaultCustomerId: "default-customer" },
  printing: {
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
    upiQrProfiles: [
      {
        id: "upi-primary",
        label: "Main counter",
        upiId: "shop@bank",
        payeeName: "QuickCart"
      }
    ],
    defaultUpiQrProfileId: "upi-primary",
    printUpiQrOnSales: false,
    printUpiQrOnEstimates: false,
    includeAmountInUpiQr: true
  }
}));

vi.mock("@/features/preferences/useAppPreferences", () => ({
  useAppPreferences: () => ({ config: preferences, defaults: undefined })
}));

vi.mock("@/features/customers/hooks/useCustomerLedger", () => ({
  useCustomerLedgerSummary: () => ({ summary: null })
}));

beforeEach(() => {
  useBillingSessionStore.setState({ sessions: {} });
  useBillingTabsStore.setState({
    tabs: [
      {
        id: tabId,
        type: TRANSACTION_TYPE.SALE,
        transactionNo: null,
        routePath: "/billing/sales/new"
      }
    ],
    activeTabId: tabId
  });
  useBillingSessionStore.getState().initSession(tabId);
});

afterEach(() => cleanup());

describe("billing receipt QR choices", () => {
  it("maps each illustrated choice to the billing print options", async () => {
    const user = userEvent.setup();
    render(<BillingPrintOptions />);

    expect(screen.getByRole("radio", { name: "No QR: Receipt only" })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "Exact total: ₹0.00" }));
    expect(useBillingSessionStore.getState().sessions[tabId]?.printOptions).toMatchObject({
      includeUpiQr: true,
      includeAmountInUpiQr: true
    });
    expect(screen.getByText("Main counter")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Open amount: Enter amount" }));
    expect(useBillingSessionStore.getState().sessions[tabId]?.printOptions).toMatchObject({
      includeUpiQr: true,
      includeAmountInUpiQr: false
    });

    await user.click(screen.getByRole("radio", { name: "No QR: Receipt only" }));
    expect(useBillingSessionStore.getState().sessions[tabId]?.printOptions).toMatchObject({
      includeUpiQr: false,
      includeAmountInUpiQr: false
    });
  });
});
