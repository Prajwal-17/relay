import { Button } from "@/components/ui/button";
import useReceiptPrint from "@/hooks/billing/useReceiptPrint";
import useTransaction from "@/hooks/billing/useTransaction";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { flushSync, forceSync } from "@/utils/syncWorker";
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
      navigate("/");
    } catch (error) {
      console.error("Save & Exit failed", error);
      toast.error("Failed to save. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  }, [waitForSync, navigate]);

  const handleExportPdf = useCallback(async () => {
    if (!id || !type) return;
    setLoadingAction("pdf");
    try {
      const synced = await waitForSync();
      if (!synced) return;
      const txnType = type === "sales" ? TRANSACTION_TYPE.SALE : TRANSACTION_TYPE.ESTIMATE;
      const response = await window.exportApi.exportAsPdf(id, txnType);
      if (response && (response as any).status === "success") {
        const filePath = (response as any).data as string;
        toast.success(
          (t) => (
            <div className="flex items-center gap-4 whitespace-nowrap">
              <span className="font-medium">PDF saved successfully</span>
              <button
                onClick={() => {
                  window.exportApi.showItemInFolder(filePath);
                  toast.dismiss(t.id);
                }}
                className="text-foreground/70 hover:text-foreground inline-flex items-center gap-0.5 text-xl font-medium transition-colors hover:underline"
              >
                Open
                <ArrowUpRight size={18} />
              </button>
            </div>
          ),
          { duration: 4000, style: { maxWidth: "fit-content" } }
        );
        navigate(`/dashboard/${type}`);
      } else {
        toast.error((response as any)?.error?.message || "Failed to generate PDF");
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
    <footer className="absolute right-6 bottom-1 z-20">
      <div className="bg-background/80 border-border/50 flex items-center gap-6 rounded-lg border py-1.5 pr-1.5 pl-6 shadow-xl backdrop-blur-xs">
        <div className="flex items-end gap-6">
          <div className="flex items-end gap-2">
            <span className="text-muted-foreground self-end text-sm font-semibold uppercase">
              Subtotal:
            </span>
            <span className="text-foreground text-lg font-semibold">{subtotal}</span>
          </div>

          <div className="bg-border/60 h-8 w-px shrink-0" />

          <div className="flex items-end gap-2">
            <span className="text-muted-foreground self-end text-sm font-semibold uppercase">
              Total:
            </span>
            <span className="text-foreground text-2xl font-bold">{grandTotal}</span>
          </div>
        </div>

        <div className="bg-border/60 h-8 w-px shrink-0" />

        <div className="flex items-center gap-3">
          <Button
            variant="default"
            className="hover:bg-primary/90 h-10 cursor-pointer gap-3 rounded-lg px-5 text-base font-semibold shadow-sm"
            disabled={loadingAction !== null}
            onClick={handleSaveAndPrint}
          >
            {loadingAction === "print" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Printer size={18} />
            )}
            {loadingAction === "print" ? "Saving..." : "Save & Print"}
          </Button>

          <Button
            variant="outline"
            className="border-border/60 hover:bg-accent/50 h-10 cursor-pointer gap-3 rounded-lg px-5 text-base font-medium transition-colors"
            disabled={loadingAction !== null}
            onClick={handleSaveAndExit}
          >
            {loadingAction === "exit" ? (
              <Loader2 size={18} className="text-muted-foreground animate-spin" />
            ) : (
              <Save size={18} className="text-muted-foreground" />
            )}
            {loadingAction === "exit" ? "Saving..." : "Save & Exit"}
          </Button>

          <Button
            variant="outline"
            className="border-border/60 hover:bg-accent/50 h-10 cursor-pointer gap-3 rounded-lg px-5 text-base font-medium transition-colors"
            disabled={loadingAction !== null}
            onClick={handleExportPdf}
          >
            {loadingAction === "pdf" ? (
              <Loader2 size={18} className="text-muted-foreground animate-spin" />
            ) : (
              <FileText size={18} className="text-muted-foreground" />
            )}
            {loadingAction === "pdf" ? "Saving..." : "Save PDF"}
          </Button>
        </div>
      </div>
    </footer>
  );
};
