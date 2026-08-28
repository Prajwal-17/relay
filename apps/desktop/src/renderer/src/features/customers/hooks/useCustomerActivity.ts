import { apiClient } from "@/lib/apiClient";
import type { ActivityEvent } from "@shared/types";
import { useQuery } from "@tanstack/react-query";

export const useCustomerActivity = (customerId: string, limit: number = 20) => {
  const { data, isError, status, isFetching, refetch } = useQuery({
    queryKey: ["customer-activity", customerId, limit],
    queryFn: () =>
      apiClient.get<ActivityEvent[]>(`/api/customers/${customerId}/activity`, { limit }),
    enabled: !!customerId
  });

  return { activity: data ?? [], status, isFetching, isError, refetch };
};
