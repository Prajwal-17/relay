import { Button } from "@/components/ui/button";
import useReceiptPrint from "@/features/billing/hooks/useReceiptPrint";
import useTransaction from "@/features/billing/hooks/useTransaction";
import { useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import { flushSync, forceSync } from "@/features/billing/syncWorker";
import { TRANSACTION_TYPE } from "@shared/types";
import { ArrowUpRight, FileText, Loader2, Printer, Save } from "lucide-react";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { Navigate, useNavigate, useParams } from "react-router-dom";

export const SummaryFooter = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();

  const activeTabId = useBillingTabsStore((state) => state.activeTabId);

  const { subtotal, grandTotal } = useTransaction();
  const { printReceipt } = useReceiptPrint();

  type LoadingAction = "print" | "exit" | "pdf" | null;
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);

  const waitForSync = useCallback(async (): Promise<boolean> => {
    if (!activeTabId) return false;
    try {
      forceSync(activeTabId);
      await flushSync(activeTabId);
      return true;
    } catch (error) {
      console.error("Sync flush failed:", error);
      toast.error("Failed to save changes. Please try again.");
      return false;
    }
  }, [activeTabId]);

  const handleSaveAndPrint = useCallback(async () => {
    setLoadingAction("print");
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
      setLoadingAction(null);
    }
  }, [waitForSync, printReceipt, navigate, type]);

  const handleSaveAndExit = useCallback(async () => {
    setLoadingAction("exit");
    try {
      const synced = await waitForSync();
      if (!synced) return;
      toast.success("Saved Successfully");
      navigate(`/dashboard/${type}`);
    } catch (error) {
      console.error("Save & Exit failed", error);
      toast.error("Failed to save. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  }, [waitForSync, navigate, type]);

  const handleExportPdf = useCallback(async () => {
    if (!id || !type) {
      toast.error("Save this bill before exporting a PDF.");
      return;
    }
    setLoadingAction("pdf");
    try {
      const synced = await waitForSync();
      if (!synced) return;
      const txnType = type === "sales" ? TRANSACTION_TYPE.SALE : TRANSACTION_TYPE.ESTIMATE;
      const response = await window.exportApi.exportAsPdf(id, txnType);
      if (response && response.status === "success") {
        const filePath = response.data;
        toast.success(
          (t) => (
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-medium">PDF saved successfully</span>
              <button
                onClick={() => {
                  window.exportApi.showItemInFolder(filePath);
                  toast.dismiss(t.id);
                }}
                className="text-foreground/70 hover:text-foreground inline-flex items-center gap-0.5 text-sm font-medium transition-colors hover:underline"
              >
                Open
                <ArrowUpRight size={18} />
              </button>
            </div>
          ),
          { duration: 4000 }
        );
        navigate(`/dashboard/${type}`);
      } else {
        toast.error(response?.error?.message || "Failed to generate PDF");
      }
    } catch (error) {
      console.error("PDF Export failed", error);
      toast.error("Failed to export PDF");
    } finally {
      setLoadingAction(null);
    }
  }, [id, type, waitForSync, navigate]);

  if (!type) {
    return <Navigate to="/not-found" />;
  }

  return (
    <footer className="bg-card border-t-frame flex h-13 shrink-0 items-center justify-end gap-3 border-t px-3">
      <div className="hidden items-baseline gap-1.5 min-[1100px]:flex">
        <span className="text-muted-foreground text-xs font-medium">Subtotal</span>
        <span className="text-sm font-semibold tabular-nums">{subtotal}</span>
      </div>

      <div className="bg-border hidden h-6 w-px min-[1100px]:block" />

      <div className="flex items-baseline gap-1.5 pr-1">
        <span className="text-muted-foreground text-xs font-semibold">Total</span>
        <span className="financial-nums text-foreground font-bold">{grandTotal}</span>
      </div>

      <div className="bg-border h-6 w-px" />

      <Button
        size="lg"
        disabled={loadingAction !== null}
        onClick={handleSaveAndPrint}
        className="bg-primary hover:bg-primary-hover text-primary-foreground min-w-36"
      >
        {loadingAction === "print" ? <Loader2 className="animate-spin" /> : <Printer />}
        {loadingAction === "print" ? "Saving..." : "Save & Print"}
      </Button>

      <Button variant="outline" disabled={loadingAction !== null} onClick={handleSaveAndExit}>
        {loadingAction === "exit" ? <Loader2 className="animate-spin" /> : <Save />}
        {loadingAction === "exit" ? "Saving..." : "Save & Exit"}
      </Button>

      <Button
        variant="outline"
        disabled={loadingAction !== null}
        onClick={handleExportPdf}
        title={!id ? "Save the bill before exporting a PDF" : "Save as PDF"}
      >
        {loadingAction === "pdf" ? <Loader2 className="animate-spin" /> : <FileText />}
        {loadingAction === "pdf" ? "Saving..." : "Save PDF"}
      </Button>
    </footer>
  );
};
