import { useBillingStore } from "@/store/billingStore";
import { useEffect } from "react";
import toast from "react-hot-toast";

const useLoadTransactionDetails = (type: "sale" | "estimate", transactionId: string | null) => {
  const setInvoiceNo = useBillingStore((state) => state.setInvoiceNo);
  const setLineItems = useBillingStore((state) => state.setLineItems);
  const setCustomerName = useBillingStore((state) => state.setCustomerName);
  const setCustomerContact = useBillingStore((state) => state.setCustomerContact);
  const setBillingId = useBillingStore((state) => state.setBillingId);
  const setCustomerId = useBillingStore((state) => state.setCustomerId);
  const setBillingDate = useBillingStore((state) => state.setBillingDate);

  useEffect(() => {
    async function fetchTransactionById() {
      if (!transactionId) return;
      setBillingId("");
      setInvoiceNo(null);
      setCustomerId("");
      setCustomerName("");
      setCustomerContact("");
      setLineItems([]);
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
          setCustomerContact(response.data.customerContact);
          setCustomerName(response.data.customerName);
          setBillingDate(new Date(response.data.createdAt));
          setLineItems(response.data.items);
        } else {
          toast.error(response.error.message);
        }
      } catch (error) {
        console.log(error);
      }
    }
    fetchTransactionById();
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
