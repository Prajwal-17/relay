import { cn } from "@/lib/utils";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
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
        "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-base font-semibold ring-1 transition-colors duration-300",
        currentStatus === "saving" && "bg-info/15 text-info ring-info/25",
        currentStatus === "saved" && "bg-success/15 text-success ring-success/25",
        currentStatus === "unsaved" && "bg-warning/15 text-warning ring-warning/25",
        currentStatus === "error" && "bg-destructive/15 text-destructive ring-destructive/25"
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
          <span>Saved Changes</span>
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
