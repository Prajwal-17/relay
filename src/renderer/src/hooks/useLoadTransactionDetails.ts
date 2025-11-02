import {
  TRANSACTION_TYPE,
  type CustomersType,
  type EstimateItemsType,
  type EstimateType,
  type SaleItemsType,
  type SalesType,
  type TransactionType
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
    let response;
    if (pathname === TRANSACTION_TYPE.SALES) {
      response = await window.salesApi.getTransactionById(transactionId);
      if (response.status === "success") {
        return response;
      }
    } else if (pathname === TRANSACTION_TYPE.ESTIMATES) {
      response = await window.estimatesApi.getTransactionById(transactionId);
      if (response.status === "success") {
        return response;
      }
    } else {
      throw new Error("Something went wrong");
    }
  } catch (error) {
    throw new Error((error as Error).message ?? "Something went wrong");
  }
};

const useLoadTransactionDetails = (type: TransactionType, id?: string) => {
  const {
    setTransactionNo,
    setLineItems,
    setCustomerName,
    setCustomerContact,
    setBillingId,
    setCustomerId,
    setBillingDate,
    clearTransactionState
  } = useTransactionState();

  const { data, isSuccess, isLoading, status, isFetched, isError, error } = useQuery({
    queryKey: [type, id],
    queryFn: async () => {
      if (!id) throw new Error("Transaction Id does not exist");
      clearTransactionState();
      return fetchTransactionById(type, id);
    },
    enabled: !!id && (type === TRANSACTION_TYPE.SALES || type === TRANSACTION_TYPE.ESTIMATES)
  });

  useEffect(() => {
    if (isSuccess && data) {
      if (type === TRANSACTION_TYPE.SALES) {
        const res = data as {
          status: string;
          data: SalesType & { customer: CustomersType; items: SaleItemsType[] };
        };
        const d = res.data;
        setBillingId(d.id);
        setCustomerId(d.customerId);
        setTransactionNo(d.invoiceNo);
        setCustomerContact(d.customer.contact);
        setCustomerName(d.customer.name);
        setBillingDate(new Date(d.createdAt as string));
        const items = d.items.map((item) => ({
          id: item.id,
          productId: item.productId ?? "",
          name: item.name,
          weight: item.weight ?? null,
          unit: item.unit ?? null,
          quantity: item.quantity,
          mrp: item.mrp,
          price: item.price,
          purchasePrice: item.purchasePrice,
          totalPrice: item.totalPrice
        }));
        setLineItems([...items]);
      }

      if (type === TRANSACTION_TYPE.ESTIMATES) {
        const res = data as {
          status: string;
          data: EstimateType & { customer: CustomersType; items: EstimateItemsType[] };
        };
        const d = res.data;
        setBillingId(d.id);
        setCustomerId(d.customerId);
        setTransactionNo(d.estimateNo);
        setCustomerContact(d.customer.contact);
        setCustomerName(d.customer.name);
        setBillingDate(new Date(d.createdAt as string));
        const items = d.items.map((item) => ({
          id: item.id,
          productId: item.productId ?? "",
          name: item.name,
          weight: item.weight ?? null,
          unit: item.unit ?? null,
          quantity: item.quantity,
          mrp: item.mrp,
          price: item.price,
          purchasePrice: item.purchasePrice,
          totalPrice: item.totalPrice
        }));
        setLineItems([...items]);
      }
    }
  }, [
    isSuccess,
    data,
    type,
    setBillingDate,
    setBillingId,
    setCustomerContact,
    setCustomerId,
    setCustomerName,
    setTransactionNo,
    setLineItems
  ]);

  useEffect(() => {
    if (isError && error) {
      toast.error(error.message);
    }
  }, [isError, error]);

  return { status, isLoading, isFetched };
};

export default useLoadTransactionDetails;
