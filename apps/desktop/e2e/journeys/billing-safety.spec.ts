import type { Page } from "@playwright/test";
import { test, expect } from "../fixtures/developmentElectron.fixture";
import {
  createApiTransaction,
  createSeedProduct,
  type PersistedTransaction,
  type SeedCustomer,
  type SeedProduct
} from "../fixtures/test-data";
import { billingRow, openBillingRoute, productInput, quantityInput } from "../helpers/billing";
import type { PublicApi } from "../helpers/api";

const onboardingPayload = {
  storeName: "QuickCart Billing Safety",
  ownerName: "Safety Test Owner",
  phone: "9876543210",
  email: "billing-safety@example.com",
  addressLine1: "12 Safety Test Road",
  addressLine2: null,
  country: "India",
  state: "Karnataka",
  city: "Bengaluru",
  pincode: "560001",
  gstin: null
};

type ReadyBill = {
  transaction: PersistedTransaction;
  original: SeedProduct;
  replacement: SeedProduct;
};

async function prepareSavedBill(api: PublicApi, page: Page): Promise<ReadyBill> {
  await api.post("/api/onboarding", onboardingPayload);
  const customer = await api.get<SeedCustomer>("/api/customers/default");
  const original = await createSeedProduct(api, {
    name: "Committed Safety Product",
    price: 12_345,
    mrp: 13_000
  });
  const replacement = await createSeedProduct(api, {
    name: "Replacement Safety Product",
    price: 15_234,
    mrp: 16_000
  });
  const transaction = await createApiTransaction(api, {
    type: "sale",
    customerId: customer.id,
    items: [{ product: original, quantity: 1000 }]
  });

  await page.reload();
  await openBillingRoute(page, "sales", transaction.id);
  await expect(productInput(billingRow(page, 0))).toHaveValue(original.productSnapshot);
  return { transaction, original, replacement };
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

test.describe("billing persistence safety journeys", () => {
  test("a half-typed replacement remains unsaved and leaves the original database row unchanged", async ({
    developmentElectron
  }) => {
    const { page, api } = developmentElectron;
    const { transaction, original, replacement } = await prepareSavedBill(api, page);
    const before = await api.get<PersistedTransaction>(`/api/sales/${transaction.id}`);
    const input = productInput(billingRow(page, 0));
    const partialReplacement = replacement.name.slice(0, 15);

    await input.fill(partialReplacement);
    await delay(1200);

    const after = await api.get<PersistedTransaction>(`/api/sales/${transaction.id}`);
    expect.soft(input).toHaveValue(partialReplacement);
    expect.soft(after.items).toHaveLength(1);
    expect.soft(after.items[0]).toMatchObject({
      id: before.items[0]!.id,
      productId: original.id,
      name: before.items[0]!.name,
      productSnapshot: original.productSnapshot,
      price: before.items[0]!.price,
      quantity: before.items[0]!.quantity,
      totalPrice: before.items[0]!.totalPrice
    });
  });

  test("immediate reload after an edit waits for persistence", async ({ developmentElectron }) => {
    const { page, api } = developmentElectron;
    const { transaction } = await prepareSavedBill(api, page);

    await quantityInput(billingRow(page, 0)).fill("2.500");
    await page.reload();
    await expect(productInput(billingRow(page, 0))).toBeVisible();

    const persisted = await api.get<PersistedTransaction>(`/api/sales/${transaction.id}`);
    expect.soft(persisted.items[0]?.quantity).toBe(2500);
    expect.soft(quantityInput(billingRow(page, 0))).toHaveValue("2.5");
    expect.soft(page).toHaveURL(new RegExp(`#/billing/sales/${transaction.id}/edit$`));
  });

  test("native close waits for pending work and a failed save keeps the window open", async ({
    developmentElectron
  }) => {
    const { page, api } = developmentElectron;
    const { transaction } = await prepareSavedBill(api, page);
    let markSyncStarted!: () => void;
    let releaseFailure!: () => void;
    const syncStarted = new Promise<void>((resolve) => {
      markSyncStarted = resolve;
    });
    const failureGate = new Promise<void>((resolve) => {
      releaseFailure = resolve;
    });
    await page.route(`**/api/sales/${transaction.id}/sync`, async (route) => {
      markSyncStarted();
      await failureGate;
      await route.abort("connectionfailed").catch(() => undefined);
    });

    await quantityInput(billingRow(page, 0)).fill("3.000");
    await syncStarted;
    await page.evaluate(() => window.close()).catch(() => undefined);
    await delay(150);
    const remainedOpenWhileSaving = !page.isClosed();
    releaseFailure();
    await delay(400);
    const remainedOpenAfterFailure = !page.isClosed();

    expect.soft(remainedOpenWhileSaving).toBe(true);
    expect.soft(remainedOpenAfterFailure).toBe(true);
    if (remainedOpenAfterFailure) {
      await expect(page.getByRole("status", { name: "Billing save status" })).toHaveText("Error");
    }
  });
});
