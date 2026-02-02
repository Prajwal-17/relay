import { useDashboardStore } from "@/store/dashboardStore";
import {
  SortOption,
  TRANSACTION_TYPE,
  type ApiResponse,
  type SortType,
  type TransactionType
} from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { useDateRangePicker } from "./useDateRangePicker";

export type MutationVariables = {
  type: TransactionType;
  id: string;
};

const handleDelete = async ({ type, id }: MutationVariables) => {
  try {
    if (type === TRANSACTION_TYPE.SALE) {
      const response = await fetch(`http://localhost:3000/api/sales/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();

      if (data.status === "success") {
        return data;
      }
      throw new Error(data.error.message);
    } else if (type === TRANSACTION_TYPE.ESTIMATE) {
      const response = await fetch(`http://localhost:3000/api/estimates/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();

      if (data.status === "success") {
        return data;
      }
      throw new Error(data.error.message);
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

export const useDashboard = () => {
  const { type } = useParams();
  const { date } = useDateRangePicker();
  const sortBy = useDashboardStore((state) => state.sortBy);
  const setSortBy = useDashboardStore((state) => state.setSortBy);
  const queryClient = useQueryClient();

  useEffect(() => {
    let sortByValue = localStorage.getItem("sort-by");

    if (!sortByValue) {
      sortByValue = SortOption.DATE_NEWEST_FIRST;
      localStorage.setItem("sort-by", sortByValue);
    }

    setSortBy(sortByValue as SortType);
  }, [setSortBy]);

  const deleteMutation = useMutation<ApiResponse<string>, Error, MutationVariables>({
    mutationFn: ({ type, id }) => handleDelete({ type, id }),
    onSuccess: (response) => {
      if (response.status === "success") {
        queryClient.invalidateQueries({ queryKey: [type, date, sortBy], exact: false });
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
        queryClient.invalidateQueries({ queryKey: [type, date, sortBy], exact: false });
        toast.success(response.data);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  return {
    sortBy,
    setSortBy,
    deleteMutation,
    convertMutation
  };
};
