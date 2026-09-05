// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CustomerListRow } from "./types";
import { renderNameCell, renderTypeCell } from "./columns";

const row: CustomerListRow = {
  id: "customer-1",
  name: "Alice Stores",
  contact: "98765 43210",
  customerType: "account",
  notes: null,
  address: null,
  outstandingBalance: 0,
  isArchived: false,
  archivedAt: null,
  outstanding: 0,
  lastPurchaseAt: null,
  lastPurchaseAmt: null,
  lastPaymentAt: null,
  lastPaymentAmt: null
};

describe("customer list name column", () => {
  it("highlights matching text in both the customer name and contact", () => {
    const { container, rerender } = render(<div>{renderNameCell(row, "ali")}</div>);

    expect(container.querySelector("mark")).toHaveTextContent("Ali");

    rerender(<div>{renderNameCell(row, "432")}</div>);
    expect(container.querySelector("mark")).toHaveTextContent("432");
  });
});

describe("customer list type column", () => {
  it.each([
    ["cash", "Cash"],
    ["account", "Account"],
    ["hotel", "Hotel"]
  ])("renders %s as %s", (customerType, label) => {
    const { getByText } = render(<div>{renderTypeCell({ ...row, customerType })}</div>);

    expect(getByText(label)).toBeInTheDocument();
  });
});
