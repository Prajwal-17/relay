import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { monthFromDate } from "@/lib/format/dates";
import { moneyKeys } from "./money.keys";
import type {
  DaySummary,
  MoneyMutationResult,
  MoneyWeek,
  ReceivedHistoryPage
} from "./money.types";
import { summarizeEntry } from "./money.utils";

type ReceiptChange = { methodId: number | null; deletedId?: number };

/** Apply a successful write's server response without synchronization GETs. */
export async function applyMoneyMutation(
  client: QueryClient,
  result: MoneyMutationResult,
  change?: ReceiptChange | "delete-day"
) {
  const { day } = result;
  const summariesKey = moneyKeys.summaries(monthFromDate(day.date));
  await Promise.all([
    client.cancelQueries({ queryKey: moneyKeys.week(day.date), exact: true }),
    client.cancelQueries({ queryKey: moneyKeys.historiesForDate(day.date) }),
    client.cancelQueries({ queryKey: summariesKey, exact: true }),
    result.editedEntry
      ? client.cancelQueries({
          queryKey: moneyKeys.entry(result.editedEntry.kind, result.editedEntry.id),
          exact: true
        })
      : Promise.resolve(),
    result.vendorNames
      ? client.cancelQueries({ queryKey: moneyKeys.vendors, exact: true })
      : Promise.resolve()
  ]);
  client.setQueryData<MoneyWeek>(moneyKeys.week(day.date), (week) =>
    week
      ? {
          ...week,
          days: week.days.map((cachedDay) => (cachedDay.date === day.date ? day : cachedDay))
        }
      : undefined
  );
  client.setQueryData<DaySummary[]>(summariesKey, (summaries) => {
    if (!summaries) return undefined;
    const others = summaries.filter((row) => row.date !== day.date);
    return day.entry
      ? [...others, summarizeEntry(day.entry)].sort((a, b) => a.date.localeCompare(b.date))
      : others;
  });
  for (const query of client
    .getQueryCache()
    .findAll({ queryKey: moneyKeys.historiesForDate(day.date) })) {
    const keyMethod = query.queryKey[3];
    const methodId = keyMethod === "cash" ? null : Number(keyMethod);
    const total =
      methodId === null
        ? (day.entry?.cashAmount ?? 0)
        : (day.entry?.paymentTotals.find((row) => row.paymentMethodId === methodId)?.amount ?? 0);
    client.setQueryData<InfiniteData<ReceivedHistoryPage, number | undefined>>(
      query.queryKey,
      (history) => {
        if (!history) return undefined;
        if (change === "delete-day")
          return {
            pages: [{ ...history.pages[0]!, entries: [], total: 0, nextCursor: null }],
            pageParams: [undefined]
          };
        return {
          ...history,
          pages: history.pages.map((page, index) => {
            let entries = page.entries;
            if (result.editedEntry?.kind === "received") {
              const edited = result.editedEntry;
              const containsEntry = entries.some((row) => row.id === edited.id);
              entries = entries.filter((row) => row.id !== edited.id);
              if (edited.paymentMethodId === methodId) {
                const upperBound = history.pageParams[index] ?? Number.POSITIVE_INFINITY;
                const lowerBound = page.nextCursor ?? 0;
                // Move an edited receipt only into its loaded cursor interval, never to the newest page.
                if (containsEntry || (edited.id < upperBound && edited.id >= lowerBound))
                  entries = [...entries, edited].sort((a, b) => b.id - a.id);
              }
            } else if (change && change.methodId === methodId) {
              if (change.deletedId !== undefined)
                entries = entries.filter((row) => row.id !== change.deletedId);
              if (
                index === 0 &&
                result.receivedEntry &&
                !entries.some((row) => row.id === result.receivedEntry!.id)
              ) {
                // Keep the old cursor and all loaded rows; prepending must not drop the boundary receipt.
                entries = [result.receivedEntry, ...entries];
              }
            }
            return { ...page, entries, total };
          })
        };
      }
    );
  }
  if (result.vendorNames) client.setQueryData(moneyKeys.vendors, result.vendorNames);
  if (result.editedEntry)
    client.setQueryData(
      moneyKeys.entry(result.editedEntry.kind, result.editedEntry.id),
      result.editedEntry
    );
}
