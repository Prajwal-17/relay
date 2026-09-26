import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, router } from "expo-router";
import { Store, Trash2, X } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconButton } from "@/components/ui/icon-button";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { formatRupee } from "@/lib/format/money";
import { useNetworkStatus } from "@/lib/network/use-network-status";
import { usePalette } from "@/theme/palette";
import { moneyKeys } from "./money.keys";
import { deleteVendorPayment } from "./money.repository";

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true
});

export default function VendorDetailsScreen() {
  const colors = usePalette();
  const queryClient = useQueryClient();
  const { isOffline } = useNetworkStatus();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const params = useLocalSearchParams<{
    id?: string;
    vendorName?: string;
    amount?: string;
    note?: string;
    createdAt?: string;
  }>();
  const id = Number(params.id);
  const validId = Number.isSafeInteger(id) && id > 0;
  const amount = Number(params.amount);
  const validAmount = Number.isSafeInteger(amount) && amount >= 0;
  const remove = useMutation({
    mutationFn: deleteVendorPayment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: moneyKeys.all });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.back();
    }
  });
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
  const createdAt =
    params.createdAt && !Number.isNaN(Date.parse(params.createdAt))
      ? dateTimeFormatter.format(new Date(params.createdAt))
      : "Time unavailable";

  return (
    <SafeAreaView className="bg-background" edges={["bottom", "left", "right"]}>
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete vendor payment?"
        message={`${formatRupee(amount)} paid to ${params.vendorName || "this vendor"} will be removed. This cannot be undone.`}
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        loading={remove.isPending}
        error={deleteError}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          if (validId && !isOffline && !remove.isPending) remove.mutate(id);
        }}
      />
      <ScrollView contentContainerClassName="px-4 pt-3 pb-6">
        <View className="w-full max-w-xl gap-5 self-center">
          <View className="flex-row items-center gap-3">
            <View className="bg-counter-accent-soft rounded-control h-10 w-10 items-center justify-center">
              <Store color={colors["counter-accent-foreground"]} size={20} strokeWidth={1.8} />
            </View>
            <Text
              accessibilityRole="header"
              className="text-foreground min-w-0 flex-1 text-lg font-semibold"
            >
              Payment details
            </Text>
            <IconButton icon={X} label="Close" onPress={() => router.back()} />
          </View>

          <View className="border-frame bg-card rounded-card overflow-hidden border">
            <View className="border-border border-b p-4">
              <Text className="text-muted-foreground text-xs">Vendor or payee</Text>
              <Text className="text-foreground mt-1 text-base font-semibold">
                {params.vendorName || "Unknown vendor"}
              </Text>
            </View>
            <View className="border-border border-b p-4">
              <Text className="text-muted-foreground text-xs">Amount</Text>
              <Text className="text-foreground mt-1 text-xl font-bold tabular-nums">
                {validAmount ? formatRupee(amount) : "—"}
              </Text>
            </View>
            <View className="border-border border-b p-4">
              <Text className="text-muted-foreground text-xs">Recorded</Text>
              <Text className="text-foreground mt-1 text-sm">{createdAt}</Text>
            </View>
            <View className="p-4">
              <Text className="text-muted-foreground text-xs">Note</Text>
              <Text className="text-foreground mt-1 text-sm leading-5">
                {params.note || "No note"}
              </Text>
            </View>
          </View>
          {deleteError ? (
            <Text accessibilityRole="alert" className="text-destructive text-sm">
              {deleteError}
            </Text>
          ) : null}
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
      </ScrollView>
    </SafeAreaView>
  );
}
