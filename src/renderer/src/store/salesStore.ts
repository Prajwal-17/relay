import type { EstimateType, SalesType } from "@shared/types";
import { create } from "zustand";

type DashboardStoreType = {
  sales: SalesType[] | [];
  setSales: (newSales: SalesType[] | []) => void;
  estimates: EstimateType[] | [];
  setEstimates: (newEstimates: EstimateType[] | []) => void;
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
    }))
}));
