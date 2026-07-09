import { UserX } from "lucide-react";
import type { CustomerMock } from "../_mock/types";
import { DetailHeader } from "./DetailHeader";
import { DetailTabs } from "./DetailTabs";
import { EmptyTab } from "./shared/EmptyTab";

export function CustomerDetailPage({
  customer,
  onEdit,
  onRecordPayment,
  onOpenSearch
}: {
  customer: CustomerMock | null;
  onEdit: () => void;
  onRecordPayment: () => void;
  onOpenSearch: () => void;
}) {
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
      <DetailTabs customer={customer} onRecordPayment={onRecordPayment} />
    </div>
  );
}
