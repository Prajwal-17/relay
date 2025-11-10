import {
  DASHBOARD_TYPE,
  type ApiResponse,
  type BatchCheckAction,
  type CustomersType,
  type DashboardType,
  type EstimateItemsType,
  type EstimateType,
  type SaleItemsType,
  type SalesType,
  type UpdateQtyAction
} from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import toast from "react-hot-toast";

type SaleObject = SalesType & { customer: CustomersType; items: SaleItemsType[] };
type EstimateObject = EstimateType & { customer: CustomersType; items: EstimateItemsType[] };
type UnifiedType = SaleObject | EstimateObject;
export type MutationVariables = {
  type: DashboardType;
  id: string;
  action: UpdateQtyAction;
};

type BatchUpdateMutationVariables = {
  type: DashboardType;
  id: string;
  action: BatchCheckAction;
};

export type UnifiedTransaction = {
  id: string;
  transactionNo: number;
  type: "sale" | "estimate";
  customerName: string;
  customerId: string;
  grandTotal: number;
  totalQuantity: number;
  isPaid: boolean;
  items: SaleItemsType[] | EstimateItemsType[];
  createdAt?: string;
  updatedAt?: string;
};

const fetchTransaction = async (type: DashboardType, id: string) => {
  try {
    if (type === DASHBOARD_TYPE.SALES) {
      const response = await window.salesApi.getTransactionById(id);
      return response;
    } else if (type === DASHBOARD_TYPE.ESTIMATES) {
      const response = await window.estimatesApi.getTransactionById(id);
      return response;
    }
    throw new Error("Invalid dashboard type");
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

const handleUpdateQty = async ({ type, id, action }) => {
  try {
    if (type === DASHBOARD_TYPE.SALES) {
      const response = await window.salesApi.registerSaleItemQty(id, action);
      return response;
    } else if (type === DASHBOARD_TYPE.ESTIMATES) {
      const response = await window.estimatesApi.registerEstimateItemQty(id, action);
      return response;
    }
    throw new Error("Invalid dashboard transaction type");
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

const handleBatchUpdateQty = async ({ type, id, action }) => {
  try {
    if (type === DASHBOARD_TYPE.SALES) {
      const response = await window.salesApi.markAllSaleItemsChecked(id, action);
      return response;
    } else if (type === DASHBOARD_TYPE.ESTIMATES) {
      const response = await window.estimatesApi.markAllEstimateItemsChecked(id, action);
      return response;
    }
    throw new Error("Invalid dashboard transaction type");
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export const useViewModal = ({ type, id }: { type: DashboardType; id: string }) => {
  const queryClient = useQueryClient();
  const { data, isError, error } = useQuery({
    queryKey: [type, id],
    queryFn: () => fetchTransaction(type, id),
    select: (response: ApiResponse<UnifiedType>) => {
      if (response.status === "success") {
        return response.data;
      }
      return null;
    }
  });

  const updateQtyMutation = useMutation<ApiResponse<string>, Error, MutationVariables>({
    mutationFn: ({ type, id, action }) => handleUpdateQty({ type, id, action }),
    onSuccess: (response) => {
      if (response.status === "success") {
        queryClient.invalidateQueries({ queryKey: [type, id], exact: false });
      }
    }
  });

  const batchUpdateQtyMutation = useMutation<
    ApiResponse<{ isAllChecked: boolean }>,
    Error,
    BatchUpdateMutationVariables
  >({
    mutationFn: ({ type, id, action }) => handleBatchUpdateQty({ type, id, action }),
    onSuccess: (response) => {
      if (response.status === "success") {
        queryClient.invalidateQueries({ queryKey: [type, id], exact: false });
        toast.success(response.message ?? "Successfully updated items.");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(error.message);
    }
  }, [isError, error]);

  const transactionData = useMemo((): UnifiedTransaction | undefined => {
    if (!data) return;

    if (type === DASHBOARD_TYPE.SALES) {
      const sale = data as SaleObject;
      return {
        id: sale.id,
        transactionNo: sale.invoiceNo,
        type: "sale",
        customerName: sale.customer.name,
        customerId: sale.customer.id,
        grandTotal: sale.grandTotal ?? 0,
        totalQuantity: sale.totalQuantity ?? 0,
        isPaid: sale.isPaid,
        items: sale.items,
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt
      };
    }

    if (type === DASHBOARD_TYPE.ESTIMATES) {
      const estimate = data as EstimateObject;
      return {
        id: estimate.id,
        transactionNo: estimate.estimateNo,
        type: "estimate",
        customerName: estimate.customer.name,
        customerId: estimate.customer.id,
        grandTotal: estimate.grandTotal ?? 0,
        totalQuantity: estimate.totalQuantity ?? 0,
        isPaid: estimate.isPaid,
        items: estimate.items,
        createdAt: estimate.createdAt,
        updatedAt: estimate.updatedAt
      };
    }
    return;
  }, [data, type]);

  const calcTotalAmount =
    data?.items.reduce((sum, currentItem) => {
      return sum + Number(currentItem.totalPrice || 0);
    }, 0) ?? 0;

  return { data: transactionData, calcTotalAmount, updateQtyMutation, batchUpdateQtyMutation };
};
