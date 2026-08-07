import { apiClient } from "@/lib/apiClient";
import type { RecentSalePreview } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";

export const useRecentSales = (customerId: string, limit: number = 5) => {
  const { data, isError, error, status, isFetching } = useQuery({
    queryKey: ["customer-recent-sales", customerId, limit],
    queryFn: () =>
      apiClient.get<RecentSalePreview[]>(`/api/customers/${customerId}/recent-sales`, { limit }),
    enabled: !!customerId
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(error.message);
    }
  }, [isError, error]);

  return { recentSales: data ?? [], status, isFetching, isError };
};
