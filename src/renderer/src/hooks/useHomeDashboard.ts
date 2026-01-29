import { TRANSACTION_TYPE, type ApiResponse } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { MutationVariables } from "./dashboard/useDashboard";

const handleDelete = async ({ type, id }: MutationVariables) => {
  try {
    if (type === TRANSACTION_TYPE.SALE) {
      const response = await window.salesApi.deleteSale(id);
      return response;
    } else if (type === TRANSACTION_TYPE.ESTIMATE) {
      const response = await window.estimatesApi.deleteEstimate(id);
      return response;
    } else {
      throw new Error("Something went wrong");
    }
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

const handleConvert = async ({ type, id }: MutationVariables) => {
  try {
    if (type === "sale") {
      const response = await window.salesApi.convertSaletoEstimate(id);
      return response;
    } else if (type === "estimate") {
      const response = await window.estimatesApi.convertEstimateToSale(id);
      return response;
    } else {
      throw new Error("Something went wrong");
    }
  } catch (error) {
    throw new Error((error as Error).message);
  }
};
export const useHomeDashboard = ({ type }: { type: string }) => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation<ApiResponse<string>, Error, MutationVariables>({
    mutationFn: ({ type, id }) => handleDelete({ type, id }),
    onSuccess: (response) => {
      if (response.status === "success") {
        queryClient.invalidateQueries({ queryKey: [type], exact: false });
        toast.success(response.data);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const convertMutation = useMutation<ApiResponse<string>, Error, MutationVariables>({
    mutationFn: ({ type, id }) => handleConvert({ type, id }),
    onSuccess: (response) => {
      if (response.status === "success") {
        queryClient.invalidateQueries({ queryKey: [type], exact: false });
        toast.success(response.data);
      }
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
