import { useDashboard } from "@/hooks/dashboard/useDashboard";
import { useInfiniteScroll } from "@/hooks/dashboard/useInfiniteScroll";
import { useViewModalStore } from "@/store/viewModalStore";
import { DASHBOARD_TYPE, type DashboardType } from "@shared/types";
import { LoaderCircle, ReceiptIndianRupee } from "lucide-react";
import { useParams } from "react-router-dom";
import DashboardTableRow from "./DashboardTableRow";

export const DashboardTable = () => {
  const { deleteMutation, convertMutation } = useDashboard();
  const { type } = useParams();
  const { parentRef, rowVirtualizer, status, hasNextPage, transactionData, totalTransactions } =
    useInfiniteScroll(type as DashboardType);
  const setIsViewModalOpen = useViewModalStore((state) => state.setIsViewModalOpen);
  const setTransactionId = useViewModalStore((state) => state.setTransactionId);

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="text-muted-foreground pb-2 pl-1 font-medium">
          Showing <span className="text-foreground font-medium">{totalTransactions}</span> results
        </div>

        {status === "pending" ? (
          <div className="my-8 flex flex-1 justify-center gap-3">
            <span className="text-muted-foreground text-lg font-semibold">Loading</span>
            <LoaderCircle className="text-primary animate-spin" size={24} />
          </div>
        ) : (
          <div className="border-border/60 rounded-lg border shadow-md">
            <div className="bg-muted text-muted-foreground grid grid-cols-12 gap-4 px-4 py-2 text-base font-semibold">
              <div className="col-span-2 flex items-center">Date</div>
              <div className="col-span-3 flex items-center">Customer Name</div>
              <div className="col-span-2 flex items-center">
                {type === DASHBOARD_TYPE.SALES
                  ? "Invoice No"
                  : type === DASHBOARD_TYPE.ESTIMATES
                    ? "Estimate No"
                    : "Transaction No"}
              </div>
              <div className="col-span-2 flex items-center">Amount</div>
              <div className="col-span-1 flex items-center justify-start">Status</div>
              <div className="col-span-2 flex items-center justify-center">Actions</div>
            </div>

            {transactionData.length > 0 ? (
              <div ref={parentRef} className="max-h-[60vh] overflow-auto scroll-smooth">
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
                          <DashboardTableRow
                            pathname={type as DashboardType}
                            transaction={transaction}
                            isLoaderRow={isLoaderRow}
                            deleteMutation={deleteMutation}
                            convertMutation={convertMutation}
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
              <div className="py-12 text-center">
                <ReceiptIndianRupee className="bg-secondary text-foreground mx-auto mb-6 h-14 w-14 rounded-lg p-2" />
                <p className="text-muted-foreground text-xl font-medium">No transactions found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
