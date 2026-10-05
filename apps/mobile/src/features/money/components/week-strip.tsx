import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FlatList, Platform, View, useWindowDimensions } from "react-native";

import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { businessWeek, formatDisplayDate } from "@/lib/format/dates";
import { cn } from "@/lib/utils";
import type { LocalDate } from "../money.types";
import { dateOnWeekPage, weekPageIndex, weekPageStart } from "../week-pager.utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HISTORY_BATCH = 24;

export function WeekStrip({
  date,
  today,
  disabled,
  onSelect
}: {
  date: LocalDate;
  today: LocalDate;
  disabled: boolean;
  onSelect: (date: LocalDate) => void;
}) {
  const { fontScale, width: windowWidth } = useWindowDimensions();
  const [width, setWidth] = useState(() => Math.min(windowWidth, 608));
  const height = Math.max(64, 48 * fontScale + 16);

  return (
    <View
      testID="week-pager"
      className="-mx-4 overflow-hidden"
      style={{ height }}
      onLayout={({ nativeEvent }) => {
        if (nativeEvent.layout.width > 0) setWidth(nativeEvent.layout.width);
      }}
    >
      <WeekPages
        key={businessWeek(today)[0]}
        date={date}
        today={today}
        disabled={disabled}
        onSelect={onSelect}
        width={width}
        height={height}
      />
    </View>
  );
}

function WeekPages({
  date,
  today,
  disabled,
  onSelect,
  width,
  height
}: {
  date: LocalDate;
  today: LocalDate;
  disabled: boolean;
  onSelect: (date: LocalDate) => void;
  width: number;
  height: number;
}) {
  const activePage = weekPageIndex(date, today);
  const [viewport, setViewport] = useState({
    selectedPage: activePage,
    landedPage: activePage,
    initialPage: activePage,
    width,
    version: 0
  });
  const [historyCount, setHistoryCount] = useState(activePage + HISTORY_BATCH);
  const pageCount = Math.max(historyCount, activePage + 3);
  const pages = useMemo(() => Array.from({ length: pageCount }, (_, index) => index), [pageCount]);
  const gestureActive = useRef(false);
  const scrollIdle = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preserve the expanded history after a calendar jump, before rendering cells.
  if (historyCount < pageCount) setHistoryCount(pageCount);

  if (viewport.selectedPage !== activePage || viewport.width !== width) {
    const jump = viewport.landedPage !== activePage || viewport.width !== width;
    setViewport({
      selectedPage: activePage,
      landedPage: activePage,
      initialPage: jump ? activePage : viewport.initialPage,
      width,
      version: viewport.version + (jump ? 1 : 0)
    });
  }

  const initialOffset = useMemo(
    () => ({ x: viewport.initialPage * width, y: 0 }),
    [viewport.initialPage, width]
  );

  useLayoutEffect(() => {
    // Calendar/Today jumps start with the destination's cells already rendered.
    // Swipe acknowledgements retain the same list, pages, and physical offset.
    if (scrollIdle.current) clearTimeout(scrollIdle.current);
    gestureActive.current = false;
  }, [disabled, viewport.version]);

  useEffect(
    () => () => {
      if (scrollIdle.current) clearTimeout(scrollIdle.current);
    },
    []
  );

  function settleWeek(offset: number) {
    if (!width || disabled) return;
    const page = Math.max(0, Math.min(pageCount - 1, Math.round(offset / width)));
    setViewport((current) =>
      current.landedPage === page ? current : { ...current, landedPage: page }
    );
    const next = dateOnWeekPage(today, page, date);
    if (next !== date) onSelect(next);
  }

  return (
    <FlatList
      key={viewport.version}
      data={pages}
      horizontal
      inverted
      pagingEnabled
      initialScrollIndex={viewport.initialPage}
      contentOffset={Platform.OS === "web" ? undefined : initialOffset}
      initialNumToRender={3}
      maxToRenderPerBatch={5}
      windowSize={5}
      removeClippedSubviews={false}
      getItemLayout={(_data, index) => ({ length: width, offset: width * index, index })}
      keyExtractor={(page) => weekPageStart(today, page)}
      onEndReached={() => setHistoryCount((count) => Math.max(count, pageCount) + HISTORY_BATCH)}
      onEndReachedThreshold={2}
      scrollEnabled={!disabled}
      showsHorizontalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
      accessibilityLabel="Business week. Swipe to change weeks."
      onScrollBeginDrag={() => {
        gestureActive.current = true;
      }}
      onMomentumScrollEnd={({ nativeEvent }) => {
        // Ignore momentum callbacks left over from a canceled calendar/Today jump.
        if (!gestureActive.current) return;
        gestureActive.current = false;
        settleWeek(nativeEvent.contentOffset.x);
      }}
      // React Native Web emits scroll events but no native momentum-end event.
      scrollEventThrottle={16}
      onScroll={
        Platform.OS === "web"
          ? ({ nativeEvent }) => {
              if (scrollIdle.current) clearTimeout(scrollIdle.current);
              const offset = nativeEvent.contentOffset.x;
              scrollIdle.current = setTimeout(() => settleWeek(offset), 160);
            }
          : undefined
      }
      renderItem={({ item: page }) => (
        <View
          testID={`week-page-${weekPageStart(today, page)}`}
          aria-hidden={page !== activePage}
          className="flex-row"
          style={{ width, height }}
        >
          {businessWeek(weekPageStart(today, page)).map((day, index) => {
            const selected = day === date;
            return (
              <Pressable
                key={day}
                disabled={disabled || day > today}
                accessibilityLabel={formatDisplayDate(day)}
                accessibilityState={{ selected }}
                aria-pressed={selected}
                onPress={() => onSelect(day)}
                style={{ width: width / 7 }}
                className="min-h-12 min-w-0 items-center justify-center gap-0.5 py-1"
              >
                <Text
                  className={cn(
                    "text-[11px] leading-4",
                    selected ? "text-foreground font-semibold" : "text-muted-foreground"
                  )}
                >
                  {WEEKDAYS[index]}
                </Text>
                <View
                  className={cn(
                    "border-b-2 px-1 pb-0.5",
                    selected ? "border-primary" : "border-transparent"
                  )}
                >
                  <Text className="text-foreground text-[15px] leading-5 font-semibold tabular-nums">
                    {Number(day.slice(-2))}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    />
  );
}
