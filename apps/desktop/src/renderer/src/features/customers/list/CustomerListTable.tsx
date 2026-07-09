import { cn } from "@/lib/utils";
import type { Virtualizer } from "@tanstack/react-virtual";
import { LoaderCircle, Users } from "lucide-react";
import { useMemo } from "react";
import type { CustomerListRow } from "./types";

type CustomerListTableProps = {
  rows: CustomerListRow[];
  parentRef: React.RefObject<HTMLDivElement | null>;
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  hasNextPage: boolean;
  onRowClick: (row: CustomerListRow) => void;
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
  parentRef,
  rowVirtualizer,
  hasNextPage,
  onRowClick
}: CustomerListTableProps) {
  const virtualItems = rowVirtualizer.getVirtualItems();

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

  return (
    <div className="bg-card border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-xs">
      <div className="bg-muted text-muted-foreground grid grid-cols-11 items-center gap-2 px-4 py-2 text-xs font-medium tracking-wide uppercase">
        {colInfo.map((c, i) => (
          <div key={i} className={cn("flex", c.span, c.align)}>
            {c.label}
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <span className="bg-muted text-muted-foreground mb-5 flex size-12 items-center justify-center rounded-xl">
            <Users className="size-6" />
          </span>
          <h3 className="text-foreground text-base font-semibold tracking-[-0.02em]">
            No customers found
          </h3>
          <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">
            Try adjusting your search or type filter.
          </p>
        </div>
      ) : (
        <div ref={parentRef} className="min-h-0 flex-1 overflow-auto scroll-smooth">
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
                        <div className="flex items-center justify-center py-4">
                          <LoaderCircle className="text-muted-foreground size-5 animate-spin" />
                        </div>
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
        </div>
      )}
    </div>
  );
}
