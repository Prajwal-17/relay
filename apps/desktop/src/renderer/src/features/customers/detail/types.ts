import type { Customer } from "@shared/types";
import type { CustomerMock } from "../_mock/types";

/**
 * Adapts a real `Customer` (narrow schema) onto the richer `CustomerMock`
 * shape the detail UI expects. Mock-only fields (gstin, openingBalance,
 * totalSales, outstanding, lastPurchase, tags, billing/shipping address)
 * fall back to safe defaults so the still-dummy tabs keep rendering
 * without crashing. Fields that exist on the real schema are surfaced.
 */
export function toCustomerDetail(customer: Customer): CustomerMock {
  return {
    id: customer.id,
    name: customer.name,
    contact: customer.contact,
    customerType: customer.customerType as CustomerMock["customerType"],
    billingAddress: customer.address ?? undefined,
    shippingAddress: undefined,
    gstin: undefined,
    openingBalance: 0,
    creditLimit: customer.creditLimit ?? 0,
    outstanding: customer.outstandingBalance ?? 0,
    totalSales: 0,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    tags: []
  };
}
