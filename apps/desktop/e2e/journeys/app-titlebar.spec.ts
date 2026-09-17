import { expect, test } from "../fixtures/app.fixture";

test.describe("application title bar", () => {
  test("combines app identity, essential menus, and window controls", async ({ app }) => {
    const titleBar = app.page.getByRole("banner", { name: "Application title bar" });
    await expect(titleBar).toBeVisible();
    await expect(titleBar).toContainText("Relay-Dev");
    await expect(titleBar.getByText(/^v\d+\.\d+\.\d+/)).toBeVisible();
    expect(
      await titleBar.evaluate((element) => Math.round(element.getBoundingClientRect().height))
    ).toBe(36);

    await expect(app.page.getByRole("button", { name: "Minimize window" })).toBeVisible();
    await expect(app.page.getByRole("button", { name: "Maximize window" })).toBeVisible();
    await expect(app.page.getByRole("button", { name: "Close window" })).toBeVisible();

    await app.page.getByRole("menuitem", { name: "View" }).click();
    await expect(app.page.getByRole("menuitem", { name: /Reload Relay/ })).toBeVisible();
    await app.page.getByRole("menuitem", { name: /Zoom in/ }).click();
    await expect
      .poll(() =>
        app.page.evaluate(() =>
          (
            window as unknown as {
              zoomApi: { getZoom: () => Promise<{ zoomFactor: number }> };
            }
          ).zoomApi.getZoom()
        )
      )
      .toEqual({ zoomFactor: 1.05 });

    await app.page.getByRole("menuitem", { name: "Help" }).click();
    await expect(app.page.getByRole("menuitem", { name: "Check for updates" })).toBeVisible();
  });
});
