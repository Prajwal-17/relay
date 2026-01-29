import { useLineItemsStore } from "@/store/lineItemsStore";
import { formatToRupees, IndianRupees } from "@shared/utils/utils";

const useTransaction = () => {
  const lineItems = useLineItemsStore((state) => state.lineItems);

  const total = lineItems.reduce((sum, currentItem) => {
    return sum + Number(currentItem.totalPrice || 0);
  }, 0);

  const subtotal = IndianRupees.format(formatToRupees(total));
  const grandTotal = IndianRupees.format(Math.round(formatToRupees(total)));

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
