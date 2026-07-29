import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFallbackDbPath } from "../../../utils/fallbackDbPath";

describe("getFallbackDbPath", () => {
  const platformDescriptor = Object.getOwnPropertyDescriptor(process, "platform");

  beforeEach(() => {
    vi.spyOn(os, "homedir").mockReturnValue("/home/tester");
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    if (platformDescriptor) Object.defineProperty(process, "platform", platformDescriptor);
  });

  it("uses the development application directory by default", () => {
    Object.defineProperty(process, "platform", { configurable: true, value: "linux" });
    vi.stubEnv("MODE", "");
    vi.stubEnv("NODE_ENV", "");

    expect(getFallbackDbPath()).toBe(
      path.join("/home/tester", ".config", "QuickCart-Dev", "pos.db")
    );
  });

  it("uses the production application directory outside development", () => {
    Object.defineProperty(process, "platform", { configurable: true, value: "linux" });
    vi.stubEnv("MODE", "production");

    expect(getFallbackDbPath()).toBe(path.join("/home/tester", ".config", "QuickCart", "pos.db"));
  });

  it("uses APPDATA on Windows and falls back to the roaming profile", () => {
    Object.defineProperty(process, "platform", { configurable: true, value: "win32" });
    vi.stubEnv("MODE", "production");
    vi.stubEnv("APPDATA", "/profile/appdata");
    expect(getFallbackDbPath()).toBe(path.join("/profile/appdata", "QuickCart", "pos.db"));

    vi.stubEnv("APPDATA", "");
    expect(getFallbackDbPath()).toBe(
      path.join("/home/tester", "AppData", "Roaming", "QuickCart", "pos.db")
    );
  });
});
