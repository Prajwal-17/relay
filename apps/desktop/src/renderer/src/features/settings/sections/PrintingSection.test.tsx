// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import type { PrintingConfig } from "@shared/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PrintingSection } from "./PrintingSection";

const { useAppPreferencesMock, updateConfigMock } = vi.hoisted(() => ({
  useAppPreferencesMock: vi.fn(),
  updateConfigMock: vi.fn()
}));

vi.mock("@/features/preferences/useAppPreferences", () => ({
  useAppPreferences: () => useAppPreferencesMock()
}));

vi.mock("../ThermalReceiptPreview", () => ({
  ThermalReceiptPreview: () => <div data-testid="thermal-receipt-preview" />
}));

const printing: PrintingConfig = {
  printerName: "POS-80-Series",
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
  footerMessage: "Thank you. Visit again.",
  upiQrProfiles: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      label: "Primary UPI",
      upiId: "shop@bank",
      payeeName: "Relay Store"
    }
  ],
  defaultUpiQrProfileId: "11111111-1111-4111-8111-111111111111",
  printUpiQrOnSales: true,
  printUpiQrOnEstimates: false,
  includeAmountInUpiQr: true
};

function TestQueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn()
  });

  useAppPreferencesMock.mockReturnValue({
    config: { printing },
    defaults: undefined,
    isLoading: false,
    isError: false,
    isDefaultsError: false,
    refetch: vi.fn(),
    refetchDefaults: vi.fn(),
    isFetching: false,
    updateConfig: updateConfigMock,
    resetSection: vi.fn(),
    isUpdating: false,
    isResetting: false
  });

  Object.defineProperty(window, "rawPrintApi", {
    configurable: true,
    value: {
      listPrinters: vi.fn().mockResolvedValue({ status: "success", data: [] }),
      printReceipt: vi.fn(),
      printLedger: vi.fn(),
      printReceiptWithLedger: vi.fn()
    }
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("PrintingSection categories", () => {
  it("shows one settings category at a time", async () => {
    const user = userEvent.setup();
    render(<PrintingSection />, { wrapper: TestQueryProvider });

    const tabList = screen.getByRole("tablist", { name: "Printing settings categories" });
    expect(tabList).toHaveClass("w-fit");
    expect(tabList).not.toHaveClass("w-full");
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.queryByRole("tab", { name: "Print format" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Customer ledger" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Printer" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "Printer" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Paper cut" })).toBeVisible();
    expect(screen.getByRole("radio", { name: /Raster quality/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Device text/ })).not.toBeChecked();
    expect(screen.getByText("80 mm · 576 dots · GS v 0")).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Blank lines at end" })).toHaveTextContent(
      "4 lines"
    );
    expect(screen.getByRole("combobox", { name: "Cut type" })).toHaveTextContent("Partial cut");
    expect(screen.queryByRole("heading", { name: "Bill details" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset to defaults" }));
    expect(screen.getByRole("heading", { name: "Reset 16 fields to defaults?" })).toBeVisible();
    expect(
      screen.getByText("This restores every printing option and removes all saved UPI accounts.")
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await user.click(screen.getByRole("tab", { name: "Bills" }));
    expect(screen.getByRole("heading", { name: "Bill details" })).toBeVisible();
    expect(screen.getByRole("switch", { name: "Show customer name" })).toBeVisible();
    expect(screen.getByRole("switch", { name: "Show savings" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Minimum savings" })).toHaveTextContent("Always");
    expect(screen.queryByRole("heading", { name: "Printer" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "UPI QR" }));
    expect(screen.getByRole("heading", { name: "UPI QR" })).toBeVisible();
    expect(screen.getByText("UPI accounts")).toBeVisible();
    const defaultAccount = screen.getByRole("combobox", { name: "Default account" });
    expect(defaultAccount).toHaveTextContent("Primary UPI");
    expect(defaultAccount).not.toHaveTextContent("shop@bank");
    expect(defaultAccount).not.toHaveTextContent("Relay Store");
    expect(screen.getAllByText("shop@bank · Relay Store")[0]).toBeVisible();
    await user.click(defaultAccount);
    const defaultAccountList = screen.getByRole("listbox");
    expect(within(defaultAccountList).getByText("Primary UPI")).toBeVisible();
    expect(within(defaultAccountList).queryByText("shop@bank")).not.toBeInTheDocument();
    expect(within(defaultAccountList).queryByText("Relay Store")).not.toBeInTheDocument();
    await user.click(defaultAccount);
    expect(screen.queryByTestId("upi-open-amount-qr")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add UPI account" }));
    expect(screen.getByRole("dialog", { name: "Add UPI account" })).toBeVisible();
    expect(screen.getByLabelText("Name")).toBeVisible();
    expect(screen.queryByLabelText("Account label")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Account name")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Test Primary UPI QR" }));
    expect(screen.getByRole("dialog", { name: "Test UPI QR" })).toBeVisible();
    expect(screen.getByTestId("upi-open-amount-qr")).toBeInTheDocument();
  });

  it("disables UPI default modes when no account exists", async () => {
    const user = userEvent.setup();
    useAppPreferencesMock.mockReturnValue({
      ...useAppPreferencesMock(),
      config: {
        printing: {
          ...printing,
          upiQrProfiles: [],
          defaultUpiQrProfileId: null
        }
      }
    });
    render(<PrintingSection />, { wrapper: TestQueryProvider });

    await user.click(screen.getByRole("tab", { name: "UPI QR" }));

    expect(screen.getByText("No UPI accounts saved")).toBeVisible();
    const defaultQrMethod = screen.getByRole("combobox", { name: "Default QR method" });
    expect(defaultQrMethod).toBeEnabled();
    expect(defaultQrMethod).toHaveTextContent("No QR");

    defaultQrMethod.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("option", { name: "No QR" })).toBeEnabled();
    expect(screen.getByRole("option", { name: "Open amount" })).toHaveAttribute(
      "data-disabled",
      ""
    );
    expect(screen.getByRole("option", { name: "Fixed amount" })).toHaveAttribute(
      "data-disabled",
      ""
    );
  });

  it("updates one default QR method for new sales and estimates", async () => {
    const user = userEvent.setup();
    render(<PrintingSection />, { wrapper: TestQueryProvider });

    await user.click(screen.getByRole("tab", { name: "UPI QR" }));
    const defaultQrMethod = screen.getByRole("combobox", { name: "Default QR method" });
    expect(defaultQrMethod).toHaveTextContent("Fixed amount");

    defaultQrMethod.focus();
    await user.keyboard("{Enter}{ArrowUp}{Enter}");

    expect(updateConfigMock).toHaveBeenCalledWith({
      printing: {
        printUpiQrOnSales: true,
        printUpiQrOnEstimates: true,
        includeAmountInUpiQr: false
      }
    });
  });

  it("keeps long UPI account details contained in the QR test dialog", async () => {
    const user = userEvent.setup();
    const longProfile = {
      ...printing.upiQrProfiles[0]!,
      label: "MainCounterAccountUsedForEverySaleReceipt",
      upiId: `${"longmerchantidentifier".repeat(4)}@bank`,
      payeeName: "Relay Supermarket Wholesale and Retail Counter Name Used for UPI Payments"
    };
    useAppPreferencesMock.mockReturnValue({
      ...useAppPreferencesMock(),
      config: {
        printing: {
          ...printing,
          upiQrProfiles: [longProfile]
        }
      }
    });
    render(<PrintingSection />, { wrapper: TestQueryProvider });

    await user.click(screen.getByRole("tab", { name: "UPI QR" }));
    await user.click(screen.getByRole("button", { name: `Test ${longProfile.label} QR` }));

    const dialog = screen.getByRole("dialog", { name: "Test UPI QR" });
    expect(within(dialog).getByText(longProfile.upiId)).toBeVisible();
    expect(within(dialog).getByText(longProfile.payeeName)).toBeVisible();
    expect(within(dialog).getByText(longProfile.upiId)).toHaveClass("break-all");
  });

  it("updates the default quality and describes device text mode", async () => {
    const user = userEvent.setup();
    useAppPreferencesMock.mockReturnValue({
      ...useAppPreferencesMock(),
      config: { printing: { ...printing, defaultPrintMode: "device-text" } }
    });
    render(<PrintingSection />, { wrapper: TestQueryProvider });

    expect(screen.getByText("80 mm · Font A · 48 columns")).toBeVisible();
    expect(screen.getByRole("radio", { name: /Device text/ })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: /Raster quality/ }));
    expect(updateConfigMock).toHaveBeenCalledWith({
      printing: { defaultPrintMode: "raster" }
    });
  });
});
