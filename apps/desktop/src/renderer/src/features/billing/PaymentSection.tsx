import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { processSyncQueue } from "@/utils/syncWorker";
import { PAYMENT_MODE, TRANSACTION_TYPE, type PaymentMode } from "@shared/types";
import { formatRupee, rupeesToPaisa } from "@shared/utils/utils";
import { Banknote, CreditCard, IndianRupee, Smartphone, Wallet } from "lucide-react";

type PaymentStatus = "PAID" | "PARTIAL" | "UNPAID";

const PAYMENT_MODES = [
  { value: PAYMENT_MODE.CASH, label: "Cash", Icon: Banknote },
  { value: PAYMENT_MODE.UPI, label: "UPI", Icon: Smartphone },
  { value: PAYMENT_MODE.CARD, label: "Card", Icon: CreditCard }
] as const;

const STATUS_STYLES: Record<PaymentStatus, { label: string; pill: string; amount: string }> = {
  PAID: {
    label: "Paid",
    pill: "border-success/25 bg-success/15 text-success",
    amount: "text-success"
  },
  PARTIAL: {
    label: "Partial",
    pill: "border-warning/30 bg-warning/15 text-warning",
    amount: "text-warning"
  },
  UNPAID: {
    label: "Unpaid",
    pill: "border-destructive/25 bg-destructive/10 text-destructive",
    amount: "text-destructive"
  }
};

type PaymentSectionProps = { className?: string };

const PaymentSection = ({ className }: PaymentSectionProps) => {
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const session = useBillingSessionStore((state) =>
    activeTabId ? state.sessions[activeTabId] : null
  );
  const updateField = useBillingSessionStore((state) => state.updateField);
  const lineItems = useBillingSessionStore((state) =>
    activeTabId ? (state.sessions[activeTabId]?.lineItems ?? []) : []
  );

  if (!session || session.billingType !== TRANSACTION_TYPE.SALE) {
    return null;
  }

  const amountReceived = session.amountPaid ?? "";
  const paymentMode = session.paymentMode;

  const grandTotalPaisa = lineItems.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);

  const receivedRupees = amountReceived === "" ? 0 : Number(amountReceived);
  const receivedPaisa =
    Number.isFinite(receivedRupees) && receivedRupees >= 0 ? rupeesToPaisa(receivedRupees) : 0;
  const balancePaisa = grandTotalPaisa - receivedPaisa;
  const isOverpaid = balancePaisa < 0;

  const status: PaymentStatus =
    receivedPaisa <= 0 ? "UNPAID" : balancePaisa <= 0 ? "PAID" : "PARTIAL";
  const statusStyle = STATUS_STYLES[status];

  const commit = (field: "amountPaid" | "paymentMode", value: string | PaymentMode | null) => {
    updateField(activeTabId!, field, value as never);
    processSyncQueue(activeTabId!);
  };

  const handleAmountChange = (raw: string) => {
    commit("amountPaid", raw === "" ? "" : raw.replace(/[^0-9.]/g, ""));
  };

  const handlePaymentModeChange = (mode: PaymentMode | null) => {
    commit("paymentMode", paymentMode === mode ? null : mode);
  };

  const applyFull = () => commit("amountPaid", String(grandTotalPaisa / 100));
  const applyHalf = () => commit("amountPaid", String(Math.round(grandTotalPaisa / 2) / 100));
  const applyRoundOff = () => {
    const rupees = grandTotalPaisa / 100;
    commit("amountPaid", String(Math.ceil(rupees / 10) * 10));
  };

  const hasBillAmount = grandTotalPaisa > 0;
  const displayBalance = isOverpaid ? Math.abs(balancePaisa) : Math.max(balancePaisa, 0);

  const quickActions = [
    { label: "Full", onClick: applyFull },
    { label: "Half", onClick: applyHalf },
    { label: "Round", onClick: applyRoundOff }
  ];

  return (
    <section
      className={cn(
        "bg-card border-border/60 flex h-full flex-col rounded-2xl border p-4 shadow-sm",
        className
      )}
    >
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-muted/60 border-border/70 flex size-8 items-center justify-center rounded-lg border">
            <Wallet className="text-primary size-4" />
          </div>
          <h2 className="text-foreground text-sm font-semibold tracking-tight">Payment</h2>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums",
            statusStyle.pill
          )}
        >
          {statusStyle.label}
        </span>
      </header>

      <div className="mb-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground/80 text-xs font-semibold tracking-wider uppercase">
            Amount Received
          </span>
          <div className="flex items-center gap-1">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                disabled={!hasBillAmount}
                className="border-border/70 bg-muted/60 text-foreground hover:bg-accent focus-visible:ring-ring/50 cursor-pointer rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
        <div className="relative">
          <IndianRupee className="text-muted-foreground/70 pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2" />
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={amountReceived}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0.00"
            className="border-input/80 focus-visible:border-ring focus-visible:ring-ring bg-background placeholder:text-muted-foreground/60 h-12 [appearance:textfield] rounded-lg border pr-3 pl-10 text-left text-xl! font-semibold tracking-tight tabular-nums shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-2 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-1.5">
        <span className="text-muted-foreground/80 text-xs font-semibold tracking-wider uppercase">
          Payment Mode
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {PAYMENT_MODES.map(({ value, label, Icon }) => {
            const selected = paymentMode === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => handlePaymentModeChange(value)}
                className={cn(
                  "flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border text-sm font-semibold capitalize transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/70 bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-muted/40 border-border/70 mt-auto overflow-hidden rounded-xl border">
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-muted-foreground text-xs font-medium">Bill Amount</span>
          <span className="text-foreground text-sm font-semibold tabular-nums">
            {formatRupee(grandTotalPaisa)}
          </span>
        </div>
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-muted-foreground text-xs font-medium">Received</span>
          <span className="text-foreground text-sm font-semibold tabular-nums">
            {receivedPaisa > 0 ? formatRupee(receivedPaisa) : "—"}
          </span>
        </div>
        <div className="border-border/70 border-t border-dashed" />
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-foreground text-xs font-semibold">
            {isOverpaid ? "Change Due" : "Balance Due"}
          </span>
          <span className={cn("text-2xl font-bold tabular-nums", statusStyle.amount)}>
            {formatRupee(displayBalance)}
          </span>
        </div>
      </div>
    </section>
  );
};

export default PaymentSection;
