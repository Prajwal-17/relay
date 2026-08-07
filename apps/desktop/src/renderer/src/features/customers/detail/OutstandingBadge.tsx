import { cn } from "@/lib/utils";
import { formatRupee } from "@shared/utils/utils";

/**
 * Outstanding badge.
 * - Positive outstanding → they owe → destructive tone.
 * - Negative outstanding → advance → success tone.
 * - Zero → settled → neutral muted.
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
  const isZero = outstanding === 0;
  const isDue = outstanding > 0;
  const amount = formatRupee(Math.abs(outstanding));
  const label = isZero ? "Settled" : amount;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border font-medium tabular-nums",
        size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs",
        isZero
          ? "bg-muted text-muted-foreground border-border"
          : isDue
            ? "bg-destructive/10 text-destructive border-destructive/25"
            : "bg-success/15 text-success border-success/25",
        className
      )}
    >
      <span className="font-semibold">{label}</span>
    </span>
  );
}
