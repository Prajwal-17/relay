import { ViewModal } from "@/features/dashboard/ViewModal";
import { useViewModalStore } from "@/store/viewModalStore";
import { CUSTOMER_DETAIL_TAB, type CustomerDetailTab } from "@/types";
import { DASHBOARD_TYPE, type DashboardType } from "@shared/types";
import { UserX } from "lucide-react";
import { useState } from "react";
import type { CustomerMock } from "../_mock/types";
import { DetailHeader } from "./DetailHeader";
import { DetailTabs } from "./DetailTabs";
import { EmptyTab } from "./shared/EmptyTab";

export function CustomerDetailPage({
  customerId,
  customer,
  onEdit,
  onRecordPayment,
  onOpenSearch
}: {
  customerId: string;
  customer: CustomerMock | null;
  onEdit: () => void;
  onRecordPayment: () => void;
  onOpenSearch: () => void;
}) {
  const isViewModalOpen = useViewModalStore((state) => state.isViewModalOpen);
  const transactionId = useViewModalStore((state) => state.transactionId);

  const [activeTab, setActiveTab] = useState<CustomerDetailTab>(CUSTOMER_DETAIL_TAB.OVERVIEW);

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
      <DetailHeader
        customer={customer}
        onEdit={onEdit}
        onRecordPayment={onRecordPayment}
        onOpenSearch={onOpenSearch}
      />
      <DetailTabs
        customerId={customerId}
        customer={customer}
        onRecordPayment={onRecordPayment}
        onActiveTabChange={setActiveTab}
      />
      {isViewModalOpen && <ViewModal type={viewModalType} id={transactionId} />}
    </div>
  );
}
