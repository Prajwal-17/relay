import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { BanknoteArrowDown, CalendarDays, Store, Trash2, WifiOff } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconButton } from "@/components/ui/icon-button";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import {
  formatDisplayDate,
  getDisplayDateParts,
  getTodayIST,
  isFutureDate,
  monthFromDate,
  parseLocalDate
} from "@/lib/format/dates";
import { formatRupee } from "@/lib/format/money";
import { useNetworkStatus } from "@/lib/network/use-network-status";
import { usePalette } from "@/theme/palette";
import { AddReceivedDrawer } from "./components/add-received-drawer";
import { AddVendorDrawer } from "./components/add-vendor-drawer";
import { DateDrawer } from "./components/date-drawer";
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
  const [dateDrawerOpen, setDateDrawerOpen] = useState(false);
  const [addMethod, setAddMethod] = useState<{
    method: string;
    name: string;
    archived: boolean;
    total: number;
  } | null>(null);
  const [vendorDrawerOpen, setVendorDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ date: LocalDate; message: string } | null>(
    null
  );
  const params = useLocalSearchParams<{ date?: string }>();
  const { isOffline } = useNetworkStatus();
  const today = getTodayIST();
  const requestedDate = parseLocalDate(params.date);
  const selectedDate: LocalDate =
    requestedDate && !isFutureDate(requestedDate) ? requestedDate : today;
  const month = useMemo(() => monthFromDate(selectedDate), [selectedDate]);
  const displayDate = useMemo(() => getDisplayDateParts(selectedDate), [selectedDate]);

  const ledger = useQuery({
    queryKey: moneyKeys.overview(month, selectedDate),
    queryFn: ({ signal }) => getMoneyOverview(month, selectedDate, signal),
    refetchOnMount: "always"
  });
  const deleteEntry = useMutation({
    mutationFn: deleteDailyEntry,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: moneyKeys.all });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setDeleteTarget(null);
    }
  });

  const entry = ledger.data?.entry ?? null;
  const paymentMethods = ledger.data?.paymentMethods ?? [];
  const summary = entry ? summarizeEntry(entry) : null;
  const loading = ledger.isPending;
  const refreshing = ledger.isRefetching && !ledger.isPending;
  const error = ledger.error;
  const interactionLocked = deleteEntry.isPending;
  const refreshDisabled = interactionLocked || isOffline;
  function openPayment(paymentMethodId: number | null, mode: "add" | "history") {
    if (mode === "add") {
      if (paymentMethodId === null) {
        setAddMethod({
          method: "cash",
          name: "Cash",
          archived: false,
          total: entry?.cashAmount ?? 0
        });
      } else {
        const paymentMethod = paymentMethods.find((item) => item.id === paymentMethodId);
        if (!paymentMethod) return;
        setAddMethod({
          method: String(paymentMethodId),
          name: paymentMethod.name,
          archived: paymentMethod.isArchived,
          total:
            entry?.paymentTotals.find((item) => item.paymentMethodId === paymentMethodId)?.amount ??
            0
        });
      }
      return;
    }
    router.push({
      pathname: "/payment",
      params: {
        date: selectedDate,
        method: paymentMethodId === null ? "cash" : String(paymentMethodId),
        mode: "history"
      }
    });
  }

  function openVendorDetails(payment: VendorPayment) {
    router.push({
      pathname: "/vendor-details",
      params: {
        id: String(payment.id),
        vendorName: payment.vendorName,
        amount: String(payment.amount),
        note: payment.note ?? "",
        createdAt: payment.createdAt
      }
    });
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
        selectedDate={selectedDate}
        onClose={() => setDateDrawerOpen(false)}
        onSelect={(date) => {
          setDateDrawerOpen(false);
          router.setParams({ date });
        }}
      />
      {addMethod !== null ? (
        <AddReceivedDrawer
          date={selectedDate}
          payment={addMethod}
          onClose={() => setAddMethod(null)}
        />
      ) : null}
      {vendorDrawerOpen ? (
        <AddVendorDrawer date={selectedDate} onClose={() => setVendorDrawerOpen(false)} />
      ) : null}
      <ScrollView
        className="flex-1"
        contentContainerClassName="items-center px-4 pt-2 pb-4"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            enabled={!refreshDisabled}
            onRefresh={() => {
              if (!refreshDisabled) void ledger.refetch();
            }}
            colors={[colors["counter-accent"]]}
            tintColor={colors["counter-accent"]}
          />
        }
      >
        <View className="w-full max-w-xl gap-4">
          <View className="min-h-16 flex-row items-center justify-between gap-4 px-0.5">
            <View className="min-w-0 flex-1 flex-row items-center gap-3">
              <Text
                className="text-foreground text-[28px] leading-8 font-bold tracking-tight tabular-nums"
                selectable
              >
                {displayDate.day}
              </Text>
              <View className="min-w-0">
                <Text className="text-muted-foreground text-[13px] leading-4" selectable>
                  {displayDate.weekday}
                </Text>
                <Text className="text-foreground text-base leading-5 font-semibold" selectable>
                  {displayDate.month} {displayDate.year}
                </Text>
              </View>
            </View>
            <IconButton
              icon={CalendarDays}
              label={`Open calendar. Selected ${formatDisplayDate(selectedDate)}`}
              onPress={() => setDateDrawerOpen(true)}
            />
          </View>

          {isOffline ? (
            <View className="border-border bg-muted rounded-control flex-row items-center gap-2 border px-3 py-2.5">
              <WifiOff color={colors["muted-foreground"]} size={17} strokeWidth={1.8} />
              <Text className="text-muted-foreground min-w-0 flex-1 text-sm">
                Offline. You can still review money; saving is paused until you reconnect.
              </Text>
            </View>
          ) : null}

          {loading ? (
            <View className="border-border bg-card rounded-card min-h-48 items-center justify-center gap-3 border py-6">
              <ActivityIndicator color={colors["counter-accent"]} />
              <Text accessibilityLiveRegion="polite" className="text-muted-foreground text-sm">
                Loading today&apos;s money…
              </Text>
            </View>
          ) : error ? (
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
              <DayTotals received={summary?.receivedAmount ?? 0} paid={summary?.paidAmount ?? 0} />

              <View className="flex-row flex-wrap gap-3">
                <AppButton
                  className="min-w-[46%] grow"
                  icon={BanknoteArrowDown}
                  disabled={interactionLocked}
                  accessibilityHint="Opens a form to record money received"
                  onPress={() => openPayment(null, "add")}
                >
                  Add received
                </AppButton>
                <AppButton
                  className="min-w-[46%] grow"
                  icon={Store}
                  variant="outline"
                  disabled={interactionLocked}
                  accessibilityHint="Opens a form to record a vendor payment"
                  onPress={() => setVendorDrawerOpen(true)}
                >
                  Pay vendor
                </AppButton>
              </View>

              <ReceivedMethods
                entry={entry}
                paymentMethods={paymentMethods}
                disabled={interactionLocked}
                onOpen={openPayment}
              />
              <DayDetails
                entry={entry}
                disabled={interactionLocked}
                onAdd={() => setVendorDrawerOpen(true)}
                onOpen={openVendorDetails}
              />

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
    </SafeAreaView>
  );
}
