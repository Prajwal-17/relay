import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UnifiedTransaction } from "@/hooks/dashboard/useInfiniteScroll";
import { formatDateStrToISTDateStr } from "@shared/utils/dateUtils";
import { IndianRupees } from "@shared/utils/utils";
import { Edit, LoaderCircle, MoreVertical, Trash2 } from "lucide-react";
import { memo, useCallback } from "react";

const avatarColorPairs = [
  { bg: "bg-indigo-200", text: "text-indigo-600" },
  { bg: "bg-purple-200", text: "text-purple-600" },
  { bg: "bg-rose-200", text: "text-rose-600" },
  { bg: "bg-teal-200", text: "text-teal-600" },
  { bg: "bg-sky-200", text: "text-sky-600" },
  { bg: "bg-emerald-200", text: "text-emerald-600" },
  { bg: "bg-fuchsia-200", text: "text-fuchsia-600" }
];

const DashboardTableRow = memo(
  ({
    transaction,
    isLoaderRow,
    pathname,
    handleDeleteSale,
    handleDeleteEstimate,
    hasNextPage
  }: {
    transaction: UnifiedTransaction;
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
    const color = avatarColorPairs[Math.floor(Math.random() * avatarColorPairs.length)];

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
              <div className="col-span-3 flex items-center gap-2 font-medium">
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${color.bg} ${color.text}`}
                >
                  {transaction.customerName.charAt(0)}
                </div>
                <span className="truncate">{transaction.customerName}</span>
              </div>

              <div className="text-muted-foreground col-span-2 flex items-center font-medium">
                # {transaction.transactionNo}
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
