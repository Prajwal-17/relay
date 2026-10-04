import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, View, useWindowDimensions, type GestureResponderEvent } from "react-native";
import { Calendar, type DateData } from "react-native-calendars";

import { AppButton } from "@/components/ui/app-button";
import { Drawer } from "@/components/ui/drawer";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import {
  formatDisplayDate,
  formatDisplayMonth,
  monthFromDate,
  monthStart,
  parseLocalDate,
  shiftMonth
} from "@/lib/format/dates";
import { cn } from "@/lib/utils";
import { usePalette } from "@/theme/palette";
import { monthSummariesOptions } from "../money.queries";
import type { LocalDate } from "../money.types";
import { MoneyIconAction } from "./money-icon-action";

export function DateDrawer({
  open,
  animate,
  selectedDate,
  today,
  onClose,
  onSelect
}: {
  open: boolean;
  animate: boolean;
  selectedDate: LocalDate;
  today: LocalDate;
  onClose: (event?: GestureResponderEvent) => void;
  onSelect: (date: LocalDate, event?: GestureResponderEvent) => void;
}) {
  const colors = usePalette();
  const { width } = useWindowDimensions();
  const [month, setMonth] = useState(() => monthFromDate(selectedDate));
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setMonth(monthFromDate(selectedDate));
  }
  const summaries = useQuery({
    ...monthSummariesOptions(month),
    enabled: open
  });
  const hasEntries = new Set(summaries.data?.map((summary) => summary.date));
  const canNext = monthStart(shiftMonth(month, 1)) <= today;
  const title = formatDisplayMonth(month);
  const dayWidth = (Math.min(width, 576) - (width <= 340 ? 12 : 32)) / 7;
  const calendarTheme = { calendarBackground: colors.card, weekVerticalMargin: 0 };
  return (
    <Drawer
      open={open}
      animate={animate}
      presentation="ledger"
      onClose={onClose}
      label="calendar"
      header={
        <View className="border-border min-h-14 flex-row items-center justify-between border-b px-4">
          <Text
            accessibilityRole="header"
            className="text-foreground min-w-0 flex-1 text-lg font-semibold"
          >
            Choose a date
          </Text>
          <MoneyIconAction icon={X} label="Close calendar" onPress={onClose} />
        </View>
      }
    >
      <ScrollView
        style={{ flexShrink: 1 }}
        contentContainerClassName={cn("pb-3", width <= 340 ? "px-1.5" : "px-4")}
      >
        <View className="min-h-12 flex-row items-center justify-between">
          <MoneyIconAction
            icon={ChevronLeft}
            label="Previous month"
            disabled={month.year <= 2000 && month.month === 0}
            onPress={() => setMonth(shiftMonth(month, -1))}
          />
          <Text
            accessibilityRole="header"
            accessibilityLiveRegion="polite"
            className="text-foreground min-w-0 flex-1 text-center text-[15px] font-semibold"
          >
            {title}
          </Text>
          <MoneyIconAction
            icon={ChevronRight}
            label="Next month"
            disabled={!canNext}
            onPress={() => {
              if (canNext) setMonth(shiftMonth(month, 1));
            }}
          />
        </View>
        <View className="flex-row py-1.5">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <Text key={day} className="text-muted-foreground flex-1 text-center text-[11px]">
              {day}
            </Text>
          ))}
        </View>
        <Calendar
          key={monthStart(month)}
          current={monthStart(month)}
          firstDay={0}
          hideArrows
          hideDayNames
          hideExtraDays
          disableMonthChange
          maxDate={today}
          customHeader={() => null}
          style={{ paddingLeft: 0, paddingRight: 0, backgroundColor: colors.card }}
          theme={calendarTheme}
          dayComponent={({ date }: { date?: DateData }) => {
            const day = parseLocalDate(date?.dateString);
            if (!day) return null;
            const selected = day === selectedDate;
            return (
              <Pressable
                disabled={day > today}
                accessibilityState={{ selected }}
                aria-pressed={selected}
                accessibilityLabel={`${formatDisplayDate(day)}${hasEntries.has(day) ? ", has entries" : ""}`}
                onPress={(event) => onSelect(day, event)}
                style={{ width: dayWidth }}
                className={cn(
                  "rounded-control min-h-12 items-center justify-center gap-1 py-1",
                  selected && "bg-primary",
                  !selected && day === today && "bg-counter-accent-soft"
                )}
              >
                <Text
                  className={cn(
                    "text-sm tabular-nums",
                    selected ? "text-primary-foreground font-semibold" : "text-foreground"
                  )}
                >
                  {date?.day}
                </Text>
                <View
                  className={cn(
                    "h-[3px] w-[3px] rounded-full",
                    hasEntries.has(day)
                      ? selected
                        ? "bg-primary-foreground"
                        : "bg-counter-accent"
                      : "bg-transparent"
                  )}
                />
              </Pressable>
            );
          }}
        />
        {summaries.isError ? (
          <Text accessibilityRole="alert" className="text-muted-foreground py-2 text-xs">
            Entry dots unavailable. Dates can still be selected.
          </Text>
        ) : null}
        <AppButton
          variant="ghost"
          loading={summaries.isFetching}
          disabled={summaries.isFetching}
          onPress={() => void summaries.refetch()}
        >
          Refresh
        </AppButton>
        <AppButton variant="outline" className="mt-2" onPress={(event) => onSelect(today, event)}>
          Go to today
        </AppButton>
      </ScrollView>
    </Drawer>
  );
}
