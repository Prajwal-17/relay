import { Plus, WifiOff, X } from "lucide-react-native";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { IconButton } from "@/components/ui/icon-button";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { formatDisplayDate } from "@/lib/format/dates";
import { usePalette } from "@/theme/palette";
import { VendorPaymentForm } from "./components/vendor-payment-form";
import { useVendorPayment } from "./hooks/use-vendor-payment";

export default function VendorPaymentScreen() {
  const colors = usePalette();
  const form = useVendorPayment();

  return (
    <SafeAreaView className="bg-canvas flex-1" edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="border-border w-full max-w-xl flex-row items-center gap-3 self-center border-b px-4 pt-3 pb-3">
          <View className="min-w-0 flex-1">
            <Text accessibilityRole="header" className="text-ink text-xl font-semibold">
              Pay vendor
            </Text>
            {form.date ? (
              <Text className="text-muted mt-0.5 text-xs">{formatDisplayDate(form.date)}</Text>
            ) : null}
          </View>
          <IconButton icon={X} label="Close" disabled={form.saving} onPress={form.goBack} />
        </View>
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerClassName="items-center px-4 pt-3 pb-6"
        >
          <View className="w-full max-w-xl gap-4">
            {form.isOffline ? (
              <View className="border-border bg-surface-muted rounded-control flex-row items-center gap-2 border px-3 py-2.5">
                <WifiOff color={colors.muted} size={17} strokeWidth={1.8} />
                <Text className="text-muted min-w-0 flex-1 text-sm">
                  Offline. Reconnect before recording this payment.
                </Text>
              </View>
            ) : null}
            {form.valid ? (
              <VendorPaymentForm form={form} />
            ) : (
              <Text accessibilityRole="alert" className="text-destructive text-base">
                Choose today or an earlier date from Till.
              </Text>
            )}
          </View>
        </ScrollView>
        {form.valid ? (
          <View className="border-border bg-surface border-t px-4 py-3">
            <View className="w-full max-w-xl flex-row gap-2 self-center">
              <AppButton variant="outline" disabled={form.saving} onPress={form.goBack}>
                Cancel
              </AppButton>
              <AppButton
                icon={Plus}
                className="flex-1"
                loading={form.saving}
                disabled={!form.canSave}
                onPress={() => void form.save()}
              >
                Add payment
              </AppButton>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
