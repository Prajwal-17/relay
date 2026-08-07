import { useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import { useReceiptRefStore } from "@/features/billing/store/receiptRef.store";
import { useCallback, useRef } from "react";
import { useReactToPrint } from "react-to-print";

const useReceiptPrint = () => {
  const proxyRef = useRef<HTMLDivElement | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: proxyRef as React.RefObject<HTMLDivElement>
  });

  const printReceipt = useCallback(async (): Promise<boolean> => {
    const activeTabId = useBillingTabsStore.getState().activeTabId;
    if (!activeTabId) return false;

    const receiptRef = useReceiptRefStore.getState().getReceiptRef(activeTabId);
    if (!receiptRef?.current) return false;

    proxyRef.current = receiptRef.current;

    await handlePrint();
    return true;
  }, [handlePrint]);

  return { printReceipt };
};

export default useReceiptPrint;
