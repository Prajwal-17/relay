import { Button } from "@/components/ui/button";
import useReceiptPrint from "@/hooks/billing/useReceiptPrint";
import useTransaction from "@/hooks/billing/useTransaction";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { flushSync } from "@/utils/syncWorker";
import { FileText, Loader2, Printer, Save } from "lucide-react";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { Navigate, useNavigate, useParams } from "react-router-dom";

export const SummaryFooter = () => {
  const { type } = useParams();
  const navigate = useNavigate();

  const activeTabId = useBillingTabsStore((state) => state.activeTabId);

  const { subtotal, grandTotal } = useTransaction();
  const { printReceipt } = useReceiptPrint();

  const [isBusy, setIsBusy] = useState(false);

  const waitForSync = useCallback(async (): Promise<boolean> => {
    if (!activeTabId) return false;
    try {
      await flushSync(activeTabId);
      return true;
    } catch (error) {
      console.error("Sync flush failed:", error);
      toast.error("Failed to save changes. Please try again.");
      return false;
    }
  }, [activeTabId]);

  const handleSaveAndPrint = useCallback(async () => {
    setIsBusy(true);
    try {
      const synced = await waitForSync();
      if (!synced) return;

      const printed = await printReceipt();
      if (!printed) {
        toast.error("Nothing to print — receipt not ready");
        return;
      }
      navigate(`/dashboard/${type}`);
    } catch (error) {
      console.error("Print failed", error);
      toast.error("Print failed");
    } finally {
      setIsBusy(false);
    }
  }, [waitForSync, printReceipt, navigate, type]);

  const handleSaveAndExit = useCallback(async () => {
    setIsBusy(true);
    try {
      const synced = await waitForSync();
      if (!synced) return;
      toast.success("Saved Successfully");
      navigate("/");
    } catch (error) {
      console.error("Save & Exit failed", error);
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsBusy(false);
    }
  }, [waitForSync, navigate]);

  if (!type) {
    return <Navigate to="/not-found" />;
  }

  return (
    <footer className="absolute right-6 bottom-1 z-20">
      <div className="bg-background/60 border-border/50 flex items-center gap-6 rounded-lg border py-1.5 pr-1.5 pl-6 shadow-xl backdrop-blur-xs">
        <div className="flex items-end gap-6">
          <div className="flex items-end gap-2">
            <span className="text-muted-foreground self-end text-sm font-semibold uppercase">
              Subtotal:
            </span>
            <span className="text-foreground text-xl font-semibold">{subtotal}</span>
          </div>

          <div className="bg-border/60 h-8 w-px shrink-0" />

          <div className="flex items-end gap-2">
            <span className="text-muted-foreground self-end text-sm font-semibold uppercase">
              Total:
            </span>
            <span className="text-foreground text-3xl font-bold">{grandTotal}</span>
          </div>
        </div>

        <div className="bg-border/60 h-8 w-px shrink-0" />

        <div className="flex items-center gap-3">
          <Button
            variant="default"
            className="hover:bg-primary/90 h-12 cursor-pointer gap-3 rounded-lg px-6! text-lg font-semibold shadow-sm"
            disabled={isBusy}
            onClick={handleSaveAndPrint}
          >
            {isBusy ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
            {isBusy ? "Saving..." : "Save & Print"}
          </Button>

          <Button
            variant="outline"
            className="border-border/60 hover:bg-accent/50 h-12 cursor-pointer gap-3 rounded-lg px-6! text-lg font-medium transition-colors"
            disabled={isBusy}
            onClick={handleSaveAndExit}
          >
            {isBusy ? (
              <Loader2 size={18} className="text-muted-foreground animate-spin" />
            ) : (
              <Save size={18} className="text-muted-foreground" />
            )}
            {isBusy ? "Saving..." : "Save & Exit"}
          </Button>

          <Button
            variant="outline"
            className="border-border/60 hover:bg-accent/50 h-12 cursor-pointer gap-3 rounded-lg px-6! text-lg font-medium transition-colors"
            disabled={isBusy}
          >
            <FileText size={18} className="text-muted-foreground" />
            Save PDF
          </Button>
        </div>
      </div>
    </footer>
  );
};
