import productionIcon from "@assets/desktop/app-icon.svg";
import productionSmallIcon from "@assets/desktop/app-icon-small.svg";
import developmentIcon from "@assets/desktop/app-icon-dev.svg";
import developmentSmallIcon from "@assets/desktop/app-icon-dev-small.svg";
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it.each(["development", "production"])("uses matching renderer assets in %s mode", async (mode) => {
  vi.stubEnv("MODE", mode);
  vi.resetModules();
  const { relayAppIcon, relaySmallAppIcon } = await import("./appIcon");
  expect(developmentIcon).not.toBe(productionIcon);
  expect(developmentSmallIcon).not.toBe(productionSmallIcon);
  expect(relayAppIcon).toBe(mode === "development" ? developmentIcon : productionIcon);
  expect(relaySmallAppIcon).toBe(
    mode === "development" ? developmentSmallIcon : productionSmallIcon
  );
});
