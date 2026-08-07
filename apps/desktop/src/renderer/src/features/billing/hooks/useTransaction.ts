import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import { useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import { formatRupee, paisaToRupees } from "@shared/utils/utils";

const useTransaction = () => {
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const lineItems = useBillingSessionStore((state) =>
    activeTabId ? (state.sessions[activeTabId]?.lineItems ?? []) : []
  );

  const total = lineItems.reduce((sum, currentItem) => {
    return sum + Number(currentItem.totalPrice || 0);
  }, 0);

  const subtotal = formatRupee(total);
  const temp = Math.round(paisaToRupees(total));
  const grandTotal = Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2
  }).format(temp);

  const calcTotalQuantity = lineItems.reduce((sum, currentItem) => {
    return sum + (Number(currentItem.quantity) || 0);
  }, 0);

  return {
    subtotal,
    grandTotal,
    calcTotalQuantity
  };
};

export default useTransaction;
