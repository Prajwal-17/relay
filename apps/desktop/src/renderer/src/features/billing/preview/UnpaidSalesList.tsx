import { Badge } from "@/components/ui/badge";
import { useCustomerTransactions } from "@/hooks/customers/useCustomerTransactions";
import { cn } from "@/lib/utils";
import { CUSTOMER_TXN_SORT, CUSTOMER_TXN_STATUS, TRANSACTION_TYPE } from "@shared/types";
import { formatDateStrToISTDateStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import { LoaderCircle, Receipt } from "lucide-react";

export function UnpaidSalesList({
  customerId,
  excludeId
}: {
  customerId: string;
  excludeId?: string | null;
}) {
  const { transactions, status, isFetching } = useCustomerTransactions({
    customerId,
    type: TRANSACTION_TYPE.SALE,
    pageNo: 1,
    pageSize: 10,
    search: "",
    status: CUSTOMER_TXN_STATUS.UNPAID,
    sort: CUSTOMER_TXN_SORT.DATE_DESC
  });

  const filtered = excludeId ? transactions.filter((t) => t.id !== excludeId) : transactions;
  const isFirstLoad = status === "pending" && transactions.length === 0;

  if (isFirstLoad) {
    return (
      <div className="flex items-center justify-center gap-2 py-6">
        <LoaderCircle className="text-muted-foreground size-4 animate-spin" />
        <span className="text-muted-foreground text-xs font-medium">Loading unpaid sales…</span>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-center">
        <span className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-lg">
          <Receipt className="size-4" />
        </span>
        <p className="text-foreground text-base font-semibold">All settled</p>
        <p className="text-muted-foreground text-sm font-medium">
          No unpaid sales for this customer.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {isFetching && (
        <div className="text-muted-foreground flex items-center justify-end gap-1 text-xs font-medium">
          <LoaderCircle className="size-3 animate-spin" />
          Updating…
        </div>
      )}
      <ul className="divide-border/70 border-border/60 divide-y overflow-hidden rounded-lg border">
        {filtered.map((txn) => {
          const due = (txn.grandTotal ?? 0) - (txn.amountPaid ?? 0);
          const { fullDate } = txn.createdAt
            ? formatDateStrToISTDateStr(txn.createdAt)
            : { fullDate: "—" };
          return (
            <li
              key={txn.id}
              className="bg-card flex items-center justify-between gap-2 px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="bg-destructive/10 text-destructive flex size-7 shrink-0 items-center justify-center rounded-md">
                  <Receipt className="size-4" />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-foreground truncate text-sm font-semibold tabular-nums">
                    #{txn.transactionNo}
                  </span>
                  <span className="text-muted-foreground truncate text-xs font-medium tabular-nums">
                    {fullDate}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <span className="text-foreground text-sm font-semibold tabular-nums">
                  {formatRupee(due)}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "px-1.5 py-0.5 text-xs font-medium",
                    "border-destructive/25 bg-destructive/10 text-destructive"
                  )}
                >
                  Due
                </Badge>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
