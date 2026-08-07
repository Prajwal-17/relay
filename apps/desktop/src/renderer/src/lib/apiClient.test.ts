// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiClient } from "./apiClient";

afterEach(() => {
  vi.restoreAllMocks();
});

const response = (status: number, body: unknown, contentLength?: string) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(contentLength ? { "content-length": contentLength } : undefined),
    json: vi.fn().mockResolvedValue(body)
  }) as unknown as Response;

describe("apiClient error normalization", () => {
  it.each([400, 404, 429, 500])(
    "preserves HTTP status %s and an optional backend code",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            response(status, { error: { message: "Request rejected", code: "TEST_CODE" } })
          )
      );

      const promise = apiClient.get("/api/test");
      await expect(promise).rejects.toMatchObject({
        name: "ApiError",
        kind: "http",
        status,
        code: "TEST_CODE",
        message: "Request rejected"
      });
    }
  );

  it("normalizes a failed fetch as a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    await expect(apiClient.get("/api/test")).rejects.toMatchObject({
      name: "ApiError",
      kind: "network",
      status: 0
    });
  });

  it("normalizes malformed successful JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: vi.fn().mockRejectedValue(new SyntaxError("invalid json"))
      })
    );

    await expect(apiClient.get("/api/test")).rejects.toMatchObject({
      name: "ApiError",
      kind: "malformed-response",
      status: 200
    });
  });

  it("does not turn an aborted request into an ApiError", async () => {
    const abortError = new DOMException("aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

    await expect(apiClient.get("/api/test")).rejects.toBe(abortError);
    expect(abortError).not.toBeInstanceOf(ApiError);
  });
});
