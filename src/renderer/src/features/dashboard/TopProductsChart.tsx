import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { Cell, Legend, Pie, PieChart } from "recharts";

const COLORS = [
  "hsl(190, 45%, 45%)", // Deep Teal (primary)
  "hsl(220, 30%, 55%)", // Slate Blue
  "hsl(30, 40%, 65%)", // Muted Orange
  "hsl(140, 25%, 55%)", // Soft Sage
  "hsl(350, 30%, 65%)" // Dusty Rose
];

const fetchTopProducts = async () => {
  try {
    const response = await window.dashboardApi.getTopProducts();
    return response;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

const chartConfig = {
  value: {
    label: "Top Products"
  }
};

export const TopProductsChart = () => {
  const { data, error, isError, isLoading } = useQuery({
    queryKey: ["getTopProducts"],
    queryFn: fetchTopProducts,
    select: (response) => {
      return response.status === "success" ? response.data : [];
    }
  });

  useEffect(() => {
    if (isError) toast.error(error.message);
  }, [isError, error]);

  const colorizedData = useMemo(() => {
    if (!data) return [];
    return data?.map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length]
    }));
  }, [data]);

  return (
    <Card className="h-full py-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Top Products</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-1 justify-center gap-3">
            <span className="text-muted-foreground text-lg font-semibold">Loading</span>
            <LoaderCircle className="text-primary animate-spin" size={24} />
          </div>
        ) : colorizedData.length === 0 ? (
          <div className="text-muted-foreground flex h-[300px] items-center justify-center">
            No data available
          </div>
        ) : (
          <>
            {colorizedData.length > 0 && (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={colorizedData}
                    dataKey="sharePercent"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
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
