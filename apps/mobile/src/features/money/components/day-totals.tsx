import { ScrollView, View, useWindowDimensions } from "react-native";

import { LedgerCard } from "@/components/ui/ledger-card";
import { Text } from "@/components/ui/text";
import { formatRupee } from "@/lib/format/money";
import { cn } from "@/lib/utils";

function LedgerAmount({ value, className }: { value: string; className: string }) {
  return (
    <ScrollView
      horizontal
      style={{ flexGrow: 0, flexShrink: 1, maxWidth: "100%" }}
      contentContainerStyle={{ alignItems: "center" }}
    >
      <Text className={cn("font-semibold tabular-nums", className)} numberOfLines={1} selectable>
        {value}
      </Text>
    </ScrollView>
  );
}

export function DayTotals({
  received,
  paid,
  isToday
}: {
  received: number;
  paid: number;
  isToday: boolean;
}) {
  const { width, fontScale } = useWindowDimensions();
  const net = formatRupee(received - paid);
  const receivedLabel = formatRupee(received);
  const paidLabel = formatRupee(paid);
  const contentWidth = Math.min(width, 576) - 66;
  const stack = net.length > 10 || fontScale > 1.3 || width < 350;
  const compactNet = net.length * 15 > contentWidth;
  const stackTotals =
    Math.max(receivedLabel.length, paidLabel.length) * 10 * fontScale > (contentWidth - 32) / 2;
  return (
    <LedgerCard className="border-frame">
      <View className={cn("gap-2 px-4 py-4", !stack && "flex-row items-start justify-between")}>
        <Text className="text-foreground text-[15px] font-semibold">
          {isToday ? "Today's net" : "Day net"}
        </Text>
        <LedgerAmount
          value={net}
          className={cn(
            "text-foreground font-bold tracking-tight",
            compactNet ? "text-lg leading-6" : "text-[28px] leading-8"
          )}
        />
      </View>
      <View className={cn("border-border border-t", !stackTotals && "flex-row")}>
        <View className="min-w-0 flex-1 gap-1 px-4 py-3">
          <Text className="text-muted-foreground text-[13px]">Received</Text>
          <LedgerAmount value={receivedLabel} className="text-sales-ink text-lg" />
        </View>
        <View
          className={cn(
            "border-border min-w-0 flex-1 gap-1 px-4 py-3",
            stackTotals ? "border-t" : "border-l"
          )}
        >
          <Text className="text-muted-foreground text-[13px]">Paid</Text>
          <LedgerAmount value={paidLabel} className="text-counter-accent-foreground text-lg" />
        </View>
      </View>
    </LedgerCard>
  );
}
