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
import { useCreateQuickSale } from "@/hooks/customers/useLedgerMutations";
import { rupeesToPaisa } from "@shared/utils/utils";
import { useState } from "react";

export function QuickSaleDialog({
  customerId,
  onClose
}: {
  customerId: string;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const createQuickSale = useCreateQuickSale(customerId);

  const canSave = Number(amount) > 0 && !createQuickSale.isPending;

  const handleSave = () => {
    const paisa = rupeesToPaisa(Number(amount));
    createQuickSale.mutate(
      { amount: paisa, notes: note.trim() || undefined },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card shadow-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Sale</DialogTitle>
          <DialogDescription>
            Record a fast over-the-counter sale without creating an invoice.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qs-amount">Amount (₹)</Label>
            <Input
              id="qs-amount"
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder=""
              className="h-12 text-lg font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qs-note">Note</Label>
            <textarea
              id="qs-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note…"
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 shadow-xs min-h-14 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-[color,box-shadow] focus-visible:ring-[3px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={onClose}
            disabled={createQuickSale.isPending}
          >
            Cancel
          </Button>
          <Button
            className="hover:bg-primary-hover cursor-pointer"
            disabled={!canSave}
            onClick={handleSave}
          >
            {createQuickSale.isPending ? "Saving…" : "Save Quick Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
