import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomerActions } from "@/features/customers/customerActions";
import { useCustomerLedgerSummary } from "@/features/customers/hooks/useCustomerLedger";
import {
  MAX_RECENT_LEDGER_PRINT_ENTRIES,
  useRawLedgerPrint,
  type LedgerPrintSelection
} from "@/features/customers/hooks/useRawLedgerPrint";
import { cn } from "@/lib/utils";
import type { Customer } from "@shared/types";
import { formatDateObjToStringMedium } from "@shared/utils/dateUtils";
import { ArrowRight, CalendarDays, LoaderCircle, Printer } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import toast from "react-hot-toast";
import { AccountSummaryPanel } from "./AccountSummaryPanel";
import { LedgerTable } from "./LedgerTable";

const RASTER_FALLBACK_MESSAGE =
  "Printed using device text because the high-quality receipt could not be prepared";

type PrintScope = LedgerPrintSelection["scope"];

const PRINT_SCOPES: Array<{ value: PrintScope; label: string }> = [
  { value: "recent", label: "Recent" },
  { value: "dateRange", label: "By date" },
  { value: "all", label: "All entries" }
];

function toDateInputValue(date: Date) {
  return [
    String(date.getFullYear()),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function formatPrintDate(date: Date | undefined) {
  return date ? formatDateObjToStringMedium(date) : "Not selected";
}

function PrintScopeSelector({
  value,
  onChange
}: {
  value: PrintScope;
  onChange: (value: PrintScope) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Entries to print"
      className="border-border bg-muted grid grid-cols-3 gap-1 rounded-(--radius-control) border p-1"
    >
      {PRINT_SCOPES.map((scope) => {
        const selected = scope.value === value;
        return (
          <button
            key={scope.value}
            type="button"
            aria-pressed={selected}
            className={cn(
              "hover:bg-hover h-8 cursor-pointer rounded-[calc(var(--radius-control)-2px)] px-2 text-sm font-medium transition-colors",
              selected && "bg-card text-foreground hover:bg-card shadow-xs"
            )}
            onClick={() => onChange(scope.value)}
          >
            {scope.label}
          </button>
        );
      })}
    </div>
  );
}

export function AccountingTab({ customer }: { customer: Customer }) {
  const { openQuickSale, openPayment, openAdjust } = useCustomerActions();
  const summaryQuery = useCustomerLedgerSummary(customer.id);
  const { printCustomerLedger } = useRawLedgerPrint();
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printScope, setPrintScope] = useState<PrintScope>("recent");
  const [recentCount, setRecentCount] = useState("20");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined
  });

  const parsedRecentCount = Number(recentCount);
  const invalidRecentCount =
    recentCount.trim() === "" ||
    !Number.isInteger(parsedRecentCount) ||
    parsedRecentCount < 1 ||
    parsedRecentCount > MAX_RECENT_LEDGER_PRINT_ENTRIES;
  const incompleteDateRange = !dateRange.from || !dateRange.to;
  const printSelectionIsInvalid =
    (printScope === "recent" && invalidRecentCount) ||
    (printScope === "dateRange" && incompleteDateRange);

  const handlePrint = async () => {
    let selection: LedgerPrintSelection;

    if (printScope === "recent") {
      if (invalidRecentCount) {
        toast.error("Enter between 1 and " + MAX_RECENT_LEDGER_PRINT_ENTRIES + " recent entries.");
        return;
      }
      selection = { scope: "recent", count: parsedRecentCount };
    } else if (printScope === "dateRange") {
      if (!dateRange.from || !dateRange.to) {
        toast.error("Choose a start and end date.");
        return;
      }
      selection = {
        scope: "dateRange",
        fromDate: toDateInputValue(dateRange.from),
        toDate: toDateInputValue(dateRange.to)
      };
    } else {
      selection = { scope: "all" };
    }

    setIsPrinting(true);
    try {
      const result = await printCustomerLedger({ id: customer.id, name: customer.name }, selection);
      if (result.fellBack) toast(RASTER_FALLBACK_MESSAGE, { icon: "⚠️" });
      toast.success("Account history sent to printer.");
      setIsPrintOpen(false);
    } catch (printError) {
      console.error("Account history print failed", printError);
      toast.error(
        printError instanceof Error ? printError.message : "Account history printing failed."
      );
    } finally {
      setIsPrinting(false);
    }
  };

  const printButtonLabel =
    printScope === "recent"
      ? invalidRecentCount
        ? "Print recent entries"
        : "Print " + parsedRecentCount + " entries"
      : printScope === "dateRange"
        ? "Print selected dates"
        : "Print all entries";

  return (
    <>
      <div className="grid min-h-0 flex-1 grid-cols-[clamp(280px,24vw,320px)_minmax(0,1fr)] gap-3">
        <AccountSummaryPanel
          summary={summaryQuery.summary}
          isLoading={summaryQuery.status === "pending"}
          isError={summaryQuery.isError}
          isRetrying={summaryQuery.isFetching}
          onRetry={() => void summaryQuery.refetch()}
          onQuickSale={openQuickSale}
          onRecordPayment={openPayment}
          onAdjustBalance={openAdjust}
          onPrint={() => setIsPrintOpen(true)}
          canPrint={Boolean(summaryQuery.summary) && !summaryQuery.isError}
          isPrinting={isPrinting}
        />
        <div className="min-h-0 min-w-0">
          <LedgerTable customerId={customer.id} />
        </div>
      </div>

      <Dialog
        open={isPrintOpen}
        onOpenChange={(open) => {
          if (!isPrinting) setIsPrintOpen(open);
        }}
      >
        <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-[440px]">
          <DialogHeader className="border-border border-b px-4 py-3 pr-12">
            <DialogTitle className="text-base">Print account history</DialogTitle>
            <DialogDescription className="truncate">{customer.name}</DialogDescription>
          </DialogHeader>

          <form
            className="flex min-h-0 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              void handlePrint();
            }}
          >
            <div className="min-h-0 overflow-y-auto p-4">
              <PrintScopeSelector value={printScope} onChange={setPrintScope} />

              {printScope === "recent" ? (
                <div className="border-border mt-3 rounded-(--radius-control) border px-3 py-2">
                  <div className="flex min-h-8 items-center justify-between gap-3">
                    <Label htmlFor="recent-entry-count" className="shrink-0">
                      Print latest
                    </Label>
                    <div className="flex min-w-0 items-center gap-2">
                      <Input
                        id="recent-entry-count"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={MAX_RECENT_LEDGER_PRINT_ENTRIES}
                        step={1}
                        value={recentCount}
                        onChange={(event) => setRecentCount(event.target.value)}
                        aria-invalid={invalidRecentCount}
                        aria-describedby={invalidRecentCount ? "recent-entry-error" : undefined}
                        className="h-8 w-20 [appearance:textfield] text-right tabular-nums shadow-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span className="text-muted-foreground text-sm">entries</span>
                    </div>
                  </div>
                  {invalidRecentCount ? (
                    <p
                      id="recent-entry-error"
                      role="alert"
                      className="text-destructive mt-1.5 text-xs"
                    >
                      Enter a number from 1 to {MAX_RECENT_LEDGER_PRINT_ENTRIES}.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {printScope === "dateRange" ? (
                <div className="mt-3 space-y-2">
                  <div className="border-border bg-background flex min-h-14 items-center gap-3 rounded-(--radius-control) border px-3 py-2">
                    <CalendarDays className="text-muted-foreground size-4 shrink-0" />
                    <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                      <div className="min-w-0">
                        <span className="text-muted-foreground block text-xs">From</span>
                        <span className="block truncate text-sm font-semibold tabular-nums">
                          {formatPrintDate(dateRange.from)}
                        </span>
                      </div>
                      <ArrowRight className="text-muted-foreground size-3.5" />
                      <div className="min-w-0">
                        <span className="text-muted-foreground block text-xs">To</span>
                        <span className="block truncate text-sm font-semibold tabular-nums">
                          {formatPrintDate(dateRange.to)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <section
                    aria-label="Choose starting and ending dates"
                    className="border-frame overflow-hidden rounded-(--radius-control) border"
                  >
                    <div className="border-border flex h-10 items-center justify-between gap-3 border-b px-3">
                      <p className="text-sm font-semibold">
                        {!dateRange.from
                          ? "Choose starting date"
                          : !dateRange.to
                            ? "Choose ending date"
                            : "Dates selected"}
                      </p>
                      {dateRange.from ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => setDateRange({ from: undefined, to: undefined })}
                        >
                          Clear
                        </Button>
                      ) : null}
                    </div>
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      defaultMonth={dateRange.from ?? new Date()}
                      disabled={{ after: new Date() }}
                      onSelect={(range) =>
                        setDateRange(range ?? { from: undefined, to: undefined })
                      }
                      numberOfMonths={1}
                      className="mx-auto p-2"
                    />
                  </section>
                </div>
              ) : null}
            </div>

            <DialogFooter className="border-border shrink-0 border-t px-4 py-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPrintOpen(false)}
                disabled={isPrinting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPrinting || printSelectionIsInvalid}>
                {isPrinting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Printer className="size-4" />
                )}
                {isPrinting ? "Printing…" : printButtonLabel}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
