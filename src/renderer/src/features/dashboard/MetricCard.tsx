import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/store/dashboardStore";
import { TREND_OPTION, type TrendType } from "@shared/types";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MetricCardProps {
  label: string;
  value: string;
  changePercent: number;
  href: string;
  trend: TrendType;
}

export function MetricCard({ label, value, changePercent, href, trend }: MetricCardProps) {
  const navigate = useNavigate();
  const setDate = useDashboardStore((state) => state.setDate);
  const isPositive = typeof changePercent === "number" ? changePercent >= 0 : undefined;

  const formattedChange =
    typeof changePercent === "number"
      ? `${changePercent > 0 ? "+" : changePercent < 0 ? "-" : ""}${Math.abs(changePercent)}%`
      : undefined;

  const handleLink = async () => {
    const fromDate = new Date();
    const toDate = new Date();
    fromDate.setDate(fromDate.getDate() - 1);
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
    const parsedDate = JSON.stringify({ from: fromDate, to: toDate });
    localStorage.setItem("daterange", JSON.stringify(parsedDate));
    setDate({ from: fromDate, to: toDate });
    navigate(href);
  };

  return (
    <Card className="bg-background border py-4 shadow-sm hover:shadow-xl">
      <CardContent className="px-4 py-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-foreground text-lg leading-6 font-medium">{label}</span>
          </div>

          {href ? (
            <div
              onClick={handleLink}
              className="bg-secondary/60 text-foreground/70 border-border hover:bg-secondary/80 hover:text-foreground inline-flex items-center justify-center rounded-full border p-1 transition-transform hover:scale-105"
            >
              <ArrowUpRight size={25} />
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          <div className="text-foreground text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
            {value}
          </div>
        </div>

        {trend !== TREND_OPTION.NO_CHANGE && (
          <div className="mt-2 flex items-center gap-2">
            {formattedChange ? (
              <Badge
                variant="secondary"
                className={cn(
                  "px-2 py-0.5 text-sm",
                  typeof isPositive === "boolean"
                    ? isPositive
                      ? "bg-success/15 text-success border-transparent"
                      : "bg-destructive/15 text-destructive border-transparent"
                    : ""
                )}
              >
                {isPositive ? (
                  <TrendingUp className="size-4!" />
                ) : (
                  <TrendingDown className="size-4!" />
                )}
                {formattedChange}
              </Badge>
            ) : null}

            <span className="text-muted-foreground text-base leading-6 font-medium">
              vs Yesterday
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
