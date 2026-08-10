import { ErrorState } from "@/components/app-ui/ErrorState";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { getDateRangeContext } from "@/features/transactions/datePresets.constants";
import { useDashboard } from "@/features/transactions/hooks/useDashboard";
import type { useInfiniteScroll } from "@/features/transactions/hooks/useInfiniteScroll";
import { useViewModalStore } from "@/features/transactions/store/viewModal.store";
import type { TransactionGroupBy } from "@/features/transactions/transactionGrouping";
import { cn } from "@/lib/utils";
import { DASHBOARD_TYPE, SortOption, type DashboardType, type SortType } from "@shared/types";
import { LoaderCircle, ReceiptIndianRupee, X } from "lucide-react";
import TransactionTableRow from "./TransactionTableRow";

type TransactionTableProps = {
  type: DashboardType;
  search: string;
  onClearSearch: () => void;
  groupBy: TransactionGroupBy;
  onGroupByChange: (value: TransactionGroupBy) => void;
  transactionQuery: ReturnType<typeof useInfiniteScroll>;
};

const TRANSACTION_SORT_OPTIONS: { value: SortType; label: string }[] = [
  { value: SortOption.DATE_NEWEST_FIRST, label: "Newest first" },
  { value: SortOption.DATE_OLDEST_FIRST, label: "Oldest first" },
  { value: SortOption.HIGH_TO_LOW, label: "Highest amount" },
  { value: SortOption.LOW_TO_HIGH, label: "Lowest amount" }
];

const TRANSACTION_GROUP_OPTIONS: { value: TransactionGroupBy; label: string }[] = [
  { value: "none", label: "None" },
  { value: "day", label: "Day" },
  { value: "month", label: "Month" }
];

const isAmountSort = (value: SortType) =>
  value === SortOption.HIGH_TO_LOW || value === SortOption.LOW_TO_HIGH;

