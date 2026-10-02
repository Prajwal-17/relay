import { Plus, X } from "lucide-react-native";
import {
  ScrollView,
  useWindowDimensions,
  View
} from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { Drawer } from "@/components/ui/drawer";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { formatDisplayDate } from "@/lib/format/dates";
import { usePalette } from "@/theme/palette";
import type { LocalDate } from "../money.types";
import { useVendorPayment } from "../hooks/use-vendor-payment";
import { VendorPaymentForm } from "./vendor-payment-form";

export function AddVendorDrawer({ date, onClose }: { date: LocalDate; onClose: () => void }) {
  const colors = usePalette();
  const { height } = useWindowDimensions();
  const form = useVendorPayment({ date, onClose });

  return (
    <Drawer open onClose={form.goBack} label="vendor payment form">
      <View className="border-border flex-row items-center justify-between border-b px-5 pt-2 pb-2">
        <View className="min-w-0 flex-1">
          <Text accessibilityRole="header" className="text-foreground text-lg font-semibold">
            Pay vendor
          </Text>
          <Text className="text-muted-foreground mt-0.5 text-xs">{formatDisplayDate(date)}</Text>
        </View>
        <Pressable
          accessibilityLabel="Close vendor payment form"
          className="min-h-12 min-w-12 items-center justify-center"
          onPress={form.goBack}
        >
          <X color={colors["muted-foreground"]} size={20} strokeWidth={1.8} />
        </Pressable>
      </View>
      <ScrollView
        style={{ maxHeight: height * 0.62, flexShrink: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-5 pb-3"
      >
        <VendorPaymentForm form={form} />
      </ScrollView>
      <View className="border-border bg-card border-t px-5 py-3">
        <AppButton
          icon={Plus}
          loading={form.saving}
          loadingLabel="Saving…"
          disabled={!form.canSave}
          onPress={() => void form.save()}
        >
          Add payment
        </AppButton>
      </View>
    </Drawer>
  );
}
