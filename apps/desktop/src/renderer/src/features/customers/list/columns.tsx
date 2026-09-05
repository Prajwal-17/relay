import { HighlightedText } from "@/components/app-ui/highlighted-text";
import { formatDateStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import { CustomerTypeBadge } from "../CustomerTypeBadge";
import type { CustomerListRow } from "./types";

export const colSpans = [
  "col-span-3",
  "col-span-1",
  "col-span-1",
  "col-span-2",
  "col-span-1",
  "col-span-2",
  "col-span-1"
] as const;

export function renderNameCell(row: CustomerListRow, query: string) {
  return (
    <div className="min-w-0">
      <p className="text-foreground truncate text-sm leading-tight font-semibold">
        <HighlightedText text={row.name} query={query} />
      </p>
      <p className="text-muted-foreground truncate text-xs leading-tight">
        <HighlightedText text={row.contact ?? "No contact"} query={query} />
      </p>
    </div>
  );
}

export function renderTypeCell(row: CustomerListRow) {
  return (
    <CustomerTypeBadge
      customerType={row.customerType}
      className="px-2 py-0.5 text-sm font-semibold"
    />
  );
}

export function renderOutstandingCell(row: CustomerListRow) {
  if (row.outstanding === null || row.outstanding === 0) {
    return <span className="text-muted-foreground/60 text-sm tabular-nums">{"\u2014"}</span>;
  }

  const isDue = row.outstanding > 0;

  return (
    <span className="text-foreground text-sm font-semibold tabular-nums">
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
