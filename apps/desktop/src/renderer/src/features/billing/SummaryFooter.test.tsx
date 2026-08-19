// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SummaryFooter } from "./SummaryFooter";

const settlement = {
  previousBalancePaisa: 500000,
  currentBillPaisa: 200000,
  totalDuePaisa: 700000,
  paymentPaisa: 300000,
  balancePaisa: 400000
};

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  forceSync: vi.fn(),
  flushSync: vi.fn(),
  printReceipt: vi.fn(),
  fetchSummary: vi.fn(),
  buildSettlement: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
  billingSession: {
    billingType: "sale",
    billingId: "sale-1",
    transactionNo: 42,
    customerId: "customer-1",
    customerName: "Anita",
    addToAccounting: true,
    printOptions: {
      includeUpiQr: null as boolean | null,
      includeAmountInUpiQr: null as boolean | null,
      selectedUpiQrProfileId: null as string | null,
      includeAccountSummary: false,
      accountSummaryStartedAt: new Date("2026-08-19T09:00:00.000Z").getTime()
    }
  }
}));

vi.mock("@/features/billing/hooks/useRawReceiptPrint", () => ({
  default: () => ({ printReceipt: mocks.printReceipt })
}));

vi.mock("@/features/billing/billingAccountSettlement", () => ({
  fetchBillingLedgerSummary: mocks.fetchSummary,
  buildBillingAccountSettlement: mocks.buildSettlement
}));

vi.mock("@/features/billing/hooks/useTransaction", () => ({
  default: () => ({ subtotal: "Rs.20", grandTotal: "Rs.20" })
}));

vi.mock("@/features/billing/store/billingTabs.store", () => ({
  useBillingTabsStore: (selector: (state: { activeTabId: string }) => unknown) =>
    selector({ activeTabId: "tab-1" })
}));

vi.mock("@/features/billing/store/billingSession.store", () => ({
  useBillingSessionStore: {
    getState: () => ({
      sessions: { "tab-1": mocks.billingSession },
      updatePrintOption: (_tabId: string, field: string, value: unknown) => {
        Object.assign(mocks.billingSession.printOptions, { [field]: value });
      }
    })
  }
}));

vi.mock("@/features/billing/syncWorker", () => ({
  forceSync: mocks.forceSync,
  flushSync: mocks.flushSync
}));

vi.mock("react-hot-toast", () => ({
  default: Object.assign(mocks.toastWarning, {
    error: mocks.toastError,
    success: vi.fn(),
    dismiss: vi.fn()
  })
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
    useParams: () => ({ type: "sales" })
  };
});

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

afterEach(cleanup);

describe("Save & Print RAW workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mocks.billingSession, {
      billingType: "sale",
      billingId: "sale-1",
      transactionNo: 42,
      customerId: "customer-1",
      customerName: "Anita",
      addToAccounting: true
    });
    Object.assign(mocks.billingSession.printOptions, {
      includeUpiQr: null,
      includeAmountInUpiQr: null,
      selectedUpiQrProfileId: null,
      includeAccountSummary: false,
      accountSummaryStartedAt: new Date("2026-08-19T09:00:00.000Z").getTime()
    });
    mocks.flushSync.mockResolvedValue(undefined);
    mocks.printReceipt.mockResolvedValue({
      bytesWritten: 512,
      modeUsed: "raster",
      fellBack: false
    });
    mocks.fetchSummary.mockResolvedValue({ currentBalance: 700000 });
    mocks.buildSettlement.mockReturnValue(settlement);
  });

  it("awaits sync and printer acceptance before navigating", async () => {
    const sync = deferred<void>();
    const print = deferred<{ bytesWritten: number; modeUsed: "raster"; fellBack: boolean }>();
    mocks.flushSync.mockReturnValue(sync.promise);
    mocks.printReceipt.mockReturnValue(print.promise);

    render(<SummaryFooter />);
    fireEvent.click(screen.getByRole("button", { name: "Save & Print" }));

    expect(mocks.forceSync).toHaveBeenCalledWith("tab-1");
    expect(mocks.printReceipt).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();

    await act(async () => sync.resolve());
    await waitFor(() =>
      expect(mocks.printReceipt).toHaveBeenCalledWith("tab-1", {
        includeUpiQr: null,
        includeAmountInUpiQr: null,
        upiQrProfileId: null,
        accountSettlement: undefined
      })
    );
    expect(mocks.navigate).not.toHaveBeenCalled();

    await act(async () =>
      print.resolve({ bytesWritten: 512, modeUsed: "raster", fellBack: false })
    );
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith("/dashboard/sales"));
  });

  it("prints the settlement derived from the customer account", async () => {
    mocks.billingSession.printOptions.includeAccountSummary = true;

    render(<SummaryFooter />);
    fireEvent.click(screen.getByRole("button", { name: "Save & Print" }));

    await waitFor(() => expect(mocks.fetchSummary).toHaveBeenCalledWith("customer-1"));
    expect(mocks.buildSettlement).toHaveBeenCalledWith(mocks.billingSession, {
      currentBalance: 700000
    });
    expect(mocks.printReceipt).toHaveBeenCalledWith("tab-1", {
      includeUpiQr: null,
      includeAmountInUpiQr: null,
      upiQrProfileId: null,
      accountSettlement: settlement
    });
    expect(mocks.navigate).toHaveBeenCalledWith("/dashboard/sales");
  });

  it("stays on billing when the customer balance cannot be loaded", async () => {
    mocks.billingSession.printOptions.includeAccountSummary = true;
    mocks.fetchSummary.mockRejectedValue(new Error("Customer balance could not be loaded."));

    render(<SummaryFooter />);
    fireEvent.click(screen.getByRole("button", { name: "Save & Print" }));

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("Customer balance could not be loaded.")
    );
    expect(mocks.printReceipt).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("stays on billing and shows the printer error when submission fails", async () => {
    mocks.printReceipt.mockRejectedValue(new Error("The printer is disconnected."));

    render(<SummaryFooter />);
    fireEvent.click(screen.getByRole("button", { name: "Save & Print" }));

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("The printer is disconnected.")
    );
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("warns after a successful automatic device-text fallback", async () => {
    mocks.printReceipt.mockResolvedValue({
      bytesWritten: 512,
      modeUsed: "device-text",
      fellBack: true
    });

    render(<SummaryFooter />);
    fireEvent.click(screen.getByRole("button", { name: "Save & Print" }));

    await waitFor(() =>
      expect(mocks.toastWarning).toHaveBeenCalledWith(
        "Printed using device text because the high-quality receipt could not be prepared",
        { icon: "⚠️" }
      )
    );
    expect(mocks.navigate).toHaveBeenCalledWith("/dashboard/sales");
  });
});
