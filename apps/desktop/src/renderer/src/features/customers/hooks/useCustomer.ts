import { apiClient } from "@/lib/apiClient";
import type { Customer } from "@shared/types";
import { useQuery } from "@tanstack/react-query";

export const useCustomer = (customerId: string | undefined) => {
  const { data, isError, error, status, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => apiClient.get<Customer>(`/api/customers/${customerId}`),
    enabled: !!customerId
  });

  return { customer: data, status, isLoading, isError, error, refetch, isFetching };
};
