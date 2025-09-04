import { create } from "zustand";

type SidebarStoreType = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
};

export const useSidebarStore = create<SidebarStoreType>((set) => ({
  isSidebarOpen: true,
  setIsSidebarOpen: (value) =>
    set(() => ({
      isSidebarOpen: value
    }))
}));
