import { ScrollView } from "react-native";

import { Text } from "@/components/ui/text";
import { formatRupee } from "@/lib/format/money";
import { cn } from "@/lib/utils";

/** Keep complete rupee values together; extreme text sizes can scroll the value. */
export function MoneyAmount({
  amount,
  className,
  selectable = false
}: {
  amount: number;
  className?: string;
  selectable?: boolean;
}) {
  return (
    <ScrollView
      horizontal
      style={{ flexGrow: 0, flexShrink: 1, maxWidth: "100%" }}
      contentContainerStyle={{ alignItems: "center" }}
    >
      <Text
        className={cn("text-foreground text-base font-semibold tabular-nums", className)}
        numberOfLines={1}
        selectable={selectable}
      >
        {formatRupee(amount)}
      </Text>
    </ScrollView>
  );
}
