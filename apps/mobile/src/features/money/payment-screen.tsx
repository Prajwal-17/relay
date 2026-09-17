import { usePalette } from "@/theme/palette";
import { Plus } from "lucide-react-native";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { AppButton } from "@/components/ui/app-button";
import { PaymentForm } from "./components/payment-form";
import { PaymentHistory } from "./components/payment-history";
import { PaymentHeader } from "./components/payment-header";
import { usePaymentEntry } from "./hooks/use-payment-entry";
import { formatRupee } from "@/lib/format/money";

export default function PaymentScreen() {
  const colors = usePalette();
  const entry = usePaymentEntry();
  const {
    date,
    valid,
    router,
    method,
    events,
    hasMore,
    loadingMore,
    loading,
    loadError,
    saving,
    saveError,
    canSave,
    amountPaisa,
    load,
    save,
    loadMore
  } = entry;

  return (
    <SafeAreaView className="bg-canvas flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <PaymentHeader
          name={method.name}
          date={date}
          cash={entry.channelId === null}
          saving={saving}
          onBack={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/money");
          }}
        />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerClassName="items-center px-4 pb-6 pt-4"
        >
          <View className="w-full max-w-xl gap-4">
            {!valid ? (
              <Text accessibilityRole="alert" className="text-destructive">
                Choose a valid date and payment method from Money.
              </Text>
            ) : loading ? (
              <View className="items-center gap-3 py-8">
                <ActivityIndicator color={colors["accent"]} />
                <Text className="text-muted">Loading payments…</Text>
              </View>
            ) : loadError ? (
              <View className="gap-3 p-4">
                <Text accessibilityRole="alert" className="text-destructive">
                  {loadError}
                </Text>
                <AppButton variant="outline" onPress={() => void load()}>
                  Try again
                </AppButton>
              </View>
            ) : (
              <>
                <View className="flex-row flex-wrap items-center justify-between gap-2 py-1">
                  <Text className="text-muted text-sm">Daily total</Text>
                  <Text
                    accessibilityLiveRegion="polite"
                    className="text-ink text-2xl font-semibold tabular-nums"
                  >
                    {formatRupee(entry.balance)}
                  </Text>
                </View>
                <PaymentForm entry={entry} />
                <PaymentHistory
                  date={date}
                  events={events}
                  hasMore={hasMore}
                  loadingMore={loadingMore}
                  saving={saving}
                  loadMore={loadMore}
                />
              </>
            )}
          </View>
        </ScrollView>
        {saveError ? (
          <Text accessibilityRole="alert" className="text-destructive px-4 py-2 text-sm">
            {saveError}
          </Text>
        ) : null}
        {valid && !method.archived ? (
          <View className="border-border bg-surface border-t px-4 py-3">
            <AppButton
              icon={Plus}
              className="w-full max-w-xl self-center"
              disabled={!canSave || loadingMore}
              loading={saving}
              onPress={() => void save()}
            >
              {canSave ? `Add ${formatRupee(amountPaisa)}` : "Add payment"}
            </AppButton>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
