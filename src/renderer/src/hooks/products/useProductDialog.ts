import { apiClient } from "@/lib/apiClient";
import { useProductsStore } from "@/store/productsStore";
import {
  createProductSchema,
  dirtyFieldsProductSchema,
  updateProductSchema
} from "@shared/schemas/products.schema";
import type { CreateProductPayload, UpdateProductPayload } from "@shared/types";
import { convertToPaisa } from "@shared/utils/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import z from "zod";

export const useProductDialog = () => {
  const filterType = useProductsStore((state) => state.filterType);
  const openProductDialog = useProductsStore((state) => state.openProductDialog);
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);
  const actionType = useProductsStore((state) => state.actionType);
  const setActionType = useProductsStore((state) => state.setActionType);
  const productId = useProductsStore((state) => state.productId);
  const setProductId = useProductsStore((state) => state.setProductId);
  const formDataState = useProductsStore((state) => state.formDataState);
  const setFormDataState = useProductsStore((state) => state.setFormDataState);
  const dirtyFields = useProductsStore((state) => state.dirtyFields);
  const setDirtyFields = useProductsStore((state) => state.setDirtyFields);
  const searchParam = useProductsStore((state) => state.searchParam);
  const errors = useProductsStore((state) => state.errors);
  const setErrors = useProductsStore((state) => state.setErrors);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (actionType === "add") {
      setProductId(null);
      setFormDataState({});
      setDirtyFields({});
      setErrors({});
    }

    if (actionType === "edit") {
      setErrors({});
    }

    if (actionType === "billing-page-edit") {
      setErrors({});
    }
  }, [actionType, setProductId, setFormDataState, setDirtyFields, setErrors]);

  const handleInputChange = (field: string, value: any) => {
    setFormDataState({
      [field]: value
    });

    if (actionType === "billing-page-edit" || actionType === "edit") {
      setDirtyFields({
        [field]: value
      });
    }

    const result = updateProductSchema.safeParse({
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

  const CURRENCY_FIELDS = ["price", "purchasePrice", "mrp"];

  const convertCurrencyFieldsToPaisa = (data) => {
    const converted = { ...data };
    for (const [key, value] of Object.entries(data)) {
      if (CURRENCY_FIELDS.includes(key) && typeof value === "number") {
        converted[key] = convertToPaisa(value);
      }
    }
    return converted;
  };

  const productMutation = useMutation({
    mutationFn: async ({
      action,
      payload
    }:
      | {
          action: "add";
          payload: CreateProductPayload;
        }
      | {
          action: "edit" | "billing-page-edit";
          payload: UpdateProductPayload;
        }) => {
      if (action === "add") {
        return apiClient.post("/api/products", payload);
      } else {
        if (!productId) {
          throw new Error("Product Id does not exist");
        }
        return apiClient.patch(`/api/products/${productId}`, payload);
      }
    },
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: [filterType, searchParam] });
      setErrors({});
      setProductId(null);
      setFormDataState({});
      setDirtyFields({});
      setOpenProductDialog();
      toast.success(
        variables.action === "add" ? "Successfully created product" : "Successfully updated product"
      );
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleSubmit = async (action: "add" | "edit" | "billing-page-edit") => {
    let parseResult;

    if (action === "add") {
      parseResult = createProductSchema.safeParse(formDataState);
    } else {
      parseResult = dirtyFieldsProductSchema.safeParse(dirtyFields);
    }

    if (!parseResult.success) {
      const formatted = z.flattenError(parseResult.error);
      const errorRecord = { ...errors };

      for (const field in formatted.fieldErrors) {
        errorRecord[field] = formatted.fieldErrors[field]?.[0];
      }
      setErrors(errorRecord);
      return;
    }

    const payloadInPaisa = convertCurrencyFieldsToPaisa(parseResult.data);

    if (action === "add") {
      productMutation.mutate({ action, payload: payloadInPaisa as CreateProductPayload });
      return;
    }
    productMutation.mutate({ action, payload: payloadInPaisa as UpdateProductPayload });
  };

  const deleteProductMutation = useMutation<null, Error, string>({
    mutationFn: (productId: string) => apiClient.post(`/api/products/${productId}/delete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [filterType, searchParam] });
      setErrors({});
      setFormDataState({});
      setOpenProductDialog();
      toast.success("Successfully deleted product");
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
    productId,
    formDataState,
    dirtyFields,
    handleInputChange,
    handleSubmit,
    productMutation
  };
};
