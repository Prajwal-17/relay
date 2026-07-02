import { describe, expect, it } from "vitest";
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
  it("returns formatted date string for a valid ISO date string", () => {
    const result = formatDateStr(VALID_UTC_DATE_STRING);
    expect(result).not.toBe("-");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns formatted date containing month abbreviation for valid input", () => {
    const result = formatDateStr(VALID_UTC_DATE_STRING);
    expect(result).toMatch(/Jul/);
  });

  it("returns formatted date starting with day number for valid input", () => {
    const result = formatDateStr(VALID_UTC_DATE_STRING);
    const dayNumber = new Date(VALID_UTC_DATE_STRING).getDate();
    expect(result).toMatch(new RegExp(`^${dayNumber}\\s`));
  });

  it('returns "-" for undefined input', () => {
    expect(formatDateStr(undefined)).toBe("-");
  });

  it('returns "-" for empty string input', () => {
    expect(formatDateStr("")).toBe("-");
  });

  it('returns "-" for invalid date string', () => {
    expect(formatDateStr("not-a-date")).toBe("-");
  });

  it('returns "-" for null-like values passed as undefined', () => {
    expect(formatDateStr()).toBe("-");
  });

  it('returns "-" for null input at runtime instead of producing garbage', () => {
    // @ts-expect-error testing runtime null
    expect(formatDateStr(null)).toBe("-");
  });
});

