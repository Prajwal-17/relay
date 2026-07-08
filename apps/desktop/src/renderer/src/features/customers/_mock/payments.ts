import type { Payment } from "./types";

/**
 * Hero customer (acct-1001) recent payments — 5 entries.
 * All money in paisa.
 */
export const mockPayments: Payment[] = [
  {
    id: "pmt-2201",
    date: "2026-07-06T13:00:00Z",
    amount: 400000,
    mode: "cheque",
    ref: "CHQ-0044521",
    note: "Against batch of June invoices"
  },
  {
    id: "pmt-2155",
    date: "2026-07-02T11:00:00Z",
    amount: 196000,
    mode: "upi",
    ref: "UPI-8841290",
    note: "Settled INV-2026-0180"
  },
  {
    id: "pmt-2088",
    date: "2026-06-18T11:30:00Z",
    amount: 400000,
    mode: "bank",
    ref: "NEFT-552101",
    note: "Bank transfer — partial"
  },
  {
    id: "pmt-2041",
    date: "2026-06-01T10:00:00Z",
    amount: 300000,
    mode: "upi",
    ref: "UPI-7710033"
  },
  {
    id: "pmt-1998",
    date: "2026-05-20T14:00:00Z",
    amount: 150000,
    mode: "cash",
    ref: "CASH-0520",
    note: "Counter cash deposit"
  }
];
