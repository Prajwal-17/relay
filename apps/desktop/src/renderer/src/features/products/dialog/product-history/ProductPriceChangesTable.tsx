import { cn } from "@/lib/utils";
import { formatDateStrToISTDateStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CalendarDays,
  ChartLine,
  Tags
} from "lucide-react";

import type { PriceChange } from "./productHistory.types";

function ChangeAmount({
  oldValue,
  newValue
}: {
  oldValue: number | null;
  newValue: number | null;
}) {
  if (oldValue === null) {
    return <span className="text-muted-foreground text-xs font-semibold">Added</span>;
  }
  if (newValue === null) {
    return <span className="text-muted-foreground text-xs font-semibold">Removed</span>;
  }

  const difference = newValue - oldValue;
  const isIncrease = difference > 0;
  const DifferenceIcon = isIncrease ? ArrowUp : ArrowDown;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-end gap-1.5 text-sm font-bold tabular-nums",
        isIncrease ? "text-success" : "text-destructive"
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-[4px] border shadow-xs",
          isIncrease
            ? "border-success bg-success text-success-foreground"
            : "border-destructive bg-destructive text-destructive-foreground"
        )}
      >
        <DifferenceIcon className="size-3.5" strokeWidth={2.75} aria-hidden="true" />
      </span>
      {isIncrease ? "+" : "-"}
      {formatRupee(Math.abs(difference))}
    </span>
  );
}

export function ProductPriceChangesTable({ changes }: { changes: PriceChange[] }) {
  return (
    <div className="border-frame bg-card flex h-full min-h-0 flex-col overflow-hidden rounded-(--radius-panel) border">
      <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
        <table aria-label="Product price changes" className="w-full table-fixed border-collapse">
          <thead className="bg-table-header sticky top-0 z-10">
            <tr className="border-frame h-9 border-b">
              <th className="text-foreground w-[26%] px-3 text-left text-xs font-semibold tracking-wide uppercase">
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
                  Date
                </span>
              </th>
              <th className="text-foreground w-[22%] px-3 text-left text-xs font-semibold tracking-wide uppercase">
                <span className="flex items-center gap-1">
                  <Tags className="size-3.5 shrink-0" aria-hidden="true" />
                  Price type
                </span>
              </th>
              <th className="text-foreground w-[17%] px-3 text-right text-xs font-semibold tracking-wide uppercase">
                <span className="flex items-center justify-end gap-1">
                  <ArrowLeft className="size-3.5 shrink-0" aria-hidden="true" />
                  Previous
                </span>
              </th>
              <th className="text-foreground w-[17%] px-3 text-right text-xs font-semibold tracking-wide uppercase">
                <span className="flex items-center justify-end gap-1">
                  <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
                  New price
                </span>
              </th>
              <th className="text-foreground w-[18%] px-3 text-right text-xs font-semibold tracking-wide uppercase">
                <span className="flex items-center justify-end gap-1">
                  <ChartLine className="size-3.5 shrink-0" aria-hidden="true" />
                  Change
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {changes.map((change) => {
              const { fullDate, timePart } = formatDateStrToISTDateStr(change.createdAt);
              return (
                <tr
                  key={change.id}
                  className="border-border hover:bg-hover h-12 border-b transition-colors last:border-b-0"
                >
                  <td className="px-3 align-middle">
                    <div className="flex flex-col">
                      <span className="text-foreground text-sm font-medium tabular-nums">
                        {fullDate}
                      </span>
                      <span className="text-muted-foreground text-xs tabular-nums">{timePart}</span>
                    </div>
                  </td>
                  <td className="text-foreground px-3 text-sm font-semibold">{change.label}</td>
                  <td className="text-muted-foreground px-3 text-right text-sm font-medium tabular-nums">
                    {change.oldValue === null ? "Not set" : formatRupee(change.oldValue)}
                  </td>
                  <td className="text-foreground px-3 text-right text-sm font-bold tabular-nums">
                    {change.newValue === null ? "Not set" : formatRupee(change.newValue)}
                  </td>
                  <td className="px-3 text-right">
                    <ChangeAmount oldValue={change.oldValue} newValue={change.newValue} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
