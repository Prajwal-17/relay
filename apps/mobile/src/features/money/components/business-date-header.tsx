import { CalendarDays } from "lucide-react-native";
import { View, type GestureResponderEvent } from "react-native";

import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { formatDisplayDate, getDisplayDateParts } from "@/lib/format/dates";
import type { LocalDate } from "../money.types";
import { MoneyIconAction } from "./money-icon-action";

export function BusinessDateHeader({
  date,
  today,
  disabled,
  onToday,
  onCalendar
}: {
  date: LocalDate;
  today: LocalDate;
  disabled: boolean;
  onToday: () => void;
  onCalendar: (event: GestureResponderEvent) => void;
}) {
  const parts = getDisplayDateParts(date);
  return (
    <View className="min-h-12 flex-row flex-wrap items-center justify-between gap-x-2">
      <Text
        accessibilityRole="header"
        accessibilityLabel={`${parts.month} ${parts.year}`}
        className="text-foreground text-xl font-semibold"
      >
        {parts.month}
      </Text>
      <View className="flex-row flex-wrap items-center">
        {date !== today ? (
          <Pressable
            disabled={disabled}
            accessibilityLabel="Go to today"
            onPress={onToday}
            className="rounded-control min-h-12 min-w-12 justify-center px-1.5"
          >
            <Text className="text-counter-accent-foreground text-[13px] font-semibold">Today</Text>
          </Pressable>
        ) : null}
        <MoneyIconAction
          icon={CalendarDays}
          label={`Open calendar. Selected ${formatDisplayDate(date)}`}
          disabled={disabled}
          onPress={onCalendar}
        />
      </View>
    </View>
  );
}
