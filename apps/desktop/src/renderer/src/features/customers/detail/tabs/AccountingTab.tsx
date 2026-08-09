import { useCustomerLedgerSummary } from "@/features/customers/hooks/useCustomerLedger";
import { cn } from "@/lib/utils";
import { formatDateStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import { ArrowDownLeft, TrendingUp, Wallet } from "lucide-react";
import { LedgerTable } from "./LedgerTable";

export function AccountingTab({ customerId }: { customerId: string }) {
  const { summary } = useCustomerLedgerSummary(customerId);

  const currentBalance = summary?.currentBalance ?? 0;
  const avgSale = summary?.avgSale ?? 0;
  const salesCount = summary?.salesCount ?? 0;
  const lastPayment = summary?.lastPayment ?? null;

  const isSettled = currentBalance === 0;
  const isDue = currentBalance > 0;

  const balanceTone = isSettled ? "text-muted-foreground" : "text-foreground";
  const balanceIconTone = isSettled ? "bg-hover text-muted-foreground" : "bg-hover text-marker";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {summary && (
        <div className="border-border bg-card divide-border/70 grid shrink-0 grid-cols-3 divide-x overflow-hidden rounded-xl border shadow-xs">
          <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  balanceIconTone
                )}
              >
                <Wallet className="size-4" />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Current balance
                </span>
                <span className="text-muted-foreground truncate text-xs font-medium">
                  {isSettled ? "Account is clear" : isDue ? "They owe you" : "You owe them"}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-baseline justify-end gap-1">
              <span
                className={cn(
                  "text-xl font-bold tracking-[-0.02em] whitespace-nowrap tabular-nums",
                  balanceTone
                )}
              >
                {isSettled ? "Settled" : formatRupee(Math.abs(currentBalance))}
              </span>
              {!isSettled && (
                <span className={cn("text-xs font-bold tracking-wider uppercase", balanceTone)}>
                  {isDue ? "Receivable" : "Advance"}
                </span>
              )}
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                <TrendingUp className="size-4" />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Avg sale
                </span>
                <span className="text-muted-foreground truncate text-xs font-medium tabular-nums">
                  {salesCount > 0
                    ? `Across ${salesCount} ${salesCount === 1 ? "sale" : "sales"}`
                    : "No sales yet"}
                </span>
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 text-xl font-bold tracking-[-0.02em] whitespace-nowrap tabular-nums",
                avgSale > 0 ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {avgSale > 0 ? formatRupee(avgSale) : "—"}
            </span>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                <ArrowDownLeft className="size-4" />
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Last payment
                </span>
                <span className="text-muted-foreground truncate text-xs font-medium capitalize">
                  {lastPayment
                    ? `${lastPayment.mode} • ${formatDateStr(lastPayment.date)}`
                    : "No payments yet"}
                </span>
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 text-xl font-bold tracking-[-0.02em] whitespace-nowrap tabular-nums",
                lastPayment ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {lastPayment ? formatRupee(lastPayment.amount) : "—"}
            </span>
          </div>
        </div>
      )}

      <LedgerTable customerId={customerId} />
    </div>
  );
}
