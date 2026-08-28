import { defineConfig } from "@playwright/test";
import path from "node:path";

const desktopRoot = __dirname;

export default defineConfig({
  testDir: path.join(desktopRoot, "e2e", "journeys"),
  outputDir: path.join(desktopRoot, "test-results"),
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: path.join(desktopRoot, "playwright-report") }]
  ],
  use: {
    trace: "off",
    screenshot: "off",
    video: "off"
  }
});
