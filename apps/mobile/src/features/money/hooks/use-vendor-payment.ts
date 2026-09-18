import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard } from "react-native";

import { isFutureDate, parseLocalDate } from "@/lib/format/dates";
import { parseRupeeInput } from "@/lib/format/money";
import { useConfirmSheetDismissal } from "@/lib/navigation/use-confirm-sheet-dismissal";
import { useNetworkStatus } from "@/lib/network/use-network-status";
import { moneyKeys } from "../money.keys";
import { addVendorPayment } from "../money.repository";

export function useVendorPayment() {
  const params = useLocalSearchParams<{ date?: string }>();
  const date = parseLocalDate(params.date);
  const valid = date !== null && !isFutureDate(date);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isOffline } = useNetworkStatus();
  const [saved, setSaved] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const savePayment = useMutation({ mutationFn: addVendorPayment });
  const saving = savePayment.isPending;
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
    !vendorError &&
    !parsed.error &&
    (parsed.paisa ?? 0) > 0 &&
    note.length <= 240;

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/money");
  }, [router]);

  useConfirmSheetDismissal({
    blocked: (dirty || saving) && !saved,
    canDiscard: !saving,
    title: "Discard vendor payment?",
    message: "This payment has not been added."
  });

  useEffect(() => {
    if (saved) goBack();
  }, [saved, goBack]);

  async function save() {
    if (lock.current || !canSave || !date || parsed.paisa === null) return;
    lock.current = true;
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
      return;
    }
    Keyboard.dismiss();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSaved(true);
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
    setVendorName,
    setAmount,
    setNote,
    goBack,
    save
  };
}
