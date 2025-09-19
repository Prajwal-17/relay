import { formatDateStrToISTDateObject } from "@shared/utils/dateUtils";
import { useEffect } from "react";
import toast from "react-hot-toast";
import useTransactionState from "./useTransactionState";

const useLoadTransactionDetails = (type: "sale" | "estimate", transactionId: string | null) => {
  const {
    setInvoiceNo,
    setLineItems,
    setCustomerName,
    setCustomerContact,
    setBillingId,
    setCustomerId,
    setBillingDate,
    clearTransactionState
  } = useTransactionState();

  useEffect(() => {
    async function fetchTransactionById() {
      if (!transactionId) return;
      clearTransactionState();
      try {
        let response;
        if (type === "sale") {
          response = await window.salesApi.getTransactionById(transactionId);
        } else if (type === "estimate") {
          response = await window.estimatesApi.getTransactionById(transactionId);
        } else {
          toast.error("Something went wrong");
        }
        if (response.status === "success") {
          setBillingId(response.data.id);
          setCustomerId(response.data.customerId);
          setInvoiceNo(response.data.invoiceNo || response.data.estimateNo);
          setCustomerContact(response.data.customer.contact);
          setCustomerName(response.data.customer.name);
          setBillingDate(formatDateStrToISTDateObject(response.data.createdAt));
          localStorage.setItem(
            "bill-preview-date",
            formatDateStrToISTDateObject(response.data.createdAt).toISOString()
          );
          setLineItems(response.data.items);
        } else {
          toast.error(response.error.message);
        }
      } catch (error) {
        console.log(error);
      }
    }
    fetchTransactionById();
    // adding `clearTransactionState` to deps is unnecessary & causes infinte re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    type,
    transactionId,
    setBillingId,
    setCustomerId,
    setCustomerName,
    setCustomerContact,
    setInvoiceNo,
    setBillingDate,
    setLineItems
  ]);

  return {};
};
export default useLoadTransactionDetails;
