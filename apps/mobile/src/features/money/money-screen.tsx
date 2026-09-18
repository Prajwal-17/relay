import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  BanknoteArrowDown,
  CalendarDays,
  LogOut,
  Store,
  Trash2,
  WifiOff
} from "lucide-react-native";
import { useMemo } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { IconButton } from "@/components/ui/icon-button";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth/auth-client";
import { confirmAction } from "@/lib/confirm-action";
import {
  formatDisplayDate,
  getTodayIST,
  isFutureDate,
  monthFromDate,
  parseLocalDate
} from "@/lib/format/dates";
import { formatRupee } from "@/lib/format/money";
import { useNetworkStatus } from "@/lib/network/use-network-status";
import { usePalette } from "@/theme/palette";
import { DayDetails } from "./components/day-details";
import { DayTotals } from "./components/day-totals";
import { ReceivedMethods } from "./components/received-methods";
import { moneyKeys } from "./money.keys";
import { deleteDailyEntry, getMoneyOverview } from "./money.repository";
import type { LocalDate, VendorPayment } from "./money.types";
import { summarizeEntry } from "./money.utils";

export default function MoneyScreen() {
  const colors = usePalette();
  const queryClient = useQueryClient();
  const session = authClient.useSession();
  const params = useLocalSearchParams<{ date?: string }>();
  const { isOffline } = useNetworkStatus();
  const today = getTodayIST();
  const requestedDate = parseLocalDate(params.date);
  const selectedDate: LocalDate =
    requestedDate && !isFutureDate(requestedDate) ? requestedDate : today;
  const month = useMemo(() => monthFromDate(selectedDate), [selectedDate]);

  const ledger = useQuery({
    queryKey: moneyKeys.overview(month, selectedDate),
    queryFn: ({ signal }) => getMoneyOverview(month, selectedDate, signal),
    refetchOnMount: "always"
  });
  const deleteEntry = useMutation({
    mutationFn: deleteDailyEntry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moneyKeys.all })
  });
  const signOut = useMutation({
    mutationFn: async () => {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message || "Could not sign out.");
    },
    onSuccess: () => queryClient.clear()
  });

  const entry = ledger.data?.entry ?? null;
  const paymentMethods = ledger.data?.paymentMethods ?? [];
  const summary = entry ? summarizeEntry(entry) : null;
  const loading = ledger.isPending;
  const refreshing = ledger.isRefetching && !ledger.isPending;
  const error = deleteEntry.error ?? signOut.error ?? ledger.error;
  const actionsDisabled = deleteEntry.isPending || signOut.isPending || isOffline;
  const dateValue = new Date(`${selectedDate}T12:00:00Z`);
  const weekday = new Intl.DateTimeFormat("en-IN", { weekday: "long", timeZone: "UTC" }).format(
    dateValue
  );
  const dateLabel = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(dateValue);

  function openPayment(paymentMethodId: number | null, mode: "add" | "history") {
    router.push({
      pathname: "/payment",
      params: {
        date: selectedDate,
        method: paymentMethodId === null ? "cash" : String(paymentMethodId),
        mode
      }
    });
  }

  function openVendorDetails(payment: VendorPayment) {
    router.push({
      pathname: "/vendor-details",
      params: {
        vendorName: payment.vendorName,
        amount: String(payment.amount),
        note: payment.note ?? "",
        createdAt: payment.createdAt
      }
    });
  }

  function confirmDelete() {
    if (!entry || !summary) return;
    confirmAction(
      "Delete this day's record?",
      `${formatDisplayDate(entry.date)}\nReceived ${formatRupee(summary.receivedAmount)} · Paid ${formatRupee(summary.paidAmount)}\n\nThis cannot be undone.`,
      "Delete",
      () => deleteEntry.mutate(entry.date)
    );
  }

  function confirmSignOut() {
    confirmAction(
      "Sign out of Relay?",
      "You will need to sign in with Google before opening the ledger again.",
      "Sign out",
      () => signOut.mutate()
    );
  }

  return (
    <SafeAreaView className="bg-canvas flex-1" edges={["top", "left", "right"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="items-center px-5 pt-5 pb-8"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            enabled={!actionsDisabled}
            onRefresh={() => {
              if (!actionsDisabled) void ledger.refetch();
            }}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
      >
        <View className="w-full max-w-xl gap-5">
          <View className="flex-row items-center gap-4">
            <View className="min-w-0 flex-1">
              <Text className="text-muted text-sm font-medium">
                {selectedDate === today ? `Today · ${weekday}` : weekday}
              </Text>
              <Text
                accessibilityRole="header"
                adjustsFontSizeToFit
                className="text-ink mt-1 text-[28px] leading-9 font-semibold tracking-tight"
                numberOfLines={1}
              >
                {dateLabel}
              </Text>
            </View>
            <IconButton
              icon={CalendarDays}
              label={`Choose date. Selected ${formatDisplayDate(selectedDate)}`}
              onPress={() => router.push({ pathname: "/calendar", params: { date: selectedDate } })}
            />
          </View>

          {isOffline ? (
            <View className="border-border bg-surface-muted rounded-control flex-row items-center gap-2 border px-3 py-2.5">
              <WifiOff color={colors.muted} size={17} strokeWidth={1.8} />
              <Text className="text-muted min-w-0 flex-1 text-sm">
                Offline. Showing the last available data; new entries are paused.
              </Text>
            </View>
          ) : null}

          {loading ? (
            <View className="min-h-48 items-center justify-center gap-3 py-6">
              <ActivityIndicator color={colors.accent} />
              <Text className="text-muted text-sm">Loading the till…</Text>
            </View>
          ) : error ? (
            <View className="border-border bg-surface rounded-card gap-4 border p-5">
              <Text accessibilityRole="alert" className="text-destructive text-sm leading-5">
                {error instanceof Error ? error.message : "Could not read the till."}
              </Text>
              <AppButton
                variant="outline"
                disabled={isOffline}
                onPress={() => {
                  deleteEntry.reset();
                  signOut.reset();
                  void session.refetch();
                  void ledger.refetch();
                }}
              >
                Try again
              </AppButton>
            </View>
          ) : (
            <>
              <DayTotals received={summary?.receivedAmount ?? 0} paid={summary?.paidAmount ?? 0} />

              <View className="flex-row flex-wrap gap-3">
                <AppButton
                  className="min-w-[46%] grow"
                  icon={BanknoteArrowDown}
                  disabled={actionsDisabled}
                  onPress={() => openPayment(null, "add")}
                >
                  Add received
                </AppButton>
                <AppButton
                  className="min-w-[46%] grow"
                  icon={Store}
                  variant="outline"
                  disabled={actionsDisabled}
                  onPress={() =>
                    router.push({ pathname: "/vendor-payment", params: { date: selectedDate } })
                  }
                >
                  Pay vendor
                </AppButton>
              </View>

              <ReceivedMethods
                entry={entry}
                paymentMethods={paymentMethods}
                disabled={actionsDisabled}
                onOpen={openPayment}
              />
              <DayDetails
                entry={entry}
                disabled={actionsDisabled}
                onAdd={() =>
                  router.push({ pathname: "/vendor-payment", params: { date: selectedDate } })
                }
                onOpen={openVendorDetails}
              />

              <View className="border-border mt-2 gap-3 border-t pt-4">
                <Text className="text-muted text-xs" numberOfLines={1}>
                  {session.data?.user.name || session.data?.user.email}
                </Text>
                <View className="flex-row flex-wrap items-center justify-between gap-2">
                  <AppButton
                    compact
                    icon={LogOut}
                    variant="ghost"
                    loading={signOut.isPending}
                    disabled={deleteEntry.isPending}
                    onPress={confirmSignOut}
                  >
                    Sign out
                  </AppButton>
                  {entry ? (
                    <AppButton
                      compact
                      icon={Trash2}
                      variant="destructive"
                      loading={deleteEntry.isPending}
                      disabled={signOut.isPending || isOffline}
                      onPress={confirmDelete}
                    >
                      Delete day
                    </AppButton>
                  ) : null}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
