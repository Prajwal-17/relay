import { MetricsComponent } from "@/features/dashboard/MetricsComponent";
import { SalesEstimateChart } from "@/features/dashboard/SalesEstimatesChart";

const HomePage = () => {
  return (
    <div className="bg-background flex h-full flex-col gap-4 overflow-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <MetricsComponent />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <SalesEstimateChart />
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">{/* Top Products */}</div>
      </div>
    </div>
  );
};

export default HomePage;
