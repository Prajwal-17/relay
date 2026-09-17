import { usePalette } from "@/theme/palette";
import { AppTextInput } from "@/components/ui/app-text-input";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { usePreventRemove } from "expo-router/build/react-navigation/core";
import { useSQLiteContext } from "expo-sqlite";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  QrCode,
  Check,
  Plus,
  Settings2,
  Trash2
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "@/components/ui/safe-area-view";

import { confirmAction } from "@/lib/confirm-action";
import { DayTotals } from "@/features/money/components/day-totals";
import { PaymentIcon } from "@/features/money/components/payment-icon";
import { VendorNameInput } from "@/features/money/components/vendor-name-input";
import { AmountInput } from "@/features/money/components/amount-input";
import { AppButton } from "@/components/ui/app-button";
import { IconButton } from "@/components/ui/icon-button";
import { LedgerCard } from "@/components/ui/ledger-card";
import { formatDisplayDate, isFutureDate, parseLocalDate } from "@/lib/format/dates";
import {
  getDailyEntry,
  listOnlineChannels,
  saveDailyEntry
} from "@/features/money/money.repository";
import type { OnlineChannel, SupplierPaymentInput } from "@/features/money/money.types";
import { paisaToInput, parseRupeeInput } from "@/lib/format/money";

type ChannelDraft = OnlineChannel & { amount: string };
type SupplierDraft = { localId: number; payee: string; amount: string; note: string };
type FormErrors = {
  form?: string;
  cash?: string;
  channels: Record<number, string>;
  suppliers: Record<number, { payee?: string; amount?: string }>;
};

const EMPTY_ERRORS: FormErrors = { channels: {}, suppliers: {} };

