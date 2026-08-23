import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import { useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import { filterValidLineItems } from "@/utils/renderer.utils";
import { formatRupee } from "@shared/utils/utils";

const useTransaction = () => {
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const lineItems = useBillingSessionStore((state) =>
    activeTabId ? (state.sessions[activeTabId]?.lineItems ?? []) : []
  );

  const billableItems = filterValidLineItems(lineItems).filter((item) => !item.isDeleted);
  const total = billableItems.reduce((sum, currentItem) => {
    return sum + Number(currentItem.totalPrice || 0);
  }, 0);

  const subtotal = formatRupee(total);
  const grandTotal = formatRupee(total);

  const calcTotalQuantity = billableItems.reduce((sum, currentItem) => {
    return sum + (Number(currentItem.quantity) || 0);
  }, 0);

  return {
    subtotal,
    grandTotal,
    calcTotalQuantity
  };
};

export default useTransaction;
