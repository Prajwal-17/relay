import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { useReceiptRefStore } from "@/store/useReceiptRefStore";
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
