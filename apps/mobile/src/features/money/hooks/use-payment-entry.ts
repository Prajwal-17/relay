import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard } from "react-native";

import { isFutureDate, parseLocalDate } from "@/lib/format/dates";
import { parseRupeeInput } from "@/lib/format/money";
import { confirmAction } from "@/lib/confirm-action";
import { useConfirmSheetDismissal } from "@/lib/navigation/use-confirm-sheet-dismissal";
import { useNetworkStatus } from "@/lib/network/use-network-status";
import { moneyKeys } from "../money.keys";
import {
  addReceivedPayment,
  deleteReceivedEntry,
  getDailyEntry,
  listPaymentMethods,
  listReceivedEntries
} from "../money.repository";

interface PaymentEntryOptions {
  date: string;
  method: string;
  name: string;
  archived: boolean;
  total: number;
  onClose: () => void;
}

export function usePaymentEntry(options?: PaymentEntryOptions) {
  const params = useLocalSearchParams<{ date?: string; method?: string; mode?: string }>();
  const date = parseLocalDate(options?.date ?? params.date);
  const methodParam = options?.method ?? params.method;
  const paymentMethodId = methodParam === "cash" ? null : Number(methodParam);
  const mode: "history" | "add" = options ? "add" : "history";
  const valid =
    date !== null &&
    !isFutureDate(date) &&
    (paymentMethodId === null || (Number.isSafeInteger(paymentMethodId) && paymentMethodId > 0));
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isOffline } = useNetworkStatus();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [savingFlow, setSavingFlow] = useState(false);
  const saveLock = useRef(false);

  const detailsQuery = useQuery({
    queryKey: ["money", "payment-details", date ?? "invalid", paymentMethodId ?? "cash"],
    enabled: valid && !options,
    queryFn: async ({ signal }) => {
      if (!date) throw new Error("Choose a valid payment date.");
      const [entry, methods] = await Promise.all([
        getDailyEntry(date, signal),
        listPaymentMethods(true, signal)
      ]);
      const paymentMethod = methods.find((item) => item.id === paymentMethodId);
      if (paymentMethodId !== null && !paymentMethod) throw new Error("Payment method not found.");
      return {
        method: {
          name: paymentMethod?.name ?? "Cash",
          archived: paymentMethod?.isArchived ?? false
        },
        total:
          paymentMethodId === null
            ? (entry?.cashAmount ?? 0)
            : (entry?.paymentTotals.find((row) => row.paymentMethodId === paymentMethodId)
                ?.amount ?? 0)
      };
    },
    refetchOnMount: "always"
  });

  const historyQuery = useInfiniteQuery({
    queryKey: date
      ? moneyKeys.receivedEntries(date, paymentMethodId)
      : (["money", "received-entries", "invalid"] as const),
    enabled: valid && mode === "history",
    initialPageParam: undefined as number | undefined,
    queryFn: ({ pageParam, signal }) => {
      if (!date) throw new Error("Choose a valid payment date.");
      return listReceivedEntries(date, paymentMethodId, pageParam, signal);
    },
    getNextPageParam: (lastPage) => (lastPage.length === 50 ? lastPage.at(-1)?.id : undefined),
    refetchOnMount: "always"
  });

  const addPayment = useMutation({ mutationFn: addReceivedPayment });
  const deletePayment = useMutation({
    mutationFn: deleteReceivedEntry,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: moneyKeys.all });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  });
  const method = options
    ? { name: options.name, archived: options.archived }
    : (detailsQuery.data?.method ?? { name: "", archived: false });
  const total = options ? options.total : (detailsQuery.data?.total ?? 0);
  const entries = historyQuery.data?.pages.flat() ?? [];
  const hasMore = Boolean(historyQuery.hasNextPage);
  const loadingMore = historyQuery.isFetchingNextPage;
  const loading = valid && !options && (detailsQuery.isPending || historyQuery.isPending);
  const retrying = !options && (detailsQuery.isFetching || historyQuery.isRefetching);
  const loadCause = options ? null : (detailsQuery.error ?? historyQuery.error);
  const loadError =
    loadCause instanceof Error ? loadCause.message : loadCause ? "Could not load entries." : null;
  const saving = savingFlow;
  const deletingId = deletePayment.isPending ? deletePayment.variables : null;
  const deleteError =
    deletePayment.error instanceof Error
      ? deletePayment.error.message
      : deletePayment.error
        ? "Could not delete this entry."
        : null;
  const saveError =
    requestError ??
    (addPayment.error instanceof Error
      ? addPayment.error.message
      : addPayment.error
        ? "Could not save this entry."
        : null);
  const parsed = parseRupeeInput(amount, "Payment");
  const parsedAmount = parsed.paisa ?? 0;
  const nextTotal = total + parsedAmount;
  const amountError =
    parsed.error || (!Number.isSafeInteger(nextTotal) ? "The new total is too large." : null);
  const canSave =
    valid &&
    mode === "add" &&
    !isOffline &&
    !saving &&
    !saved &&
    !loading &&
    !loadError &&
    !method.archived &&
    !amountError &&
    parsedAmount > 0 &&
    note.length <= 240;
  const dirty = amount.trim().length > 0 || note.trim().length > 0;

  const goBack = useCallback(() => {
    if (options) {
      if (saving) return;
      if (dirty && !saved) {
        confirmAction(
          "Discard this entry?",
          "This amount has not been added to Money.",
          "Discard",
          options.onClose
        );
      } else options.onClose();
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace("/money");
  }, [dirty, options, router, saved, saving]);

  const refetchDetails = detailsQuery.refetch;
  const refetchHistory = historyQuery.refetch;
  async function load() {
    setRequestError(null);
    await Promise.all([
      refetchDetails(),
      mode === "history" ? refetchHistory() : Promise.resolve()
    ]);
  }

  useConfirmSheetDismissal({
    blocked: !options && (dirty || saving) && !saved,
    canDiscard: !saving,
    title: "Discard this entry?",
    message: "This amount has not been added to Money."
  });

  useEffect(() => {
    if (saved) {
      if (options) options.onClose();
      else goBack();
    }
  }, [goBack, options, saved]);

  async function save() {
    if (!canSave || !date || saveLock.current) return;
    saveLock.current = true;
    setSavingFlow(true);
    setRequestError(null);
    addPayment.reset();
    try {
      await addPayment.mutateAsync({
        date,
        paymentMethodId,
        amount: parsedAmount,
        note: note.trim() || undefined
      });
      await queryClient.invalidateQueries({ queryKey: moneyKeys.all });
    } catch {
      saveLock.current = false;
      setSavingFlow(false);
      return;
    }
    Keyboard.dismiss();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSaved(true);
  }

  async function loadMore() {
    if (!date || !hasMore || loadingMore || saving) return;
    setRequestError(null);
    try {
      await historyQuery.fetchNextPage();
    } catch {
      setRequestError("Could not load older entries. Please try again.");
    }
  }

  function setSaveError(message: string | null) {
    setRequestError(message);
    if (message === null) addPayment.reset();
  }

  async function deleteEntry(id: number): Promise<boolean> {
    if (isOffline || deletePayment.isPending || mode !== "history") return false;
    deletePayment.reset();
    try {
      await deletePayment.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  }

  return {
    date,
    paymentMethodId,
    mode,
    valid,
    method,
    total,
    entries,
    hasMore,
    loadingMore,
    loading,
    retrying,
    loadError,
    deleteError,
    deletingId,
    amount,
    note,
    saving,
    saveError,
    amountError,
    canSave,
    parsedAmount,
    isOffline,
    setAmount,
    setNote,
    setSaveError,
    goBack,
    load,
    save,
    loadMore,
    deleteEntry,
    clearDeleteError: deletePayment.reset
  };
}
