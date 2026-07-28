import { apiClient } from "@/lib/apiClient";
import {
  DASHBOARD_TYPE,
  TRANSACTION_TYPE,
  type BatchCheckAction,
  type DashboardType,
  type TransactionType,
  type UnifiedTransctionWithItems,
  type UpdateQtyAction
} from "@shared/types";
import { formatRupee } from "@shared/utils/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export type MutationVariables = {
  type: DashboardType;
  id: string;
  itemId: string;
  action: UpdateQtyAction;
};

type BatchUpdateMutationVariables = {
  type: DashboardType;
  id: string;
  action: BatchCheckAction;
};

type ActionVariables = { type: DashboardType; id: string };

export const useViewModal = ({ type, id }: { type: DashboardType; id: string }) => {
  const queryClient = useQueryClient();
  const { data, isError, error, isLoading } = useQuery({
    queryKey: [type, id],
    queryFn: () => apiClient.get<UnifiedTransctionWithItems>(`/api/${type}/${id}`)
  });

  // Per-item checked-qty updates (fulfillment workflow)
  const updateQtyMutation = useMutation<null, Error, MutationVariables>({
    mutationFn: ({ type, id, itemId, action }) =>
      apiClient.post(`/api/${type}/${id}/items/${itemId}/checked-qty`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [type, id], exact: false });
    }
  });

  const batchUpdateQtyMutation = useMutation<null, Error, BatchUpdateMutationVariables>({
    mutationFn: ({ type, id, action }) =>
      apiClient.post(`/api/${type}/${id}/items/checked-qty/batch`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [type, id], exact: false });
      toast.success("Successfully updated items.");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  // Transaction-level actions (mirrors dashboard row)
  const deleteMutation = useMutation<null, Error, ActionVariables>({
    mutationFn: ({ type, id }) => apiClient.delete(`/api/${type}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [type], exact: false });
      toast.success("Transaction deleted");
    },
    onError: (err) => toast.error(err.message)
  });

  const convertMutation = useMutation<{ id: string }, Error, ActionVariables>({
    mutationFn: ({ id }) => apiClient.post(`/api/estimates/${id}/convert`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [type], exact: false });
      toast.success("Transaction converted");
    },
    onError: (err) => toast.error(err.message)
  });

  const duplicateMutation = useMutation<{ id: string }, Error, ActionVariables>({
    mutationFn: ({ type, id }) => apiClient.post(`/api/${type}/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [type], exact: false });
      toast.success("Transaction duplicated");
    },
    onError: (err) => toast.error(err.message)
  });

  // PDF export via Electron IPC (expects singular TransactionType)
  const txnType: TransactionType =
    type === DASHBOARD_TYPE.SALES ? TRANSACTION_TYPE.SALE : TRANSACTION_TYPE.ESTIMATE;

  const [pdfLoading, setPdfLoading] = useState(false);
  const exportPdf = useCallback(async (): Promise<string | null> => {
    setPdfLoading(true);
    try {
      const response = await window.exportApi.exportAsPdf(id, txnType);
      if (response?.status === "success") {
        return response.data;
      }
      toast.error(response?.error?.message || "Failed to generate PDF");
      return null;
    } catch (e) {
      console.error("PDF Export failed", e);
      toast.error("Failed to export PDF");
      return null;
    } finally {
      setPdfLoading(false);
    }
  }, [id, txnType]);

  useEffect(() => {
    if (isError && error) {
      toast.error(error.message);
    }
  }, [isError, error]);

  // Computed display values
  const items = data?.items ?? [];
  const total = items.reduce((sum, currentItem) => {
    return sum + Number(currentItem.totalPrice || 0);
  }, 0);
  const subtotal = formatRupee(total);
  const grandTotal = formatRupee(Math.round(total));
  const totalQty = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
  const totalCheckedQty = items.reduce((s, it) => s + Number(it.checkedQty || 0), 0);
  const itemsCount = items.length;

  return {
    data,
    isLoading,
    subtotal,
    grandTotal,
    itemsCount,
    totalQty,
    totalCheckedQty,
    updateQtyMutation,
    batchUpdateQtyMutation,
    deleteMutation,
    convertMutation,
    duplicateMutation,
    exportPdf,
    pdfLoading
  };
};
