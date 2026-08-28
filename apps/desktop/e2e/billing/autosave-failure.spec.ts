import { test, expect } from "../fixtures/app.fixture";
import { createApiTransaction, type PersistedTransaction } from "../fixtures/test-data";
import {
  billingRow,
  openBillingRoute,
  quantityInput,
  waitForSaveResponse
} from "../helpers/billing";

test.describe("critical autosave failure journeys", () => {
  test("failed save keeps the operator on Billing and a later edit recovers", async ({ app }) => {
    const created = await createApiTransaction(app.api, {
      type: "sale",
      customerId: app.seed.defaultCustomer.id,
      items: [{ product: app.seed.products.standard }]
    });
    let shouldFail = true;
    await app.page.route(`**/api/sales/${created.id}/sync`, (route) =>
      shouldFail
        ? route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ error: { message: "deterministic save failure" } })
          })
        : route.continue()
    );
    await openBillingRoute(app.page, "sales", created.id);

    await quantityInput(billingRow(app.page, 0)).fill("2.125");
    await expect(app.page.getByText("Save Failed", { exact: true })).toBeVisible();
    await app.page.getByRole("button", { name: "Save & Exit" }).click();
    await expect(app.page).toHaveURL(new RegExp(`#/billing/sales/${created.id}/edit$`));
    await expect(quantityInput(billingRow(app.page, 0))).toHaveValue("2.125");
    expect(
      (await app.api.get<PersistedTransaction>(`/api/sales/${created.id}`)).items[0]?.quantity
    ).toBe(1000);

    shouldFail = false;
    await waitForSaveResponse(
      app.page,
      () => quantityInput(billingRow(app.page, 0)).fill("3.125"),
      {
        type: "sales",
        endpoint: "sync",
        transactionId: created.id,
        status: 200,
        requestMatches: (body) => JSON.stringify(body).includes('"quantity":3125')
      }
    );
    await expect(app.page.getByText("Saved", { exact: true })).toBeVisible();
    expect(
      (await app.api.get<PersistedTransaction>(`/api/sales/${created.id}`)).items[0]?.quantity
    ).toBe(3125);
  });

  test("Save & Exit waits for the exact in-flight transaction response", async ({ app }) => {
    const created = await createApiTransaction(app.api, {
      type: "sale",
      customerId: app.seed.defaultCustomer.id,
      items: [{ product: app.seed.products.standard }]
    });
    let release = (): void => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await app.page.route(`**/api/sales/${created.id}/sync`, async (route) => {
      await gate;
      await route.continue();
    });
    await openBillingRoute(app.page, "sales", created.id);

    const request = app.page.waitForRequest(
      (candidate) =>
        candidate.method() === "POST" &&
        new URL(candidate.url()).pathname === `/api/sales/${created.id}/sync`
    );
    await quantityInput(billingRow(app.page, 0)).fill("4.250");
    await request;
    await app.page.getByRole("button", { name: "Save & Exit" }).click();
    await expect(app.page).toHaveURL(new RegExp(`#/billing/sales/${created.id}/edit$`));

    const response = app.page.waitForResponse(
      (candidate) =>
        candidate.status() === 200 &&
        new URL(candidate.url()).pathname === `/api/sales/${created.id}/sync`
    );
    release();
    await response;
    await expect(app.page).toHaveURL(/#\/dashboard\/sales$/);
    expect(
      (await app.api.get<PersistedTransaction>(`/api/sales/${created.id}`)).items[0]?.quantity
    ).toBe(4250);
  });
});
