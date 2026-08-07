import { Button } from "@/components/ui/button";
import { TransactionDetailsDialog } from "@/features/transactions/TransactionDetailsDialog";
import { TransactionListPanel } from "@/features/transactions/TransactionListPanel";
import { useInfiniteScroll } from "@/features/transactions/hooks/useInfiniteScroll";
import { cn } from "@/lib/utils";
import { useViewModalStore } from "@/features/transactions/store/viewModal.store";
import { DASHBOARD_TYPE, type DashboardType } from "@shared/types";
import { formatRupee } from "@shared/utils/utils";
import { IndianRupee, Plus, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TransactionsScreen = ({ type }: { type: DashboardType }) => {
  const navigate = useNavigate();
  const { totalRevenue, totalTransactions } = useInfiniteScroll(type);
  const isSales = type === DASHBOARD_TYPE.SALES;

  const isViewModalOpen = useViewModalStore((state) => state.isViewModalOpen);
  const transactionId = useViewModalStore((state) => state.transactionId);

  return (
    <div className="bg-background flex h-full flex-1 flex-col overflow-hidden p-3">
      <div className="mb-2 flex shrink-0 items-center gap-2">
        <div className="border-border bg-card flex min-h-11 min-w-0 flex-1 items-center gap-5 rounded-(--radius-panel) border px-3 py-1.5">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-(--radius-control)",
                isSales ? "bg-success/10 text-success" : "bg-info/10 text-info"
              )}
            >
              <IndianRupee className="size-3.5" />
            </span>
            <span className="text-muted-foreground text-xs font-medium">Revenue</span>
            <span className="text-foreground truncate text-base font-semibold tabular-nums">
              {formatRupee(totalRevenue ?? 0)}
            </span>
          </div>
          <div className="bg-border h-5 w-px shrink-0" />
          <div className="flex min-w-0 items-center gap-2">
            <span className="bg-secondary text-secondary-foreground flex size-7 shrink-0 items-center justify-center rounded-(--radius-control)">
              <ShoppingCart className="size-3.5" />
            </span>
            <span className="text-muted-foreground text-xs font-medium">Transactions</span>
            <span className="text-foreground text-base font-semibold tabular-nums">
              {totalTransactions}
            </span>
          </div>
        </div>

        <Button
          onClick={() => navigate(isSales ? "/billing/sales/create" : "/billing/estimates/create")}
          className={cn(
            "h-9 cursor-pointer gap-1.5 px-3",
            isSales ? "hover:bg-primary-hover" : "bg-info text-info-foreground hover:bg-info/90"
          )}
        >
          <Plus className="size-4" />
          {isSales ? "New Sale" : "New Estimate"}
        </Button>
      </div>

      <TransactionListPanel />
      {isViewModalOpen && <TransactionDetailsDialog type={type} id={transactionId} />}
    </div>
  );
};

export default TransactionsScreen;
