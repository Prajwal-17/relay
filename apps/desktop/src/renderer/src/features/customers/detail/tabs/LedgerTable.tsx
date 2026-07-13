import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LEDGER_SORT_OPTIONS, LEDGER_TABLE_PAGE_SIZE, LEDGER_TYPE_OPTIONS } from "@/constants";
import { useCustomerLedger } from "@/hooks/customers/useCustomerLedger";
import { cn } from "@/lib/utils";
import { TXN_TABLE_ALIGN, type TxnTableColMeta } from "@/types";
import type { LedgerSort, LedgerTypeFilter } from "@shared/types";
import { LEDGER_SORT, LEDGER_TYPE_FILTER } from "@shared/types";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  ArrowDownAZ,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Scale,
  Search,
  Tags,
  X,
  Zap
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomerActions } from "../../customerActions";
import { buildLedgerColumns } from "./LedgerColumns";

const LEDGER_NUMBER_INPUT_CLASS =
  "h-8 w-14 border-border bg-muted/50 text-center text-sm font-medium tabular-nums shadow-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus-visible:bg-background";

export function LedgerTable({ customerId }: { customerId: string }) {
  const navigate = useNavigate();
  const { openAdjust, openQuickSale } = useCustomerActions();

  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(LEDGER_TABLE_PAGE_SIZE);
  const [typeFilter, setTypeFilter] = useState<LedgerTypeFilter>(LEDGER_TYPE_FILTER.ALL);
  const [sortValue, setSortValue] = useState<LedgerSort>(LEDGER_SORT.DATE_DESC);

  const [pageSizeInput, setPageSizeInput] = useState(String(LEDGER_TABLE_PAGE_SIZE));
  const [pageNoInput, setPageNoInput] = useState("1");

  const { entries, totalCount, status, isFetching } = useCustomerLedger({
    customerId,
    pageNo,
    pageSize,
    search: "",
    type: typeFilter,
    sort: sortValue
  });

  const columns = useMemo(
    () =>
      buildLedgerColumns({
        onOpenSale: (saleId) => navigate(`/billing/sales/${saleId}/edit`)
      }),
    [navigate]
  );

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);
  const canPrev = pageNo > 1;
  const canNext = pageNo * pageSize < totalCount;
  const rangeStart = totalCount === 0 ? 0 : (pageNo - 1) * pageSize + 1;
  const rangeEnd = Math.min(pageNo * pageSize, totalCount);

  useEffect(() => {
    if (!isFetching && entries.length === 0 && totalCount > 0 && pageNo > 1) {
      setPageNo(Math.max(1, Math.ceil(totalCount / pageSize)));
    }
  }, [isFetching, entries.length, totalCount, pageNo, pageSize]);

  useEffect(() => setPageSizeInput(String(pageSize)), [pageSize]);
  useEffect(() => setPageNoInput(String(pageNo)), [pageNo]);

  const applyType = (t: LedgerTypeFilter) => {
    setTypeFilter(t);
    setPageNo(1);
  };

  const applySort = (s: LedgerSort) => {
    setSortValue(s);
    setPageNo(1);
  };

  const commitPageSize = () => {
    const n = parseInt(pageSizeInput, 10);
    if (isNaN(n) || n < 1) {
      setPageSizeInput(String(pageSize));
      return;
    }
    const clamped = Math.min(Math.max(n, 1), 100);
    setPageSize(clamped);
    setPageNo(1);
  };

  const commitPageNo = () => {
    if (totalPages === 0) return;
    const n = parseInt(pageNoInput, 10);
    if (isNaN(n) || n < 1) {
      setPageNoInput(String(pageNo));
      return;
    }
    setPageNo(Math.min(Math.max(n, 1), totalPages));
  };

  const clearFilters = () => {
    setTypeFilter(LEDGER_TYPE_FILTER.ALL);
  };

  const activeSortLabel = LEDGER_SORT_OPTIONS.find((o) => o.value === sortValue)?.label ?? "Sort";
  const activeType = LEDGER_TYPE_OPTIONS.find((o) => o.value === typeFilter)!;
  const hasFilters = typeFilter !== LEDGER_TYPE_FILTER.ALL;
  const isFirstLoad = status === "pending" && entries.length === 0;
  const isEmpty = !isFirstLoad && entries.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center gap-2.5">
        <div className="relative w-64 min-w-0">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            disabled
            placeholder="Search notes…"
            className="bg-muted/60 h-9 rounded-md border-transparent pr-9 pl-9 text-sm shadow-none"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="border-border bg-muted/50 text-foreground hover:bg-muted/60 h-9 cursor-pointer gap-2 px-3 text-sm font-medium shadow-none transition-colors"
            >
              <Tags className="size-4" />
              Type: {activeType.label}
              <ChevronRight className="text-muted-foreground size-3.5 rotate-90" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Type
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={typeFilter}
              onValueChange={(v) => applyType(v as LedgerTypeFilter)}
            >
              {LEDGER_TYPE_OPTIONS.map((option) => (
                <DropdownMenuRadioItem
                  key={option.value}
                  value={option.value}
                  className="cursor-pointer text-sm font-medium"
                >
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="border-border bg-muted/50 text-foreground hover:bg-muted/60 h-9 cursor-pointer gap-2 px-3 text-sm font-medium shadow-none transition-colors"
            >
              <ArrowDownAZ className="size-4" />
              {activeSortLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Sort by
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={sortValue}
              onValueChange={(v) => applySort(v as LedgerSort)}
            >
              {LEDGER_SORT_OPTIONS.map((option) => (
                <DropdownMenuRadioItem
                  key={option.value}
                  value={option.value}
                  className="cursor-pointer text-sm font-medium"
                >
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-destructive hover:bg-destructive/10 flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors"
          >
            <X className="size-3.5" />
            Clear
          </button>
        )}

        <div className="text-muted-foreground ml-auto flex shrink-0 items-center gap-2 text-sm font-medium tabular-nums select-none">
          {isFetching && !isFirstLoad && (
            <LoaderCircle className="text-primary size-3.5 animate-spin" />
          )}
          <span>
            {totalCount === 0 ? "No results" : `Showing ${rangeStart}–${rangeEnd} of ${totalCount}`}
          </span>
        </div>

        <Button
          variant="outline"
          onClick={openQuickSale}
          className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 h-9 cursor-pointer gap-2 px-3 text-sm font-medium shadow-none transition-colors"
        >
          <Zap className="size-4" />
          Quick Sale
        </Button>

        <Button
          variant="outline"
          onClick={openAdjust}
          className="hover:bg-muted/60 border-border bg-muted/50 text-foreground h-9 cursor-pointer gap-2 px-3 text-sm font-medium shadow-none transition-colors"
        >
          <Scale className="size-4" />
          Adjust Balance
        </Button>
      </div>

      {isFirstLoad ? (
        <div className="border-border bg-card flex min-h-0 flex-1 items-center justify-center rounded-xl border shadow-xs">
          <div className="flex flex-col items-center gap-3">
            <LoaderCircle className="text-muted-foreground size-7 animate-spin" />
            <p className="text-muted-foreground text-sm font-medium">Loading…</p>
          </div>
        </div>
      ) : isEmpty ? (
        <div className="border-border bg-card flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border px-6 py-16 text-center shadow-xs">
          <span className="bg-muted text-muted-foreground mb-5 flex size-12 items-center justify-center rounded-xl">
            <Scale className="size-6" />
          </span>
          <h3 className="text-foreground text-base font-semibold tracking-[-0.02em]">
            {hasFilters ? "No matches" : "No ledger entries yet"}
          </h3>
          <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">
            {hasFilters
              ? "Try adjusting your type filter."
              : "Sales, payments and adjustments for this customer will appear here."}
          </p>
          {hasFilters && (
            <Button variant="outline" className="mt-5 h-9 cursor-pointer" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="border-border bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-xs">
          <div className={cn("relative min-h-0 flex-1 overflow-auto", isFetching && "opacity-60")}>
            <table className="w-full table-fixed border-collapse">
              <thead className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const meta = header.column.columnDef.meta as TxnTableColMeta | undefined;
                      return (
                        <th
                          key={header.id}
                          className={cn(
                            "text-muted-foreground border-border/70 h-9 border-b px-4 text-xs font-semibold tracking-wide uppercase",
                            meta?.width,
                            meta?.align === TXN_TABLE_ALIGN.RIGHT
                              ? "text-right"
                              : meta?.align === TXN_TABLE_ALIGN.CENTER
                                ? "text-center"
                                : "text-left"
                          )}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row, idx) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: 0.12,
                      ease: "easeOut",
                      delay: idx < 12 ? idx * 0.015 : 0
                    }}
                    className="group border-border/70 hover:bg-accent border-b transition-colors last:border-b-0"
                  >
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as TxnTableColMeta | undefined;
                      return (
                        <td
                          key={cell.id}
                          className={cn(
                            "h-14 px-4 align-middle",
                            meta?.width,
                            meta?.align === TXN_TABLE_ALIGN.RIGHT
                              ? "text-right"
                              : meta?.align === TXN_TABLE_ALIGN.CENTER
                                ? "text-center"
                                : "text-left"
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-border/70 bg-card flex shrink-0 items-center justify-between gap-3 border-t px-4 py-2.5">
            <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tabular-nums">
              <span>Rows</span>
              <Input
                type="number"
                value={pageSizeInput}
                onChange={(e) => setPageSizeInput(e.target.value)}
                onBlur={commitPageSize}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className={LEDGER_NUMBER_INPUT_CLASS}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageNo((p) => Math.max(1, p - 1))}
                    disabled={!canPrev}
                    className="h-8 cursor-pointer gap-1 px-2.5 text-xs font-medium"
                  >
                    <ChevronLeft className="size-3.5" />
                    Prev
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous page</TooltipContent>
              </Tooltip>

              <div className="text-muted-foreground flex items-center gap-1.5 px-1">
                <span>Page</span>
                <Input
                  type="number"
                  value={pageNoInput}
                  onChange={(e) => setPageNoInput(e.target.value)}
                  onBlur={commitPageNo}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  className={LEDGER_NUMBER_INPUT_CLASS}
                />
                <span>
                  of <span className="text-foreground font-medium">{totalPages}</span>
                </span>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageNo((p) => p + 1)}
                    disabled={!canNext}
                    className="h-8 cursor-pointer gap-1 px-2.5 text-xs font-medium"
                  >
                    Next
                    <ChevronRight className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next page</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
