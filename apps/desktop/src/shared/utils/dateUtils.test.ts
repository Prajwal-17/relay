import fc from "fast-check";
import { describe, expect, it, vi } from "vitest";
import {
  formatDateObjToHHmmss,
  formatDateObjToStringMedium,
  formatDateStr,
  formatDateStrToISTDateObject,
  formatDateStrToISTDateStr,
  formatDateStrToISTDateTimeStr
} from "../utils/dateUtils";

const VALID_UTC_DATE_STRING = "2025-07-22T10:00:00Z";

describe("formatDateStr", () => {
  it("renders a valid UTC instant as an IST medium date", () => {
    expect(formatDateStr(VALID_UTC_DATE_STRING)).toBe("22 Jul 2025");
  });

  it("uses the IST calendar date even when the host timezone is UTC", () => {
    vi.stubEnv("TZ", "UTC");
    try {
      // 20:00Z + 5:30 = 01:30 next day -> 2 Jan 2025
      expect(formatDateStr("2025-01-01T20:00:00Z")).toBe("2 Jan 2025");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('returns "-" when no argument is supplied', () => {
    expect(formatDateStr()).toBe("-");
  });

  it('returns "-" for an empty string', () => {
    expect(formatDateStr("")).toBe("-");
  });

  it('returns "-" for an unparseable date string', () => {
    expect(formatDateStr("not-a-date")).toBe("-");
  });

  it('returns "-" for null passed at runtime', () => {
    // @ts-expect-error testing runtime null
    expect(formatDateStr(null)).toBe("-");
  });

  it('returns "-" for a non-string value passed at runtime', () => {
    expect(formatDateStr(123 as unknown as string)).toBe("-");
  });
});

describe("formatDateObjToStringMedium", () => {
  it("formats a Date object as 'D Mon YYYY'", () => {
    expect(formatDateObjToStringMedium(new Date("2025-07-22T10:00:00Z"))).toBe("22 Jul 2025");
  });

  it("includes the four-digit year", () => {
    expect(formatDateObjToStringMedium(new Date("2025-03-15T00:00:00Z"))).toContain("2025");
  });

  it("does not leak the literal 'Invalid Date' for a bad Date object", () => {
    const result = formatDateObjToStringMedium(new Date("not-a-date"));
    expect(result).not.toMatch(/invalid/i);
  });
});

describe("formatDateObjToHHmmss", () => {
  it("formats a typical time as HH:mm (24-hour, padded)", () => {
    expect(formatDateObjToHHmmss(new Date(2025, 0, 1, 14, 30, 0))).toBe("14:30");
  });

  it("zero-pads single-digit hours and minutes", () => {
    expect(formatDateObjToHHmmss(new Date(2025, 0, 1, 5, 5, 0))).toBe("05:05");
    expect(formatDateObjToHHmmss(new Date(2025, 0, 1, 12, 9, 0))).toBe("12:09");
  });

  it("renders midnight as 00:00", () => {
    expect(formatDateObjToHHmmss(new Date(2025, 0, 1, 0, 0, 0))).toBe("00:00");
  });

  it("renders the last minute of the day as 23:59", () => {
    expect(formatDateObjToHHmmss(new Date(2025, 0, 1, 23, 59, 0))).toBe("23:59");
  });

  it("drops seconds from the output", () => {
    expect(formatDateObjToHHmmss(new Date(2025, 0, 1, 12, 30, 45))).toMatch(/^\d{2}:\d{2}$/);
  });

  it('returns "-" for an invalid Date object instead of NaN fields', () => {
    expect(formatDateObjToHHmmss(new Date("not-a-date"))).toBe("-");
  });
});

describe("formatDateStrToISTDateObject", () => {
  it("parses an IST wall-clock timestamp to its UTC instant", () => {
    // 06:38:13 IST = 01:08:13 UTC
    expect(formatDateStrToISTDateObject("2025-08-31 06:38:13")?.toISOString()).toBe(
      "2025-08-31T01:08:13.000Z"
    );
  });

  it("parses an ISO UTC timestamp verbatim", () => {
    expect(formatDateStrToISTDateObject("2025-08-31T06:38:13Z")?.toISOString()).toBe(
      "2025-08-31T06:38:13.000Z"
    );
  });

  it("returns a real Date instance for valid input", () => {
    expect(formatDateStrToISTDateObject("2025-08-31 06:38:13")).toBeInstanceOf(Date);
  });

  it("returns null for an impossible calendar date", () => {
    expect(formatDateStrToISTDateObject("2025-02-30 06:38:13")).toBeNull();
  });

  it("returns null for an unparseable string", () => {
    expect(formatDateStrToISTDateObject("not-a-date")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(formatDateStrToISTDateObject("")).toBeNull();
  });

  it("returns null for null and undefined at runtime", () => {
    // @ts-expect-error testing runtime null
    expect(formatDateStrToISTDateObject(null)).toBeNull();
    // @ts-expect-error testing runtime undefined
    expect(formatDateStrToISTDateObject(undefined)).toBeNull();
  });
});

describe("formatDateStrToISTDateStr", () => {
  it("splits a UTC instant into IST date and 12-hour time parts", () => {
    // 10:00Z + 5:30 = 15:30 IST
    expect(formatDateStrToISTDateStr(VALID_UTC_DATE_STRING)).toEqual({
      fullDate: "22 Jul 2025",
      timePart: "03:30 pm"
    });
  });

  it("rolls the date forward across the year boundary", () => {
    // 2025-12-31T18:30:00Z = 2026-01-01 00:00 IST
    expect(formatDateStrToISTDateStr("2025-12-31T18:30:00Z")).toEqual({
      fullDate: "1 Jan 2026",
      timePart: "12:00 am"
    });
  });

  it("returns '-' for both fields on an unparseable string", () => {
    expect(formatDateStrToISTDateStr("not-a-date")).toEqual({
      fullDate: "-",
      timePart: "-"
    });
  });

  it("returns '-' for both fields on an empty string", () => {
    expect(formatDateStrToISTDateStr("")).toEqual({
      fullDate: "-",
      timePart: "-"
    });
  });
});

describe("formatDateStrToISTDateTimeStr", () => {
  it("joins the IST date and 12-hour time with a single space", () => {
    expect(formatDateStrToISTDateTimeStr(VALID_UTC_DATE_STRING)).toBe("22 Jul 2025 03:30 pm");
  });

  it("rolls the date forward across the year boundary", () => {
    expect(formatDateStrToISTDateTimeStr("2025-12-31T18:30:00Z")).toBe("1 Jan 2026 12:00 am");
  });

  it('returns "-" for an unparseable string', () => {
    expect(formatDateStrToISTDateTimeStr("not-a-date")).toBe("-");
  });

  it('returns "-" for an empty string', () => {
    expect(formatDateStrToISTDateTimeStr("")).toBe("-");
  });
});

describe("composition invariant", () => {
  it("formatDateStrToISTDateTimeStr is the concatenation of the split parts, for any valid instant", () => {
    fc.assert(
      fc.property(
        fc
          .integer({ min: 0, max: 2_000_000_000 })
          .map((seconds) => new Date(seconds * 1_000).toISOString()),
        (isoDate) => {
          const { fullDate, timePart } = formatDateStrToISTDateStr(isoDate);
          expect(formatDateStrToISTDateTimeStr(isoDate)).toBe(`${fullDate} ${timePart}`);
        }
      ),
      { seed: 20260720, numRuns: 500 }
    );
  });
});
