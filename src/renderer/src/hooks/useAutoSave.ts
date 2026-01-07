import { type LineItem } from "@/store/lineItemsStore";
import { TRANSACTION_TYPE, type TransactionType, type TxnPayload } from "@shared/types";
import { useMutation } from "@tanstack/react-query";
import deepEqual from "fast-deep-equal";
import { useEffect } from "react";
import toast from "react-hot-toast";
import useTransactionState from "./useTransactionState";

type MutationData = {
  billingType: TransactionType;
  id: string | null;
  payload: TxnPayload;
};

// create sale or estimate
// const handleCreate

const handleAutoSave = async (id: string, billType: TransactionType) => {
  try {
    if (billType === TRANSACTION_TYPE.SALE) {
      const response = await fetch(`http://localhost:3000/api/sales/${id}`, {
        method: "POST",
        headers: {
          "Content-type": "application/json"
        },
        body: JSON.stringify()
      });
    }
  } catch (error) {
    console.log(error);
  }
};

export const useAutoSave = () => {
  const {
    originalLineItems,
    lineItems,
    status,
    setStatus,
    billingType,
    transactionNo,
    customerId,
    customerName,
    customerContact,
    billingId,
    billingDate
  } = useTransactionState();

  const hasData = "";

  function normalizeData(originalLineItems: LineItem[], lineItems: LineItem[]) {
    // remove the initial line item to compare with originalLineitems
    const filteredLineitems = lineItems.filter(
      (item) =>
        item.productSnapshot.trim().length > 0 &&
        parseFloat(item.price) > 0 &&
        parseFloat(item.quantity) > 0 &&
        item.totalPrice > 0
    );

    const normalizedLineitems = filteredLineitems.map((item) => {
      return {
        ...item,
        price: parseFloat(item.price),
        quantity: parseFloat(item.quantity)
      };
    });

    // stip off object fields in an array for comparision
    /* eslint-disable */
    const stripedOriginalLineItems = originalLineItems.map(({ id, rowId, ...rest }) => rest);
    const stripedLineItems = filteredLineitems.map(({ id, rowId, ...rest }) => rest);
    /* eslint-enable */

    return {
      originalCleaned: stripedOriginalLineItems,
      currentCleaned: stripedLineItems,
      normalizedLineitems
    };
  }

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
            console.log("data", data);

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
      setStatus("saved");
      // update original line items , live line items
      setTimeout(() => setStatus("saved"), 2000);
      // if (response.status === "success") {
      //   // toast.success(response.message ?? "Save Successfull");
      //   // navigate("/");
      // } else if (response.status === "error") {
      //   toast.error(response.error.message + "here");
      // }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  useEffect(() => {
    // if !has data  return
    console.log("line items", lineItems);

    const { originalCleaned, currentCleaned, normalizedLineitems } = normalizeData(
      originalLineItems,
      lineItems
    );

    const isDirty = !deepEqual(originalCleaned, currentCleaned);
    console.log("isdirty", isDirty);

    // only switch to unsaved if we are not saving
    // error
    if (isDirty && status !== "saving") {
      setStatus("unsaved");
    }

    // add error
    if (status === "saving" || status === "saved" || status === "idle") {
      console.log(status);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        // FIX
        if (!transactionNo) {
          return;
        }

        setStatus("saving");
        // FIX
        handleAutoSaveMutation.mutate({
          billingType,
          id: billingId,
          payload: {
            isAutoSave: true,
            data: {
              transactionNo,
              transactionType: billingType,
              customerId,
              customerName,
              customerContact: customerContact ?? "",
              isPaid: billingType === TRANSACTION_TYPE.SALE ? true : false,
              items: normalizedLineitems,
              createdAt: billingDate.toISOString()
            }
          }
        });
      } catch (error) {
        console.log(error);
      }
    }, 2000);

    return () => clearTimeout(handler);
  }, [
    originalLineItems,
    lineItems,
    status,
    setStatus,
    billingType,
    billingDate,
    billingId,
    customerContact,
    customerId,
    customerName,
    transactionNo,
    handleAutoSaveMutation
  ]);

  return {};
};
