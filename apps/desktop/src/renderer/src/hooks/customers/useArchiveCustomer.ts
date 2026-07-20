import { apiClient } from "@/lib/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useArchiveCustomer = (customerId: string) => {
  const queryClient = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: () => apiClient.patch(`/api/customers/${customerId}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers-infinite"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      toast.success("Customer archived");
    },
    onError: (error) => toast.error(error.message)
  });

  const restoreMutation = useMutation({
    mutationFn: () => apiClient.patch(`/api/customers/${customerId}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers-infinite"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      toast.success("Customer restored");
    },
    onError: (error) => toast.error(error.message)
  });

  return { archiveMutation, restoreMutation };
};
