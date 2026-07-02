import { Card, CardContent } from "@/components/ui/card";
import { apiClient } from "@/lib/apiClient";
import type { MetricsSummary } from "@shared/types";
import { formatToRupees } from "@shared/utils/utils";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { MetricCard } from "./MetricCard";
import { StatCard } from "./StatCard";

export const MetricsComponent = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["metrics-summary"],
    queryFn: () => apiClient.get<MetricsSummary>("api/dashboard/summary")
  });

  useEffect(() => {
    if (isError) {
      toast.error(error.message);
    }
  }, [isError, error]);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {isLoading ? (
          <Card className="bg-background flex h-full items-center justify-center border shadow-sm hover:shadow-xl">
            <CardContent className="py-0">
              <LoaderCircle className="text-primary animate-spin" size={26} />
            </CardContent>
          </Card>
        ) : (
          data && (
            <MetricCard
              label="Today's Sales"
              value={formatToRupees(data.sales.today)}
              href="/dashboard/sales"
              changePercent={data.sales.changePercent}
              trend={data.sales.trend}
            />
          )
        )}

        {isLoading ? (
          <Card className="bg-background flex h-full items-center justify-center border shadow-sm hover:shadow-xl">
            <CardContent className="py-0">
              <LoaderCircle className="text-primary animate-spin" size={26} />
            </CardContent>
          </Card>
        ) : (
          data && (
            <MetricCard
              label="Today's Estimates"
              value={formatToRupees(data.estimates.today)}
              href="/dashboard/estimates"
              changePercent={data.estimates.changePercent}
              trend={data.estimates.trend}
            />
          )
        )}

        {isLoading ? (
          <Card className="bg-background col-span-2 grid grid-cols-2 grid-rows-2 items-center justify-center border shadow-sm hover:shadow-xl">
            <CardContent className="col-span-2 row-span-2 flex h-full w-full items-center justify-center py-0">
              <LoaderCircle className="text-primary animate-spin" size={26} />
            </CardContent>
          </Card>
        ) : (
          data && (
            <div className="col-span-2 grid grid-cols-2 grid-rows-2 gap-3">
              <StatCard label="Total Products" value={data.counts.products} />
              <StatCard label="Total Customers" value={data.counts.customers} />
              <StatCard label="Total Sales" value={data.counts.sales} />
              <StatCard label="Total Estimates" value={data.counts.estimates} />
            </div>
          )
        )}
      </div>
    </>
  );
};
