import BillingHeader from "@/features/billing/BillingHeader";
import BillingSkeleton from "@/features/billing/BillingSkeleton";
import BillPreview from "@/features/billing/BillPreview";
import LineItemsTable from "@/features/billing/LineItemsTable";
import { ProductDialogWrapper } from "@/features/billing/ProductDailogWrapper";
import { SummaryFooter } from "@/features/billing/SummaryFooter";
import BillingTabBar from "@/features/billing/tabs/BillingTabBar";
import useReset from "@/hooks/transaction/useBillingReset";
import useInitialBillingData from "@/hooks/transaction/useInitialBillingData";
import useLoadTransactionDetails from "@/hooks/transaction/useLoadTransactionDetails";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { useBillingSessionStore } from "@/store/billing/useBillingSessionStore";
import { TRANSACTION_TYPE, type TransactionType } from "@shared/types";
import { useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";

const BillingPage = () => {
  const { type, id } = useParams();
  const { pathname } = useLocation();
  const formattedType = type?.slice(0, -1) as TransactionType;
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const initSession = useBillingSessionStore((state) => state.initSession);
  const session = useBillingSessionStore((state) =>
    activeTabId ? state.sessions[activeTabId] : undefined
  );

  // synchronous state reset
  useReset(formattedType, id);

  useInitialBillingData(formattedType, activeTabId, id);
  const transactionNo = session?.transactionNo ?? null;

  // register current route as a tab on mount
  const tabRegistered = useRef(false);
  useEffect(() => {
    if (!formattedType) return;
    const store = useBillingTabsStore.getState();
    const activeTab = store.activeTabId
      ? store.tabs.find((tab) => tab.id === store.activeTabId)
      : undefined;

    // If current active tab already matches this route, keep it.
    if (activeTab && activeTab.routePath === pathname) {
      tabRegistered.current = true;
      return;
    }

    const existing = store.findTabByRoute(pathname);
    if (existing) {
      store.setActiveTab(existing.id);
    } else {
      store.addTab(formattedType, pathname, id ? (transactionNo ?? null) : null);
    }
    tabRegistered.current = true;
  }, [pathname, formattedType, id, transactionNo]);

  useEffect(() => {
    if (!transactionNo || !tabRegistered.current) return;
    const store = useBillingTabsStore.getState();
    const tab = store.findTabByRoute(pathname);
    if (tab && tab.transactionNo !== transactionNo) {
      store.updateTab(tab.id, { transactionNo });
    }
  }, [transactionNo, pathname]);

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
      <div className="flex flex-1 gap-2 overflow-hidden">
        <div className="bg-background-secondary relative flex h-full flex-1 flex-col">
          <div className="flex-1 overflow-y-auto">
            <BillingHeader />
            <LineItemsTable />
          </div>
          <SummaryFooter />
        </div>
        <BillPreview />
        <ProductDialogWrapper />
      </div>
    </div>
  );
};

export default BillingPage;
