import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { timePeriodOptions } from "@/constants";
import { TIME_PERIOD, type TimePeriodType } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  sales: {
    label: "Sales",
    color: "#3b82f6"
  },
  estimates: {
    label: "Estimates",
    color: "#10b981"
  }
};

const fetchChartMetrics = async (timePeriod: TimePeriodType) => {
  try {
    const response = await window.dashboardApi.getChartMetrics(timePeriod);
    return response;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

const salesPercentageChange = 8.4;
const estimatesPercentageChange = 8.4;

export function SalesEstimateChart() {
  const [timePeriod, setTimePeriod] = useState<TimePeriodType>(TIME_PERIOD.LAST_7_DAYS);

  const { data, status, isError, error } = useQuery({
    queryKey: ["chartmetrics", timePeriod],
    queryFn: () => fetchChartMetrics(timePeriod),
    select: (response) => {
      return response.status === "success" ? response.data : null;
    }
  });

  useEffect(() => {
    if (isError) {
      toast.error(error.message);
    }
  }, [error, isError]);

  const formatPercentage = (value: number): string => {
    const prefix = value > 0 ? "+" : "";
    return `${prefix}${value.toFixed(1)}%`;
  };
  return (
    <Card className="py-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-2">
          <CardTitle className="text-xl">Sales vs Estimates</CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm bg-[#3b82f6]" />
              <span className="text-muted-foreground text-base font-medium">Sales</span>
              <span className="ml-1 flex items-center gap-1 font-medium">
                {salesPercentageChange >= 0 ? (
                  <TrendingUp className="text-success size-5" />
                ) : (
                  <TrendingDown className="text-destructive size-5" />
                )}
                <span className="text-base">{formatPercentage(salesPercentageChange)}</span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <div className="w-3i h-3 rounded-sm bg-[#10b981]" />
              <span className="text-muted-foreground text-base font-medium">Estimates</span>
              <span className="ml-1 flex items-center gap-1 font-medium">
                {estimatesPercentageChange >= 0 ? (
                  <TrendingUp className="text-success size-5" />
                ) : (
                  <TrendingDown className="text-destructive size-5" />
                )}
                <span className="text-base">{formatPercentage(estimatesPercentageChange)}</span>
              </span>
            </div>
          </div>
        </div>

        <Select
          value={timePeriod}
          onValueChange={(value) => setTimePeriod(value as TimePeriodType)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            {timePeriodOptions.map((t, idx) => (
              <SelectItem key={idx} value={t.value} className="cursor-pointer">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent>
        {status === "success" && data && (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
              data={data}
              margin={{ top: 20, right: 10, bottom: 20, left: 0 }}
              maxBarSize={40}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <ChartTooltip
                content={<ChartTooltipContent className="justify-between text-base" />}
              />
              <Bar dataKey="sales" fill="#1b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="estimates" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
