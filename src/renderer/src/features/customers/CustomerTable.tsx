import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ViewModal } from "@/features/dashboard/ViewModal";
import useCustomers from "@/hooks/customers/useCustomers";
import { useCustomerTable } from "@/hooks/customers/useCustomerTable";
import { useViewModalStore } from "@/store/viewModalStore";
import { TRANSACTION_TYPE, type TransactionType } from "@shared/types";
import { LoaderCircle, ReceiptIndianRupee } from "lucide-react";
import { useState } from "react";
import CustomerTableRow from "./CustomerTableRow";

export const CustomerTable = ({ customerId }: { customerId: string }) => {
  const [filterType, setFilterType] = useState<TransactionType>(TRANSACTION_TYPE.SALE);
  const { deleteMutation, convertMutation, txnStatusMutation } = useCustomers();
  const { parentRef, rowVirtualizer, status, hasNextPage, transactionData } = useCustomerTable(
    customerId,
    filterType
  );
  const setIsViewModalOpen = useViewModalStore((state) => state.setIsViewModalOpen);
  const setTransactionId = useViewModalStore((state) => state.setTransactionId);
  const isViewModalOpen = useViewModalStore((state) => state.isViewModalOpen);
  const transactionId = useViewModalStore((state) => state.transactionId);

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <>
      <Card className="gap-2 px-0 py-3">
        <CardHeader className="w-full max-w-sm">
          <Tabs
            value={filterType}
            onValueChange={(value) => setFilterType(value as TransactionType)}
          >
            <TabsList className="grid w-full grid-cols-2 rounded-lg bg-slate-100 p-1">
              <TabsTrigger
                value={TRANSACTION_TYPE.SALE}
                className="cursor-pointer data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                Sales
              </TabsTrigger>
              <TabsTrigger
                value={TRANSACTION_TYPE.ESTIMATE}
                className="cursor-pointer data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                Estimates
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {status === "pending" ? (
            <div className="my-8 flex flex-1 justify-center gap-3">
              <span className="text-muted-foreground text-lg font-semibold">Loading</span>
              <LoaderCircle className="text-primary animate-spin" size={24} />
            </div>
          ) : (
            <div className="border-border/60 rounded-lg border shadow-md">
              <div className="bg-muted text-muted-foreground grid grid-cols-9 gap-2 px-4 py-2 text-base font-semibold">
                <div className="col-span-2 flex items-center">Date</div>
                <div className="col-span-2 flex items-center">Transaction No</div>
                <div className="col-span-2 flex items-center">Amount</div>
                <div className="col-span-1 flex items-center">Status</div>
                <div className="col-span-2 flex items-center justify-end">Actions</div>
              </div>

              {transactionData.length > 0 ? (
                <div
                  ref={parentRef}
                  className="max-h-[47vh] overflow-x-hidden overflow-y-auto scroll-smooth"
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
                            <CustomerTableRow
                              type={filterType as TransactionType}
                              transaction={transaction}
                              isLoaderRow={isLoaderRow}
                              deleteMutation={deleteMutation}
                              convertMutation={convertMutation}
                              txnStatusMutation={txnStatusMutation}
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
        </CardContent>
      </Card>

      {isViewModalOpen && transactionId && <ViewModal type={`${filterType}s`} id={transactionId} />}
    </>
  );
};
