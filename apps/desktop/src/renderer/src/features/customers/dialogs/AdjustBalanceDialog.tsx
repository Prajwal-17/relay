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
import { Textarea } from "@/components/ui/textarea";
import { useCreateAdjustment } from "@/features/customers/hooks/useLedgerMutations";
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
  const [direction, setDirection] = useState<"due" | "paid">("due");
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
          <DialogTitle>Adjust balance</DialogTitle>
          <DialogDescription>
            Manually correct the ledger — add to the amount they owe, or record a payment.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Direction</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDirection("due")}
                className={
                  direction === "due" ? "border-marker bg-selected hover:bg-selected" : undefined
                }
              >
                Add due
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDirection("paid")}
                className={
                  direction === "paid" ? "border-marker bg-selected hover:bg-selected" : undefined
                }
              >
                Record payment
              </Button>
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
              className="h-10 [appearance:textfield] text-lg! font-semibold tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adj-note">Note</Label>
            <Textarea
              id="adj-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for adjustment…"
              className="min-h-16 resize-y"
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
          <Button className="cursor-pointer" disabled={!canSave} onClick={handleSave}>
            {createAdjustment.isPending ? "Saving…" : "Save adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
