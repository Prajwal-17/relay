import assert from "node:assert/strict";
import { test } from "node:test";
import {
  businessWeek,
  monthsInWeek,
  getTodayIST,
  parseLocalDate,
  shiftMonth,
  shiftBusinessWeek,
  isFutureDate
} from "../src/lib/format/dates.ts";
import { paisaToInput, parseRupeeInput } from "../src/lib/format/money.ts";
import { paymentTime } from "../src/features/money/payment-history.utils.ts";
import { entryMethods } from "../src/features/money/payment-catalog.ts";
import { createEntrySaveFlow } from "../src/features/money/save-flow.ts";
import {
  dateOnWeekPage,
  weekPageIndex,
  weekPageStart
} from "../src/features/money/week-pager.utils.ts";

for (const timezone of ["America/Los_Angeles", "Asia/Tokyo", "UTC"]) {
  test(`IST business dates, Sunday weeks, and timestamps ignore device timezone (${timezone})`, () => {
    process.env.TZ = timezone;
    assert.equal(getTodayIST(new Date("2025-12-31T18:29:59Z")), "2025-12-31");
    assert.equal(getTodayIST(new Date("2025-12-31T18:30:00Z")), "2026-01-01");
    assert.deepEqual(businessWeek("2026-01-01"), [
      "2025-12-28",
      "2025-12-29",
      "2025-12-30",
      "2025-12-31",
      "2026-01-01",
      "2026-01-02",
      "2026-01-03"
    ]);
    assert.deepEqual(monthsInWeek(businessWeek("2026-01-01")), [
      { year: 2025, month: 11 },
      { year: 2026, month: 0 }
    ]);
    assert.equal(businessWeek("2024-02-29")[4], "2024-02-29");
    assert.equal(shiftBusinessWeek("2026-01-01", -1, "2026-01-01"), "2025-12-25");
    assert.equal(shiftBusinessWeek("2024-03-07", -1, "2024-03-07"), "2024-02-29");
    assert.equal(shiftBusinessWeek("2025-12-27", 1, "2026-01-01"), "2026-01-01");
    assert.equal(shiftBusinessWeek("2025-12-30", 1, "2026-01-01"), "2025-12-30");
    assert.deepEqual(shiftMonth({ year: 2025, month: 11 }, 1), { year: 2026, month: 0 });
    assert.equal(isFutureDate("2026-01-02", "2026-01-01"), true);
    assert.equal(paymentTime("2025-12-31T18:30:00Z"), "12:00 AM");
    assert.equal(paymentTime("2026-01-01T06:30:00Z"), "12:00 PM");
    assert.equal(paymentTime("2026-01-01T03:44:00Z"), "09:14 AM");
    assert.equal(paymentTime("2026-01-01T10:35:00Z"), "04:05 PM");
  });
}

test("dates and paisa input reject invalid values and overflow", () => {
  assert.equal(parseLocalDate("2025-02-29"), null);
  assert.equal(parseLocalDate("2024-02-29"), "2024-02-29");
  assert.equal(parseLocalDate("2025-13-01"), null);
  assert.equal(paymentTime("invalid"), "Time unavailable");
  assert.deepEqual(parseRupeeInput("12.34"), { paisa: 1234, error: null });
  assert.equal(parseRupeeInput("0").paisa, 0);
  for (const value of ["-1", "1.234", "90071992547410", "NaN"])
    assert.ok(parseRupeeInput(value).error);
});

test("week pages keep fixed positions across historical, leap-day, and year-boundary navigation", () => {
  for (const timezone of ["America/Los_Angeles", "Asia/Tokyo", "UTC"]) {
    process.env.TZ = timezone;
    const today = "2026-01-01";
    assert.equal(weekPageStart(today, 0), "2025-12-28");
    assert.equal(weekPageStart(today, 1), "2025-12-21");
    assert.equal(weekPageStart(today, 2), "2025-12-14");
    assert.equal(weekPageIndex("2025-12-25", today), 1);
    assert.equal(weekPageIndex("2025-12-18", today), 2);
    assert.equal(dateOnWeekPage(today, 2, "2025-12-25"), "2025-12-18");
    assert.equal(dateOnWeekPage(today, 1, "2025-12-18"), "2025-12-25");
    assert.equal(dateOnWeekPage(today, 0, "2025-12-27"), today);
    assert.equal(dateOnWeekPage(today, 0, "2025-12-23"), "2025-12-30");
    assert.equal(weekPageStart("2024-03-07", 1), "2024-02-25");
    assert.equal(dateOnWeekPage("2024-03-07", 1, "2024-03-07"), "2024-02-29");
    const historic = "2020-01-01";
    const page = weekPageIndex(historic, today);
    assert.ok(page > 24);
    assert.equal(dateOnWeekPage(today, page, historic), historic);
    assert.equal(weekPageStart(today, page), businessWeek(historic)[0]);
  }
});

