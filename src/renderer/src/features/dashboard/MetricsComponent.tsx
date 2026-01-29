import { Card, CardContent } from "@/components/ui/card";
import { IndianRupees } from "@shared/utils/utils";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { MetricCard } from "./MetricCard";
import { StatCard } from "./StatCard";

const fetchMetrics = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/dashboard/summary");
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export const MetricsComponent = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["metrics-summary"],
    queryFn: fetchMetrics,
    select: (response) => {
      if (response.status === "success") {
        return response.data;
      } else if (response.status === "error") {
        throw new Error(response.error.message);
      }
      throw new Error("Something went wrong");
    }
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
              value={IndianRupees.format(data.sales.today)}
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
              value={IndianRupees.format(data.estimates.today)}
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
