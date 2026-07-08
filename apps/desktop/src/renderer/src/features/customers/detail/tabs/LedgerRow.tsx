import { cn } from "@/lib/utils";
import { formatDateStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import type { LedgerEntry, LedgerEntryType } from "../../_mock/types";

const typePillClass: Record<LedgerEntryType, string> = {
  opening: "bg-muted text-muted-foreground border-border",
  sale: "bg-info/15 text-info border-info/25",
  payment: "bg-success/15 text-success border-success/25",
  estimate: "bg-primary/10 text-primary border-primary/25",
  adjustment: "bg-warning/15 text-warning border-warning/30"
};

const typeLabel: Record<LedgerEntryType, string> = {
  opening: "Opening",
  sale: "Sale",
  payment: "Payment",
  estimate: "Estimate",
  adjustment: "Adjustment"
};

function Money({ value, align = "right" }: { value: number; align?: "right" }) {
  if (value === 0) {
    return <span className="text-muted-foreground/60 inline-block w-full text-right">—</span>;
  }
  return (
    <span
      className={cn(
        "text-foreground inline-block w-full tabular-nums",
        align === "right" && "text-right"
      )}
    >
      {formatRupee(value)}
    </span>
  );
}

export function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const isOpening = entry.type === "opening";

  return (
    <div
      className={cn(
        "border-border/70 grid grid-cols-12 items-center gap-2 border-b px-4 py-2.5 text-sm last:border-b-0",
        isOpening && "bg-muted/40"
      )}
    >
      <div className="text-muted-foreground col-span-2 font-medium tabular-nums">
        {formatDateStr(entry.date)}
      </div>

      <div className="col-span-2">
        <span
          className={cn(
            "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
            typePillClass[entry.type]
          )}
        >
          {typeLabel[entry.type]}
        </span>
      </div>

      <div className="text-muted-foreground col-span-2 truncate font-medium tabular-nums">
        {entry.ref}
      </div>

      <div className="text-foreground col-span-3 truncate font-medium">{entry.description}</div>

      <div className={cn("col-span-1 font-medium", isOpening && "text-muted-foreground")}>
        <Money value={entry.debit} />
      </div>
      <div className={cn("col-span-1 font-medium", entry.type === "payment" && "text-success")}>
        <Money value={entry.credit} />
      </div>
      <div className="text-foreground col-span-1 text-right font-semibold tabular-nums">
        {formatRupee(entry.runningBalance)}
      </div>
    </div>
  );
}
