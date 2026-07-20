import { apiClient } from "@/lib/apiClient";
import type {
  CreateAdjustmentPayload,
  CreateOpeningBalancePayload,
  CreatePaymentPayload,
  CreatePaymentResult,
  CreateQuickSalePayload,
  LedgerEntry,
  UpdateLedgerEntryPayload
} from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const useInvalidateLedger = (customerId: string) => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["customer-ledger", customerId], exact: false });
    queryClient.invalidateQueries({ queryKey: ["customer-ledger-summary", customerId] });
    queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
    queryClient.invalidateQueries({ queryKey: ["customers-infinite"], exact: false });
    queryClient.invalidateQueries({ queryKey: ["customer-txns", customerId], exact: false });
    queryClient.invalidateQueries({ queryKey: ["sales"], exact: false });
  };
};

export function useCreatePayment(customerId: string) {
  const invalidate = useInvalidateLedger(customerId);

  return useMutation<CreatePaymentResult, Error, CreatePaymentPayload>({
    mutationFn: (payload) => apiClient.post(`/api/customers/${customerId}/payments`, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Payment recorded");
    },
    onError: (error) => toast.error(error.message)
  });
}

export function useCreateAdjustment(customerId: string) {
  const invalidate = useInvalidateLedger(customerId);

  return useMutation<LedgerEntry, Error, CreateAdjustmentPayload>({
    mutationFn: (payload) => apiClient.post(`/api/customers/${customerId}/adjustments`, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Balance adjusted");
    },
    onError: (error) => toast.error(error.message)
  });
}

export function useCreateQuickSale(customerId: string) {
  const invalidate = useInvalidateLedger(customerId);

  return useMutation<LedgerEntry, Error, CreateQuickSalePayload>({
    mutationFn: (payload) => apiClient.post(`/api/customers/${customerId}/quick-sales`, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Quick sale recorded");
    },
    onError: (error) => toast.error(error.message)
  });
}

export function useCreateOpeningBalance(customerId: string) {
  const invalidate = useInvalidateLedger(customerId);

  return useMutation<LedgerEntry, Error, CreateOpeningBalancePayload>({
    mutationFn: (payload) =>
      apiClient.post(`/api/customers/${customerId}/opening-balance`, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Opening balance set");
    },
    onError: (error) => toast.error(error.message)
  });
}

export function useUpdateLedgerEntry(customerId: string) {
  const invalidate = useInvalidateLedger(customerId);

  return useMutation<LedgerEntry, Error, { entryId: string; payload: UpdateLedgerEntryPayload }>({
    mutationFn: ({ entryId, payload }) =>
      apiClient.patch(`/api/customers/${customerId}/ledger/${entryId}`, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Entry updated");
    },
    onError: (error) => toast.error(error.message)
  });
}

export function useDeleteLedgerEntry(customerId: string) {
  const invalidate = useInvalidateLedger(customerId);

  return useMutation<void, Error, string>({
    mutationFn: (entryId) => apiClient.delete(`/api/customers/${customerId}/ledger/${entryId}`),
    onSuccess: () => {
      invalidate();
      toast.success("Entry deleted");
    },
    onError: (error) => toast.error(error.message)
  });
}
