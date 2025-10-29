import { MetricsComponent } from "@/features/dashboard/MetricsComponent";
import { SalesEstimateChart } from "@/features/dashboard/SalesEstimatesChart";
import type { ChartDataPointType } from "@shared/types";

// mockData
const mockChartData: ChartDataPointType[] = [
  { month: "Jan", sales: 120000, estimates: 100000 },
  { month: "Feb", sales: 140000, estimates: 110000 },
  { month: "Mar", sales: 130000, estimates: 120000 },
  { month: "Apr", sales: 160000, estimates: 150000 },
  { month: "May", sales: 170000, estimates: 155000 },
  { month: "Jun", sales: 190000, estimates: 160000 },
  { month: "Jul", sales: 200000, estimates: 180000 },
  { month: "Aug", sales: 210000, estimates: 190000 },
  { month: "Sep", sales: 195000, estimates: 180000 },
  { month: "Oct", sales: 220000, estimates: 200000 },
  { month: "Nov", sales: 210000, estimates: 190000 },
  { month: "Dec", sales: 250000, estimates: 230000 }
];

const HomePage = () => {
  return (
    <div className="bg-background flex h-full flex-col gap-4 overflow-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <MetricsComponent />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <SalesEstimateChart
            data={mockChartData}
            salesPercentageChange={-8.4}
            estimatesPercentageChange={5.7}
          />
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">{/* Top Products */}</div>
      </div>
    </div>
  );
};

export default HomePage;
