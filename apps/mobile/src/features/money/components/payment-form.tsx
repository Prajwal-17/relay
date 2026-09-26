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
    return <Text className="text-muted-foreground text-sm">This payment method is archived.</Text>;
  }

  return (
    <View className="gap-4 py-2">
      <AmountInput
        label="Amount"
        className="text-xl"
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
        <Text className="text-foreground text-sm font-medium">Note (optional)</Text>
        <AppTextInput
          accessibilityLabel="Note (optional)"
          className="bg-card min-h-24 px-3 py-3 text-base"
          value={note}
          onChangeText={(value) => {
            setNote(value);
            setSaveError(null);
          }}
          editable={!saving}
          maxLength={240}
          multiline
          placeholder="What was this payment for?"
          selectionColor={colors["counter-accent"]}
          textAlignVertical="top"
        />
        <Text className="text-muted-foreground text-right text-xs tabular-nums">
          {note.length}/240
        </Text>
      </View>
    </View>
  );
}
