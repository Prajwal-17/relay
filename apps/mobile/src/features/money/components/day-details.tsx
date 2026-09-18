import { ChevronRight, Plus } from "lucide-react-native";
import { View } from "react-native";

import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { formatRupee } from "@/lib/format/money";
import { usePalette } from "@/theme/palette";
import type { DailyEntry, VendorPayment } from "../money.types";
import { PaymentIcon } from "./payment-icon";

export function DayDetails({
  entry,
  onAdd,
  onOpen,
  disabled
}: {
  entry: DailyEntry | null;
  onAdd: () => void;
  onOpen: (payment: VendorPayment) => void;
  disabled: boolean;
}) {
  const colors = usePalette();
  const payments = entry?.vendorPayments ?? [];

  return (
    <View className="gap-2">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <View>
          <Text accessibilityRole="header" className="text-foreground text-lg font-semibold">
            Vendor payments
          </Text>
        </View>
        <Pressable
          disabled={disabled}
          accessibilityLabel="Add vendor payment"
          className="min-h-12 flex-row items-center gap-1 px-2"
          onPress={onAdd}
        >
          <Plus color={colors["counter-accent"]} size={18} strokeWidth={2} />
          <Text className="text-counter-accent-foreground text-sm font-semibold">Add</Text>
        </Pressable>
      </View>

      {payments.length ? (
        <View className="border-border bg-card rounded-card overflow-hidden border">
          {payments.map((payment, index) => (
            <Pressable
              key={payment.id}
              accessibilityLabel={`${payment.vendorName}, ${formatRupee(payment.amount)}. View details`}
              disabled={disabled}
              onPress={() => onOpen(payment)}
              className={`min-h-14 flex-row items-center gap-2 px-3 py-1.5 ${
                index < payments.length - 1 ? "border-border border-b" : ""
              }`}
            >
              <PaymentIcon name={payment.vendorName} kind="vendor" />
              <View className="min-w-0 flex-1">
                <Text className="text-foreground text-[15px] font-medium" numberOfLines={1}>
                  {payment.vendorName}
                </Text>
                {payment.note ? (
                  <Text className="text-muted-foreground mt-0.5 text-xs" numberOfLines={1}>
                    {payment.note}
                  </Text>
                ) : null}
              </View>
              <Text
                adjustsFontSizeToFit
                className="text-foreground max-w-[45%] text-right text-base font-semibold tabular-nums"
                numberOfLines={1}
              >
                {formatRupee(payment.amount)}
              </Text>
              <ChevronRight color={colors["muted-foreground"]} size={19} strokeWidth={1.9} />
            </Pressable>
          ))}
        </View>
      ) : (
        <View className="border-border bg-card rounded-card border px-4 py-5">
          <Text className="text-muted-foreground text-sm">No vendor payments recorded.</Text>
        </View>
      )}
    </View>
  );
}
