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
import { useCreatePayment } from "@/features/customers/hooks/useLedgerMutations";
import type { PaymentMode } from "@shared/types";
import { PAYMENT_MODE } from "@shared/types";
import { formatRupee, paisaToRupees, rupeesToPaisa } from "@shared/utils/utils";
import { useState } from "react";
import { OutstandingBadge } from "../detail/OutstandingBadge";

const modes: PaymentMode[] = [PAYMENT_MODE.CASH, PAYMENT_MODE.UPI, PAYMENT_MODE.CARD];

export function PaymentDialog({
  customerId,
  customerName,
  outstanding,
  onClose
}: {
  customerId: string;
  customerName: string;
  outstanding: number;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<PaymentMode>(PAYMENT_MODE.CASH);
  const [note, setNote] = useState("");

  const createPayment = useCreatePayment(customerId);

  const canSave = Number(amount) > 0 && !createPayment.isPending;

  const handleSave = () => {
    const paisa = rupeesToPaisa(Number(amount));

    createPayment.mutate(
      {
        amount: paisa,
        mode,
        notes: note.trim() || undefined
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card shadow-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>Log a payment received from {customerName}.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-amount">Amount Received (₹)</Label>
            <div className="relative">
              <Input
                id="pay-amount"
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder=""
                className="border-ring/20 focus-visible:border-ring h-10 [appearance:textfield] overflow-hidden border-2 pr-20 text-xl! font-semibold tracking-[-0.02em] text-ellipsis tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              {outstanding > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(paisaToRupees(outstanding)))}
                  className="border-ring/20 bg-muted/60 text-primary hover:bg-primary/10 focus-visible:ring-ring/50 absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-md border px-2.5 py-1 text-xs font-semibold tracking-wide uppercase transition-colors outline-none focus-visible:ring-[3px]"
                >
                  Full
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-mode">Payment Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as PaymentMode)}>
              <SelectTrigger id="pay-mode" className="h-9">
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-note">Note</Label>
            <textarea
              id="pay-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note…"
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-12 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
            />
          </div>

          <div className="bg-muted/40 border-border/70 flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Outstanding
              </span>
              <span className="text-foreground text-sm font-semibold tabular-nums">
                {outstanding === 0 ? "Settled" : formatRupee(Math.abs(outstanding))}
              </span>
            </div>
            <OutstandingBadge outstanding={outstanding} />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={onClose}
            disabled={createPayment.isPending}
          >
            Cancel
          </Button>
          <Button
            className="hover:bg-primary-hover cursor-pointer"
            disabled={!canSave}
            onClick={handleSave}
          >
            {createPayment.isPending ? "Saving…" : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
