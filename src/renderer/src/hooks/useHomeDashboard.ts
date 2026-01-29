import { TRANSACTION_TYPE, type ApiResponse } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { MutationVariables } from "./dashboard/useDashboard";

const handleDelete = async ({ type, id }: MutationVariables) => {
  try {
    if (type === TRANSACTION_TYPE.SALE) {
      const response = await fetch(`http://localhost:3000/api/sales/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();
      return data;
    } else if (type === TRANSACTION_TYPE.ESTIMATE) {
      const response = await fetch(`http://localhost:3000/api/estimates/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();
      return data;
    } else {
      throw new Error("Something went wrong");
    }
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

const handleConvert = async ({ type, id }: MutationVariables) => {
  try {
    if (type === TRANSACTION_TYPE.SALE) {
      const response = await fetch(`http://localhost:3000/api/sales/${id}/convert`, {
        method: "POST"
      });
      const data = await response.json();
      return data;
    } else if (type === TRANSACTION_TYPE.ESTIMATE) {
      const response = await fetch(`http://localhost:3000/api/estimates/${id}/convert`, {
        method: "POST"
      });
      const data = await response.json();
      return data;
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
