import { blobToDataUrl } from "@/features/products/dialog/productImageCrop";
import { apiClient } from "@/lib/apiClient";
import { useProductsStore } from "@/features/products/products.store";
import { dirtyFieldsProductSchema, updateProductSchema } from "@shared/schemas/products.schema";
import {
  ACTION_TYPE,
  PRODUCT_OPERATION,
  type ActionType,
  type CreateProductPayload,
  type ProductOperation,
  type UpdateProductPayload
} from "@shared/types";
import { rupeesToPaisa } from "@shared/utils/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import z from "zod";

type ProductMutationVariables =
  | {
      action: typeof ACTION_TYPE.ADD;
      payload: CreateProductPayload;
      pendingImageBlob?: Blob | null;
    }
  | {
      action: typeof ACTION_TYPE.EDIT | typeof ACTION_TYPE.BILLING_PAGE_EDIT;
      payload: UpdateProductPayload;
      pendingImageBlob?: Blob | null;
    };

type PermanentDeleteVariables = {
  productId: string;
  imageId?: string | null;
};

async function cleanupProductImage(imageId: string, reason: string) {
  try {
    const response = await window.productsApi.deleteProductImage(imageId);
    if (response.status === "error") {
      console.error(reason, response.error.message);
    }
  } catch (error) {
    console.error(reason, error);
  }
}

