import {
  DASHBOARD_TYPE,
  type ApiResponse,
  type BatchCheckAction,
  type DashboardType,
  type UnifiedTransctionWithItems,
  type UpdateQtyAction
} from "@shared/types";
import { formatToRupees, IndianRupees } from "@shared/utils/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";

export type MutationVariables = {
  type: DashboardType;
  id: string;
  itemId: string;
  action: UpdateQtyAction;
};

type BatchUpdateMutationVariables = {
  type: DashboardType;
  id: string;
  action: BatchCheckAction;
};

const fetchTransaction = async (type: DashboardType, id: string) => {
  try {
    if (type === DASHBOARD_TYPE.SALES) {
      const response = await fetch(`http://localhost:3000/api/sales/${id}`, {
        method: "GET"
      });
      const data = await response.json();
      return data;
    } else if (type === DASHBOARD_TYPE.ESTIMATES) {
      const response = await fetch(`http://localhost:3000/api/estimates/${id}`, {
        method: "GET"
      });
      const data = await response.json();
      return data;
    }
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

const handleUpdateQty = async ({ type, id, itemId, action }) => {
  try {
    if (type === DASHBOARD_TYPE.SALES) {
      const response = await fetch(
        `http://localhost:3000/api/sales/${id}/items/${itemId}/checked-qty`,
        {
          method: "POST",
          body: JSON.stringify({ action: action })
        }
      );
      const data = await response.json();
      return data;
    } else if (type === DASHBOARD_TYPE.ESTIMATES) {
      const response = await fetch(
        `http://localhost:3000/api/estimates/${id}/items/${itemId}/checked-qty`,
        {
          method: "POST",
          body: JSON.stringify({ action: action })
        }
      );
      const data = await response.json();
      return data;
    }
    throw new Error("Invalid dashboard transaction type");
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

const handleBatchUpdateQty = async ({ type, id, action }) => {
  try {
    if (type === DASHBOARD_TYPE.SALES) {
      const response = await fetch(
        `http://localhost:3000/api/sales/${id}/items/checked-qty/batch`,
        {
          method: "POST",
          body: JSON.stringify({ action: action })
        }
      );
      const data = await response.json();
      return data;
    } else if (type === DASHBOARD_TYPE.ESTIMATES) {
      const response = await fetch(
        `http://localhost:3000/api/estimates/${id}/items/checked-qty/batch`,
        {
          method: "POST",
          body: JSON.stringify({ action: action })
        }
      );
      const data = await response.json();
      return data;
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
    select: (response: ApiResponse<UnifiedTransctionWithItems>) => {
      if (response.status === "success") {
        return response.data;
      }
      return null;
    }
  });

  const updateQtyMutation = useMutation<ApiResponse<string>, Error, MutationVariables>({
    mutationFn: ({ type, id, itemId, action }) => handleUpdateQty({ type, id, itemId, action }),
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

  const total =
    data?.items.reduce((sum, currentItem) => {
      return sum + Number(currentItem.totalPrice || 0);
    }, 0) || 0;

  const subtotal = IndianRupees.format(formatToRupees(total));

  const grandTotal = IndianRupees.format(Math.round(formatToRupees(total)));

  return { data, subtotal, grandTotal, updateQtyMutation, batchUpdateQtyMutation };
};
