import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDateStrToISTDateTimeStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import { CalendarRange, ChartLine, Check } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  PRICE_CHART_CONFIG,
  PRICE_METRIC_CONFIG,
  PRICE_METRICS,
  TREND_RANGE_OPTIONS
} from "./productHistory.config";
import type { PriceChange, PriceMetric, PriceTrendPoint, TrendRange } from "./productHistory.types";
import {
  buildTrendPoints,
  filterTrendPoints,
  formatCompactRupee,
  formatShortDate
} from "./productHistory.utils";

type TooltipItem = {
  dataKey?: string | number;
  value?: string | number;
  payload?: PriceTrendPoint;
};

function SeriesSwatch({
  metric,
  width = 28,
  strokeWidth = 3.25
}: {
  metric: PriceMetric;
  width?: number;
  strokeWidth?: number;
}) {
  const config = PRICE_METRIC_CONFIG[metric];

  return (
    <svg
      className="h-2 shrink-0 overflow-visible"
      style={{ width }}
      viewBox={`0 0 ${width} 8`}
      aria-hidden="true"
    >
      <line
        x1="0"
        y1="4"
        x2={width}
        y2="4"
        stroke={config.color}
        strokeWidth={strokeWidth}
        strokeDasharray={config.strokeDasharray}
        strokeLinecap="round"
      />
    </svg>
  );
}

