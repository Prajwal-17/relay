import { WifiOff } from "lucide-react-native";
import { useState } from "react";
import { router } from "expo-router";
import { RefreshControl, ScrollView, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LedgerCard } from "@/components/ui/ledger-card";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { formatRupee } from "@/lib/format/money";
import { usePalette } from "@/theme/palette";
import { PaymentHeader } from "./components/payment-header";
import { PaymentHistory } from "./components/payment-history";
import { PaymentHistorySkeleton } from "./components/money-skeletons";
import { MoneyAmount } from "./components/money-amount";
import { usePaymentEntry } from "./hooks/use-payment-entry";
import type { ReceivedEntry } from "./money.types";
import { isEntryProvider } from "./payment-catalog";

export default function PaymentScreen() {
  const colors = usePalette();
  const entry = usePaymentEntry();
  const [deleteTarget, setDeleteTarget] = useState<ReceivedEntry | null>(null);
  const supportedMethod = entry.paymentMethodId === null || isEntryProvider(entry.method.name);
  const canAdd =
    entry.valid &&
    supportedMethod &&
    !entry.method.archived &&
    !entry.isOffline &&
    !entry.loading &&
    !entry.loadError &&
    entry.deletingId === null;

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
      <PaymentHeader
        name={entry.method.name}
        date={entry.date}
        onClose={entry.goBack}
        refreshing={entry.retrying || entry.isOffline || entry.deletingId !== null || !entry.valid}
        onRefresh={() => void entry.load()}
      />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={entry.retrying}
            enabled={!entry.isOffline && entry.deletingId === null && entry.valid}
            onRefresh={() => void entry.load()}
            colors={[colors["counter-accent"]]}
            tintColor={colors["counter-accent"]}
          />
        }
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
            <PaymentHistorySkeleton />
          ) : entry.loadError && !entry.hasData ? (
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
              {entry.loadError ? (
                <Text accessibilityRole="alert" className="text-destructive text-sm">
                  Could not refresh. Showing saved entries; use Refresh to try again.
                </Text>
              ) : null}
              <LedgerCard className="border-frame gap-2 p-4">
                <Text className="text-muted-foreground text-sm font-medium">
                  Total for this method
                </Text>
                <MoneyAmount amount={entry.total} className="text-xl" selectable />
              </LedgerCard>
              <PaymentHistory
                entries={entry.entries}
                hasMore={entry.hasMore}
                loadingMore={entry.loadingMore}
                loadMore={entry.loadMore}
                deletingId={entry.deletingId}
                deletionDisabled={entry.isOffline}
                onEdit={entry.editEntry}
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
      {entry.valid && !entry.method.archived && (entry.loading || supportedMethod) ? (
        <View className="border-frame bg-card border-t px-4 py-2">
          <View className="w-full max-w-xl self-center">
            <AppButton
              compact
              disabled={!canAdd}
              accessibilityHint={`Records another ${entry.method.name || "received"} entry for this date`}
              onPress={() => {
                if (!canAdd || !entry.date) return;
                router.push({
                  pathname: "/money-entry",
                  params: {
                    date: entry.date,
                    kind: "received",
                    method: entry.paymentMethodId === null ? "cash" : String(entry.paymentMethodId)
                  }
                });
              }}
            >
              Add entry
            </AppButton>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
