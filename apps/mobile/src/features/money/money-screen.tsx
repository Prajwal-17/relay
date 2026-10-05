import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router, useIsFocused, useLocalSearchParams, useNavigation } from "expo-router";
import { BanknoteArrowDown, Store, Trash2, WifiOff } from "lucide-react-native";
import { useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { isKeyboardPress } from "@/lib/animations/motion";
import { formatDisplayDate, isFutureDate, parseLocalDate } from "@/lib/format/dates";
import { formatRupee } from "@/lib/format/money";
import { useNetworkStatus } from "@/lib/network/use-network-status";
import { usePalette } from "@/theme/palette";
import { BusinessDateHeader } from "./components/business-date-header";
import { WeekStrip } from "./components/week-strip";
import { useBusinessToday } from "./hooks/use-business-today";
import { isEntryProvider } from "./payment-catalog";
import { DateDrawer } from "./components/date-drawer";
import { DayDetails } from "./components/day-details";
import { DayTotals } from "./components/day-totals";
import { MoneyLedgerSkeleton } from "./components/money-skeletons";
import { ReceivedMethods } from "./components/received-methods";
import { applyMoneyMutation } from "./money.cache";
import { moneyWeekOptions } from "./money.queries";
import { deleteDailyEntry } from "./money.repository";
import type { LocalDate, VendorPayment } from "./money.types";
import { summarizeEntry } from "./money.utils";

export default function MoneyScreen() {
  const navigation = useNavigation();
  const focused = useIsFocused();
  const colors = usePalette();
  const queryClient = useQueryClient();
  const [dateDrawerOpen, setDateDrawerOpen] = useState(false);
  const [dateDrawerMotion, setDateDrawerMotion] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ date: LocalDate; message: string } | null>(
    null
  );
  const params = useLocalSearchParams<{ date?: string }>();
  const { isOffline } = useNetworkStatus();
  const today = useBusinessToday();
  const requestedDate = parseLocalDate(params.date);
  const selectedDate: LocalDate =
    requestedDate && !isFutureDate(requestedDate, today) ? requestedDate : today;
  const ledger = useQuery(moneyWeekOptions(selectedDate));
  const deleteEntry = useMutation({
    mutationFn: deleteDailyEntry,
    onSuccess: async (result) => {
      await applyMoneyMutation(queryClient, result, "delete-day");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setDeleteTarget(null);
    }
  });

  const day = ledger.data?.days.find((row) => row.date === selectedDate);
  const entry = day?.entry ?? null;
  const paymentMethods = ledger.data?.paymentMethods ?? [];
  const summary = entry ? summarizeEntry(entry) : null;
  const loading = ledger.isPending;
  const error = ledger.error;
  const interactionLocked = deleteEntry.isPending;
  const refreshDisabled = interactionLocked || isOffline;
  function selectDate(date: LocalDate) {
    if (!navigation.isFocused() || interactionLocked || isFutureDate(date, today)) return;
    router.setParams({ date: date === today ? undefined : date });
  }

  function openPayment(paymentMethodId: number | null, mode: "add" | "history") {
    if (interactionLocked) return;
    if (mode === "add") {
      if (isOffline) return;
      if (paymentMethodId === null) {
        router.push({
          pathname: "/money-entry",
          params: { date: selectedDate, kind: "received", method: "cash" }
        });
      } else {
        const paymentMethod = paymentMethods.find((item) => item.id === paymentMethodId);
        if (!paymentMethod || paymentMethod.isArchived || !isEntryProvider(paymentMethod.name))
          return;
        router.push({
          pathname: "/money-entry",
          params: { date: selectedDate, kind: "received", method: String(paymentMethodId) }
        });
      }
      return;
    }
    router.push({
      pathname: "/payment",
      params: {
        date: selectedDate,
        method: paymentMethodId === null ? "cash" : String(paymentMethodId)
      }
    });
  }

  function openVendorDetails(payment: VendorPayment) {
    router.push({
      pathname: "/vendor-details",
      params: {
        id: String(payment.id),
        date: selectedDate,
        vendorName: payment.vendorName,
        amount: String(payment.amount),
        note: payment.note ?? "",
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      }
    });
  }

  function openVendorEntry() {
    if (interactionLocked || isOffline || !ledger.data) return;
    router.push({ pathname: "/money-entry", params: { date: selectedDate, kind: "vendor" } });
  }

  function openDeleteDialog() {
    if (!entry || !summary) return;
    deleteEntry.reset();
    setDeleteTarget({
      date: entry.date,
      message: `${formatDisplayDate(entry.date)}\nReceived ${formatRupee(summary.receivedAmount)} · Paid ${formatRupee(summary.paidAmount)}\n\nThis cannot be undone.`
    });
  }

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top", "left", "right"]}>
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this day's record?"
        message={deleteTarget?.message ?? ""}
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        loading={deleteEntry.isPending}
        error={deleteEntry.error instanceof Error ? deleteEntry.error.message : null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteEntry.mutate(deleteTarget.date);
        }}
      />
      <DateDrawer
        open={dateDrawerOpen}
        animate={dateDrawerMotion}
        selectedDate={selectedDate}
        today={today}
        onClose={(event) => {
          setDateDrawerMotion(!event || !isKeyboardPress(event));
          setDateDrawerOpen(false);
        }}
        onSelect={(date, event) => {
          setDateDrawerMotion(!event || !isKeyboardPress(event));
          selectDate(date);
          setDateDrawerOpen(false);
        }}
      />
      <View className="px-4 pt-2" testID="money-date-navigation">
        <View className="w-full max-w-xl gap-1 self-center">
          <BusinessDateHeader
            date={selectedDate}
            today={today}
            disabled={interactionLocked}
            onToday={() => selectDate(today)}
            onCalendar={(event) => {
              setDateDrawerMotion(!isKeyboardPress(event));
              setDateDrawerOpen(true);
            }}
          />
          <WeekStrip
            date={selectedDate}
            today={today}
            disabled={interactionLocked || !focused}
            onSelect={selectDate}
          />
        </View>
      </View>
      <ScrollView
        testID="money-ledger-scroll"
        className="flex-1"
        contentContainerClassName="items-center px-4 pt-4 pb-4"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            enabled={!refreshDisabled}
            onRefresh={() => {
              if (refreshDisabled || refreshing) return;
              setRefreshing(true);
              void ledger.refetch().finally(() => setRefreshing(false));
            }}
            colors={[colors["counter-accent"]]}
            tintColor={colors["counter-accent"]}
          />
        }
      >
        <View className="w-full max-w-xl gap-4">
          {isOffline ? (
            <View className="border-border bg-muted rounded-control flex-row items-center gap-2 border px-3 py-2.5">
              <WifiOff color={colors["muted-foreground"]} size={17} strokeWidth={1.8} />
              <Text className="text-muted-foreground min-w-0 flex-1 text-sm">
                Offline. You can still review money; saving is paused until you reconnect.
              </Text>
            </View>
          ) : null}

          {loading ? (
            <MoneyLedgerSkeleton />
          ) : error && !ledger.data ? (
            <View className="gap-4 py-4">
              <Text accessibilityRole="alert" className="text-destructive text-sm leading-5">
                {error instanceof Error ? error.message : "Could not load money."}
              </Text>
              <AppButton
                variant="outline"
                disabled={isOffline}
                loading={ledger.isFetching}
                loadingLabel="Trying again…"
                onPress={() => {
                  deleteEntry.reset();
                  void ledger.refetch();
                }}
              >
                Try again
              </AppButton>
            </View>
          ) : (
            <>
              {error ? (
                <View className="gap-2">
                  <Text accessibilityRole="alert" className="text-destructive text-sm">
                    Could not refresh. Showing the last saved ledger.
                  </Text>
                  <AppButton
                    variant="outline"
                    disabled={isOffline}
                    loading={ledger.isFetching}
                    onPress={() => void ledger.refetch()}
                  >
                    Try again
                  </AppButton>
                </View>
              ) : null}
              <DayTotals
                received={summary?.receivedAmount ?? 0}
                paid={summary?.paidAmount ?? 0}
                isToday={selectedDate === today}
              />

              <ReceivedMethods
                entry={entry}
                paymentMethods={paymentMethods}
                receivedCounts={day?.receivedCounts}
                disabled={interactionLocked}
                onOpen={(method) => openPayment(method, "history")}
              />
              <DayDetails entry={entry} disabled={interactionLocked} onOpen={openVendorDetails} />

              {entry ? (
                <View className="mt-2 pt-3">
                  <AppButton
                    icon={Trash2}
                    variant="destructive"
                    className="w-full"
                    loading={deleteEntry.isPending}
                    loadingLabel="Deleting…"
                    disabled={isOffline}
                    onPress={openDeleteDialog}
                  >
                    Delete day
                  </AppButton>
                  {deleteEntry.error ? (
                    <Text accessibilityRole="alert" className="text-destructive mt-2 text-sm">
                      {deleteEntry.error.message}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
      <View className="border-frame bg-card border-t px-4 py-2">
        <View className="w-full max-w-xl flex-row flex-wrap gap-2 self-center">
          <AppButton
            compact
            className="min-w-[46%] flex-1 px-3"
            icon={Store}
            variant="outline"
            disabled={interactionLocked || isOffline || !ledger.data}
            accessibilityHint="Opens a form to record a vendor payment"
            onPress={openVendorEntry}
          >
            Pay vendor
          </AppButton>
          <AppButton
            compact
            className="min-w-[46%] flex-1 px-3"
            icon={BanknoteArrowDown}
            disabled={interactionLocked || isOffline || !ledger.data}
            accessibilityHint="Opens a form to record money received"
            onPress={() => openPayment(null, "add")}
          >
            Add received
          </AppButton>
        </View>
      </View>
    </SafeAreaView>
  );
}
