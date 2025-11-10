import { Button } from "@/components/ui/button";
import { useViewModal } from "@/hooks/dashboard/useViewModal";
import { useViewModalStore } from "@/store/viewModalStore";
import {
  DASHBOARD_TYPE,
  type DashboardType,
  type EstimateItemsType,
  type SaleItemsType
} from "@shared/types";
import { formatDateStrToISTDateTimeStr } from "@shared/utils/dateUtils";
import { IndianRupees } from "@shared/utils/utils";
import { CheckCheck, X } from "lucide-react";
import { ItemRow } from "./ItemRow";

export const ViewModal = ({ type, id }: { type: DashboardType; id: string }) => {
  const { data, calcTotalAmount, updateQtyMutation } = useViewModal({
    type,
    id
  });
  const setIsViewModalOpen = useViewModalStore((state) => state.setIsViewModalOpen);

  return (
    <>
      {data && (
        <div className="bg-foreground/50 fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-card flex max-h-[95vh] w-full max-w-6xl flex-col overflow-y-auto rounded-lg shadow-lg">
            <div className="border-border bg-card sticky top-0 flex items-center justify-between border-b px-4 py-4">
              <div>
                <h2 className="text-foreground text-2xl font-bold">
                  {data.type === "sale" ? "Sale" : "Estimate"} Details
                </h2>
                <p className="text-muted-foreground text-lg">
                  {data.type === "sale" ? "Invoice No" : "Estimate No"}
                  <span className="font-bold"> # {data.transactionNo}</span>
                </p>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              <div className="bg-secondary/30 border-border rounded-lg border p-4">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground mb-1 text-sm font-medium tracking-wide uppercase">
                      Customer
                    </p>
                    <p className="text-foreground font-medium">{data.customerName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-sm font-medium tracking-wide uppercase">
                      Created At
                    </p>
                    <p className="text-foreground text-base font-medium">
                      {data.createdAt ? formatDateStrToISTDateTimeStr(data.createdAt) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-sm font-medium tracking-wide uppercase">
                      Updated At
                    </p>
                    <p className="text-foreground text-base font-medium">
                      {data.updatedAt ? formatDateStrToISTDateTimeStr(data.updatedAt) : "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-foreground mb-3 font-semibold">Items</h3>
                <div className="border-border overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary border-border border-b">
                        <th className="text-foreground px-3 py-2 text-left text-lg font-semibold">
                          #
                        </th>
                        <th className="text-foreground px-3 py-2 text-left text-lg font-semibold">
                          Product
                        </th>
                        <th className="text-foreground px-3 py-2 text-center text-lg font-semibold">
                          Qty
                        </th>
                        <th className="text-foreground px-3 py-2 text-right text-lg font-semibold">
                          Price
                        </th>
                        <th className="text-foreground px-3 py-2 text-right text-lg font-semibold">
                          Total
                        </th>
                        <th className="text-foreground w-8 px-3 py-2 text-center font-semibold"></th>
                        <th className="text-foreground px-3 py-2 text-center text-lg font-semibold">
                          Count
                        </th>
                        <th className="text-foreground w-12 px-3 py-2 text-center font-semibold"></th>
                        <th className="text-foreground w-12 px-3 py-2 text-center font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item, index: number) => (
                        <ItemRow
                          key={item.id}
                          item={
                            type === DASHBOARD_TYPE.SALES
                              ? (item as SaleItemsType)
                              : (item as EstimateItemsType)
                          }
                          index={index + 1}
                          type={type}
                          updateQtyMutation={updateQtyMutation}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="border-border bg-secondary/10 sticky bottom-0 w-full border-t px-6 py-4">
              <div className="flex w-full items-center justify-between gap-4">
                <div className="w-80 space-y-0">
                  <div className="flex items-center gap-8 text-right">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground text-lg">Subtotal:</span>
                      <span className="text-foreground text-lg font-semibold">
                        {IndianRupees.format(calcTotalAmount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xl font-medium">Total:</span>
                      <span className="text-foreground text-3xl font-bold">
                        {IndianRupees.format(Math.round(calcTotalAmount))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-start gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setIsViewModalOpen(false)}
                    className="cursor-pointer text-lg"
                  >
                    Close
                  </Button>
                  <Button
                    size="lg"
                    className="bg-success text-success-foreground hover:bg-success/80 cursor-pointer text-lg"
                    // onClick={handleCheckAll}
                  >
                    <CheckCheck className="size-6" />
                    Check All
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
