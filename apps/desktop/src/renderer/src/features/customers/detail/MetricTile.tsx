import { CompactCard } from "@/components/app-ui/compact-card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Reusable compact financial summary tile.
 * `value` should already be a formatted string (money, count, date).
 */
type MetricTileProps = {
  label: string;
  value: string;
  subValue?: string;
  tone?: "neutral" | "primary" | "success" | "warning" | "destructive";
  icon?: ReactNode;
  className?: string;
};

const toneValueClass: Record<NonNullable<MetricTileProps["tone"]>, string> = {
  neutral: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive"
};

export function MetricTile({
  label,
  value,
  subValue,
  tone = "neutral",
  icon,
  className
}: MetricTileProps) {
  return (
    <CompactCard
      className={cn(
        "min-w-0 flex-row flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3",
        className
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className="text-muted-foreground text-xs font-semibold">{label}</span>
        </div>
        {subValue && <p className="text-muted-foreground mt-0.5 truncate text-xs">{subValue}</p>}
      </div>
      <p
        className={cn(
          "financial-nums ml-auto shrink-0 text-right font-semibold whitespace-nowrap",
          toneValueClass[tone]
        )}
      >
        {value}
      </p>
    </CompactCard>
  );
}
