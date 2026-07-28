import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentDialog } from "@/features/customers/dialogs/PaymentDialog";
import { useCustomer } from "@/hooks/customers/useCustomer";
import { useCustomerLedgerSummary } from "@/hooks/customers/useCustomerLedger";
import { cn } from "@/lib/utils";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { formatDateStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  LoaderCircle,
  Phone,
  Receipt,
  UserRound,
  Wallet
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const typeBadgeClass: Record<string, string> = {
  cash: "bg-muted text-muted-foreground border-border",
  account: "bg-info/15 text-info border-info/25",
  hotel: "bg-primary/10 text-primary border-primary/25"
};

function MiniStat({
  label,
  value,
  sub,
  icon
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-card border-border/60 flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-lg border px-3 py-2.5 shadow-xs">
      <div className="text-muted-foreground flex items-center gap-1.5">
        <span className="text-muted-foreground/80">{icon}</span>
        <span className="text-xs font-semibold tracking-wider uppercase">{label}</span>
      </div>
      <span className="text-foreground truncate text-sm font-bold tracking-[-0.02em] tabular-nums">
        {value}
      </span>
      {sub && <span className="text-muted-foreground text-xs font-medium">{sub}</span>}
    </div>
  );
}

export function CustomerAccountTab() {
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const session = useBillingSessionStore((state) =>
    activeTabId ? state.sessions[activeTabId] : null
  );

  const customerId = session?.customerId ?? null;
  if (!customerId) {
    return (
      <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-xl">
          <UserRound className="size-6" />
        </span>
        <h3 className="text-foreground text-sm font-semibold tracking-[-0.02em]">
          No customer selected
        </h3>
        <p className="text-muted-foreground text-xs font-medium">
          Select a customer to view account details.
        </p>
      </div>
    );
  }

  return <CustomerAccountBody customerId={customerId} customerName={session?.customerName ?? ""} />;
}

function CustomerAccountBody({
  customerId,
  customerName
}: {
  customerId: string;
  customerName: string;
}) {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const navigate = useNavigate();

  const { customer, isLoading } = useCustomer(customerId);
  const { summary: ledgerSummary } = useCustomerLedgerSummary(customerId);

  if (isLoading && !customer) {
    return (
      <div className="flex h-full min-h-64 items-center justify-center">
        <LoaderCircle className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  const currentBalance = ledgerSummary?.currentBalance ?? customer?.outstandingBalance ?? 0;
  const lastPayment = ledgerSummary?.lastPayment ?? null;
  const salesCount = ledgerSummary?.salesCount ?? 0;

  const isSettled = currentBalance === 0;
  const isDue = currentBalance > 0;
  const balanceTone = isSettled
    ? "text-muted-foreground"
    : isDue
      ? "text-destructive"
      : "text-success";
  const balanceIconTone = isSettled
    ? "bg-muted text-muted-foreground"
    : isDue
      ? "bg-destructive/10 text-destructive"
      : "bg-success/15 text-success";

  const customerType = customer?.customerType ?? "cash";

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header: identity */}
      <section className="bg-card border-border/60 flex flex-col gap-2 rounded-xl border p-4 shadow-xs">
        <div className="flex min-w-0 items-center gap-3">
          <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
            <UserRound className="size-5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h2 className="text-foreground truncate text-base font-bold tracking-[-0.02em]">
              {customer?.name ?? "—"}
            </h2>
            {customer?.contact && (
              <span className="text-muted-foreground flex items-center gap-1 text-xs font-medium tabular-nums">
                <Phone className="size-3.5" />
                {customer.contact}
              </span>
            )}
          </div>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 px-2.5 py-1 text-xs font-semibold capitalize",
              typeBadgeClass[customerType] ?? typeBadgeClass.cash!
            )}
          >
            {customerType}
          </Badge>
        </div>
      </section>

      {/* Balance tile */}
      <section className="bg-card border-border/60 flex min-w-0 items-center justify-between gap-3 rounded-xl border p-4 shadow-xs">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-lg",
              balanceIconTone
            )}
          >
            <Wallet className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Current balance
            </span>
            <span className="text-muted-foreground text-xs font-medium">
              {isSettled ? "Account is clear" : isDue ? "They owe you" : "You owe them"}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-baseline justify-end gap-1">
          <span
            className={cn(
              "text-lg font-bold tracking-[-0.02em] whitespace-nowrap tabular-nums",
              balanceTone
            )}
          >
            {isSettled ? "Settled" : formatRupee(Math.abs(currentBalance))}
          </span>
        </div>
      </section>

      {/* Mini stats grid */}
      <section className="grid grid-cols-2 gap-2">
        <MiniStat
          label="Invoices"
          value={String(salesCount)}
          sub={salesCount === 1 ? "1 sale" : `${salesCount} sales`}
          icon={<Receipt className="size-3" />}
        />
        <MiniStat
          label="Last Payment"
          value={lastPayment ? formatRupee(lastPayment.amount) : "—"}
          sub={
            lastPayment
              ? `${lastPayment.mode} • ${formatDateStr(lastPayment.date)}`
              : "No payments yet"
          }
          icon={<ArrowDownLeft className="size-3" />}
        />
      </section>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button
          className="hover:bg-primary-hover h-10 w-full cursor-pointer gap-1.5 text-sm font-bold"
          onClick={() => setPaymentOpen(true)}
        >
          <Wallet className="size-4.5" />
          Record Payment
        </Button>
        <Button
          variant="outline"
          className="h-10 w-full cursor-pointer gap-1.5 text-sm font-bold"
          onClick={() => navigate(`/customers/${customerId}?tab=accounting`)}
        >
          <ArrowUpRight className="size-4.5" />
          View Full Account
        </Button>
      </div>

      {paymentOpen && (
        <PaymentDialog
          customerId={customerId}
          customerName={customerName}
          outstanding={currentBalance}
          onClose={() => setPaymentOpen(false)}
        />
      )}
    </div>
  );
}
