import BillingHeader from "@/features/billing/BillingHeader";
import BillingSkeleton from "@/features/billing/BillingSkeleton";
import BillingPreviewPanel from "@/features/billing/preview/BillingPreviewPanel";
import LineItemsTable from "@/features/billing/LineItemsTable";
import BillingNotes from "@/features/billing/BillingNotes";
import { ProductDialogWrapper } from "@/features/billing/ProductDailogWrapper";
import { SummaryFooter } from "@/features/billing/SummaryFooter";
import BillingTabBar from "@/features/billing/tabs/BillingTabBar";
import { useActiveTabId } from "@/hooks/billing/useActiveTabId";
import useReset from "@/hooks/billing/useBillingReset";
import { useInitialBillingData } from "@/hooks/billing/useInitialBillingData";
import useLoadTransactionDetails from "@/hooks/billing/useLoadTransactionDetails";
import { billingCoordinator } from "@/store/billing/billingCoordinator";
import type { PrefillCustomer } from "@/store/billing/billingSession.types";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { TRANSACTION_TYPE, type TransactionType } from "@shared/types";
import { useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const BillingPage = () => {
  const navigate = useNavigate();
  const { type, id } = useParams();
  const { pathname, state } = useLocation();
  const formattedType = type?.slice(0, -1) as TransactionType;

  const prefillCustomer =
    (state as { prefillCustomer?: PrefillCustomer } | null)?.prefillCustomer ?? null;

  const { activeTabId } = useActiveTabId();

  const initSession = useBillingSessionStore((state) => state.initSession);
  const session = useBillingSessionStore((state) =>
    activeTabId ? state.sessions[activeTabId] : undefined
  );

  // synchronous state reset
  useReset(formattedType, id);

  useInitialBillingData(formattedType, activeTabId, id, prefillCustomer);
  const transactionNo = session?.transactionNo ?? null;

  const activeTabRoutePath = useBillingTabsStore((state) =>
    activeTabId ? state.tabs.find((t) => t.id === activeTabId)?.routePath : undefined
  );

  const prevPathname = useRef(pathname);
  const prevActiveRoute = useRef(activeTabRoutePath);

  useEffect(() => {
    if (!formattedType) return;

    const pathChanged = pathname !== prevPathname.current;
    const routeChanged = activeTabRoutePath !== prevActiveRoute.current;

    // update refs AFTER computing deltas
    prevPathname.current = pathname;
    prevActiveRoute.current = activeTabRoutePath;

    // handlers worker url update
    // to sync browser URL with the zustand store
    if (routeChanged && !pathChanged) {
      if (activeTabRoutePath && activeTabRoutePath !== pathname) {
        navigate(activeTabRoutePath, { replace: true });
      }
      return; // to stop from adding new tab
    }

    // handles user navigation (sidebar, click, manual or 1st mount)
    // only act only if the URL is changed
    const store = useBillingTabsStore.getState();
    const activeTab = activeTabId ? store.tabs.find((tab) => tab.id === activeTabId) : undefined;

    if (activeTab && activeTab.routePath === pathname) {
      return;
    }

    const existing = store.findTabByRoute(pathname);

    if (existing) {
      if (existing.id !== activeTabId) {
        // existing -> make it active
        store.setActiveTab(existing.id);
      }
    } else {
      // new tab
      billingCoordinator.addTab(formattedType, pathname, id ? (transactionNo ?? null) : null);
    }
  }, [pathname, activeTabRoutePath, formattedType, id, transactionNo, activeTabId, navigate]);

  // update billing type in store -> based on route
  useEffect(() => {
    if (!activeTabId) return;
    if (formattedType && Object.values(TRANSACTION_TYPE).includes(formattedType)) {
      useBillingSessionStore.getState().updateField(activeTabId, "billingType", formattedType);
    }
  }, [formattedType, activeTabId]);

  useEffect(() => {
    return () => {
      localStorage.setItem("bill-preview-date", new Date().toISOString());
    };
  }, [type, id]);

  useEffect(() => {
    if (!activeTabId) return;
    initSession(activeTabId);
  }, [activeTabId, initSession]);

  const { isLoading } = useLoadTransactionDetails(
    formattedType as TransactionType,
    id,
    activeTabId
  );

  if (isLoading) {
    return <BillingSkeleton />;
  }
  if (!activeTabId) {
    return <BillingSkeleton />;
  }
  if (!session) {
    return <BillingSkeleton />;
  }

  return (
    <div className="flex h-full flex-col">
      <BillingTabBar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="bg-background-secondary relative flex min-w-0 flex-1 flex-col">
          <div data-billing-scroll-container className="min-h-0 flex-1 overflow-y-auto">
            <BillingHeader />
            <LineItemsTable />
            <div className="mx-3 mt-2 mb-3">
              <BillingNotes />
            </div>
          </div>
          <SummaryFooter />
        </div>
        <BillingPreviewPanel />
        <ProductDialogWrapper />
      </div>
    </div>
  );
};

export default BillingPage;
