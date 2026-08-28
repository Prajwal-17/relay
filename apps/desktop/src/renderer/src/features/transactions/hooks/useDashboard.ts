import { apiClient } from "@/lib/apiClient";
import { useDashboardStore } from "@/features/transactions/store/dashboard.store";
import { toSentenceCase } from "@/utils/renderer.utils";
import type { TransactionType } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";

export type MutationVariables = {
  type: TransactionType;
  id: string;
};

export const useDashboard = () => {
  const { type } = useParams();
  const sortBy = useDashboardStore((state) => state.sortBy);
  const setSortBy = useDashboardStore((state) => state.setSortBy);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation<null, Error, MutationVariables>({
    mutationFn: ({ type, id }) => apiClient.delete(`/api/${type}s/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", type] });
      toast.success("Successfully deleted Sale");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const convertMutation = useMutation<{ id: string }, Error, MutationVariables>({
    mutationFn: ({ id }) => apiClient.post(`/api/estimates/${id}/convert`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", type] });
      toast.success("Successfully converted Estimate to Sale");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const duplicateMutation = useMutation<{ id: string }, Error, MutationVariables>({
    mutationFn: ({ type, id }) => apiClient.post(`/api/${type}s/${id}/duplicate`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["transactions", type] });
      toast.success(`Successfully duplicated ${toSentenceCase(variables.type)}`);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  return {
    sortBy,
    setSortBy,
    deleteMutation,
    convertMutation,
    duplicateMutation
  };
};
