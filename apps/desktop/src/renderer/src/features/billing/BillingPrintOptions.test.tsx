// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
      },
      {
        id: "upi-secondary",
        label: "Warehouse counter",
        upiId: "warehouse@bank",
        payeeName: "QuickCart Warehouse"
      },
      {
        id: "upi-long-name",
        label: "Very long billing counter name that must wrap inside the account list",
        upiId: "very-long-upi-account-identifier@bank",
        payeeName: "QuickCart wholesale and distribution counter"
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
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  Element.prototype.scrollIntoView = vi.fn();
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

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("billing receipt QR choices", () => {
  it("maps each illustrated choice to the billing print options", async () => {
    const user = userEvent.setup();
    render(<BillingPrintOptions />);

    const receiptOnlyRadio = screen.getByRole("radio", { name: "No QR: Receipt only" });
    expect(receiptOnlyRadio).toBeChecked();
    expect(receiptOnlyRadio).toHaveClass("absolute", "size-px");
    expect(receiptOnlyRadio).not.toHaveClass("size-full");
    expect(receiptOnlyRadio.closest("label")).toHaveClass("relative", "min-w-0");
    expect(screen.getByRole("group", { name: "Add a payment QR?" })).toHaveClass("min-w-0");

    await user.click(screen.getByRole("radio", { name: "Exact total: ₹0.00" }));
    expect(useBillingSessionStore.getState().sessions[tabId]?.printOptions).toMatchObject({
      includeUpiQr: true,
      includeAmountInUpiQr: true
    });
    expect(screen.getByText("Main counter")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "UPI account" })).toHaveClass(
      "min-w-0",
      "max-w-full",
      "overflow-hidden",
      "whitespace-normal"
    );
    expect(screen.getByText("Main counter")).toHaveClass("whitespace-normal");
    await user.click(screen.getByRole("combobox", { name: "UPI account" }));
    const accountList = screen.getByRole("listbox");
    expect(accountList).toHaveClass("max-h-56");
    expect(accountList.closest("[data-upi-account-picker-inline]")).toBeInTheDocument();
    expect(accountList.closest('[data-slot="popover-content"]')).toBeNull();
    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();
    const longProfile = preferences.printing.upiQrProfiles[2]!;
    const longAccount = screen.getByRole("option", {
      name: /Very long billing counter name that must wrap inside the account list/i
    });
    expect(longAccount).toHaveClass("overflow-hidden");
    expect(longAccount.querySelector(".whitespace-normal")).toBeInTheDocument();
    expect(longAccount).not.toHaveTextContent(longProfile.upiId);
    expect(longAccount).not.toHaveTextContent(longProfile.payeeName);
    await waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
        block: "nearest",
        inline: "nearest"
      });
    });
    await user.click(longAccount);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "UPI account" })).toHaveTextContent(
      longProfile.upiId
    );
    expect(screen.getByRole("combobox", { name: "UPI account" })).toHaveTextContent(
      longProfile.payeeName
    );
    expect(useBillingSessionStore.getState().sessions[tabId]?.printOptions).toMatchObject({
      selectedUpiQrProfileId: "upi-long-name"
    });

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
