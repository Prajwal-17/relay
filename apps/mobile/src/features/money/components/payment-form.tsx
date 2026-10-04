import { useRef, type RefObject } from "react";
import { Keyboard, TextInput, View } from "react-native";

import { AppTextInput } from "@/components/ui/app-text-input";
import { Text } from "@/components/ui/text";
import type { usePaymentEntry } from "../hooks/use-payment-entry";
import { AmountInput } from "./amount-input";
import { ReceivedMethodPicker } from "./received-method-picker";

export function PaymentForm({
  entry,
  amountRef
}: {
  entry: ReturnType<typeof usePaymentEntry>;
  amountRef: RefObject<TextInput | null>;
}) {
  const noteRef = useRef<TextInput>(null);
  const { method, amount, note, amountError, setAmount, setNote, setSaveError } = entry;

  if (method.archived) {
    return <Text className="text-muted-foreground text-sm">This payment method is archived.</Text>;
  }

  return (
    <View className="gap-3 py-2">
      <AmountInput
        label="Amount"
        inputRef={amountRef}
        className="text-left text-[32px] leading-10"
        value={amount}
        editable={!entry.draftLocked}
        error={amountError ?? undefined}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => noteRef.current?.focus()}
        onChangeText={(value) => {
          setAmount(value);
          setSaveError(null);
        }}
      />
      <ReceivedMethodPicker
        methods={entry.availableMethods}
        selectedId={entry.paymentMethodId}
        disabled={entry.draftLocked}
        onSelect={entry.selectMethod}
      />
      <View className="gap-1.5">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-foreground text-sm font-medium">Note (optional)</Text>
          {note.length > 0 ? (
            <Text className="text-muted-foreground text-xs tabular-nums">{note.length}/240</Text>
          ) : null}
        </View>
        <AppTextInput
          ref={noteRef}
          accessibilityLabel="Note (optional)"
          className="bg-card min-h-12 px-3 py-2 text-base"
          value={note}
          onChangeText={(value) => {
            setNote(value);
            setSaveError(null);
          }}
          editable={!entry.draftLocked}
          maxLength={240}
          placeholder="Add a note"
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
      </View>
    </View>
  );
}
