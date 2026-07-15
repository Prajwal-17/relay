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
import { useCreateAdjustment } from "@/hooks/customers/useLedgerMutations";
import { rupeesToPaisa } from "@shared/utils/utils";
import { useState } from "react";

export function AdjustBalanceDialog({
  customerId,
  onClose
}: {
  customerId: string;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"debit" | "credit">("debit");
  const [note, setNote] = useState("");

  const createAdjustment = useCreateAdjustment(customerId);

  const canSave = Number(amount) > 0 && !createAdjustment.isPending;

  const handleSave = () => {
    const paisa = rupeesToPaisa(Number(amount));
    createAdjustment.mutate(
      { amount: paisa, direction, notes: note.trim() || undefined },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card shadow-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Balance</DialogTitle>
          <DialogDescription>
            Manually correct the ledger with a debit (they owe more) or credit (they owe less).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Direction</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection("debit")}
                className={
                  direction === "debit"
                    ? "border-destructive/25 bg-destructive/10 text-destructive h-12 cursor-pointer rounded-lg border-2 text-sm font-semibold transition-colors"
                    : "border-border bg-muted/50 text-muted-foreground hover:bg-muted/60 h-12 cursor-pointer rounded-lg border text-sm font-medium transition-colors"
                }
              >
                Debit (Dr)
              </button>
              <button
                type="button"
                onClick={() => setDirection("credit")}
                className={
                  direction === "credit"
                    ? "border-success/25 bg-success/15 text-success h-12 cursor-pointer rounded-lg border-2 text-sm font-semibold transition-colors"
                    : "border-border bg-muted/50 text-muted-foreground hover:bg-muted/60 h-12 cursor-pointer rounded-lg border text-sm font-medium transition-colors"
                }
              >
                Credit (Cr)
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adj-amount">Amount (₹)</Label>
            <Input
              id="adj-amount"
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder=""
              className="h-12 [appearance:textfield] text-lg! font-semibold tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adj-note">Note</Label>
            <textarea
              id="adj-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for adjustment…"
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-14 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={onClose}
            disabled={createAdjustment.isPending}
          >
            Cancel
          </Button>
          <Button
            className="hover:bg-primary-hover cursor-pointer"
            disabled={!canSave}
            onClick={handleSave}
          >
            {createAdjustment.isPending ? "Saving…" : "Save Adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
