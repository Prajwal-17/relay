import { CUSTOMER_TYPE, TRANSACTION_TYPE } from "@shared/types";
import { describe, expect, it } from "vitest";
import { shouldAutomaticallyAddSaleToAccounting } from "./billingAccounting";

type AutoAccountingOptions = Parameters<typeof shouldAutomaticallyAddSaleToAccounting>[0];

const accountCustomer = {
  id: "account-customer",
  name: "Account Stores",
  customerType: CUSTOMER_TYPE.ACCOUNT
};

describe("shouldAutomaticallyAddSaleToAccounting", () => {
  it("enables accounting for a non-default Account customer sale", () => {
    expect(
      shouldAutomaticallyAddSaleToAccounting({
        billingType: TRANSACTION_TYPE.SALE,
        customer: accountCustomer,
        defaultCustomerId: "default-customer",
        enabled: true
      })
    ).toBe(true);
  });

  it.each<[string, Partial<AutoAccountingOptions>]>([
    ["the preference is disabled", { enabled: false }],
    ["the transaction is an estimate", { billingType: TRANSACTION_TYPE.ESTIMATE }],
    [
      "the customer is Cash",
      { customer: { ...accountCustomer, customerType: CUSTOMER_TYPE.CASH } }
    ],
    [
      "the customer is Hotel",
      { customer: { ...accountCustomer, customerType: CUSTOMER_TYPE.HOTEL } }
    ],
    ["the configured default customer is selected", { defaultCustomerId: accountCustomer.id }],
    [
      "the reserved DEFAULT customer is selected",
      { customer: { ...accountCustomer, name: " default " } }
    ]
  ])("does not enable accounting when %s", (_label, overrides) => {
    expect(
      shouldAutomaticallyAddSaleToAccounting({
        billingType: TRANSACTION_TYPE.SALE,
        customer: accountCustomer,
        defaultCustomerId: "default-customer",
        enabled: true,
        ...overrides
      })
    ).toBe(false);
  });
});
