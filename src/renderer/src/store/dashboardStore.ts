import { SortOption, type EstimateType, type SalesType, type SortType } from "@shared/types";
import { create } from "zustand";

type DashboardStoreType = {
  sales: SalesType[] | [];
  setSales: (newSales: SalesType[] | []) => void;
  estimates: EstimateType[] | [];
  setEstimates: (newEstimates: EstimateType[] | []) => void;
  sortBy: SortType;
  setSortBy: (sortValue: SortType) => void;
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

  sortBy: SortOption.DATE_NEWEST_FIRST,
  setSortBy: (sortValue) =>
    set(() => {
      localStorage.setItem("sort-by", sortValue);
      return {
        sortBy: sortValue
      };
    })
}));
