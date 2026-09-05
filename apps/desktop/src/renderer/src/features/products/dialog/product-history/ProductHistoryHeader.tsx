import { cn } from "@/lib/utils";
import { formatRupee } from "@shared/utils/utils";
import { ChartLine, List } from "lucide-react";

import { PRICE_METRIC_CONFIG } from "./productHistory.config";
import type { HistoryView, PriceMetric } from "./productHistory.types";

function ViewSelector({
  value,
  onChange
}: {
  value: HistoryView;
  onChange: (value: HistoryView) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Price history view"
      className="border-border bg-muted flex shrink-0 gap-0.5 rounded-(--radius-control) border p-0.5"
    >
      {(
        [
          { value: "changes", label: "Changes", icon: List },
          { value: "trend", label: "Price trend", icon: ChartLine }
        ] as const
      ).map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "text-muted-foreground hover:bg-hover flex h-7 cursor-pointer items-center gap-1.5 rounded-[calc(var(--radius-control)-2px)] px-2.5 text-xs font-semibold transition-colors",
              value === option.value && "bg-card text-foreground hover:bg-card shadow-xs"
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function ProductHistoryHeader({
  changeCount,
  currentPrices,
  view,
  onViewChange
}: {
  changeCount: number;
  currentPrices: Array<{ metric: PriceMetric; value: number | null }>;
  view: HistoryView;
  onViewChange: (value: HistoryView) => void;
}) {
  return (
    <div className="border-border bg-background shrink-0 border-b px-3 py-2">
      <div className="grid min-w-0 grid-cols-[minmax(150px,0.65fr)_minmax(450px,2fr)_auto] items-center gap-3">
        <p className="text-muted-foreground min-w-0 truncate text-xs tabular-nums">
          <span className="text-foreground font-bold">{changeCount}</span> recorded{" "}
          {changeCount === 1 ? "change" : "changes"}
        </p>

        <div
          className="border-border bg-card divide-border flex min-w-0 divide-x overflow-hidden rounded-(--radius-control) border"
          aria-label="Current product prices"
        >
          {currentPrices.map(({ metric, value }) => {
            const config = PRICE_METRIC_CONFIG[metric];
            const Icon = config.icon;
            return (
              <div key={metric} className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-1.5">
                <span className="bg-secondary text-foreground flex size-7 shrink-0 items-center justify-center rounded-[4px]">
                  <Icon className="size-3.5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-muted-foreground truncate text-xs leading-tight font-medium">
                    {config.summaryLabel}
                  </p>
                  <p className="text-foreground text-sm leading-tight font-bold whitespace-nowrap tabular-nums">
                    {value === null ? "Not set" : formatRupee(value)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <ViewSelector value={view} onChange={onViewChange} />
      </div>
    </div>
  );
}
