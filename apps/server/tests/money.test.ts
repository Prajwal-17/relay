import assert from "node:assert/strict";
import { test } from "node:test";
import { Hono } from "hono";
import { moneyRoutes } from "../src/modules/money/money.routes.ts";
import {
  addReceivedPayment,
  addVendorPayment,
  deleteReceivedPayment,
  createPaymentMethod,
  updatePaymentMethod,
  getReceivedHistory
} from "../src/modules/money/money.service.ts";
import {
  listPaymentMethods,
  getDailyEntry,
  listMonthSummaries,
  listReceivedEntries,
  listReceivedCounts,
  getReceivedEntryById,
  getVendorPaymentById
} from "../src/modules/money/money.repository.ts";
import { localDateSchema, receivedPaymentSchema } from "../src/modules/money/money.schemas.ts";
import { testDatabase } from "./database.ts";

import type { AppEnv } from "../src/app-env.ts";
import type {
  MoneyDay,
  PaymentMethod,
  DaySummary,
  ReceivedEntry
} from "../src/modules/money/money.types.ts";
type ReceivedRecord = NonNullable<Awaited<ReturnType<typeof getReceivedEntryById>>>;
type VendorRecord = NonNullable<Awaited<ReturnType<typeof getVendorPaymentById>>>;
type HistoryResponse = Awaited<ReturnType<typeof getReceivedHistory>>;
type WeekResponse = { days: MoneyDay[]; paymentMethods: PaymentMethod[] };
type MutationResponse = {
  day: MoneyDay;
  receivedEntry: ReceivedEntry;
  editedEntry: ReceivedRecord | VendorRecord;
  vendorNames: string[];
};
type TestResponse = Omit<Response, "json"> & { json: <T = MutationResponse>() => Promise<T> };
const date = "2025-12-31";
function legacy(db: ReturnType<typeof testDatabase>, user: string, name: string, archived = 0) {
  return Number(
    db.sqlite
      .prepare(
        "INSERT INTO payment_methods (user_id, name, is_preset, is_archived, created_at, updated_at) VALUES (?, ?, 1, ?, ?, ?) RETURNING id"
      )
      .get(user, name, archived, date, date)!.id
  );
}

test("combined migration preserves provider IDs, receipts, original names, and totals", async () => {
  const db = testDatabase({ legacy: true });
  db.user("legacy");
  db.user("empty");
  const google = legacy(db, "legacy", "Google Pay");
  const phone = legacy(db, "legacy", "pHoNePe", 1);
  db.sqlite
    .prepare(
      "INSERT INTO daily_entries (user_id, entry_date, cash_amount, created_at, updated_at) VALUES (?, ?, 100, ?, ?)"
    )
    .run("legacy", date, date, date);
  db.sqlite
    .prepare(
      "INSERT INTO daily_payment_totals (user_id, entry_date, payment_method_id, amount) VALUES (?, ?, ?, 500)"
    )
    .run("legacy", date, google);
  db.sqlite
    .prepare(
      "INSERT INTO received_entries (user_id, entry_date, payment_method_id, amount, created_at) VALUES (?, ?, ?, 500, ?)"
    )
    .run("legacy", date, google, date);
  const before = await listMonthSummaries(db, "legacy", 2025, 12);
  db.migrate();
  assert.deepEqual(await listMonthSummaries(db, "legacy", 2025, 12), before);
  const methods = await listPaymentMethods(db, "legacy", true);
  assert.equal(methods.find((m) => m.id === phone)!.isArchived, false);
  assert.equal(methods.find((m) => m.id === google)!.name, "Google Pay");
  assert.equal(methods.find((m) => m.id === google)!.isArchived, true);
  await assert.rejects(
    addReceivedPayment(db, "legacy", { date, paymentMethodId: google, amount: 100 }),
    /Choose Cash, PhonePe, or Paytm/
  );
  assert.equal((await listPaymentMethods(db, "empty")).length, 2);
  const receipt = (
    await listReceivedEntries(db, "legacy", date, google, Number.MAX_SAFE_INTEGER)
  )[0];
  assert.equal(receipt.updatedAt, receipt.createdAt);
  await deleteReceivedPayment(db, "legacy", receipt.id);
  assert.equal((await getDailyEntry(db, "legacy", date))!.cashAmount, 100);
  assert.equal((await getDailyEntry(db, "legacy", date))!.paymentTotals.length, 0);
});

