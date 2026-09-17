import { formatRupee } from "@/lib/format/money";
import { View } from "react-native";
import { Text } from "@/components/ui/text";

export function DayTotals({ received, paid }: { received: number; paid: number }) {
  return (
    <View>
      <View className="pb-4">
        <Text className="text-muted text-sm">Net for day</Text>
        <Text className="text-ink mt-1 text-[22px] font-bold tracking-tight tabular-nums">
          {formatRupee(received - paid)}
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-x-6 gap-y-3">
        <View className="min-w-[40%] grow">
          <Text className="text-muted text-xs">Received</Text>
          <Text className="text-ink mt-1 text-base font-semibold tabular-nums">
            {formatRupee(received)}
          </Text>
        </View>
        <View className="min-w-[40%] grow">
          <Text className="text-muted text-xs">Vendor payments</Text>
          <Text className="text-ink mt-1 text-base font-semibold tabular-nums">
            − {formatRupee(paid)}
          </Text>
        </View>
      </View>
    </View>
  );
}
