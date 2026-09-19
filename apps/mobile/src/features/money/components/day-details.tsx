import { Plus } from "lucide-react-native";
import { View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { formatRupee } from "@/lib/format/money";
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
  const payments = entry?.vendorPayments ?? [];

  return (
    <View className="gap-2">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <View>
          <Text accessibilityRole="header" className="text-ink text-base font-semibold">
            Vendor payments
          </Text>
          <Text className="text-muted mt-1 text-xs">
            {payments.length ? `${payments.length} recorded` : "No payments recorded"}
          </Text>
        </View>
        <AppButton
          compact
          icon={Plus}
          variant="outline"
          disabled={disabled}
          accessibilityLabel="Add vendor payment"
          onPress={onAdd}
        >
          Add
        </AppButton>
      </View>

      {payments.length ? (
        <View className="border-border bg-surface rounded-card overflow-hidden border">
          {payments.map((payment, index) => (
            <Pressable
              key={payment.id}
              accessibilityLabel={`${payment.vendorName}, ${formatRupee(payment.amount)}. View details`}
              disabled={disabled}
              onPress={() => onOpen(payment)}
              className={`min-h-16 flex-row items-center gap-3 px-3 py-2.5 ${
                index < payments.length - 1 ? "border-border border-b" : ""
              }`}
            >
              <PaymentIcon name={payment.vendorName} kind="vendor" />
              <View className="min-w-0 flex-1">
                <Text className="text-ink text-sm font-medium" numberOfLines={1}>
                  {payment.vendorName}
                </Text>
                {payment.note ? (
                  <Text className="text-muted mt-0.5 text-xs" numberOfLines={1}>
                    {payment.note}
                  </Text>
                ) : null}
              </View>
              <Text
                adjustsFontSizeToFit
                className="text-ink max-w-[45%] text-right text-base font-semibold tabular-nums"
                numberOfLines={1}
              >
                {formatRupee(payment.amount)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
