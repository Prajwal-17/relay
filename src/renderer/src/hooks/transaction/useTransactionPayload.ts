import { useBillingStore } from "@/store/billingStore";
import { useLineItemsStore } from "@/store/lineItemsStore";
import { normalizeLineItems, normalizeOriginalLineItems, stripLineItems } from "@/utils";
import { TRANSACTION_TYPE } from "@shared/types";
import deepEqual from "fast-deep-equal";
import { useMemo } from "react";

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

  const { originalCleaned, currentCleaned } = useMemo(
    () => stripLineItems(normalizedOriginalLineItems, normalizedLineItems),
    [normalizedLineItems, normalizedOriginalLineItems]
  );

  const isDirty = useMemo(() => {
    const isLineItemsDirty = !deepEqual(originalCleaned, currentCleaned);

    const isCustomerDirty = customerId !== originalCustomerId;

    const isBillingDateDirty =
      billingDate instanceof Date && originalBillingDate instanceof Date
        ? billingDate.getTime() !== originalBillingDate.getTime()
        : billingDate !== originalBillingDate;

    return isLineItemsDirty || isCustomerDirty || isBillingDateDirty;
  }, [
    originalCleaned,
    currentCleaned,
    customerId,
    originalCustomerId,
    billingDate,
    originalBillingDate
  ]);

  const payload = useMemo(() => {
    if (!transactionNo || !customerId) return null;

    return {
      billingType: billingType,
      id: billingId,
      payload: {
        isAutoSave: true,
        data: {
          transactionNo: transactionNo,
          transactionType: billingType,
          customerId: customerId,
          isPaid: billingType === TRANSACTION_TYPE.SALE,
          items: normalizedLineItems,
          createdAt:
            billingDate instanceof Date
              ? billingDate.toISOString()
              : new Date(billingDate).toISOString()
        }
      }
    };
  }, [billingId, billingType, transactionNo, billingDate, customerId, normalizedLineItems]);

  return {
    isDirty,
    payload
  };
};

export default useTransactionPayload;