export default function EntryScreen() {
  const colors = usePalette();
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
  const date = parseLocalDate(dateParam);
  const db = useSQLiteContext();
  const router = useRouter();
  const navigation = useNavigation();
  const [cash, setCash] = useState("");
  const [channels, setChannels] = useState<ChannelDraft[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDraft[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS);
  const loadedRef = useRef(false);
  const [saved, setSaved] = useState(false);
  const nextSupplierId = useRef(1);

  const draftSnapshot = useMemo(
    () => serializeDraft(cash, channels, suppliers),
    [cash, channels, suppliers]
  );
  const isDirty = initialSnapshot !== null && draftSnapshot !== initialSnapshot;

  const loadForm = useCallback(async () => {
    if (!date || isFutureDate(date)) {
      setLoadError("This date is not available for a daily entry.");
      setLoading(false);
      return;
    }

    try {
      const activeChannels = await listOnlineChannels(db);
      if (loadedRef.current) {
        setChannels((current) => {
          const currentMap = new Map(current.map((row) => [row.id, row]));
          const refreshed = activeChannels.map((channel) => ({
            ...channel,
            amount: currentMap.get(channel.id)?.amount ?? ""
          }));
          const historical = current.filter(
            (row) => !activeChannels.some((active) => active.id === row.id) && row.amount.trim()
          );
          return [...refreshed, ...historical];
        });
        return;
      }

      setLoading(true);
      setLoadError(null);
      const existing = await getDailyEntry(db, date);
      const receiptMap = new Map(existing?.onlineReceipts.map((row) => [row.channelId, row]) ?? []);
      const combinedChannels: ChannelDraft[] = activeChannels.map((channel) => ({
        ...channel,
        amount: paisaToInput(receiptMap.get(channel.id)?.amountPaisa ?? 0)
      }));

      for (const receipt of existing?.onlineReceipts ?? []) {
        if (!combinedChannels.some((channel) => channel.id === receipt.channelId)) {
          combinedChannels.push({
            id: receipt.channelId,
            name: receipt.channelName,
            isPreset: false,
            isArchived: receipt.isChannelArchived,
            amount: paisaToInput(receipt.amountPaisa)
          });
        }
      }

      const supplierDrafts: SupplierDraft[] =
        existing?.supplierPayments.map((payment) => ({
          localId: nextSupplierId.current++,
          payee: payment.payee,
          amount: paisaToInput(payment.amountPaisa),
          note: payment.note ?? ""
        })) ?? [];
      const cashValue = paisaToInput(existing?.cashPaisa ?? 0);

      setCash(cashValue);
      setChannels(combinedChannels);
      setSuppliers(supplierDrafts);
      setInitialSnapshot(serializeDraft(cashValue, combinedChannels, supplierDrafts));
      loadedRef.current = true;
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not prepare this entry.");
    } finally {
      setLoading(false);
    }
  }, [date, db]);

  useFocusEffect(
    useCallback(() => {
      void loadForm();
    }, [loadForm])
  );

  usePreventRemove(isDirty && !saved, ({ data }) => {
    if (saving) return;
    confirmAction(
      "Discard changes?",
      "The amounts entered on this screen have not been saved.",
      "Discard",
      () => navigation.dispatch(data.action)
    );
  });

  useEffect(() => {
    if (saved) router.back();
  }, [saved, router]);

  const liveSummary = useMemo(() => {
    const cashPaisa = safeParsedPaisa(cash);
    const onlinePaisa = channels.reduce(
      (total, channel) => total + safeParsedPaisa(channel.amount),
      0
    );
    const paidPaisa = suppliers.reduce(
      (total, supplier) => total + safeParsedPaisa(supplier.amount),
      0
    );
    return {
      received: cashPaisa + onlinePaisa,
      paid: paidPaisa,
      net: cashPaisa + onlinePaisa - paidPaisa
    };
  }, [cash, channels, suppliers]);

  function updateChannelAmount(id: number, amount: string) {
    setChannels((current) =>
      current.map((channel) => (channel.id === id ? { ...channel, amount } : channel))
    );
    setErrors((current) => ({
      ...current,
      form: undefined,
      channels: { ...current.channels, [id]: "" }
    }));
  }

  function addSupplier() {
    setSuppliers((current) => [
      ...current,
      { localId: nextSupplierId.current++, payee: "", amount: "", note: "" }
    ]);
  }

  function updateSupplier(id: number, patch: Partial<SupplierDraft>) {
    setSuppliers((current) =>
      current.map((supplier) => (supplier.localId === id ? { ...supplier, ...patch } : supplier))
    );
    setErrors((current) => ({ ...current, form: undefined }));
  }

  function moveSupplier(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= suppliers.length) return;
    setSuppliers((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  async function handleSave() {
    if (!date || saving || saved) return;
    const nextErrors: FormErrors = { channels: {}, suppliers: {} };
    const parsedCash = parseRupeeInput(cash, "Cash received");
    if (parsedCash.error) nextErrors.cash = parsedCash.error;

    const onlineReceipts: { channelId: number; amountPaisa: number }[] = [];
    for (const channel of channels) {
      const parsed = parseRupeeInput(channel.amount, channel.name);
      if (parsed.paisa === null) nextErrors.channels[channel.id] = parsed.error;
      else if (parsed.paisa > 0)
        onlineReceipts.push({ channelId: channel.id, amountPaisa: parsed.paisa });
    }

    const supplierPayments: SupplierPaymentInput[] = [];
    for (const supplier of suppliers) {
      const hasAnyValue = Boolean(
        supplier.payee.trim() || supplier.amount.trim() || supplier.note.trim()
      );
      if (!hasAnyValue) continue;
      const supplierErrors: { payee?: string; amount?: string } = {};
      const parsed = parseRupeeInput(supplier.amount, "Payment amount");
      if (!supplier.payee.trim()) supplierErrors.payee = "Enter a vendor name.";
      if (parsed.paisa === null) supplierErrors.amount = parsed.error;
      else if (parsed.paisa <= 0)
        supplierErrors.amount = "Payment amount must be greater than zero.";
      if (supplierErrors.payee || supplierErrors.amount) {
        nextErrors.suppliers[supplier.localId] = supplierErrors;
      } else {
        supplierPayments.push({
          payee: supplier.payee.trim(),
          amountPaisa: parsed.paisa!,
          note: supplier.note.trim() || undefined
        });
      }
    }

    const received =
      (parsedCash.paisa ?? 0) + onlineReceipts.reduce((sum, row) => sum + row.amountPaisa, 0);
    const paid = supplierPayments.reduce((sum, row) => sum + row.amountPaisa, 0);
    if (received === 0 && paid === 0) nextErrors.form = "Add at least one received or paid amount.";
    if (
      nextErrors.cash ||
      Object.values(nextErrors.channels).some(Boolean) ||
      Object.keys(nextErrors.suppliers).length > 0 ||
      nextErrors.form
    ) {
      nextErrors.form ??= "Check the highlighted fields before saving.";
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    setErrors(EMPTY_ERRORS);
    try {
      await saveDailyEntry(db, {
        date,
        cashPaisa: parsedCash.paisa ?? 0,
        onlineReceipts,
        supplierPayments
      });
      setSaved(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error) {
      setErrors({
        channels: {},
        suppliers: {},
        form: error instanceof Error ? error.message : "Could not save this entry."
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="bg-canvas flex-1 items-center justify-center">
        <ActivityIndicator color={colors["accent"]} size="large" />
        <Text className="text-muted mt-3 text-sm">Preparing daily entry…</Text>
      </SafeAreaView>
    );
  }

  if (!date || loadError) {
    return (
      <SafeAreaView className="bg-canvas flex-1 items-center justify-center px-6">
        <LedgerCard className="w-full max-w-sm items-center gap-4 p-6">
          <Text className="text-destructive text-center text-sm">
            {loadError ?? "Invalid ledger date."}
          </Text>
          <AppButton variant="outline" onPress={() => router.back()}>
            Go back
          </AppButton>
        </LedgerCard>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-canvas flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="border-border bg-canvas border-b px-4 py-2">
          <View className="mx-auto w-full max-w-xl flex-row items-center gap-3">
            <IconButton icon={ArrowLeft} label="Close entry" onPress={() => router.back()} />
            <View className="flex-1">
              <Text className="text-ink text-base font-semibold">Daily record</Text>
              <Text className="text-muted text-sm">{formatDisplayDate(date)}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={{ pointerEvents: saving || saved ? "none" : "auto" }}
          className="flex-1"
          contentContainerClassName="items-center px-4 pb-6 pt-4"
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-xl gap-3">
            <View className="gap-3 py-3">
              <AmountInput
                label="Cash received"
                icon={<PaymentIcon kind="cash" />}
                value={cash}
                error={errors.cash}
                onChangeText={(value) => {
                  setCash(value);
                  setErrors((current) => ({ ...current, cash: undefined, form: undefined }));
                }}
              />
            </View>

            <View>
              <View className="border-border flex-row items-center justify-between border-b py-2">
                <View className="flex-row items-center gap-2">
                  <QrCode color={colors["primary"]} size={20} />
                  <Text className="text-ink font-semibold">UPI & online</Text>
                </View>
                <AppButton
                  compact
                  icon={Settings2}
                  variant="ghost"
                  onPress={() => router.push("/channels")}
                >
                  Providers
                </AppButton>
              </View>
              <View className="gap-3 py-3">
                {channels.map((channel) => (
                  <AmountInput
                    key={channel.id}
                    label={`${channel.name}${channel.isArchived ? " · archived" : ""}`}
                    icon={<PaymentIcon name={channel.name} />}
                    value={channel.amount}
                    error={errors.channels[channel.id]}
                    onChangeText={(value) => updateChannelAmount(channel.id, value)}
                  />
                ))}
              </View>
            </View>

            <Text className="text-ink text-lg font-semibold">Vendor payments</Text>

            {suppliers.map((supplier, index) => {
              const supplierError = errors.suppliers[supplier.localId];
              return (
                <LedgerCard key={supplier.localId}>
                  <View className="border-border flex-row items-center justify-between border-b px-4 py-2.5">
                    <Text className="text-ink text-sm font-semibold">Payment {index + 1}</Text>
                    <View className="flex-row gap-1.5">
                      <IconButton
                        disabled={index === 0}
                        icon={ArrowUp}
                        label="Move payment up"
                        onPress={() => moveSupplier(index, -1)}
                      />
                      <IconButton
                        disabled={index === suppliers.length - 1}
                        icon={ArrowDown}
                        label="Move payment down"
                        onPress={() => moveSupplier(index, 1)}
                      />
                      <IconButton
                        icon={Trash2}
                        label="Remove payment"
                        tone="destructive"
                        onPress={() =>
                          setSuppliers((current) =>
                            current.filter((row) => row.localId !== supplier.localId)
                          )
                        }
                      />
                    </View>
                  </View>
                  <View className="gap-3 p-3">
                    <VendorNameInput
                      value={supplier.payee}
                      error={supplierError?.payee}
                      onChangeText={(value) => updateSupplier(supplier.localId, { payee: value })}
                    />
                    <AmountInput
                      label="Amount paid"
                      value={supplier.amount}
                      error={supplierError?.amount}
                      onChangeText={(value) => updateSupplier(supplier.localId, { amount: value })}
                    />
                    <LabeledTextInput
                      label="Note · optional"
                      placeholder="Note"
                      value={supplier.note}
                      multiline
                      onChangeText={(value) => updateSupplier(supplier.localId, { note: value })}
                    />
                  </View>
                </LedgerCard>
              );
            })}

            <AppButton icon={Plus} variant="outline" onPress={addSupplier}>
              Add vendor payment
            </AppButton>

            <View className="border-border border-t py-4">
              <DayTotals received={liveSummary.received} paid={liveSummary.paid} />
            </View>
          </View>
        </ScrollView>

        <View className="border-border bg-canvas border-t px-4 py-2">
          <View className="mx-auto w-full max-w-xl">
            {errors.form ? (
              <View className="rounded-control border-destructive bg-surface border px-4 py-2">
                <Text className="text-destructive text-sm">{errors.form}</Text>
              </View>
            ) : null}
            <AppButton
              icon={Check}
              loading={saving}
              disabled={saved}
              onPress={() => void handleSave()}
            >
              {saving ? "Saving…" : "Save"}
            </AppButton>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function LabeledTextInput({
  label,
  error,
  multiline,
  ...props
}: React.ComponentProps<typeof AppTextInput> & { label: string; error?: string }) {
  const colors = usePalette();
  return (
    <View className="gap-1.5">
      <Text className="text-ink text-sm font-medium">{label}</Text>
      <AppTextInput
        accessibilityLabel={label}
        className={`text-ink bg-surface rounded-control border px-3 text-base ${multiline ? "min-h-12 py-3" : "min-h-12"} ${error ? "border-destructive" : "border-border"}`}
        multiline={multiline}
        selectionColor={colors["accent"]}
        textAlignVertical={multiline ? "top" : "center"}
        {...props}
      />
      {error ? <Text className="text-destructive text-xs leading-4">{error}</Text> : null}
    </View>
  );
}

function safeParsedPaisa(value: string): number {
  const parsed = parseRupeeInput(value);
  return parsed.paisa ?? 0;
}

function serializeDraft(
  cash: string,
  channels: ChannelDraft[],
  suppliers: SupplierDraft[]
): string {
  return JSON.stringify({
    cash: cash.trim(),
    online: channels
      .filter((channel) => channel.amount.trim())
      .map((channel) => [channel.id, channel.amount.trim()]),
    suppliers: suppliers
      .filter((supplier) => supplier.payee.trim() || supplier.amount.trim() || supplier.note.trim())
      .map((supplier) => [supplier.payee.trim(), supplier.amount.trim(), supplier.note.trim()])
  });
}
