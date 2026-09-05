import { Button } from "@/components/ui/button";
import useRawReceiptPrint from "@/features/billing/hooks/useRawReceiptPrint";
import useTransaction from "@/features/billing/hooks/useTransaction";
import { billingCoordinator } from "@/features/billing/store/billingCoordinator";
import { useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import { flushSync } from "@/features/billing/syncWorker";
import { showPdfExportSuccessToast } from "@/features/transactions/pdfExportToast";
import { FileText, Loader2, Printer, X } from "lucide-react";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { Navigate, useNavigate, useParams } from "react-router-dom";

const RASTER_FALLBACK_MESSAGE =
  "Printed using device text because the high-quality receipt could not be prepared";

function warnIfRasterFellBack(fellBack: boolean) {
  if (fellBack) toast(RASTER_FALLBACK_MESSAGE, { icon: "⚠️" });
}

export const SummaryFooter = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();

  const activeTabId = useBillingTabsStore((state) => state.activeTabId);

  const { subtotal, grandTotal } = useTransaction();
  const { printReceipt } = useRawReceiptPrint();

  type LoadingAction = "print" | "close" | "pdf" | null;
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);

  const waitForSync = useCallback(async (): Promise<boolean> => {
    if (!activeTabId) return false;
    try {
      await flushSync(activeTabId);
      return true;
    } catch (error) {
      console.error("Sync flush failed:", error);
      toast.error("Failed to sync changes. Please try again.");
      return false;
    }
  }, [activeTabId]);
  const readSynchronizedSession = useCallback(() => {
    if (!activeTabId) throw new Error("The billing session is no longer available.");
    const session = useBillingSessionStore.getState().sessions[activeTabId];
    if (!session) {
      throw new Error("The billing session is no longer available.");
    }
    return session;
  }, [activeTabId]);

  const closeTabAndNavigate = useCallback(
    (tabId: string) => {
      const newActiveId = billingCoordinator.removeTab(tabId);
      const nextTab = newActiveId
        ? useBillingTabsStore.getState().tabs.find((tab) => tab.id === newActiveId)
        : undefined;

      if (nextTab) {
        navigate(nextTab.routePath);
        return;
      }

      navigate(`/dashboard/${type}`);
    },
    [navigate, type]
  );

  const handlePrintAndClose = useCallback(async () => {
    setLoadingAction("print");
    try {
      const synced = await waitForSync();
      if (!synced || !activeTabId) return;

      const session = readSynchronizedSession();
      const result = await printReceipt(activeTabId, {
        includeUpiQr: session.printOptions.includeUpiQr,
        includeAmountInUpiQr: session.printOptions.includeAmountInUpiQr,
        upiQrProfileId: session.printOptions.selectedUpiQrProfileId
      });
      warnIfRasterFellBack(result.fellBack);
      closeTabAndNavigate(activeTabId);
    } catch (error) {
      console.error("Print failed", error);
      toast.error(error instanceof Error ? error.message : "Print failed.");
    } finally {
      setLoadingAction(null);
    }
  }, [activeTabId, closeTabAndNavigate, printReceipt, readSynchronizedSession, waitForSync]);
  const handleCloseTab = useCallback(async () => {
    const tabId = activeTabId;
    if (!tabId) return;

    setLoadingAction("close");
    try {
      const synced = await waitForSync();
      if (!synced) return;
      closeTabAndNavigate(tabId);
    } catch (error) {
      console.error("Close tab failed", error);
      toast.error("Changes could not be synced. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  }, [activeTabId, closeTabAndNavigate, waitForSync]);

  const handleExportPdf = useCallback(async () => {
    if (!activeTabId || !type) {
      toast.error("The billing session is no longer available.");
      return;
    }
    setLoadingAction("pdf");
    try {
      const synced = await waitForSync();
      if (!synced) return;
      const session = readSynchronizedSession();
      if (!session.billingId) {
        throw new Error("This bill must finish syncing before it can be exported.");
      }
      const response = await window.exportApi.exportAsPdf(session.billingId, session.billingType);
      if (response && response.status === "success") {
        showPdfExportSuccessToast(response.data);
      } else {
        toast.error(response?.error?.message || "Failed to generate PDF");
      }
    } catch (error) {
      console.error("PDF Export failed", error);
      toast.error("Failed to export PDF");
    } finally {
      setLoadingAction(null);
    }
  }, [activeTabId, type, waitForSync, readSynchronizedSession]);

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
        onClick={handlePrintAndClose}
        className="bg-primary hover:bg-primary-hover text-primary-foreground min-w-36"
      >
        {loadingAction === "print" ? <Loader2 className="animate-spin" /> : <Printer />}
        {loadingAction === "print" ? "Printing…" : "Print & Close"}
      </Button>

      <Button variant="outline" disabled={loadingAction !== null} onClick={handleCloseTab}>
        {loadingAction === "close" ? <Loader2 className="animate-spin" /> : <X />}
        {loadingAction === "close" ? "Closing…" : "Close Tab"}
      </Button>

      <Button
        variant="outline"
        disabled={loadingAction !== null}
        onClick={handleExportPdf}
        title={!id ? "Sync the bill and export it as PDF" : "Export PDF"}
      >
        {loadingAction === "pdf" ? <Loader2 className="animate-spin" /> : <FileText />}
        {loadingAction === "pdf" ? "Exporting…" : "Export PDF"}
      </Button>
    </footer>
  );
};