test("new users seed only the two online presets; provider eligibility and ownership are enforced", async () => {
  const db = testDatabase();
  db.user("a");
  db.user("b");
  const methods = await listPaymentMethods(db, "a");
  assert.deepEqual(
    methods.map((m) => m.name),
    ["PhonePe", "Paytm"]
  );
  await listPaymentMethods(db, "a");
  assert.equal((await listPaymentMethods(db, "a")).length, 2);
  const old = legacy(db, "a", "Google Pay");
  for (const paymentMethodId of [old, methods[0].id]) {
    await assert.rejects(
      addReceivedPayment(db, paymentMethodId === old ? "a" : "b", {
        date,
        paymentMethodId,
        amount: 100
      })
    );
  }
  await assert.rejects(createPaymentMethod(db, "a", "Other"), /Choose Cash, PhonePe, or Paytm/);
  await assert.rejects(createPaymentMethod(db, "a", "phonepe"), /already exists/);
  await assert.rejects(updatePaymentMethod(db, "a", old, { isArchived: false }), /Choose Cash/);
  await assert.rejects(updatePaymentMethod(db, "a", old, { name: "Paytm" }), /Choose Cash/);
  await assert.rejects(
    updatePaymentMethod(db, "a", methods[0].id, { isArchived: true }),
    /stay available/
  );
});

test("overview counts are grouped by method and scoped to user and business date; totals reconcile", async () => {
  const db = testDatabase();
  db.user("a");
  db.user("b");
  const [phone] = await listPaymentMethods(db, "a");
  for (const paymentMethodId of [null, null, phone.id]) {
    await addReceivedPayment(db, "a", { date, paymentMethodId, amount: 100 });
  }
  await addReceivedPayment(db, "a", { date: "2025-12-30", paymentMethodId: null, amount: 900 });
  await addReceivedPayment(db, "b", { date, paymentMethodId: null, amount: 900 });
  await addVendorPayment(db, "a", { date, vendorName: "Vendor", amount: 125 });
  const counts = await listReceivedCounts(db, "a", date);
  assert.deepEqual(counts, [
    { paymentMethodId: null, count: 2 },
    { paymentMethodId: phone.id, count: 1 }
  ]);
  assert.deepEqual(await listReceivedCounts(db, "a", "2025-11-30"), []);
  const app = new Hono<AppEnv>();
  app.use("*", (c, next) => {
    c.set("userId", "a");
    return next();
  });
  app.route("/api/money", moneyRoutes);
  const response = await app.request(
    `/api/money/overview?date=${date}&year=2025&month=12`,
    {},
    { DB: db }
  );
  assert.equal(response.status, 200);
  assert.deepEqual(
    ((await response.json()) as { receivedCounts: MoneyDay["receivedCounts"] }).receivedCounts,
    counts
  );
  const summaries = await app.request("/api/money/summaries?year=2025&month=12", {}, { DB: db });
  assert.equal(
    ((await summaries.json()) as DaySummary[]).find((s) => s.date === date)!.netAmount,
    175
  );
  assert.equal(
    (await app.request("/api/money/summaries?year=2025&month=13", {}, { DB: db })).status,
    400
  );
});

test("safe-integer limits apply to the whole received day across methods and to vendor totals", async () => {
  const db = testDatabase();
  db.user("a");
  const [phone] = await listPaymentMethods(db, "a");
  await addReceivedPayment(db, "a", {
    date,
    paymentMethodId: null,
    amount: Number.MAX_SAFE_INTEGER - 1
  });
  await addReceivedPayment(db, "a", { date, paymentMethodId: phone.id, amount: 1 });
  await assert.rejects(
    addReceivedPayment(db, "a", { date, paymentMethodId: phone.id, amount: 1 }),
    /too large/
  );
  await addVendorPayment(db, "a", { date, vendorName: "Vendor", amount: Number.MAX_SAFE_INTEGER });
  await assert.rejects(
    addVendorPayment(db, "a", { date, vendorName: "Vendor", amount: 1 }),
    /too large/
  );
  assert.equal(
    receivedPaymentSchema.safeParse({ date, paymentMethodId: null, amount: 1.5 }).success,
    false
  );
  assert.equal(localDateSchema.safeParse("2025-02-29").success, false);
  assert.equal(localDateSchema.safeParse("2200-01-01").success, false);
});

