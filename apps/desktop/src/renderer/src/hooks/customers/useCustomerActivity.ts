import { apiClient } from "@/lib/apiClient";
import type { ActivityEvent } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";

export const useCustomerActivity = (customerId: string, limit: number = 20) => {
  const { data, isError, error, status, isFetching } = useQuery({
    queryKey: ["customer-activity", customerId, limit],
    queryFn: () =>
      apiClient.get<ActivityEvent[]>(`/api/customers/${customerId}/activity`, { limit }),
    enabled: !!customerId
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(error.message);
    }
  }, [isError, error]);

  return { activity: data ?? [], status, isFetching, isError };
};
