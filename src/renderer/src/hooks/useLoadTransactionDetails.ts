import {
  TRANSACTION_TYPE,
  type TransactionType,
  type UnifiedTransctionWithItems
} from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";
import useTransactionState from "./useTransactionState";

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
  const {
    setBillingType,
    setTransactionNo,
    setLineItems,
    setCustomerName,
    setCustomerContact,
    setBillingId,
    setCustomerId,
    setBillingDate
  } = useTransactionState();

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
      setCustomerId(data.customerId);
      setCustomerName(data.customer.name);
      setCustomerContact(data.customer.contact);
      setLineItems(data.items);
    }
  }, [
    isSuccess,
    data,
    setBillingId,
    setBillingType,
    setTransactionNo,
    setBillingDate,
    setCustomerId,
    setCustomerName,
    setCustomerContact,
    setLineItems
  ]);
  return { status, isLoading, isFetched };
};

export default useLoadTransactionDetails;
