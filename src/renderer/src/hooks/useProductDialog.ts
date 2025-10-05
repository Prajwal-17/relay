import { ProductSchema } from "@/lib/validation";
import { useProductsStore } from "@/store/productsStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import type { ApiResponse } from "@shared/types";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import z from "zod";

const handleDelete = async (productId: string) => {
  try {
    const response = await window.productsApi.deleteProduct(productId);
    return response;
  } catch (error) {
    throw new Error((error as Error).message ?? "Something went wrong");
  }
};

export const useProductsDialog = () => {
  const openProductDialog = useProductsStore((state) => state.openProductDialog);
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);
  const actionType = useProductsStore((state) => state.actionType);
  const formData = useProductsStore((state) => state.formData);
  const setFormData = useProductsStore((state) => state.setFormData);
  const setSearchParam = useProductsStore((state) => state.setSearchParam);
  const setSearchResult = useSearchDropdownStore((state) => state.setSearchResult);
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
      // await handleAction(action);
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

  const deleteProductMutation = useMutation<ApiResponse<string>, Error, string>({
    mutationFn: (productId: string) => handleDelete(productId),
    onSuccess: (response) => {
      if (response.status === "success") {
        setOpenProductDialog();
        // TODO: fix acc to useQuery
        setSearchResult("replace", []);
        setSearchParam("");
        setFormData({});
        //
        toast.success(response.data);
      } else if (response.status === "error") {
        toast.error(response.error.message);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  return {
    openProductDialog,
    setOpenProductDialog,
    deleteProductMutation,
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
