import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppPreferences } from "@/hooks/useAppPreferences";
import { cn } from "@/lib/utils";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { processSyncQueue } from "@/utils/syncWorker";
import { TRANSACTION_TYPE } from "@shared/types";
import { Check, Plus, Undo2 } from "lucide-react";

const SaleAccountControl = ({ className }: { className?: string }) => {
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

  const tooltip = disabled
    ? "Select a named customer first."
    : session.addToAccounting
      ? `Undo adding this sale to ${session.customerName}'s ledger.`
      : `Add the full sale total to ${session.customerName}'s ledger when saved.`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "border-border bg-background text-foreground flex h-9 w-44 shrink-0 items-center overflow-hidden rounded-(--radius-control) border text-xs font-semibold transition-colors duration-150 ease-out",
            disabled && "bg-muted text-muted-foreground",
            session.addToAccounting && !disabled && "border-success",
            className
          )}
        >
          {session.addToAccounting ? (
            <>
              <span
                role="status"
                className={cn(
                  "flex h-full min-w-0 flex-1 items-center justify-center gap-1.5 px-2 transition-colors duration-150",
                  !disabled && "bg-success text-success-foreground"
                )}
              >
                <Check className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 size-3.5 motion-safe:duration-150" />
                Added
              </span>
              <button
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                aria-label="Undo adding this sale to the customer account"
                className="border-border bg-background text-foreground hover:bg-muted focus-visible:ring-ring/50 disabled:bg-muted disabled:text-muted-foreground flex h-full min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 border-l px-2 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Undo2 className="size-3.5" />
                Undo
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleToggle}
              disabled={disabled}
              aria-label="Add this sale to the customer account"
              className="hover:bg-muted focus-visible:ring-ring/50 disabled:bg-muted disabled:text-muted-foreground flex h-full w-full cursor-pointer items-center justify-center gap-1.5 px-2 outline-none focus-visible:ring-2 focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Plus className="size-3.5" />
              Add to account
            </button>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8} className="max-w-64">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
};

export default SaleAccountControl;
