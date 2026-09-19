import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { X } from "lucide-react-native";
import { View } from "react-native";
import { Calendar, type DateData } from "react-native-calendars";

import { IconButton } from "@/components/ui/icon-button";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { getTodayIST, isFutureDate, parseLocalDate } from "@/lib/format/dates";
import { usePalette } from "@/theme/palette";

export default function CalendarScreen() {
  const colors = usePalette();
  const params = useLocalSearchParams<{ date?: string }>();
  const today = getTodayIST();
  const selectedDate = parseLocalDate(params.date) ?? today;

  function selectDate(day: DateData) {
    const date = parseLocalDate(day.dateString);
    if (!date || isFutureDate(date)) return;
    void Haptics.selectionAsync().catch(() => {});
    router.dismissTo({ pathname: "/money", params: { date } });
  }

  return (
    <SafeAreaView className="bg-canvas flex-1" edges={["top", "bottom", "left", "right"]}>
      <View className="flex-1 px-4 pt-3 pb-4">
        <View className="mb-2 flex-row items-center justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text accessibilityRole="header" className="text-ink text-xl font-semibold">
              Choose a date
            </Text>
            <Text className="text-muted mt-1 text-xs">Future dates are unavailable.</Text>
          </View>
          <IconButton icon={X} label="Close calendar" onPress={() => router.back()} />
        </View>

        <View className="border-border bg-surface rounded-card overflow-hidden border p-1">
          <Calendar
            disableAllTouchEventsForDisabledDays
            enableSwipeMonths
            firstDay={1}
            hideExtraDays
            initialDate={selectedDate}
            maxDate={today}
            markedDates={{
              [selectedDate]: {
                selected: true,
                selectedColor: colors.primary,
                selectedTextColor: colors["primary-foreground"]
              }
            }}
            onDayPress={selectDate}
            style={{ backgroundColor: colors.surface }}
            theme={{
              backgroundColor: colors.surface,
              calendarBackground: colors.surface,
              textSectionTitleColor: colors.muted,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors["primary-foreground"],
              todayTextColor: colors.accent,
              dayTextColor: colors.ink,
              textDisabledColor: colors["border-strong"],
              arrowColor: colors.primary,
              monthTextColor: colors.ink,
              textDayFontFamily: "Inter-Regular",
              textMonthFontFamily: "Inter-SemiBold",
              textDayHeaderFontFamily: "Inter-Medium",
              textDayFontSize: 15,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
              textDayStyle: { fontVariant: ["tabular-nums"] }
            }}
          />
        </View>

        <View className="mt-3 flex-row items-center gap-2 px-1">
          <View className="bg-accent h-2 w-2 rounded-full" />
          <Text className="text-muted text-xs">Today</Text>
          <View className="bg-primary ml-3 h-2 w-2 rounded-full" />
          <Text className="text-muted text-xs">Selected</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
