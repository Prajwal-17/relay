import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TransactionDetailsDialog } from "@/features/transactions/TransactionDetailsDialog";
import { TransactionListPanel } from "@/features/transactions/TransactionListPanel";
import { formatTransactionDateRange } from "@/features/transactions/datePresets.constants";
import { useInfiniteScroll } from "@/features/transactions/hooks/useInfiniteScroll";
import { useViewModalStore } from "@/features/transactions/store/viewModal.store";
import {
  getInitialTransactionGroupBy,
  persistTransactionGroupBy,
  type TransactionGroupBy
} from "@/features/transactions/transactionGrouping";
import useDebounce from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { DASHBOARD_TYPE, type DashboardType } from "@shared/types";
import { formatRupee } from "@shared/utils/utils";
import { CalendarRange, Eye, EyeOff, FileText, IndianRupee, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const TRANSACTION_SEARCH_DEBOUNCE_MS = 250;
const SUMMARY_VALUE_VISIBILITY_KEY = "transactions-summary-value-visibility";
const TransactionsScreen = ({ type }: { type: DashboardType }) => {
  const navigate = useNavigate();
  const isSales = type === DASHBOARD_TYPE.SALES;
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<TransactionGroupBy>(getInitialTransactionGroupBy);
  const [isValueVisible, setIsValueVisible] = useState(
    () => localStorage.getItem(SUMMARY_VALUE_VISIBILITY_KEY) !== "hidden"
  );
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(search, TRANSACTION_SEARCH_DEBOUNCE_MS);
  const transactionQuery = useInfiniteScroll(type, debouncedSearch, groupBy);

  const isViewModalOpen = useViewModalStore((state) => state.isViewModalOpen);
  const transactionId = useViewModalStore((state) => state.transactionId);

  const normalizedRawSearch = search.trim();
  const isUpdating =
    normalizedRawSearch !== transactionQuery.search ||
    (transactionQuery.isFetching && !transactionQuery.isFetchingNextPage);
  const hasInitialError = transactionQuery.isError && transactionQuery.totalRevenue === undefined;
  const isInitialLoading = transactionQuery.status === "pending";
  const periodContext = formatTransactionDateRange(transactionQuery.date);
  const valueLabel = isSales ? "Sales value" : "Estimates Value";

  const handleGroupByChange = (value: TransactionGroupBy) => {
    persistTransactionGroupBy(value);
    setGroupBy(value);
  };

  const toggleValueVisibility = () => {
    setIsValueVisible((isVisible) => {
      const nextVisible = !isVisible;
      localStorage.setItem(SUMMARY_VALUE_VISIBILITY_KEY, nextVisible ? "visible" : "hidden");
      return nextVisible;
    });
  };

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  return (
    <div className="bg-background flex h-full flex-1 flex-col overflow-hidden p-3">
      <div className="mb-2 grid shrink-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
        <div
          aria-busy={isInitialLoading || isUpdating}
          className="border-frame bg-card grid min-h-14 min-w-0 grid-cols-[minmax(20rem,1.2fr)_minmax(9rem,0.55fr)_minmax(17rem,0.8fr)] overflow-hidden rounded-(--radius-panel) border shadow-xs"
        >
          <div className="flex min-w-0 items-center gap-3 px-4">
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-(--radius-control)",
                isSales
                  ? "bg-sales-soft text-sales-foreground"
                  : "bg-estimate-soft text-estimate-foreground"
              )}
            >
              <IndianRupee className="size-4" aria-hidden="true" />
            </span>
            <span className="text-muted-foreground shrink-0 text-sm font-semibold">
              {valueLabel}
            </span>
            <div className="ml-auto flex min-w-0 items-center gap-1">
              <span
                aria-hidden={!isValueVisible}
                className={cn(
                  "text-foreground shrink-0 text-2xl font-bold tracking-tight whitespace-nowrap tabular-nums",
                  !isValueVisible && "blur-sm select-none"
                )}
              >
                {hasInitialError || isInitialLoading
                  ? "—"
                  : formatRupee(transactionQuery.totalRevenue ?? 0)}
              </span>
              {!isValueVisible ? <span className="sr-only">{valueLabel} hidden</span> : null}
              <Tooltip>
                <TooltipTrigger
                  type="button"
                  aria-label={isValueVisible ? `Hide ${valueLabel}` : `Show ${valueLabel}`}
                  disabled={hasInitialError || isInitialLoading}
                  onClick={toggleValueVisibility}
                  className="text-muted-foreground hover:bg-hover hover:text-foreground focus-visible:ring-ring flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-(--radius-control) transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isValueVisible ? (
                    <Eye className="size-4" aria-hidden="true" />
                  ) : (
                    <EyeOff className="size-4" aria-hidden="true" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isValueVisible ? `Hide ${valueLabel}` : `Show ${valueLabel}`}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="border-frame flex min-w-0 items-center gap-2.5 border-l px-3.5">
            <span className="bg-secondary text-secondary-foreground flex size-8 shrink-0 items-center justify-center rounded-(--radius-control)">
              <FileText className="size-4" aria-hidden="true" />
            </span>
            <span className="text-muted-foreground text-sm font-semibold whitespace-nowrap">
              {isSales ? "Bills" : "Estimates"}
            </span>
            <span className="text-foreground ml-auto text-lg font-bold tracking-tight tabular-nums">
              {hasInitialError || isInitialLoading
                ? "—"
                : (transactionQuery.totalTransactions ?? 0)}
            </span>
          </div>

          <div className="border-frame flex min-w-0 items-center gap-2.5 border-l px-3.5">
            <span className="bg-secondary text-secondary-foreground flex size-8 shrink-0 items-center justify-center rounded-(--radius-control)">
              <CalendarRange className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <span className="text-muted-foreground block text-xs leading-none font-medium">
                Current period
              </span>
              <span
                className="text-foreground mt-1 block text-sm leading-none font-semibold whitespace-nowrap tabular-nums"
                title={periodContext}
              >
                {periodContext}
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={() => navigate(isSales ? "/billing/sales/create" : "/billing/estimates/create")}
          className={cn(
            "text-primary-foreground h-14 min-w-30 cursor-pointer gap-2 rounded-(--radius-panel) px-4 text-sm font-semibold shadow-xs",
            isSales ? "bg-primary hover:bg-primary-hover" : "bg-estimate hover:bg-estimate-hover"
          )}
        >
          <Plus className="size-4" />
          {isSales ? "New Sale" : "New Estimate"}
        </Button>
      </div>

      <TransactionListPanel
        type={type}
        rawSearch={search}
        activeSearch={transactionQuery.search}
        searchInputRef={searchInputRef}
        isUpdating={isUpdating}
        onSearchChange={setSearch}
        onClearSearch={() => setSearch("")}
        groupBy={groupBy}
        onGroupByChange={handleGroupByChange}
        transactionQuery={transactionQuery}
      />
      {isViewModalOpen && <TransactionDetailsDialog type={type} id={transactionId} />}
    </div>
  );
};

export default TransactionsScreen;
