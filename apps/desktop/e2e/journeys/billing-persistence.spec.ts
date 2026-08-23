import { access } from "node:fs/promises";
import type { Page } from "@playwright/test";
import { test, expect } from "../fixtures/developmentElectron.fixture";
import {
  createSeedProduct,
  type PersistedTransaction,
  type SeedCustomer,
  type SeedProduct
} from "../fixtures/test-data";
import {
  billingRow,
  openBillingRoute,
  productInput,
  quantityInput,
  selectCustomer,
  waitForSaveResponse,
  waitForTransactionId
} from "../helpers/billing";
import type { PublicApi } from "../helpers/api";

const onboardingPayload = {
  storeName: "QuickCart Persistence Store",
  ownerName: "Persistence Owner",
  phone: "9876543210",
  email: "persistence@example.com",
  addressLine1: "12 Test Market Road",
  addressLine2: null,
  country: "India",
  state: "Karnataka",
  city: "Bengaluru",
  pincode: "560001",
  gstin: null
};

type LedgerResponse = {
  data: Array<{ customerId: string; saleId: string | null; amountDue: number }>;
};

async function bootstrap(api: PublicApi): Promise<SeedCustomer> {
  await api.post("/api/onboarding", onboardingPayload);
  return api.get<SeedCustomer>("/api/customers/default");
}

async function accountCustomer(api: PublicApi, name: string): Promise<SeedCustomer> {
  return api.post<SeedCustomer>("/api/customers", {
    name,
    contact: null,
    customerType: "account",
    openingBalance: 1250
  });
}

async function selectProductWithKeyboard(page: Page, productName: string): Promise<void> {
  const input = productInput(billingRow(page, 0));
  const response = page.waitForResponse((candidate) => {
    const url = new URL(candidate.url());
    return (
      candidate.request().method() === "GET" &&
      url.pathname === "/api/products/search" &&
      url.searchParams.get("query") === productName
    );
  });
  await input.fill(productName);
  await response;
  await expect(page.locator("[data-search-dropdown-index]").first()).toBeVisible();
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(input).toHaveValue(new RegExp(productName));
}

