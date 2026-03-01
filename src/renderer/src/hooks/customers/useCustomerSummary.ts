import { apiClient } from "@/lib/apiClient";
import type { CustomerSummary } from "@shared/types";
import { useQuery } from "@tanstack/react-query";

export const useCustomerSummary = (customerId: string) => {
  const { data, status } = useQuery({
    queryKey: [customerId, "summary"],
    queryFn: () => apiClient.get<CustomerSummary>(`/api/customers/${customerId}/summary`),
    enabled: !!customerId
  });

  return { summary: data, status };
};