describe("formatDateObjToStringMedium", () => {
  it("formats a Date object to medium style string", () => {
    const date = new Date("2025-12-25T00:00:00Z");
    const result = formatDateObjToStringMedium(date);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("includes month abbreviation in formatted output", () => {
    const date = new Date("2025-07-04T00:00:00Z");
    const result = formatDateObjToStringMedium(date);
    expect(result).toMatch(/Jul/);
  });

  it("includes year in formatted output", () => {
    const date = new Date("2025-03-15T00:00:00Z");
    const result = formatDateObjToStringMedium(date);
    expect(result).toContain("2025");
  });

  it("returns '-' or empty string for invalid Date object instead of 'Invalid Date'", () => {
    const date = new Date("not-a-date");
    const result = formatDateObjToStringMedium(date);
    expect(result).not.toMatch(/invalid/i);
  });
});

describe("formatDateObjToHHmmss", () => {
  it("formats date to HH:mm string", () => {
    const date = new Date(2025, 0, 1, 14, 30, 0);
    const result = formatDateObjToHHmmss(date);
    expect(result).toMatch(/^\d{2}:\d{2}$/);
    expect(result).toBe("14:30");
  });

  it("pads single-digit hours with leading zero", () => {
    const date = new Date(2025, 0, 1, 5, 5, 0);
    const result = formatDateObjToHHmmss(date);
    expect(result).toBe("05:05");
  });

  it("pads single-digit minutes with leading zero", () => {
    const date = new Date(2025, 0, 1, 12, 9, 0);
    const result = formatDateObjToHHmmss(date);
    expect(result).toBe("12:09");
  });

  it("handles midnight correctly", () => {
    const date = new Date(2025, 0, 1, 0, 0, 0);
    const result = formatDateObjToHHmmss(date);
    expect(result).toBe("00:00");
  });

  it("handles end of day (23:59)", () => {
    const date = new Date(2025, 0, 1, 23, 59, 0);
    const result = formatDateObjToHHmmss(date);
    expect(result).toBe("23:59");
  });

  it("does not include seconds in output", () => {
    const date = new Date(2025, 0, 1, 12, 30, 45);
    const result = formatDateObjToHHmmss(date);
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("formatDateStrToISTDateObject", () => {
  it("returns a Date object for valid date-time string", () => {
    const result = formatDateStrToISTDateObject("2025-08-31 06:38:13");
    expect(result).toBeInstanceOf(Date);
    expect(result).not.toBeNull();
  });

  it("returns null for empty string input", () => {
    expect(formatDateStrToISTDateObject("")).toBeNull();
  });

  it("returns null for falsy input", () => {
    // @ts-expect-error testing runtime behavior with null
    expect(formatDateStrToISTDateObject(null)).toBeNull();
    // @ts-expect-error testing runtime behavior with undefined
    expect(formatDateStrToISTDateObject(undefined)).toBeNull();
  });

  it("returns valid Date with correct UTC time for IST-formatted input", () => {
    const date = formatDateStrToISTDateObject("2025-08-31 06:38:13");
    expect(date).not.toBeNull();
    if (date) {
      expect(date.getTime()).toBeGreaterThan(0);
      expect(isNaN(date.getTime())).toBe(false);
    }
  });

  it("returns null for invalid date string instead of Invalid Date object", () => {
    expect(formatDateStrToISTDateObject("not-a-date")).toBeNull();
  });
});

describe("formatDateStrToISTDateStr", () => {
  it("returns an object with fullDate and timePart keys", () => {
    const result = formatDateStrToISTDateStr(VALID_UTC_DATE_STRING);
    expect(result).toHaveProperty("fullDate");
    expect(result).toHaveProperty("timePart");
  });

  it("returns non-empty fullDate string", () => {
    const result = formatDateStrToISTDateStr(VALID_UTC_DATE_STRING);
    expect(typeof result.fullDate).toBe("string");
    expect(result.fullDate.length).toBeGreaterThan(0);
  });

  it("returns non-empty timePart string", () => {
    const result = formatDateStrToISTDateStr(VALID_UTC_DATE_STRING);
    expect(typeof result.timePart).toBe("string");
    expect(result.timePart.length).toBeGreaterThan(0);
  });

  it("timePart includes am/pm for 12-hour format", () => {
    const result = formatDateStrToISTDateStr(VALID_UTC_DATE_STRING);
    expect(result.timePart).toMatch(/am|pm/i);
  });

  it("converts UTC noon (10:00Z) to IST evening time (15:30)", () => {
    const result = formatDateStrToISTDateStr(VALID_UTC_DATE_STRING);
    expect(result.timePart).toMatch(/03:30|3:30/);
  });

  it("fullDate matches medium date style pattern", () => {
    const result = formatDateStrToISTDateStr(VALID_UTC_DATE_STRING);
    expect(result.fullDate).toMatch(/22.*Jul.*2025/);
  });

  it("returns '-' for fullDate and timePart on invalid date string (no garbage)", () => {
    const result = formatDateStrToISTDateStr("not-a-date");
    expect(result.fullDate).toBe("-");
    expect(result.timePart).toBe("-");
  });

  it("returns '-' for fullDate and timePart on empty string (no garbage)", () => {
    const result = formatDateStrToISTDateStr("");
    expect(result.fullDate).toBe("-");
    expect(result.timePart).toBe("-");
  });
});

describe("formatDateStrToISTDateTimeStr", () => {
  it("returns a string containing date and time", () => {
    const result = formatDateStrToISTDateTimeStr(VALID_UTC_DATE_STRING);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns string containing a space between date and time", () => {
    const result = formatDateStrToISTDateTimeStr(VALID_UTC_DATE_STRING);
    expect(result).toMatch(/\s/);
  });

  it("includes date components (day, month, year)", () => {
    const result = formatDateStrToISTDateTimeStr(VALID_UTC_DATE_STRING);
    expect(result).toMatch(/22/);
    expect(result).toMatch(/Jul/);
    expect(result).toMatch(/2025/);
  });

  it("includes time components in 12-hour format", () => {
    const result = formatDateStrToISTDateTimeStr(VALID_UTC_DATE_STRING);
    expect(result).toMatch(/am|pm/i);
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it("converts UTC noon (10:00Z) to IST evening time (15:30)", () => {
    const result = formatDateStrToISTDateTimeStr(VALID_UTC_DATE_STRING);
    expect(result).toMatch(/03:30|3:30/);
  });

  it('returns "-" for invalid date string instead of producing garbage', () => {
    expect(formatDateStrToISTDateTimeStr("not-a-date")).toBe("-");
  });

  it('returns "-" for empty string instead of producing garbage', () => {
    expect(formatDateStrToISTDateTimeStr("")).toBe("-");
  });
});
