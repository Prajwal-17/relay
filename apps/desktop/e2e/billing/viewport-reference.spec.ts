import path from "node:path";
import { test, expect } from "../fixtures/app.fixture";
import { createApiTransaction } from "../fixtures/test-data";
import {
  billingRow,
  openBillingRoute,
  productInput,
  selectProduct,
  waitForSaveResponse,
  waitForTransactionId
} from "../helpers/billing";

const imageFixture = path.resolve(__dirname, "../../build/icon-dev.png");

test.describe("critical billing viewport and reference smoke", () => {
  test("supported content viewports and zoom keep real controls actionable", async ({ app }) => {
    await openBillingRoute(app.page, "sales");

    for (const viewport of [
      { width: 1280, height: 650 },
      { width: 1024, height: 600 }
    ]) {
      await app.resize(viewport.width, viewport.height);
      expect(
        await app.page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }))
      ).toEqual(viewport);
      await expect(app.page.getByRole("button", { name: "Save & Exit" })).toBeVisible();
      await app.page.getByRole("button", { name: "Save & Exit" }).click({ trial: true });
      await expect(app.page.locator("footer .financial-nums")).toBeVisible();
      expect(
        await app.page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
        )
      ).toBe(true);

      await productInput(billingRow(app.page, 0)).click();
      await expect(app.page.locator("[data-search-dropdown-index]").first()).toBeVisible();
      await app.page.keyboard.press("Escape");
    }

    for (const factor of [0.9, 1, 1.1]) {
      const result = await app.page.evaluate(
        (nextFactor) =>
          (
            window as unknown as {
              zoomApi: {
                setZoom: (value: number) => Promise<{ zoomFactor: number }>;
              };
            }
          ).zoomApi.setZoom(nextFactor),
        factor
      );
      expect(result.zoomFactor).toBe(factor);
      await expect(app.page.getByRole("button", { name: "Save & Exit" })).toBeVisible();
      await app.page.getByRole("button", { name: "Save & Exit" }).click({ trial: true });
    }
  });

  test("selecting a UPI QR option on a long bill keeps the workspace anchored", async ({ app }) => {
    const upiProfileId = "11111111-1111-4111-8111-111111111111";
    await app.api.patch("/api/app-preferences", {
      printing: {
        upiQrProfiles: [
          {
            id: upiProfileId,
            label: "Main counter",
            upiId: "quickcart@bank",
            payeeName: "QuickCart E2E Store"
          }
        ],
        defaultUpiQrProfileId: upiProfileId
      }
    });
    const transaction = await createApiTransaction(app.api, {
      type: "sale",
      customerId: app.seed.defaultCustomer.id,
      items: Array.from({ length: 15 }, (_, index) => ({
        name: `Long bill item ${index + 1}`,
        price: 1000 + index,
        quantity: 1000
      }))
    });

    await app.page.reload();
    await openBillingRoute(app.page, "sales", transaction.id);

    const billingScroller = app.page.locator("[data-billing-scroll-container]");
    await billingScroller.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    const exactTotalOption = app.page.getByText("Exact total", { exact: true });
    await expect(exactTotalOption).toBeVisible();

    const shellWorkspace = app.page.locator("main > section");
    const billingWorkspace = app.page.locator("[data-billing-workspace]");
    await expect(shellWorkspace).toHaveJSProperty("scrollTop", 0);
    await expect(billingWorkspace).toHaveJSProperty("scrollTop", 0);
    await exactTotalOption.click();

    await expect(app.page.getByText("Main counter", { exact: true })).toBeVisible();
    await expect(shellWorkspace).toHaveJSProperty("scrollTop", 0);
    await expect(billingWorkspace).toHaveJSProperty("scrollTop", 0);
    const footerBottom = await app.page.locator("footer").evaluate((footer) => {
      const bounds = footer.getBoundingClientRect();
      return Math.round(bounds.bottom);
    });
    expect(footerBottom).toBe(650);
  });

  test("reference image stays tab-local and follows documented restart behavior", async ({
    app
  }) => {
    await openBillingRoute(app.page, "sales");
    await waitForSaveResponse(
      app.page,
      () => selectProduct(app.page, app.seed.products.standard.name),
      { type: "sales", endpoint: "create", status: 200 }
    );
    const saleId = await waitForTransactionId(app.page);

    await app.page.getByLabel("Open item list").click();
    const referenceWindow = app.page.locator("[data-billing-reference-window]");
    await expect(referenceWindow).toBeVisible();
    await referenceWindow.locator('input[type="file"]').setInputFiles(imageFixture);
    await expect(
      referenceWindow.getByAltText("Handwritten order sheet: icon-dev.png")
    ).toBeVisible();

    await app.page.getByLabel("New Estimate").click();
    await expect(referenceWindow.getByText("No image selected")).toBeVisible();
    await app.page.getByRole("button", { name: /Sale #/ }).click();
    await expect(app.page).toHaveURL(new RegExp(`#/billing/sales/${saleId}/edit$`));
    await expect(
      referenceWindow.getByAltText("Handwritten order sheet: icon-dev.png")
    ).toBeVisible();

    await app.restart();
    await openBillingRoute(app.page, "sales", saleId);
    await app.page.getByLabel("Open item list").click();
    const restarted = app.page.locator("[data-billing-reference-window]");
    await expect(restarted.getByText("No image selected")).toBeVisible();
    await restarted.locator('input[type="file"]').setInputFiles(imageFixture);
    await restarted.getByLabel("Remove reference image").click();
    await expect(restarted.getByText("No image selected")).toBeVisible();
    await restarted.getByLabel("Close reference image").click();
    await expect(restarted).not.toBeVisible();
  });
});
