import type { SalesType } from "@shared/types";
import { create } from "zustand";

type SalesStoreType = {
  sales: SalesType[] | [];
  setSales: (newSales: SalesType[] | []) => void;
};

export const useSalesStore = create<SalesStoreType>((set) => ({
  sales: [],
  setSales: (newSales) =>
    set(() => ({
      sales: newSales
    }))
}));
