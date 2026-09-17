import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { usePreventRemove } from "expo-router/build/react-navigation/core";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard } from "react-native";
import {
  addReceivedPayment,
  getDailyEntry,
  listOnlineChannels,
  listReceiptEvents
} from "../money.repository";
import type { ReceiptEvent } from "../money.types";
import { confirmAction } from "@/lib/confirm-action";
import { isFutureDate, parseLocalDate } from "@/lib/format/dates";
import { parseRupeeInput } from "@/lib/format/money";

export function usePaymentEntry() {
  const params = useLocalSearchParams<{ date?: string; channel?: string; history?: string }>();
  const date = parseLocalDate(params.date);
  const channelId = params.channel === "cash" ? null : Number(params.channel);
  const valid =
    date !== null &&
    !isFutureDate(date) &&
    (channelId === null || (Number.isSafeInteger(channelId) && channelId > 0));
  const db = useSQLiteContext();
  const router = useRouter();
  const navigation = useNavigation();
  const [method, setMethod] = useState({ name: "", archived: false });
  const [balance, setBalance] = useState(0);
  const [events, setEvents] = useState<ReceiptEvent[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(false);
  const saveLock = useRef(false);
  const pageLock = useRef(false);
  const requestId = useRef(0);
  const parsed = parseRupeeInput(amount, "Payment");
  const amountPaisa = parsed.paisa ?? 0;
  const nextBalance = balance + amountPaisa;
  const amountError =
    parsed.error || (!Number.isSafeInteger(nextBalance) ? "The new total is too large." : null);
  const canSave =
    valid && !loading && !loadError && !method.archived && !amountError && amountPaisa > 0;

  const load = useCallback(async () => {
    if (!date || !valid) {
      setLoading(false);
      return;
    }
    const request = ++requestId.current;
    setLoading(true);
    setLoadError(null);
    try {
      const [entry, channels, history] = await Promise.all([
        getDailyEntry(db, date),
        listOnlineChannels(db, true),
        listReceiptEvents(db, date, channelId)
      ]);
      const channel = channels.find((item) => item.id === channelId);
      if (channelId !== null && !channel) throw new Error("Payment method not found.");
      if (request !== requestId.current) return;
      setMethod({ name: channel?.name ?? "Cash", archived: channel?.isArchived ?? false });
      setBalance(
        channelId === null
          ? (entry?.cashPaisa ?? 0)
          : (entry?.onlineReceipts.find((row) => row.channelId === channelId)?.amountPaisa ?? 0)
      );
      setEvents(history);
      setHasMore(history.length === 50);
    } catch (error) {
      if (request === requestId.current) {
        setLoadError(error instanceof Error ? error.message : "Could not load payments.");
      }
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, [db, date, channelId, valid]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => {
      clearTimeout(timer);
      requestId.current += 1;
    };
  }, [load]);

  usePreventRemove(saving || amount.trim().length > 0 || name.trim().length > 0, ({ data }) => {
    if (saveLock.current) return;
    confirmAction(
      "Discard this payment?",
      "This amount has not been added to the ledger.",
      "Discard",
      () => navigation.dispatch(data.action)
    );
  });

  async function save() {
    if (!canSave || !date || saveLock.current) return;
    saveLock.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      await addReceivedPayment(db, { date, channelId, amountPaisa, name });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save this payment.");
      setSaving(false);
      saveLock.current = false;
      return;
    }
    // The write is committed. A refresh failure must never invite saving this payment twice.
    setHasSaved(true);
    setAmount("");
    setName("");
    Keyboard.dismiss();
    await load();
    setSaving(false);
    saveLock.current = false;
  }

  async function loadMore() {
    if (!date || !hasMore || pageLock.current || saving) return;
    pageLock.current = true;
    setLoadingMore(true);
    const request = requestId.current;
    try {
      const rows = await listReceiptEvents(db, date, channelId, events.at(-1)?.id);
      if (request !== requestId.current) return;
      setEvents((previous) => [...previous, ...rows]);
      setHasMore(rows.length === 50);
      setSaveError(null);
    } catch {
      if (request === requestId.current) {
        setSaveError("Could not load older payments. Please try again.");
      }
    } finally {
      setLoadingMore(false);
      pageLock.current = false;
    }
  }

  return {
    params,
    date,
    channelId,
    valid,
    router,
    method,
    balance,
    events,
    hasMore,
    loadingMore,
    loading,
    loadError,
    amount,
    saving,
    saveError,
    name,
    setName,
    hasSaved,
    amountError,
    canSave,
    amountPaisa,
    setAmount,
    setSaveError,
    load,
    save,
    loadMore
  };
}
