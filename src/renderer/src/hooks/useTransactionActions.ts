import type { LineItemsType } from "@/store/billingStore";
import { useReceiptRefStore } from "@/store/useReceiptRefStore";
import { TRANSACTION_TYPE, type ApiResponse, type TransactionType } from "@shared/types";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import useTransactionState from "./useTransactionState";

const handleSave = async (
  transactionType: TransactionType,
  transactionNo: number,
  payload: any
) => {
  try {
    if (transactionType === TRANSACTION_TYPE.SALES) {
      const response = await window.salesApi.save({
        ...payload,
        invoiceNo: Number(transactionNo)
      });
      if (response.status === "success") {
        return response;
      } else {
        throw new Error(response.error.message);
      }
    } else if (transactionType === TRANSACTION_TYPE.ESTIMATES) {
      const response = await window.estimatesApi.save({
        ...payload,
        estimateNo: Number(transactionNo)
      });
      if (response.status === "success") {
        return response;
      } else {
        throw new Error(response.error.message);
      }
    }
    throw new Error("Something went wrong");
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export const useTransactionActions = (transactionType: TransactionType) => {
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

  const handleActionMutation = useMutation<
    ApiResponse<{ id: string; type: TransactionType }>,
    Error,
    "save" | "save&print" | "saveAsPDF"
  >({
    mutationFn: async (type: "save" | "save&print" | "saveAsPDF") => {
      if (!transactionNo) {
        throw new Error("Missing transaction number");
      }
      const saveResponse = await handleSave(transactionType, transactionNo, payload);

      if (type === "save&print") {
        if (!receiptRef?.current) {
          toast.error("There is nothing to print");
        } else {
          try {
            await handlePrint();
          } catch (error) {
            toast.error("Something went wrong while printing");
            console.error(error);
          }
        }
      }

      if (type === "saveAsPDF") {
        const response = await window.shareApi.saveAsPDF(
          saveResponse.data.id,
          saveResponse.data.type
        );

        if (response.status === "success") {
          toast.success("Receipt successfully saved as a PDF.");
        } else {
          toast.error(response.error.message || "Failed to save PDF");
        }
      }
      return saveResponse;
    },
    onSuccess: (response) => {
      if (response.status === "success") {
        toast.success(response.message ?? "Save Successfull");
        clearTransactionState();
        navigate("/");
      } else if (response.status === "error") {
        toast.error(response.error.message);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  return {
    receiptRef,
    handleActionMutation,
    calcTotalAmount
  };
};
