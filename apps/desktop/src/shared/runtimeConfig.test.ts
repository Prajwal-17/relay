import { describe, expect, it } from "vitest";
import { DEVELOPMENT_API_PORT, PRODUCTION_API_PORT, resolveApiPort } from "./runtimeConfig";

describe("resolveApiPort", () => {
  it("keeps the established development and production defaults", () => {
    expect(resolveApiPort(undefined, "development")).toBe(DEVELOPMENT_API_PORT);
    expect(resolveApiPort("", "production")).toBe(PRODUCTION_API_PORT);
  });

  it("accepts the complete valid port range", () => {
    expect(resolveApiPort("1", "development")).toBe(1);
    expect(resolveApiPort("65535", "production")).toBe(65_535);
  });

  it.each(["0", "65536", "-1", "1.5", "4723x", "Infinity"])("rejects invalid value %s", (value) => {
    expect(() => resolveApiPort(value, "development")).toThrow(/integer between 1 and 65535/);
  });

  it("treats whitespace-only configuration as absent", () => {
    expect(resolveApiPort("   ", "development")).toBe(DEVELOPMENT_API_PORT);
  });
});
