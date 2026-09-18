import { Plus } from "lucide-react-native";
import { View } from "react-native";

import { IconButton } from "@/components/ui/icon-button";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { formatRupee } from "@/lib/format/money";
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
        <Text accessibilityRole="header" className="text-ink text-base font-semibold">
          Received methods
        </Text>
        <Text className="text-muted mt-1 text-xs">Tap a row for its entries. Use + to add.</Text>
      </View>
      <View className="border-border bg-surface rounded-card overflow-hidden border">
        {methods.map((method, index) => (
          <View
            key={method.id ?? "cash"}
            className={index < methods.length - 1 ? "border-border border-b" : undefined}
          >
            <View className="min-h-16 flex-row items-center gap-3 px-3 py-2.5">
              <Pressable
                accessibilityLabel={`${method.name}, ${formatRupee(method.amount)}. View entry history`}
                disabled={disabled}
                onPress={() => onOpen(method.id, "history")}
                className="min-w-0 flex-1 flex-row items-center gap-3"
              >
                <PaymentIcon name={method.name} kind={method.id === null ? "cash" : "upi"} />
                <View className="min-w-0 flex-1">
                  <Text className="text-ink text-sm font-medium" numberOfLines={1}>
                    {method.name}
                  </Text>
                  {method.archived ? (
                    <Text className="text-muted mt-0.5 text-xs">Archived</Text>
                  ) : null}
                </View>
                <Text
                  adjustsFontSizeToFit
                  className="text-ink max-w-[45%] text-right text-base font-semibold tabular-nums"
                  numberOfLines={1}
                >
                  {formatRupee(method.amount)}
                </Text>
              </Pressable>
              {!method.archived ? (
                <IconButton
                  icon={Plus}
                  label={`Add ${method.name} entry`}
                  disabled={disabled}
                  className="bg-accent-soft border-transparent"
                  onPress={() => onOpen(method.id, "add")}
                />
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
