import { apiClient } from "@/lib/apiClient";
import { useCustomerStore } from "@/store/customersStore";
import { toSentenceCase } from "@/utils";
import { TRANSACTION_TYPE, type Customer, type TransactionType } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export type MutationVariables = {
  type: TransactionType;
  id: string;
};

const useCustomers = () => {
  const selectedCustomer = useCustomerStore((state) => state.selectedCustomer);
  const setSelectedCustomer = useCustomerStore((state) => state.setSelectedCustomer);
  const filterType = useCustomerStore((state) => state.filterType);
  const setFilterType = useCustomerStore((state) => state.setFilterType);
  const actionType = useCustomerStore((state) => state.actionType);
  const setActionType = useCustomerStore((state) => state.setActionType);
  const openCustomerDialog = useCustomerStore((state) => state.openCustomerDialog);
  const setOpenCustomerDialog = useCustomerStore((state) => state.setOpenCustomerDialog);
  const formData = useCustomerStore((state) => state.formData);
  const setFormData = useCustomerStore((state) => state.setFormData);
  const customerSearch = useCustomerStore((state) => state.customerSearch);
  const setCustomerSearch = useCustomerStore((state) => state.setCustomerSearch);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  const {
    data: customers,
    status: customerStatus,
    isError,
    error
  } = useQuery({
    queryKey: ["customers", customerSearch],
    queryFn: () => apiClient.get<Customer[]>("/api/customers", { query: customerSearch }),
    placeholderData: (previousData) => previousData
  });

  useEffect(() => {
    if (isError) {
      toast.error(error.message);
    }
  }, [isError, error]);

  const deleteMutation = useMutation<null, Error, MutationVariables>({
    mutationFn: ({ type, id }) => apiClient.delete(`/api/${type}s/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [selectedCustomer?.id],
        exact: false
      });
      toast.success("Successfully deleted transaction");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const convertMutation = useMutation<null, Error, MutationVariables>({
    mutationFn: ({ type, id }) => apiClient.post(`/api/${type}s/${id}/convert`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [selectedCustomer?.id],
        exact: false
      });
      toast.success(
        `Successfully Converted ${toSentenceCase(variables.type)} to ${variables.type === TRANSACTION_TYPE.SALE ? "Estimate" : "Sale"} `
      );
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  return {
    selectedCustomer,
    setSelectedCustomer,
    filterType,
    setFilterType,
    openCustomerDialog,
    setOpenCustomerDialog,
    actionType,
    setActionType,
    formData,
    setFormData,
    customerSearch,
    setCustomerSearch,
    customers,
    customerStatus,
    errors,
    setErrors,
    deleteMutation,
    convertMutation
  };
};

export default useCustomers;
