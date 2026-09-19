import { X } from "lucide-react-native";
import { View } from "react-native";

import { IconButton } from "@/components/ui/icon-button";
import { Text } from "@/components/ui/text";
import { formatDisplayDate } from "@/lib/format/dates";
import type { LocalDate } from "../money.types";
import { PaymentIcon } from "./payment-icon";

export function PaymentHeader({
  name,
  date,
  cash,
  mode,
  saving,
  onClose
}: {
  name: string;
  date: LocalDate | null;
  cash: boolean;
  mode: "add" | "history";
  saving: boolean;
  onClose: () => void;
}) {
  return (
    <View className="border-border bg-canvas border-b">
      <View className="w-full max-w-xl flex-row items-center gap-3 self-center px-4 pt-3 pb-3">
        {name ? <PaymentIcon name={name} kind={cash ? "cash" : "upi"} /> : null}
        <View className="min-w-0 flex-1">
          <Text
            accessibilityRole="header"
            className="text-ink text-xl font-semibold"
            numberOfLines={1}
          >
            {mode === "history" ? `${name || "Payment"} entries` : `Add ${name || "payment"}`}
          </Text>
          {date ? (
            <Text className="text-muted mt-0.5 text-xs">{formatDisplayDate(date)}</Text>
          ) : null}
        </View>
        <IconButton icon={X} label="Close" disabled={saving} onPress={onClose} />
      </View>
    </View>
  );
}
