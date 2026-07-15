import type { Customer } from "@shared/types";

export type CustomerListRow = Customer & {
  outstanding: number | null;
  lastPurchaseAt: string | null;
  lastPurchaseAmt: number | null;
};

export function toCustomerListRow(customer: Customer): CustomerListRow {
  return {
    ...customer,
    outstanding: null,
    lastPurchaseAt: null,
    lastPurchaseAmt: null
  };
}
