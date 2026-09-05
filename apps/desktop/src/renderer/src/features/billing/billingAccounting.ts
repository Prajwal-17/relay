import {
  CUSTOMER_TYPE,
  TRANSACTION_TYPE,
  type Customer,
  type TransactionType
} from "@shared/types";

type AutoAccountingOptions = {
  billingType: TransactionType;
  customer: Pick<Customer, "id" | "name" | "customerType">;
  defaultCustomerId?: string | null;
  enabled: boolean;
};

export function shouldAutomaticallyAddSaleToAccounting({
  billingType,
  customer,
  defaultCustomerId,
  enabled
}: AutoAccountingOptions) {
  if (!enabled || billingType !== TRANSACTION_TYPE.SALE) return false;
  if (customer.customerType !== CUSTOMER_TYPE.ACCOUNT) return false;

  const isDefaultCustomer =
    customer.id === defaultCustomerId || customer.name.trim().toUpperCase() === "DEFAULT";

  return !isDefaultCustomer;
}
