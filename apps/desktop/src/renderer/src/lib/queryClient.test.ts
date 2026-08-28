import { describe, expect, it } from "vitest";
import { ApiError } from "./apiClient";
import { queryRetryDelay, shouldRetryQuery } from "./queryClient";

describe("query retry policy", () => {
  it("retries network, timeout, rate-limit, and server errors at most twice", () => {
    const retryable = [
      new ApiError("offline", 0, { kind: "network" }),
      new ApiError("timeout", 408),
      new ApiError("rate limited", 429),
      new ApiError("server", 500)
    ];

    for (const error of retryable) {
      expect(shouldRetryQuery(0, error)).toBe(true);
      expect(shouldRetryQuery(1, error)).toBe(true);
      expect(shouldRetryQuery(2, error)).toBe(false);
    }
  });

  it("never retries normal client errors or malformed responses", () => {
    expect(shouldRetryQuery(0, new ApiError("bad request", 400))).toBe(false);
    expect(shouldRetryQuery(0, new ApiError("missing", 404))).toBe(false);
    expect(
      shouldRetryQuery(0, new ApiError("invalid json", 200, { kind: "malformed-response" }))
    ).toBe(false);
  });

  it("caps exponential retry delay", () => {
    expect(queryRetryDelay(0)).toBe(500);
    expect(queryRetryDelay(2)).toBe(2_000);
    expect(queryRetryDelay(10)).toBe(4_000);
  });
});
