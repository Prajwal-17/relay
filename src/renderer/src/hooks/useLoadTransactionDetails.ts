import type {
  CustomersType,
  EstimateItemsType,
  EstimateType,
  SaleItemsType,
  SalesType
} from "@shared/types";
import { formatDateStrToISTDateObject } from "@shared/utils/dateUtils";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";
import useTransactionState from "./useTransactionState";

const fetchTransactionById = async (pathname: "sale" | "estimate", transactionId: string) => {
  try {
    if (!transactionId) {
      throw new Error("Transaction Id does not exist");
    }
    let response;
    if (pathname === "sale") {
      response = await window.salesApi.getTransactionById(transactionId);
      if (response.status === "success") {
        return response;
      }
    } else if (pathname === "estimate") {
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

const useLoadTransactionDetails = (pathname: "sale" | "estimate", transactionId: string | null) => {
  const {
    setInvoiceNo,
    setLineItems,
    setCustomerName,
    setCustomerContact,
    setBillingId,
    setCustomerId,
    setBillingDate,
    clearTransactionState
  } = useTransactionState();

  const {
    data: transactionData,
    isLoading,
    status,
    isFetched,
    isError,
    error
  } = useQuery({
    queryKey: [`${pathname}`, transactionId],
    queryFn: () => {
      if (!transactionId) {
        throw new Error("Transaction Id does not exist");
      }
      clearTransactionState();
      return fetchTransactionById(pathname, transactionId);
    },
    select: (
      data:
        | (SalesType & { customer: CustomersType; items: SaleItemsType[] })
        | (EstimateType & { customer: CustomersType; items: EstimateItemsType[] })
    ) => {
      return {
        ...data,
        items: Array.from(
          data?.items.map((i) => ({
            ...i,
            productId: i.productId ?? ""
          }))
        )
      };
    },
    enabled: !!transactionId && ["sale", "estimate"].includes(pathname)
  });

  useEffect(() => {
    if (!isFetched || isLoading || isError || !transactionData) {
      return;
    }

    const t = transactionData;

    setBillingId(t.id);
    setCustomerId(t.customerId);
    setInvoiceNo(
      (transactionData as SalesType).invoiceNo || (transactionData as EstimateType).estimateNo
    );
    setCustomerContact(t.customer?.contact);
    setCustomerName(t.customer?.name);

    const dateObj = formatDateStrToISTDateObject(t.createdAt ?? "");
    if (dateObj) {
      setBillingDate(dateObj);
      localStorage.setItem("bill-preview-date", dateObj.toISOString());
    }

    setLineItems(t.items);
  }, [
    transactionData,
    isFetched,
    isLoading,
    isError,
    setBillingId,
    setCustomerId,
    setInvoiceNo,
    setCustomerContact,
    setCustomerName,
    setBillingDate,
    setLineItems
  ]);

  useEffect(() => {
    if (isError) {
      toast.error(error.message);
    }
  }, [isError, error]);

  return { status, isLoading, isFetched, transactionData };
};

export default useLoadTransactionDetails;
