import { useBillingStore } from "@/store/billingStore";
import { useEffect } from "react";
import { toast } from "sonner";

const useLoadTransactionDetails = (type: "sale" | "estimate", transactionId: string | null) => {
  const setInvoiceNo = useBillingStore((state) => state.setInvoiceNo);
  const setLineItems = useBillingStore((state) => state.setLineItems);
  const setCustomerName = useBillingStore((state) => state.setCustomerName);
  const setCustomerContact = useBillingStore((state) => state.setCustomerContact);
  const setBillingId = useBillingStore((state) => state.setBillingId);

  useEffect(() => {
    async function fetchTransactionById() {
      if (!transactionId) return;
      setBillingId("");
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
          setInvoiceNo(response.data.invoiceNo);
          setCustomerContact(response.data.customerContact);
          setCustomerName(response.data.customerName);
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
    setCustomerName,
    setCustomerContact,
    setInvoiceNo,
    setLineItems
  ]);

  return {};
};
export default useLoadTransactionDetails;
