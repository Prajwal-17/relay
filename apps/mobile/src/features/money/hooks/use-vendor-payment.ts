import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { addVendorPayment } from "../money.repository";

interface VendorPaymentOptions {
  date: string;
  onClose: () => void;
}

export function useVendorPayment(options?: VendorPaymentOptions) {
  const params = useLocalSearchParams<{ date?: string }>();
  const date = parseLocalDate(options?.date ?? params.date);
  const valid = date !== null && !isFutureDate(date);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isOffline } = useNetworkStatus();
  const [saved, setSaved] = useState(false);
  const [savingFlow, setSavingFlow] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const savePayment = useMutation({ mutationFn: addVendorPayment });
  const saving = savingFlow;
  const error =
    savePayment.error instanceof Error
      ? savePayment.error.message
      : savePayment.error
        ? "Could not add vendor payment."
        : null;
  const lock = useRef(false);
  const dirty = Boolean(vendorName.trim() || amount.trim() || note.trim());
  const parsed = parseRupeeInput(amount, "Payment");
  const vendorError =
    vendorName.trim().length === 0
      ? "Enter a vendor or payee name."
      : vendorName.trim().length > 120
        ? "Vendor name must be 120 characters or fewer."
        : null;
  const canSave =
    valid &&
    !isOffline &&
    !saved &&
    !saving &&
    !vendorError &&
    !parsed.error &&
    (parsed.paisa ?? 0) > 0 &&
    note.length <= 240;

  const goBack = useCallback(() => {
    if (options) {
      if (saving) return;
      if (dirty && !saved) {
        confirmAction(
          "Discard vendor payment?",
          "This payment has not been added.",
          "Discard",
          options.onClose
        );
      } else options.onClose();
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace("/money");
  }, [dirty, options, router, saved, saving]);

  useConfirmSheetDismissal({
    blocked: !options && (dirty || saving) && !saved,
    canDiscard: !saving,
    title: "Discard vendor payment?",
    message: "This payment has not been added."
  });

  useEffect(() => {
    if (saved) {
      if (options) options.onClose();
      else goBack();
    }
  }, [saved, goBack, options]);

  async function save() {
    if (lock.current || !canSave || !date || parsed.paisa === null) return;
    lock.current = true;
    setSavingFlow(true);
    savePayment.reset();
    try {
      await savePayment.mutateAsync({
        date,
        vendorName: vendorName.trim(),
        amount: parsed.paisa,
        note: note.trim() || undefined
      });
      await queryClient.invalidateQueries({ queryKey: moneyKeys.all });
    } catch {
      lock.current = false;
      setSavingFlow(false);
      return;
    }
    Keyboard.dismiss();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSaved(true);
  }

  function updateVendorName(value: string) {
    savePayment.reset();
    setVendorName(value);
  }

  function updateAmount(value: string) {
    savePayment.reset();
    setAmount(value);
  }

  function updateNote(value: string) {
    savePayment.reset();
    setNote(value);
  }

  return {
    date,
    valid,
    vendorName,
    vendorError,
    amount,
    note,
    saving,
    error,
    isOffline,
    amountError: parsed.error,
    canSave,
    setVendorName: updateVendorName,
    setAmount: updateAmount,
    setNote: updateNote,
    goBack,
    save
  };
}
