import { ViewModal } from "@/features/dashboard/ViewModal";
import { useViewModalStore } from "@/store/viewModalStore";
import { CUSTOMER_DETAIL_TAB, type CustomerDetailTab } from "@/types";
import { DASHBOARD_TYPE, type DashboardType } from "@shared/types";
import { UserX } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { CustomerMock } from "../_mock/types";
import { DetailHeader } from "./DetailHeader";
import { DetailTabs } from "./DetailTabs";
import { EmptyTab } from "./shared/EmptyTab";

const VALID_TABS = Object.values(CUSTOMER_DETAIL_TAB);

export function CustomerDetailPage({
  customerId,
  customer
}: {
  customerId: string;
  customer: CustomerMock | null;
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
      <DetailHeader customer={customer} />
      <DetailTabs customerId={customerId} customer={customer} value={activeTab} onTabChange={handleTabChange} />
      {isViewModalOpen && <ViewModal type={viewModalType} id={transactionId} />}
    </div>
  );
}
