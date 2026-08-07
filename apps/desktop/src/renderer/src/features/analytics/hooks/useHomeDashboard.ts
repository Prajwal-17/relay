import { apiClient } from "@/lib/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { MutationVariables } from "@/features/transactions/hooks/useDashboard";

export const useHomeDashboard = ({ type }: { type: string }) => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation<null, Error, MutationVariables>({
    mutationFn: ({ type, id }) => apiClient.delete(`/api/${type}s/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [type], exact: false });
      toast.success("Successfully deleted Sale");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const convertMutation = useMutation<{ id: string }, Error, MutationVariables>({
    mutationFn: ({ id }) => apiClient.post(`/api/estimates/${id}/convert`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [type], exact: false });
      toast.success("Successfully converted Estimate to Sale");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  return {
    deleteMutation,
    convertMutation
  };
};
