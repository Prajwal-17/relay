import { apiClient } from "@/lib/apiClient";
import type {
  CreateAdjustmentPayload,
  CreateOpeningBalancePayload,
  CreatePaymentPayload,
  CreateQuickSalePayload,
  LedgerEntry
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
  };
};

export function useCreatePayment(customerId: string) {
  const invalidate = useInvalidateLedger(customerId);

  return useMutation<LedgerEntry, Error, CreatePaymentPayload>({
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
