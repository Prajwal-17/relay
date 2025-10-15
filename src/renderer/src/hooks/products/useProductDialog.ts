import { ProductSchema } from "@/lib/validation";
import { useProductsStore } from "@/store/productsStore";
import type { ApiResponse, ProductsType } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
const addProduct = async (formattedFormData: Omit<ProductsType, "id">) => {
  try {
    const response = await window.productsApi.addNewProduct(formattedFormData);
    return response;
  } catch (error) {
    throw new Error((error as Error).message ?? "Something went wrong");
  }
};

const updateProduct = async (formattedFormData: ProductsType) => {
  try {
    const response = await window.productsApi.updateProduct(
      formattedFormData,
      formattedFormData.id
    );
    return response;
  } catch (error) {
    throw new Error((error as Error).message ?? "Something went wrong");
  }
};

export const useProductDialog = () => {
  const openProductDialog = useProductsStore((state) => state.openProductDialog);
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);
  const actionType = useProductsStore((state) => state.actionType);
  const setActionType = useProductsStore((state) => state.setActionType);
  const formDataState = useProductsStore((state) => state.formDataState);
  const setFormDataState = useProductsStore((state) => state.setFormDataState);
  const searchParam = useProductsStore((state) => state.searchParam);
  const errors = useProductsStore((state) => state.errors);
  const setErrors = useProductsStore((state) => state.setErrors);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (actionType === "add") {
      setFormDataState({});
      setErrors({});
    }

    if (actionType === "edit") {
      setErrors({});
    }

    if (actionType === "billing-page-edit") {
      setErrors({});
    }
  }, [actionType, setFormDataState, setErrors]);

  const handleInputChange = (field: string, value: any) => {
    setFormDataState({ [field]: value });

    const result = ProductSchema.safeParse({
      ...formDataState,
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
    ...formDataState,
    mrp: formDataState.mrp ? Number(formDataState.mrp) : null,
    price: Number(formDataState.price),
    purchasePrice: formDataState.purchasePrice ? Number(formDataState.purchasePrice) : null
  };

  const productMutation = useMutation({
    mutationFn: async ({
      action,
      formData
    }:
      | {
          action: "add";
          formData: Omit<ProductsType, "id">;
        }
      | {
          action: "edit" | "billing-page-edit";
          formData: ProductsType;
        }) => {
      if (action === "add") {
        return addProduct(formData);
      } else {
        return updateProduct(formData);
      }
    },
    onSuccess: (response) => {
      if (response.status === "success") {
        queryClient.invalidateQueries({ queryKey: ["productSearch", searchParam] });
        setErrors({});
        setFormDataState({});
        setOpenProductDialog();
        toast.success(response.data);
      } else if (response.status === "error") {
        toast.error(response.error.message);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleSubmit = async (action: "add" | "edit" | "billing-page-edit") => {
    const result = ProductSchema.safeParse(formattedFormData);

    if (!result.success) {
      const formatted = z.flattenError(result.error);
      const errorRecord = { ...errors };

      for (const field in formatted.fieldErrors) {
        errorRecord[field] = formatted.fieldErrors[field]?.[0];
      }
      setErrors(errorRecord);
      return;
    }

    /**
     * The `id` is optional in zod ProductSchema.
     * So Omit id from ProductsType & check for `id` in actionType "edit" or "billing-page-edit"
     */
    if (action === "add") {
      productMutation.mutate({ action: action, formData: result.data as Omit<ProductsType, "id"> });
      return;
    }

    if (!result.data?.id) {
      toast.error("Product does not exist");
      return;
    }
    productMutation.mutate({ action: action, formData: result.data as ProductsType });
  };

  const deleteProductMutation = useMutation<ApiResponse<string>, Error, string>({
    mutationFn: (productId: string) => handleDelete(productId),
    onSuccess: (response) => {
      if (response.status === "success") {
        queryClient.invalidateQueries({ queryKey: ["productSearch", searchParam] });
        setErrors({});
        setFormDataState({});
        setOpenProductDialog();
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
    setActionType,
    showDeleteConfirm,
    setShowDeleteConfirm,
    errors,
    setErrors,
    formDataState,
    setFormDataState,
    handleInputChange,
    handleSubmit,
    handleDelete,
    productMutation
  };
};
