import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
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
