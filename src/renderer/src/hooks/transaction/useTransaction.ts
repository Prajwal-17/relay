import { useLineItemsStore } from "@/store/lineItemsStore";
import { formatToRupees } from "@shared/utils/utils";

const useTransaction = () => {
  const lineItems = useLineItemsStore((state) => state.lineItems);

  const total = lineItems.reduce((sum, currentItem) => {
    return sum + Number(currentItem.totalPrice || 0);
  }, 0);

  const subtotal = formatToRupees(total);
  const grandTotal = formatToRupees(Math.round(total));

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
