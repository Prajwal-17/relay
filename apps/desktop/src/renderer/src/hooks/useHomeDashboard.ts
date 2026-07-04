import { apiClient } from "@/lib/apiClient";
import { toSentenceCase } from "@/utils";
import { TRANSACTION_TYPE } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { MutationVariables } from "./dashboard/useDashboard";

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
    mutationFn: ({ type, id }) => apiClient.post(`/api/${type}s/${id}/convert`),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: [type], exact: false });
      toast.success(
        `Successfully Converted ${toSentenceCase(variables.type)} to ${variables.type === TRANSACTION_TYPE.SALE ? "Estimate" : "Sale"} `
      );
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
