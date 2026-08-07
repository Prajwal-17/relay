import { apiClient } from "@/lib/apiClient";
import type { Customer } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";

export const useCustomer = (customerId: string | undefined) => {
  const { data, isError, error, status, isLoading } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => apiClient.get<Customer>(`/api/customers/${customerId}`),
    enabled: !!customerId
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(error.message);
    }
  }, [isError, error]);

  return { customer: data, status, isLoading, isError };
};
