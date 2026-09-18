import { WifiOff } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LedgerCard } from "@/components/ui/ledger-card";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { formatRupee } from "@/lib/format/money";
import { usePalette } from "@/theme/palette";
import { PaymentHeader } from "./components/payment-header";
import { PaymentHistory } from "./components/payment-history";
import { usePaymentEntry } from "./hooks/use-payment-entry";
import type { ReceivedEntry } from "./money.types";

export default function PaymentScreen() {
  const colors = usePalette();
  const entry = usePaymentEntry();
  const [deleteTarget, setDeleteTarget] = useState<ReceivedEntry | null>(null);

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top", "bottom", "left", "right"]}>
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this entry?"
        message={
          deleteTarget
            ? `${formatRupee(deleteTarget.amount)} will be removed from ${entry.method.name}. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        loading={deleteTarget !== null && entry.deletingId === deleteTarget.id}
        error={entry.deleteError}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          void entry.deleteEntry(deleteTarget.id).then((deleted) => {
            if (deleted) setDeleteTarget(null);
          });
        }}
      />
      <PaymentHeader name={entry.method.name} date={entry.date} onClose={entry.goBack} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerClassName="items-center px-4 pt-4 pb-6"
      >
        <View className="w-full max-w-xl gap-4">
          {entry.isOffline ? (
            <View className="border-border bg-muted rounded-control flex-row items-center gap-2 border px-3 py-2.5">
              <WifiOff color={colors["muted-foreground"]} size={17} strokeWidth={1.8} />
              <Text className="text-muted-foreground min-w-0 flex-1 text-sm">
                Offline. Reconnect to add or refresh entries.
              </Text>
            </View>
          ) : null}

          {!entry.valid ? (
            <Text accessibilityRole="alert" className="text-destructive">
              Choose a valid date and payment method from Money.
            </Text>
          ) : entry.loading ? (
            <View className="items-center gap-3 py-8">
              <ActivityIndicator color={colors["counter-accent"]} />
              <Text className="text-muted-foreground">Loading entries…</Text>
            </View>
          ) : entry.loadError ? (
            <View className="gap-3 p-4">
              <Text accessibilityRole="alert" className="text-destructive">
                {entry.loadError}
              </Text>
              <AppButton
                variant="outline"
                disabled={entry.isOffline}
                loading={entry.retrying}
                loadingLabel="Trying again…"
                onPress={() => void entry.load()}
              >
                Try again
              </AppButton>
            </View>
          ) : (
            <>
              <LedgerCard className="border-frame flex-row flex-wrap items-center justify-between gap-2 p-4">
                <Text className="text-muted-foreground text-sm font-medium">
                  Total for this method
                </Text>
                <Text
                  adjustsFontSizeToFit
                  accessibilityLiveRegion="polite"
                  className="text-foreground max-w-[65%] text-right text-xl font-semibold tabular-nums"
                  numberOfLines={1}
                >
                  {formatRupee(entry.total)}
                </Text>
              </LedgerCard>
              <PaymentHistory
                entries={entry.entries}
                hasMore={entry.hasMore}
                loadingMore={entry.loadingMore}
                loadMore={entry.loadMore}
                deletingId={entry.deletingId}
                deletionDisabled={entry.isOffline}
                onDelete={(target) => {
                  entry.clearDeleteError();
                  setDeleteTarget(target);
                }}
              />
              {entry.deleteError ? (
                <Text accessibilityRole="alert" className="text-destructive text-sm">
                  {entry.deleteError}
                </Text>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
