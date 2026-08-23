import { test, expect } from "../fixtures/app.fixture";
import type { PersistedTransaction } from "../fixtures/test-data";
import {
  billingRow,
  openBillingRoute,
  productInput,
  waitForSaveResponse,
  waitForTransactionId
} from "../helpers/billing";

test.describe("critical billing keyboard journeys", () => {
  test("keyboard product selection chooses the highlighted exact product and advances focus", async ({
    app
  }) => {
    await openBillingRoute(app.page, "sales");
    const input = productInput(billingRow(app.page, 0));
    const searchResponse = app.page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        response.request().method() === "GET" &&
        url.pathname === "/api/products/search" &&
        url.searchParams.get("query") === "Masala Tea"
      );
    });
    await input.fill("Masala Tea");
    await searchResponse;
    await expect(app.page.locator("[data-search-dropdown-index]")).toHaveCount(2);

    await input.press("ArrowDown");
    await waitForSaveResponse(app.page, () => input.press("Enter"), {
      type: "sales",
      endpoint: "create",
      status: 200
    });
    const saleId = await waitForTransactionId(app.page);
    const sale = await app.api.get<PersistedTransaction>(`/api/sales/${saleId}`);
    expect(sale.items[0]).toMatchObject({
      productId: app.seed.products.similarBeta.id,
      productSnapshot: app.seed.products.similarBeta.productSnapshot,
      price: app.seed.products.similarBeta.price
    });
    await expect(productInput(billingRow(app.page, 1))).toBeFocused();
  });

  test("keyboard customer search persists the highlighted named customer", async ({ app }) => {
    await openBillingRoute(app.page, "sales");
    await waitForSaveResponse(
      app.page,
      async () => {
        const input = productInput(billingRow(app.page, 0));
        const search = app.page.waitForResponse((response) => {
          const url = new URL(response.url());
          return (
            url.pathname === "/api/products/search" &&
            url.searchParams.get("query") === app.seed.products.standard.name
          );
        });
        await input.fill(app.seed.products.standard.name);
        await search;
        await input.press("Enter");
      },
      { type: "sales", endpoint: "create", status: 200 }
    );
    const saleId = await waitForTransactionId(app.page);

    await app.page.getByRole("combobox").click();
    const customerSearch = app.page.getByPlaceholder("Search customer...");
    const results = app.page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname === "/api/customers" && url.searchParams.get("query") === "Anita";
    });
    await customerSearch.fill("Anita");
    await results;
    await customerSearch.press("ArrowDown");
    await waitForSaveResponse(app.page, () => customerSearch.press("Enter"), {
      type: "sales",
      endpoint: "sync",
      transactionId: saleId,
      status: 200
    });

    await expect(app.page.getByRole("combobox")).toContainText("Anita");
    expect((await app.api.get<PersistedTransaction>(`/api/sales/${saleId}`)).customerId).toBe(
      app.seed.customers.anita.id
    );
  });
});
