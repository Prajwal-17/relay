// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { apiClient } from "@/lib/apiClient";
import type { PrintingConfig, StoreProfile } from "@shared/types";
import { formatReceiptQuantity, thermalItemLines } from "@shared/utils/thermalReceipt";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DeviceTextReceiptPaper,
  DeviceTextReceiptWithLedgerPaper,
  ThermalReceiptPreview
} from "./ThermalReceiptPreview";
import { buildThermalPreviewLedger, buildThermalPreviewReceipt } from "./thermalReceiptPreviewData";

vi.mock("@/lib/apiClient", () => ({
  apiClient: {
    get: vi.fn()
  }
}));

const profile: StoreProfile = {
  id: "store-1",
  storeName: "QuickCart Test Store",
  ownerName: "Owner",
  phone: "9876543210",
  email: "owner@example.com",
  addressLine1: "12 Market Road",
  addressLine2: "Near Clock Tower",
  country: "India",
  state: "Karnataka",
  pincode: "560001",
  city: "Bengaluru",
  gstin: "29ABCDE1234F1Z5",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

const printing: PrintingConfig = {
  printerName: "Everycom EC-801",
  defaultPrintMode: "device-text",
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
      payeeName: "QuickCart Test Store"
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      label: "Owner UPI",
      upiId: "owner@bank",
      payeeName: "Store Owner"
    }
  ],
  defaultUpiQrProfileId: "22222222-2222-4222-8222-222222222222",
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

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("thermal receipt settings preview", () => {
  it("prints fractional quantities without redundant zeroes", () => {
    expect(formatReceiptQuantity(".500")).toBe("0.5");
    expect(formatReceiptQuantity("0.500")).toBe("0.5");
    expect(formatReceiptQuantity("1.000")).toBe("1");
    expect(formatReceiptQuantity("1.250")).toBe("1.25");
    const itemLine = thermalItemLines(1, {
      name: "Loose item",
      quantity: ".500",
      unitPricePaisa: 1000,
      totalPaisa: 500
    })[0]!;
    expect(itemLine).toContain("   0.5");
    expect(itemLine).not.toContain(".00");
  });

  it("builds sample data with the same visibility and UPI rules as production", () => {
    const sale = buildThermalPreviewReceipt(profile, printing, "sale", "2026-08-10T10:30:00.000Z");
    const estimate = buildThermalPreviewReceipt(
      profile,
      printing,
      "estimate",
      "2026-08-10T10:30:00.000Z"
    );

    expect(sale.addressLines).toEqual([
      "12 Market Road",
      "Near Clock Tower",
      "Bengaluru, Karnataka 560001"
    ]);
    expect(sale.phone).toBe("9876543210");
    expect(sale.gstin).toBe("29ABCDE1234F1Z5");
    expect(sale.extraFeedLines).toBe(4);
    expect(sale.cutMode).toBe("partial");
    expect(sale.customerName).toBe("Sample customer");
    expect(sale.savingsPaisa).toBe(5850);
    expect(sale.upi).toEqual({
      id: "owner@bank",
      payeeName: "Store Owner",
      includeAmount: true
    });
    expect(estimate.gstin).toBeUndefined();
    expect(estimate.upi).toBeUndefined();
    expect(
      buildThermalPreviewReceipt(profile, { ...printing, savingsThresholdPaisa: 10_000 }, "sale")
        .savingsPaisa
    ).toBeUndefined();
  });

  it("renders previous balance, current bill, payment, and remaining balance", () => {
    const receipt = {
      ...buildThermalPreviewReceipt(profile, { ...printing, printUpiQrOnSales: false }, "sale"),
      subtotalPaisa: 200000,
      totalPaisa: 200000,
      accountSettlement: {
        previousBalancePaisa: 500000,
        currentBillPaisa: 200000,
        totalDuePaisa: 700000,
        paymentPaisa: 300000,
        balancePaisa: 400000
      }
    };

    render(<DeviceTextReceiptPaper receipt={receipt} />);

    const paper = screen.getByTestId("thermal-receipt-paper");
    expect(paper).toHaveTextContent("Previous balance");
    expect(paper).toHaveTextContent("Rs.5000");
    expect(paper).toHaveTextContent("Current bill");
    expect(paper).toHaveTextContent("Rs.2000");
    expect(paper).not.toHaveTextContent("Total due");
    expect(paper).toHaveTextContent("Payment (-)");
    expect(paper).toHaveTextContent("Rs.3000");
    expect(paper).toHaveTextContent("BALANCE");
    expect(paper).toHaveTextContent("Rs.4000");
  });

  it("omits the payment row when the customer account has no payment", () => {
    const receipt = {
      ...buildThermalPreviewReceipt(profile, { ...printing, printUpiQrOnSales: false }, "sale"),
      accountSettlement: {
        previousBalancePaisa: 500000,
        currentBillPaisa: 200000,
        totalDuePaisa: 700000,
        paymentPaisa: 0,
        balancePaisa: 700000
      }
    };

    render(<DeviceTextReceiptPaper receipt={receipt} />);

    expect(screen.getByTestId("thermal-receipt-paper")).not.toHaveTextContent("Payment (-)");
  });

  it("renders a combined device paper with finishing only after the ledger", () => {
    const receipt = buildThermalPreviewReceipt(profile, printing, "sale");
    const statement = buildThermalPreviewLedger(profile, printing);
    render(<DeviceTextReceiptWithLedgerPaper receipt={receipt} statement={statement} />);

    expect(screen.getByTestId("thermal-receipt-with-ledger-paper")).toBeInTheDocument();
    expect(screen.getByText("ACCOUNTS")).toBeInTheDocument();
    expect(screen.getAllByText("Thank you. Visit again.")).toHaveLength(1);
    expect(screen.getByTestId("thermal-receipt-feed")).toHaveAttribute(
      "aria-label",
      "0 extra feed lines"
    );
    expect(screen.getByTestId("thermal-ledger-feed")).toHaveAttribute(
      "aria-label",
      "4 extra feed lines"
    );
    expect(screen.getAllByLabelText("partial cut")).toHaveLength(1);
  });

  it("uses sample shop values only for missing Store Profile fields", () => {
    const receipt = buildThermalPreviewReceipt(
      {
        ...profile,
        storeName: "",
        phone: "",
        addressLine1: "",
        addressLine2: null,
        city: "",
        state: "",
        pincode: "",
        gstin: null
      },
      printing,
      "sale",
      "2026-08-10T10:30:00.000Z"
    );

    expect(receipt.storeName).toBe("Your Store Name");
    expect(receipt.addressLines).toEqual(["12 Market Road", "Bengaluru, Karnataka 560001"]);
    expect(receipt.phone).toBe("9876543210");
    expect(receipt.gstin).toBe("29ABCDE1234F1Z5");
  });

  it("keeps the preview inactive until opened and switches the preview document", async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.get).mockResolvedValue(profile);

    render(<ThermalReceiptPreview printing={printing} />, { wrapper: TestQueryProvider });

    expect(screen.queryByTestId("thermal-receipt-paper")).not.toBeInTheDocument();
    expect(apiClient.get).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Open preview" }));

    const paper = await screen.findByTestId("thermal-receipt-paper");
    expect(screen.getByRole("dialog", { name: "Receipt preview" })).toBeVisible();
    expect(screen.getByText("Device text")).toBeVisible();
    expect(screen.getByText("Font A · 48 columns")).toBeVisible();
    expect(paper).toHaveTextContent("Invoice no: 1048");
    expect(paper).toHaveTextContent("GSTIN: 29ABCDE1234F1Z5");
    expect(paper).toHaveTextContent("YOU SAVED Rs.58.50");
    expect(screen.getByTestId("thermal-receipt-feed")).toHaveAttribute(
      "aria-label",
      "4 extra feed lines"
    );
    expect(screen.getByTestId("thermal-receipt-cut")).toHaveAttribute("aria-label", "partial cut");
    expect(paper.textContent).toContain(
      thermalItemLines(1, {
        name: "Premium Basmati Rice Extra Long Grain",
        quantity: "2.5",
        unitPricePaisa: 8500,
        totalPaisa: 21250
      })[0]
    );
    expect(screen.getByTitle("Sample UPI payment QR")).toBeInTheDocument();
    expect(paper).toHaveTextContent("Scan to pay");
    expect(paper).toHaveTextContent("Store Owner");

    await user.click(screen.getByRole("button", { name: "Estimate" }));

    await waitFor(() => expect(paper).toHaveTextContent("Estimate no: 1048"));
    expect(paper).not.toHaveTextContent("GSTIN:");
    expect(screen.queryByTitle("Sample UPI payment QR")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ledger" }));

    const ledgerPaper = await screen.findByTestId("thermal-ledger-paper");
    expect(ledgerPaper).toHaveTextContent("ACCOUNTS");
    expect(ledgerPaper).toHaveTextContent("Sample customer");
    expect(ledgerPaper).toHaveTextContent("01 Aug 2026");
    expect(ledgerPaper).toHaveTextContent("Sale");
    expect(ledgerPaper).toHaveTextContent("Payment");
    expect(ledgerPaper).not.toHaveTextContent("Invoice no");
    expect(ledgerPaper).not.toHaveTextContent("Mode:");
    expect(ledgerPaper).toHaveTextContent("PREVIOUS BALANCE");
    expect(ledgerPaper).toHaveTextContent("CHARGES");
    expect(ledgerPaper).toHaveTextContent("PAYMENTS");
    expect(ledgerPaper).toHaveTextContent("BALANCE");
  });

  it("shows extra feed spacing and omits the cut guide when cutting is disabled", async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.get).mockResolvedValue(profile);
    render(
      <ThermalReceiptPreview printing={{ ...printing, extraFeedLines: 0, cutMode: "none" }} />,
      { wrapper: TestQueryProvider }
    );
    await user.click(screen.getByRole("button", { name: "Open preview" }));

    expect(await screen.findByTestId("thermal-receipt-feed")).toHaveAttribute(
      "aria-label",
      "0 extra feed lines"
    );
    expect(screen.queryByTestId("thermal-receipt-cut")).not.toBeInTheDocument();
  });
});
