import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pencil, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Text } from "@/components/ui/text";
import { formatRupee } from "@/lib/format/money";
import { getTodayIST, parseLocalDate } from "@/lib/format/dates";
import { useNetworkStatus } from "@/lib/network/use-network-status";
import { applyMoneyMutation } from "./money.cache";
import { moneyKeys } from "./money.keys";
import { moneyWeekOptions } from "./money.queries";
import type { EditableVendorPayment } from "./money.types";
import { deleteVendorPayment } from "./money.repository";

import { entryDateTimes } from "./payment-history.utils";
import { EntryPage } from "./components/entry-page";
import { MoneyAmount } from "./components/money-amount";
import { useEntryNavigation, useEntryRemovalGuard } from "./hooks/use-entry-navigation";

export default function VendorDetailsScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isOffline } = useNetworkStatus();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const params = useLocalSearchParams<{
    id?: string;
    date?: string;
    vendorName?: string;
    amount?: string;
    note?: string;
    createdAt?: string;
    updatedAt?: string;
  }>();
  const id = Number(params.id);
  const businessDate = parseLocalDate(params.date);
  const navigation = useEntryNavigation(businessDate ?? getTodayIST());
  const validId = Number.isSafeInteger(id) && id > 0;
  // Subscribe to the existing week so returning from Edit shows the canonical saved values.
  const week = useQuery({ ...moneyWeekOptions(businessDate ?? getTodayIST()), enabled: false });
  const payment = week.data?.days
    .find((day) => day.date === businessDate)
    ?.entry?.vendorPayments.find((payment) => payment.id === id);
  const amount = payment?.amount ?? Number(params.amount);
  const vendorName = payment?.vendorName ?? params.vendorName;
  const note = payment ? payment.note : params.note;
  const times = entryDateTimes(
    payment?.createdAt ?? params.createdAt ?? "",
    payment?.updatedAt ?? params.updatedAt
  );
  const validAmount = Number.isSafeInteger(amount) && amount >= 0;
  const remove = useMutation({
    mutationFn: deleteVendorPayment,
    onSuccess: async (result) => {
      await applyMoneyMutation(queryClient, result);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      navigation.finish();
    }
  });
  useEntryRemovalGuard(
    { dirty: false, saving: remove.isPending, committed: remove.isSuccess },
    navigation.finished
  );
  const deleteError =
    remove.error instanceof Error
      ? remove.error.message
      : remove.error
        ? "Could not delete this payment."
        : null;

  function confirmDelete() {
    if (!validId || !validAmount || isOffline || remove.isPending) return;
    remove.reset();
    setDeleteDialogOpen(true);
  }

  return (
    <EntryPage
      title="Payment details"
      date={null}
      onBack={navigation.finish}
      saving={remove.isPending}
    >
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete vendor payment?"
        message={`${formatRupee(amount)} paid to ${vendorName || "this vendor"} will be removed. This cannot be undone.`}
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        loading={remove.isPending}
        error={deleteError}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          if (validId && !isOffline && !remove.isPending) remove.mutate(id);
        }}
      />
      <View className="gap-4">
        <View className="border-frame bg-card rounded-card overflow-hidden border">
          <View className="border-border border-b p-4">
            <Text className="text-muted-foreground text-xs">Vendor or payee</Text>
            <Text className="text-foreground mt-1 text-base font-semibold">
              {vendorName || "Unknown vendor"}
            </Text>
          </View>
          <View className="border-border border-b p-4">
            <Text className="text-muted-foreground text-xs">Amount</Text>
            <View className="mt-1">
              {validAmount ? (
                <MoneyAmount amount={amount} className="text-xl font-bold" selectable />
              ) : (
                <Text>—</Text>
              )}
            </View>
          </View>
          <View className="border-border border-b p-4">
            <Text className="text-muted-foreground text-xs">Created at</Text>
            <Text className="text-foreground mt-1 text-sm">{times.created}</Text>
          </View>
          {times.updated ? (
            <View className="border-border border-b p-4">
              <Text className="text-muted-foreground text-xs">Updated at</Text>
              <Text className="text-foreground mt-1 text-sm">{times.updated}</Text>
            </View>
          ) : null}
          <View className="p-4">
            <Text className="text-muted-foreground text-xs">Note</Text>
            <Text className="text-foreground mt-1 text-sm leading-5">{note || "No note"}</Text>
          </View>
        </View>
        {deleteError ? (
          <Text accessibilityRole="alert" className="text-destructive text-sm">
            {deleteError}
          </Text>
        ) : null}
        <AppButton
          icon={Pencil}
          disabled={!validId || !validAmount || !businessDate || isOffline || remove.isPending}
          onPress={() => {
            if (!businessDate || !validId || !validAmount || isOffline || remove.isPending) return;
            // The normal path reuses data already displayed; a cold link can fetch the entry.
            if (payment)
              queryClient.setQueryData(moneyKeys.entry("vendor", id), {
                ...payment,
                kind: "vendor",
                date: businessDate
              } satisfies EditableVendorPayment);
            router.push({
              pathname: "/money-entry",
              params: { date: businessDate, kind: "vendor", entryId: String(id) }
            });
          }}
        >
          Edit payment
        </AppButton>
        <AppButton
          icon={Trash2}
          variant="destructive"
          loading={remove.isPending}
          loadingLabel="Deleting…"
          disabled={!validId || !validAmount || isOffline}
          className="w-full"
          onPress={confirmDelete}
        >
          Delete payment
        </AppButton>
      </View>
    </EntryPage>
  );
}
