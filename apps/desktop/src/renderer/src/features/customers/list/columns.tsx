import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDateStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import { MoreVertical } from "lucide-react";
import { OutstandingBadge } from "../detail/shared/OutstandingBadge";
import type { CustomerListRow } from "./types";

const typeBadgeClass: Record<string, string> = {
  cash: "bg-muted text-muted-foreground border-border",
  account: "bg-info/15 text-info border-info/25",
  hotel: "bg-primary/10 text-primary border-primary/25"
};

export const colSpans = [
  "col-span-3",
  "col-span-2",
  "col-span-2",
  "col-span-2",
  "col-span-2",
  "col-span-1"
] as const;

export function renderNameCell(row: CustomerListRow) {
  return (
    <div className="min-w-0">
      <p className="text-foreground truncate font-medium">{row.name}</p>
      <p className="text-muted-foreground truncate text-xs">{row.contact ?? "No contact"}</p>
    </div>
  );
}

export function renderTypeCell(row: CustomerListRow) {
  const t = row.customerType;
  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2 py-0.5 text-xs font-medium capitalize",
        typeBadgeClass[t] ?? typeBadgeClass.cash
      )}
    >
      {t}
    </Badge>
  );
}

export function renderOutstandingCell(row: CustomerListRow) {
  if (row.outstanding !== null) {
    return <OutstandingBadge outstanding={row.outstanding} size="sm" />;
  }
  return <span className="text-muted-foreground/60 text-sm tabular-nums">{"\u2014"}</span>;
}

export function renderLastPurchaseAtCell(row: CustomerListRow) {
  if (row.lastPurchaseAt !== null) {
    return (
      <span className="text-muted-foreground text-xs tabular-nums">
        {formatDateStr(row.lastPurchaseAt)}
      </span>
    );
  }
  return <span className="text-muted-foreground/60 text-sm">{"\u2014"}</span>;
}

export function renderLastPurchaseAmtCell(row: CustomerListRow) {
  if (row.lastPurchaseAmt !== null) {
    return (
      <span className="text-foreground text-sm font-medium tabular-nums">
        {formatRupee(row.lastPurchaseAmt)}
      </span>
    );
  }
  return <span className="text-muted-foreground/60 text-sm">{"\u2014"}</span>;
}

export function renderActionsCell(
  row: CustomerListRow,
  onView: (row: CustomerListRow) => void,
  onEdit: (row: CustomerListRow) => void,
  onDelete: (row: CustomerListRow) => void
) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="flex justify-end" onClick={handleClick}>
      <span className="hover:bg-accent hover:text-accent-foreground text-muted-foreground cursor-pointer rounded-md p-1.5">
        <MoreVertical className="size-4" />
      </span>
    </div>
  );
}
