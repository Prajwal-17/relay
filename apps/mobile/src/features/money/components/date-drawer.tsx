import * as Haptics from "expo-haptics";
import { X } from "lucide-react-native";
import { useWindowDimensions, View } from "react-native";
import { CalendarList, type DateData } from "react-native-calendars";

import { Drawer } from "@/components/ui/drawer";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { getTodayIST, isFutureDate, parseLocalDate } from "@/lib/format/dates";
import { usePalette } from "@/theme/palette";
import type { LocalDate } from "../money.types";

interface DateDrawerProps {
  open: boolean;
  selectedDate: LocalDate;
  onClose: () => void;
  onSelect: (date: LocalDate) => void;
}

export function DateDrawer({ open, selectedDate, onClose, onSelect }: DateDrawerProps) {
  const colors = usePalette();
  const today = getTodayIST();
  const { width } = useWindowDimensions();
  const calendarWidth = Math.min(width, 576) - 24;
  const futureScrollRange =
    (Number(today.slice(0, 4)) - Number(selectedDate.slice(0, 4))) * 12 +
    Number(today.slice(5, 7)) -
    Number(selectedDate.slice(5, 7));

  function selectDate(day: DateData) {
    const date = parseLocalDate(day.dateString);
    if (!date || isFutureDate(date)) return;
    void Haptics.selectionAsync().catch(() => {});
    onSelect(date);
  }

  return (
    <Drawer open={open} onClose={onClose} label="calendar">
      <View className="border-border flex-row items-center justify-between border-b px-5 pt-2 pb-2">
        <Text accessibilityRole="header" className="text-foreground text-lg font-semibold">
          Choose a date
        </Text>
        <Pressable
          accessibilityLabel="Close calendar"
          className="min-h-12 min-w-12 items-center justify-center"
          onPress={onClose}
        >
          <X color={colors["muted-foreground"]} size={20} strokeWidth={1.8} />
        </Pressable>
      </View>
      <View className="h-[376px] px-3 pb-4">
        <CalendarList
          key={`${selectedDate.slice(0, 7)}-${calendarWidth}`}
          animateScroll
          calendarWidth={calendarWidth}
          current={selectedDate}
          disableAllTouchEventsForDisabledDays
          firstDay={1}
          futureScrollRange={futureScrollRange}
          hideExtraDays
          horizontal
          maxDate={today}
          markingType="custom"
          markedDates={{
            [today]: {
              customStyles: {
                container: {
                  backgroundColor: colors["counter-accent-soft"],
                  borderColor: colors["counter-accent"],
                  borderWidth: 1,
                  borderRadius: 6
                },
                text: { color: colors["counter-accent-foreground"], fontFamily: "Inter-SemiBold" }
              }
            },
            [selectedDate]: {
              selected: true,
              customStyles: {
                container: {
                  backgroundColor: colors.primary,
                  borderColor: selectedDate === today ? colors["counter-accent"] : colors.primary,
                  borderWidth: selectedDate === today ? 2 : 0,
                  borderRadius: 6
                },
                text: { color: colors["primary-foreground"], fontFamily: "Inter-SemiBold" }
              }
            }
          }}
          onDayPress={selectDate}
          pagingEnabled
          pastScrollRange={120}
          staticHeader
          style={{ backgroundColor: colors.card }}
          theme={{
            backgroundColor: colors.card,
            calendarBackground: colors.card,
            textSectionTitleColor: colors["muted-foreground"],
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: colors["primary-foreground"],
            todayTextColor: colors["counter-accent"],
            dayTextColor: colors.foreground,
            textDisabledColor: colors["border-strong"],
            arrowColor: colors.primary,
            monthTextColor: colors.foreground,
            textDayFontFamily: "Inter-Regular",
            textMonthFontFamily: "Inter-SemiBold",
            textDayHeaderFontFamily: "Inter-Medium",
            textDayFontSize: 15,
            textMonthFontSize: 15,
            textDayHeaderFontSize: 12,
            textDayStyle: { fontVariant: ["tabular-nums"] }
          }}
        />
      </View>
    </Drawer>
  );
}