export const TransactionTable = ({
  type,
  search,
  onClearSearch,
  groupBy,
  onGroupByChange,
  transactionQuery
}: TransactionTableProps) => {
  const { sortBy, setSortBy, deleteMutation, convertMutation, duplicateMutation } = useDashboard();
  const {
    parentRef,
    rowVirtualizer,
    status,
    transactionData,
    displayRows,
    totalTransactions,
    isError,
    isFetchNextPageError,
    refetch,
    fetchNextPage,
    isFetchingNextPage
  } = transactionQuery;
  const setIsViewModalOpen = useViewModalStore((state) => state.setIsViewModalOpen);
  const setTransactionId = useViewModalStore((state) => state.setTransactionId);
  const virtualItems = rowVirtualizer.getVirtualItems();

  const isSales = type === DASHBOARD_TYPE.SALES;
  const documentLabel = isSales ? "Invoice no." : "Estimate no.";
  const transactionLabel = isSales ? "sales" : "estimates";
  const resultCount = status === "pending" ? "—" : (totalTransactions ?? 0);
  const handleSortChange = (value: string) => {
    const nextSort = value as SortType;
    if (groupBy !== "none" && isAmountSort(nextSort)) onGroupByChange("none");
    setSortBy(nextSort);
  };

  const handleGroupChange = (value: string) => {
    const nextGroup = value as TransactionGroupBy;
    if (nextGroup !== "none" && isAmountSort(sortBy)) {
      setSortBy(SortOption.DATE_NEWEST_FIRST);
    }
    onGroupByChange(nextGroup);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5">
      <div className="flex h-9 shrink-0 items-center justify-between gap-3 pl-1">
        <div className="flex items-center gap-1 text-xs font-medium">
          <h2 className="text-foreground">Recent {transactionLabel}</h2>
          <span className="text-muted-foreground" aria-hidden="true">
            ·
          </span>
          <span className="text-muted-foreground tabular-nums">{resultCount} results</span>
        </div>

        <div className="flex items-center gap-2">
          <Select value={groupBy} onValueChange={handleGroupChange}>
            <SelectTrigger
              size="sm"
              aria-label="Group transactions"
              className="bg-card h-8 min-w-32 shadow-none"
            >
              <span className="text-muted-foreground">Group</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {TRANSACTION_GROUP_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger
              size="sm"
              aria-label="Sort transactions"
              className="bg-card h-8 min-w-44 shadow-none"
            >
              <span className="text-muted-foreground">Sort</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {TRANSACTION_SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        role="table"
        aria-label={`Recent ${transactionLabel}`}
        aria-rowcount={
          groupBy === "none" && typeof totalTransactions === "number"
            ? totalTransactions + 1
            : undefined
        }
        className="bg-card border-frame flex min-h-0 flex-1 flex-col overflow-hidden rounded-(--radius-panel) border"
      >
        <div
          role="row"
          className="bg-table-header text-foreground border-frame grid h-8 shrink-0 grid-cols-12 items-center gap-2 border-b px-3 text-xs font-semibold tracking-wide uppercase"
        >
          <div role="columnheader" className="col-span-2 flex items-center">
            Date
          </div>
          <div role="columnheader" className="col-span-3 flex items-center">
            Customer
          </div>
          <div role="columnheader" className="col-span-2 flex items-center">
            {documentLabel}
          </div>
          <div role="columnheader" className="col-span-3 flex items-center justify-end">
            Amount
          </div>
          <div role="columnheader" className="col-span-2 flex items-center justify-center">
            Actions
          </div>
        </div>

        {status === "pending" ? (
          <div role="row" className="flex min-h-48 flex-1 items-center justify-center">
            <div role="cell" className="flex flex-col items-center gap-3">
              <LoaderCircle
                className="text-muted-foreground size-8 animate-spin"
                aria-hidden="true"
              />
              <p className="text-muted-foreground text-sm">Loading {transactionLabel}…</p>
            </div>
          </div>
        ) : isError && transactionData.length === 0 ? (
          <ErrorState
            layout="page"
            className="border-0"
            title={`${isSales ? "Sales" : "Estimates"} could not be loaded`}
            description={`Your saved ${transactionLabel} are unchanged. Try loading the list again.`}
            primaryAction={{ label: "Try again", onClick: () => void refetch() }}
          />
        ) : transactionData.length > 0 ? (
          <div
            ref={parentRef}
            role="rowgroup"
            className="relative min-h-0 flex-1 overflow-auto overscroll-contain"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative"
              }}
            >
              <div
                className="absolute top-0 left-0 w-full"
                style={{ transform: `translateY(${virtualItems[0]?.start ?? 0}px)` }}
              >
                {virtualItems.map((virtualRow) => {
                  const isLoaderRow = virtualRow.index >= displayRows.length;
                  const displayRow = displayRows[virtualRow.index];

                  if (isLoaderRow) {
                    return (
                      <div
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        role="row"
                        className="border-border text-muted-foreground flex h-12 items-center justify-center border-b text-xs"
                      >
                        <span role="cell" className="flex items-center gap-2">
                          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                          Loading more…
                        </span>
                      </div>
                    );
                  }

                  if (displayRow?.kind === "group") {
                    return (
                      <div
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        role="row"
                        aria-label={`Group: ${displayRow.label}`}
                        className="bg-secondary border-frame flex h-8 items-center border-b px-3"
                      >
                        <span
                          role="cell"
                          className="border-marker text-foreground border-l-2 pl-2 text-xs font-semibold"
                        >
                          {displayRow.label}
                        </span>
                      </div>
                    );
                  }

                  if (!displayRow || displayRow.kind !== "transaction") return null;
                  const transaction = displayRow.transaction;

                  return (
                    <div
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      role="presentation"
                    >
                      <TransactionTableRow
                        pathname={type}
                        transaction={transaction}
                        search={search}
                        deleteMutation={deleteMutation}
                        convertMutation={convertMutation}
                        duplicateMutation={duplicateMutation}
                        setIsViewModalOpen={setIsViewModalOpen}
                        setTransactionId={setTransactionId}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div
            role="row"
            className="flex min-h-48 flex-1 flex-col items-center justify-center px-6 py-10 text-center"
          >
            <span
              className={cn(
                "mb-4 flex size-11 items-center justify-center rounded-(--radius-panel)",
                isSales
                  ? "bg-sales-soft text-sales-foreground"
                  : "bg-estimate-soft text-estimate-foreground"
              )}
            >
              <ReceiptIndianRupee className="size-5" aria-hidden="true" />
            </span>
            <div role="cell">
              <h3 className="text-foreground text-base font-semibold">
                {search
                  ? `No ${transactionLabel} match “${search}”`
                  : `No ${transactionLabel} in the selected period`}
              </h3>
              <p className="text-muted-foreground mt-1.5 max-w-md text-sm">
                {search
                  ? `No customer or ${isSales ? "invoice" : "estimate"} number matched this search.`
                  : `There are no ${transactionLabel} for ${getDateRangeContext(transactionQuery.date).toLowerCase()}.`}
              </p>
              {search ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClearSearch}
                  className="mt-4 cursor-pointer"
                >
                  <X className="size-4" aria-hidden="true" />
                  Clear search
                </Button>
              ) : null}
            </div>
          </div>
        )}

        {isError && transactionData.length > 0 && !isFetchNextPageError ? (
          <div
            role="alert"
            className="border-border flex items-center justify-between border-t px-3 py-2 text-xs"
          >
            <span className="text-muted-foreground">The latest results could not be loaded.</span>
            <button
              type="button"
              className="text-foreground cursor-pointer font-semibold underline-offset-4 hover:underline"
              onClick={() => void refetch()}
            >
              Try again
            </button>
          </div>
        ) : null}

        {isFetchNextPageError ? (
          <div
            role="alert"
            className="border-border flex items-center justify-between border-t px-3 py-2 text-xs"
          >
            <span className="text-muted-foreground">
              More {transactionLabel} could not be loaded.
            </span>
            <button
              type="button"
              className="text-foreground cursor-pointer font-semibold underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isFetchingNextPage}
              onClick={() => void fetchNextPage()}
            >
              Try again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
