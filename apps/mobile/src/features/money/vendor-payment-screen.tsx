import { ArrowLeft, Plus } from "lucide-react-native";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { AppButton } from "@/components/ui/app-button";
import { IconButton } from "@/components/ui/icon-button";
import { formatDisplayDate } from "@/lib/format/dates";
import { VendorPaymentForm } from "./components/vendor-payment-form";
import { useVendorPayment } from "./hooks/use-vendor-payment";

export default function VendorPaymentScreen() {
  const form = useVendorPayment();

  return (
    <SafeAreaView className="bg-canvas flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="w-full max-w-xl flex-row items-center gap-3 self-center px-4 py-2">
          <IconButton
            icon={ArrowLeft}
            label="Back to Money"
            disabled={form.saving}
            onPress={form.goBack}
          />
          <Text
            accessibilityRole="header"
            className="text-ink min-w-0 flex-1 text-xl font-semibold"
          >
            Vendor payment
          </Text>
        </View>
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerClassName="items-center px-4 pb-6 pt-2"
        >
          <View className="w-full max-w-xl gap-4">
            {form.date ? (
              <Text className="text-muted text-sm">{formatDisplayDate(form.date)}</Text>
            ) : null}
            {form.valid ? (
              <VendorPaymentForm form={form} />
            ) : (
              <Text accessibilityRole="alert" className="text-destructive text-base">
                Choose today or an earlier date from Money.
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
                Add vendor payment
              </AppButton>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
