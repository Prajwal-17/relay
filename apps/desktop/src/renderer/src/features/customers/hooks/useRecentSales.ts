import { apiClient } from "@/lib/apiClient";
import type { RecentSalePreview } from "@shared/types";
import { useQuery } from "@tanstack/react-query";

export const useRecentSales = (customerId: string, limit: number = 5) => {
  const { data, isError, status, isFetching, refetch } = useQuery({
    queryKey: ["customer-recent-sales", customerId, limit],
    queryFn: () =>
      apiClient.get<RecentSalePreview[]>(`/api/customers/${customerId}/recent-sales`, { limit }),
    enabled: !!customerId
  });

  return { recentSales: data ?? [], status, isFetching, isError, refetch };
};
