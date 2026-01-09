import { formatToRupees, IndianRupees } from "@shared/utils/utils";
import useTransactionState from "./useTransactionState";

const useTransaction = () => {
  const { lineItems } = useTransactionState();

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
