import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { LedgerSummary } from "@shared/types";
import { formatDateStrToISTDateTimeStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import {
  IndianRupee,
  Ellipsis,
  LoaderCircle,
  FileDown,
  FileSpreadsheet,
  Printer,
  RefreshCcw,
  Scale
} from "lucide-react";
import toast from "react-hot-toast";
import { getBalanceState, getBalanceStateLabel, sentenceCase } from "./ledgerPresentation";

export type AccountSummaryPanelProps = {
  summary: LedgerSummary | undefined;
  isLoading: boolean;
  isError: boolean;
  isRetrying: boolean;
  onRetry: () => void;
  onQuickSale: () => void;
  onRecordPayment: () => void;
  onAdjustBalance: () => void;
  onPrint: () => void;
  canPrint: boolean;
  isPrinting: boolean;
};

function SummarySkeleton() {
  return (
    <div
      aria-label="Loading account summary"
      className="flex animate-pulse flex-wrap items-start justify-between gap-3"
    >
      <div className="space-y-2">
        <div className="bg-muted h-4 w-24 rounded" />
        <div className="bg-muted h-4 w-20 rounded" />
      </div>
      <div className="bg-muted h-7 w-28 rounded" />
    </div>
  );
}

export function AccountSummaryPanel({
  summary,
  isLoading,
  isError,
  isRetrying,
  onRetry,
  onQuickSale,
  onRecordPayment,
  onAdjustBalance,
  onPrint,
  canPrint,
  isPrinting
}: AccountSummaryPanelProps) {
  const balanceState = summary ? getBalanceState(summary.currentBalance) : null;
  const balanceTone =
    balanceState === "due"
      ? "text-counter-accent-foreground"
      : balanceState === "advance"
        ? "text-sales-foreground"
        : "text-muted-foreground";
  const balanceDotTone =
    balanceState === "due"
      ? "bg-counter-accent"
      : balanceState === "advance"
        ? "bg-sales"
        : "bg-muted-foreground";

  const showExportFeedback = (format: "PDF" | "Excel") => {
    toast(`${format} export is unavailable in this prototype.`);
  };

  return (
    <aside
      aria-label="Account summary"
      className="border-border bg-card flex flex-col self-start overflow-hidden rounded-(--radius-panel) border shadow-xs"
    >
      <div className="border-border border-b px-3 py-2.5">
        <h2 className="text-sm font-semibold">Account summary</h2>
      </div>

      <div className="px-3 py-3">
        {isLoading && !summary ? (
          <SummarySkeleton />
        ) : isError || !summary ? (
          <div role="alert" aria-live="assertive" className="space-y-2">
            <div>
              <p className="text-destructive text-sm font-semibold">Balance unavailable</p>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                The account summary could not be loaded. The ledger has not been treated as settled.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={onRetry}
              disabled={isRetrying}
            >
              <RefreshCcw className={cn("size-3.5", isRetrying && "animate-spin")} />
              Try again
            </Button>
          </div>
        ) : (
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium">Current balance</p>
              <p
                className={cn("mt-1 flex items-center gap-1.5 text-sm font-semibold", balanceTone)}
              >
                <span
                  aria-hidden="true"
                  className={cn("size-1.5 shrink-0 rounded-full", balanceDotTone)}
                />
                {getBalanceStateLabel(summary.currentBalance)}
              </p>
            </div>
            <p
              className={cn(
                "financial-nums ml-auto shrink-0 text-right font-bold whitespace-nowrap",
                balanceTone
              )}
            >
              {formatRupee(Math.abs(summary.currentBalance))}
            </p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-[2fr_3fr] gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-w-0 cursor-pointer"
            onClick={onQuickSale}
          >
            Quick Sale
          </Button>
          <Button
            type="button"
            size="sm"
            className="min-w-0 cursor-pointer"
            onClick={onRecordPayment}
          >
            Record Payment
          </Button>
        </div>

        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-w-0 cursor-pointer"
            aria-label="Choose account entries to print"
            onClick={onPrint}
            disabled={!canPrint || isPrinting}
          >
            {isPrinting ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <Printer className="size-3.5" />
            )}
            {isPrinting ? "Printing…" : "Print"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="cursor-pointer"
                aria-label="More account actions"
              >
                <Ellipsis className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="cursor-pointer" onSelect={onAdjustBalance}>
                <Scale className="size-4" />
                Adjust Balance
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => showExportFeedback("PDF")}
              >
                <FileDown className="size-4" />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => showExportFeedback("Excel")}
              >
                <FileSpreadsheet className="size-4" />
                Export Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="border-border mt-4 border-t pt-3">
          <p className="text-muted-foreground text-xs font-medium">Last payment</p>
          {isLoading && !summary ? (
            <div className="mt-2 grid animate-pulse grid-cols-[auto_1fr_auto] items-center gap-2.5">
              <div className="bg-muted size-8 rounded-(--radius-control)" />
              <div className="space-y-1.5">
                <div className="bg-muted h-4 w-16 rounded" />
                <div className="bg-muted h-3 w-24 rounded" />
              </div>
              <div className="bg-muted h-4 w-20 rounded" />
            </div>
          ) : isError || !summary ? (
            <p className="text-muted-foreground mt-2 text-sm">Unavailable</p>
          ) : summary.lastPayment ? (
            <div className="mt-2 grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5">
              <span className="border-success bg-success text-success-foreground flex size-8 shrink-0 items-center justify-center rounded-(--radius-control) border">
                <IndianRupee className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {sentenceCase(summary.lastPayment.mode)}
                </p>
                <time
                  dateTime={summary.lastPayment.date}
                  className="text-muted-foreground text-xs tabular-nums"
                >
                  {formatDateStrToISTDateTimeStr(summary.lastPayment.date)}
                </time>
              </div>
              <p className="text-sm font-semibold whitespace-nowrap tabular-nums">
                {formatRupee(summary.lastPayment.amount)}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground mt-2 text-sm">No payments recorded</p>
          )}
        </div>
      </div>
    </aside>
  );
}
