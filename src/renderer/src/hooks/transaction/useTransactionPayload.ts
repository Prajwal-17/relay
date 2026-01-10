import { useBillingStore } from "@/store/billingStore";
import { useLineItemsStore } from "@/store/lineItemsStore";
import { normalizeLineItems, normalizeOriginalLineItems, stripLineItems } from "@/utils";
import { TRANSACTION_TYPE } from "@shared/types";
import deepEqual from "fast-deep-equal";
import { useMemo } from "react";

const useTransactionPayload = () => {
  // Billing store state
  const billingId = useBillingStore((state) => state.billingId);
  const billingType = useBillingStore((state) => state.billingType);
  const transactionNo = useBillingStore((state) => state.transactionNo);
  const billingDate = useBillingStore((state) => state.billingDate);
  const customerId = useBillingStore((state) => state.customerId);
  const customerName = useBillingStore((state) => state.customerName);
  const customerContact = useBillingStore((state) => state.customerContact);

  // Line items store state
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

  const isDirty = useMemo(
    () => !deepEqual(originalCleaned, currentCleaned),
    [originalCleaned, currentCleaned]
  );

  const payload = useMemo(() => {
    if (!transactionNo) return null;
    console.log("id", billingId);

    return {
      billingType: billingType,
      id: billingId,
      payload: {
        isAutoSave: true,
        data: {
          transactionNo: transactionNo,
          transactionType: billingType,
          customerId: customerId,
          customerName: customerName,
          customerContact: customerContact ?? null,
          isPaid: billingType === TRANSACTION_TYPE.SALE,
          items: normalizedLineItems,
          createdAt:
            billingDate instanceof Date
              ? billingDate.toISOString()
              : new Date(billingDate).toISOString()
        }
      }
    };
  }, [
    billingId,
    billingType,
    transactionNo,
    billingDate,
    customerId,
    customerName,
    customerContact,
    normalizedLineItems
  ]);

  return {
    isDirty,
    payload
  };
};

export default useTransactionPayload;
