import { apiClient } from "@/lib/apiClient";
import { useProductsStore, type ProductsFormType } from "@/store/productsStore";
import type { ProductSearchItemDTO } from "@shared/types";
import { convertToRupees } from "@shared/utils/utils";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

// fetch product by ID
export const useProductFetch = (productId: string | null, enabled: boolean) => {
  const setFormDataState = useProductsStore((state) => state.setFormDataState);

  const { data, isLoading, isError, error, refetch } = useQuery<ProductSearchItemDTO>({
    queryKey: ["product", productId],
    queryFn: () => {
      if (!productId) throw new Error("Product ID is required");
      return apiClient.get<ProductSearchItemDTO>(`/api/products/${productId}`);
    },
    enabled: enabled && !!productId,
    staleTime: 0,
    refetchOnMount: "always"
  });

  useEffect(() => {
    if (!data) return;

    const formData: Partial<ProductsFormType> = {
      name: data.name,
      weight: data.weight,
      unit: data.unit,
      imageUrl: data.imageUrl ?? null,
      mrp: data.mrp ? convertToRupees(data.mrp, { asString: true }) : null,
      price: convertToRupees(data.price, { asString: true }),
      purchasePrice: data.purchasePrice
        ? convertToRupees(data.purchasePrice, { asString: true })
        : null,
      isDisabled: data.isDisabled ?? false,
      isDeleted: data.isDeleted ?? false,
      totalQuantitySold: data.totalQuantitySold ?? null,
      lastSoldAt: data.lastSoldAt ?? null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? null,
      disabledAt: data.disabledAt ?? null
    };

    setFormDataState(formData);
  }, [data, setFormDataState]);

  return { isLoading, isError, error, refetch };
};
