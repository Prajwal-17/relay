import { useAppPreferences } from "@/hooks/useAppPreferences";
import { cn } from "@/lib/utils";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { processSyncQueue } from "@/utils/syncWorker";
import { TRANSACTION_TYPE } from "@shared/types";
import { BookOpen, Check, Plus } from "lucide-react";

const PaymentSection = ({ className }: { className?: string }) => {
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const session = useBillingSessionStore((state) =>
    activeTabId ? state.sessions[activeTabId] : null
  );
  const updateField = useBillingSessionStore((state) => state.updateField);
  const { config } = useAppPreferences();

  if (!session || session.billingType !== TRANSACTION_TYPE.SALE) return null;

  const defaultCustomerId = config?.billing.defaultCustomerId;
  const hasNamedCustomer = Boolean(session.customerId && session.customerName.trim());
  const isDefaultCustomer = Boolean(
    session.customerId &&
    (session.customerId === defaultCustomerId || session.customerName === "DEFAULT")
  );
  const disabled = !hasNamedCustomer || isDefaultCustomer;

  const handleToggle = () => {
    if (!activeTabId || disabled) return;
    updateField(activeTabId, "addToAccounting", !session.addToAccounting);
    processSyncQueue(activeTabId);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      aria-pressed={session.addToAccounting}
      aria-describedby="sale-accounting-help"
      className={cn(
        "border-border bg-card flex min-h-14 w-full items-center gap-3 rounded-(--radius-panel) border px-3 py-2 text-left transition-colors outline-none",
        "hover:bg-muted focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
        "disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed",
        session.addToAccounting && !disabled && "border-success bg-card",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "bg-secondary text-foreground flex size-8 shrink-0 items-center justify-center rounded-(--radius-control)",
          session.addToAccounting && !disabled && "bg-success text-success-foreground"
        )}
      >
        <BookOpen className="size-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="text-foreground block text-sm font-semibold">
          {session.addToAccounting ? "Sale marked for account" : "Add sale to account"}
        </span>
        <span id="sale-accounting-help" className="text-muted-foreground block text-xs">
          {disabled
            ? "Select a named customer first."
            : session.addToAccounting
              ? "The full total will be added to the customer ledger when saved."
              : "Track the full sale total in the customer ledger."}
        </span>
      </span>

      <span
        aria-hidden="true"
        className={cn(
          "border-border bg-background text-foreground flex h-8 min-w-20 shrink-0 items-center justify-center gap-1.5 rounded-(--radius-control) border px-2 text-xs font-semibold",
          session.addToAccounting &&
            !disabled &&
            "border-success bg-success text-success-foreground"
        )}
      >
        {session.addToAccounting ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
        {session.addToAccounting ? "Selected" : "Add"}
      </span>
    </button>
  );
};

export default PaymentSection;
