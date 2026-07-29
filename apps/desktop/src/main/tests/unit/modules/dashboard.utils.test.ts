import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getDashboardDates,
  getLast7DaysRange,
  getThisWeekRange
} from "../../../modules/dashboard/dashboard.utils";

describe("dashboard date ranges", () => {
  beforeEach(() => {
    vi.stubEnv("TZ", "UTC");
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("builds today and yesterday boundaries across a year transition", () => {
    vi.setSystemTime(new Date("2026-01-01T12:30:00.000Z"));

    expect(getDashboardDates()).toEqual({
      startofToday: "2026-01-01T00:00:00.000Z",
      endofToday: "2026-01-01T23:59:59.999Z",
      startofYesterday: "2025-12-31T00:00:00.000Z",
      endofYesterday: "2025-12-31T23:59:59.999Z"
    });
  });

  it("uses Sunday through Saturday for the current week", () => {
    vi.setSystemTime(new Date("2026-08-05T12:30:00.000Z"));

    expect(getThisWeekRange()).toEqual({
      startDate: "2026-08-02T00:00:00.000Z",
      endDate: "2026-08-08T23:59:59.999Z"
    });
  });

  it("builds the last-seven-days range across a month transition", () => {
    vi.setSystemTime(new Date("2026-03-03T12:30:00.000Z"));

    expect(getLast7DaysRange()).toEqual({
      startDate: "2026-02-24T00:00:00.000Z",
      endDate: "2026-03-03T23:59:59.999Z"
    });
  });
});