function moneyApp(userId = "a") {
  const app = new Hono<AppEnv>();
  app.use("*", (c, next) => {
    c.set("userId", userId);
    return next();
  });
  app.route("/api/money", moneyRoutes);
  return app;
}

function send(
  app: Hono<AppEnv>,
  db: D1Database,
  path: string,
  method = "GET",
  body?: unknown
): Promise<TestResponse> {
  return app.request(
    `/api/money${path}`,
    {
      method,
      ...(body
        ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
        : {})
    },
    { DB: db }
  ) as Promise<TestResponse>;
}

test("one week response spans year boundaries, includes empty slots, and isolates all range data", async () => {
  const db = testDatabase();
  db.user("a");
  db.user("b");
  const [phone] = await listPaymentMethods(db, "a");
  await addReceivedPayment(db, "a", { date, paymentMethodId: null, amount: 100 });
  await addReceivedPayment(db, "a", { date: "2026-01-01", paymentMethodId: phone.id, amount: 300 });
  await addVendorPayment(db, "a", { date: "2026-01-01", vendorName: "Inside", amount: 75 });
  await addVendorPayment(db, "a", { date: "2025-12-27", vendorName: "Outside", amount: 900 });
  await addReceivedPayment(db, "b", { date, paymentMethodId: null, amount: 900 });
  const app = moneyApp();
  const response = await send(app, db, "/weeks?startDate=2025-12-28&endDate=2026-01-03");
  assert.equal(response.status, 200);
  const week = await response.json<WeekResponse>();
  assert.equal(week.days.length, 7);
  assert.equal(week.days[0].date, "2025-12-28");
  assert.equal(week.days[6].date, "2026-01-03");
  assert.equal(week.days[0].entry, null);
  assert.equal(week.days[3].entry!.cashAmount, 100);
  assert.deepEqual(week.days[4].receivedCounts, [{ paymentMethodId: phone.id, count: 1 }]);
  assert.equal(week.days[4].entry!.paymentTotals[0].amount, 300);
  assert.deepEqual(
    week.days.flatMap((d) => d.entry?.vendorPayments ?? []).map((v) => v.vendorName),
    ["Inside"]
  );
  assert.equal(week.paymentMethods.length, 2);
  for (const range of [
    "startDate=2025-12-29&endDate=2026-01-04",
    "startDate=2025-12-28&endDate=2026-01-04",
    "startDate=2025-02-30&endDate=2025-03-08",
    "startDate=2200-01-05&endDate=2200-01-11"
  ]) {
    assert.equal((await send(app, db, `/weeks?${range}`)).status, 400);
  }
  // A read can include the unrecordable future slots of this week.
  const today = new Date(
    `${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date())}T12:00:00Z`
  );
  today.setUTCDate(today.getUTCDate() - today.getUTCDay());
  const start = today.toISOString().slice(0, 10);
  today.setUTCDate(today.getUTCDate() + 6);
  assert.equal(
    (await send(app, db, `/weeks?startDate=${start}&endDate=${today.toISOString().slice(0, 10)}`))
      .status,
    200
  );
});

test("filtered history returns its metadata and total with a stable cursor and user/method/date isolation", async () => {
  const db = testDatabase();
  db.user("a");
  db.user("b");
  const [phone] = await listPaymentMethods(db, "a");
  for (let n = 0; n < 51; n++)
    await addReceivedPayment(db, "a", { date, paymentMethodId: null, amount: 100 });
  await addReceivedPayment(db, "a", { date, paymentMethodId: phone.id, amount: 300 });
  await addReceivedPayment(db, "a", { date: "2025-12-30", paymentMethodId: null, amount: 900 });
  await addReceivedPayment(db, "b", { date, paymentMethodId: null, amount: 900 });
  const app = moneyApp();
  const first = await (
    await send(app, db, `/received-history?date=${date}&paymentMethod=cash`)
  ).json<HistoryResponse>();
  assert.equal(first.total, 5100);
  assert.equal(first.method, null);
  assert.equal(first.entries.length, 50);
  const next = await (
    await send(
      app,
      db,
      `/received-history?date=${date}&paymentMethod=cash&beforeId=${first.nextCursor}`
    )
  ).json<HistoryResponse>();
  assert.equal(next.entries.length, 1);
  assert.equal(next.nextCursor, null);
  assert.equal(new Set([...first.entries, ...next.entries].map((e) => e.id)).size, 51);
  const provider = await (
    await send(app, db, `/received-history?date=${date}&paymentMethod=${phone.id}`)
  ).json<HistoryResponse>();
  assert.equal(provider.method!.name, "PhonePe");
  assert.equal(provider.total, 300);
  assert.equal(provider.entries.length, 1);
  assert.equal(
    (await send(moneyApp("b"), db, `/received-history?date=${date}&paymentMethod=${phone.id}`))
      .status,
    404
  );
  assert.equal((await send(app, db, `/received-history?date=${date}`)).status, 400);
});

