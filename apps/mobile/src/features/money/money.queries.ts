import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import type { LedgerMonth } from "@/lib/format/dates";
import { moneyKeys } from "./money.keys";
import { moneyQueryPolicy } from "./money-query-policy";
import {
  getMoneyWeek,
  getMoneyEntry,
  getMonthSummaries,
  getReceivedHistory,
  listVendorNames
} from "./money.repository";
import type { LocalDate } from "./money.types";

export function moneyWeekOptions(date: LocalDate) {
  const queryKey = moneyKeys.week(date);
  return queryOptions({
    ...moneyQueryPolicy,
    queryKey,
    queryFn: ({ signal }) => getMoneyWeek(queryKey[2].startDate, queryKey[2].endDate, signal)
  });
}

export function monthSummariesOptions(month: LedgerMonth) {
  return queryOptions({
    ...moneyQueryPolicy,
    queryKey: moneyKeys.summaries(month),
    queryFn: ({ signal }) => getMonthSummaries(month, signal)
  });
}

export function receivedHistoryOptions(date: LocalDate | null, methodId: number | null) {
  return infiniteQueryOptions({
    ...moneyQueryPolicy,
    queryKey: date
      ? moneyKeys.receivedHistory(date, methodId)
      : [...moneyKeys.histories, "invalid"],
    initialPageParam: undefined as number | undefined,
    queryFn: ({ pageParam, signal }) => {
      if (!date) throw new Error("Choose a valid business date.");
      return getReceivedHistory(date, methodId, pageParam, signal);
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined
  });
}

export function vendorNamesOptions() {
  return queryOptions({
    ...moneyQueryPolicy,
    queryKey: moneyKeys.vendors,
    queryFn: ({ signal }) => listVendorNames(signal)
  });
}

export function moneyEntryOptions(kind: "received" | "vendor", id: number) {
  return queryOptions({
    ...moneyQueryPolicy,
    queryKey: moneyKeys.entry(kind, id),
    queryFn: ({ signal }) => getMoneyEntry(kind, id, signal)
  });
}
