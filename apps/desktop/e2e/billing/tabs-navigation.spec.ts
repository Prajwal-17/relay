import { test, expect } from "../fixtures/app.fixture";
import { createApiTransaction, type PersistedTransaction } from "../fixtures/test-data";
import { billingRow, openBillingRoute, productInput, quantityInput } from "../helpers/billing";

test.describe("critical billing tab and navigation journeys", () => {
  test("switching tabs during debounce flushes only the edited sale", async ({ app }) => {
    const saleA = await createApiTransaction(app.api, {
      type: "sale",
      customerId: app.seed.defaultCustomer.id,
      items: [{ product: app.seed.products.standard }]
    });
    const saleB = await createApiTransaction(app.api, {
      type: "sale",
      customerId: app.seed.customers.ravi.id,
      items: [{ product: app.seed.products.similarAlpha }]
    });
    await openBillingRoute(app.page, "sales", saleA.id);
    await openBillingRoute(app.page, "sales", saleB.id);

    const response = app.page.waitForResponse(
      (candidate) =>
        candidate.status() === 200 &&
        new URL(candidate.url()).pathname === `/api/sales/${saleB.id}/sync`
    );
    await quantityInput(billingRow(app.page, 0)).fill("2.333");
    await app.page.getByRole("button", { name: `Sale #${saleA.transactionNo}` }).click();
    await response;

    expect(
      (await app.api.get<PersistedTransaction>(`/api/sales/${saleA.id}`)).items[0]?.quantity
    ).toBe(1000);
    expect(
      (await app.api.get<PersistedTransaction>(`/api/sales/${saleB.id}`)).items[0]?.quantity
    ).toBe(2333);
    await app.page.getByRole("button", { name: `Sale #${saleB.transactionNo}` }).click();
    await expect(productInput(billingRow(app.page, 0))).toHaveValue(
      app.seed.products.similarAlpha.productSnapshot
    );
    await expect(quantityInput(billingRow(app.page, 0))).toHaveValue("2.333");
  });

  test("Save & Exit flushes the active sale without mutating an estimate tab", async ({ app }) => {
    const sale = await createApiTransaction(app.api, {
      type: "sale",
      customerId: app.seed.defaultCustomer.id,
      items: [{ product: app.seed.products.standard }]
    });
    const estimate = await createApiTransaction(app.api, {
      type: "estimate",
      customerId: app.seed.customers.ravi.id,
      items: [{ product: app.seed.products.similarBeta }]
    });
    await openBillingRoute(app.page, "sales", sale.id);
    await openBillingRoute(app.page, "estimates", estimate.id);
    await app.page.getByRole("button", { name: `Sale #${sale.transactionNo}` }).click();

    await quantityInput(billingRow(app.page, 0)).fill("5.555");
    await app.page.getByRole("button", { name: "Save & Exit" }).click();
    await expect(app.page).toHaveURL(/#\/dashboard\/sales$/);
    expect(
      (await app.api.get<PersistedTransaction>(`/api/sales/${sale.id}`)).items[0]?.quantity
    ).toBe(5555);
    const untouchedEstimate = await app.api.get<PersistedTransaction>(
      `/api/estimates/${estimate.id}`
    );
    expect(untouchedEstimate.items[0]).toMatchObject({
      productId: app.seed.products.similarBeta.id,
      quantity: 1000
    });
  });
});