test("vendor catalog returns all names once, without the legacy six-match limit, deduplicated and user scoped", async () => {
  const db = testDatabase();
  db.user("a");
  db.user("b");
  for (let n = 0; n < 50; n++)
    await addVendorPayment(db, "a", { date, vendorName: `Vendor ${n}`, amount: 1 });
  await addVendorPayment(db, "a", { date, vendorName: "  VENDOR 0  ", amount: 1 });
  await addVendorPayment(db, "b", { date, vendorName: "Private", amount: 1 });
  const names = await (await send(moneyApp(), db, "/vendors")).json<string[]>();
  assert.equal(names.length, 50);
  assert.equal(names[0], "VENDOR 0");
  assert.ok(!names.includes("Private"));
  const legacy = await (await send(moneyApp(), db, "/vendors?q=Vendor")).json<string[]>();
  assert.equal(legacy.length, 6);
});

test("writes return canonical day/count/receipt/vendor data so the client needs no follow-up GETs", async () => {
  const db = testDatabase();
  db.user("a");
  db.user("b");
  const app = moneyApp();
  let response = await send(app, db, "/received-payments", "POST", {
    date,
    paymentMethodId: null,
    amount: 250
  });
  assert.equal(response.status, 200);
  let result = await response.json();
  assert.equal(result.day.entry!.cashAmount, 250);
  assert.deepEqual(result.day.receivedCounts, [{ paymentMethodId: null, count: 1 }]);
  assert.equal(result.receivedEntry.amount, 250);
  const receiptId = result.receivedEntry.id;
  assert.equal(
    (await send(moneyApp("b"), db, `/received-entries/${receiptId}`, "DELETE")).status,
    404
  );
  result = await (
    await send(app, db, "/vendor-payments", "POST", { date, vendorName: "New vendor", amount: 100 })
  ).json();
  assert.deepEqual(result.vendorNames, ["New vendor"]);
  const vendorId = result.day.entry!.vendorPayments[0].id;
  result = await (await send(app, db, `/received-entries/${receiptId}`, "DELETE")).json();
  assert.equal(result.day.entry!.cashAmount, 0);
  assert.deepEqual(result.day.receivedCounts, []);
  result = await (await send(app, db, `/vendor-payments/${vendorId}`, "DELETE")).json();
  assert.equal(result.day.entry, null);
  assert.deepEqual(result.vendorNames, []);
  await addReceivedPayment(db, "a", { date, paymentMethodId: null, amount: 100 });
  await addReceivedPayment(db, "b", { date, paymentMethodId: null, amount: 900 });
  result = await (await send(app, db, `/days/${date}`, "DELETE")).json();
  assert.deepEqual(result.day, { date, entry: null, receivedCounts: [] });
  assert.equal((await getDailyEntry(db, "b", date))!.cashAmount, 900);
});

