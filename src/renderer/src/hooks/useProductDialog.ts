import { ProductSchema } from "@/lib/validation";
import { useProductsStore } from "@/store/productsStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import z from "zod";

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
  const errors = useProductsStore((state) => state.errors);
  const setErrors = useProductsStore((state) => state.setErrors);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData({ [field]: value });

    const result = ProductSchema.safeParse({
      ...formData,
      [field]: value
    });

    const errorRecord = { ...errors };

    if (!result.success) {
      const formatted = z.flattenError(result.error);
      errorRecord[field] = formatted.fieldErrors[field]?.[0];
      setErrors(errorRecord);
    } else {
      delete errorRecord[field];
      setErrors(errorRecord);
    }
  };

  /**
   * always use conditional
   * mrp: formData.mrp ? Number(formData.mrp) : null
   * coz Number(null) = 0
   */
  const formattedFormData = {
    ...formData,
    mrp: formData.mrp ? Number(formData.mrp) : null,
    price: Number(formData.price),
    purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : null
  };

  const handleSubmit = async (action: "add" | "edit" | "billing-page-edit") => {
    const result = ProductSchema.safeParse(formattedFormData);

    if (!result.success) {
      const formatted = z.flattenError(result.error);
      const errorRecord = { ...errors };

      for (const field in formatted.fieldErrors) {
        errorRecord[field] = formatted.fieldErrors[field]?.[0];
      }
      setErrors(errorRecord);
    } else {
      await handleAction(action);
    }
  };

  const handleAction = async (action: "add" | "edit" | "billing-page-edit") => {
    try {
      if (action === "add") {
        setFormData({});
        const response = await window.productsApi.addNewProduct(formattedFormData);
        if (response.status === "success") {
          toast.success(response.data);
          setOpenProductDialog();
          setFormData({});
          setErrors({});
        } else {
          toast.error(response.error.message);
          setOpenProductDialog();
          setFormData({});
        }
      } else if (action === "edit") {
        setFormData({});
        const response = await window.productsApi.updateProduct(
          formattedFormData,
          formattedFormData.id
        );
        if (response.status === "success") {
          toast.success(response.data);
          setSearchResult("replace", []);
          setSearchParam("");
          setTimeout(() => {
            setSearchParam(formattedFormData.name);
          }, 350);
          setOpenProductDialog();
          setFormData({});
          setErrors({});
        } else {
          toast.error(response.error.message);
          setOpenProductDialog();
          setFormData({});
        }
      } else if (action === "billing-page-edit") {
        setFormData({});
        const response = await window.productsApi.updateProduct(
          formattedFormData,
          formattedFormData.id
        );
        if (response.status === "success") {
          toast.success(response.data);
          setDropdownResult("replace", []);
          setDropdownSearch("");
          setTimeout(() => {
            setDropdownSearch(formattedFormData.name);
          }, 220);
          setOpenProductDialog();
          setIsDropdownOpen();
          setFormData({});
          setErrors({});
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
      setErrors({});
    }

    if (actionType === "edit") {
      setErrors({});
    }

    if (actionType === "billing-page-edit") {
      setErrors({});
    }
  }, [actionType, setFormData, setErrors]);

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
    errors,
    setErrors,
    formData,
    setFormData,
    handleInputChange,
    handleSubmit,
    handleDelete
  };
};
