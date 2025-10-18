import type { LineItemsType } from "@/store/billingStore";
import { useReceiptRefStore } from "@/store/useReceiptRefStore";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import useTransactionState from "./useTransactionState";

export const useTransactionActions = (transactionType: "sales" | "estimates") => {
  const navigate = useNavigate();
  const {
    lineItems,
    transactionNo,
    customerId,
    customerName,
    customerContact,
    billingId,
    billingDate,
    clearTransactionState
  } = useTransactionState();

  const receiptRef = useReceiptRefStore((state) => state.receiptRef);
  const handlePrint = useReactToPrint({
    contentRef: receiptRef || undefined
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
    items: [
      ...lineItems
        .filter((item: LineItemsType) => item.name !== "")
        .map((item: LineItemsType) => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          weight: item.weight,
          unit: item.unit,
          quantity: item.quantity,
          mrp: item.mrp,
          price: item.price,
          purchasePrice: item.purchasePrice,
          totalPrice: item.totalPrice
        }))
    ]
  };

  async function handleSave() {
    try {
      let responseObj;
      if (transactionType === "sales") {
        const response = await window.salesApi.save({
          ...payload,
          invoiceNo: Number(transactionNo)
        });
        if (response.status === "success") {
          toast.success(response.message ?? "Sale Saved Successfully");
          return {
            ...responseObj,
            id: response.data.id,
            type: response.data.type,
            status: "success"
          };
        } else {
          toast.error(response.error.message);
          return { ...responseObj, id: "", type: "", status: "error" };
        }
      } else if (transactionType === "estimates") {
        const response = await window.estimatesApi.save({
          ...payload,
          estimateNo: Number(transactionNo)
        });
        if (response.status === "success") {
          toast.success(response.message ?? "Estimate Saved successfully");
          return {
            ...responseObj,
            id: response.data.id,
            type: response.data.type,
            status: "success"
          };
        } else {
          toast.error(response.error.message);
          return { ...responseObj, id: "", type: "", status: "error" };
        }
      }
      return responseObj;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  const handleAction = async (type: "save" | "save&print" | "sendViaWhatsapp") => {
    const isSaveSuccessfull = await handleSave();
    if (!isSaveSuccessfull) return;

    if (type === "save&print") {
      if (!receiptRef || !receiptRef.current) {
        toast.error("There is nothing to print");
        return;
      }
      try {
        await handlePrint();
      } catch (error) {
        toast.error("Something went wrong");
        console.log(error);
      }
    }
    if (type === "sendViaWhatsapp") {
      if (!isSaveSuccessfull) {
        toast.error("Something went wrong saving");
      }

      const response = await window.shareApi.sendViaWhatsapp(
        isSaveSuccessfull.id,
        isSaveSuccessfull.type
      );

      if (response.status === "success") {
        toast.success(response.data);
      } else {
        toast.error(response.error.message);
      }
    }

    clearTransactionState();
    navigate("/");
  };

  return {
    receiptRef,
    handleAction,
    calcTotalAmount
  };
};
