import { normalizeLineItems, normalizeOriginalLineItems, stripLineItems } from "@/utils";
import { TRANSACTION_TYPE } from "@shared/types";
import deepEqual from "fast-deep-equal";
import { useMemo } from "react";
import useTransactionState from "./useTransactionState";

const useTransactionPayload = () => {
  const state = useTransactionState();

  const normalizedLineItems = useMemo(() => normalizeLineItems(state.lineItems), [state.lineItems]);

  const normalizedOriginalLineItems = useMemo(
    () => normalizeOriginalLineItems(state.originalLineItems),
    [state.originalLineItems]
  );

  const { originalCleaned, currentCleaned } = useMemo(
    () => stripLineItems(normalizedOriginalLineItems, normalizedLineItems),
    [normalizedLineItems, normalizedOriginalLineItems]
  );

  const isDirty = useMemo(
    () => !deepEqual(originalCleaned, currentCleaned),
    [originalCleaned, currentCleaned]
  );

  const payload = useMemo(() => {
    if (!state.transactionNo) return null;
    console.log("id", state.billingId);

    return {
      billingType: state.billingType,
      id: state.billingId,
      payload: {
        isAutoSave: true,
        data: {
          transactionNo: state.transactionNo,
          transactionType: state.billingType,
          customerId: state.customerId,
          customerName: state.customerName,
          customerContact: state.customerContact ?? null,
          isPaid: state.billingType === TRANSACTION_TYPE.SALE,
          items: normalizedLineItems,
          createdAt:
            state.billingDate instanceof Date
              ? state.billingDate.toISOString()
              : new Date(state.billingDate).toISOString()
        }
      }
    };
  }, [state, normalizedLineItems]);

  return {
    isDirty,
    payload
  };
};

export default useTransactionPayload;
