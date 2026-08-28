import { describe, expect, it } from "vitest";
import { buildTransactionDisplayRows } from "./transactionGrouping";

type GroupableTestTransaction = {
  id: string;
  createdAt?: string;
  transactionNo: number;
};

const transactions: GroupableTestTransaction[] = [
  { id: "estimate-3", transactionNo: 3, createdAt: "2026-08-12T12:00:00.000Z" },
  { id: "estimate-2", transactionNo: 2, createdAt: "2026-08-12T05:00:00.000Z" },
  { id: "estimate-1", transactionNo: 1, createdAt: "2026-07-31T12:00:00.000Z" }
];

describe("buildTransactionDisplayRows", () => {
  it("inserts day dividers while retaining the original transactions", () => {
    const rows = buildTransactionDisplayRows(transactions, "day");

    expect(rows.map((row) => (row.kind === "group" ? row.label : row.transaction.id))).toEqual([
      "12 Aug 2026",
      "estimate-3",
      "estimate-2",
      "31 Jul 2026",
      "estimate-1"
    ]);
  });

  it("supports month dividers for customer-shaped transaction records", () => {
    const rows = buildTransactionDisplayRows(transactions, "month");

    expect(rows.map((row) => (row.kind === "group" ? row.label : row.transaction.id))).toEqual([
      "August 2026",
      "estimate-3",
      "estimate-2",
      "July 2026",
      "estimate-1"
    ]);
  });

  it("returns only transactions when grouping is disabled", () => {
    const rows = buildTransactionDisplayRows(transactions, "none");

    expect(rows).toHaveLength(transactions.length);
    expect(rows.every((row) => row.kind === "transaction")).toBe(true);
  });
});
