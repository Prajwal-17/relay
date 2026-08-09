import { cn } from "@/lib/utils";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import { useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import { AlertCircle, CheckCircle2, Circle, Loader2 } from "lucide-react";

export const BillingSaveStatus = () => {
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const status = useBillingSessionStore((state) =>
    activeTabId ? (state.sessions[activeTabId]?.status ?? "idle") : "idle"
  );
  const currentStatus = status === "idle" ? "saved" : status;

  return (
    <div
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-semibold ring-1 transition-colors duration-150",
        currentStatus === "saving" && "bg-selected text-foreground ring-border",
        currentStatus === "saved" && "bg-success text-success-foreground ring-success",
        currentStatus === "unsaved" && "bg-warning text-warning-foreground ring-warning",
        currentStatus === "error" && "bg-destructive text-destructive-foreground ring-destructive"
      )}
    >
      {currentStatus === "saving" && (
        <>
          <Loader2 size={15} className="animate-spin" />
          <span>Saving...</span>
        </>
      )}

      {currentStatus === "saved" && (
        <>
          <CheckCircle2 size={15} />
          <span>Saved</span>
        </>
      )}

      {currentStatus === "unsaved" && (
        <>
          <Circle size={13} className="fill-current" />
          <span>Unsaved Changes</span>
        </>
      )}

      {currentStatus === "error" && (
        <>
          <AlertCircle size={15} />
          <span>Save Failed</span>
        </>
      )}
    </div>
  );
};
