import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { AmountInput } from "./amount-input";
import { VendorNameInput } from "./vendor-name-input";
import type { useVendorPayment } from "../hooks/use-vendor-payment";

export function VendorPaymentForm({ form }: { form: ReturnType<typeof useVendorPayment> }) {
  return (
    <View className="gap-4 py-2">
      <VendorNameInput value={form.payee} onChangeText={form.setPayee} disabled={form.saving} />
      <AmountInput
        label="Vendor payment amount"
        value={form.amount}
        onChangeText={form.setAmount}
        error={form.amountError ?? undefined}
        editable={!form.saving}
        returnKeyType="done"
        onSubmitEditing={() => void form.save()}
      />
      {form.error ? (
        <Text accessibilityRole="alert" className="text-destructive text-sm">
          {form.error}
        </Text>
      ) : null}
    </View>
  );
}
