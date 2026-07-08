import { cn } from "@/lib/utils";
import { formatRupee } from "@shared/utils/utils";

/**
 * Outstanding Dr/Cr badge.
 * - Positive outstanding → Dr (they owe) → destructive tone.
 * - Negative outstanding → Cr (prepaid) → success tone.
 * - Zero → neutral muted.
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
  const isDebit = outstanding > 0;
  const amount = formatRupee(Math.abs(outstanding));
  const label = isZero ? "Settled" : isDebit ? "Dr" : "Cr";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium tabular-nums",
        size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs",
        isZero
          ? "bg-muted text-muted-foreground border-border"
          : isDebit
            ? "bg-destructive/10 text-destructive border-destructive/25"
            : "bg-success/15 text-success border-success/25",
        className
      )}
    >
      {!isZero && (
        <span className="text-muted-foreground text-xs font-semibold uppercase">{label}</span>
      )}
      <span className="font-semibold">{isZero ? label : amount}</span>
    </span>
  );
}
