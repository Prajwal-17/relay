import { ErrorState } from "@/components/app-ui/ErrorState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
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
import { Label } from "@/components/ui/label";
import {
  LEDGER_SORT_OPTIONS,
  LEDGER_TABLE_PAGE_SIZE,
  LEDGER_TYPE_OPTIONS
} from "@/constants/renderer.constants";
import { useCustomerLedger } from "@/features/customers/hooks/useCustomerLedger";
import { useDeleteLedgerEntry } from "@/features/customers/hooks/useLedgerMutations";
import { useViewModalStore } from "@/features/transactions/store/viewModal.store";
import { cn } from "@/lib/utils";
import { TXN_TABLE_ALIGN, type TxnTableColMeta } from "@/types/renderer.types";
import {
  LEDGER_ENTRY_TYPE,
  LEDGER_SORT,
  LEDGER_TYPE_FILTER,
  type LedgerEntry,
  type LedgerSort,
  type LedgerTypeFilter
} from "@shared/types";
import { formatDateStrToISTDateStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import { flexRender, getCoreRowModel, useReactTable, type Row } from "@tanstack/react-table";
import {
  ArrowDownAZ,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Search,
  Tags,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EditLedgerDialog } from "../../dialogs/EditLedgerDialog";
import { buildLedgerColumns } from "./LedgerColumns";
import { getLedgerMonthGroup, getLedgerMovement, getLedgerParticulars } from "./ledgerPresentation";

const LEDGER_NUMBER_INPUT_CLASS =
  "h-7 w-14 border-border bg-background text-center text-sm font-medium tabular-nums shadow-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus-visible:bg-background";

type LedgerMonthRowGroup = {
  key: string;
  label: string;
  rows: Row<LedgerEntry>[];
};

function groupLedgerRowsByMonth(rows: Row<LedgerEntry>[]) {
  return rows.reduce<LedgerMonthRowGroup[]>((groups, row) => {
    const month = getLedgerMonthGroup(row.original.createdAt);
    const currentGroup = groups.at(-1);

    if (currentGroup?.key === month.key) {
      currentGroup.rows.push(row);
      return groups;
    }

    groups.push({ ...month, rows: [row] });
    return groups;
  }, []);
}

function getDeleteEntryCopy(entry: LedgerEntry) {
  const { label } = getLedgerParticulars(entry);
  const { fullDate } = formatDateStrToISTDateStr(entry.createdAt);
  const amount = formatRupee(Math.abs(getLedgerMovement(entry)));
  const timing = entry.type === LEDGER_ENTRY_TYPE.PAYMENT ? "received" : "recorded";

  return {
    title: "Delete " + label.toLowerCase() + "?",
    description:
      "Delete the " +
      label.toLowerCase() +
      " of " +
      amount +
      " " +
      timing +
      " on " +
      fullDate +
      "? This permanently removes it and cannot be undone."
  };
}

export type LedgerTableProps = {
  customerId: string;
};

export function LedgerTable({ customerId }: LedgerTableProps) {
  const setIsViewModalOpen = useViewModalStore((state) => state.setIsViewModalOpen);
  const setTransactionId = useViewModalStore((state) => state.setTransactionId);

  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(LEDGER_TABLE_PAGE_SIZE);
  const [typeFilter, setTypeFilter] = useState<LedgerTypeFilter>(LEDGER_TYPE_FILTER.ALL);
  const [sortValue, setSortValue] = useState<LedgerSort>(LEDGER_SORT.DATE_DESC);
  const [prototypeSearch, setPrototypeSearch] = useState("");

  const [pageSizeInput, setPageSizeInput] = useState(String(LEDGER_TABLE_PAGE_SIZE));
  const [pageNoInput, setPageNoInput] = useState("1");
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<LedgerEntry | null>(null);

  const { entries, totalCount, status, isFetching, isError, error, refetch } = useCustomerLedger({
    customerId,
    pageNo,
    pageSize,
    search: "",
    type: typeFilter,
    sort: sortValue
  });

  const deleteEntry = useDeleteLedgerEntry(customerId);

  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);
  const canPrevPage = pageNo > 1;
  const canNextPage = pageNo * pageSize < totalCount;
  const rangeStart = totalCount === 0 ? 0 : (pageNo - 1) * pageSize + 1;
  const rangeEnd = Math.min(pageNo * pageSize, totalCount);

  const openSale = useCallback(
    (saleId: string) => {
      setTransactionId(saleId);
      setIsViewModalOpen(true);
    },
    [setIsViewModalOpen, setTransactionId]
  );

  const editEntry = useCallback((entry: LedgerEntry) => setEditingEntry(entry), []);

  const columns = useMemo(
    () =>
      buildLedgerColumns({
        onOpenSale: openSale,
        onEdit: editEntry,
        onDelete: setDeletingEntry
      }),
    [editEntry, openSale]
  );

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel()
  });
  const monthGroups = groupLedgerRowsByMonth(table.getRowModel().rows);

  useEffect(() => {
    if (!isFetching && entries.length === 0 && totalCount > 0 && pageNo > 1) {
      setPageNo(Math.max(1, Math.ceil(totalCount / pageSize)));
    }
  }, [entries.length, isFetching, pageNo, pageSize, totalCount]);

  useEffect(() => setPageSizeInput(String(pageSize)), [pageSize]);
  useEffect(() => setPageNoInput(String(pageNo)), [pageNo]);

  const applyType = (type: LedgerTypeFilter) => {
    setTypeFilter(type);
    setPageNo(1);
  };

  const applySort = (sort: LedgerSort) => {
    setSortValue(sort);
    setPageNo(1);
  };

  const commitPageSize = () => {
    const parsed = Number.parseInt(pageSizeInput, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      setPageSizeInput(String(pageSize));
      return;
    }
    setPageSize(Math.min(Math.max(parsed, 1), 100));
    setPageNo(1);
  };

  const changePage = (nextPage: number) => {
    setPageNo(nextPage);
  };

  const commitPageNo = () => {
    if (totalPages === 0) return;
    const parsed = Number.parseInt(pageNoInput, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      setPageNoInput(String(pageNo));
      return;
    }
    changePage(Math.min(Math.max(parsed, 1), totalPages));
  };

  const clearControls = () => {
    if (typeFilter !== LEDGER_TYPE_FILTER.ALL) {
      setPageNo(1);
    }
    setTypeFilter(LEDGER_TYPE_FILTER.ALL);
    setPrototypeSearch("");
  };

  const activeSortLabel =
    LEDGER_SORT_OPTIONS.find((option) => option.value === sortValue)?.label ?? "Sort";
  const activeType = LEDGER_TYPE_OPTIONS.find((option) => option.value === typeFilter)!;
  const hasRealFilter = typeFilter !== LEDGER_TYPE_FILTER.ALL;
  const hasClearableControl = hasRealFilter || prototypeSearch.length > 0;
  const isFirstLoad = status === "pending" && entries.length === 0;
  const isEmpty = !isFirstLoad && !isError && entries.length === 0;

  return (
    <>
      <section
        aria-label="Customer accounting ledger"
        aria-busy={isFetching}
        className="border-border bg-card flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-(--radius-panel) border"
      >
        <div className="border-frame bg-background flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2.5">
          <div className="relative min-w-[160px] flex-1 sm:max-w-[240px]">
            <Label htmlFor="ledger-search" className="sr-only">
              Search ledger
            </Label>
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              id="ledger-search"
              value={prototypeSearch}
              onChange={(event) => setPrototypeSearch(event.target.value)}
              placeholder="Search ledger…"
              className="h-9 pl-9 shadow-none"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="h-9 gap-2 px-3 shadow-none">
                <Tags className="size-4" />
                Type: {activeType.label}
                <ChevronDown className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Entry type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={typeFilter}
                onValueChange={(value) => applyType(value as LedgerTypeFilter)}
              >
                {LEDGER_TYPE_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="h-9 gap-2 px-3 shadow-none">
                <ArrowDownAZ className="size-4" />
                {activeSortLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel>Sort order</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={sortValue}
                onValueChange={(value) => applySort(value as LedgerSort)}
              >
                {LEDGER_SORT_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {hasClearableControl && (
            <Button type="button" variant="ghost" size="sm" onClick={clearControls}>
              <X className="size-3.5" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {isFirstLoad ? (
            <div aria-label="Loading ledger" className="min-h-0 flex-1 overflow-hidden">
              <div className="border-frame bg-table-header h-8 border-b" />
              {Array.from({ length: 9 }, (_, index) => (
                <div
                  key={index}
                  className="border-border bg-card grid h-11 animate-pulse grid-cols-[128px_minmax(0,1fr)_160px_168px_48px] items-center gap-3 border-b px-3"
                >
                  <span className="bg-muted h-7 w-24 rounded" />
                  <span className="bg-muted h-7 w-36 max-w-full rounded" />
                  <span className="bg-muted ml-auto h-5 w-24 rounded" />
                  <span className="bg-muted ml-auto h-7 w-28 rounded" />
                  <span className="bg-muted ml-auto size-7 rounded" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <ErrorState
              className="min-h-40 flex-1 rounded-none border-0"
              title="Couldn't load the ledger"
              description={
                error instanceof Error
                  ? error.message
                  : "The entries could not be loaded. Try again."
              }
              primaryAction={{
                label: "Try again",
                onClick: () => void refetch(),
                loading: isFetching
              }}
            />
          ) : isEmpty ? (
            <div className="flex min-h-40 flex-1 flex-col items-center justify-center px-6 text-center">
              <p className="text-sm font-semibold">
                {hasRealFilter ? "No entries for this type" : "No ledger entries yet"}
              </p>
              <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                {hasRealFilter
                  ? "Choose another entry type or clear the filter."
                  : "Sales, payments, quick sales, and adjustments will appear here."}
              </p>
              {hasRealFilter && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={clearControls}
                >
                  Clear filter
                </Button>
              )}
            </div>
          ) : (
            <div
              className={cn(
                "min-h-0 flex-1 overflow-y-auto",
                isFetching && "pointer-events-none opacity-60"
              )}
            >
              <table aria-label="Customer accounting ledger entries" className="w-full table-fixed">
                <thead className="bg-table-header sticky top-0 z-20">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const meta = header.column.columnDef.meta as TxnTableColMeta | undefined;
                        return (
                          <th
                            key={header.id}
                            scope="col"
                            className={cn(
                              "text-foreground border-frame h-8 border-b px-3 text-xs font-semibold tracking-wide uppercase",
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
                {monthGroups.map((monthGroup, groupIndex) => (
                  <tbody key={monthGroup.key + "-" + groupIndex}>
                    <tr>
                      <th
                        scope="rowgroup"
                        colSpan={table.getVisibleLeafColumns().length}
                        className="text-foreground border-frame bg-selected sticky top-8 z-10 h-8 border-y px-3 text-left text-sm font-semibold tabular-nums"
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span>{monthGroup.label}</span>
                          <span className="text-muted-foreground text-xs font-medium">
                            {monthGroup.rows.length}{" "}
                            {monthGroup.rows.length === 1 ? "entry" : "entries"}
                          </span>
                        </span>
                      </th>
                    </tr>
                    {monthGroup.rows.map((row) => (
                      <tr
                        key={row.id}
                        className="group border-border bg-card hover:bg-hover border-b transition-colors last:border-b-0"
                      >
                        {row.getVisibleCells().map((cell) => {
                          const meta = cell.column.columnDef.meta as TxnTableColMeta | undefined;
                          return (
                            <td
                              key={cell.id}
                              className={cn(
                                "h-11 min-w-0 px-3 align-middle",
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
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
          )}

          <footer className="border-border bg-card flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t px-3 py-0.5">
            <div
              className="text-muted-foreground mr-auto flex min-w-0 items-center gap-2 text-xs font-medium tabular-nums"
              aria-live="polite"
            >
              {isFetching && <LoaderCircle className="size-3.5 shrink-0 animate-spin" />}
              {isFirstLoad
                ? "Loading entries…"
                : isError
                  ? "Results unavailable"
                  : totalCount === 0
                    ? "No results"
                    : `Showing ${rangeStart}–${rangeEnd} of ${totalCount}`}
            </div>

            <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
              <Label htmlFor="ledger-page-size">Rows</Label>
              <Input
                id="ledger-page-size"
                aria-label="Rows per page"
                type="number"
                value={pageSizeInput}
                onChange={(event) => setPageSizeInput(event.target.value)}
                onBlur={commitPageSize}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
                className={LEDGER_NUMBER_INPUT_CLASS}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => changePage(Math.max(1, pageNo - 1))}
                disabled={!canPrevPage || isFetching}
                aria-label="Previous ledger page"
              >
                <ChevronLeft className="size-3.5" />
                Prev
              </Button>
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Label htmlFor="ledger-page-number">Page</Label>
                <Input
                  id="ledger-page-number"
                  aria-label="Ledger page number"
                  type="number"
                  value={pageNoInput}
                  onChange={(event) => setPageNoInput(event.target.value)}
                  onBlur={commitPageNo}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                  disabled={totalPages === 0 || isFetching}
                  className={LEDGER_NUMBER_INPUT_CLASS}
                />
                <span>
                  of <span className="text-foreground font-medium tabular-nums">{totalPages}</span>
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => changePage(pageNo + 1)}
                disabled={!canNextPage || isFetching}
                aria-label="Next ledger page"
              >
                Next
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </footer>
        </div>
      </section>

      {editingEntry && (
        <EditLedgerDialog
          entry={editingEntry}
          customerId={customerId}
          onClose={() => setEditingEntry(null)}
        />
      )}

      <AlertDialog
        open={deletingEntry !== null}
        onOpenChange={(open) => {
          if (!open && !deleteEntry.isPending) setDeletingEntry(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deletingEntry ? getDeleteEntryCopy(deletingEntry).title : "Delete entry?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletingEntry
                ? getDeleteEntryCopy(deletingEntry).description
                : "This permanently removes the ledger entry and cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteEntry.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/80 text-destructive-foreground"
              disabled={deleteEntry.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (!deletingEntry) return;
                deleteEntry.mutate(deletingEntry.id, {
                  onSuccess: () => {
                    setDeletingEntry(null);
                  }
                });
              }}
            >
              {deleteEntry.isPending ? "Deleting…" : "Delete entry"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