function PriceTrendTooltip({ active, payload }: { active?: boolean; payload?: TooltipItem[] }) {
  const point = payload?.[0]?.payload;
  const values =
    payload?.filter(
      (item) =>
        typeof item.dataKey === "string" &&
        PRICE_METRICS.includes(item.dataKey as PriceMetric) &&
        typeof item.value === "number"
    ) ?? [];

  if (!active || !point || values.length === 0) return null;

  return (
    <div className="border-frame bg-background min-w-56 rounded-(--radius-control) border p-2.5 shadow-lg">
      <p className="text-foreground border-border border-b pb-1.5 text-xs font-semibold tabular-nums">
        {formatDateStrToISTDateTimeStr(point.createdAt)}
      </p>
      <div className="mt-2 grid gap-2">
        {values.map((item) => {
          const metric = item.dataKey as PriceMetric;
          const config = PRICE_METRIC_CONFIG[metric];

          return (
            <div key={metric} className="flex items-center justify-between gap-5">
              <span className="text-foreground flex items-center gap-2 text-xs font-semibold">
                <SeriesSwatch metric={metric} width={24} strokeWidth={3} />
                {config.label}
              </span>
              <span className="text-foreground text-sm font-bold tabular-nums">
                {formatRupee(item.value as number)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricSelector({
  selectedMetrics,
  onMetricToggle
}: {
  selectedMetrics: PriceMetric[];
  onMetricToggle: (metric: PriceMetric) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Prices shown on chart"
      className="border-border bg-muted flex items-center gap-0.5 rounded-(--radius-control) border p-0.5"
    >
      {PRICE_METRICS.map((metric) => {
        const config = PRICE_METRIC_CONFIG[metric];
        const isSelected = selectedMetrics.includes(metric);

        return (
          <button
            key={metric}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onMetricToggle(metric)}
            className={cn(
              "hover:bg-hover flex h-7 cursor-pointer items-center gap-1.5 rounded-[calc(var(--radius-control)-2px)] border border-transparent px-2 text-xs font-semibold transition-colors",
              isSelected
                ? "border-border bg-card text-foreground hover:bg-card shadow-xs"
                : "text-muted-foreground"
            )}
          >
            <SeriesSwatch metric={metric} />
            <span>{config.shortLabel}</span>
            <span
              className={cn(
                "flex size-3.5 items-center justify-center rounded-[3px] border",
                isSelected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background"
              )}
              aria-hidden="true"
            >
              {isSelected && <Check className="size-2.5" strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function EmptyTrend({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
      <span className="bg-secondary text-muted-foreground flex size-10 items-center justify-center rounded-(--radius-panel)">
        <ChartLine className="size-5" aria-hidden="true" />
      </span>
      <h4 className="text-foreground mt-3 text-sm font-semibold">{title}</h4>
      <p className="text-muted-foreground mt-1 max-w-sm text-xs">{description}</p>
    </div>
  );
}

export function ProductPriceTrend({
  changes,
  selectedMetrics,
  onMetricToggle,
  range,
  onRangeChange
}: {
  changes: PriceChange[];
  selectedMetrics: PriceMetric[];
  onMetricToggle: (metric: PriceMetric) => void;
  range: TrendRange;
  onRangeChange: (range: TrendRange) => void;
}) {
  const allPoints = buildTrendPoints(changes);
  const rangedPoints = filterTrendPoints(allPoints, range);
  const points = rangedPoints.filter((point) =>
    selectedMetrics.some((metric) => point[metric] !== null)
  );
  const activeRange = TREND_RANGE_OPTIONS.find((option) => option.value === range)!;
  const selectedLabels = selectedMetrics.map((metric) => PRICE_METRIC_CONFIG[metric].shortLabel);

  return (
    <div className="border-frame bg-card flex h-full min-h-0 flex-col overflow-hidden rounded-(--radius-panel) border shadow-xs">
      <div className="border-border bg-card flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2">
        <div className="min-w-0">
          <h4 className="text-foreground text-sm font-semibold">Price movement</h4>
          <p className="text-muted-foreground truncate text-xs">
            {points.length} recorded {points.length === 1 ? "update" : "updates"} -{" "}
            {activeRange.label}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <MetricSelector selectedMetrics={selectedMetrics} onMetricToggle={onMetricToggle} />
          <Select value={range} onValueChange={(value) => onRangeChange(value as TrendRange)}>
            <SelectTrigger
              size="sm"
              aria-label="Price trend date range"
              className="bg-background h-8 min-w-30 px-2.5 text-xs font-semibold shadow-none"
            >
              <CalendarRange className="size-3.5" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {TREND_RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedMetrics.length === 0 ? (
        <EmptyTrend
          title="Choose a price to compare"
          description="Select Selling, Purchase, or MRP above to show it on the graph."
        />
      ) : points.length === 0 ? (
        <EmptyTrend
          title="No price changes in this range"
          description="Choose a longer date range to see earlier price movement."
        />
      ) : (
        <div className="min-h-0 flex-1 px-3 pt-3 pb-2">
          <ChartContainer
            config={PRICE_CHART_CONFIG}
            role="img"
            aria-label={`Price trend for ${selectedLabels.join(", ")} over ${activeRange.label}`}
            className="aspect-auto h-full min-h-64 w-full [&_.recharts-cartesian-axis-tick_text]:font-medium"
          >
            <LineChart data={points} margin={{ top: 10, right: 18, bottom: 4, left: 6 }}>
              <CartesianGrid vertical={false} strokeDasharray="2 5" />
              <XAxis
                dataKey="createdAt"
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                minTickGap={56}
                tickFormatter={formatShortDate}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                width={72}
                domain={["auto", "auto"]}
                tickFormatter={formatCompactRupee}
              />
              <ChartTooltip
                filterNull
                cursor={{ stroke: "var(--border-strong)", strokeDasharray: "3 3" }}
                content={<PriceTrendTooltip />}
              />
              {selectedMetrics.map((metric) => {
                const config = PRICE_METRIC_CONFIG[metric];
                return (
                  <Line
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    name={config.label}
                    stroke={`var(--color-${metric})`}
                    strokeWidth={3.25}
                    strokeDasharray={config.strokeDasharray}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    connectNulls={false}
                    dot={
                      points.length <= 24
                        ? {
                            r: 3.75,
                            fill: `var(--color-${metric})`,
                            stroke: "var(--background)",
                            strokeWidth: 2.5
                          }
                        : false
                    }
                    activeDot={{
                      r: 6,
                      fill: `var(--color-${metric})`,
                      stroke: "var(--background)",
                      strokeWidth: 2.5
                    }}
                    isAnimationActive={false}
                  />
                );
              })}
            </LineChart>
          </ChartContainer>
        </div>
      )}
    </div>
  );
}
