import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SaleSummaryType } from "@shared/types";
import { formatDateStrToISTDateStr } from "@shared/utils/dateUtils";
import { IndianRupees } from "@shared/utils/utils";
import { Edit, LoaderCircle, MoreVertical, Trash2 } from "lucide-react";
import { memo, useCallback } from "react";

const DashboardTableRow = memo(
  ({
    transaction,
    isLoaderRow,
    pathname,
    handleDeleteSale,
    handleDeleteEstimate,
    hasNextPage
  }: {
    transaction: SaleSummaryType;
    isLoaderRow: boolean;
    pathname: string;
    handleDeleteSale: (saleId: string) => void;
    handleDeleteEstimate: (estimateId: string) => void;
    hasNextPage: boolean;
  }) => {
    const handleDelete = useCallback(
      (id: string) => {
        if (pathname === "/sale") {
          handleDeleteSale(id);
        } else {
          handleDeleteEstimate(id);
        }
      },
      [pathname, handleDeleteSale, handleDeleteEstimate]
    );

    return (
      <>
        <div>
          {isLoaderRow ? (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              {hasNextPage ? (
                <div className="my-8 flex justify-center gap-3">
                  <div className="text-muted-foreground text-xl font-semibold">Loading</div>
                  <LoaderCircle className="text-primary animate-spin" size={26} />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="hover:bg-muted/60 border-border/50 grid grid-cols-12 gap-4 border-b px-6 py-2 text-lg">
              <div className="col-span-2 flex flex-col items-start justify-start font-medium">
                <span className="text-xl font-semibold">
                  {transaction.createdAt
                    ? formatDateStrToISTDateStr(transaction.createdAt).fullDate
                    : "-"}
                </span>
                <span className="text-muted-foreground text-base">
                  {transaction.createdAt
                    ? formatDateStrToISTDateStr(transaction.createdAt).timePart
                    : "-"}
                </span>
              </div>
              <div className="col-span-3 flex items-center gap-2 truncate font-medium">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-200">
                  {transaction.customerName.charAt(0)}
                </div>
                <span>{transaction.customerName}</span>
              </div>
              <div className="text-muted-foreground col-span-2 flex items-center font-medium">
                # {transaction.invoiceNo}
              </div>
              <div className="col-span-2 flex items-center font-semibold">
                {transaction.grandTotal ? IndianRupees.format(transaction.grandTotal) : "-"}
              </div>
              <div className="col-span-2 flex items-center">
                {transaction.isPaid ? (
                  <Badge className="bg-success/10 text-success border-success/20 text-sm">
                    Paid
                  </Badge>
                ) : (
                  <Badge className="border-destructive/20 bg-destructive/10 text-destructive text-sm">
                    Unpaid
                  </Badge>
                )}
              </div>
              <div className="col-span-1 flex items-center justify-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDelete(transaction.id)}
                >
                  <Trash2 size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }
);

DashboardTableRow.displayName = "DashboardTableRow";

export default DashboardTableRow;
