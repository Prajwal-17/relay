import { useBillingStore } from "@/store/billingStore";
import { useLineItemsStore } from "@/store/lineItemsStore";
import { normalizeLineItems, normalizeOriginalLineItems, stripLineItems } from "@/utils";
import { TRANSACTION_TYPE } from "@shared/types";
import deepEqual from "fast-deep-equal";
import { useMemo } from "react";
import useDebounce from "../useDebounce";

const useTransactionPayload = () => {
  const billingId = useBillingStore((state) => state.billingId);
  const billingType = useBillingStore((state) => state.billingType);
  const transactionNo = useBillingStore((state) => state.transactionNo);
  const billingDate = useBillingStore((state) => state.billingDate);
  const originalBillingDate = useBillingStore((state) => state.originalBillingDate);
  const customerId = useBillingStore((state) => state.customerId);
  const originalCustomerId = useBillingStore((state) => state.originalCustomerId);
  const lineItems = useLineItemsStore((state) => state.lineItems);
  const originalLineItems = useLineItemsStore((state) => state.originalLineItems);

  const normalizedLineItems = useMemo(() => normalizeLineItems(lineItems), [lineItems]);

  const normalizedOriginalLineItems = useMemo(
    () => normalizeOriginalLineItems(originalLineItems),
    [originalLineItems]
  );

  // debounce building payload every time
  const dependencyState = useMemo(
    () => ({
      normalizedLineItems,
      customerId,
      billingDate
    }),
    [normalizedLineItems, customerId, billingDate]
  );

  const debouncedState = useDebounce(dependencyState, 1000);

  const { originalCleaned, currentCleaned } = useMemo(
    () => stripLineItems(normalizedOriginalLineItems, debouncedState.normalizedLineItems),
    [debouncedState.normalizedLineItems, normalizedOriginalLineItems]
  );

  const isDirty = useMemo(() => {
    const isLineItemsDirty = !deepEqual(originalCleaned, currentCleaned);
    const isCustomerDirty = debouncedState.customerId !== originalCustomerId;
    const isBillingDateDirty =
      debouncedState.billingDate instanceof Date && originalBillingDate instanceof Date
        ? debouncedState.billingDate.getTime() !== originalBillingDate.getTime()
        : debouncedState.billingDate !== originalBillingDate;

    return isLineItemsDirty || isCustomerDirty || isBillingDateDirty;
  }, [
    originalCleaned,
    currentCleaned,
    debouncedState.customerId,
    originalCustomerId,
    debouncedState.billingDate,
    originalBillingDate
  ]);

  const payload = useMemo(() => {
    if (!transactionNo || !debouncedState.customerId) return null;

    return {
      billingType: billingType,
      id: billingId,
      payload: {
        isAutoSave: true,
        data: {
          transactionNo: transactionNo,
          transactionType: billingType,
          customerId: debouncedState.customerId,
          isPaid: billingType === TRANSACTION_TYPE.SALE,
          items: debouncedState.normalizedLineItems,
          createdAt:
            debouncedState.billingDate instanceof Date
              ? debouncedState.billingDate.toISOString()
              : new Date(debouncedState.billingDate).toISOString()
        }
      }
    };
  }, [
    billingId,
    billingType,
    transactionNo,
    debouncedState.billingDate,
    debouncedState.customerId,
    debouncedState.normalizedLineItems
  ]);

  return {
    isDirty,
    payload
  };
};

export default useTransactionPayload;
