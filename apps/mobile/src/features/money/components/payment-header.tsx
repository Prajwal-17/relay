import { ArrowLeft } from "lucide-react-native";
import { View } from "react-native";

import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { formatDisplayDate } from "@/lib/format/dates";
import { usePalette } from "@/theme/palette";
import type { LocalDate } from "../money.types";

export function PaymentHeader({
  name,
  date,
  onClose
}: {
  name: string;
  date: LocalDate | null;
  onClose: () => void;
}) {
  const colors = usePalette();
  return (
    <View className="border-border border-b">
      <View className="w-full max-w-xl flex-row items-center gap-2 self-center px-4 py-2">
        <Pressable
          accessibilityLabel="Back to Money"
          className="min-h-12 min-w-12 items-center justify-center"
          onPress={onClose}
        >
          <ArrowLeft color={colors.foreground} size={20} strokeWidth={1.8} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text
            accessibilityRole="header"
            className="text-foreground text-lg font-semibold"
            numberOfLines={1}
          >
            {name || "Payment"} entries
          </Text>
          {date ? (
            <Text className="text-muted-foreground mt-0.5 text-xs">{formatDisplayDate(date)}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
