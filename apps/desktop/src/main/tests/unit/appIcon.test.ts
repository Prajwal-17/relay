import { afterEach, describe, expect, it, vi } from "vitest";
import { join } from "node:path";

const mocks = vi.hoisted(() => ({
  app: { isPackaged: false, getAppPath: () => "/workspace/apps/desktop" },
  exists: vi.fn(() => true)
}));
vi.mock("electron", () => ({ app: mocks.app }));
vi.mock("node:fs", () => ({ existsSync: mocks.exists }));
import { getAppIconPath } from "../../appIcon";

const platform = Object.getOwnPropertyDescriptor(process, "platform")!;
const resources = Object.getOwnPropertyDescriptor(process, "resourcesPath");
afterEach(() => {
  vi.unstubAllEnvs();
  mocks.app.isPackaged = false;
  mocks.exists.mockReturnValue(true);
  Object.defineProperty(process, "platform", platform);
  if (resources) Object.defineProperty(process, "resourcesPath", resources);
  else Reflect.deleteProperty(process, "resourcesPath");
});

describe("native app icon selection", () => {
  it.each(["linux", "win32", "darwin"])("distinguishes dev and production on %s", (os) => {
    Object.defineProperty(process, "platform", { configurable: true, value: os });
    const extension = os === "win32" ? "ico" : "png";
    vi.stubEnv("MODE", "development");
    expect(getAppIconPath()).toBe(join("/workspace/assets/desktop", `icon-dev.${extension}`));
    vi.stubEnv("MODE", "production");
    expect(getAppIconPath()).toBe(join("/workspace/assets/desktop", `icon.${extension}`));
  });
  it("uses the resource chosen by the packaged build", () => {
    mocks.app.isPackaged = true;
    Object.defineProperty(process, "resourcesPath", { configurable: true, value: "/resources" });
    vi.stubEnv("MODE", "development");
    expect(getAppIconPath()).toBe(join("/resources", "relay-icon.png"));
  });
  it("does not pass a missing asset to Electron", () => {
    mocks.exists.mockReturnValue(false);
    expect(getAppIconPath()).toBeUndefined();
  });
});
