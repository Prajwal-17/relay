import { useDashboard } from "@/features/transactions/hooks/useDashboard";
import { useInfiniteScroll } from "@/features/transactions/hooks/useInfiniteScroll";
import { useViewModalStore } from "@/features/transactions/store/viewModal.store";
import { DASHBOARD_TYPE, type DashboardType } from "@shared/types";
import { LoaderCircle, ReceiptIndianRupee } from "lucide-react";
import { useParams } from "react-router-dom";
import TransactionTableRow from "./TransactionTableRow";

export const TransactionTable = () => {
  const { deleteMutation, convertMutation, duplicateMutation } = useDashboard();
  const { type } = useParams();
  const { parentRef, rowVirtualizer, status, hasNextPage, transactionData, totalTransactions } =
    useInfiniteScroll(type as DashboardType);
  const setIsViewModalOpen = useViewModalStore((state) => state.setIsViewModalOpen);
  const setTransactionId = useViewModalStore((state) => state.setTransactionId);

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="text-muted-foreground pb-1.5 pl-1 text-xs font-medium">
          Showing <span className="text-foreground font-medium">{totalTransactions}</span> results
        </div>

        {status === "pending" ? (
          <div className="bg-card border-border flex min-h-48 flex-1 items-center justify-center rounded-(--radius-panel) border">
            <div className="flex flex-col items-center gap-3">
              <LoaderCircle className="text-muted-foreground size-8 animate-spin" />
              <p className="text-muted-foreground text-sm">Loading transactions…</p>
            </div>
          </div>
        ) : (
          <div className="bg-card border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-(--radius-panel) border">
            <div className="bg-muted text-muted-foreground border-border grid h-9 grid-cols-12 items-center gap-2 border-b px-3 text-xs font-semibold tracking-wide uppercase">
              <div className="col-span-2 flex items-center">Date</div>
              <div className="col-span-3 flex items-center">Customer</div>
              <div className="col-span-2 flex items-center">
                {type === DASHBOARD_TYPE.SALES
                  ? "Invoice No"
                  : type === DASHBOARD_TYPE.ESTIMATES
                    ? "Estimate No"
                    : "Transaction No"}
              </div>
              <div className="col-span-3 flex items-center">Amount</div>
              <div className="col-span-2 flex items-center justify-center">Actions</div>
            </div>

            {transactionData.length > 0 ? (
              <div ref={parentRef} className="min-h-0 flex-1 overflow-auto overscroll-contain">
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
                      const transaction = transactionData[virtualRow.index];

                      if (!transaction) return null;
                      return (
                        <div
                          key={virtualRow.key}
                          data-index={virtualRow.index}
                          ref={rowVirtualizer.measureElement}
                        >
                          <TransactionTableRow
                            pathname={type as DashboardType}
                            transaction={transaction}
                            isLoaderRow={isLoaderRow}
                            deleteMutation={deleteMutation}
                            convertMutation={convertMutation}
                            duplicateMutation={duplicateMutation}
                            hasNextPage={hasNextPage}
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
              <div className="flex h-full min-h-48 flex-col items-center justify-center px-6 py-16 text-center">
                <span className="bg-muted text-muted-foreground mb-5 flex size-12 items-center justify-center rounded-xl">
                  <ReceiptIndianRupee className="size-6" />
                </span>
                <h3 className="text-foreground text-base font-semibold">No transactions found</h3>
                <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">
                  Try adjusting your filters or date range.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
