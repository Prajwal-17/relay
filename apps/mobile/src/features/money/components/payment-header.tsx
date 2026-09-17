import { ArrowLeft } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { IconButton } from "@/components/ui/icon-button";
import { PaymentIcon } from "./payment-icon";
import { formatDisplayDate } from "@/lib/format/dates";
import type { LocalDate } from "../money.types";

export function PaymentHeader({
  name,
  date,
  cash,
  saving,
  onBack
}: {
  name: string;
  date: LocalDate | null;
  cash: boolean;
  saving: boolean;
  onBack: () => void;
}) {
  return (
    <View className="border-border bg-surface border-b">
      <View className="w-full max-w-xl gap-2 self-center px-4 pt-2 pb-3">
        <View className="flex-row items-center gap-3">
          <IconButton icon={ArrowLeft} label="Back to Money" disabled={saving} onPress={onBack} />
          <Text
            accessibilityRole="header"
            className="text-ink min-w-0 flex-1 text-xl font-semibold"
          >
            {name || "Payment"}
          </Text>
          {name ? <PaymentIcon name={name} kind={cash ? "cash" : "upi"} /> : null}
        </View>
        {date ? <Text className="text-muted text-sm">{formatDisplayDate(date)}</Text> : null}
      </View>
    </View>
  );
}
