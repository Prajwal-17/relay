// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CustomerTxn } from "@/features/customers/hooks/useCustomerTransactions";
import { TxnRowActions } from "@/features/customers/detail/tabs/TxnRowActions";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { TransactionType } from "@shared/types";
import type { UseMutationResult } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionDetailsDialog } from "./TransactionDetailsDialog";
import TransactionTableRow from "./TransactionTableRow";

class ResizeObserverMock {
  observe() {
    return undefined;
  }
  unobserve() {
    return undefined;
  }
  disconnect() {
    return undefined;
  }
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

const mocks = vi.hoisted(() => ({
  printSavedReceipt: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
  toastLoading: vi.fn(),
  viewMutation: {
    mutate: vi.fn(),
    isPending: false,
    variables: undefined
  },
  printing: {
    upiQrProfiles: [
      {
        id: "upi-primary",
        label: "Primary UPI",
        upiId: "shop@bank",
        payeeName: "Relay Market"
      },
      {
        id: "upi-counter",
        label: "Counter UPI Account Used for Wholesale and Retail Payments",
        upiId: "verylongmerchantidentifierforrelaycounterpayments@bank",
        payeeName: "Relay Wholesale and Retail Counter Payments Private Limited"
      }
    ],
    defaultUpiQrProfileId: "upi-primary",
    printUpiQrOnSales: false,
    printUpiQrOnEstimates: true,
    includeAmountInUpiQr: true
  }
}));

vi.mock("@/features/billing/hooks/useRawReceiptPrint", () => ({
  default: () => ({ printSavedReceipt: mocks.printSavedReceipt })
}));

vi.mock("@/features/preferences/useAppPreferences", () => ({
  useAppPreferences: () => ({ config: { printing: mocks.printing }, defaults: undefined })
}));

vi.mock("@/features/transactions/hooks/useViewModal", () => ({
  useViewModal: () => ({
    data: {
      type: "sale",
      id: "sale-55",
      transactionNo: 55,
      customerId: null,
      customer: {
        id: "walk-in",
        name: "Walk-in",
        contact: null,
        customerType: "cash",
        notes: null,
        address: null,
        outstandingBalance: 0,
        isArchived: false,
        archivedAt: null
      },
      notes: null,
      grandTotal: 25000,
      totalQuantity: 0,
      canModify: true,
      createdAt: "2026-08-12T10:15:00.000Z",
      updatedAt: "2026-08-12T10:15:00.000Z",
      items: []
    },
    isLoading: false,
    isError: false,
    error: null,
    retry: vi.fn(),
    isRetrying: false,
    itemsCount: 0,
    totalQty: 0,
    totalCheckedQty: 0,
    updateQtyMutation: mocks.viewMutation,
    batchUpdateQtyMutation: mocks.viewMutation,
    deleteMutation: mocks.viewMutation,
    convertMutation: mocks.viewMutation,
    duplicateMutation: mocks.viewMutation,
    exportPdf: vi.fn(),
    pdfLoading: false
  })
}));

vi.mock("react-hot-toast", () => ({
  default: Object.assign(mocks.toastWarning, {
    success: mocks.toastSuccess,
    error: mocks.toastError,
    loading: mocks.toastLoading,
    dismiss: vi.fn()
  })
}));

type ActionVariables = { type: TransactionType; id: string };

const deleteMutation = {
  mutate: vi.fn(),
  isPending: false
} as unknown as UseMutationResult<null, Error, ActionVariables>;

const convertMutation = {
  mutate: vi.fn(),
  isPending: false
} as unknown as UseMutationResult<{ id: string }, Error, ActionVariables>;

const duplicateMutation = {
  mutate: vi.fn(),
  isPending: false
} as unknown as UseMutationResult<{ id: string }, Error, ActionVariables>;

const customerTransaction: CustomerTxn = {
  type: "estimate",
  id: "estimate-74",
  transactionNo: 74,
  customerId: "customer-1",
  notes: null,
  grandTotal: 25000,
  totalQuantity: 2000,
  createdAt: "2026-08-12T10:15:00.000Z"
};

afterEach(() => cleanup());

describe("transaction row print actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
    mocks.printSavedReceipt.mockResolvedValue({
      bytesWritten: 512,
      modeUsed: "raster",
      fellBack: false
    });
    mocks.toastLoading.mockReturnValue("pdf-toast");
    Object.defineProperty(window, "exportApi", {
      configurable: true,
      value: {
        exportAsPdf: vi.fn().mockResolvedValue({
          status: "success",
          data: "/tmp/sale-42.pdf"
        }),
        showItemInFolder: vi.fn()
      }
    });
  });

  it("shows PDF export progress and replaces it with success feedback", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TransactionTableRow
        pathname="sales"
        transaction={{
          type: "sale",
          id: "sale-42",
          transactionNo: 42,
          customerId: null,
          customerName: "Walk-in",
          notes: null,
          grandTotal: 12500,
          totalQuantity: 1000,
          canModify: true,
          createdAt: "2026-08-12T10:15:00.000Z"
        }}
        search=""
        deleteMutation={deleteMutation}
        convertMutation={convertMutation}
        duplicateMutation={duplicateMutation}
        setIsViewModalOpen={vi.fn()}
        setTransactionId={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "More transaction actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Export PDF" }));

    expect(mocks.toastLoading).toHaveBeenCalledWith("Exporting PDF…");
    await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalled());
    expect(mocks.toastSuccess.mock.calls[0]?.[1]).toMatchObject({
      id: "pdf-toast",
      duration: 6000
    });
  });

  it("opens dashboard print options and sends one-time UPI choices", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TransactionTableRow
        pathname="sales"
        transaction={{
          type: "sale",
          id: "sale-42",
          transactionNo: 42,
          customerId: null,
          customerName: "Walk-in",
          notes: null,
          grandTotal: 12500,
          totalQuantity: 1000,
          canModify: true,
          createdAt: "2026-08-12T10:15:00.000Z"
        }}
        search=""
        deleteMutation={deleteMutation}
        convertMutation={convertMutation}
        duplicateMutation={duplicateMutation}
        setIsViewModalOpen={vi.fn()}
        setTransactionId={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Print transaction 42" }));
    expect(await screen.findByRole("dialog", { name: "Print Sale #42" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "No QR: Receipt only" })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "Exact total: ₹125.00 fixed" }));
    expect(screen.getByRole("combobox", { name: "UPI account" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Print ₹125.00 QR" }));

    await waitFor(() =>
      expect(mocks.printSavedReceipt).toHaveBeenCalledWith({
        id: "sale-42",
        type: "sale",
        overrides: {
          includeUpiQr: true,
          includeAmountInUpiQr: true,
          upiQrProfileId: "upi-primary"
        }
      })
    );

    await user.click(screen.getByRole("button", { name: "More transaction actions" }));
    expect(await screen.findByRole("menuitem", { name: "Duplicate" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Export PDF" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Print" })).not.toBeInTheDocument();
  });

  it("uses estimate QR defaults in the dashboard print options", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TransactionTableRow
        pathname="estimates"
        transaction={{
          type: "estimate",
          id: "estimate-43",
          transactionNo: 43,
          customerId: null,
          customerName: "Walk-in",
          notes: null,
          grandTotal: 12500,
          totalQuantity: 1000,
          canModify: true,
          createdAt: "2026-08-12T10:15:00.000Z"
        }}
        search=""
        deleteMutation={deleteMutation}
        convertMutation={convertMutation}
        duplicateMutation={duplicateMutation}
        setIsViewModalOpen={vi.fn()}
        setTransactionId={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Print transaction 43" }));
    expect(screen.getByRole("radio", { name: "Exact total: ₹125.00 fixed" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Print ₹125.00 QR" }));

    await waitFor(() =>
      expect(mocks.printSavedReceipt).toHaveBeenCalledWith({
        id: "estimate-43",
        type: "estimate",
        overrides: {
          includeUpiQr: true,
          includeAmountInUpiQr: true,
          upiQrProfileId: "upi-primary"
        }
      })
    );
  });

  it("makes the open-amount QR choice explicit", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TransactionTableRow
        pathname="sales"
        transaction={{
          type: "sale",
          id: "sale-44",
          transactionNo: 44,
          customerId: null,
          customerName: "Walk-in",
          notes: null,
          grandTotal: 12500,
          totalQuantity: 1000,
          canModify: true,
          createdAt: "2026-08-12T10:15:00.000Z"
        }}
        search=""
        deleteMutation={deleteMutation}
        convertMutation={convertMutation}
        duplicateMutation={duplicateMutation}
        setIsViewModalOpen={vi.fn()}
        setTransactionId={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Print transaction 44" }));
    await user.click(screen.getByRole("radio", { name: "Open amount: Customer enters ₹" }));
    await user.click(screen.getByRole("button", { name: "Print QR" }));

    await waitFor(() =>
      expect(mocks.printSavedReceipt).toHaveBeenCalledWith({
        id: "sale-44",
        type: "sale",
        overrides: {
          includeUpiQr: true,
          includeAmountInUpiQr: false,
          upiQrProfileId: "upi-primary"
        }
      })
    );
  });

  it("selects a long UPI account without search or widening the print dialog", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TransactionTableRow
        pathname="sales"
        transaction={{
          type: "sale",
          id: "sale-45",
          transactionNo: 45,
          customerId: null,
          customerName: "Walk-in",
          notes: null,
          grandTotal: 12500,
          totalQuantity: 1000,
          canModify: true,
          createdAt: "2026-08-12T10:15:00.000Z"
        }}
        search=""
        deleteMutation={deleteMutation}
        convertMutation={convertMutation}
        duplicateMutation={duplicateMutation}
        setIsViewModalOpen={vi.fn()}
        setTransactionId={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Print transaction 45" }));
    await user.click(screen.getByRole("radio", { name: "Exact total: ₹125.00 fixed" }));
    await user.click(screen.getByRole("combobox", { name: "UPI account" }));
    expect(screen.queryByPlaceholderText("Search UPI accounts…")).not.toBeInTheDocument();

    const longProfile = mocks.printing.upiQrProfiles[1]!;
    expect(screen.getByText(longProfile.label)).toHaveClass(
      "whitespace-normal",
      "[overflow-wrap:anywhere]"
    );
    expect(screen.queryByText(longProfile.upiId)).not.toBeInTheDocument();
    expect(screen.queryByText(longProfile.payeeName)).not.toBeInTheDocument();
    await user.click(screen.getByText(longProfile.label));
    expect(screen.getByRole("combobox", { name: "UPI account" })).toHaveTextContent(
      longProfile.upiId
    );
    expect(screen.getByRole("combobox", { name: "UPI account" })).toHaveTextContent(
      longProfile.payeeName
    );
    await user.click(screen.getByRole("button", { name: "Print ₹125.00 QR" }));

    await waitFor(() =>
      expect(mocks.printSavedReceipt).toHaveBeenCalledWith({
        id: "sale-45",
        type: "sale",
        overrides: {
          includeUpiQr: true,
          includeAmountInUpiQr: true,
          upiQrProfileId: "upi-counter"
        }
      })
    );
  });

  it("opens the same visual print choices from the transaction detail modal", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TransactionDetailsDialog type="sales" id="sale-55" />);

    const printActions = screen.getAllByRole("button", { name: "Print" });
    await user.click(printActions[0]!);
    expect(await screen.findByRole("dialog", { name: "Print Sale #55" })).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Exact total: ₹250.00 fixed" }));
    await user.click(screen.getByRole("button", { name: "Print ₹250.00 QR" }));

    await waitFor(() =>
      expect(mocks.printSavedReceipt).toHaveBeenCalledWith({
        id: "sale-55",
        type: "sale",
        overrides: {
          includeUpiQr: true,
          includeAmountInUpiQr: true,
          upiQrProfileId: "upi-primary"
        }
      })
    );
  });

  it("keeps estimate conversion in More while promoting Print in the customer workspace", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TxnRowActions
        txn={customerTransaction}
        type="estimate"
        deleteMutation={deleteMutation}
        convertMutation={convertMutation}
        duplicateMutation={duplicateMutation}
      />
    );

    const viewButton = screen.getByRole("button", { name: "View estimate 74" });
    const printButton = screen.getByRole("button", { name: "Print estimate 74" });
    const moreButton = screen.getByRole("button", { name: "More actions for estimate 74" });

    expect(viewButton).toHaveClass("size-7", "p-1.5");
    expect(printButton).toHaveClass("size-7", "p-1.5");
    expect(moreButton).toHaveClass("size-7", "p-1.5");
    expect(viewButton.parentElement).toHaveClass("gap-0.5");

    fireEvent.click(printButton);
    expect(await screen.findByRole("dialog", { name: "Print Estimate #74" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Print ₹250.00 QR" }));
    await waitFor(() => expect(mocks.printSavedReceipt).toHaveBeenCalled());

    await user.click(moreButton);
    expect(await screen.findByRole("menuitem", { name: "Convert to Sale" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Export PDF" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Print" })).not.toBeInTheDocument();
  });
});
