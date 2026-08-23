import { test, expect } from "../fixtures/app.fixture";
import {
  createApiTransaction,
  type PersistedTransaction,
  type SeedProduct
} from "../fixtures/test-data";
import {
  billingRow,
  openBillingRoute,
  priceInput,
  productInput,
  quantityInput,
  selectProduct,
  waitForSaveResponse,
  waitForTransactionId
} from "../helpers/billing";

test.describe("critical sale calculation and lifecycle journeys", () => {
  test("fractional UI amount equals exact persisted paisa and milli-units", async ({ app }) => {
    await openBillingRoute(app.page, "sales");
    await waitForSaveResponse(
      app.page,
      () => selectProduct(app.page, app.seed.products.fractional.name),
      { type: "sales", endpoint: "create", status: 200 }
    );
    const saleId = await waitForTransactionId(app.page);
    await waitForSaveResponse(
      app.page,
      () => quantityInput(billingRow(app.page, 0)).fill("1.234"),
      { type: "sales", endpoint: "sync", transactionId: saleId, status: 200 }
    );

    const sale = await app.api.get<PersistedTransaction>(`/api/sales/${saleId}`);
    expect(sale.items[0]).toMatchObject({
      price: 12_345,
      quantity: 1234,
      totalPrice: 15_234
    });
    expect(sale.grandTotal).toBe(15_234);
    await expect(billingRow(app.page, 0)).toContainText("152.34");
    await expect(app.page.locator("footer .financial-nums")).toHaveText("₹152.34");
  });

  test("editing a catalog row updates only the exact product-counter delta", async ({ app }) => {
    const created = await createApiTransaction(app.api, {
      type: "sale",
      customerId: app.seed.defaultCustomer.id,
      items: [{ product: app.seed.products.standard }]
    });
    await openBillingRoute(app.page, "sales", created.id);
    await waitForSaveResponse(
      app.page,
      () => quantityInput(billingRow(app.page, 0)).fill("3.250"),
      { type: "sales", endpoint: "sync", transactionId: created.id, status: 200 }
    );

    const sale = await app.api.get<PersistedTransaction>(`/api/sales/${created.id}`);
    expect(sale.items[0]?.quantity).toBe(3250);
    expect(
      (await app.api.get<SeedProduct>(`/api/products/${app.seed.products.standard.id}`))
        .totalQuantitySold
    ).toBe(3250);
    await app.page.reload();
    await expect(quantityInput(billingRow(app.page, 0))).toHaveValue("3.25");
  });

  test("duplicate and delete actions preserve identity and reverse persisted effects", async ({
    app
  }) => {
    const created = await createApiTransaction(app.api, {
      type: "sale",
      customerId: app.seed.defaultCustomer.id,
      notes: "Duplicate lifecycle",
      items: [{ product: app.seed.products.standard, quantity: 1500, checkedQty: 1500 }]
    });
    await openBillingRoute(app.page, "sales", created.id);
    await app.page.getByLabel("Transaction actions").click();
    const duplicateResponse = app.page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname === `/api/sales/${created.id}/duplicate`
    );
    await app.page.getByRole("menuitem", { name: "Duplicate" }).click();
    await duplicateResponse;
    const duplicateId = await waitForTransactionId(app.page);
    expect(duplicateId).not.toBe(created.id);
    const duplicate = await app.api.get<PersistedTransaction>(`/api/sales/${duplicateId}`);
    expect(duplicate.items[0]).toMatchObject({
      productId: app.seed.products.standard.id,
      quantity: 1500,
      checkedQty: 0
    });
    expect(duplicate.notes).toBe("Duplicate lifecycle");

    await app.page.getByLabel("Transaction actions").click();
    await app.page.getByRole("menuitem", { name: "Delete" }).click();
    const deleteResponse = app.page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        new URL(response.url()).pathname === `/api/sales/${duplicateId}`
    );
    await app.page.getByRole("button", { name: "Delete transaction" }).click();
    await deleteResponse;
    await expect(app.page).not.toHaveURL(new RegExp(duplicateId));
    const remaining = await app.api.get<{ transactions: Array<{ id: string }> }>("/api/sales", {
      from: "2020-01-01T00:00:00.000Z",
      to: "2030-01-01T00:00:00.000Z"
    });
    expect(remaining.transactions.map((sale) => sale.id)).toEqual([created.id]);
    expect(
      (await app.api.get<SeedProduct>(`/api/products/${app.seed.products.standard.id}`))
        .totalQuantitySold
    ).toBe(1500);
  });

  test("a long-name replacement persists the exact selected product", async ({ app }) => {
    const created = await createApiTransaction(app.api, {
      type: "sale",
      customerId: app.seed.defaultCustomer.id,
      items: [{ product: app.seed.products.standard }]
    });
    await openBillingRoute(app.page, "sales", created.id);
    await waitForSaveResponse(
      app.page,
      () => selectProduct(app.page, app.seed.products.longName.name),
      { type: "sales", endpoint: "sync", transactionId: created.id, status: 200 }
    );
    const sale = await app.api.get<PersistedTransaction>(`/api/sales/${created.id}`);
    expect(sale.items[0]).toMatchObject({
      productId: app.seed.products.longName.id,
      productSnapshot: app.seed.products.longName.productSnapshot,
      price: app.seed.products.longName.price
    });
    await expect(productInput(billingRow(app.page, 0))).toHaveValue(
      app.seed.products.longName.productSnapshot
    );
    await expect(priceInput(billingRow(app.page, 0))).toHaveValue("98.76");
  });
});
