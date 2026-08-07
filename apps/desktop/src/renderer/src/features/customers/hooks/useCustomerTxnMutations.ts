import { apiClient } from "@/lib/apiClient";
import { toSentenceCase } from "@/utils/renderer.utils";
import { type TransactionType } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export type MutationVariables = {
  type: TransactionType;
  id: string;
};

export const useCustomerTxnMutations = (customerId: string, type: TransactionType) => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["customer-txns", customerId], exact: false });
    queryClient.invalidateQueries({ queryKey: ["customer-txns", customerId, type] });
    queryClient.invalidateQueries({ queryKey: [`${type}s`], exact: false });
    queryClient.invalidateQueries({ queryKey: ["customer", customerId, "summary"] });
    queryClient.invalidateQueries({ queryKey: ["customer-activity", customerId], exact: false });
    queryClient.invalidateQueries({
      queryKey: ["customer-recent-sales", customerId],
      exact: false
    });
  };

  const deleteMutation = useMutation<null, Error, MutationVariables>({
    mutationFn: ({ id }) => apiClient.delete(`/api/${type}s/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success(`Successfully deleted ${toSentenceCase(type)}`);
    },
    onError: (error) => toast.error(error.message)
  });

  const convertMutation = useMutation<{ id: string }, Error, MutationVariables>({
    mutationFn: ({ id }) => apiClient.post(`/api/estimates/${id}/convert`),
    onSuccess: () => {
      invalidate();
      toast.success("Successfully converted Estimate to Sale");
    },
    onError: (error) => toast.error(error.message)
  });

  const duplicateMutation = useMutation<{ id: string }, Error, MutationVariables>({
    mutationFn: ({ id }) => apiClient.post(`/api/${type}s/${id}/duplicate`),
    onSuccess: () => {
      invalidate();
      toast.success(`Successfully duplicated ${toSentenceCase(type)}`);
    },
    onError: (error) => toast.error(error.message)
  });

  return { deleteMutation, convertMutation, duplicateMutation };
};
