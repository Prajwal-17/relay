import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import { useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import { useSearchDropdownStore } from "@/features/billing/product-search/searchDropdown.store";
import { useEffect, useRef } from "react";

const useBillingReset = (type: any, id: any) => {
  const prevIdRef = useRef(id);

  useEffect(() => {
    const prevId = prevIdRef.current;
    prevIdRef.current = id;

    if (prevId === undefined && id !== undefined) {
      return;
    }

    useSearchDropdownStore.getState().reset();
  }, [type, id]);

  useEffect(() => {
    return () => {
      useBillingTabsStore.getState().reset();
      useBillingSessionStore.setState({ sessions: {} });
      useSearchDropdownStore.getState().reset();
    };
  }, []);
};

export default useBillingReset;
