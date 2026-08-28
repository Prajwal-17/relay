import { DashboardMetrics } from "@/features/analytics/DashboardMetrics";
// import { RecentTransactionsTable } from "@/features/analytics/RecentTransactionsTable";
import { SalesEstimatesChart } from "@/features/analytics/SalesEstimatesChart";
import { TopProductsChart } from "@/features/analytics/TopProductsChart";

const HomePage = () => {
  return (
    <div className="linear-light bg-background flex min-h-full flex-col gap-3 px-4 py-3">
      <DashboardMetrics />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <SalesEstimatesChart />
        </div>

        <div className="flex flex-col gap-3 lg:col-span-2">
          <TopProductsChart />
        </div>
      </div>
      {/*<RecentTransactionsTable />*/}
    </div>
  );
};

export default HomePage;