test.describe("development Electron billing persistence", () => {
  test("fresh database migrates, completes onboarding through the UI, and stays onboarded", async ({
    developmentElectron
  }) => {
    const page = developmentElectron.page;
    await expect(page.getByRole("heading", { name: /Welcome to QuickCart/ })).toBeVisible();
    await page.getByRole("button", { name: "Get Started" }).click();
    await page.getByLabel(/Store Name/).fill(onboardingPayload.storeName);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel(/Owner Name/).fill(onboardingPayload.ownerName);
    await page.getByLabel(/Phone Number/).fill(onboardingPayload.phone);
    await page.getByLabel(/Email Address/).fill(onboardingPayload.email);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel(/Address Line 1/).fill(onboardingPayload.addressLine1);
    const locationComboboxes = page.getByRole("combobox");
    await locationComboboxes.nth(0).click();
    await page.getByPlaceholder("Search state...").fill("Karnataka");
    await page.getByRole("option", { name: "Karnataka" }).click();
    await locationComboboxes.nth(1).click();
    await page.getByPlaceholder("Search city...").fill("Bengaluru");
    await page.getByRole("option", { name: "Bengaluru" }).click();
    await page.getByLabel(/Pincode/).fill(onboardingPayload.pincode);
    await page.getByRole("button", { name: "Finish Setup" }).click();

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect
      .poll(() => developmentElectron.api.get<{ isComplete: boolean }>("/api/onboarding/status"))
      .toEqual({ isComplete: true });
    const [customer, preferences, profile] = await Promise.all([
      developmentElectron.api.get<SeedCustomer>("/api/customers/default"),
      developmentElectron.api.get<{ config: unknown }>("/api/app-preferences"),
      developmentElectron.api.get<{ storeName: string }>("/api/store-profile")
    ]);
    expect(customer.name).toBe("DEFAULT");
    expect(preferences.config).toBeTruthy();
    expect(profile.storeName).toBe(onboardingPayload.storeName);
    await access(developmentElectron.databasePath);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Get Started" })).toHaveCount(0);
  });

  test("sale autosave, accounting, reload, and full development restart preserve exact values", async ({
    developmentElectron
  }) => {
    const api = developmentElectron.api;
    await bootstrap(api);
    const customer = await accountCustomer(api, "Anita Persistence");
    const product = await createSeedProduct(api, {
      name: "Fractional Persistence Almonds",
      price: 12_345,
      mrp: 13_000,
      weight: "1",
      unit: "kg",
      purchasePrice: 10_001
    });
    await developmentElectron.page.reload();
    await openBillingRoute(developmentElectron.page, "sales");
    await selectCustomer(developmentElectron.page, customer.name);
    await developmentElectron.page
      .getByRole("button", { name: "Add this sale to the customer account" })
      .click();
    const created = developmentElectron.page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname === "/api/sales/create" &&
        response.status() === 200
    );
    await selectProductWithKeyboard(developmentElectron.page, product.name);
    await created;
    const saleId = await waitForTransactionId(developmentElectron.page);
    await waitForSaveResponse(
      developmentElectron.page,
      async () => {
        await quantityInput(billingRow(developmentElectron.page, 0)).fill("3.001");
        await developmentElectron.page.getByLabel("Billing notes").fill("Restart persistence note");
      },
      {
        type: "sales",
        endpoint: "sync",
        transactionId: saleId,
        status: 200,
        requestMatches: (body) => {
          const value = JSON.stringify(body);
          return value.includes('"quantity":3001') && value.includes("Restart persistence note");
        }
      }
    );
    await expect(
      developmentElectron.page.getByRole("status", { name: "Billing save status" })
    ).toHaveText("Saved");

    const sale = await api.get<PersistedTransaction>(`/api/sales/${saleId}`);
    expect(sale).toMatchObject({
      customerId: customer.id,
      notes: "Restart persistence note",
      grandTotal: 37_047,
      totalQuantity: 3001,
      isAddedToAccounting: true
    });
    expect(sale.transactionNo).toBeGreaterThan(0);
    expect(sale.items).toHaveLength(1);
    expect(sale.items[0]).toMatchObject({
      productId: product.id,
      productSnapshot: product.productSnapshot,
      price: 12_345,
      quantity: 3001,
      totalPrice: 37_047
    });
    expect((await api.get<SeedProduct>(`/api/products/${product.id}`)).totalQuantitySold).toBe(
      3001
    );
    const ledger = await api.get<LedgerResponse>(`/api/customers/${customer.id}/ledger`);
    expect(ledger.data.filter((entry) => entry.saleId === saleId)).toEqual([
      expect.objectContaining({ customerId: customer.id, amountDue: 37_047 })
    ]);
    expect((await api.get<SeedCustomer>(`/api/customers/${customer.id}`)).outstandingBalance).toBe(
      38_297
    );

    await developmentElectron.page.reload();
    await expect(developmentElectron.page.getByLabel("Product row 1")).toHaveValue(
      product.productSnapshot
    );
    await expect(developmentElectron.page.getByLabel("Quantity row 1")).toHaveValue("3.001");
    await expect(developmentElectron.page.getByLabel("Billing notes")).toHaveValue(
      "Restart persistence note"
    );

    const restartedPage = await developmentElectron.restart();
    await expect(restartedPage.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await restartedPage.getByRole("link", { name: "Sales" }).click();
    const row = restartedPage.getByRole("row").filter({ hasText: `#${sale.transactionNo}` });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Edit transaction" }).click();
    await expect(restartedPage).toHaveURL(new RegExp(`#/billing/sales/${saleId}/edit$`));
    await expect(restartedPage.getByLabel("Product row 1")).toHaveValue(product.productSnapshot);
    await expect(restartedPage.getByLabel("Quantity row 1")).toHaveValue("3.001");
    await expect(restartedPage.getByLabel("Billing notes")).toHaveValue("Restart persistence note");
  });

  test("estimate autosave persists exact totals without creating customer accounting", async ({
    developmentElectron
  }) => {
    const api = developmentElectron.api;
    await bootstrap(api);
    const customer = await accountCustomer(api, "Estimate Account Customer");
    const product = await createSeedProduct(api, {
      name: "Estimate Fractional Product",
      price: 12_345,
      mrp: 13_000
    });
    await developmentElectron.page.reload();
    await openBillingRoute(developmentElectron.page, "estimates");
    await selectCustomer(developmentElectron.page, customer.name);
    const created = developmentElectron.page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        new URL(response.url()).pathname === "/api/estimates/create" &&
        response.status() === 200
    );
    await selectProductWithKeyboard(developmentElectron.page, product.name);
    await created;
    const estimateId = await waitForTransactionId(developmentElectron.page);
    await waitForSaveResponse(
      developmentElectron.page,
      async () => {
        await quantityInput(billingRow(developmentElectron.page, 0)).fill("2.125");
        await developmentElectron.page
          .getByLabel("Billing notes")
          .fill("Estimate persistence note");
      },
      { type: "estimates", endpoint: "sync", transactionId: estimateId, status: 200 }
    );
    await expect(
      developmentElectron.page.getByRole("status", { name: "Billing save status" })
    ).toHaveText("Saved");

    const estimate = await api.get<PersistedTransaction>(`/api/estimates/${estimateId}`);
    expect(estimate).toMatchObject({
      customerId: customer.id,
      notes: "Estimate persistence note",
      grandTotal: 26_233,
      totalQuantity: 2125
    });
    expect(estimate.items[0]).toMatchObject({
      productId: product.id,
      productSnapshot: product.productSnapshot,
      price: 12_345,
      quantity: 2125,
      totalPrice: 26_233
    });
    expect((await api.get<SeedProduct>(`/api/products/${product.id}`)).totalQuantitySold).toBe(
      2125
    );
    const ledger = await api.get<LedgerResponse>(`/api/customers/${customer.id}/ledger`);
    expect(ledger.data.filter((entry) => entry.saleId !== null)).toHaveLength(0);
    expect((await api.get<SeedCustomer>(`/api/customers/${customer.id}`)).outstandingBalance).toBe(
      1250
    );
    await developmentElectron.page.reload();
    await expect(developmentElectron.page.getByLabel("Product row 1")).toHaveValue(
      product.productSnapshot
    );
    await expect(developmentElectron.page.getByLabel("Quantity row 1")).toHaveValue("2.125");
    await expect(developmentElectron.page.getByLabel("Billing notes")).toHaveValue(
      "Estimate persistence note"
    );
  });
});
