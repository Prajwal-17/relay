import { Plus } from "lucide-react-native";
import { View } from "react-native";

import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { formatRupee } from "@/lib/format/money";
import { usePalette } from "@/theme/palette";
import type { DailyEntry, PaymentMethod } from "../money.types";
import { PaymentIcon } from "./payment-icon";

export function ReceivedMethods({
  entry,
  paymentMethods,
  onOpen,
  disabled
}: {
  entry: DailyEntry | null;
  paymentMethods: PaymentMethod[];
  onOpen: (paymentMethodId: number | null, mode: "add" | "history") => void;
  disabled: boolean;
}) {
  const colors = usePalette();
  const methods = [
    { id: null, name: "Cash", amount: entry?.cashAmount ?? 0, archived: false },
    ...paymentMethods
      .map((method) => ({
        id: method.id,
        name: method.name,
        archived: method.isArchived,
        amount:
          entry?.paymentTotals.find((total) => total.paymentMethodId === method.id)?.amount ?? 0
      }))
      .filter((method) => !method.archived || method.amount > 0)
  ];

  return (
    <View className="gap-2">
      <View>
        <Text accessibilityRole="header" className="text-foreground text-lg font-semibold">
          Received methods
        </Text>
      </View>
      <View className="border-border bg-card rounded-card overflow-hidden border">
        {methods.map((method, index) => (
          <View
            key={method.id ?? "cash"}
            className={index < methods.length - 1 ? "border-border border-b" : undefined}
          >
            <View className="min-h-14 flex-row items-center gap-2 px-3 py-1.5">
              <Pressable
                accessibilityLabel={`${method.name}, ${formatRupee(method.amount)}. View entry history`}
                disabled={disabled}
                onPress={() => onOpen(method.id, "history")}
                className="min-w-0 flex-1 flex-row items-center gap-2"
              >
                <PaymentIcon name={method.name} kind={method.id === null ? "cash" : "upi"} />
                <View className="min-w-0 flex-1">
                  <Text className="text-foreground text-[15px] font-medium" numberOfLines={1}>
                    {method.name}
                  </Text>
                  {method.archived ? (
                    <Text className="text-muted-foreground mt-0.5 text-xs">Archived</Text>
                  ) : null}
                </View>
                <Text
                  adjustsFontSizeToFit
                  className="text-foreground max-w-[45%] text-right text-base font-semibold tabular-nums"
                  numberOfLines={1}
                >
                  {formatRupee(method.amount)}
                </Text>
              </Pressable>
              {!method.archived ? (
                <Pressable
                  accessibilityLabel={`Add ${method.name} entry`}
                  disabled={disabled}
                  className="min-h-12 min-w-12 items-center justify-center"
                  onPress={() => onOpen(method.id, "add")}
                >
                  <Plus color={colors.primary} size={20} strokeWidth={2} />
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
