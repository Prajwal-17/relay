import { usePalette } from "@/theme/palette";
import { AppTextInput } from "@/components/ui/app-text-input";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { AmountInput } from "./amount-input";
import type { usePaymentEntry } from "../hooks/use-payment-entry";

export function PaymentForm({ entry }: { entry: ReturnType<typeof usePaymentEntry> }) {
  const colors = usePalette();
  const {
    params,
    method,
    amount,
    saving,
    name,
    setName,
    hasSaved,
    amountError,
    setAmount,
    setSaveError
  } = entry;
  return (
    <View className="gap-4 py-2">
      {method.archived ? (
        <Text className="text-muted text-sm">Archived method · history only</Text>
      ) : (
        <>
          <View>
            <AmountInput
              label="Amount"
              className="text-2xl"
              value={amount}
              editable={!saving}
              autoFocus={params.history !== "1" && !hasSaved}
              error={amountError ?? undefined}
              onChangeText={(value) => {
                setAmount(value);
                setSaveError(null);
              }}
            />
          </View>
          <View className="gap-1.5">
            <Text className="text-ink text-sm font-medium">Name (optional)</Text>
            <AppTextInput
              accessibilityLabel="Name (optional)"
              className="bg-canvas"
              value={name}
              onChangeText={setName}
              editable={!saving}
              maxLength={120}
              placeholder="Customer or payment name"
              selectionColor={colors["accent"]}
              returnKeyType="done"
            />
          </View>
        </>
      )}
    </View>
  );
}
