import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { useBillingSessionStore } from "@/store/billing/useBillingSessionStore";
import { convertToRupees, formatToRupees } from "@shared/utils/utils";

const useTransaction = () => {
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const lineItems = useBillingSessionStore((state) =>
    activeTabId ? (state.sessions[activeTabId]?.lineItems ?? []) : []
  );

  const total = lineItems.reduce((sum, currentItem) => {
    return sum + Number(currentItem.totalPrice || 0);
  }, 0);

  const subtotal = formatToRupees(total);
  const temp = Math.round(convertToRupees(total));
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