test("amount drafts support decimal keypad typing without inserting a leading zero", () => {
  for (const [value, paisa] of [
    ["", 0],
    [".", 0],
    [".5", 50],
    [".50", 50],
    ["0", 0],
    ["120", 12000],
    ["12.", 1200],
    ["12.3", 1230],
    ["12.34", 1234]
  ] as const)
    assert.deepEqual(parseRupeeInput(value), { paisa, error: null }, value);
});

test("malformed drafts cannot save or be silently reinterpreted as a different amount", () => {
  for (const value of [
    "abc",
    "12a",
    "₹12",
    "-12",
    "+12",
    "1e3",
    "1,200",
    "1.2.3",
    "1.234",
    "12..",
    "12..3",
    "12..34",
    "12,34"
  ]) {
    const parsed = parseRupeeInput(value);
    assert.equal(parsed.paisa, null, value);
    assert.ok(parsed.error, value);
  }
});

test("entry catalog resolves actual IDs, case-insensitively, and excludes historical methods", () => {
  const methods = entryMethods([
    { isPreset: true, id: 90, name: "PAYTM", isArchived: false },
    { isPreset: true, id: 44, name: "Google Pay", isArchived: false },
    { isPreset: true, id: 7, name: "phonepe", isArchived: false },
    { isPreset: true, id: 11, name: "Other", isArchived: true }
  ]);
  assert.deepEqual(
    methods.map((m) => [m.id, m.name]),
    [
      [7, "PhonePe"],
      [90, "Paytm"]
    ]
  );
});

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

test("rapid saves remain locked through request, local cache update, feedback, and close", async () => {
  const flow = createEntrySaveFlow();
  const request = deferred(),
    sync = deferred(),
    feedback = deferred();
  let submissions = 0,
    closed = 0;
  const pending: boolean[] = [];
  const steps = {
    request: () => {
      submissions++;
      return request.promise;
    },
    synchronize: () => sync.promise,
    feedback: () => feedback.promise,
    complete: () => {
      closed++;
    },
    pending: (value: boolean) => pending.push(value),
    error() {}
  };
  const saving = flow.run(steps);
  await flow.run(steps);
  assert.equal(submissions, 1);
  assert.equal(flow.locked, true);
  request.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await flow.run(steps);
  assert.equal(submissions, 1);
  assert.equal(closed, 0);
  sync.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await flow.run(steps);
  assert.equal(submissions, 1);
  assert.equal(closed, 0);
  feedback.resolve();
  await saving;
  assert.equal(closed, 1);
  assert.deepEqual(pending, [true]);
  assert.equal(flow.locked, true);
});

test("failed requests retain a retryable draft; failed cache updates never resubmits committed money", async () => {
  const flow = createEntrySaveFlow();
  let submissions = 0,
    failRequest = true,
    failSync = true,
    closed = 0,
    error: string | null = null;
  const steps = {
    request: async () => {
      submissions++;
      if (failRequest) throw new Error("Offline");
    },
    synchronize: async () => {
      if (failSync) throw new Error("Refresh failed");
    },
    feedback: async () => {},
    complete: () => {
      closed++;
    },
    pending() {},
    error: (value: string | null) => {
      error = value;
    }
  };
  await flow.run(steps);
  assert.equal(flow.locked, false);
  assert.equal(flow.committed, false);
  assert.equal(error, "Offline");
  failRequest = false;
  await flow.run(steps);
  assert.equal(flow.committed, true);
  assert.match(error, /Entry saved/);
  failSync = false;
  await flow.run(steps);
  assert.equal(submissions, 2);
  assert.equal(closed, 1);
});

test("editing prefills amounts without losing paisa at the safe-integer boundary", () => {
  for (const paisa of [
    1,
    10,
    100,
    1234,
    999999999999,
    Number.MAX_SAFE_INTEGER - 1,
    Number.MAX_SAFE_INTEGER
  ])
    assert.equal(parseRupeeInput(paisaToInput(paisa)).paisa, paisa);
  assert.equal(paisaToInput(Number.MAX_SAFE_INTEGER), "90071992547409.91");
});
