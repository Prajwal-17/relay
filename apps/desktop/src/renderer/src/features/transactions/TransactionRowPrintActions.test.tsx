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
import TransactionTableRow from "./TransactionTableRow";

const mocks = vi.hoisted(() => ({
  printSavedReceipt: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn()
}));

vi.mock("@/features/billing/hooks/useRawReceiptPrint", () => ({
  default: () => ({ printSavedReceipt: mocks.printSavedReceipt })
}));

vi.mock("react-hot-toast", () => ({
  default: Object.assign(mocks.toastWarning, {
    success: mocks.toastSuccess,
    error: mocks.toastError,
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
    mocks.printSavedReceipt.mockResolvedValue({
      bytesWritten: 512,
      modeUsed: "raster",
      fellBack: false
    });
  });

  it("promotes Print on dashboard rows and removes it from More", async () => {
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
    await waitFor(() =>
      expect(mocks.printSavedReceipt).toHaveBeenCalledWith({ id: "sale-42", type: "sale" })
    );

    await user.click(screen.getByRole("button", { name: "More transaction actions" }));
    expect(await screen.findByRole("menuitem", { name: "Duplicate" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Export PDF" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Print" })).not.toBeInTheDocument();
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
    await waitFor(() =>
      expect(mocks.printSavedReceipt).toHaveBeenCalledWith({
        id: "estimate-74",
        type: "estimate"
      })
    );

    await user.click(moreButton);
    expect(await screen.findByRole("menuitem", { name: "Convert to Sale" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Export PDF" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Print" })).not.toBeInTheDocument();
  });
});
