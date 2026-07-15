import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Reusable stat tile. E2 card surface.
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
    <div className={cn("bg-card border-border rounded-xl border px-4 py-3 shadow-xs", className)}>
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </span>
      </div>
      <p
        className={cn(
          "mt-1.5 font-semibold tracking-[-0.02em] tabular-nums",
          toneValueClass[tone],
          "text-2xl"
        )}
      >
        {value}
      </p>
      {subValue && <p className="text-muted-foreground mt-0.5 text-xs font-medium">{subValue}</p>}
    </div>
  );
}
