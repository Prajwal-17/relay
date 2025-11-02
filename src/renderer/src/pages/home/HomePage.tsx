import { MetricsComponent } from "@/features/dashboard/MetricsComponent";

const HomePage = () => {
  return (
    <div className="bg-background flex h-full flex-col gap-6 overflow-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <MetricsComponent />
    </div>
  );
};

export default HomePage;
