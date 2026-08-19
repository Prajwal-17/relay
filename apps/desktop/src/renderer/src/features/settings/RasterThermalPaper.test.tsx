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
  it("uses larger crisp typography and one shared aligned item grid", () => {
    render(<RasterReceiptPaper receipt={receipt} />);
    const paper = screen.getByTestId("raster-receipt-paper");
    const meta = screen.getByTestId("raster-receipt-meta");
    const header = screen.getByTestId("raster-receipt-item-header");
    const items = screen.getByTestId("raster-receipt-items");
    const rows = screen.getAllByTestId("raster-receipt-item-row");
    const receiptHeader = paper.querySelector("header");
    const receiptMain = paper.querySelector("main");
    const gridTemplateColumns = "32px minmax(0, 1fr) 92px 84px 108px";

    expect(paper).toHaveStyle({
      width: "576px",
      fontFamily: "InterVariable, system-ui, sans-serif",
      fontSynthesis: "none",
      letterSpacing: "normal"
    });
    expect(screen.getByTestId("raster-receipt-store-name")).toHaveClass(
      "text-[36px]",
      "font-[700]"
    );
    expect(header).toHaveClass("text-[22px]", "font-[700]");
    expect(meta).toHaveClass("text-[24px]", "font-[400]");
    expect(receiptHeader).toHaveClass("px-1");
    expect(receiptMain).toHaveClass("px-1");
    expect(meta).toHaveClass("border-y", "border-dashed", "border-black");
    expect(header).toHaveClass("border-b", "border-dashed", "border-black");
    expect(header).toHaveStyle({ gridTemplateColumns });
    for (const heading of Array.from(header.children).slice(2)) {
      expect(heading).toHaveClass("w-full", "text-right");
    }
    expect(items).toHaveClass("border-b", "border-dashed", "border-black");
    expect(rows).toHaveLength(receipt.items.length);
    for (const row of rows) {
      expect(row).toHaveClass("py-1", "text-[24px]", "leading-[1.2]", "font-[500]");
      expect(row).toHaveStyle({ gridTemplateColumns });
      expect(row.children[1]).toHaveClass("font-[500]");
      expect(row.children[2]).toHaveClass("font-[500]", "w-full", "text-right");
      expect(row.children[3]).toHaveClass("font-[500]", "w-full", "text-right");
      expect(row.children[4]).toHaveClass("font-[500]", "w-full", "text-right");
    }

    expect(paper).toHaveTextContent(receipt.items[0]!.name);
    expect(paper).toHaveTextContent("Rs.12,34,567.89");
    expect(paper).toHaveTextContent("2.5(1.5)");
    expect(paper).toHaveTextContent("Date: Mon,");
    const partiallyChecked = screen.getByLabelText("1.5 of 2.5 checked");
    const fullyChecked = screen.getByLabelText("1 of 1 checked");
    expect(partiallyChecked.querySelector("svg")).not.toBeInTheDocument();
    expect(fullyChecked.querySelector("svg")).toBeInTheDocument();
    expect(fullyChecked).toHaveClass("items-center", "whitespace-nowrap", "leading-none");
  });

  it("trims only whole line-item decimals and keeps totals fixed to two decimals", () => {
    const wholeTotalReceipt: RawReceiptData = {
      ...receipt,
      subtotalPaisa: 41_900,
      totalPaisa: 41_900,
      upi: undefined
    };
    render(<RasterReceiptPaper receipt={wholeTotalReceipt} />);

    const rows = screen.getAllByTestId("raster-receipt-item-row");
    const firstRowAmounts = Array.from(rows[0]!.querySelectorAll("[data-receipt-amount]"));
    const secondRowAmounts = Array.from(rows[1]!.querySelectorAll("[data-receipt-amount]"));
    expect(firstRowAmounts.map((amount) => amount.textContent)).toEqual(["85", "212.50"]);
    expect(secondRowAmounts.map((amount) => amount.textContent)).toEqual(["199", "199"]);

    const summary = screen.getByTestId("raster-receipt-summary");
    const summaryAmounts = Array.from(summary.querySelectorAll("[data-receipt-amount]"));
    expect(summary).toHaveClass("ml-auto", "grid", "min-w-[330px]");
    expect(summaryAmounts.map((amount) => amount.textContent)).toEqual(["419.00", "Rs.419.00"]);
    expect(summary.children[0]).toHaveTextContent("Subtotal");
    expect(summary.children[1]).toHaveTextContent("419.00");
    expect(summary.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
    expect(summary.children[2]).toHaveTextContent("TOTAL");
    expect(summary.children[2]).toHaveClass("text-[30px]", "font-[600]");
    expect(summary.children[3]).toHaveClass("text-[33px]", "font-[600]");

    const footer = screen.getByText(receipt.footerMessage!);
    const savings = screen.getByTestId("raster-receipt-savings");
    expect(savings).toHaveClass("text-[26px]", "font-[600]");
    expect(savings).toHaveTextContent("*** YOU SAVED Rs.58.50 ***");
    expect(footer.compareDocumentPosition(savings) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
  });

  it("prints the compact account settlement below the bill total", () => {
    render(
      <RasterReceiptPaper
        receipt={{
          ...receipt,
          subtotalPaisa: 200000,
          totalPaisa: 200000,
          upi: undefined,
          accountSettlement: {
            previousBalancePaisa: 500000,
            currentBillPaisa: 200000,
            totalDuePaisa: 700000,
            paymentPaisa: 300000,
            balancePaisa: 400000
          }
        }}
      />
    );

    const settlement = screen.getByTestId("raster-account-settlement");
    expect(settlement).toHaveTextContent("Previous balance");
    expect(settlement).toHaveTextContent("Rs.5,000.00");
    expect(settlement).toHaveTextContent("Current bill");
    expect(settlement).toHaveTextContent("Rs.2,000.00");
    expect(settlement).not.toHaveTextContent("Total due");
    expect(settlement).toHaveTextContent("Payment (-)");
    expect(settlement).toHaveTextContent("Rs.3,000.00");
    expect(settlement).toHaveTextContent("BALANCE");
    expect(settlement).toHaveTextContent("Rs.4,000.00");
  });

  it("omits the payment row when the customer account has no payment", () => {
    render(
      <RasterReceiptPaper
        receipt={{
          ...receipt,
          upi: undefined,
          accountSettlement: {
            previousBalancePaisa: 500000,
            currentBillPaisa: 200000,
            totalDuePaisa: 700000,
            paymentPaisa: 0,
            balancePaisa: 700000
          }
        }}
      />
    );

    expect(screen.getByTestId("raster-account-settlement")).not.toHaveTextContent("Payment (-)");
  });

  it("shows a native-looking QR preview but excludes it from captured body and after-QR segments", () => {
    const preview = render(<RasterReceiptPaper receipt={receipt} />);
    expect(screen.getByTitle("UPI payment QR preview")).toBeInTheDocument();
    const previewQr = preview.container.querySelector("[data-preview-only-qr]");
    const previewSavings = screen.getByTestId("raster-receipt-savings");
    expect(previewQr).toBeInTheDocument();
    expect(previewSavings).toHaveTextContent("*** YOU SAVED Rs.58.50 ***");
    expect(
      previewQr!.compareDocumentPosition(previewSavings) & Node.DOCUMENT_POSITION_FOLLOWING
    ).not.toBe(0);
    preview.unmount();

    const body = render(<RasterReceiptPaper receipt={receipt} segment="body" />);
    expect(body.container.querySelector("[data-preview-only-qr] svg")).not.toBeInTheDocument();
    expect(body.container.querySelector('[data-raster-segment="body"]')).toBeInTheDocument();
    expect(
      body.container.querySelector('[data-testid="raster-receipt-savings"]')
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("raster-receipt-before-qr-gap")).toHaveClass("h-8");
    body.unmount();

    const afterQr = render(<RasterReceiptPaper receipt={receipt} segment="after-qr" />);
    expect(afterQr.container.querySelector("[data-preview-only-qr] svg")).not.toBeInTheDocument();
    expect(afterQr.container.querySelector('[data-raster-segment="after-qr"]')).toHaveClass(
      "px-1",
      "pt-0"
    );
    expect(screen.getByText("Scan to pay")).toBeInTheDocument();
    expect(screen.getByTestId("raster-receipt-savings")).toHaveTextContent(
      "*** YOU SAVED Rs.58.50 ***"
    );
  });

  it("shows dated ledger entries followed by the account balance breakdown", () => {
    render(<RasterLedgerPaper statement={statement} />);
    const paper = screen.getByTestId("raster-ledger-paper");
    const entries = screen.getByTestId("raster-ledger-entries");

    expect(paper).toHaveTextContent("ACCOUNTS");
    expect(paper).toHaveTextContent("Anita");
    expect(entries).toHaveTextContent("01 Aug 2026");
    expect(paper).toHaveTextContent("Sale");
    expect(entries).toHaveTextContent("05 Aug 2026");
    expect(paper).toHaveTextContent("Payment");
    expect(entries).toHaveTextContent("-Rs.200");
    expect(entries).toHaveTextContent("Balance");
    expect(entries).toHaveTextContent("Rs.312.50");
    expect(entries.querySelectorAll("article")).toHaveLength(statement.entries.length);
    expect(paper.querySelector(".border-dashed")).not.toBeInTheDocument();
    expect(paper).not.toHaveTextContent("TOTAL AMOUNT");
    expect(paper).toHaveTextContent("Previous balance");
    expect(paper).toHaveTextContent("Charges");
    expect(paper).toHaveTextContent("Payments");
    expect(paper).toHaveTextContent("Rs.312.50");
    expect(paper).not.toHaveTextContent("Invoice no");
    expect(paper).not.toHaveTextContent("Mode:");
    expect(paper).not.toHaveTextContent("Total sales");
    expect(paper).not.toHaveTextContent("Total paid");
  });
});
