import { View } from "react-native";

import { LedgerCard } from "@/components/ui/ledger-card";
import { Text } from "@/components/ui/text";
import { formatRupee } from "@/lib/format/money";

export function DayTotals({ received, paid }: { received: number; paid: number }) {
  return (
    <LedgerCard className="px-4 py-4">
      <Text className="text-muted text-xs font-medium tracking-wide uppercase">Net for day</Text>
      <Text
        adjustsFontSizeToFit
        className="text-ink mt-1 text-[28px] leading-9 font-bold tracking-tight tabular-nums"
        numberOfLines={1}
      >
        {formatRupee(received - paid)}
      </Text>
      <View className="border-border mt-3 flex-row flex-wrap gap-x-6 gap-y-2 border-t pt-3">
        <View className="min-w-[40%] grow">
          <Text className="text-muted text-xs">Received</Text>
          <Text
            adjustsFontSizeToFit
            className="text-ink mt-0.5 text-base font-semibold tabular-nums"
            numberOfLines={1}
          >
            {formatRupee(received)}
          </Text>
        </View>
        <View className="min-w-[40%] grow">
          <Text className="text-muted text-xs">Paid</Text>
          <Text
            adjustsFontSizeToFit
            className="text-ink mt-0.5 text-base font-semibold tabular-nums"
            numberOfLines={1}
          >
            {formatRupee(paid)}
          </Text>
        </View>
      </View>
    </LedgerCard>
  );
}
