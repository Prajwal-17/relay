import { useDashboard } from "@/hooks/dashboard/useDashboard";
import { useInfiniteScroll } from "@/hooks/dashboard/useInfiniteScroll";
import type { SaleSummaryType } from "@shared/types";
import { LoaderCircle } from "lucide-react";
import DashboardTableRow from "./DashboardTableRow";

export const DashboardTable = () => {
  const { pathname, sales, estimates, handleDeleteSale, handleDeleteEstimate } = useDashboard();
  const { parentRef, rowVirtualizer, status, hasNextPage, transactionData } = useInfiniteScroll();

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="text-foreground pb-2 pl-1">
        {pathname === "/sale"
          ? `Showing ${sales.length || 0} results`
          : `Showing ${estimates.length || 0} results`}
      </div>

      {status === "pending" ? (
        <div className="my-8 flex flex-1 items-center justify-center gap-3">
          <div className="text-muted-foreground text-lg font-semibold">Loading</div>
          <LoaderCircle className="text-primary animate-spin" size={24} />
        </div>
      ) : (
        <>
          <div className="border-border/60 flex min-h-0 flex-1 flex-col rounded-lg border">
            <div className="bg-muted text-muted-foreground grid grid-cols-12 gap-4 px-4 py-2 text-base font-semibold">
              <div className="col-span-2 flex items-center">Date</div>
              <div className="col-span-3 flex items-center">Customer Name</div>
              <div className="col-span-2 flex items-center">Invoice No</div>
              <div className="col-span-2 flex items-center">Amount</div>
              <div className="col-span-2 flex items-center">Status</div>
              <div className="col-span-1 flex items-center justify-start">Actions</div>
            </div>

            <div ref={parentRef} className="flex-1 overflow-auto scroll-smooth">
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
                    const isLoaderRow = virtualRow.index > transactionData.length - 1;
                    const transaction: SaleSummaryType = transactionData[virtualRow.index];

                    return (
                      <div
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                      >
                        <DashboardTableRow
                          transaction={transaction}
                          isLoaderRow={isLoaderRow}
                          pathname={pathname}
                          handleDeleteSale={handleDeleteSale}
                          handleDeleteEstimate={handleDeleteEstimate}
                          hasNextPage={hasNextPage}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
