import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useUpdateLedgerEntry } from "@/hooks/customers/useLedgerMutations";
import type { LedgerEntry, PaymentMode, UpdateLedgerEntryPayload } from "@shared/types";
import { LEDGER_ENTRY_TYPE, PAYMENT_MODE } from "@shared/types";
import { paisaToRupees, rupeesToPaisa } from "@shared/utils/utils";
import { useState } from "react";

const modes: PaymentMode[] = [PAYMENT_MODE.CASH, PAYMENT_MODE.UPI, PAYMENT_MODE.CARD];

export function EditLedgerDialog({
  entry,
  customerId,
  onClose
}: {
  entry: LedgerEntry;
  customerId: string;
  onClose: () => void;
}) {
  const isPayment = entry.type === LEDGER_ENTRY_TYPE.PAYMENT;
  const isAdjustment = entry.type === LEDGER_ENTRY_TYPE.ADJUSTMENT;

  const [amount, setAmount] = useState(() => {
    if (isPayment) return String(paisaToRupees(entry.amountPaid));
    if (isAdjustment) return String(paisaToRupees(entry.amountDue || entry.amountPaid));
    return String(paisaToRupees(entry.amountDue));
  });
  const [direction, setDirection] = useState<"due" | "paid">(entry.amountDue > 0 ? "due" : "paid");
  const [mode, setMode] = useState<PaymentMode>(
    (entry.paymentMode as PaymentMode) || PAYMENT_MODE.CASH
  );
  const [note, setNote] = useState(entry.notes ?? "");

  const updateEntry = useUpdateLedgerEntry(customerId);

  const canSave = Number(amount) > 0 && !updateEntry.isPending;

  const handleSave = () => {
    const paisa = rupeesToPaisa(Number(amount));
    const payload: UpdateLedgerEntryPayload = {};

    if (isPayment) {
      if (paisa !== entry.amountPaid) payload.amountPaid = paisa;
      if (mode !== (entry.paymentMode as PaymentMode)) payload.paymentMode = mode;
    } else if (isAdjustment) {
      const currentAmount = entry.amountDue || entry.amountPaid;
      if (paisa !== currentAmount) {
        payload.amountDue = direction === "due" ? paisa : 0;
        payload.amountPaid = direction === "paid" ? paisa : 0;
      } else if (
        (direction === "due" && entry.amountDue === 0) ||
        (direction === "paid" && entry.amountPaid === 0)
      ) {
        payload.amountDue = direction === "due" ? paisa : 0;
        payload.amountPaid = direction === "paid" ? paisa : 0;
      }
    } else {
      if (paisa !== entry.amountDue) payload.amountDue = paisa;
    }

    const trimmedNote = note.trim();
    if (trimmedNote !== (entry.notes ?? "")) payload.notes = trimmedNote || "";

    updateEntry.mutate({ entryId: entry.id, payload }, { onSuccess: onClose });
  };

  const titleByType: Record<string, string> = {
    [LEDGER_ENTRY_TYPE.PAYMENT]: "Edit Payment",
    [LEDGER_ENTRY_TYPE.ADJUSTMENT]: "Edit Adjustment",
    [LEDGER_ENTRY_TYPE.QUICK_SALE]: "Edit Quick Sale",
    [LEDGER_ENTRY_TYPE.OPENING_BALANCE]: "Edit Opening Balance"
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card shadow-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titleByType[entry.type] ?? "Edit Entry"}</DialogTitle>
          <DialogDescription>
            Modify the ledger entry. Changes are only allowed within 48 hours of creation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {isAdjustment && (
            <div className="flex flex-col gap-1.5">
              <Label>Direction</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection("due")}
                  className={
                    direction === "due"
                      ? "border-destructive/25 bg-destructive/10 text-destructive h-9 cursor-pointer rounded-lg border-2 text-sm font-semibold transition-colors"
                      : "border-border bg-muted/50 text-muted-foreground hover:bg-muted/60 h-9 cursor-pointer rounded-lg border text-sm font-medium transition-colors"
                  }
                >
                  Add Due
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("paid")}
                  className={
                    direction === "paid"
                      ? "border-success/25 bg-success/15 text-success h-9 cursor-pointer rounded-lg border-2 text-sm font-semibold transition-colors"
                      : "border-border bg-muted/50 text-muted-foreground hover:bg-muted/60 h-9 cursor-pointer rounded-lg border text-sm font-medium transition-colors"
                  }
                >
                  Record Payment
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-amount">{isPayment ? "Amount Paid" : "Amount"} (₹)</Label>
            <Input
              id="edit-amount"
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder=""
              className="h-9 [appearance:textfield] text-lg! font-semibold tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          {isPayment && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-mode">Payment Mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as PaymentMode)}>
                <SelectTrigger id="edit-mode" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modes.map((m) => (
                    <SelectItem key={m} value={m} className="capitalize">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-note">Note</Label>
            <textarea
              id="edit-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note…"
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-12 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={onClose}
            disabled={updateEntry.isPending}
          >
            Cancel
          </Button>
          <Button
            className="hover:bg-primary-hover cursor-pointer"
            disabled={!canSave}
            onClick={handleSave}
          >
            {updateEntry.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
