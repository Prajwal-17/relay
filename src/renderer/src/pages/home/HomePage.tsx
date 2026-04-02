import { MetricsComponent } from "@/features/dashboard/MetricsComponent";
import { RecentActivitiesTable } from "@/features/dashboard/RecentTransactionsTable";
import { SalesEstimateChart } from "@/features/dashboard/SalesEstimatesChart";
import { TopProductsChart } from "@/features/dashboard/TopProductsChart";

const HomePage = () => {
  return (
    <div className="bg-background flex min-h-full flex-col gap-4 px-6 py-6">
      <MetricsComponent />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <SalesEstimateChart />
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <TopProductsChart />
        </div>
      </div>
      <RecentActivitiesTable />
    </div>
  );
};

export default HomePage;
