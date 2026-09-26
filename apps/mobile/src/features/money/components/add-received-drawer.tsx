import { Plus, X } from "lucide-react-native";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  View
} from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { Drawer } from "@/components/ui/drawer";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { formatDisplayDate } from "@/lib/format/dates";
import { formatRupee } from "@/lib/format/money";
import { usePalette } from "@/theme/palette";
import type { LocalDate } from "../money.types";
import { usePaymentEntry } from "../hooks/use-payment-entry";
import { PaymentForm } from "./payment-form";

interface AddReceivedDrawerProps {
  date: LocalDate;
  payment: { method: string; name: string; archived: boolean; total: number };
  onClose: () => void;
}

export function AddReceivedDrawer({ date, payment, onClose }: AddReceivedDrawerProps) {
  const colors = usePalette();
  const { height } = useWindowDimensions();
  const entry = usePaymentEntry({ date, ...payment, onClose });

  return (
    <Drawer open onClose={entry.goBack} label="entry form">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View className="border-border flex-row items-center justify-between border-b px-5 pt-2 pb-2">
          <View className="min-w-0 flex-1">
            <Text accessibilityRole="header" className="text-foreground text-lg font-semibold">
              Add {entry.method.name || "received money"}
            </Text>
            <Text className="text-muted-foreground mt-0.5 text-xs">{formatDisplayDate(date)}</Text>
          </View>
          <Pressable
            accessibilityLabel="Close entry form"
            className="min-h-12 min-w-12 items-center justify-center"
            onPress={entry.goBack}
          >
            <X color={colors["muted-foreground"]} size={20} strokeWidth={1.8} />
          </Pressable>
        </View>
        <ScrollView
          style={{ maxHeight: height * 0.62 }}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-5 pb-3"
        >
          <PaymentForm entry={entry} />
          {entry.saveError ? (
            <Text accessibilityRole="alert" className="text-destructive pb-2 text-sm">
              {entry.saveError}
            </Text>
          ) : null}
        </ScrollView>
        <View className="border-border bg-card border-t px-5 py-3">
          <AppButton
            icon={Plus}
            disabled={!entry.canSave}
            loading={entry.saving}
            loadingLabel="Saving…"
            onPress={() => void entry.save()}
          >
            {entry.canSave ? `Add ${formatRupee(entry.parsedAmount)}` : "Add entry"}
          </AppButton>
        </View>
      </KeyboardAvoidingView>
    </Drawer>
  );
}
