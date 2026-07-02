import { apiClient } from "@/lib/apiClient";
import {
  type BatchCheckAction,
  type DashboardType,
  type UnifiedTransctionWithItems,
  type UpdateQtyAction
} from "@shared/types";
import { formatToRupees } from "@shared/utils/utils";
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

export const useViewModal = ({ type, id }: { type: DashboardType; id: string }) => {
  const queryClient = useQueryClient();
  const { data, isError, error } = useQuery({
    queryKey: [type, id],
    queryFn: () => apiClient.get<UnifiedTransctionWithItems>(`/api/${type}/${id}`)
  });

  const updateQtyMutation = useMutation<null, Error, MutationVariables>({
    mutationFn: ({ type, id, itemId, action }) =>
      apiClient.post(`/api/${type}/${id}/items/${itemId}/checked-qty`, {
        action
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [type, id], exact: false });
    }
  });

  const batchUpdateQtyMutation = useMutation<null, Error, BatchUpdateMutationVariables>({
    mutationFn: ({ type, id, action }) =>
      apiClient.post(`/api/${type}/${id}/items/checked-qty/batch`, {
        action
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [type, id], exact: false });
      toast.success("Successfully updated items.");
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

  const subtotal = formatToRupees(total);

  const grandTotal = formatToRupees(Math.round(total));

  return { data, subtotal, grandTotal, updateQtyMutation, batchUpdateQtyMutation };
};
