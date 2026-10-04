import assert from "node:assert/strict";
import { test } from "node:test";
import { QueryClient, QueryObserver, focusManager, onlineManager } from "@tanstack/react-query";
import { moneyQueryPolicy } from "../src/features/money/money-query-policy.ts";
import { moneyKeys } from "../src/features/money/money.keys.ts";
import { applyMoneyMutation } from "../src/features/money/money.cache.ts";

import type { InfiniteData, QueryKey } from "@tanstack/react-query";
import type {
  LocalDate,
  MoneyWeek,
  MoneyDay,
  ReceivedEntry,
  ReceivedHistoryPage,
  EditableReceivedEntry,
  EditableVendorPayment,
  DaySummary
} from "../src/features/money/money.types.ts";
function cached<T>(client: QueryClient, key: QueryKey): T {
  const value = client.getQueryData<T>(key);
  assert.ok(value !== undefined);
  return value;
}
type History = InfiniteData<ReceivedHistoryPage, number | undefined>;
const date = "2025-12-31";
const otherDate = "2026-01-01";
const method = { id: 7, name: "PhonePe", isArchived: false, isPreset: true };
function day(
  value: LocalDate = date,
  cash = 100,
  phone = 200
): MoneyDay & { entry: NonNullable<MoneyDay["entry"]> } {
  return {
    date: value,
    entry: {
      date: value,
      cashAmount: cash,
      paymentTotals: phone
        ? [
            {
              paymentMethodId: 7,
              paymentMethodName: "PhonePe",
              amount: phone,
              isPaymentMethodArchived: false
            }
          ]
        : [],
      vendorPayments: [],
      createdAt: date,
      updatedAt: date
    },
    receivedCounts: [
      { paymentMethodId: null, count: 1 },
      { paymentMethodId: 7, count: 2 }
    ]
  };
}
const week: MoneyWeek = {
  startDate: "2025-12-28",
  endDate: "2026-01-03",
  days: [day(), day(otherDate)],
  paymentMethods: [method]
};
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

test("days in the same week share a cache key across month/year boundaries; methods and weeks stay distinct", () => {
  assert.deepEqual(moneyKeys.week(date), moneyKeys.week(otherDate));
  assert.notDeepEqual(moneyKeys.week(date), moneyKeys.week("2025-12-27"));
  assert.notDeepEqual(moneyKeys.receivedHistory(date, null), moneyKeys.receivedHistory(date, 7));
  assert.notDeepEqual(moneyKeys.receivedHistory(date, 7), moneyKeys.receivedHistory(otherDate, 7));
});

test("Money cache fetches once, survives remount/focus/reconnect, and changes only on explicit refresh", async () => {
  const client = new QueryClient();
  client.mount();
  let requests = 0;
  const options = {
    ...moneyQueryPolicy,
    queryKey: moneyKeys.week(date),
    queryFn: async () => ({ ...week, revision: ++requests })
  };
  const observer = new QueryObserver(client, options);
  let stop = observer.subscribe(() => {});
  await observer.refetch();
  assert.equal(requests, 1);
  stop();
  stop = observer.subscribe(() => {});
  focusManager.setFocused(false);
  focusManager.setFocused(true);
  onlineManager.setOnline(false);
  onlineManager.setOnline(true);
  await tick();
  assert.equal(requests, 1);
  assert.equal(
    (await client.fetchQuery({ ...options, queryKey: moneyKeys.week(otherDate) })).revision,
    1
  );
  await observer.refetch();
  assert.equal(requests, 2);
  stop();
  client.unmount();
  client.clear();
  focusManager.setFocused(undefined);
});

test("failed Money reads stay retryable without automatic retries or retry-on-mount", async () => {
  const client = new QueryClient();
  let requests = 0;
  const observer = new QueryObserver(client, {
    ...moneyQueryPolicy,
    queryKey: moneyKeys.vendors,
    queryFn: async () => {
      requests++;
      if (requests === 1) throw new Error("Offline");
      return ["Vendor"];
    }
  });
  let stop = observer.subscribe(() => {});
  await observer.refetch();
  assert.equal(requests, 1);
  stop();
  stop = observer.subscribe(() => {});
  await tick();
  assert.equal(requests, 1);
  assert.deepEqual((await observer.refetch()).data, ["Vendor"]);
  assert.equal(requests, 2);
  stop();
  client.clear();
});

