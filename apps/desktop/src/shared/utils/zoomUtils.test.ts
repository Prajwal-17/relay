import { describe, expect, it } from "vitest";
import { getZoomFactorForShortcut } from "./zoomUtils";

describe("getZoomFactorForShortcut", () => {
  it("snaps granular values to the next five-percent boundary", () => {
    expect(getZoomFactorForShortcut(1.02, "increase")).toBe(1.05);
    expect(getZoomFactorForShortcut(1.02, "decrease")).toBe(1);
    expect(getZoomFactorForShortcut(1.03, "increase")).toBe(1.05);
    expect(getZoomFactorForShortcut(1.03, "decrease")).toBe(1);
  });

  it("moves exact five-percent values by one full keyboard step", () => {
    expect(getZoomFactorForShortcut(1.05, "increase")).toBe(1.1);
    expect(getZoomFactorForShortcut(1.05, "decrease")).toBe(1);
  });

  it("preserves the zoom bounds", () => {
    expect(getZoomFactorForShortcut(1.25, "increase")).toBe(1.25);
    expect(getZoomFactorForShortcut(0.85, "decrease")).toBe(0.85);
    expect(getZoomFactorForShortcut(1.24, "increase")).toBe(1.25);
    expect(getZoomFactorForShortcut(0.86, "decrease")).toBe(0.85);
  });

  it("resets to 100 percent", () => {
    expect(getZoomFactorForShortcut(1.23, "reset")).toBe(1);
  });
});
