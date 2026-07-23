import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDateStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import type { CustomerListRow } from "./types";

const typeBadgeClass: Record<string, string> = {
  cash: "bg-muted text-muted-foreground border-border",
  account: "bg-info/15 text-info border-info/25",
  hotel: "bg-primary/10 text-primary border-primary/25"
};

export const colSpans = [
  "col-span-3",
  "col-span-1",
  "col-span-1",
  "col-span-2",
  "col-span-1",
  "col-span-2",
  "col-span-1"
] as const;

export function renderNameCell(row: CustomerListRow) {
  return (
    <div className="min-w-0">
      <p className="text-foreground truncate text-sm leading-tight font-semibold">{row.name}</p>
      <p className="text-muted-foreground truncate text-xs leading-tight">
        {row.contact ?? "No contact"}
      </p>
    </div>
  );
}

export function renderTypeCell(row: CustomerListRow) {
  const t = row.customerType;
  return (
    <Badge
      variant="outline"
      className={cn(
        "px-1.5 py-0 text-xs font-medium capitalize",
        typeBadgeClass[t] ?? typeBadgeClass.cash
      )}
    >
      {t}
    </Badge>
  );
}

export function renderOutstandingCell(row: CustomerListRow) {
  if (row.outstanding === null || row.outstanding === 0) {
    return <span className="text-muted-foreground/60 text-sm tabular-nums">{"\u2014"}</span>;
  }

  const isDue = row.outstanding > 0;
  return (
    <span
      className={cn(
        "text-sm font-semibold tabular-nums",
        isDue ? "text-destructive" : "text-success"
      )}
    >
      {formatRupee(Math.abs(row.outstanding))}
      <span className="ml-0.5 text-xs font-medium">{isDue ? "Dr" : "Cr"}</span>
    </span>
  );
}

export function renderLastPurchaseAtCell(row: CustomerListRow) {
  if (row.lastPurchaseAt !== null) {
    return (
      <span className="text-muted-foreground text-sm tabular-nums">
        {formatDateStr(row.lastPurchaseAt)}
      </span>
    );
  }
  return <span className="text-muted-foreground/60 text-base">{"\u2014"}</span>;
}

export function renderLastPurchaseAmtCell(row: CustomerListRow) {
  if (row.lastPurchaseAmt !== null) {
    return (
      <span className="text-foreground text-sm font-semibold tabular-nums">
        {formatRupee(row.lastPurchaseAmt)}
      </span>
    );
  }
  return <span className="text-muted-foreground/60 text-base">{"\u2014"}</span>;
}

export function renderLastPaymentAtCell(row: CustomerListRow) {
  if (row.lastPaymentAt !== null) {
    return (
      <span className="text-muted-foreground text-sm tabular-nums">
        {formatDateStr(row.lastPaymentAt)}
      </span>
    );
  }
  return <span className="text-muted-foreground/60 text-base">{"\u2014"}</span>;
}

export function renderLastPaymentAmtCell(row: CustomerListRow) {
  if (row.lastPaymentAmt !== null) {
    return (
      <span className="text-foreground text-sm font-semibold tabular-nums">
        {formatRupee(row.lastPaymentAmt)}
      </span>
    );
  }
  return <span className="text-muted-foreground/60 text-base">{"\u2014"}</span>;
}
