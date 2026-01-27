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
import { ChartColumnIncreasing } from "lucide-react";
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
    const response = await fetch(
      `http://localhost:3000/api/dashboard/sales-vs-estimates?timePeriod=${timePeriod}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export function SalesEstimateChart() {
  const [timePeriod, setTimePeriod] = useState<TimePeriodType>(TIME_PERIOD.LAST_7_DAYS);

  const { data, isError, error, isSuccess } = useQuery({
    queryKey: [timePeriod],
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

  return (
    <Card className="py-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-2">
          <CardTitle className="text-xl">Sales vs Estimates</CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm bg-[#3b82f6]" />
              <span className="text-muted-foreground text-base font-medium">Sales</span>
            </div>

            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm bg-[#10b983]" />
              <span className="text-muted-foreground text-base font-medium">Estimates</span>
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
        {isSuccess && data && (
          <>
            {data.length <= 0 ? (
              <div className="border-muted bg-secondary flex h-[300px] w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <ChartColumnIncreasing className="text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-foreground text-sm font-medium">No data available</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    There&apos;s no sales data to display for the selected period.
                  </p>
                </div>
              </div>
            ) : (
              <div>
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
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
