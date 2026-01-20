import { useBillingStore } from "@/store/billingStore";
import { TRANSACTION_TYPE, type Customer, type TransactionType } from "@shared/types";
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

const getDefaultCustomer = async (): Promise<Customer> => {
  try {
    const response = await fetch("http://localhost:3000/api/customers/default", {
      method: "GET"
    });
    const data = await response.json();
    if (data.status === "success") {
      return data.data;
    }
    throw new Error(data.error?.message || "Failed to fetch default customer");
  } catch (error) {
    console.log(error);
    throw new Error((error as Error).message);
  }
};

const useInitialBillingData = (formattedType: TransactionType, id?: string) => {
  const setTransactionNo = useBillingStore((state) => state.setTransactionNo);
  const setCustomerId = useBillingStore((state) => state.setCustomerId);
  const setCustomerName = useBillingStore((state) => state.setCustomerName);
  const setIsNewCustomer = useBillingStore((state) => state.setIsNewCustomer);

  const shouldFetch =
    !id && (formattedType === TRANSACTION_TYPE.SALE || formattedType === TRANSACTION_TYPE.ESTIMATE);

  const {
    data: transactionData,
    isFetched: isTransactionFetched,
    isError: isTransactionError,
    error: transactionError
  } = useQuery({
    queryKey: [formattedType, "getTransactionNo"],
    queryFn: () => getLatestTransactionNo(formattedType),
    enabled: shouldFetch
  });

  const {
    data: customerData,
    isFetched: isCustomerFetched,
    isError: isCustomerError,
    error: customerError
  } = useQuery({
    queryKey: ["defaultCustomer"],
    queryFn: getDefaultCustomer,
    enabled: shouldFetch
  });

  useEffect(() => {
    if (!isTransactionFetched || !transactionData) {
      return;
    }
    setTransactionNo(transactionData.data);
  }, [transactionData, setTransactionNo, isTransactionFetched]);

  useEffect(() => {
    if (!isCustomerFetched || !customerData) {
      return;
    }
    setCustomerId(customerData.id);
    setCustomerName(customerData.name);
    setIsNewCustomer(false);
  }, [customerData, setCustomerId, setCustomerName, setIsNewCustomer, isCustomerFetched]);

  useEffect(() => {
    if (isTransactionError) {
      toast.error(transactionError.message);
    }
  }, [isTransactionError, transactionError]);

  useEffect(() => {
    if (isCustomerError) {
      toast.error(`Failed to load default customer: ${customerError.message}`);
    }
  }, [isCustomerError, customerError]);
};

export default useInitialBillingData;
