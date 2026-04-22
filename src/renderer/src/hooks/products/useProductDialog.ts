import { blobToDataUrl } from "@/features/productDialog/productImageCrop";
import { apiClient } from "@/lib/apiClient";
import { useProductsStore } from "@/store/productsStore";
import { dirtyFieldsProductSchema, updateProductSchema } from "@shared/schemas/products.schema";
import type { CreateProductPayload, UpdateProductPayload } from "@shared/types";
import { convertToPaisa } from "@shared/utils/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import z from "zod";

type ProductMutationVariables =
  | {
      action: "add";
      payload: CreateProductPayload;
      pendingImageBlob?: Blob | null;
    }
  | {
      action: "edit" | "billing-page-edit";
      payload: UpdateProductPayload;
      pendingImageBlob?: Blob | null;
    };

export const useProductDialog = () => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();

  const actionType = useProductsStore((state) => state.actionType);

  useEffect(() => {
    const state = useProductsStore.getState();
    if (actionType === "add") {
      state.setProductId(null);
      state.setFormDataState(
        Object.keys(state.formDataState).length > 0 ? {} : state.formDataState
      );
      state.setDirtyFields({});
      state.setErrors({});
    }

    if (actionType === "edit" || actionType === "billing-page-edit") {
      state.setErrors({});
    }
  }, [actionType]);

  const handleInputChange = (field: string, value: any) => {
    const { actionType, formDataState, errors, setFormDataState, setDirtyFields, setErrors } =
      useProductsStore.getState();

    const updates: Record<string, any> = { [field]: value };

    if (field === "unit" && (value === "none" || value === "")) {
      updates.weight = "";
    } else if (field === "weight" && (value === "" || value === null)) {
      updates.unit = "none";
    }

    setFormDataState(updates);

    if (actionType === "billing-page-edit" || actionType === "edit") {
      setDirtyFields(updates);
    }

    const result = updateProductSchema.safeParse({
      ...formDataState,
      ...updates
    });

    const errorRecord = { ...errors };

    if (!result.success) {
      const formatted = z.flattenError(result.error);

      if (formatted.fieldErrors[field]) {
        errorRecord[field] = formatted.fieldErrors[field]?.[0];
      } else {
        delete errorRecord[field];
      }

      if (field === "weight" || field === "unit") {
        if (formatted.fieldErrors.unit) errorRecord.unit = formatted.fieldErrors.unit[0];
        else delete errorRecord.unit;

        if (formatted.fieldErrors.weight) errorRecord.weight = formatted.fieldErrors.weight[0];
        else delete errorRecord.weight;
      }

      setErrors(errorRecord);
    } else {
      delete errorRecord[field];
      if (field === "weight" || field === "unit") {
        delete errorRecord.unit;
        delete errorRecord.weight;
      }
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
    mutationFn: async ({ action, payload, pendingImageBlob }: ProductMutationVariables) => {
      const { productId } = useProductsStore.getState();
      const payloadWithSavedImage: CreateProductPayload | UpdateProductPayload = { ...payload };

      if (pendingImageBlob) {
        const dataUrl = await blobToDataUrl(pendingImageBlob);
        const response = await window.productsApi.saveProductImage(dataUrl);

        if (response.status === "error") {
          throw new Error(response.error.message);
        }

        payloadWithSavedImage.imageUrl = response.data.url;
      }

      if (action === "add") {
        return apiClient.post("/api/products", payloadWithSavedImage);
      } else {
        if (!productId) {
          throw new Error("Product Id does not exist");
        }
        return apiClient.patch(`/api/products/${productId}`, payloadWithSavedImage);
      }
    },
    onSuccess: (_response, variables) => {
      const {
        filterType,
        searchParam,
        setErrors,
        setProductId,
        setFormDataState,
        setDirtyFields,
        setOpenProductDialog
      } = useProductsStore.getState();

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
    const { formDataState, dirtyFields, setErrors } = useProductsStore.getState();
    const pendingImageBlob = formDataState.pendingImageBlob ?? null;
    const fullFormValidation = updateProductSchema.safeParse(formDataState);

    if (!fullFormValidation.success) {
      const formatted = z.flattenError(fullFormValidation.error);
      const errorRecord: Record<string, any> = {};

      for (const field in formatted.fieldErrors) {
        errorRecord[field] = formatted.fieldErrors[field]?.[0];
      }
      setErrors(errorRecord);
      return;
    }

    let parseResult;

    if (action === "add") {
      parseResult = fullFormValidation;
    } else {
      parseResult = dirtyFieldsProductSchema.safeParse(dirtyFields);
      if (!parseResult.success) {
        const formatted = z.flattenError(parseResult.error);
        const errorRecord: Record<string, any> = {};

        for (const field in formatted.fieldErrors) {
          errorRecord[field] = formatted.fieldErrors[field]?.[0];
        }
        setErrors(errorRecord);
        return;
      }
    }

    const payloadInPaisa = convertCurrencyFieldsToPaisa(parseResult.data);

    if (action === "add") {
      productMutation.mutate({
        action,
        payload: payloadInPaisa as CreateProductPayload,
        pendingImageBlob
      });
      return;
    }
    productMutation.mutate({
      action,
      payload: payloadInPaisa as UpdateProductPayload,
      pendingImageBlob
    });
  };

  const deleteProductMutation = useMutation<null, Error, string>({
    mutationFn: (productId: string) => apiClient.post(`/api/products/${productId}/delete`),
    onSuccess: () => {
      const { filterType, searchParam, setErrors, setFormDataState, setOpenProductDialog } =
        useProductsStore.getState();

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
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleInputChange,
    handleSubmit,
    productMutation,
    deleteProductMutation
  };
};