function history(entries: ReceivedEntry[], total = 200, nextCursor: number | null = null): History {
  return { pages: [{ entries, method, total, nextCursor }], pageParams: [undefined] };
}
function receipt(id: number): ReceivedEntry {
  return { id, amount: 100, note: null, createdAt: date, updatedAt: date };
}

test("successful writes patch only the affected week/date/method and preserve pagination boundaries without GETs", async () => {
  const client = new QueryClient();
  client.setQueryData(moneyKeys.week(date), week);
  client.setQueryData(moneyKeys.week("2025-12-27"), { ...week, startDate: "2025-12-21" });
  const first = Array.from({ length: 50 }, (_, n) => receipt(100 - n));
  const providerKey = moneyKeys.receivedHistory(date, 7);
  client.setQueryData(providerKey, {
    pages: [history(first, 200, 51).pages[0], history([receipt(50)], 200).pages[0]],
    pageParams: [undefined, 51]
  });
  client.setQueryData(moneyKeys.receivedHistory(date, null), {
    ...history([receipt(1)], 100),
    pages: [{ ...history([receipt(1)], 100).pages[0], method: null }]
  });
  client.setQueryData(moneyKeys.receivedHistory(otherDate, 7), history([receipt(2)]));
  client.setQueryData(moneyKeys.summaries({ year: 2025, month: 11 }), [{ date, netAmount: 300 }]);
  client.setQueryData(moneyKeys.vendors, ["Existing"]);
  const changed = day(date, 100, 300);
  await applyMoneyMutation(client, { day: changed, receivedEntry: receipt(101) }, { methodId: 7 });
  const result = cached<History>(client, providerKey);
  assert.equal(result.pages[0].entries.length, 51);
  assert.equal(result.pages[0].entries.at(-1)!.id, 51);
  assert.equal(result.pages[0].nextCursor, 51);
  assert.equal(result.pages[1].total, 300);
  assert.equal(result.pages[1].entries[0].id, 50);
  assert.equal(cached<MoneyWeek>(client, moneyKeys.week(date)).days[1].entry!.cashAmount, 100);
  assert.equal(
    cached<MoneyWeek>(client, moneyKeys.week("2025-12-27")).days[0].entry!.paymentTotals[0].amount,
    200
  );
  assert.deepEqual(
    cached<History>(client, moneyKeys.receivedHistory(otherDate, 7)),
    history([receipt(2)])
  );
  assert.equal(
    cached<History>(client, moneyKeys.receivedHistory(date, null)).pages[0].entries[0].id,
    1
  );
  assert.equal(
    cached<DaySummary[]>(client, moneyKeys.summaries({ year: 2025, month: 11 }))[0].netAmount,
    400
  );
  await applyMoneyMutation(client, { day: day(), vendorNames: ["New", "Existing"] });
  assert.deepEqual(client.getQueryData(moneyKeys.vendors), ["New", "Existing"]);
  await applyMoneyMutation(client, { day: day() }, { methodId: 7, deletedId: 101 });
  assert.equal(cached<History>(client, providerKey).pages[0].entries[0].id, 100);
  await applyMoneyMutation(
    client,
    { day: { date, entry: null, receivedCounts: [] }, vendorNames: [] },
    "delete-day"
  );
  assert.equal(cached<History>(client, providerKey).pages.length, 1);
  assert.deepEqual(cached<History>(client, providerKey).pages[0].entries, []);
  assert.equal(cached<History>(client, providerKey).pages[0].nextCursor, null);
  assert.deepEqual(
    cached<DaySummary[]>(client, moneyKeys.summaries({ year: 2025, month: 11 })),
    []
  );
  assert.equal(cached<MoneyWeek>(client, moneyKeys.week(date)).days[0].entry, null);
  client.clear();
});

test("a late in-flight refresh cannot overwrite the canonical mutation response", async () => {
  const client = new QueryClient();
  client.setQueryData(moneyKeys.week(date), week);
  let release!: (value: MoneyWeek) => void;
  const pending = client
    .fetchQuery({
      queryKey: moneyKeys.week(date),
      staleTime: 0,
      queryFn: () =>
        new Promise<MoneyWeek>((resolve) => {
          release = resolve;
        })
    })
    .catch(() => {});
  await tick();
  const changed = day(date, 500);
  await applyMoneyMutation(client, { day: changed });
  release(week);
  await pending;
  await tick();
  assert.equal(cached<MoneyWeek>(client, moneyKeys.week(date)).days[0].entry!.cashAmount, 500);
  client.clear();
});

