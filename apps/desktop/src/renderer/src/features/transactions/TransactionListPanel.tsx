import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/features/transactions/DateRangePicker";
import { TransactionTable } from "@/features/transactions/TransactionTable";
import type { useInfiniteScroll } from "@/features/transactions/hooks/useInfiniteScroll";
import type { TransactionGroupBy } from "@/features/transactions/transactionGrouping";
import { DASHBOARD_TYPE, type DashboardType } from "@shared/types";
import { LoaderCircle, Search, X } from "lucide-react";
import type { RefObject } from "react";

type TransactionListPanelProps = {
  type: DashboardType;
  rawSearch: string;
  activeSearch: string;
  searchInputRef: RefObject<HTMLInputElement | null>;
  isUpdating: boolean;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  groupBy: TransactionGroupBy;
  onGroupByChange: (value: TransactionGroupBy) => void;
  transactionQuery: ReturnType<typeof useInfiniteScroll>;
};

export const TransactionListPanel = ({
  type,
  rawSearch,
  activeSearch,
  searchInputRef,
  isUpdating,
  onSearchChange,
  onClearSearch,
  groupBy,
  onGroupByChange,
  transactionQuery
}: TransactionListPanelProps) => {
  const isSales = type === DASHBOARD_TYPE.SALES;
  const searchStatusId = `${type}-search-status`;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="border-frame bg-card grid h-14 shrink-0 grid-cols-[minmax(16rem,3fr)_minmax(32rem,2fr)] items-center gap-2 rounded-(--radius-panel) border p-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            ref={searchInputRef}
            type="search"
            value={rawSearch}
            maxLength={100}
            autoComplete="off"
            spellCheck={false}
            aria-label={
              isSales
                ? "Search sales by customer or invoice number"
                : "Search estimates by customer or estimate number"
            }
            aria-describedby={searchStatusId}
            aria-busy={isUpdating}
            placeholder={isSales ? "Search customer or invoice #" : "Search customer or estimate #"}
            className="bg-background h-10 pr-16 pl-9 text-sm shadow-none [&::-webkit-search-cancel-button]:hidden"
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape" && rawSearch) {
                event.preventDefault();
                onClearSearch();
              }
            }}
          />

          <span
            className="pointer-events-none absolute top-1/2 right-9 flex size-7 -translate-y-1/2 items-center justify-center"
            aria-hidden="true"
          >
            <LoaderCircle
              className={
                isUpdating ? "text-muted-foreground size-4 animate-spin" : "size-4 opacity-0"
              }
            />
          </span>

          <button
            type="button"
            aria-label="Clear search"
            onClick={onClearSearch}
            className={
              rawSearch
                ? "text-muted-foreground hover:bg-hover hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-(--radius-control) outline-none focus-visible:ring-2"
                : "pointer-events-none absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center opacity-0"
            }
            tabIndex={rawSearch ? 0 : -1}
          >
            <X className="size-4" aria-hidden="true" />
          </button>

          <span id={searchStatusId} className="sr-only" role="status" aria-live="polite">
            {isUpdating ? "Updating results" : ""}
          </span>
        </div>

        <DateRangePicker type={type} />
      </div>

      <TransactionTable
        type={type}
        search={activeSearch}
        onClearSearch={onClearSearch}
        groupBy={groupBy}
        onGroupByChange={onGroupByChange}
        transactionQuery={transactionQuery}
      />
    </div>
  );
};
