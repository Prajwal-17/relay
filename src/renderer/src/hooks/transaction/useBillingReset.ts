import { useBillingStore } from "@/store/billingStore";
import { useLineItemsStore } from "@/store/lineItemsStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import { useEffect } from "react";

const useBillingReset = (type: any, id: any) => {
  useEffect(() => {
    useBillingStore.getState().reset();
    useLineItemsStore.getState().reset();
    useSearchDropdownStore.getState().reset();
  }, [type, id]);
};

export default useBillingReset;
