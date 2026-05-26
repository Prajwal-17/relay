import { blobToDataUrl } from "@/features/productDialog/productImageCrop";
import { apiClient } from "@/lib/apiClient";
import { useProductsStore } from "@/store/productsStore";
import { dirtyFieldsProductSchema, updateProductSchema } from "@shared/schemas/products.schema";
import {
  ACTION_TYPE,
  PRODUCT_OPERATION,
  type CreateProductPayload,
  type UpdateProductPayload,
  type ActionType,
  type ProductOperation
} from "@shared/types";
import { convertToPaisa } from "@shared/utils/utils";
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

    if (field === "unit" && (value === "none" || value === "")) {
      updates.weight = "";
    } else if (field === "weight" && (value === "" || value === null)) {
      updates.unit = "none";
    }

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

      if (action === ACTION_TYPE.ADD) {
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
        setErrors,
        setProductId,
        setFormDataState,
        setDirtyFields,
        setOpenProductDialog
      } = useProductsStore.getState();

      queryClient.invalidateQueries({ queryKey: [filterType] });
      setErrors({});
      setProductId(null);
      setFormDataState({});
      setDirtyFields({});
      setOpenProductDialog();
      toast.success(
        variables.action === ACTION_TYPE.ADD ? "Successfully created product" : "Successfully updated product"
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
        errorRecord[field] = formatted.fieldErrors[field]?.[0];
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
          errorRecord[field] = formatted.fieldErrors[field]?.[0];
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
      const { filterType, setErrors, setFormDataState, openProductDialog, setOpenProductDialog } =
        useProductsStore.getState();

      queryClient.invalidateQueries({ queryKey: [filterType] });
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

  const permanentDeleteProductMutation = useMutation<null, Error, string>({
    mutationFn: (productId: string) => apiClient.delete(`/api/products/${productId}/delete`),
    onSuccess: () => {
      const { filterType, setErrors, setFormDataState, openProductDialog, setOpenProductDialog } =
        useProductsStore.getState();

      queryClient.invalidateQueries({ queryKey: [filterType] });
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
      const { filterType, setErrors, setFormDataState, openProductDialog, setOpenProductDialog } =
        useProductsStore.getState();

      queryClient.invalidateQueries({ queryKey: [filterType] });
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
