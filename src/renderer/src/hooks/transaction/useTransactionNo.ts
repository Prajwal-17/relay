import { useBillingStore } from "@/store/billingStore";
import { TRANSACTION_TYPE, type TransactionType } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";

const getLatestTransactionNo = async (type: TransactionType) => {
  try {
    let reqResponse;
    if (type === TRANSACTION_TYPE.SALE) {
      const response = await fetch("http://localhost:3000/api/sales/next-number", {
        method: "GET"
      });
      reqResponse = await response.json();
    } else if (type === TRANSACTION_TYPE.ESTIMATE) {
      const response = await fetch("http://localhost:3000/api/estimates/next-number", {
        method: "GET"
      });
      reqResponse = await response.json();
    } else {
      throw new Error("Transaction Type is undefined");
    }
    if (reqResponse.status === "success") {
      return reqResponse;
    }
    throw new Error(reqResponse.error.message);
  } catch (error) {
    console.log(error);
    throw new Error((error as Error).message);
  }
};

const useTransactionNo = (formattedType: TransactionType, id?: string) => {
  const setTransactionNo = useBillingStore((state) => state.setTransactionNo);

  const { data, isFetched, isError, error } = useQuery({
    queryKey: [formattedType, "getTransactionNo"],
    // null assertion - type cannot be null here
    queryFn: () => getLatestTransactionNo(formattedType),
    enabled:
      !id &&
      (formattedType === TRANSACTION_TYPE.SALE || formattedType === TRANSACTION_TYPE.ESTIMATE)
  });

  useEffect(() => {
    if (!isFetched && !data) {
      return;
    }
    setTransactionNo(data.data);
  }, [data, setTransactionNo, isFetched]);

  useEffect(() => {
    if (isError) {
      toast.error(error.message);
    }
  }, [isError, error]);
};
export default useTransactionNo;
