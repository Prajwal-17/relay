import { View } from "react-native";

import { LedgerCard } from "@/components/ui/ledger-card";
import { Text } from "@/components/ui/text";
import { formatRupee } from "@/lib/format/money";

export function DayTotals({ received, paid }: { received: number; paid: number }) {
  return (
    <LedgerCard className="border-frame p-4">
      <View className="flex-row items-start gap-4">
        <View className="min-w-0 flex-1 pt-1">
          <Text className="text-foreground text-[15px] font-semibold">Net for day</Text>
        </View>
        <Text
          adjustsFontSizeToFit
          className="text-foreground max-w-[68%] text-right text-[28px] leading-8 font-bold tracking-tight tabular-nums"
          numberOfLines={1}
        >
          {formatRupee(received - paid)}
        </Text>
      </View>
      <View className="border-border mt-3 flex-row gap-5 border-t pt-3">
        <View className="min-w-0 flex-1">
          <Text className="text-muted-foreground text-[13px]">Received</Text>
          <Text
            adjustsFontSizeToFit
            className="text-sales-ink mt-1 text-base font-semibold tabular-nums"
            numberOfLines={1}
          >
            {formatRupee(received)}
          </Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-muted-foreground text-[13px]">Paid</Text>
          <Text
            adjustsFontSizeToFit
            className="text-counter-accent-foreground mt-1 text-base font-semibold tabular-nums"
            numberOfLines={1}
          >
            {formatRupee(paid)}
          </Text>
        </View>
      </View>
    </LedgerCard>
  );
}