test("received updates preserve creation time and advance update time while reconciling totals/counts", async (context) => {
  context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-04T06:00:00Z") });
  const db = testDatabase();
  db.user("a");
  const [phone, paytm] = await listPaymentMethods(db, "a");
  const created = await addReceivedPayment(db, "a", {
    date,
    paymentMethodId: null,
    amount: 250,
    note: "Original"
  });
  const id = created.receivedEntry.id;
  const app = moneyApp();
  const original = await (await send(app, db, `/received-entries/${id}`)).json<ReceivedRecord>();
  assert.equal(original.createdAt, "2026-10-04T06:00:00.000Z");
  assert.equal(original.updatedAt, original.createdAt);
  const patch = async (paymentMethodId: number | null, amount: number, note = "Revised") => {
    context.mock.timers.tick(60_000);
    const response = await send(app, db, `/received-entries/${id}`, "PATCH", {
      paymentMethodId,
      amount,
      note
    });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.editedEntry.id, id);
    assert.equal(result.editedEntry.date, date);
    assert.equal(result.editedEntry.createdAt, original.createdAt);
    assert.equal(result.editedEntry.updatedAt, new Date().toISOString());
    assert.equal(result.receivedEntry.updatedAt, result.editedEntry.updatedAt);
    assert.equal(result.day.entry!.updatedAt, result.editedEntry.updatedAt);
    const persisted = await (await send(app, db, `/received-entries/${id}`)).json<ReceivedRecord>();
    assert.equal(persisted.createdAt, original.createdAt);
    assert.equal(persisted.updatedAt, result.editedEntry.updatedAt);
    assert.equal(result.editedEntry.note, note || null);
    assert.equal(result.receivedEntry.amount, amount);
    return result;
  };
  let result = await patch(null, 400);
  assert.equal(result.day.entry!.cashAmount, 400);
  await addReceivedPayment(db, "a", { date, paymentMethodId: phone.id, amount: 100 });
  result = await patch(phone.id, 300);
  assert.equal(result.day.entry!.cashAmount, 0);
  assert.equal(result.day.entry!.paymentTotals[0].amount, 400);
  assert.deepEqual(result.day.receivedCounts, [{ paymentMethodId: phone.id, count: 2 }]);
  result = await patch(paytm.id, 125);
  assert.deepEqual(
    result.day.entry!.paymentTotals.map((t) => t.amount).sort((a, b) => a - b),
    [100, 125]
  );
  result = await patch(null, 150, "");
  assert.equal(result.day.entry!.cashAmount, 150);
  assert.equal(result.day.entry!.paymentTotals.length, 1);
  const history = await (
    await send(app, db, `/received-history?date=${date}&paymentMethod=cash`)
  ).json<HistoryResponse>();
  assert.equal(history.entries.length, 1);
  assert.equal(history.entries[0].id, id);
  assert.equal(history.entries[0].createdAt, original.createdAt);
  assert.equal(history.entries[0].updatedAt, result.editedEntry.updatedAt);
  result = await (await send(app, db, `/received-entries/${id}`, "DELETE")).json();
  assert.equal(result.day.entry!.cashAmount, 0);
  assert.equal(result.day.entry!.paymentTotals[0].amount, 100);
});

