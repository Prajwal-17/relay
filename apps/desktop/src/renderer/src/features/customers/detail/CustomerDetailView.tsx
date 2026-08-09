import { TransactionDetailsDialog } from "@/features/transactions/TransactionDetailsDialog";
import { useViewModalStore } from "@/features/transactions/store/viewModal.store";
import { CUSTOMER_DETAIL_TAB, type CustomerDetailTab } from "@/types/renderer.types";
import { DASHBOARD_TYPE, type Customer, type DashboardType } from "@shared/types";
import { UserX } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { DetailHeader } from "./DetailHeader";
import { DetailTabs } from "./DetailTabs";
import { EmptyTab } from "./EmptyTab";

const VALID_TABS = Object.values(CUSTOMER_DETAIL_TAB);

export function CustomerDetailView({
  customerId,
  customer
}: {
  customerId: string;
  customer: Customer | null;
}) {
  const isViewModalOpen = useViewModalStore((state) => state.isViewModalOpen);
  const transactionId = useViewModalStore((state) => state.transactionId);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: CustomerDetailTab = VALID_TABS.includes(tabParam as CustomerDetailTab)
    ? (tabParam as CustomerDetailTab)
    : CUSTOMER_DETAIL_TAB.OVERVIEW;

  const handleTabChange = (tab: CustomerDetailTab) => {
    setSearchParams({ tab }, { replace: true });
  };

  const viewModalType: DashboardType =
    activeTab === CUSTOMER_DETAIL_TAB.ESTIMATES ? DASHBOARD_TYPE.ESTIMATES : DASHBOARD_TYPE.SALES;

  if (!customer) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <EmptyTab
          icon={UserX}
          title="Customer not found"
          description="This customer no longer exists. Head back to the list to pick another."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <DetailHeader customer={customer} activeTab={activeTab} />
      <DetailTabs
        customerId={customerId}
        customer={customer}
        value={activeTab}
        onTabChange={handleTabChange}
      />
      {isViewModalOpen && <TransactionDetailsDialog type={viewModalType} id={transactionId} />}
    </div>
  );
}
