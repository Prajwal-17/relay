import { SortOption, type SortType } from "@shared/types";
import type { DateRange } from "react-day-picker";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

type DashboardStoreType = {
  date: DateRange;
  setDate: (value: DateRange) => void;
  sortBy: SortType;
  setSortBy: (sortValue: SortType) => void;
};

const getTodayRange = (): DateRange => {
  const from = new Date();
  const to = new Date();
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return { from, to };
};

const getInitialDate = (): DateRange => {
  const storedDate = localStorage.getItem("daterange");
  if (storedDate) {
    try {
      const parsed = JSON.parse(storedDate);
      const from = new Date(parsed.from);
      const to = new Date(parsed.to);
      if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) return { from, to };
    } catch {
      localStorage.removeItem("daterange");
    }
  }

  return getTodayRange();
};

const getInitialSort = (): SortType => {
  const storedSort = localStorage.getItem("sort-by") as SortType | null;
  return storedSort && Object.values(SortOption).includes(storedSort)
    ? storedSort
    : SortOption.DATE_NEWEST_FIRST;
};

export const useDashboardStore = create<DashboardStoreType>()(
  devtools(
    (set) => ({
      date: getInitialDate(),
      setDate: (value) =>
        set(
          () => {
            localStorage.setItem("daterange", JSON.stringify(value));
            return { date: value };
          },
          false,
          "dashboard/setDate"
        ),

      sortBy: getInitialSort(),
      setSortBy: (sortValue) =>
        set(
          () => {
            localStorage.setItem("sort-by", sortValue);
            return {
              sortBy: sortValue
            };
          },
          false,
          "dashboard/setSortBy"
        )
    }),
    { name: "dashboard-store" }
  )
);
