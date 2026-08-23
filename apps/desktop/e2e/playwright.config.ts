import { defineConfig } from "@playwright/test";
import path from "node:path";

const desktopRoot = path.resolve(__dirname, "..");

export default defineConfig({
  testDir: path.join(desktopRoot, "e2e", "billing"),
  outputDir: path.join(desktopRoot, "test-results", "artifacts"),
  workers: 1,
  fullyParallel: false,
  maxFailures: 0,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  preserveOutput: "failures-only",
  reporter: [
    ["list"],
    ["json", { outputFile: path.join(desktopRoot, "test-results", "results.json") }],
    ["html", { open: "never", outputFolder: path.join(desktopRoot, "playwright-report") }]
  ]
});
