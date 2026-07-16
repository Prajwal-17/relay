import { useCustomerLedgerSummary } from "@/hooks/customers/useCustomerLedger";
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
  const isDebit = currentBalance > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {summary && (
        <div className="border-border bg-card divide-border/70 shadow-xs grid shrink-0 grid-cols-3 divide-x overflow-hidden rounded-xl border">
          <div
            className={cn(
              "relative flex items-center gap-3 px-4 py-3",
              !isSettled && (isDebit ? "bg-destructive/4" : "bg-success/5")
            )}
          >
            <span
              className={cn(
                "absolute inset-y-0 left-0 w-1",
                isSettled ? "bg-border" : isDebit ? "bg-destructive" : "bg-success"
              )}
            />
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                isSettled
                  ? "bg-muted text-muted-foreground"
                  : isDebit
                    ? "bg-destructive/10 text-destructive"
                    : "bg-success/15 text-success"
              )}
            >
              <Wallet className="size-4.5" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                Balance
              </span>
              <span
                className={cn(
                  "truncate text-lg font-semibold tabular-nums leading-none tracking-[-0.02em]",
                  isSettled ? "text-foreground" : isDebit ? "text-destructive" : "text-success"
                )}
              >
                {isSettled ? "Settled" : formatRupee(Math.abs(currentBalance))}
              </span>
              {!isSettled && (
                <span className="text-muted-foreground text-[11px] font-medium">
                  {isDebit ? "Receivable (Dr)" : "Advance (Cr)"}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3">
            <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
              <TrendingUp className="size-4.5" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                Avg Sale
              </span>
              <span className="text-foreground truncate text-lg font-semibold tabular-nums leading-none tracking-[-0.02em]">
                {avgSale > 0 ? formatRupee(avgSale) : "—"}
              </span>
              <span className="text-muted-foreground text-[11px] font-medium tabular-nums">
                {salesCount > 0
                  ? `Across ${salesCount} ${salesCount === 1 ? "sale" : "sales"}`
                  : "No sales yet"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                lastPayment ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
              )}
            >
              <ArrowDownLeft className="size-4.5" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                Last Payment
              </span>
              <span
                className={cn(
                  "truncate text-lg font-semibold tabular-nums leading-none tracking-[-0.02em]",
                  lastPayment ? "text-success" : "text-muted-foreground"
                )}
              >
                {lastPayment ? formatRupee(lastPayment.amount) : "—"}
              </span>
              <span className="text-muted-foreground truncate text-[11px] font-medium capitalize">
                {lastPayment
                  ? `${lastPayment.mode} · ${formatDateStr(lastPayment.date)}`
                  : "No payments yet"}
              </span>
            </div>
          </div>
        </div>
      )}

      <LedgerTable customerId={customerId} />
    </div>
  );
}
