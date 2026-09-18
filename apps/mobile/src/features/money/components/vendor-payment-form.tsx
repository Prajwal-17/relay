import { View } from "react-native";

import { AppTextInput } from "@/components/ui/app-text-input";
import { Text } from "@/components/ui/text";
import { usePalette } from "@/theme/palette";
import type { useVendorPayment } from "../hooks/use-vendor-payment";
import { AmountInput } from "./amount-input";
import { VendorNameInput } from "./vendor-name-input";

export function VendorPaymentForm({ form }: { form: ReturnType<typeof useVendorPayment> }) {
  const colors = usePalette();

  return (
    <View className="gap-4 py-2">
      <VendorNameInput
        value={form.vendorName}
        error={form.vendorError ?? undefined}
        onChangeText={form.setVendorName}
        disabled={form.saving}
      />
      <AmountInput
        label="Amount"
        value={form.amount}
        onChangeText={form.setAmount}
        error={form.amountError ?? undefined}
        editable={!form.saving}
      />
      <View className="gap-1.5">
        <Text className="text-ink text-sm font-medium">Note (optional)</Text>
        <AppTextInput
          accessibilityLabel="Vendor payment note (optional)"
          className="bg-surface min-h-24 px-3 py-3 text-base"
          value={form.note}
          onChangeText={form.setNote}
          editable={!form.saving}
          maxLength={240}
          multiline
          placeholder="Invoice, purpose, or reference"
          selectionColor={colors.accent}
          textAlignVertical="top"
        />
        <Text className="text-muted text-right text-xs tabular-nums">{form.note.length}/240</Text>
      </View>
      {form.error ? (
        <Text accessibilityRole="alert" className="text-destructive text-sm">
          {form.error}
        </Text>
      ) : null}
    </View>
  );
}
