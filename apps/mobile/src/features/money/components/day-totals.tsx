import { View } from "react-native";

import { LedgerCard } from "@/components/ui/ledger-card";
import { Text } from "@/components/ui/text";
import { formatRupee } from "@/lib/format/money";

export function DayTotals({ received, paid }: { received: number; paid: number }) {
  return (
    <LedgerCard className="p-4">
      <View className="flex-row items-start gap-4">
        <View className="min-w-0 flex-1 pt-1">
          <Text className="text-ink text-sm font-semibold">Net for day</Text>
          <Text className="text-muted mt-0.5 text-xs">Received minus paid</Text>
        </View>
        <Text
          adjustsFontSizeToFit
          className="text-ink max-w-[65%] text-right text-[28px] leading-9 font-bold tracking-tight tabular-nums"
          numberOfLines={1}
        >
          {formatRupee(received - paid)}
        </Text>
      </View>
      <View className="border-border mt-3 flex-row gap-5 border-t pt-3">
        <View className="min-w-0 flex-1">
          <Text className="text-muted text-xs">Received</Text>
          <Text
            adjustsFontSizeToFit
            className="text-sales-ink mt-0.5 text-base font-semibold tabular-nums"
            numberOfLines={1}
          >
            {formatRupee(received)}
          </Text>
        </View>
        <View className="bg-border w-px" />
        <View className="min-w-0 flex-1">
          <Text className="text-muted text-xs">Paid</Text>
          <Text
            adjustsFontSizeToFit
            className="text-accent-ink mt-0.5 text-base font-semibold tabular-nums"
            numberOfLines={1}
          >
            {formatRupee(paid)}
          </Text>
        </View>
      </View>
    </LedgerCard>
  );
}
