import { apiClient } from "@/lib/apiClient";
import type { Customer, UpdateCustomerPayload } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export type UpdateCustomerVariables = {
  id: string;
  payload: Partial<UpdateCustomerPayload>;
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation<Customer, Error, UpdateCustomerVariables>({
    mutationFn: ({ id, payload }) => apiClient.post<Customer>(`/api/customers/${id}`, payload),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["customer", variables.id], data);
      queryClient.invalidateQueries({ queryKey: ["customers-infinite"], exact: false });
      queryClient.invalidateQueries({ queryKey: [variables.id, "summary"] });
      toast.success("Customer updated");
    },
    onError: (error) => toast.error(error.message)
  });
};
