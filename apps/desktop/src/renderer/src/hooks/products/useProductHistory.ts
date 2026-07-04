import { apiClient } from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";

export interface ProductHistoryEntry {
  oldPrice: number | null;
  newPrice: number | null;
  oldMrp: number | null;
  newMrp: number | null;
  oldPurchasePrice: number | null;
  newPurchasePrice: number | null;
  createdAt: string;
}

export interface ProductHistoryResponse {
  productId: string;
  entries: ProductHistoryEntry[];
}

export function useProductHistory(productId: string | null | undefined) {
  return useQuery({
    queryKey: ["product-history", productId],
    queryFn: () => apiClient.get<ProductHistoryResponse>(`/api/products/${productId}/history`),
    enabled: !!productId
  });
}
