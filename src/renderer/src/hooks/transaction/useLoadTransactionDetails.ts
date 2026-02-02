import { useBillingStore } from "@/store/billingStore";
import { useLineItemsStore } from "@/store/lineItemsStore";
import {
  TRANSACTION_TYPE,
  type TransactionType,
  type UnifiedTransctionWithItems
} from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";

const fetchTransactionById = async (pathname: TransactionType, transactionId: string) => {
  try {
    if (!transactionId) {
      throw new Error("Transaction Id does not exist");
    }
    let data;
    if (pathname === TRANSACTION_TYPE.SALE) {
      const response = await fetch(`http://localhost:3000/api/sales/${transactionId}`, {
        method: "GET"
      });
      data = await response.json();
      if (data.status === "success") return data;
    } else if (pathname === TRANSACTION_TYPE.ESTIMATE) {
      const response = await fetch(`http://localhost:3000/api/estimates/${transactionId}`, {
        method: "GET"
      });
      data = await response.json();
      if (data.status === "success") return data;
    } else {
      throw new Error("Something went wrong");
    }
    return data;
  } catch (error) {
    throw new Error((error as Error).message ?? "Something went wrong");
  }
};

const useLoadTransactionDetails = (type: TransactionType, id?: string) => {
  // Billing store setters
  const setBillingId = useBillingStore((state) => state.setBillingId);
  const setBillingType = useBillingStore((state) => state.setBillingType);
  const setTransactionNo = useBillingStore((state) => state.setTransactionNo);
  const setBillingDate = useBillingStore((state) => state.setBillingDate);
  const setOriginalBillingDate = useBillingStore((state) => state.setOriginalBillingDate);
  const setCustomerId = useBillingStore((state) => state.setCustomerId);
  const setCustomerName = useBillingStore((state) => state.setCustomerName);

  // Line items store setters
  const setLineItems = useLineItemsStore((state) => state.setLineItems);
  const setOriginalLineItems = useLineItemsStore((state) => state.setOriginalLineItems);

  const { data, isSuccess, isLoading, status, isFetched, isError, error } = useQuery({
    queryKey: [type, id],
    queryFn: async () => {
      if (!id) throw new Error("Transaction Id does not exist");
      return fetchTransactionById(type, id);
    },
    enabled: !!id && (type === TRANSACTION_TYPE.SALE || type === TRANSACTION_TYPE.ESTIMATE),
    select: (response) => {
      if (response?.status === "success") {
        return response.data as UnifiedTransctionWithItems;
      } else if (response?.status === "error") {
        throw new Error(response?.error?.message);
      }
      throw new Error("Something went wrong");
    }
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(error.message);
    }
  }, [isError, error]);

  useEffect(() => {
    if (isSuccess && data) {
      setBillingId(data.id);
      setBillingType(data.type);
      setTransactionNo(data.transactionNo);
      setBillingDate(new Date(data.createdAt as string));
      setOriginalBillingDate(new Date(data.createdAt as string));
      setCustomerId(data.customerId);
      setCustomerName(data.customer.name);
      setLineItems(data.items);
      setOriginalLineItems();
    }
  }, [
    isSuccess,
    data,
    setBillingId,
    setBillingType,
    setTransactionNo,
    setBillingDate,
    setOriginalBillingDate,
    setCustomerId,
    setCustomerName,
    setLineItems,
    setOriginalLineItems
  ]);
  return { status, isLoading, isFetched };
};

export default useLoadTransactionDetails;
