import { Button } from "@/components/ui/button";
import { ViewModal } from "@/features/dashboard/ViewModal";
import { DashboardCard } from "@/features/transactionDashboard/DashboardCard";
import { useInfiniteScroll } from "@/hooks/dashboard/useInfiniteScroll";
import { useViewModalStore } from "@/store/viewModalStore";
import { DASHBOARD_TYPE, type DashboardType } from "@shared/types";
import { formatRupee } from "@shared/utils/utils";
import { IndianRupee, Plus, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = ({ type }: { type: DashboardType }) => {
  const navigate = useNavigate();
  const { totalRevenue, totalTransactions } = useInfiniteScroll(type);
  const isSales = type === DASHBOARD_TYPE.SALES;

  const isViewModalOpen = useViewModalStore((state) => state.isViewModalOpen);
  const transactionId = useViewModalStore((state) => state.transactionId);

  return (
    <>
      <div className="bg-background flex h-full flex-1 flex-col overflow-hidden px-6 py-4">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="bg-card flex w-full items-center gap-6 rounded-lg border px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="bg-success/15 text-success flex size-8 items-center justify-center rounded-md">
                <IndianRupee className="size-4" />
              </div>
              <span className="text-muted-foreground text-sm font-medium">Revenue</span>
              <span className="text-foreground text-lg font-semibold tabular-nums">
                {formatRupee(totalRevenue ?? 0)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-secondary text-secondary-foreground flex size-8 items-center justify-center rounded-md">
                <ShoppingCart className="size-4" />
              </div>
              <span className="text-muted-foreground text-sm font-medium">Transactions</span>
              <span className="text-foreground text-lg font-semibold tabular-nums">
                {totalTransactions}
              </span>
            </div>
          </div>

          <Button
            onClick={() => {
              if (isSales) {
                navigate("/billing/sales/create");
              } else {
                navigate("/billing/estimates/create");
              }
            }}
            className="hover:bg-primary-hover cursor-pointer gap-1.5"
          >
            <Plus className="size-4" />
            {isSales ? "New Sale" : "New Estimate"}
          </Button>
        </div>

        <DashboardCard />
        {isViewModalOpen && <ViewModal type={type} id={transactionId} />}
      </div>
    </>
  );
};

export default Dashboard;
