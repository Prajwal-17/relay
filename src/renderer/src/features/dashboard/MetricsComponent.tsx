import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { MetricCard } from "./MetricCard";
import { StatCard } from "./StatCard";

const statsData = [
  { label: "Total Products", value: "3,452" },
  { label: "Total Customers", value: "1,287" },
  { label: "Total Sales", value: "$45,890" },
  { label: "Total Estimates", value: "972" }
];

const fetchMetrics = async () => {
  try {
    console.log("here");
    const response = await window.dashboardApi.getMetricsSummary();
    console.log(response);
    return response;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export const MetricsComponent = () => {
  const { data } = useQuery({
    queryKey: ["today-sales"],
    queryFn: () => fetchMetrics()
  });
  useEffect(() => {
    console.log(data);
  }, [data]);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <MetricCard label="Today's Sales" value="23,444" href="/settings" changePercent={-0.04} />
        <MetricCard
          label="Today's Estimates"
          value="34,344"
          href="/settings"
          changePercent={4.34}
        />
        <div className="col-span-2 grid grid-cols-2 grid-rows-2 gap-3">
          {statsData.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </div>
      </div>
    </>
  );
};
