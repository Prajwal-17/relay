import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { LoaderCircle, Plus, Users } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import type { CustomerListRow } from "./types";

type CustomerListTableProps = {
  rows: CustomerListRow[];
  hasNextPage: boolean;
  hasFilters: boolean;
  status: "pending" | "success" | "error";
  isFetchingNextPage: boolean;
  isFetching: boolean;
  isPlaceholderData: boolean;
  fetchNextPage: () => void;
  onRowClick: (row: CustomerListRow) => void;
  clearFilters: () => void;
  onNewCustomer: () => void;
};

import {
  renderLastPurchaseAmtCell,
  renderLastPurchaseAtCell,
  renderNameCell,
  renderOutstandingCell,
  renderTypeCell
} from "./columns";

export function CustomerListTable({
  rows,
  hasNextPage,
  hasFilters,
  status,
  isFetchingNextPage,
  isFetching,
  isPlaceholderData,
  fetchNextPage,
  onRowClick,
  clearFilters,
  onNewCustomer
}: CustomerListTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? rows.length + 1 : rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];

    if (!lastItem) return;
    if (isPlaceholderData) return;

    if (lastItem.index >= rows.length - 1 && hasNextPage && !isFetchingNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isPlaceholderData,
    fetchNextPage,
    rows.length,
    virtualItems
  ]);

  const colInfo = useMemo(
    () => [
      { span: "col-span-3", align: "", label: "NAME" },
      { span: "col-span-2", align: "", label: "TYPE" },
      { span: "col-span-2", align: "justify-end", label: "OUTSTANDING" },
      { span: "col-span-2", align: "justify-end", label: "LAST PURCHASE AT" },
      { span: "col-span-2", align: "justify-end", label: "LAST PURCHASE AMT" }
    ],
    []
  );

  const isEmpty = status === "success" && rows.length === 0;

  return (
    <div className="bg-card border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-xs">
      <div className="bg-muted text-muted-foreground grid grid-cols-11 items-center gap-2 px-4 py-2 text-xs font-medium tracking-wide uppercase">
        {colInfo.map((c, i) => (
          <div key={i} className={cn("flex", c.span, c.align)}>
            {c.label}
          </div>
        ))}
      </div>

      <div ref={parentRef} className="relative min-h-0 flex-1 overflow-auto overscroll-contain">
        {isFetching && isPlaceholderData ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center pt-24">
            <div className="flex flex-col items-center gap-3">
              <LoaderCircle className="text-muted-foreground size-8 animate-spin" />
              <p className="text-muted-foreground text-sm">Updating results…</p>
            </div>
          </div>
        ) : null}
        {status === "error" ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center px-6 text-center">
            <div className="text-destructive flex flex-col items-center gap-3">
              <span className="text-2xl font-semibold">Something went wrong</span>
              <p className="text-muted-foreground text-sm">
                Failed to load customers. Please try again.
              </p>
              <Button variant="outline" className="mt-2 h-9 cursor-pointer" onClick={clearFilters}>
                Retry
              </Button>
            </div>
          </div>
        ) : status === "pending" ? (
          <div className="flex h-full min-h-48 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <LoaderCircle className="text-muted-foreground size-8 animate-spin" />
              <p className="text-muted-foreground text-sm">Loading customers…</p>
            </div>
          </div>
        ) : isEmpty ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center px-6 py-16 text-center">
            <span className="bg-muted text-muted-foreground mb-5 flex size-12 items-center justify-center rounded-xl">
              <Users className="size-6" />
            </span>
            <h3 className="text-foreground text-base font-semibold">
              {hasFilters ? "No customers found" : "No customers yet"}
            </h3>
            <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">
              {hasFilters
                ? "Try adjusting your search or filters."
                : "Get started by adding your first customer."}
            </p>
            {hasFilters ? (
              <Button variant="outline" className="mt-5 h-9 cursor-pointer" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button
                className="hover:bg-primary-hover mt-5 h-9 cursor-pointer"
                onClick={onNewCustomer}
              >
                <Plus className="size-4" />
                New Customer
              </Button>
            )}
          </div>
        ) : (
          <>
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative"
              }}
            >
              <div
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualItems[0]?.start ?? 0}px)`
                }}
              >
                {virtualItems.map((virtualRow) => {
                  const isLoaderRow = virtualRow.index > rows.length - 1;
                  const row = rows[virtualRow.index];

                  if (!row) {
                    if (isLoaderRow && hasNextPage) {
                      return (
                        <div key={virtualRow.key} data-index={virtualRow.index}>
                          {isFetchingNextPage ? (
                            <div className="flex items-center justify-center py-4">
                              <LoaderCircle className="text-muted-foreground size-5 animate-spin" />
                              <span className="text-muted-foreground ml-2 text-xs">
                                Loading more…
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-4">
                              <span className="text-muted-foreground text-xs">Scroll for more</span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }

                  return (
                    <div
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                    >
                      <button
                        type="button"
                        onClick={() => onRowClick(row)}
                        className={cn(
                          "border-border/70 hover:bg-accent w-full border-b text-left transition-colors",
                          "grid cursor-pointer grid-cols-11 items-center gap-2 px-4 py-2.5",
                          "last:border-b-0"
                        )}
                      >
                        <div className="col-span-3 flex min-w-0">{renderNameCell(row)}</div>
                        <div className="col-span-2 flex">{renderTypeCell(row)}</div>
                        <div className="col-span-2 flex justify-end">
                          {renderOutstandingCell(row)}
                        </div>
                        <div className="col-span-2 flex justify-end">
                          {renderLastPurchaseAtCell(row)}
                        </div>
                        <div className="col-span-2 flex justify-end">
                          {renderLastPurchaseAmtCell(row)}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {!hasNextPage && rows.length > 0 && (
              <div className="text-muted-foreground flex flex-col items-center py-4 text-center">
                <span className="text-sm font-medium">No more customers</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
