import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import { useEffect } from "react";

const useBillingReset = (type: any, id: any) => {
  useEffect(() => {
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
