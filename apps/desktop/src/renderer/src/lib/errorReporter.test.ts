// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { installLastResortErrorListeners, reportRendererError } from "./errorReporter";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("renderer error reporting", () => {
  it("deduplicates the same error object and records only diagnostic fields", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const error = new Error("boom");

    reportRendererError({ source: "react-caught", error, componentStack: "at Broken" });
    reportRendererError({ source: "window-error", error });

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith("[QuickCart renderer error]", {
      source: "react-caught",
      error,
      componentStack: "at Broken",
      route: expect.any(String)
    });
  });

  it("reports and cleans up last-resort unhandled rejection listeners", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const cleanup = installLastResortErrorListeners();
    const reason = new Error("unhandled");

    window.dispatchEvent(
      new PromiseRejectionEvent("unhandledrejection", { promise: Promise.resolve(), reason })
    );
    cleanup();
    window.dispatchEvent(
      new PromiseRejectionEvent("unhandledrejection", {
        promise: Promise.resolve(),
        reason: new Error("after cleanup")
      })
    );

    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });
});
