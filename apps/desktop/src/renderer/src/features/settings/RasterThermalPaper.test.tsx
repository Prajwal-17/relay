// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { RawLedgerStatementData, RawReceiptData } from "@shared/types";
import { RasterLedgerPaper, RasterReceiptPaper } from "./RasterThermalPaper";

const receipt: RawReceiptData = {
  storeName: "QuickCart Market",
  addressLines: ["12 Market Road", "Bengaluru 560001"],
  phone: "9999999999",
  gstin: "29ABCDE1234F1Z5",
  transactionType: "sale",
  transactionNo: 1048,
  customerName: "Anita",
  dateTime: "2026-08-10T10:30:00.000Z",
  items: [
    {
      name: "Premium Basmati Rice Extra Long Grain Family Pack That Must Wrap Naturally",
      quantity: "2.5",
      checkedQty: 1.5,
      unitPricePaisa: 8500,
      totalPaisa: 21250
    },
    {
      name: "Cold Pressed Groundnut Oil",
      quantity: "1",
      checkedQty: 1,
      unitPricePaisa: 19900,
      totalPaisa: 19900
    }
  ],
  subtotalPaisa: 12_34_56_789,
  totalPaisa: 12_34_56_789,
  savingsPaisa: 5850,
  extraFeedLines: 4,
  cutMode: "partial",
  footerMessage: "Thank you. Visit again.",
  upi: { id: "shop@bank", payeeName: "QuickCart Market", includeAmount: true }
};

const statement: RawLedgerStatementData = {
  storeName: "QuickCart Market",
  addressLines: ["12 Market Road"],
  customerName: "Anita",
  generatedAt: "2026-08-10T10:30:00.000Z",
  entries: [
    {
      dateTime: "2026-08-01T10:30:00.000Z",
      particulars: "Sale",
      amountDuePaisa: 51250,
      amountPaidPaisa: 0,
      runningBalancePaisa: 51250
    },
    {
      dateTime: "2026-08-05T09:15:00.000Z",
      particulars: "Payment",
      amountDuePaisa: 0,
      amountPaidPaisa: 20000,
      runningBalancePaisa: 31250
    }
  ],
  totalDuePaisa: 51250,
  totalPaidPaisa: 20000,
  closingBalancePaisa: 31250,
  extraFeedLines: 4,
  cutMode: "partial"
};

afterEach(cleanup);

describe("canonical raster thermal papers", () => {
  it("uses a fixed 576-pixel Inter paper with wrapping names and visible large totals", () => {
    render(<RasterReceiptPaper receipt={receipt} />);
    const paper = screen.getByTestId("raster-receipt-paper");

    expect(paper).toHaveStyle({
      width: "576px",
      fontFamily: "InterVariable, system-ui, sans-serif"
    });
    expect(paper).toHaveTextContent(receipt.items[0]!.name);
    expect(paper).toHaveTextContent("Rs.12,34,567.89");
    expect(paper).toHaveTextContent("2.5(1.5)");
    expect(screen.getByLabelText("1.5 of 2.5 checked")).toBeInTheDocument();
    expect(screen.getByLabelText("1 of 1 checked")).toBeInTheDocument();
  });

  it("shows a native-looking QR preview but excludes it from captured body and after-QR segments", () => {
    const preview = render(<RasterReceiptPaper receipt={receipt} />);
    expect(screen.getByTitle("UPI payment QR preview")).toBeInTheDocument();
    expect(preview.container.querySelector("[data-preview-only-qr]")).toBeInTheDocument();
    preview.unmount();

    const body = render(<RasterReceiptPaper receipt={receipt} segment="body" />);
    expect(body.container.querySelector("svg")).not.toBeInTheDocument();
    expect(body.container.querySelector('[data-raster-segment="body"]')).toBeInTheDocument();
    body.unmount();

    const afterQr = render(<RasterReceiptPaper receipt={receipt} segment="after-qr" />);
    expect(afterQr.container.querySelector("svg")).not.toBeInTheDocument();
    expect(screen.getByText("Scan to pay")).toBeInTheDocument();
  });

  it("preserves the ledger information contract", () => {
    render(<RasterLedgerPaper statement={statement} />);
    const paper = screen.getByTestId("raster-ledger-paper");

    expect(paper).toHaveTextContent("ACCOUNTS");
    expect(paper).toHaveTextContent("Anita");
    expect(paper).toHaveTextContent("Sale");
    expect(paper).toHaveTextContent("Payment");
    expect(paper).toHaveTextContent("TOTAL AMOUNT");
    expect(paper).not.toHaveTextContent("Invoice no");
    expect(paper).not.toHaveTextContent("Mode:");
    expect(paper).not.toHaveTextContent("Total sales");
    expect(paper).not.toHaveTextContent("Total paid");
  });
});
