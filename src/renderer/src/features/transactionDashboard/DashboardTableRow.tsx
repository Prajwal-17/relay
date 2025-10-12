import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/hooks/dashboard/useDashboard";
import { useInfiniteScroll } from "@/hooks/dashboard/useInfiniteScroll";
import type { SaleSummaryType } from "@shared/types";
import { formatDateStrToISTDateStr } from "@shared/utils/dateUtils";
import { IndianRupees } from "@shared/utils/utils";
import type { VirtualItem } from "@tanstack/react-virtual";
import { Edit, LoaderCircle, MoreVertical, Trash2 } from "lucide-react";

export const DashboardTableRow = ({
  virtualRow,
  transaction,
  isLoaderRow
}: {
  virtualRow: VirtualItem;
  transaction: SaleSummaryType;
  isLoaderRow: boolean;
}) => {
  const { pathname, handleDeleteSale, handleDeleteEstimate } = useDashboard();
  const { hasNextPage } = useInfiniteScroll();

  const handleDelete = (id: string) => {
    if (pathname === "/sale") {
      handleDeleteSale(id);
    } else {
      handleDeleteEstimate(id);
    }
  };

  return (
    <>
      <div
        key={virtualRow.index}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: `${virtualRow.size}px`,
          transform: `translateY(${virtualRow.start}px)`
        }}
        className="space-y-5"
      >
        {isLoaderRow ? (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            {hasNextPage ? (
              <div className="flex items-center gap-2 text-3xl">
                <LoaderCircle className="animate-spin" size={16} />
                Loading more...
              </div>
            ) : null}
          </div>
        ) : (
          <div className="hover:bg-muted border-border/50 grid grid-cols-12 gap-4 border-b px-6 py-3 text-lg">
            <div className="text-foreground col-span-2 flex items-center font-medium">
              {transaction.createdAt ? formatDateStrToISTDateStr(transaction.createdAt) : "-"}
            </div>
            <div className="text-foreground col-span-3 flex items-center gap-2 truncate font-medium">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-200">
                D
              </div>
              <span>{transaction.customerName || "Walk-in Customer"}</span>
            </div>
            <div className="text-muted-foreground col-span-2 flex items-center font-medium">
              #{transaction.invoiceNo || "-"}
            </div>
            <div className="text-foreground col-span-2 flex items-center font-semibold">
              {transaction.grandTotal ? IndianRupees.format(transaction.grandTotal / 100) : "-"}
            </div>
            <div className="col-span-2 flex items-center">
              {transaction.isPaid ? (
                <Badge className="bg-success/10 text-success border-success/20 text-sm">Paid</Badge>
              ) : (
                <Badge className="border-destructive/20 bg-destructive/10 text-destructive text-sm">
                  Unpaid
                </Badge>
              )}
            </div>
            <div className="col-span-1 flex items-center justify-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8"
              >
                <Edit size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive h-8 w-8"
                onClick={() => handleDelete(transaction.id)}
              >
                <Trash2 size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8"
              >
                <MoreVertical size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