export const useProductDialog = () => {
  const queryClient = useQueryClient();

  const actionType = useProductsStore((state) => state.actionType);

  useEffect(() => {
    const state = useProductsStore.getState();
    if (actionType === ACTION_TYPE.ADD) {
      state.setProductId(null);
      state.setFormDataState(
        Object.keys(state.formDataState).length > 0 ? {} : state.formDataState
      );
      state.setDirtyFields({});
      state.setErrors({});
    }

    if (actionType === ACTION_TYPE.EDIT || actionType === ACTION_TYPE.BILLING_PAGE_EDIT) {
      state.setErrors({});
    }
  }, [actionType]);

  const handleInputChange = (field: string, value: any) => {
    const { actionType, formDataState, errors, setFormDataState, setDirtyFields, setErrors } =
      useProductsStore.getState();

    const updates: Record<string, any> = { [field]: value };

    setFormDataState(updates);

    if (actionType === ACTION_TYPE.BILLING_PAGE_EDIT || actionType === ACTION_TYPE.EDIT) {
      setDirtyFields(updates);
    }

    const result = updateProductSchema.safeParse({
      ...formDataState,
      ...updates
    });

    const errorRecord = { ...errors };

    if (!result.success) {
      const formatted = z.flattenError(result.error);

      if ((formatted.fieldErrors as Record<string, string[]>)[field]) {
        errorRecord[field] = (formatted.fieldErrors as Record<string, string[]>)[field]?.[0] ?? "";
      } else {
        delete errorRecord[field];
      }

      if (field === "weight" || field === "unit") {
        if (formatted.fieldErrors.unit) errorRecord.unit = formatted.fieldErrors.unit[0]!;
        else delete errorRecord.unit;

        if (formatted.fieldErrors.weight) errorRecord.weight = formatted.fieldErrors.weight[0]!;
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

  const convertCurrencyFieldsToPaisa = (data: Record<string, any>) => {
    const converted = { ...data };
    for (const [key, value] of Object.entries(data)) {
      if (CURRENCY_FIELDS.includes(key) && typeof value === "number") {
        converted[key] = rupeesToPaisa(value);
      }
    }
    return converted;
  };

  const productMutation = useMutation({
    mutationFn: async ({ action, payload, pendingImageBlob }: ProductMutationVariables) => {
      const { productId, formDataState } = useProductsStore.getState();
      const payloadWithSavedImage: CreateProductPayload | UpdateProductPayload = { ...payload };
      const previousImageId =
        action === ACTION_TYPE.ADD
          ? null
          : (formDataState.persistedImageUrl ?? formDataState.imageUrl ?? null);
      let newlySavedImageId: string | null = null;

      try {
        if (pendingImageBlob) {
          const dataUrl = await blobToDataUrl(pendingImageBlob);
          const response = await window.productsApi.saveProductImage(dataUrl);

          if (response.status === "error") {
            throw new Error(response.error.message);
          }

          newlySavedImageId = response.data.id;
          payloadWithSavedImage.imageUrl = newlySavedImageId;
        }

        const result =
          action === ACTION_TYPE.ADD
            ? await apiClient.post("/api/products", payloadWithSavedImage)
            : productId
              ? await apiClient.patch(`/api/products/${productId}`, payloadWithSavedImage)
              : await Promise.reject(new Error("Product Id does not exist"));

        if (
          previousImageId &&
          (newlySavedImageId !== null || payloadWithSavedImage.imageUrl === null)
        ) {
          await cleanupProductImage(
            previousImageId,
            "Product updated, but the previous image could not be removed."
          );
        }

        return result;
      } catch (error) {
        if (newlySavedImageId) {
          await cleanupProductImage(
            newlySavedImageId,
            "Product save failed, and the newly written image could not be removed."
          );
        }
        throw error;
      }
    },
    onSuccess: (_response, variables) => {
      const {
        formDataState,
        setErrors,
        setProductId,
        setFormDataState,
        setDirtyFields,
        setOpenProductDialog
      } = useProductsStore.getState();

      queryClient.invalidateQueries({ queryKey: ["product-search"] });
      if (formDataState.pendingImagePreviewUrl) {
        URL.revokeObjectURL(formDataState.pendingImagePreviewUrl);
      }
      setErrors({});
      setProductId(null);
      setFormDataState({});
      setDirtyFields({});
      setOpenProductDialog();
      toast.success(
        variables.action === ACTION_TYPE.ADD
          ? "Successfully created product"
          : "Successfully updated product"
      );
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleSubmit = async (action: ActionType) => {
    const { formDataState, dirtyFields, setErrors } = useProductsStore.getState();
    const pendingImageBlob = formDataState.pendingImageBlob ?? null;
    const fullFormValidation = updateProductSchema.safeParse(formDataState);

    if (!fullFormValidation.success) {
      const formatted = z.flattenError(fullFormValidation.error);
      const errorRecord: Record<string, any> = {};

      for (const field in formatted.fieldErrors) {
        errorRecord[field] = (formatted.fieldErrors as Record<string, string[]>)[field]?.[0] ?? "";
      }
      setErrors(errorRecord);
      return;
    }

    let parseResult;

    if (action === ACTION_TYPE.ADD) {
      parseResult = fullFormValidation;
    } else {
      parseResult = dirtyFieldsProductSchema.safeParse(dirtyFields);
      if (!parseResult.success) {
        const formatted = z.flattenError(parseResult.error);
        const errorRecord: Record<string, any> = {};

        for (const field in formatted.fieldErrors) {
          errorRecord[field] =
            (formatted.fieldErrors as Record<string, string[]>)[field]?.[0] ?? "";
        }
        setErrors(errorRecord);
        return;
      }
    }

    const payloadInPaisa = convertCurrencyFieldsToPaisa(parseResult.data);

    if (action === ACTION_TYPE.ADD) {
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

  const [activeDialog, setActiveDialog] = useState<ProductOperation>(PRODUCT_OPERATION.IDLE);

  const dialogMessages = {
    [PRODUCT_OPERATION.SOFT_DELETE]: {
      title: "Delete Product?",
      description:
        "Are you sure you want to delete this product? It will be moved to the deleted products list."
    },
    [PRODUCT_OPERATION.PERMANENT_DELETE]: {
      title: "Permanently Delete Product?",
      description:
        "This action cannot be undone. This product will be permanently removed from the database."
    },
    [PRODUCT_OPERATION.RESTORE]: {
      title: "Restore Product?",
      description: "Are you sure you want to restore this product to your active inventory?"
    }
  };

  const softDeleteProductMutation = useMutation<null, Error, string>({
    mutationFn: (productId: string) => apiClient.post(`/api/products/${productId}/delete`),
    onSuccess: () => {
      const { setErrors, setFormDataState, openProductDialog, setOpenProductDialog } =
        useProductsStore.getState();

      queryClient.invalidateQueries({ queryKey: ["product-search"] });
      setErrors({});
      setFormDataState({});
      if (openProductDialog) {
        setOpenProductDialog();
      }
      toast.success("Successfully deleted product");
      setActiveDialog(PRODUCT_OPERATION.IDLE);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const permanentDeleteProductMutation = useMutation<null, Error, PermanentDeleteVariables>({
    mutationFn: async ({ productId, imageId }) => {
      const result = await apiClient.delete<null>(`/api/products/${productId}/delete`);
      if (imageId) {
        await cleanupProductImage(
          imageId,
          "Product was permanently deleted, but its image could not be removed."
        );
      }
      return result;
    },
    onSuccess: () => {
      const { setErrors, setFormDataState, openProductDialog, setOpenProductDialog } =
        useProductsStore.getState();

      queryClient.invalidateQueries({ queryKey: ["product-search"] });
      setErrors({});
      setFormDataState({});
      if (openProductDialog) {
        setOpenProductDialog();
      }
      toast.success("Successfully deleted product permanently");
      setActiveDialog(PRODUCT_OPERATION.IDLE);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const restoreProductMutation = useMutation<null, Error, string>({
    mutationFn: (productId: string) => apiClient.post(`/api/products/${productId}/restore`),
    onSuccess: () => {
      const { setErrors, setFormDataState, openProductDialog, setOpenProductDialog } =
        useProductsStore.getState();

      queryClient.invalidateQueries({ queryKey: ["product-search"] });
      setErrors({});
      setFormDataState({});
      if (openProductDialog) {
        setOpenProductDialog();
      }
      toast.success("Successfully restored product");
      setActiveDialog(PRODUCT_OPERATION.IDLE);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  return {
    activeDialog,
    setActiveDialog,
    dialogMessages,
    handleInputChange,
    handleSubmit,
    productMutation,
    softDeleteProductMutation,
    permanentDeleteProductMutation,
    restoreProductMutation
  };
};
