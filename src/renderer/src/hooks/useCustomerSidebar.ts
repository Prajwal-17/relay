import { useCustomerStore } from "@/store/customersStore";
import type { CustomersType } from "@shared/types";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const useCustomerSidebar = () => {
  // temp state
  const [customers, setCustomers] = useState<CustomersType[]>([]);

  const selectedCustomer = useCustomerStore((state) => state.selectedCustomer);
  const setSelectedCustomer = useCustomerStore((state) => state.setSelectedCustomer);
  const [searchTerm, setSearchTerm] = useState("");
  const setActionType = useCustomerStore((state) => state.setActionType);
  const openCustomerDialog = useCustomerStore((state) => state.openCustomerDialog);
  const setOpenCustomerDialog = useCustomerStore((state) => state.setOpenCustomerDialog);
  const openContactDialog = useCustomerStore((state) => state.openContactDialog);
  const setOpenContactDialog = useCustomerStore((state) => state.setOpenContactDialog);
  const setFormData = useCustomerStore((state) => state.setFormData);
  const setLoading = useCustomerStore((state) => state.setLoading);
  const setGoogleContacts = useCustomerStore((state) => state.setGoogleContacts);
  const refreshState = useCustomerStore((state) => state.refreshState);
  const setRefreshState = useCustomerStore((state) => state.setRefreshState);

  useEffect(() => {
    async function searchCustomers() {
      try {
        const response = await window.customersApi.searchCustomers(searchTerm);
        if (response.status === "success") {
          setCustomers(response.data);
        } else {
          console.log("error");
        }
      } catch (error) {
        console.log(error);
        toast.error("Something went wrong");
      }
    }

    searchCustomers();
  }, [searchTerm]);

  useEffect(() => {
    async function getAllCustomers() {
      try {
        const response = await window.customersApi.getAllCustomers();
        if (response.status === "success") {
          setCustomers(response.data);
          setRefreshState(false);
        } else {
          toast.error("Something went wrong in getting customers");
          setRefreshState(false);
        }
      } catch (error) {
        console.log(error);
        toast.error("Something went wrong");
        setRefreshState(false);
      }
    }
    getAllCustomers();
  }, [setSelectedCustomer, refreshState, setRefreshState]);

  async function importContactFromGoogle() {
    try {
      const response = await window.customersApi.importContactsFromGoogle();
      if (response.status === "success") {
        setGoogleContacts(response.data);
        setLoading();
      } else {
        toast.error("Something went wrong in getting customers");
        setLoading();
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  }

  return {
    customers,
    selectedCustomer,
    openCustomerDialog,
    searchTerm,
    openContactDialog,
    setFormData,
    setActionType,
    setOpenCustomerDialog,
    setOpenContactDialog,
    importContactFromGoogle,
    setLoading,
    setSearchTerm,
    setSelectedCustomer
  };
};

export default useCustomerSidebar;
