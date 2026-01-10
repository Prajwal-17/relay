import { useBillingStore } from "@/store/billingStore";
import { useLineItemsStore } from "@/store/lineItemsStore";
import { BILLSTATUS, TRANSACTION_TYPE, type TransactionType, type TxnPayload } from "@shared/types";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";
import useTransactionPayload from "./useTransactionPayload";

type MutationData = {
  billingType: TransactionType;
  id: string | null;
  payload: TxnPayload;
};

// TODO - create sale or estimate

export const useAutoSave = () => {
  const status = useBillingStore((state) => state.status);
  const setStatus = useBillingStore((state) => state.setStatus);
  const updateInternalIds = useLineItemsStore((state) => state.updateInternalIds);

  const { isDirty, payload } = useTransactionPayload();

  // auto save & manual save
  const handleAutoSaveMutation = useMutation({
    mutationFn: async (mutationData: MutationData) => {
      try {
        if (mutationData.billingType === TRANSACTION_TYPE.SALE) {
          if (mutationData.id) {
            const response = await fetch(
              `http://localhost:3000/api/sales/${mutationData.id}/edit`,
              {
                method: "POST",
                headers: {
                  "Content-type": "application/json"
                },
                body: JSON.stringify(mutationData.payload)
              }
            );
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
            body: JSON.stringify(mutationData.payload)
          });
          const data = await response.json();

          if (data.status === "success") {
            return data;
          } else {
            throw new Error(data.error.message);
          }
        } else if (mutationData.billingType === TRANSACTION_TYPE.ESTIMATE) {
          if (mutationData.id) {
            const response = await fetch(
              `http://localhost:3000/api/estimates/${mutationData.id}/edit`,
              {
                method: "POST",
                headers: {
                  "Content-type": "application/json"
                },
                body: JSON.stringify(mutationData.payload)
              }
            );
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
            body: JSON.stringify(mutationData.payload)
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
        console.log(error);
      }
    },
    onSuccess: (response) => {
      if (response.status === "success") {
        setStatus(BILLSTATUS.SAVED);
        updateInternalIds(response.data.items);
        toast.success(response.message ?? "Save Successfull");
        // setTimeout(() => setStatus("saved"), 2000);
        // navigate("/");
      } else if (response.status === "error") {
        toast.error(response.error.message + "here");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  useEffect(() => {
    if (!isDirty) {
      if (status === BILLSTATUS.UNSAVED) setStatus(BILLSTATUS.SAVED);
      return;
    }

    setStatus(BILLSTATUS.UNSAVED);

    const handler = setTimeout(async () => {
      if (!payload) {
        toast.error("Skipping autosave: Missing transactionNo or payload");
        return;
      }

      setStatus(BILLSTATUS.SAVING);
      handleAutoSaveMutation.mutate({ ...payload });
    }, 5000);

    return () => clearTimeout(handler);
  }, [isDirty, payload, status, setStatus, handleAutoSaveMutation]);

  return { status };
};
