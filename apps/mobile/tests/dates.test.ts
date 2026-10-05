import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addCalendarDays,
  businessWeek,
  differenceInCalendarDays,
  formatDateStr,
  formatDateStrToISTDateObject,
  formatDateStrToISTDateStr,
  formatDisplayDate,
  getTodayIST,
  isValidCalendarDate,
  parseLocalDate
} from "@relay/shared/date-utils";
import {
  getTodayIST as mobileToday,
  parseLocalDate as mobileParse
} from "../src/lib/format/dates.ts";
import {
  entryDateTimes,
  paymentDateTime,
  paymentTime
} from "../src/features/money/payment-history.utils.ts";

test("entry timestamps show actual creation and later edits using shared IST parsing", () => {
  const created = "2025-12-31T18:29:00Z";
  assert.deepEqual(entryDateTimes(created, "2025-12-31T23:59:00+05:30"), {
    created: "31 Dec 2025 · 11:59 PM",
    updated: null
  });
  assert.deepEqual(entryDateTimes(created, "2025-12-31T18:30:00Z"), {
    created: "31 Dec 2025 · 11:59 PM",
    updated: "1 Jan 2026 · 12:00 AM"
  });
  for (const updated of [undefined, created, "invalid", "2025-12-31T18:28:00Z"])
    assert.equal(entryDateTimes(created, updated).updated, null);
  assert.deepEqual(entryDateTimes("invalid", "2026-01-01T00:00:00Z"), {
    created: "Time unavailable",
    updated: null
  });
});

test("mobile reuses the shared date functions directly", () => {
  assert.equal(mobileToday, getTodayIST);
  assert.equal(mobileParse, parseLocalDate);
});

for (const timezone of ["UTC", "America/Los_Angeles", "Asia/Tokyo", "Pacific/Kiritimati"]) {
  test(`desktop timestamp rules and mobile display ignore device timezone (${timezone})`, () => {
    const previousTimezone = process.env.TZ;
    process.env.TZ = timezone;
    try {
      assert.equal(
        formatDateStrToISTDateObject("2025-08-31 06:38:13")?.toISOString(),
        "2025-08-31T01:08:13.000Z"
      );
      assert.equal(
        formatDateStrToISTDateObject("2025-08-31T06:38:13")?.toISOString(),
        "2025-08-31T01:08:13.000Z"
      );
      assert.equal(
        formatDateStrToISTDateObject("2025-08-31T06:38:13Z")?.toISOString(),
        "2025-08-31T06:38:13.000Z"
      );
      assert.equal(
        formatDateStrToISTDateObject("2025-08-31T06:38:13+05:30")?.toISOString(),
        "2025-08-31T01:08:13.000Z"
      );
      assert.equal(
        formatDateStrToISTDateObject("2025-08-31T06:38:13+0530")?.toISOString(),
        "2025-08-31T01:08:13.000Z"
      );
      assert.equal(
        formatDateStrToISTDateObject("2025-08-31")?.toISOString(),
        "2025-08-30T18:30:00.000Z"
      );
      assert.equal(paymentTime("2025-08-31 06:38:13"), "06:38 AM");
      assert.equal(paymentTime("2025-08-31T06:38:13.123456+05:30"), "06:38 AM");
      assert.equal(paymentDateTime("2025-12-31T18:30:00Z"), "1 Jan 2026 · 12:00 AM");
      assert.deepEqual(formatDateStrToISTDateStr("2025-12-31T18:30:00Z"), {
        fullDate: "1 Jan 2026",
        timePart: "12:00 am"
      });
      assert.equal(formatDateStr("2025-12-31T20:00:00"), "31 Dec 2025");
      assert.equal(formatDateStr("2025-12-31T20:00:00Z"), "1 Jan 2026");
      assert.equal(formatDisplayDate("2025-12-31"), "Wednesday, 31 December 2025");
      assert.equal(getTodayIST(new Date("2025-12-31T18:29:59.999Z")), "2025-12-31");
      assert.equal(getTodayIST(new Date("2025-12-31T18:30:00.000Z")), "2026-01-01");
    } finally {
      if (previousTimezone === undefined) delete process.env.TZ;
      else process.env.TZ = previousTimezone;
    }
  });
}

test("shared parsing rejects impossible dates and times before the runtime can normalize them", () => {
  for (const value of [
    "2025-02-29",
    "2026-02-30",
    "2025-13-01",
    "2025-00-01",
    "2025-01-00",
    "2025-04-31",
    "0000-01-01",
    "2025-02-30T00:00:00Z",
    "2025-01-01T24:00:00Z",
    "2025-01-01T12:60:00Z",
    "2025-01-01T12:00:60Z",
    "2025-01-01T12:00:00+05:60",
    "2025-01-01T12:00:00+24:00",
    "not-a-date",
    "",
    "1/2/2025"
  ]) {
    assert.equal(formatDateStrToISTDateObject(value), null, value);
    assert.equal(formatDateStr(value), "-", value);
    assert.equal(paymentTime(value), "Time unavailable", value);
  }
  assert.equal(parseLocalDate(undefined), null);
  assert.equal(parseLocalDate(null), null);
  assert.equal(parseLocalDate("2024-02-29"), "2024-02-29");
  assert.equal(parseLocalDate("0099-01-01"), "0099-01-01");
  assert.equal(isValidCalendarDate("2025-02-29"), false);
  assert.equal(isValidCalendarDate("2024-02-29"), true);
});

test("calendar arithmetic stays stable across leap days, DST changes, and year boundaries", () => {
  assert.equal(addCalendarDays("2024-03-01", -1), "2024-02-29");
  assert.equal(addCalendarDays("2025-03-01", -1), "2025-02-28");
  assert.equal(addCalendarDays("2025-12-31", 1), "2026-01-01");
  assert.equal(addCalendarDays("2026-03-08", 1), "2026-03-09");
  assert.equal(differenceInCalendarDays("2026-03-09", "2026-03-08"), 1);
  assert.equal(differenceInCalendarDays("2026-11-02", "2026-11-01"), 1);
  assert.equal(businessWeek("2026-01-01")[0], "2025-12-28");
});
