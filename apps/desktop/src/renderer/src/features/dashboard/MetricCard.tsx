import { Badge } from "@/components/ui/badge";
import {
  CompactCard as Card,
  CompactCardContent as CardContent
} from "@/components/app-ui/compact-card";
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
  const isSaleMetric = href === "/dashboard/sales";
  const isEstimateMetric = href === "/dashboard/estimates";

  const formattedChange =
    typeof changePercent === "number"
      ? `${changePercent > 0 ? "+" : changePercent < 0 ? "-" : ""}${Math.abs(changePercent)}%`
      : undefined;

  const handleLink = async () => {
    const fromDate = new Date();
    const toDate = new Date();
    fromDate.setDate(fromDate.getDate());
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);
    const parsedDate = JSON.stringify({ from: fromDate, to: toDate });
    localStorage.setItem("daterange", JSON.stringify(parsedDate));
    setDate({ from: fromDate, to: toDate });
    navigate(href);
  };

  return (
    <Card
      className={cn(
        "bg-card border py-2",
        isSaleMetric && "border-success/30",
        isEstimateMetric && "border-info/30"
      )}
    >
      <CardContent className="px-3 py-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm leading-5 font-medium",
                isSaleMetric ? "text-success" : isEstimateMetric ? "text-info" : "text-foreground"
              )}
            >
              {label}
            </span>
          </div>

          {href ? (
            <div
              onClick={handleLink}
              className="bg-secondary/70 text-foreground/70 border-border hover:bg-secondary/90 hover:text-foreground inline-flex items-center justify-center rounded-(--radius-control) border p-1 transition-colors"
            >
              <ArrowUpRight size={18} />
            </div>
          ) : null}
        </div>

        <div className="mt-2">
          <div className="financial-nums text-foreground text-xl font-semibold tracking-tight">
            {value}
          </div>
        </div>

        {trend !== TREND_OPTION.NO_CHANGE && (
          <div className="mt-1.5 flex items-center gap-2">
            {formattedChange ? (
              <Badge
                variant="secondary"
                className={cn(
                  "px-2 py-0.5 text-xs",
                  typeof isPositive === "boolean"
                    ? isPositive
                      ? "bg-success/15 text-success border-transparent"
                      : "bg-destructive/15 text-destructive border-transparent"
                    : ""
                )}
              >
                {isPositive ? (
                  <TrendingUp className="size-3.5!" />
                ) : (
                  <TrendingDown className="size-3.5!" />
                )}
                {formattedChange}
              </Badge>
            ) : null}

            <span className="text-muted-foreground text-xs leading-5 font-medium">
              vs Yesterday
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
