import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { Keyboard } from "react-native";

import { isFutureDate, parseLocalDate } from "@/lib/format/dates";
import { paisaToInput, parseRupeeInput } from "@/lib/format/money";
import { confirmAction } from "@/lib/confirm-action";
import { useNetworkStatus } from "@/lib/network/use-network-status";
import { applyMoneyMutation } from "../money.cache";
import type { EditableVendorPayment } from "../money.types";
import { addVendorPayment, updateVendorPayment } from "../money.repository";
import { createEntrySaveFlow } from "../save-flow";

interface VendorPaymentOptions {
  date: string;
  onClose: () => void;
  paidAmount: number;
  initialEntry?: EditableVendorPayment;
}

export function useVendorPayment(options: VendorPaymentOptions) {
  const date = parseLocalDate(options.date);
  const valid = date !== null && !isFutureDate(date);
  const queryClient = useQueryClient();
  const { isOffline } = useNetworkStatus();
  const [savingFlow, setSavingFlow] = useState(false);
  const [committed, setCommitted] = useState(false);
  const initial = options.initialEntry;
  const [vendorName, setVendorName] = useState(() => initial?.vendorName ?? "");
  const [amount, setAmount] = useState(() => (initial ? paisaToInput(initial.amount) : ""));
  const [note, setNote] = useState(() => initial?.note ?? "");
  const [requestError, setRequestError] = useState<string | null>(null);
  const savePayment = useMutation({
    mutationFn: (input: Parameters<typeof addVendorPayment>[0]) =>
      initial
        ? updateVendorPayment(initial.id, {
            vendorName: input.vendorName,
            amount: input.amount,
            note: input.note
          })
        : addVendorPayment(input)
  });
  const saving = savingFlow;
  const error =
    requestError ??
    (savePayment.error instanceof Error
      ? savePayment.error.message
      : savePayment.error
        ? "Could not save vendor payment."
        : null);
  const [saveFlow] = useState(createEntrySaveFlow);
  const parsed = parseRupeeInput(amount, "Payment");
  const dirty = initial
    ? vendorName.trim() !== initial.vendorName ||
      parsed.paisa !== initial.amount ||
      note.trim() !== (initial.note ?? "")
    : Boolean(vendorName.trim() || amount.trim() || note.trim());
  const amountError =
    parsed.error ??
    (!Number.isSafeInteger(options.paidAmount - (initial?.amount ?? 0) + (parsed.paisa ?? 0))
      ? "The new vendor total is too large."
      : null);
  const vendorError =
    vendorName.trim().length === 0
      ? "Enter a vendor or payee name."
      : vendorName.trim().length > 120
        ? "Vendor name must be 120 characters or fewer."
        : null;
  const canSave = committed
    ? !isOffline && !saving
    : valid &&
      (!initial || dirty) &&
      !isOffline &&
      !saving &&
      !vendorError &&
      !amountError &&
      (parsed.paisa ?? 0) > 0 &&
      note.length <= 240;

  const goBack = useCallback(() => {
    if (saveFlow.locked) return;
    if (saveFlow.committed) {
      options.onClose();
      return;
    }
    if (dirty) {
      confirmAction(
        initial ? "Discard changes?" : "Discard vendor payment?",
        initial ? "Your changes have not been saved." : "This payment has not been added.",
        "Discard",
        options.onClose
      );
    } else options.onClose();
  }, [dirty, initial, options, saveFlow]);

  async function save() {
    if (!canSave || !date || parsed.paisa === null) return;
    await saveFlow.run({
      pending: setSavingFlow,
      committed: () => {
        setCommitted(true);
      },
      error: setRequestError,
      request: () =>
        savePayment.mutateAsync({
          date,
          vendorName: vendorName.trim(),
          amount: parsed.paisa,
          note: note.trim() || undefined
        }),
      synchronize: (result) => applyMoneyMutation(queryClient, result),
      feedback: () => Keyboard.dismiss(),
      complete: options.onClose
    });
  }

  function updateVendorName(value: string) {
    if (saveFlow.locked || saveFlow.committed) return;
    setRequestError(null);
    savePayment.reset();
    setVendorName(value);
  }

  function updateAmount(value: string) {
    if (saveFlow.locked || saveFlow.committed) return;
    setRequestError(null);
    savePayment.reset();
    setAmount(value);
  }

  function updateNote(value: string) {
    if (saveFlow.locked || saveFlow.committed) return;
    setRequestError(null);
    savePayment.reset();
    setNote(value);
  }

  return {
    editing: Boolean(initial),
    date,
    valid,
    vendorName,
    vendorError,
    amount,
    note,
    saving,
    dirty,
    committed,
    error,
    isOffline,
    amountError,
    parsedAmount: parsed.paisa ?? 0,
    draftLocked: saving || committed,
    canSave,
    setVendorName: updateVendorName,
    setAmount: updateAmount,
    setNote: updateNote,
    goBack,
    save
  };
}
