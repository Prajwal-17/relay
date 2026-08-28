import type { Customer } from "@shared/types";

export type CustomerListRow = Customer & {
  outstanding: number | null;
  lastPurchaseAt: string | null;
  lastPurchaseAmt: number | null;
  lastPaymentAt: string | null;
  lastPaymentAmt: number | null;
};

export function toCustomerListRow(customer: Customer): CustomerListRow {
  return {
    ...customer,
    outstanding: customer.outstandingBalance ?? null,
    lastPurchaseAt: customer.lastPurchaseAt ?? null,
    lastPurchaseAmt: customer.lastPurchaseAmt ?? null,
    lastPaymentAt: customer.lastPaymentAt ?? null,
    lastPaymentAmt: customer.lastPaymentAmt ?? null
  };
}
