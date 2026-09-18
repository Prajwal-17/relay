import { View } from "react-native";

import { AppTextInput } from "@/components/ui/app-text-input";
import { Text } from "@/components/ui/text";
import { usePalette } from "@/theme/palette";
import type { usePaymentEntry } from "../hooks/use-payment-entry";
import { AmountInput } from "./amount-input";

export function PaymentForm({ entry }: { entry: ReturnType<typeof usePaymentEntry> }) {
  const colors = usePalette();
  const { method, amount, note, saving, amountError, setAmount, setNote, setSaveError } = entry;

  if (method.archived) {
    return <Text className="text-muted text-sm">This payment method is archived.</Text>;
  }

  return (
    <View className="gap-4 py-2">
      <AmountInput
        label="Amount"
        className="text-2xl"
        value={amount}
        editable={!saving}
        autoFocus
        error={amountError ?? undefined}
        onChangeText={(value) => {
          setAmount(value);
          setSaveError(null);
        }}
      />
      <View className="gap-1.5">
        <Text className="text-ink text-sm font-medium">Note (optional)</Text>
        <AppTextInput
          accessibilityLabel="Note (optional)"
          className="bg-surface min-h-24 px-3 py-3 text-base"
          value={note}
          onChangeText={(value) => {
            setNote(value);
            setSaveError(null);
          }}
          editable={!saving}
          maxLength={240}
          multiline
          placeholder="What was this payment for?"
          selectionColor={colors.accent}
          textAlignVertical="top"
        />
        <Text className="text-muted text-right text-xs tabular-nums">{note.length}/240</Text>
      </View>
    </View>
  );
}
