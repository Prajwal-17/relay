import { test, expect } from "../fixtures/app.fixture";
import type { PersistedTransaction, SeedProduct } from "../fixtures/test-data";
import {
  billingRow,
  currentTransactionId,
  openBillingRoute,
  productInput,
  quantityInput,
  selectProduct,
  waitForSaveResponse,
  waitForTransactionId
} from "../helpers/billing";

test.describe("critical sale creation journeys", () => {
  test("first valid item creates one official sale and survives Electron restart", async ({
    app
  }) => {
    await openBillingRoute(app.page, "sales");

    await expect(app.page.getByText("#New", { exact: true })).toBeVisible();
    await expect(app.page.locator("footer .financial-nums")).toHaveText("₹0.00");
    expect(await currentTransactionId(app.page)).toBeNull();
    const before = await app.api.get<{ transactions: unknown[] }>("/api/sales", {
      from: "2020-01-01T00:00:00.000Z",
      to: "2030-01-01T00:00:00.000Z"
    });
    expect(before.transactions).toHaveLength(0);

    await waitForSaveResponse(
      app.page,
      () => selectProduct(app.page, app.seed.products.standard.name),
      { type: "sales", endpoint: "create", status: 200 }
    );

    const saleId = await waitForTransactionId(app.page);
    const sale = await app.api.get<PersistedTransaction>(`/api/sales/${saleId}`);
    expect(sale).toMatchObject({
      id: saleId,
      customerId: app.seed.defaultCustomer.id,
      grandTotal: 6800,
      totalQuantity: 1000
    });
    expect(sale.transactionNo).toBeGreaterThan(0);
    expect(sale.items).toHaveLength(1);
    expect(sale.items[0]).toMatchObject({
      productId: app.seed.products.standard.id,
      productSnapshot: app.seed.products.standard.productSnapshot,
      price: 6800,
      quantity: 1000,
      checkedQty: 0,
      totalPrice: 6800
    });
    expect(
      (await app.api.get<SeedProduct>(`/api/products/${app.seed.products.standard.id}`))
        .totalQuantitySold
    ).toBe(1000);

    await app.restart();
    await openBillingRoute(app.page, "sales", saleId);
    await expect(app.page).toHaveURL(new RegExp(`#/billing/sales/${saleId}/edit$`));
    await expect(productInput(billingRow(app.page, 0))).toHaveValue(
      app.seed.products.standard.productSnapshot
    );
    expect(
      (await app.api.get<PersistedTransaction>(`/api/sales/${saleId}`)).items[0]
    ).toMatchObject(sale.items[0]!);
  });

  test("two selections of the same catalog product remain separate ordered rows", async ({
    app
  }) => {
    await openBillingRoute(app.page, "sales");
    await waitForSaveResponse(
      app.page,
      () => selectProduct(app.page, app.seed.products.standard.name, 0),
      { type: "sales", endpoint: "create", status: 200 }
    );
    const saleId = await waitForTransactionId(app.page);
    await waitForSaveResponse(
      app.page,
      () => selectProduct(app.page, app.seed.products.standard.name, 1),
      { type: "sales", endpoint: "sync", transactionId: saleId, status: 200 }
    );

    const sale = await app.api.get<PersistedTransaction>(`/api/sales/${saleId}`);
    expect(sale.items.map((item) => item.productId)).toEqual([
      app.seed.products.standard.id,
      app.seed.products.standard.id
    ]);
    const positions = sale.items.map((item) => item.position);
    expect(new Set(positions).size).toBe(positions.length);
    expect(
      positions.every((position, index) => index === 0 || position > positions[index - 1]!)
    ).toBe(true);
    expect(sale.grandTotal).toBe(13_600);
    expect(sale.totalQuantity).toBe(2000);
    expect(
      (await app.api.get<SeedProduct>(`/api/products/${app.seed.products.standard.id}`))
        .totalQuantitySold
    ).toBe(2000);
  });

  test("Save & Exit cannot silently discard a visible partial row", async ({ app }) => {
    await openBillingRoute(app.page, "sales");
    await waitForSaveResponse(
      app.page,
      () => selectProduct(app.page, app.seed.products.standard.name),
      { type: "sales", endpoint: "create", status: 200 }
    );
    const saleId = await waitForTransactionId(app.page);

    const partial = billingRow(app.page, 1);
    await productInput(partial).fill("Unfinished operator row");
    await quantityInput(partial).fill("2");
    await app.page.getByRole("button", { name: "Save & Exit" }).click();

    await expect(app.page).toHaveURL(new RegExp(`#/billing/sales/${saleId}/edit$`));
    await expect(productInput(billingRow(app.page, 1))).toHaveValue("Unfinished operator row");
    await expect(app.page.getByText("Saved Successfully")).not.toBeVisible();
    expect((await app.api.get<PersistedTransaction>(`/api/sales/${saleId}`)).items).toHaveLength(1);
  });
});
