import { apiClient } from "@/lib/apiClient";
import { useDashboardStore } from "@/store/dashboardStore";
import { toSentenceCase } from "@/utils";
import { SortOption, TRANSACTION_TYPE, type SortType, type TransactionType } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { useDateRangePicker } from "./useDateRangePicker";

export type MutationVariables = {
  type: TransactionType;
  id: string;
};

export type StatusMutationVariables = {
  type: TransactionType;
  id: string;
  isPaid: boolean;
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

  const deleteMutation = useMutation<null, Error, MutationVariables>({
    mutationFn: ({ type, id }) => apiClient.delete(`/api/${type}s/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [type, date, sortBy], exact: false });
      toast.success("Successfully deleted Sale");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const convertMutation = useMutation<{ id: string }, Error, MutationVariables>({
    mutationFn: ({ type, id }) => apiClient.post(`/api/${type}s/${id}/convert`),
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: [type, date, sortBy], exact: false });
      toast.success(
        `Successfully Converted ${toSentenceCase(variables.type)} to ${variables.type === TRANSACTION_TYPE.SALE ? "Estimate" : "Sale"} `
      );
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const txnStatusMutation = useMutation<{ message: string }, Error, StatusMutationVariables>({
    mutationFn: ({ type, id, isPaid }) =>
      apiClient.patch(`/api/${type}s/${id}`, { isPaid: isPaid }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [type, date, sortBy], exact: false });
      toast.success(response.message);
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
    txnStatusMutation
  };
};
