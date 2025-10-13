import { useDashboardStore } from "@/store/dashboardStore";
import { SortOption, type ApiResponse, type SortType } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { useDateRangePicker } from "./useDateRangePicker";

export type MutationVariables = {
  type: string;
  id: string;
};

const handleDelete = async ({ type, id }: MutationVariables) => {
  try {
    if (type === "sale") {
      const response = await window.salesApi.deleteSale(id);
      return response;
    } else if (type === "estimate") {
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
export const useDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
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
        queryClient.invalidateQueries({ queryKey: [pathname, date, sortBy], exact: false });
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
        queryClient.invalidateQueries({ queryKey: [pathname, date, sortBy], exact: false });
        toast.success(response.data);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  return {
    navigate,
    pathname,
    sortBy,
    setSortBy,
    deleteMutation,
    convertMutation
  };
};
