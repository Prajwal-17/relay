import { test, expect } from "../fixtures/app.fixture";
import type { PersistedTransaction, SeedCustomer, SeedProduct } from "../fixtures/test-data";
import {
  billingRow,
  openBillingRoute,
  productInput,
  quantityInput,
  selectCustomer,
  selectProduct,
  waitForSaveResponse,
  waitForTransactionId
} from "../helpers/billing";

type LedgerResponse = {
  data: Array<{
    id: string;
    customerId: string;
    saleId: string | null;
    type: string;
    amountDue: number;
  }>;
};

test.describe("critical estimate and accounting journeys", () => {
  test("estimate creation, edit, and restart stay outside sale accounting", async ({ app }) => {
    await openBillingRoute(app.page, "estimates");
    await expect(
      app.page.getByRole("button", { name: "Add this sale to the customer account" })
    ).toHaveCount(0);
    await waitForSaveResponse(
      app.page,
      () => selectProduct(app.page, app.seed.products.fractional.name),
      { type: "estimates", endpoint: "create", status: 200 }
    );
    const estimateId = await waitForTransactionId(app.page);
    await waitForSaveResponse(
      app.page,
      async () => {
        await quantityInput(billingRow(app.page, 0)).fill("2.125");
        await app.page.getByPlaceholder(/Delivery instructions/).fill("Estimate lifecycle note");
      },
      {
        type: "estimates",
        endpoint: "sync",
        transactionId: estimateId,
        status: 200,
        requestMatches: (body) => {
          const serialized = JSON.stringify(body);
          return (
            serialized.includes('"quantity":2125') &&
            serialized.includes('"notes":"Estimate lifecycle note"')
          );
        }
      }
    );

    const estimate = await app.api.get<PersistedTransaction>(`/api/estimates/${estimateId}`);
    expect(estimate).toMatchObject({
      id: estimateId,
      customerId: app.seed.defaultCustomer.id,
      notes: "Estimate lifecycle note",
      grandTotal: 26_233,
      totalQuantity: 2125
    });
    expect(estimate.items[0]).toMatchObject({
      productId: app.seed.products.fractional.id,
      price: 12_345,
      quantity: 2125,
      totalPrice: 26_233
    });

    await app.restart();
    await openBillingRoute(app.page, "estimates", estimateId);
    await expect(productInput(billingRow(app.page, 0))).toHaveValue(
      app.seed.products.fractional.productSnapshot
    );
    await expect(quantityInput(billingRow(app.page, 0))).toHaveValue("2.125");
    await expect(app.page.getByPlaceholder(/Delivery instructions/)).toHaveValue(
      "Estimate lifecycle note"
    );
    await expect(
      app.page.getByRole("button", { name: "Add this sale to the customer account" })
    ).toHaveCount(0);
  });

  test("named customer accounting creates and updates one exact ledger entry", async ({ app }) => {
    await openBillingRoute(app.page, "sales");
    await selectCustomer(app.page, app.seed.customers.anita.name);
    await waitForSaveResponse(
      app.page,
      () => selectProduct(app.page, app.seed.products.fractional.name),
      { type: "sales", endpoint: "create", status: 200 }
    );
    const saleId = await waitForTransactionId(app.page);
    await waitForSaveResponse(
      app.page,
      () => app.page.getByRole("button", { name: "Add this sale to the customer account" }).click(),
      { type: "sales", endpoint: "sync", transactionId: saleId, status: 200 }
    );
    await waitForSaveResponse(
      app.page,
      () => quantityInput(billingRow(app.page, 0)).fill("3.001"),
      { type: "sales", endpoint: "sync", transactionId: saleId, status: 200 }
    );

    const sale = await app.api.get<PersistedTransaction>(`/api/sales/${saleId}`);
    const ledger = await app.api.get<LedgerResponse>(
      `/api/customers/${app.seed.customers.anita.id}/ledger`
    );
    const linked = ledger.data.filter((entry) => entry.saleId === saleId);
    expect(linked).toHaveLength(1);
    expect(linked[0]).toMatchObject({
      customerId: app.seed.customers.anita.id,
      type: "sale",
      amountDue: sale.grandTotal
    });
    expect(
      (await app.api.get<SeedCustomer>(`/api/customers/${app.seed.customers.anita.id}`))
        .outstandingBalance
    ).toBe(1250 + sale.grandTotal);
    expect(
      (await app.api.get<SeedProduct>(`/api/products/${app.seed.products.fractional.id}`))
        .totalQuantitySold
    ).toBe(3001);

    await app.restart();
    const afterRestart = await app.api.get<LedgerResponse>(
      `/api/customers/${app.seed.customers.anita.id}/ledger`
    );
    expect(afterRestart.data.filter((entry) => entry.saleId === saleId)).toEqual(linked);
  });
});
