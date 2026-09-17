import { Pressable } from "@/components/ui/pressable";
import * as Haptics from "expo-haptics";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "@/components/ui/text";

import { buildCalendarMonth, isFutureDate, monthLabel, type LedgerMonth } from "@/lib/format/dates";
import type { DaySummary, LocalDate } from "@/features/money/money.types";
import { formatCompactRupee } from "@/lib/format/money";
import { cn } from "@/lib/utils";

import { IconButton } from "@/components/ui/icon-button";
import { LedgerCard } from "@/components/ui/ledger-card";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface MonthCalendarProps {
  month: LedgerMonth;
  selectedDate: LocalDate;
  today: LocalDate;
  summaries: Map<LocalDate, DaySummary>;
  loading?: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: LocalDate) => void;
}

export function MonthCalendar({
  month,
  selectedDate,
  today,
  summaries,
  loading,
  onPreviousMonth,
  onNextMonth,
  onSelectDate
}: MonthCalendarProps) {
  const cells = buildCalendarMonth(month);

  return (
    <LedgerCard>
      <View className="border-border flex-row items-center justify-between border-b px-3 py-3">
        <IconButton icon={ChevronLeft} label="Previous month" onPress={onPreviousMonth} />
        <View className="items-center">
          <Text className="text-ink text-xl font-semibold">{monthLabel(month)}</Text>
          <Text className="text-muted mt-0.5 text-xs">
            {loading ? "Updating ledger…" : "Daily receipts"}
          </Text>
        </View>
        <IconButton
          disabled={
            month.year > Number(today.slice(0, 4)) ||
            (month.year === Number(today.slice(0, 4)) &&
              month.month >= Number(today.slice(5, 7)) - 1)
          }
          icon={ChevronRight}
          label="Next month"
          onPress={onNextMonth}
        />
      </View>

      <View className="pt-3 pb-2">
        <View className="mb-1 flex-row">
          {WEEKDAYS.map((weekday, index) => (
            <View
              key={`${weekday}-${index}`}
              className="items-center"
              style={{ width: "14.2857%" }}
            >
              <Text className="text-muted text-[11px] font-semibold">{weekday}</Text>
            </View>
          ))}
        </View>

        <View className="flex-row flex-wrap">
          {cells.map((cell, index) => {
            if (!cell) {
              return (
                <View
                  key={`blank-${index}`}
                  className="min-h-[58px]"
                  style={{ width: "14.2857%" }}
                />
              );
            }

            const summary = summaries.get(cell.date);
            const selected = cell.date === selectedDate;
            const isToday = cell.date === today;
            const disabled = isFutureDate(cell.date);

            return (
              <View key={cell.date} style={{ width: "14.2857%" }}>
                <Pressable
                  accessibilityLabel={`${cell.day}, ${monthLabel(month)}${summary ? `, received ${formatCompactRupee(summary.receivedPaisa)}` : ", no entry"}`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled, selected }}
                  disabled={disabled}
                  onPress={() => {
                    void Haptics.selectionAsync().catch(() => {});
                    onSelectDate(cell.date);
                  }}
                  className={cn(
                    "rounded-control min-h-[56px] items-center justify-center border",
                    selected
                      ? "border-calendar-range-edge bg-calendar-range-edge"
                      : summary
                        ? "border-border bg-surface-muted"
                        : "web:hover:bg-accent-soft border-transparent bg-transparent"
                  )}
                >
                  <Text
                    className={cn(
                      "text-sm font-semibold",
                      selected ? "text-calendar-range-edge-foreground" : "text-ink",
                      isToday && !selected && "text-accent"
                    )}
                  >
                    {cell.day}
                  </Text>
                  {summary ? (
                    <Text
                      className={cn(
                        "mt-0.5 text-[10px] font-bold",
                        selected ? "text-calendar-range-edge-foreground" : "text-ink"
                      )}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {formatCompactRupee(summary.receivedPaisa)}
                    </Text>
                  ) : isToday ? (
                    <View
                      className={cn(
                        "mt-1 h-1 w-1 rounded-full",
                        selected ? "bg-primary-foreground" : "bg-accent"
                      )}
                    />
                  ) : null}
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    </LedgerCard>
  );
}
