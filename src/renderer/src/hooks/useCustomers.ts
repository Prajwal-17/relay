import { useCustomerStore } from "@/store/customersStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

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

const useCustomers = () => {
  const selectedCustomer = useCustomerStore((state) => state.selectedCustomer);
  const setSelectedCustomer = useCustomerStore((state) => state.setSelectedCustomer);
  const actionType = useCustomerStore((state) => state.actionType);
  const setActionType = useCustomerStore((state) => state.setActionType);
  const openCustomerDialog = useCustomerStore((state) => state.openCustomerDialog);
  const setOpenCustomerDialog = useCustomerStore((state) => state.setOpenCustomerDialog);
  const formData = useCustomerStore((state) => state.formData);
  const setFormData = useCustomerStore((state) => state.setFormData);
  const customerSearch = useCustomerStore((state) => state.customerSearch);
  const setCustomerSearch = useCustomerStore((state) => state.setCustomerSearch);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  return {
    selectedCustomer,
    setSelectedCustomer,
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
    setErrors
  };
};

export default useCustomers;
