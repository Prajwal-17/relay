import { apiClient } from "@/lib/apiClient";
import { toSentenceCase } from "@/utils";
import { TRANSACTION_TYPE, type TransactionType } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export type MutationVariables = {
  type: TransactionType;
  id: string;
};

export type StatusMutationVariables = {
  type: TransactionType;
  id: string;
  isPaid: boolean;
};

export const useCustomerTxnMutations = (customerId: string, type: TransactionType) => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["customer-txns", customerId], exact: false });
    queryClient.invalidateQueries({ queryKey: ["customer-txns", customerId, type] });
    queryClient.invalidateQueries({ queryKey: [`${type}s`], exact: false });
    queryClient.invalidateQueries({ queryKey: ["customer", customerId, "summary"] });
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
    mutationFn: ({ id }) => apiClient.post(`/api/${type}s/${id}/convert`),
    onSuccess: () => {
      invalidate();
      toast.success(
        `Successfully converted ${toSentenceCase(type)} to ${type === TRANSACTION_TYPE.SALE ? "Estimate" : "Sale"}`
      );
    },
    onError: (error) => toast.error(error.message)
  });

  const txnStatusMutation = useMutation<{ message: string }, Error, StatusMutationVariables>({
    mutationFn: ({ id, isPaid }) => apiClient.patch(`/api/${type}s/${id}`, { isPaid }),
    onSuccess: (response) => {
      invalidate();
      toast.success(response.message);
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

  return { deleteMutation, convertMutation, txnStatusMutation, duplicateMutation };
};
