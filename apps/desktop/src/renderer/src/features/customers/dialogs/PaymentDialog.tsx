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
import { paisaToRupees, rupeesToPaisa } from "@shared/utils/utils";
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
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>Log a payment received from {customerName}.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-amount">Amount received (₹)</Label>
            <div className="relative">
              <Input
                id="pay-amount"
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder=""
                className="h-10 [appearance:textfield] pr-20 text-xl! font-semibold tracking-[-0.02em] text-ellipsis tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              {outstanding > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setAmount(String(paisaToRupees(outstanding)))}
                  className="absolute top-1/2 right-1 -translate-y-1/2 cursor-pointer"
                >
                  Full
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-mode">Payment mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as PaymentMode)}>
              <SelectTrigger id="pay-mode">
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
            <Textarea
              id="pay-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note…"
              className="min-h-16 resize-y"
            />
          </div>

          <div className="bg-muted border-border flex items-center justify-between gap-3 rounded-(--radius-control) border px-3 py-2.5">
            <span className="text-muted-foreground text-sm font-medium">Current outstanding</span>
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
          <Button className="cursor-pointer" disabled={!canSave} onClick={handleSave}>
            {createPayment.isPending ? "Saving…" : "Record payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
