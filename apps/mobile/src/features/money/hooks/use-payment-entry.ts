import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Keyboard } from "react-native";

import { isFutureDate, parseLocalDate } from "@/lib/format/dates";
import { paisaToInput, parseRupeeInput } from "@/lib/format/money";
import { confirmAction } from "@/lib/confirm-action";
import { useNetworkStatus } from "@/lib/network/use-network-status";
import { applyMoneyMutation } from "../money.cache";
import { moneyKeys } from "../money.keys";
import { receivedHistoryOptions } from "../money.queries";
import type {
  DailyEntry,
  PaymentMethod,
  EditableReceivedEntry,
  ReceivedEntry
} from "../money.types";
import { entryMethods } from "../payment-catalog";
import { createEntrySaveFlow } from "../save-flow";
import { summarizeEntry } from "../money.utils";
import {
  addReceivedPayment,
  updateReceivedPayment,
  deleteReceivedEntry
} from "../money.repository";

interface PaymentEntryOptions {
  date: string;
  method: string;
  paymentMethods: PaymentMethod[];
  dayEntry: DailyEntry | null;
  onClose: () => void;
  initialEntry?: EditableReceivedEntry;
}

export function usePaymentEntry(options?: PaymentEntryOptions) {
  const params = useLocalSearchParams<{ date?: string; method?: string }>();
  const date = parseLocalDate(options?.date ?? params.date);
  const [selectedMethod, setSelectedMethod] = useState(() => options?.method ?? "cash");
  const methodParam = options ? selectedMethod : params.method;
  const paymentMethodId = methodParam === "cash" ? null : Number(methodParam);
  const valid =
    date !== null &&
    !isFutureDate(date) &&
    (paymentMethodId === null || (Number.isSafeInteger(paymentMethodId) && paymentMethodId > 0));
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isOffline } = useNetworkStatus();
  const initial = options?.initialEntry;
  const [amount, setAmount] = useState(() => (initial ? paisaToInput(initial.amount) : ""));
  const [note, setNote] = useState(() => initial?.note ?? "");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [savingFlow, setSavingFlow] = useState(false);
  const [committed, setCommitted] = useState(false);
  const [saveFlow] = useState(createEntrySaveFlow);
  const availableMethods: PaymentMethod[] = options ? entryMethods(options.paymentMethods) : [];
  const originalMethod =
    initial && initial.paymentMethodId !== null
      ? options?.paymentMethods.find((method) => method.id === initial.paymentMethodId)
      : undefined;
  if (originalMethod && !availableMethods.some((method) => method.id === originalMethod.id))
    availableMethods.push(originalMethod);
  const selectedProvider = availableMethods.find((method) => method.id === paymentMethodId);

  const historyQuery = useInfiniteQuery({
    ...receivedHistoryOptions(date, paymentMethodId),
    enabled: valid && !options
  });

  const addPayment = useMutation({
    mutationFn: (input: Parameters<typeof addReceivedPayment>[0]) =>
      initial
        ? updateReceivedPayment(initial.id, {
            paymentMethodId: input.paymentMethodId,
            amount: input.amount,
            note: input.note
          })
        : addReceivedPayment(input)
  });
  const deletePayment = useMutation({
    mutationFn: deleteReceivedEntry,
    onSuccess: async (result, id) => {
      await applyMoneyMutation(queryClient, result, { methodId: paymentMethodId, deletedId: id });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  });
  const history = historyQuery.data?.pages[0];
  const method = options
    ? {
        name: paymentMethodId === null ? "Cash" : (selectedProvider?.name ?? ""),
        archived: paymentMethodId !== null && !selectedProvider
      }
    : {
        name: history ? (history.method?.name ?? "Cash") : "",
        archived: history?.method?.isArchived ?? false
      };
  const total = options
    ? paymentMethodId === null
      ? (options.dayEntry?.cashAmount ?? 0)
      : (options.dayEntry?.paymentTotals.find((row) => row.paymentMethodId === paymentMethodId)
          ?.amount ?? 0)
    : (history?.total ?? 0);
  const daySummary = options?.dayEntry ? summarizeEntry(options.dayEntry) : null;
  const entries = historyQuery.data?.pages.flatMap((page) => page.entries) ?? [];
  const hasMore = Boolean(historyQuery.hasNextPage);
  const loadingMore = historyQuery.isFetchingNextPage;
  const loading = valid && !options && historyQuery.isPending;
  const retrying = !options && historyQuery.isRefetching;
  const loadCause = options ? null : historyQuery.error;
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
  const nextTotal =
    (options ? (daySummary?.receivedAmount ?? 0) : total) - (initial?.amount ?? 0) + parsedAmount;
  const amountError =
    parsed.error || (!Number.isSafeInteger(nextTotal) ? "The new total is too large." : null);
  const dirty = initial
    ? parsedAmount !== initial.amount ||
      note.trim() !== (initial.note ?? "") ||
      paymentMethodId !== initial.paymentMethodId
    : amount.trim().length > 0 || note.trim().length > 0;
  const canSave = committed
    ? !isOffline && !saving
    : valid &&
      Boolean(options) &&
      (!initial || dirty) &&
      !isOffline &&
      !saving &&
      !loading &&
      !loadError &&
      !method.archived &&
      !amountError &&
      parsedAmount > 0 &&
      note.length <= 240;

  const goBack = useCallback(() => {
    if (options) {
      if (saveFlow.locked) return;
      if (saveFlow.committed) {
        options.onClose();
        return;
      }
      if (dirty) {
        confirmAction(
          initial ? "Discard changes?" : "Discard this entry?",
          initial
            ? "Your changes have not been saved."
            : "This amount has not been added to Money.",
          "Discard",
          options.onClose
        );
      } else options.onClose();
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace("/money");
  }, [dirty, initial, options, router, saveFlow]);

  const refetchHistory = historyQuery.refetch;
  async function load() {
    setRequestError(null);
    if (!options) await refetchHistory();
  }

  async function save() {
    if (!canSave || !date || !options) return;
    await saveFlow.run({
      pending: setSavingFlow,
      committed: () => {
        setCommitted(true);
      },
      error: setRequestError,
      request: () =>
        addPayment.mutateAsync({
          date,
          paymentMethodId,
          amount: parsedAmount,
          note: note.trim() || undefined
        }),
      synchronize: (result) =>
        applyMoneyMutation(queryClient, result, { methodId: paymentMethodId }),
      feedback: () => Keyboard.dismiss(),
      complete: options.onClose
    });
  }

  function selectMethod(id: number | null) {
    if (!options || saveFlow.locked || saveFlow.committed || id === paymentMethodId) return;
    if (id !== null && !availableMethods.some((method) => method.id === id)) return;
    setSelectedMethod(id === null ? "cash" : String(id));
    setSaveError(null);
  }

  async function loadMore() {
    if (!date || !hasMore || loadingMore || saving) return;
    setRequestError(null);
    try {
      const result = await historyQuery.fetchNextPage();
      if (result.isError) throw result.error;
    } catch {
      setRequestError("Could not load older entries. Please try again.");
    }
  }

  function setSaveError(message: string | null) {
    setRequestError(message);
    if (message === null) addPayment.reset();
  }

  async function deleteEntry(id: number): Promise<boolean> {
    if (isOffline || deletePayment.isPending || options) return false;
    deletePayment.reset();
    try {
      await deletePayment.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  }

  function editEntry(entry: ReceivedEntry) {
    if (!date || isOffline || deletingId !== null) return;
    queryClient.setQueryData(moneyKeys.entry("received", entry.id), {
      ...entry,
      kind: "received",
      date,
      paymentMethodId
    } satisfies EditableReceivedEntry);
    router.push({
      pathname: "/money-entry",
      params: {
        date,
        kind: "received",
        entryId: String(entry.id),
        method: paymentMethodId === null ? "cash" : String(paymentMethodId)
      }
    });
  }

  return {
    editing: Boolean(initial),
    editEntry,
    date,
    paymentMethodId,
    valid,
    method,
    total,
    entries,
    hasMore,
    loadingMore,
    loading,
    hasData: Boolean(history),
    retrying,
    loadError,
    deleteError,
    deletingId,
    amount,
    note,
    saving,
    dirty,
    committed,
    saveError,
    amountError,
    canSave,
    parsedAmount,
    availableMethods,
    selectMethod,
    draftLocked: saving || committed,
    isOffline,
    setAmount: (value: string) => {
      if (!saveFlow.locked && !saveFlow.committed) setAmount(value);
    },
    setNote: (value: string) => {
      if (!saveFlow.locked && !saveFlow.committed) setNote(value);
    },
    setSaveError,
    goBack,
    load,
    save,
    loadMore,
    deleteEntry,
    clearDeleteError: deletePayment.reset
  };
}
