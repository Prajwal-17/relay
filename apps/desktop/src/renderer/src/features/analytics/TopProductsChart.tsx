import {
  CompactCard as Card,
  CompactCardContent as CardContent,
  CompactCardHeader as CardHeader,
  CardTitle
} from "@/components/app-ui/compact-card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { apiClient } from "@/lib/apiClient";
import type { TopProductDataPoint } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { ErrorState } from "@/components/app-ui/ErrorState";
import { LoaderCircle } from "lucide-react";
import { useMemo } from "react";
import { Cell, Legend, Pie, PieChart } from "recharts";

const COLORS = [
  "var(--chart-3)", // Deep Teal
  "var(--chart-4)", // Slate Blue
  "var(--chart-5)", // Muted Orange
  "var(--chart-1)", // Lavender
  "var(--chart-2)" // Green
];

const chartConfig = {
  value: {
    label: "Top Products"
  }
};

export const TopProductsChart = () => {
  const { data, isError, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["getTopProducts"],
    queryFn: () => apiClient.get<TopProductDataPoint[]>("/api/dashboard/top-products")
  });

  const colorizedData = useMemo(() => {
    if (!data) return [];
    return data?.map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length]
    }));
  }, [data]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Top Products</CardTitle>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState
            layout="compact"
            className="h-68"
            title="Top products could not be loaded"
            description="Try loading this chart again."
            primaryAction={{
              label: "Try again",
              onClick: () => void refetch(),
              loading: isFetching
            }}
          />
        ) : isLoading ? (
          <div className="flex flex-1 justify-center gap-2">
            <span className="text-muted-foreground text-sm font-medium">Loading</span>
            <LoaderCircle className="text-primary animate-spin" size={18} />
          </div>
        ) : colorizedData.length === 0 ? (
          <div className="text-muted-foreground flex h-68 items-center justify-center">
            No data available
          </div>
        ) : (
          <>
            {colorizedData.length > 0 && (
              <ChartContainer config={chartConfig} className="h-68 w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={colorizedData}
                    dataKey="sharePercent"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={88}
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {colorizedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill!} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry: any) => `${value} (${entry.payload.value}%)`}
                  />
                </PieChart>
              </ChartContainer>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
