import { ChevronRight } from "lucide-react-native";
import { View } from "react-native";

import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { formatRupee } from "@/lib/format/money";
import { usePalette } from "@/theme/palette";
import type { DailyEntry, VendorPayment } from "../money.types";
import { PaymentIcon } from "./payment-icon";

export function DayDetails({
  entry,
  onOpen,
  disabled
}: {
  entry: DailyEntry | null;
  onOpen: (payment: VendorPayment) => void;
  disabled: boolean;
}) {
  const colors = usePalette();
  const payments = entry?.vendorPayments ?? [];

  return (
    <View className="gap-2">
      <Text accessibilityRole="header" className="text-foreground text-[15px] font-semibold">
        Paid to vendors
      </Text>

      {payments.length ? (
        <View className="border-border bg-card rounded-card overflow-hidden border">
          {payments.map((payment, index) => (
            <Pressable
              key={payment.id}
              accessibilityLabel={`${payment.vendorName}, ${formatRupee(payment.amount)}. View details`}
              disabled={disabled}
              onPress={() => onOpen(payment)}
              className={`min-h-16 flex-row items-center gap-2 px-3 py-1.5 ${
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
