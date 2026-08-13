// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import type { PrintingConfig } from "@shared/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
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
  upiId: "shop@bank",
  upiPayeeName: "QuickCart Store",
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
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await user.click(screen.getByRole("tab", { name: "Bills" }));
    expect(screen.getByRole("heading", { name: "Bill details" })).toBeVisible();
    expect(screen.getByRole("switch", { name: "Show customer name" })).toBeVisible();
    expect(screen.getByRole("switch", { name: "Show savings" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Minimum savings" })).toHaveTextContent("Always");
    expect(screen.queryByRole("heading", { name: "Printer" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "UPI QR" }));
    expect(screen.getByRole("heading", { name: "UPI QR" })).toBeVisible();
    expect(screen.getByLabelText("UPI ID")).toBeVisible();
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
