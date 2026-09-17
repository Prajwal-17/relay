import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { usePreventRemove } from "expo-router/build/react-navigation/core";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard } from "react-native";
import { confirmAction } from "@/lib/confirm-action";
import { parseRupeeInput } from "@/lib/format/money";
import { addVendorPayment } from "../money.repository";
import { isFutureDate, parseLocalDate } from "@/lib/format/dates";

export function useVendorPayment() {
  const params = useLocalSearchParams<{ date?: string }>();
  const date = parseLocalDate(params.date);
  const valid = date !== null && !isFutureDate(date);
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [payee, setPayee] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const dirty = Boolean(payee.trim() || amount.trim());
  const parsed = parseRupeeInput(amount, "Payment");
  const canSave =
    valid && !saved && Boolean(payee.trim()) && !parsed.error && (parsed.paisa ?? 0) > 0;

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/money");
  }, [router]);

  usePreventRemove((dirty || saving) && !saved, ({ data }) => {
    if (lock.current) return;
    confirmAction("Discard vendor payment?", "This payment has not been added.", "Discard", () => {
      navigation.dispatch(data.action);
    });
  });

  // Navigate only after the committed render has removed the unsaved-changes guard.
  useEffect(() => {
    if (saved) goBack();
  }, [saved, goBack]);

  async function save() {
    if (lock.current || !canSave || !date || parsed.paisa === null) return;
    lock.current = true;
    setSaving(true);
    setError(null);
    try {
      await addVendorPayment(db, { date, payee, amountPaisa: parsed.paisa });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add vendor payment.");
      setSaving(false);
      lock.current = false;
      return;
    }
    Keyboard.dismiss();
    setSaved(true);
  }

  return {
    date,
    valid,
    payee,
    amount,
    saving,
    error,
    amountError: parsed.error,
    canSave,
    setPayee,
    setAmount,
    goBack,
    save
  };
}
