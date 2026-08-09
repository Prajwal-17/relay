import { cn } from "@/lib/utils";
import { formatRupee } from "@shared/utils/utils";

/**
 * Outstanding badge.
 * Balances are neutral financial information; the label carries due, advance, or settled meaning.
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
  const amount = formatRupee(Math.abs(outstanding));
  const label = isZero ? "Settled" : amount;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border font-medium tabular-nums",
        size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs",
        isZero
          ? "bg-hover text-muted-foreground border-border"
          : "text-foreground border-border bg-transparent",
        className
      )}
    >
      <span className="font-semibold">{label}</span>
    </span>
  );
}
