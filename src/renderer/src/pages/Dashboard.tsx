import { Button } from "@/components/ui/button";
import { DashboardTable } from "@/features/transactionDashboard/DashboardTable";
import { useDashboard } from "@/hooks/dashboard/useDashboard";
import { formatToRupees, IndianRupees } from "@shared/utils/utils";
import { IndianRupee, Plus, ShoppingCart } from "lucide-react";

const Dashboard = () => {
  const { pathname, navigate, sales, estimates, calculateSalesTotal, calculateEstimatesTotal } =
    useDashboard();

  return (
    <>
      <div className="bg-background h-full flex-1 space-y-4 overflow-y-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">
              {pathname === "/sale" ? "Sales Overview" : "Estimates Overview"}
            </h1>
            <p className="text-muted-foreground text-lg">
              {pathname === "/sale"
                ? "Search, filter, and view a complete history of sales."
                : "Search, filter, and view a complete history of estimates."}
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => {
              pathname === "/sale" ? navigate("/sales/new") : navigate("/estimates/new");
            }}
            className="hover:bg-primary/80 h-12 cursor-pointer gap-2 px-6 py-3 text-lg font-medium shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            {pathname === "/sale" ? "New Sale" : "New Estimate"}
          </Button>
        </div>

        <div className="border-border bg-card mb-6 flex items-center gap-6 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <div className="bg-success/20 flex h-10 w-10 items-center justify-center rounded-lg">
              <IndianRupee className="text-success h-5 w-5" />
            </div>
            <span className="text-muted-foreground text-lg font-medium">Revenue:</span>
            <span className="text-2xl font-bold">
              {pathname === "/sale"
                ? `${IndianRupees.format(formatToRupees(calculateSalesTotal))}`
                : `${IndianRupees.format(formatToRupees(calculateEstimatesTotal))}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-secondary/90 flex h-10 w-10 items-center justify-center rounded-lg">
              <ShoppingCart className="text-secondary-foreground h-5 w-5" />
            </div>
            <span className="text-muted-foreground text-lg font-medium">Total Transactions:</span>
            <span className="text-2xl font-bold">
              {pathname === "/sale" ? `${sales.length || 0}` : `${estimates.length || 0}`}
            </span>
          </div>
        </div>

        <DashboardTable />
      </div>
    </>
  );
};

export default Dashboard;
