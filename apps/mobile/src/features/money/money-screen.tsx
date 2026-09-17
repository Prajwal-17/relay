import { Pressable } from "@/components/ui/pressable";
import { usePalette } from "@/theme/palette";
import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Pencil, Trash2 } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "@/components/ui/safe-area-view";

import { confirmAction } from "@/lib/confirm-action";
import { AppButton } from "@/components/ui/app-button";
import { DayTotals } from "@/features/money/components/day-totals";
import { MonthCalendar } from "@/features/money/components/month-calendar";
import { ReceivedMethods } from "./components/received-methods";
import { DayDetails } from "./components/day-details";
import {
  formatDisplayDate,
  getTodayIST,
  isFutureDate,
  isSameMonth,
  monthFromDate,
  shiftMonth,
  type LedgerMonth
} from "@/lib/format/dates";
import {
  deleteDailyEntry,
  getDailyEntry,
  listMonthSummaries,
  listOnlineChannels
} from "@/features/money/money.repository";
import {
  type DailyEntry,
  type DaySummary,
  type LocalDate,
  type OnlineChannel
} from "@/features/money/money.types";
import { summarizeEntry } from "./money.utils";
import { formatRupee } from "@/lib/format/money";

export default function MoneyScreen() {
  const colors = usePalette();
  const db = useSQLiteContext();
  const router = useRouter();
  const today = getTodayIST();
  const [month, setMonth] = useState<LedgerMonth>(() => monthFromDate(today));
  const [selectedDate, setSelectedDate] = useState<LocalDate>(today);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [summaries, setSummaries] = useState<DaySummary[]>([]);
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [channels, setChannels] = useState<OnlineChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const requestId = useRef(0);

  const loadLedger = useCallback(
    async (showRefresh = false) => {
      const request = ++requestId.current;
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [monthRows, selectedEntry, channelRows] = await Promise.all([
          listMonthSummaries(db, month),
          getDailyEntry(db, selectedDate),
          listOnlineChannels(db, true)
        ]);
        if (request !== requestId.current) return;
        setSummaries(monthRows);
        setEntry(selectedEntry);
        setChannels(channelRows);
      } catch (loadError) {
        if (request === requestId.current)
          setError(loadError instanceof Error ? loadError.message : "Could not read the ledger.");
      } finally {
        if (request === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [db, month, selectedDate]
  );

  useFocusEffect(
    useCallback(() => {
      void loadLedger();
      return () => {
        requestId.current += 1;
      };
    }, [loadLedger])
  );

  const actionsDisabled = deleting;

  const summaryMap = useMemo(
    () => new Map(summaries.map((summary) => [summary.date, summary])),
    [summaries]
  );
  const selectedSummary = entry ? summarizeEntry(entry) : null;
  const dateValue = new Date(`${selectedDate}T12:00:00Z`);
  const weekday = new Intl.DateTimeFormat("en-IN", { weekday: "long", timeZone: "UTC" }).format(
    dateValue
  );
  const dateLabel = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(dateValue);

  function changeMonth(amount: number) {
    const nextMonth = shiftMonth(month, amount);
    setMonth(nextMonth);
    setSelectedDate(
      isSameMonth(today, nextMonth)
        ? today
        : (`${nextMonth.year}-${String(nextMonth.month + 1).padStart(2, "0")}-01` as LocalDate)
    );
  }

  function openEditor() {
    if (isFutureDate(selectedDate)) return;
    router.push({ pathname: "/entry", params: { date: selectedDate } });
  }

  function openPayment(channelId: number | null, history = false) {
    router.push({
      pathname: "/payment",
      params: {
        date: selectedDate,
        channel: channelId === null ? "cash" : String(channelId),
        history: history ? "1" : "0"
      }
    });
  }

  function confirmDelete() {
    if (!entry || !selectedSummary) return;
    confirmAction(
      "Delete this day's record?",
      `${formatDisplayDate(entry.date)}\nReceived ${formatRupee(selectedSummary.receivedPaisa)} · Paid ${formatRupee(selectedSummary.paidPaisa)}\n\nThis cannot be undone.`,
      "Delete",
      () => {
        setDeleting(true);
        void deleteDailyEntry(db, entry.date)
          .then(() => loadLedger())
          .catch((deleteError) => {
            setError(
              deleteError instanceof Error ? deleteError.message : "Could not delete this record."
            );
          })
          .finally(() => setDeleting(false));
      }
    );
  }

  return (
    <SafeAreaView className="bg-canvas flex-1" edges={["top", "left", "right"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="items-center px-5 pb-6 pt-5"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            enabled={!actionsDisabled}
            onRefresh={() => {
              if (!actionsDisabled) void loadLedger(true);
            }}
            colors={[colors["accent"]]}
            tintColor={colors["accent"]}
          />
        }
      >
        <View className="w-full max-w-xl gap-6">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${formatDisplayDate(selectedDate)}. ${calendarOpen ? "Close" : "Open"} calendar`}
            accessibilityHint="Shows the monthly ledger calendar"
            disabled={actionsDisabled}
            accessibilityState={{ expanded: calendarOpen, disabled: actionsDisabled }}
            onPress={() => setCalendarOpen(!calendarOpen)}
            className="min-h-16 self-start py-1"
          >
            <Text className="text-muted text-sm font-medium">
              {selectedDate === today ? `Today, ${weekday}` : weekday}
            </Text>
            <Text
              accessibilityRole="header"
              className="text-ink mt-1 text-2xl leading-8 font-semibold tracking-tight"
            >
              {dateLabel}
            </Text>
          </Pressable>

          {calendarOpen && !actionsDisabled ? (
            <MonthCalendar
              month={month}
              selectedDate={selectedDate}
              today={today}
              summaries={summaryMap}
              loading={loading}
              onPreviousMonth={() => changeMonth(-1)}
              onNextMonth={() => changeMonth(1)}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setCalendarOpen(false);
              }}
            />
          ) : null}

          {loading ? (
            <View className="min-h-40 items-center justify-center gap-3 py-6">
              <ActivityIndicator color={colors["accent"]} />
              <Text className="text-muted text-sm">Loading…</Text>
            </View>
          ) : error ? (
            <View className="gap-4 py-5">
              <Text accessibilityRole="alert" className="text-destructive text-base">
                {error}
              </Text>
              <AppButton variant="outline" onPress={() => void loadLedger()}>
                Try again
              </AppButton>
            </View>
          ) : (
            <>
              <View className="border-border border-y py-5">
                <DayTotals
                  received={selectedSummary?.receivedPaisa ?? 0}
                  paid={selectedSummary?.paidPaisa ?? 0}
                />
              </View>
              <ReceivedMethods
                entry={entry}
                channels={channels}
                onOpen={openPayment}
                disabled={actionsDisabled}
              />
              <DayDetails
                entry={entry}
                disabled={deleting}
                onAdd={() =>
                  router.push({ pathname: "/vendor-payment", params: { date: selectedDate } })
                }
              />
              <AppButton
                icon={Pencil}
                variant="outline"
                onPress={openEditor}
                disabled={actionsDisabled}
              >
                {entry ? "Edit record" : "Set daily totals"}
              </AppButton>
              {entry ? (
                <View className="border-border mt-3 border-t pt-4">
                  <AppButton
                    compact
                    icon={Trash2}
                    loading={deleting}
                    variant="destructive"
                    disabled={actionsDisabled}
                    onPress={confirmDelete}
                  >
                    Delete day&apos;s record
                  </AppButton>
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
