import { useRef, type RefObject } from "react";
import { Keyboard, TextInput, View } from "react-native";

import { AppTextInput } from "@/components/ui/app-text-input";
import { Text } from "@/components/ui/text";
import type { useVendorPayment } from "../hooks/use-vendor-payment";
import { AmountInput } from "./amount-input";
import { VendorNameInput } from "./vendor-name-input";

export function VendorPaymentForm({
  form,
  amountRef
}: {
  form: ReturnType<typeof useVendorPayment>;
  amountRef: RefObject<TextInput | null>;
}) {
  const vendorRef = useRef<TextInput>(null);
  const noteRef = useRef<TextInput>(null);

  return (
    <View className="gap-3 py-2">
      <AmountInput
        label="Amount"
        inputRef={amountRef}
        value={form.amount}
        onChangeText={form.setAmount}
        error={form.amountError ?? undefined}
        className="text-left text-[32px] leading-10"
        editable={!form.draftLocked}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => vendorRef.current?.focus()}
      />
      <VendorNameInput
        inputRef={vendorRef}
        autoFocus={false}
        value={form.vendorName}
        error={form.vendorName.length ? (form.vendorError ?? undefined) : undefined}
        onChangeText={form.setVendorName}
        disabled={form.draftLocked}
        onSubmitEditing={() => noteRef.current?.focus()}
      />
      <View className="gap-1.5">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-foreground text-sm font-medium">Note (optional)</Text>
          {form.note.length > 0 ? (
            <Text className="text-muted-foreground text-xs tabular-nums">
              {form.note.length}/240
            </Text>
          ) : null}
        </View>
        <AppTextInput
          ref={noteRef}
          accessibilityLabel="Vendor payment note (optional)"
          className="bg-card min-h-12 px-3 py-2 text-base"
          value={form.note}
          onChangeText={form.setNote}
          editable={!form.draftLocked}
          maxLength={240}
          placeholder="Add a note"
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
      </View>
      {form.error ? (
        <Text accessibilityRole="alert" className="text-destructive text-sm">
          {form.error}
        </Text>
      ) : null}
      {form.isOffline ? (
        <Text accessibilityRole="alert" className="text-muted-foreground text-sm">
          Reconnect before saving this payment.
        </Text>
      ) : null}
    </View>
  );
}
