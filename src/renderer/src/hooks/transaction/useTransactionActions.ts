import { useBillingStore } from "@/store/billingStore";
import { useLineItemsStore } from "@/store/lineItemsStore";
import { useReceiptRefStore } from "@/store/useReceiptRefStore";
import { txnPayloadSchema } from "@shared/schemas/transaction.schema";
import { TRANSACTION_TYPE, type ApiResponse, type TransactionType } from "@shared/types";
import { formatToRupees, IndianRupees } from "@shared/utils/utils";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";

const saveTransaction = async (
  id: string | null,
  transactionType: TransactionType,
  payload: any
) => {
  try {
    if (transactionType === TRANSACTION_TYPE.SALE) {
      if (id) {
        const response = await fetch(`http://localhost:3000/api/sales/${id}/edit`, {
          method: "POST",
          headers: {
            "Content-type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (data.status === "success") {
          return data;
        } else {
          throw new Error(data.error.message);
        }
      }
      const response = await fetch("http://localhost:3000/api/sales/create", {
        method: "POST",
        headers: {
          "Content-type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.status === "success") {
        return data;
      } else {
        throw new Error(data.error.message);
      }
    } else if (transactionType === TRANSACTION_TYPE.ESTIMATE) {
      if (id) {
        const response = await fetch(`http://localhost:3000/api/estimates/${id}/edit`, {
          method: "POST",
          headers: {
            "Content-type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (data.status === "success") {
          return data;
        } else {
          throw new Error(data.error.message);
        }
      }
      const response = await fetch("http://localhost:3000/api/estimates/create", {
        method: "POST",
        headers: {
          "Content-type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.status === "success") {
        return data;
      } else {
        throw new Error(data.error.message);
      }
    }
    throw new Error("Something went wrong");
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export const useTransactionActions = (transactionType: TransactionType) => {
  const navigate = useNavigate();

  // Billing store state
  const transactionNo = useBillingStore((state) => state.transactionNo);
  const customerId = useBillingStore((state) => state.customerId);
  const customerName = useBillingStore((state) => state.customerName);
  const billingId = useBillingStore((state) => state.billingId);
  const billingDate = useBillingStore((state) => state.billingDate);

  // Line items store state
  const lineItems = useLineItemsStore((state) => state.lineItems);

  const receiptRef = useReceiptRefStore((state) => state.receiptRef);
  const handlePrint = useReactToPrint({
    contentRef: receiptRef || undefined
  });

  const total = lineItems.reduce((sum, currentItem) => {
    return sum + Number(currentItem.totalPrice || 0);
  }, 0);

  const subtotal = IndianRupees.format(formatToRupees(total));
  const grandTotal = IndianRupees.format(Math.round(formatToRupees(total)));

  const payload = {
    transactionNo,
    transactionType,
    customerId,
    customerName,
    isPaid: transactionType === TRANSACTION_TYPE.SALE ? true : false,
    items: lineItems.filter((item) => {
      return item.productId !== null && item.name !== "" && parseFloat(item.price) !== 0;
    }),
    createdAt: billingDate.toISOString()
  };

  const handleActionMutation = useMutation<
    ApiResponse<{ id: string; type: TransactionType }>,
    Error,
    "save" | "save&print" | "saveAsPDF"
  >({
    mutationFn: async (type: "save" | "save&print" | "saveAsPDF") => {
      const parseResult = txnPayloadSchema.safeParse(payload);

      if (!parseResult.success) {
        const errorMessage = parseResult.error.issues[0].message;
        throw new Error(errorMessage);
      }

      const saveResponse = await saveTransaction(billingId, transactionType, payload);

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
        // Fix
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
    subtotal,
    grandTotal,
    receiptRef,
    handleActionMutation
  };
};