test("vendor updates preserve creation time and advance update time in details and week reads", async (context) => {
  context.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-04T06:00:00Z") });
  const db = testDatabase();
  db.user("a");
  const created = await addVendorPayment(db, "a", {
    date,
    vendorName: "Old",
    amount: 100,
    note: "Original"
  });
  const original = created.day.entry!.vendorPayments[0];
  assert.equal(original.createdAt, "2026-10-04T06:00:00.000Z");
  assert.equal(original.updatedAt, original.createdAt);
  context.mock.timers.tick(60_000);
  const app = moneyApp();
  const response = await send(app, db, `/vendor-payments/${original.id}`, "PATCH", {
    vendorName: " New ",
    amount: 250,
    note: " Revised "
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.deepEqual(result.editedEntry, {
    ...original,
    kind: "vendor",
    date,
    vendorName: "New",
    amount: 250,
    note: "Revised",
    updatedAt: "2026-10-04T06:01:00.000Z"
  });
  assert.deepEqual(result.vendorNames, ["New"]);
  assert.equal(result.day.entry!.vendorPayments.length, 1);
  const read = await (await send(app, db, `/vendor-payments/${original.id}`)).json<VendorRecord>();
  assert.deepEqual(read, result.editedEntry);
  const week = await (
    await send(app, db, "/weeks?startDate=2025-12-28&endDate=2026-01-03")
  ).json<WeekResponse>();
  const weekVendor = week.days.find((day) => day.date === date)!.entry!.vendorPayments[0];
  assert.equal(weekVendor.createdAt, original.createdAt);
  assert.equal(weekVendor.updatedAt, result.editedEntry.updatedAt);
  assert.equal((await listMonthSummaries(db, "a", 2025, 12))[0].paidAmount, 250);
});

test("edit reads and writes enforce ownership, missing IDs, positive integer amounts and provider eligibility", async () => {
  const db = testDatabase();
  db.user("a");
  db.user("b");
  const [phone] = await listPaymentMethods(db, "a");
  const [privateMethod] = await listPaymentMethods(db, "b");
  const receipt = (
    await addReceivedPayment(db, "a", { date, paymentMethodId: phone.id, amount: 100 })
  ).receivedEntry;
  const vendor = (await addVendorPayment(db, "a", { date, vendorName: "Vendor", amount: 100 })).day
    .entry!.vendorPayments[0];
  const edits: [string, Record<string, unknown>][] = [
    [`/received-entries/${receipt.id}`, { paymentMethodId: null, amount: 200 }],
    [`/vendor-payments/${vendor.id}`, { vendorName: "Changed", amount: 200 }]
  ];
  for (const [path, body] of edits) {
    assert.equal((await send(moneyApp("b"), db, path)).status, 404);
    assert.equal((await send(moneyApp("b"), db, path, "PATCH", body)).status, 404);
    for (const amount of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, "200"])
      assert.equal((await send(moneyApp(), db, path, "PATCH", { ...body, amount })).status, 400);
  }
  const app = moneyApp();
  assert.equal(
    (
      await send(app, db, "/received-entries/999999", "PATCH", {
        paymentMethodId: null,
        amount: 100
      })
    ).status,
    404
  );
  assert.equal((await send(app, db, "/vendor-payments/999999")).status, 404);
  const old = legacy(db, "a", "Google Pay", 1);
  for (const paymentMethodId of [old, privateMethod.id, 999999])
    assert.equal(
      (
        await send(app, db, `/received-entries/${receipt.id}`, "PATCH", {
          paymentMethodId,
          amount: 100
        })
      ).status,
      400
    );
  // A historical archived receipt can still have its amount and note corrected.
  db.sqlite
    .prepare("UPDATE received_entries SET payment_method_id = ? WHERE id = ?")
    .run(old, receipt.id);
  db.sqlite
    .prepare("UPDATE daily_payment_totals SET payment_method_id = ? WHERE payment_method_id = ?")
    .run(old, phone.id);
  const response = await send(app, db, `/received-entries/${receipt.id}`, "PATCH", {
    paymentMethodId: old,
    amount: 175,
    note: "Corrected"
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).day.entry!.paymentTotals[0].paymentMethodName, "Google Pay");
  assert.equal((await getDailyEntry(db, "a", date))!.vendorPayments[0].vendorName, "Vendor");
  assert.equal((await getVendorPaymentById(db, "a", vendor.id))!.updatedAt, vendor.updatedAt);
});

test("edit overflow uses the replaced amount and rejects oversized day totals without partial writes", async () => {
  const db = testDatabase();
  db.user("a");
  const app = moneyApp();
  const [phone] = await listPaymentMethods(db, "a");
  const cash = (
    await addReceivedPayment(db, "a", {
      date,
      paymentMethodId: null,
      amount: Number.MAX_SAFE_INTEGER - 100
    })
  ).receivedEntry;
  const other = (
    await addReceivedPayment(db, "a", { date, paymentMethodId: phone.id, amount: 100 })
  ).receivedEntry;
  assert.equal(
    (
      await send(app, db, `/received-entries/${cash.id}`, "PATCH", {
        paymentMethodId: null,
        amount: cash.amount,
        note: "Only note"
      })
    ).status,
    200
  );
  assert.equal(
    (
      await send(app, db, `/received-entries/${other.id}`, "PATCH", {
        paymentMethodId: phone.id,
        amount: 101
      })
    ).status,
    400
  );
  assert.equal((await getDailyEntry(db, "a", date))!.paymentTotals[0].amount, 100);
  const firstVendor = (
    await addVendorPayment(db, "a", {
      date,
      vendorName: "One",
      amount: Number.MAX_SAFE_INTEGER - 100
    })
  ).day.entry!.vendorPayments[0];
  await addVendorPayment(db, "a", { date, vendorName: "Two", amount: 100 });
  assert.equal(
    (
      await send(app, db, `/vendor-payments/${firstVendor.id}`, "PATCH", {
        vendorName: "One",
        amount: firstVendor.amount,
        note: "Only note"
      })
    ).status,
    200
  );
  assert.equal(
    (
      await send(app, db, `/vendor-payments/${firstVendor.id}`, "PATCH", {
        vendorName: "Changed",
        amount: firstVendor.amount + 1
      })
    ).status,
    400
  );
  const preservedVendor = (await getDailyEntry(db, "a", date))!.vendorPayments.find(
    (v) => v.id === firstVendor.id
  );
  assert.ok(preservedVendor);
  assert.equal(preservedVendor.vendorName, "One");
});
