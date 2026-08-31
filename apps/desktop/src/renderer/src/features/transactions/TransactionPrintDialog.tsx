import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import useRawReceiptPrint from "@/features/billing/hooks/useRawReceiptPrint";
import {
  ReceiptQrModeSelector,
  type ReceiptQrMode
} from "@/features/billing/ReceiptQrModeSelector";
import { useAppPreferences } from "@/features/preferences/useAppPreferences";
import { cn } from "@/lib/utils";
import type { TransactionType } from "@shared/types";
import {
  getDefaultUpiQrProfile,
  orderUpiQrProfiles,
  resolveUpiQrProfile
} from "@shared/utils/upiQrProfiles";
import { formatRupee } from "@shared/utils/utils";
import { Loader2, Printer, QrCode } from "lucide-react";
import { useEffect, useId, useState } from "react";
import toast from "react-hot-toast";

type TransactionPrintDialogProps = {
  id: string;
  transactionNo: number;
  type: TransactionType;
  totalPaisa: number | null | undefined;
  trigger?: "icon" | "button";
  triggerClassName?: string;
};

export function TransactionPrintDialog({
  id,
  transactionNo,
  type,
  totalPaisa,
  trigger = "icon",
  triggerClassName
}: TransactionPrintDialogProps) {
  const { printSavedReceipt } = useRawReceiptPrint();
  const { config, defaults } = useAppPreferences();
  const printing = config?.printing ?? defaults?.printing;
  const profileLabelId = useId();
  const [open, setOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printMode, setPrintMode] = useState<ReceiptQrMode>("receipt");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const orderedProfiles = printing ? orderUpiQrProfiles(printing) : [];
  const defaultProfileId = printing?.defaultUpiQrProfileId ?? null;
  const selectedProfile = printing
    ? (resolveUpiQrProfile(printing, selectedProfileId) ?? getDefaultUpiQrProfile(printing))
    : undefined;
  const upiIsReady = Boolean(selectedProfile);

  useEffect(() => {
    if (!open || !printing) return;

    const defaultProfile = getDefaultUpiQrProfile(printing);
    const defaultIncludeQr =
      Boolean(defaultProfile) &&
      (type === "sale" ? printing.printUpiQrOnSales : printing.printUpiQrOnEstimates);

    setSelectedProfileId(defaultProfile?.id ?? null);
    setPrintMode(
      !defaultIncludeQr ? "receipt" : printing.includeAmountInUpiQr ? "upi-exact" : "upi-open"
    );
  }, [open, printing, type]);

  const handlePrint = async () => {
    if (!printing) return;

    setIsPrinting(true);
    try {
      const result = await printSavedReceipt({
        id,
        type,
        overrides: {
          includeUpiQr: printMode !== "receipt" && upiIsReady,
          includeAmountInUpiQr: printMode === "upi-exact",
          upiQrProfileId: printMode !== "receipt" ? (selectedProfile?.id ?? null) : null
        }
      });
      setOpen(false);
      if (result.fellBack) {
        toast("Printed using device text because the high-quality receipt could not be prepared", {
          icon: "⚠️"
        });
      } else {
        toast.success("Print job sent to printer.");
      }
    } catch (error) {
      console.error("Transaction print failed", error);
      toast.error(error instanceof Error ? error.message : "Print failed.");
    } finally {
      setIsPrinting(false);
    }
  };

  const typeLabel = type === "sale" ? "Sale" : "Estimate";
  const formattedTotal =
    totalPaisa === null || totalPaisa === undefined ? null : formatRupee(totalPaisa);
  const printButtonLabel = !printing
    ? "Loading settings…"
    : printMode === "receipt"
      ? "Print receipt"
      : printMode === "upi-open"
        ? "Print QR"
        : formattedTotal
          ? `Print ${formattedTotal} QR`
          : "Print exact QR";
  const typeIdentityClass =
    type === "sale"
      ? "bg-sales-soft text-sales-foreground"
      : "bg-estimate-soft text-estimate-foreground";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isPrinting) return;
        setOpen(nextOpen);
      }}
    >
      {trigger === "button" ? (
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={triggerClassName}
            disabled={isPrinting}
          >
            <Printer className="size-4" />
            Print
          </Button>
        </DialogTrigger>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label={`Print transaction ${transactionNo}`}
                disabled={isPrinting}
                className="hover:bg-hover hover:text-foreground text-foreground cursor-pointer rounded-md p-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPrinting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Printer className="size-4" />
                )}
              </button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">Print options</p>
          </TooltipContent>
        </Tooltip>
      )}

      <DialogContent className="border-frame grid max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-lg [&_[data-slot=dialog-close]]:top-3 [&_[data-slot=dialog-close]]:right-3 [&_[data-slot=dialog-close]]:flex [&_[data-slot=dialog-close]]:size-8 [&_[data-slot=dialog-close]]:items-center [&_[data-slot=dialog-close]]:justify-center [&_[data-slot=dialog-close]]:rounded-(--radius-control) [&_[data-slot=dialog-close]>svg]:size-5">
        <DialogHeader className="border-border block border-b px-5 py-4 pr-12">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-(--radius-control)",
                typeIdentityClass
              )}
            >
              <Printer className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <DialogTitle>
                Print {typeLabel} #{transactionNo}
              </DialogTitle>
              <DialogDescription className="mt-1">Choose one receipt option</DialogDescription>
            </span>
            {formattedTotal ? (
              <span className="ml-auto text-right">
                <span className="text-muted-foreground block text-xs">Total</span>
                <span className="text-foreground block text-base font-bold whitespace-nowrap tabular-nums">
                  {formattedTotal}
                </span>
              </span>
            ) : null}
          </div>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <ReceiptQrModeSelector
              id={`saved-transaction-print-${id}`}
              mode={printMode}
              totalPaisa={totalPaisa}
              upiDisabled={!printing || !upiIsReady}
              onModeChange={setPrintMode}
            />
            {printing && !upiIsReady ? (
              <p className="text-muted-foreground mt-2 text-xs">
                Add a UPI account in Settings → Printing.
              </p>
            ) : null}
          </div>

          {printMode !== "receipt" && selectedProfile ? (
            <section className="border-border rounded-(--radius-panel) border p-3">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span id={profileLabelId} className="text-foreground text-sm font-medium">
                  UPI account
                </span>
                {orderedProfiles.length > 1 ? (
                  <span className="text-muted-foreground text-xs">
                    {orderedProfiles.length} saved
                  </span>
                ) : null}
              </div>
              {orderedProfiles.length === 1 ? (
                <div
                  aria-labelledby={profileLabelId}
                  className="bg-muted flex h-10 min-w-0 items-center gap-2 rounded-(--radius-control) px-2.5"
                >
                  <QrCode className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                  <span
                    className="text-foreground min-w-0 flex-1 truncate text-sm font-medium"
                    title={selectedProfile.label}
                  >
                    {selectedProfile.label}
                  </span>
                  <span
                    className="text-muted-foreground max-w-40 truncate text-xs"
                    title={selectedProfile.upiId}
                  >
                    {selectedProfile.upiId}
                  </span>
                </div>
              ) : (
                <Select value={selectedProfile.id} onValueChange={setSelectedProfileId}>
                  <SelectTrigger
                    aria-labelledby={profileLabelId}
                    className="bg-background h-10 w-full min-w-0 px-2.5 text-left"
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <QrCode
                        className="text-muted-foreground size-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {selectedProfile.label}
                      </span>
                      <span
                        className="text-muted-foreground max-w-40 truncate text-xs"
                        title={selectedProfile.upiId}
                      >
                        {selectedProfile.upiId}
                      </span>
                    </span>
                  </SelectTrigger>
                  <SelectContent
                    align="start"
                    className="max-h-64 w-[var(--radix-select-trigger-width)] min-w-0"
                  >
                    {orderedProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id} className="min-w-0 py-2">
                        <span className="min-w-0">
                          <span className="text-foreground block truncate text-sm font-medium">
                            {profile.label}
                          </span>
                          <span className="text-muted-foreground block truncate text-xs">
                            {profile.upiId}
                            {profile.id === defaultProfileId ? " · Default" : ""}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </section>
          ) : null}
        </div>

        <DialogFooter className="border-border bg-muted border-t px-5 py-3">
          <Button
            type="button"
            variant="outline"
            disabled={isPrinting}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!printing || isPrinting}
            onClick={() => void handlePrint()}
          >
            {!printing || isPrinting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Printer className="size-4" />
            )}
            {isPrinting ? "Printing…" : printButtonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
