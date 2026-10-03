import { test, expect } from "../fixtures/developmentElectron.fixture";
import { createApiTransaction, seedBillingData } from "../fixtures/test-data";
import { billingRow, openBillingRoute, productInput, quantityInput } from "../helpers/billing";

test("billing fields retain focus, status cues, and usable controls at supported viewports", async ({
  developmentElectron
}, testInfo) => {
  const { page, api } = developmentElectron;
  const seed = await seedBillingData(api, "surfaces");
  const sale = await createApiTransaction(api, {
    type: "sale",
    customerId: seed.defaultCustomer.id,
    items: [
      { product: seed.products.longName, quantity: 2500 },
      { product: seed.products.fractional, quantity: 2500, checkedQty: 1250 },
      { product: seed.products.largeAmount, quantity: 1000, checkedQty: 1000 }
    ]
  });
  await page.reload();
  await openBillingRoute(page, "sales", sale.id);

  for (const viewport of [
    { width: 1280, height: 650 },
    { width: 1024, height: 600 },
    { width: 1366, height: 700 },
    { width: 1600, height: 900 },
    { width: 1920, height: 1080 }
  ]) {
    await page.setViewportSize(viewport);
    // Below the dock breakpoint the preview is an intentional overlay.
    // Dismiss it through its real control before interacting with the bill.
    if (viewport.width < 1280) {
      await page.getByRole("button", { name: "Close preview panel" }).click();
    }
    await expect(page.getByRole("button", { name: "Print & Close" })).toBeVisible();
    await page
      .getByRole("button", { name: "Print & Close" })
      .click({ trial: true, timeout: 10_000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    await expect(billingRow(page, 1).locator('[data-check-state="partial"]')).toHaveCount(1);
    await expect(billingRow(page, 2).locator('[data-check-state="complete"]')).toHaveCount(1);
    if (viewport.width <= 1280) {
      await page.screenshot({ path: testInfo.outputPath(`billing-${viewport.width}.png`) });
    }
  }

  await page.setViewportSize({ width: 1280, height: 650 });
  const product = productInput(billingRow(page, 0));
  await product.focus();
  await page.keyboard.press("Tab");
  await expect(
    billingRow(page, 0).getByRole("button", { name: "Increase quantity" })
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(quantityInput(billingRow(page, 0))).toBeFocused();
  const focused = await page.evaluate(() => {
    const element = document.activeElement!;
    const field = element.closest('[class*="focus-within:ring"]') ?? element;
    return getComputedStyle(field).boxShadow;
  });
  expect(focused).not.toBe("none");
  await page.getByRole("button", { name: "New product", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
