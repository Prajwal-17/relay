import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/features/transactionDashboard/DashboardCard";
import { useDashboard } from "@/hooks/dashboard/useDashboard";
import { useInfiniteScroll } from "@/hooks/dashboard/useInfiniteScroll";
import { DASHBOARD_TYPE } from "@shared/types";
import { IndianRupees } from "@shared/utils/utils";
import { IndianRupee, Plus, ShoppingCart } from "lucide-react";

const Dashboard = ({ type }: { type: string }) => {
  const { navigate } = useDashboard();

  const { totalRevenue, totalTransactions } = useInfiniteScroll(type);

  const isSales = type === DASHBOARD_TYPE.SALES;

  return (
    <>
      <div className="bg-background flex h-full flex-1 flex-col overflow-hidden px-6 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">
              {isSales ? "Sales Overview" : "Estimates Overview"}
            </h1>
            <p className="text-muted-foreground text-lg">
              {isSales
                ? "Search, filter, and view a complete history of sales."
                : "Search, filter, and view a complete history of estimates."}
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => {
              isSales ? navigate("/sales/new") : navigate("/estimates/new");
            }}
            className="hover:bg-primary/80 h-12 cursor-pointer gap-2 px-6 py-3 text-lg font-medium shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            {isSales ? "New Sale" : "New Estimate"}
          </Button>
        </div>

        <div className="bg-card mb-3 flex items-center gap-6 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <div className="bg-success/20 flex h-10 w-10 items-center justify-center rounded-lg">
              <IndianRupee className="text-success h-5 w-5" />
            </div>
            <span className="text-muted-foreground text-lg font-medium">Revenue:</span>
            <span className="text-2xl font-bold">
              {totalRevenue && IndianRupees.format(totalRevenue)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-secondary/90 flex h-10 w-10 items-center justify-center rounded-lg">
              <ShoppingCart className="text-secondary-foreground h-5 w-5" />
            </div>
            <span className="text-muted-foreground text-lg font-medium">Total Transactions:</span>
            <span className="text-2xl font-bold">{totalTransactions}</span>
          </div>
        </div>

        <DashboardCard />
      </div>
    </>
  );
};

export default Dashboard;
