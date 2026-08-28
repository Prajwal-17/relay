import { expect, type Locator, type Page, type Response } from "@playwright/test";

export type BillingType = "sales" | "estimates";

export function billingRows(page: Page): Locator {
  return page.locator("[data-billing-row-id]");
}

export function billingRow(page: Page, index: number): Locator {
  return billingRows(page).nth(index);
}

export function productInput(row: Locator): Locator {
  return row.getByPlaceholder("Search products");
}

export function quantityInput(row: Locator): Locator {
  return row.locator('input[inputmode="decimal"]');
}

export function priceInput(row: Locator): Locator {
  return row.locator("input").nth(2);
}

export async function openBillingRoute(page: Page, type: BillingType, id?: string): Promise<void> {
  const route = id ? `/billing/${type}/${id}/edit` : `/billing/${type}/create`;
  await page.evaluate((nextRoute) => {
    window.location.hash = `#${nextRoute}`;
  }, route);
  await expect(page.getByPlaceholder("Search products").first()).toBeVisible();
  await expect(page.getByRole("combobox")).toBeVisible();
}

export async function selectProduct(page: Page, productName: string, rowIndex = 0): Promise<void> {
  const input = productInput(billingRow(page, rowIndex));
  const responsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      response.request().method() === "GET" &&
      url.pathname === "/api/products/search" &&
      url.searchParams.get("billingMode") === "true" &&
      url.searchParams.get("query") === productName
    );
  });
  await input.fill(productName);
  await responsePromise;

  const exactName = new RegExp(`^${escapeRegex(productName)}$`);
  const result = page.locator("[data-search-dropdown-index]").filter({
    has: page.locator("h4").filter({ hasText: exactName })
  });
  await expect(result.first()).toBeVisible();
  await result.first().click({ position: { x: 180, y: 24 } });
  await expect(input).toHaveValue(new RegExp(escapeRegex(productName)));
}

export async function enterManualItem(
  page: Page,
  values: { name: string; quantity: string; price: string },
  rowIndex = 0
): Promise<void> {
  const row = billingRow(page, rowIndex);
  await productInput(row).fill(values.name);
  await quantityInput(row).fill(values.quantity);
  await priceInput(row).fill(values.price);
}

export async function waitForSaveResponse(
  page: Page,
  action: () => Promise<unknown>,
  options: {
    type: BillingType;
    endpoint: "create" | "sync";
    transactionId?: string;
    status?: number;
    requestMatches?: (body: unknown) => boolean;
  }
): Promise<Response> {
  if (options.endpoint === "sync" && !options.transactionId) {
    throw new Error("A transactionId is required when waiting for a sync response.");
  }
  const expectedPath =
    options.endpoint === "create"
      ? `/api/${options.type}/create`
      : `/api/${options.type}/${options.transactionId}/sync`;
  const responsePromise = page.waitForResponse((response) => {
    const request = response.request();
    if (
      request.method() !== "POST" ||
      new URL(response.url()).pathname !== expectedPath ||
      (options.status !== undefined && response.status() !== options.status)
    ) {
      return false;
    }
    if (!options.requestMatches) return true;
    try {
      return options.requestMatches(request.postDataJSON());
    } catch {
      return false;
    }
  });
  await action();
  return responsePromise;
}

export async function currentTransactionId(page: Page): Promise<string | null> {
  const hash = await page.evaluate(() => window.location.hash);
  return /\/billing\/(?:sales|estimates)\/([0-9a-f-]+)\/edit/.exec(hash)?.[1] ?? null;
}

export async function waitForTransactionId(page: Page): Promise<string> {
  let transactionId: string | null = null;
  await expect
    .poll(async () => {
      transactionId = await currentTransactionId(page);
      return transactionId;
    })
    .not.toBeNull();
  return transactionId!;
}

export async function selectCustomer(page: Page, customerName: string): Promise<void> {
  await page.getByRole("combobox", { name: "Select customer" }).click();
  const input = page.getByPlaceholder("Search customer...");
  const responsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      response.request().method() === "GET" &&
      url.pathname === "/api/customers" &&
      url.searchParams.get("query") === customerName
    );
  });
  await input.fill(customerName);
  await responsePromise;
  await page
    .locator('[data-radix-popper-content-wrapper] button[type="button"]')
    .filter({ hasText: new RegExp(`^${escapeRegex(customerName)}`) })
    .first()
    .click();
  await expect(page.getByRole("combobox", { name: "Select customer" })).toContainText(customerName);
}

export async function dragRow(page: Page, fromIndex: number, toIndex: number): Promise<void> {
  const from = billingRow(page, fromIndex).getByRole("button", { name: /Move row/ });
  const to = billingRow(page, toIndex);
  const fromBox = await from.boundingBox();
  const toBox = await to.boundingBox();
  if (!fromBox || !toBox) throw new Error("Could not resolve billing row drag coordinates.");
  await page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + toBox.height / 2, { steps: 8 });
  await page.mouse.up();
}

export function exactLineTotal(pricePaisa: number, quantityMilliUnits: number): number {
  return Math.round((pricePaisa * quantityMilliUnits) / 1000);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
