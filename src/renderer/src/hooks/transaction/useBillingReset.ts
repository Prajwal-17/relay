import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import { useEffect } from "react";

const useBillingReset = (type: any, id: any) => {
  useEffect(() => {
    useSearchDropdownStore.getState().reset();
  }, [type, id]);
};

export default useBillingReset;
