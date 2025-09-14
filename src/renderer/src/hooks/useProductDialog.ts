import { useProductsStore } from "@/store/productsStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export const useProductsDialog = () => {
  const openProductDialog = useProductsStore((state) => state.openProductDialog);
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);
  const actionType = useProductsStore((state) => state.actionType);
  const formData = useProductsStore((state) => state.formData);
  const setFormData = useProductsStore((state) => state.setFormData);
  const setSearchParam = useProductsStore((state) => state.setSearchParam);
  const setSearchResult = useSearchDropdownStore((state) => state.setSearchResult);
  const setDropdownSearch = useSearchDropdownStore((state) => state.setSearchParam);
  const setDropdownResult = useSearchDropdownStore((state) => state.setSearchResult);
  const setIsDropdownOpen = useSearchDropdownStore((state) => state.setIsDropdownOpen);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async (action: "add" | "edit" | "billing-page-edit") => {
    try {
      if (action === "add") {
        setFormData({});
        const response = await window.productsApi.addNewProduct(formData);
        if (response.status === "success") {
          toast.success(response.data);
          setOpenProductDialog();
          setFormData({});
        } else {
          toast.error(response.error.message);
          setOpenProductDialog();
          setFormData({});
        }
      } else if (action === "edit") {
        setFormData({});
        const response = await window.productsApi.updateProduct(formData, formData.id);
        if (response.status === "success") {
          toast.success(response.data);
          setSearchResult("replace", []);
          setSearchParam("");
          setTimeout(() => {
            setSearchParam(formData.name);
          }, 350);
          setOpenProductDialog();
          setFormData({});
        } else {
          toast.error(response.error.message);
          setOpenProductDialog();
          setFormData({});
        }
      } else if (action === "billing-page-edit") {
        setFormData({});
        const response = await window.productsApi.updateProduct(formData, formData.id);
        if (response.status === "success") {
          toast.success(response.data);
          setDropdownResult("replace", []);
          setDropdownSearch("");
          setTimeout(() => {
            setDropdownSearch(formData.name);
          }, 220);
          setOpenProductDialog();
          setIsDropdownOpen();
          setFormData({});
        } else {
          toast.error(response.error.message);
          setOpenProductDialog();
          setFormData({});
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (actionType === "add") {
      setFormData({});
    }
  }, [actionType, setFormData]);

  const handleDelete = async (productId: string) => {
    try {
      const response = await window.productsApi.deleteProduct(productId);
      if (response.status === "success") {
        toast.success(response.data);
        setOpenProductDialog();
        setSearchResult("replace", []);
        setSearchParam("");
        setFormData({});
      } else {
        toast.error(response.error.message);
        setOpenProductDialog();
        setFormData({});
      }
    } catch (error) {
      console.log(error);
    }
  };

  return {
    openProductDialog,
    setOpenProductDialog,
    actionType,
    showDeleteConfirm,
    setShowDeleteConfirm,
    formData,
    setFormData,
    handleSubmit,
    handleDelete
  };
};
