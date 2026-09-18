import { Plus, WifiOff } from "lucide-react-native";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { formatRupee } from "@/lib/format/money";
import { usePalette } from "@/theme/palette";
import { PaymentForm } from "./components/payment-form";
import { PaymentHeader } from "./components/payment-header";
import { PaymentHistory } from "./components/payment-history";
import { usePaymentEntry } from "./hooks/use-payment-entry";

export default function PaymentScreen() {
  const colors = usePalette();
  const entry = usePaymentEntry();

  return (
    <SafeAreaView className="bg-canvas flex-1" edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <PaymentHeader
          name={entry.method.name}
          date={entry.date}
          cash={entry.paymentMethodId === null}
          mode={entry.mode}
          saving={entry.saving}
          onClose={entry.goBack}
        />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerClassName="items-center px-4 pt-4 pb-6"
        >
          <View className="w-full max-w-xl gap-4">
            {entry.isOffline ? (
              <View className="border-border bg-surface-muted rounded-control flex-row items-center gap-2 border px-3 py-2.5">
                <WifiOff color={colors.muted} size={17} strokeWidth={1.8} />
                <Text className="text-muted min-w-0 flex-1 text-sm">
                  Offline. Reconnect to add or refresh entries.
                </Text>
              </View>
            ) : null}

            {!entry.valid ? (
              <Text accessibilityRole="alert" className="text-destructive">
                Choose a valid date and payment method from Till.
              </Text>
            ) : entry.loading ? (
              <View className="items-center gap-3 py-8">
                <ActivityIndicator color={colors.accent} />
                <Text className="text-muted">Loading entries…</Text>
              </View>
            ) : entry.loadError ? (
              <View className="gap-3 p-4">
                <Text accessibilityRole="alert" className="text-destructive">
                  {entry.loadError}
                </Text>
                <AppButton
                  variant="outline"
                  disabled={entry.isOffline}
                  onPress={() => void entry.load()}
                >
                  Try again
                </AppButton>
              </View>
            ) : (
              <>
                <View className="border-border flex-row flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <Text className="text-muted text-sm">Total for this method</Text>
                  <Text
                    adjustsFontSizeToFit
                    accessibilityLiveRegion="polite"
                    className="text-ink max-w-[65%] text-right text-2xl font-semibold tabular-nums"
                    numberOfLines={1}
                  >
                    {formatRupee(entry.total)}
                  </Text>
                </View>
                {entry.mode === "add" ? (
                  <PaymentForm entry={entry} />
                ) : (
                  <PaymentHistory
                    entries={entry.entries}
                    hasMore={entry.hasMore}
                    loadingMore={entry.loadingMore}
                    loadMore={entry.loadMore}
                  />
                )}
              </>
            )}
          </View>
        </ScrollView>

        {entry.saveError ? (
          <Text accessibilityRole="alert" className="text-destructive px-4 py-2 text-sm">
            {entry.saveError}
          </Text>
        ) : null}
        {entry.valid && entry.mode === "add" && !entry.method.archived ? (
          <View className="border-border bg-surface border-t px-4 py-3">
            <AppButton
              icon={Plus}
              className="w-full max-w-xl self-center"
              disabled={!entry.canSave}
              loading={entry.saving}
              onPress={() => void entry.save()}
            >
              {entry.canSave ? `Add ${formatRupee(entry.parsedAmount)}` : "Add entry"}
            </AppButton>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