test("edits replace receipts in their original cursor page and move methods only within loaded ranges", async () => {
  const client = new QueryClient();
  client.setQueryData(moneyKeys.week(date), week);
  const phoneKey = moneyKeys.receivedHistory(date, 7);
  const cashKey = moneyKeys.receivedHistory(date, null);
  client.setQueryData(phoneKey, {
    pages: [
      history([receipt(100), receipt(51)], 200, 51).pages[0],
      history([receipt(50), receipt(25)], 200).pages[0]
    ],
    pageParams: [undefined, 51]
  });
  client.setQueryData(cashKey, history([receipt(70)], 100, 60));
  const editedEntry: EditableReceivedEntry = {
    ...receipt(25),
    kind: "received",
    date,
    paymentMethodId: 7,
    amount: 150,
    note: "Updated",
    updatedAt: "2026-10-04T06:01:00.000Z"
  };
  await applyMoneyMutation(client, {
    day: day(date, 100, 250),
    receivedEntry: editedEntry,
    editedEntry,
    previousPaymentMethodId: 7
  });
  const phone = cached<History>(client, phoneKey);
  assert.deepEqual(
    phone.pages[0].entries.map((e) => e.id),
    [100, 51]
  );
  assert.deepEqual(
    phone.pages[1].entries.map((e) => e.id),
    [50, 25]
  );
  assert.equal(phone.pages[1].entries[1].amount, 150);
  assert.equal(phone.pages[1].entries[1].createdAt, date);
  assert.equal(phone.pages[1].entries[1].updatedAt, editedEntry.updatedAt);
  assert.equal(phone.pages[0].nextCursor, 51);
  assert.deepEqual(client.getQueryData(moneyKeys.entry("received", 25)), editedEntry);
  const moved = { ...editedEntry, paymentMethodId: null };
  await applyMoneyMutation(client, {
    day: day(date, 250, 100),
    editedEntry: moved,
    receivedEntry: moved,
    previousPaymentMethodId: 7
  });
  assert.deepEqual(
    cached<History>(client, phoneKey).pages[1].entries.map((e) => e.id),
    [50]
  );
  // Cash's older pages are not loaded: the moved older receipt must not jump into the first page.
  assert.deepEqual(
    cached<History>(client, cashKey).pages[0].entries.map((e) => e.id),
    [70]
  );
  client.setQueryData(cashKey, {
    pages: [history([receipt(70)], 250, 60).pages[0], history([receipt(40)], 250).pages[0]],
    pageParams: [undefined, 60]
  });
  await applyMoneyMutation(client, { day: day(date, 250, 100), editedEntry: moved });
  assert.deepEqual(
    cached<History>(client, cashKey).pages[1].entries.map((e) => e.id),
    [40, 25]
  );
  const boundaryMove = { ...moved, id: 60 };
  await applyMoneyMutation(client, { day: day(), editedEntry: boundaryMove });
  const cash = cached<History>(client, cashKey);
  assert.equal(cash.pages.flatMap((p) => p.entries).filter((e) => e.id === 60).length, 1);
  assert.equal(cash.pages[0].entries.at(-1)!.id, 60);
  client.clear();
});

test("vendor edits update shared details and catalog without changing other cached days", async () => {
  const client = new QueryClient();
  client.setQueryData(moneyKeys.week(date), week);
  const editedEntry: EditableVendorPayment = {
    kind: "vendor",
    id: 10,
    date,
    vendorName: "Revised",
    amount: 125,
    note: "Fixed",
    createdAt: date,
    updatedAt: "2026-10-04T06:01:00.000Z"
  };
  const changed = day();
  changed.entry!.vendorPayments = [editedEntry];
  await applyMoneyMutation(client, { day: changed, vendorNames: ["Revised"], editedEntry });
  assert.deepEqual(client.getQueryData(moneyKeys.entry("vendor", 10)), editedEntry);
  assert.deepEqual(client.getQueryData(moneyKeys.vendors), ["Revised"]);
  assert.equal(
    cached<MoneyWeek>(client, moneyKeys.week(date)).days[0].entry!.vendorPayments[0].updatedAt,
    editedEntry.updatedAt
  );
  assert.equal(
    cached<MoneyWeek>(client, moneyKeys.week(date)).days[1].entry!.vendorPayments.length,
    0
  );
  assert.equal(
    cached<MoneyWeek>(client, moneyKeys.week(date)).days[0].entry!.vendorPayments[0].note,
    "Fixed"
  );
  client.clear();
});
