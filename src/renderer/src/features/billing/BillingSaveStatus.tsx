import { cn } from "@/lib/utils";
import { useBillingStore } from "@/store/billingStore";
import { AlertCircle, CheckCircle2, Circle, Loader2 } from "lucide-react";

export const BillingSaveStatus = () => {
  const status = useBillingStore((state) => state.status);
  const currentStatus = status === "idle" ? "saved" : status;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-base font-semibold ring-1 transition-colors duration-300",
        currentStatus === "saving" && "bg-blue-500/15 text-blue-400 ring-blue-400/25",
        currentStatus === "saved" && "bg-success/15 text-success ring-success/25",
        currentStatus === "unsaved" && "bg-amber-500/15 text-amber-400 ring-amber-400/25",
        currentStatus === "error" && "bg-red-500/15 text-red-400 ring-red-400/25"
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
