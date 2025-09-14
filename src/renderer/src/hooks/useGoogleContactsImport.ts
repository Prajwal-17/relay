import { useCustomerStore } from "@/store/customersStore";
import type { FilteredGoogleContactsType } from "@shared/types";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const useGoogleContactsImport = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<FilteredGoogleContactsType[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<FilteredGoogleContactsType[]>([]);

  const loading = useCustomerStore((state) => state.loading);
  const setLoading = useCustomerStore((state) => state.setLoading);
  const googleContacts = useCustomerStore((state) => state.googleContacts);
  const setOpenContactDialog = useCustomerStore((state) => state.setOpenContactDialog);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(googleContacts);
    } else {
      setSelectedContacts([]);
    }
  };

  useEffect(() => {
    setFilteredContacts(googleContacts);
  }, [googleContacts]);

  const handleImport = async () => {
    setLoading();
    try {
      const response = await window.customersApi.importContacts(selectedContacts);
      if (response.status === "success") {
        toast.success(response.data);
        setLoading();
        setSelectedContacts([]);
        setSearchTerm("");
        setOpenContactDialog();
      } else {
        toast.error(response.error.message);
        setSelectedContacts([]);
        setLoading();
        setSearchTerm("");
        setOpenContactDialog();
      }
    } catch (error) {
      console.error("Import failed", error);
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    if (!searchTerm) {
      setFilteredContacts(googleContacts);
    } else {
      setFilteredContacts(
        googleContacts.filter((obj) => obj.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  }, [searchTerm]);

  return {
    loading,
    searchTerm,
    setSearchTerm,
    selectedContacts,
    filteredContacts,
    handleSelectAll,
    setSelectedContacts,
    setOpenContactDialog,
    handleImport
  };
};

export default useGoogleContactsImport;
