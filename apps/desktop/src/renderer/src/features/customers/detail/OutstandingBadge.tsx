import { cn } from "@/lib/utils";
import { formatRupee } from "@shared/utils/utils";

/**
 * Compact account-balance status used within customer workflows.
 */
export function OutstandingBadge({
  outstanding,
  className,
  size = "md"
}: {
  outstanding: number;
  className?: string;
  size?: "sm" | "md";
}) {
  const amount = formatRupee(Math.abs(outstanding));
  const label = outstanding > 0 ? "Due" : outstanding < 0 ? "Advance" : "Settled";
  const toneClass =
    outstanding > 0
      ? "border-counter-accent bg-counter-accent-soft text-counter-accent-foreground"
      : outstanding < 0
        ? "border-sales bg-sales-soft text-sales-foreground"
        : "border-border bg-hover text-foreground";

  return (
    <span
      aria-label={label + ": " + amount}
      className={cn(
        "inline-flex shrink-0 items-center rounded-(--radius-control) border leading-none tabular-nums",
        size === "md" ? "h-9 gap-2 px-3" : "h-8 gap-1.5 px-2.5",
        toneClass,
        className
      )}
    >
      <span className={cn("font-semibold", size === "md" ? "text-sm" : "text-xs")}>{label}</span>
      <span className={cn("font-bold whitespace-nowrap", size === "md" ? "text-base" : "text-sm")}>
        {amount}
      </span>
    </span>
  );
}
