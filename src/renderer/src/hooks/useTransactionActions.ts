import { useRef } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import useTransactionState from "./useTransactionState";

export const useTransactionActions = (transactionType: "sales" | "estimates") => {
  const navigate = useNavigate();
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const {
    lineItems,
    setLineItems,
    invoiceNo,
    setInvoiceNo,
    customerId,
    setCustomerId,
    customerName,
    setCustomerName,
    customerContact,
    setCustomerContact,
    billingId,
    setBillingId,
    billingDate
  } = useTransactionState();

  const handlePrint = useReactToPrint({
    contentRef: receiptRef
  });

  const calcTotalAmount = lineItems.reduce((sum, currentItem) => {
    return sum + Number(currentItem.totalPrice || 0);
  }, 0);

  const calcTotalQuantity = lineItems.reduce((sum, currentItem) => {
    return sum + currentItem.quantity;
  }, 0);

  const payload = {
    billingId: billingId,
    customerId,
    customerName,
    customerContact,
    grandTotal: calcTotalAmount,
    totalQuantity: calcTotalQuantity,
    isPaid: true,
    createdAt: billingDate.toISOString(),
    items: [...lineItems]
  };

  async function handleSave() {
    try {
      if (transactionType === "sales") {
        const response = await window.salesApi.save({ ...payload, invoiceNo: Number(invoiceNo) });
        if (response.status === "success") {
          toast.success("Sale Saved successfully");
          setBillingId("");
          setCustomerId("");
          setInvoiceNo(null);
          setCustomerName("");
          setCustomerContact("");
          setLineItems([]);
          navigate("/");
          return true;
        } else {
          toast.error(response.error.message);
          return false;
        }
      } else if (transactionType === "estimates") {
        const response = await window.estimatesApi.save({
          ...payload,
          estimateNo: Number(invoiceNo)
        });
        if (response.status === "success") {
          toast.success("Estimate Saved successfully");
          setBillingId("");
          setCustomerId("");
          setInvoiceNo(null);
          setCustomerName("");
          setCustomerContact("");
          setLineItems([]);
          navigate("/");
          return true;
        } else {
          toast.error(response.error.message);
          return false;
        }
      }
      return false;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  const handleAction = async (type: "save" | "save&print") => {
    const isSaveSuccessfull = await handleSave();
    if (!receiptRef) {
      console.log("no ref ", receiptRef);
    }
    if (isSaveSuccessfull && type === "save&print" && receiptRef) {
      console.log("here");
      console.log("receipt ref", receiptRef.current);
      handlePrint();
    }
  };

  return {
    receiptRef,
    handleAction,
    calcTotalAmount
  };
};
