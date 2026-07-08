import type { LedgerEntry } from "./types";

/**
 * Hero customer (acct-1001) ledger. Running balance precomputed so the
 * table renders without any client-side accounting logic.
 *
 * Convention: +runningBalance = Debit (customer owes). A sale adds Debit;
 * a payment adds Credit (reduces what they owe). Opening balance seeds Dr.
 *
 * All money in paisa.
 */
export const mockLedger: LedgerEntry[] = [
  {
    id: "ldg-0",
    date: "2024-03-12T04:00:00Z",
    type: "opening",
    ref: "—",
    description: "Opening balance",
    debit: 500000,
    credit: 0,
    runningBalance: 500000
  },
  {
    id: "ldg-1",
    date: "2026-05-30T06:15:00Z",
    type: "sale",
    ref: "INV-2026-0155",
    description: "Sale invoice",
    debit: 245000,
    credit: 0,
    runningBalance: 745000
  },
  {
    id: "ldg-2",
    date: "2026-06-01T10:00:00Z",
    type: "payment",
    ref: "PMT-2041",
    description: "Payment received — UPI",
    debit: 0,
    credit: 300000,
    runningBalance: 445000
  },
  {
    id: "ldg-3",
    date: "2026-06-08T09:00:00Z",
    type: "sale",
    ref: "INV-2026-0161",
    description: "Sale invoice",
    debit: 327000,
    credit: 0,
    runningBalance: 772000
  },
  {
    id: "ldg-4",
    date: "2026-06-15T07:20:00Z",
    type: "sale",
    ref: "INV-2026-0168",
    description: "Sale invoice",
    debit: 158500,
    credit: 0,
    runningBalance: 930500
  },
  {
    id: "ldg-5",
    date: "2026-06-18T11:30:00Z",
    type: "payment",
    ref: "PMT-2088",
    description: "Payment received — Bank transfer",
    debit: 0,
    credit: 400000,
    runningBalance: 530500
  },
  {
    id: "ldg-6",
    date: "2026-06-22T05:45:00Z",
    type: "sale",
    ref: "INV-2026-0175",
    description: "Sale invoice",
    debit: 412000,
    credit: 0,
    runningBalance: 942500
  },
  {
    id: "ldg-7",
    date: "2026-06-27T15:00:00Z",
    type: "adjustment",
    ref: "ADJ-009",
    description: "Round-off adjustment",
    debit: 0,
    credit: 2500,
    runningBalance: 940000
  },
  {
    id: "ldg-8",
    date: "2026-06-29T08:10:00Z",
    type: "sale",
    ref: "INV-2026-0180",
    description: "Sale invoice",
    debit: 196000,
    credit: 0,
    runningBalance: 1136000
  },
  {
    id: "ldg-9",
    date: "2026-07-02T11:00:00Z",
    type: "payment",
    ref: "PMT-2155",
    description: "Payment received — UPI",
    debit: 0,
    credit: 196000,
    runningBalance: 940000
  },
  {
    id: "ldg-10",
    date: "2026-07-04T06:30:00Z",
    type: "sale",
    ref: "INV-2026-0184",
    description: "Sale invoice",
    debit: 284500,
    credit: 0,
    runningBalance: 1224500
  },
  {
    id: "ldg-11",
    date: "2026-07-05T09:00:00Z",
    type: "estimate",
    ref: "EST-2026-0042",
    description: "Estimate raised (not yet invoiced)",
    debit: 0,
    credit: 0,
    runningBalance: 1224500
  },
  {
    id: "ldg-12",
    date: "2026-07-06T13:00:00Z",
    type: "payment",
    ref: "PMT-2201",
    description: "Payment received — Cheque #0044521",
    debit: 0,
    credit: 400000,
    runningBalance: 824500
  },
  {
    id: "ldg-13",
    date: "2026-07-07T08:00:00Z",
    type: "adjustment",
    ref: "ADJ-014",
    description: "Credit note — damaged goods",
    debit: 0,
    credit: 120000,
    runningBalance: 704500
  },
  {
    id: "ldg-14",
    date: "2026-07-07T16:00:00Z",
    type: "sale",
    ref: "INV-2026-0188",
    description: "Sale invoice",
    debit: 1140000,
    credit: 0,
    runningBalance: 1844500
  }
];
