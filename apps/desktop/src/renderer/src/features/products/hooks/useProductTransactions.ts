import { apiClient } from "@/lib/apiClient";
import type { PaginatedApiResponse, ProductTransaction } from "@shared/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const PAGE_SIZE = 12;

type ProductTransactionsResponse = PaginatedApiResponse<{ data: ProductTransaction[] }>;

export function useProductTransactions(productId: string | null | undefined) {
  const [pageNo, setPageNo] = useState(1);

  const query = useQuery<ProductTransactionsResponse>({
    queryKey: ["product-transactions", productId, pageNo],
    queryFn: () =>
      apiClient.get<ProductTransactionsResponse>(`/api/products/${productId}/transactions`, {
        pageNo,
        pageSize: PAGE_SIZE
      }),
    enabled: !!productId,
    placeholderData: keepPreviousData
  });

  const totalCount = query.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return {
    ...query,
    pageNo,
    totalPages,
    totalCount,
    hasNextPage: query.data?.nextPageNo !== null && query.data?.nextPageNo !== undefined,
    hasPrevPage: pageNo > 1,
    goToNextPage: () => {
      if (query.data?.nextPageNo) {
        setPageNo((p) => p + 1);
      }
    },
    goToPrevPage: () => {
      setPageNo((p) => Math.max(1, p - 1));
    }
  };
}
