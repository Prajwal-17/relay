import { useCustomerStore } from "@/store/customersStore";
import { TRANSACTION_TYPE, type ApiResponse, type TransactionType } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export type MutationVariables = {
  type: TransactionType;
  id: string;
};

const getCustomers = async (customerSearch: string) => {
  const response = await fetch(
    `http://localhost:3000/api/customers${customerSearch ? `?query=${customerSearch}` : ""}`,
    {
      method: "GET",
      headers: {
        "Content-type": "application/json"
      }
    }
  );

  const data = await response.json();

  if (data.status === "success") {
    return await data.data;
  }
  throw new Error(data.error.message ?? "Something went wrong in getting customers");
};

const handleDelete = async ({ type, id }: MutationVariables) => {
  console.log("here");
  try {
    if (type === TRANSACTION_TYPE.SALE) {
      const response = await fetch(`http://localhost:3000/api/sales/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();
      return data;
    } else if (type === TRANSACTION_TYPE.ESTIMATE) {
      const response = await fetch(`http://localhost:3000/api/estimates/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();
      return data;
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
      const response = await fetch(`http://localhost:3000/api/sales/${id}/convert`, {
        method: "POST"
      });
      const data = await response.json();
      return data;
    } else if (type === TRANSACTION_TYPE.ESTIMATE) {
      const response = await fetch(`http://localhost:3000/api/estimates/${id}/convert`, {
        method: "POST"
      });
      const data = await response.json();
      return data;
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
      return getCustomers(customerSearch);
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
          queryKey: [selectedCustomer?.id],
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
        console.log(selectedCustomer?.id);
        queryClient.invalidateQueries({
          queryKey: [selectedCustomer?.id],
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
