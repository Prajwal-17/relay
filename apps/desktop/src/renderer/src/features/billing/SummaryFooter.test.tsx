// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SummaryFooter } from "./SummaryFooter";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  forceSync: vi.fn(),
  flushSync: vi.fn(),
  prepareReceipt: vi.fn(),
  printReceipt: vi.fn(),
  prepareCustomerLedger: vi.fn(),
  printCustomerLedger: vi.fn(),
  printReceiptWithLedger: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn()
}));

vi.mock("@/features/billing/hooks/useRawReceiptPrint", () => ({
  default: () => ({
    prepareReceipt: mocks.prepareReceipt,
    printReceipt: mocks.printReceipt
  })
}));

vi.mock("@/features/customers/hooks/useRawLedgerPrint", () => ({
  useRawLedgerPrint: () => ({
    prepareCustomerLedger: mocks.prepareCustomerLedger,
    printCustomerLedger: mocks.printCustomerLedger
  })
}));
vi.mock("@/features/billing/hooks/useTransaction", () => ({
  default: () => ({ subtotal: "Rs.10", grandTotal: "Rs.10" })
}));

vi.mock("@/features/billing/store/billingTabs.store", () => ({
  useBillingTabsStore: (selector: (state: { activeTabId: string }) => unknown) =>
    selector({ activeTabId: "tab-1" })
}));

vi.mock("@/features/billing/store/billingSession.store", () => ({
  useBillingSessionStore: {
    getState: () => ({
      sessions: {
        "tab-1": { customerId: "customer-1", customerName: "Anita" }
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

afterEach(() => {
  cleanup();
});

describe("Save & Print RAW workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prepareReceipt.mockResolvedValue({
      receipt: { transactionNo: 42 },
      raster: { body: { dataBase64: "receipt" } }
    });
    mocks.prepareCustomerLedger.mockResolvedValue({
      statement: { customerName: "Anita" },
      raster: { body: { dataBase64: "ledger" } }
    });
    mocks.printReceiptWithLedger.mockResolvedValue({
      status: "success",
      data: { bytesWritten: 1280, modeUsed: "raster", fellBack: false }
    });
    Object.defineProperty(window, "rawPrintApi", {
      configurable: true,
      value: { printReceiptWithLedger: mocks.printReceiptWithLedger }
    });
  });

  it("awaits flushSync and Windows acceptance before navigating", async () => {
    const sync = deferred<void>();
    const print = deferred<{ bytesWritten: number; modeUsed: "raster"; fellBack: boolean }>();
    mocks.flushSync.mockReturnValue(sync.promise);
    mocks.printReceipt.mockReturnValue(print.promise);

    render(<SummaryFooter />);
    fireEvent.click(screen.getByRole("button", { name: "Save & Print" }));

    expect(mocks.forceSync).toHaveBeenCalledWith("tab-1");
    expect(mocks.flushSync).toHaveBeenCalledWith("tab-1");
    expect(mocks.printReceipt).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();

    await act(async () => sync.resolve());
    await waitFor(() => expect(mocks.printReceipt).toHaveBeenCalledWith("tab-1"));
    expect(mocks.navigate).not.toHaveBeenCalled();

    await act(async () =>
      print.resolve({ bytesWritten: 512, modeUsed: "raster", fellBack: false })
    );
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith("/dashboard/sales"));
  });

  it("submits the bill and customer ledger as one RAW job before navigating", async () => {
    const combinedPrint = deferred<{
      status: "success";
      data: { bytesWritten: number; modeUsed: "raster"; fellBack: boolean };
    }>();
    mocks.flushSync.mockResolvedValue(undefined);
    mocks.printReceiptWithLedger.mockReturnValue(combinedPrint.promise);

    render(<SummaryFooter />);
    fireEvent.click(screen.getByRole("button", { name: "More print options" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /Save & print bill \+ ledger/ }));

    await waitFor(() =>
      expect(mocks.prepareReceipt).toHaveBeenCalledWith("tab-1", { omitFooter: true })
    );
    expect(mocks.prepareCustomerLedger).toHaveBeenCalledWith(
      { id: "customer-1", name: "Anita" },
      undefined,
      { includeHeader: false }
    );
    expect(mocks.printReceipt).not.toHaveBeenCalled();
    expect(mocks.printCustomerLedger).not.toHaveBeenCalled();
    expect(mocks.printReceiptWithLedger).toHaveBeenCalledWith(
      { transactionNo: 42 },
      { customerName: "Anita" },
      { body: { dataBase64: "receipt" } },
      { body: { dataBase64: "ledger" } }
    );
    expect(mocks.navigate).not.toHaveBeenCalled();

    await act(async () =>
      combinedPrint.resolve({
        status: "success",
        data: { bytesWritten: 1280, modeUsed: "raster", fellBack: false }
      })
    );
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith("/dashboard/sales"));
  });

  it("omits both raster documents when either combined raster preparation fails", async () => {
    mocks.flushSync.mockResolvedValue(undefined);
    mocks.prepareCustomerLedger.mockResolvedValue({
      statement: { customerName: "Anita" },
      raster: undefined
    });
    mocks.printReceiptWithLedger.mockResolvedValue({
      status: "success",
      data: { bytesWritten: 1280, modeUsed: "device-text", fellBack: true }
    });

    render(<SummaryFooter />);
    fireEvent.click(screen.getByRole("button", { name: "More print options" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /Save & print bill [+] ledger/ }));

    await waitFor(() =>
      expect(mocks.printReceiptWithLedger).toHaveBeenCalledWith(
        { transactionNo: 42 },
        { customerName: "Anita" },
        undefined,
        undefined
      )
    );
    await waitFor(() =>
      expect(mocks.toastWarning).toHaveBeenCalledWith(
        "Printed using device text because the high-quality receipt could not be prepared",
        { icon: "⚠️" }
      )
    );
  });

  it("stays on billing and shows the printer error when submission fails", async () => {
    mocks.flushSync.mockResolvedValue(undefined);
    mocks.printReceipt.mockRejectedValue(new Error("The printer is disconnected."));

    render(<SummaryFooter />);
    fireEvent.click(screen.getByRole("button", { name: "Save & Print" }));

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith("The printer is disconnected.")
    );
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("warns after a successful automatic device-text fallback", async () => {
    mocks.flushSync.mockResolvedValue(undefined);
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
