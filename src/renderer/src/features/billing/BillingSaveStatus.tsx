import useTransactionState from "@/hooks/useTransactionState";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Circle, Loader2 } from "lucide-react";

export const BillingSaveStatus = () => {
  const { status } = useTransactionState();

  const currentStatus = status === "idle" ? "saved" : status;

  return (
    <div
      className={cn(
        "border-border bg-background flex items-center gap-2 rounded-t-xl border-x border-t px-5 py-2 text-sm font-medium transition-colors duration-300",
        currentStatus === "saving" && "text-blue-600 dark:text-blue-400",
        currentStatus === "saved" && "text-green-600 dark:text-green-400",
        currentStatus === "unsaved" && "text-amber-600 dark:text-amber-400",
        currentStatus === "error" && "text-destructive"
      )}
    >
      {currentStatus === "saving" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {currentStatus === "saved" && (
        <>
          <CheckCircle2 className="h-4 w-4" />
          <span>Saved Changes</span>
        </>
      )}
      {currentStatus === "unsaved" && (
        <>
          <Circle className="h-3 w-3 fill-current" />
          <span>Unsaved Changes</span>
        </>
      )}
      {currentStatus === "error" && (
        <>
          <AlertCircle className="h-4 w-4" />
          <span>Save Failed</span>
        </>
      )}
    </div>
  );
};
