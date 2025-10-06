import { SortOption, type EstimateType, type SalesType, type SortType } from "@shared/types";
import type { DateRange } from "react-day-picker";
import { create } from "zustand";

type DashboardStoreType = {
  sales: SalesType[] | [];
  setSales: (newSales: SalesType[] | []) => void;
  estimates: EstimateType[] | [];
  setEstimates: (newEstimates: EstimateType[] | []) => void;
  date: DateRange | undefined;
  setDate: (value: DateRange | undefined) => void;
  sortBy: SortType;
  setSortBy: (sortValue: SortType) => void;
};

const getInitialDate = (): DateRange => {
  const storedDate = localStorage.getItem("daterange");
  if (storedDate) {
    const parsed = JSON.parse(storedDate);
    return { from: new Date(parsed.from), to: new Date(parsed.to) };
  }

  // Default to today
  const from = new Date();
  const to = new Date();
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return { from, to };
};

export const useDashboardStore = create<DashboardStoreType>((set) => ({
  sales: [],
  setSales: (newSales) =>
    set(() => ({
      sales: newSales
    })),

  estimates: [],
  setEstimates: (newEstimates) =>
    set(() => ({
      estimates: newEstimates
    })),

  date: getInitialDate(),
  setDate: (value) =>
    set(() => ({
      date: value
    })),

  sortBy: SortOption.DATE_NEWEST_FIRST,
  setSortBy: (sortValue) =>
    set(() => {
      localStorage.setItem("sort-by", sortValue);
      return {
        sortBy: sortValue
      };
    })
}));
