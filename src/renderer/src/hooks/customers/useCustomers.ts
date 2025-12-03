import { useCustomerStore } from "@/store/customersStore";
import { TRANSACTION_TYPE, type ApiResponse, type TransactionType } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export type MutationVariables = {
  type: TransactionType;
  id: string;
};
const getAllCustomers = async () => {
  const response = await window.customersApi.getAllCustomers();

  if (response.status === "success") {
    return response.data;
  }
  throw new Error(response.error.message ?? "Something went wrong in getting customers");
};

const searchCustomers = async (customerSearch: string) => {
  if (!customerSearch) {
    return [];
  }
  const response = await window.customersApi.searchCustomers(customerSearch);

  if (response.status === "success") {
    return response.data;
  }

  throw new Error(response.error.message ?? "Something went wrong while fetching customers");
};

const handleDelete = async ({ type, id }: MutationVariables) => {
  try {
    if (type === TRANSACTION_TYPE.SALE) {
      const response = await window.salesApi.deleteSale(id);
      return response;
    } else if (type === TRANSACTION_TYPE.ESTIMATE) {
      const response = await window.estimatesApi.deleteEstimate(id);
      return response;
    } else {
      throw new Error("Something went wrong");
    }
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

const handleConvert = async ({ type, id }: MutationVariables) => {
  try {
    if (type === TRANSACTION_TYPE.SALE) {
      const response = await window.salesApi.convertSaletoEstimate(id);
      return response;
    } else if (type === TRANSACTION_TYPE.ESTIMATE) {
      const response = await window.estimatesApi.convertEstimateToSale(id);
      return response;
    } else {
      throw new Error("Something went wrong");
    }
  } catch (error) {
    throw new Error((error as Error).message);
  }
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
    queryFn: () => {
      if (customerSearch) {
        return searchCustomers(customerSearch);
      }
      return getAllCustomers();
    },
    placeholderData: (previousData) => previousData
  });

  useEffect(() => {
    if (isError) {
      toast.error(error.message);
    }
  }, [isError, error]);

  const deleteMutation = useMutation<ApiResponse<string>, Error, MutationVariables>({
    mutationFn: ({ type, id }) => handleDelete({ type, id }),
    onSuccess: (response) => {
      if (response.status === "success") {
        queryClient.invalidateQueries({
          queryKey: [selectedCustomer?.id, filterType],
          exact: false
        });
        toast.success(response.data);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const convertMutation = useMutation<ApiResponse<string>, Error, MutationVariables>({
    mutationFn: ({ type, id }) => handleConvert({ type, id }),
    onSuccess: (response) => {
      if (response.status === "success") {
        queryClient.invalidateQueries({
          queryKey: [selectedCustomer?.id, filterType],
          exact: false
        });
        toast.success(response.data);
      }
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
