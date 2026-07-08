import { EmptyTab } from "./shared/EmptyTab";
import { DetailHeader } from "./DetailHeader";
import { DetailTabs } from "./DetailTabs";
import type { CustomerMock } from "../_mock/types";
import { UserX } from "lucide-react";

/**
 * Level 2 — detail shell. Composes the sticky header (breadcrumb, identity,
 * outstanding, actions) with the 9-tab workspace.
 */
export function CustomerDetailPage({
  customer,
  onBack,
  onEdit,
  onRecordPayment,
  onOpenSearch
}: {
  customer: CustomerMock | null;
  onBack: () => void;
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
    <div className="flex h-full w-full flex-col gap-4 overflow-auto p-4">
      <DetailHeader
        customer={customer}
        onBack={onBack}
        onEdit={onEdit}
        onRecordPayment={onRecordPayment}
        onOpenSearch={onOpenSearch}
      />
      <DetailTabs customer={customer} onRecordPayment={onRecordPayment} />
    </div>
  );
}
