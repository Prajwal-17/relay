import { apiClient } from "@/lib/apiClient";
import { useDashboardStore } from "@/features/transactions/store/dashboard.store";
import { toSentenceCase } from "@/utils/renderer.utils";
import { SortOption, type SortType, type TransactionType } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { useDateRangePicker } from "./useDateRangePicker";

export type MutationVariables = {
  type: TransactionType;
  id: string;
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
    mutationFn: ({ id }) => apiClient.post(`/api/estimates/${id}/convert`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [type, date, sortBy], exact: false });
      toast.success("Successfully converted Estimate to Sale");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const duplicateMutation = useMutation<{ id: string }, Error, MutationVariables>({
    mutationFn: ({ type, id }) => apiClient.post(`/api/${type}s/${id}/duplicate`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [type, date, sortBy], exact: false });
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
