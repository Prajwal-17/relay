import { create } from "zustand";

type SidebarStoreType = {
  isSidebarPinned: boolean;
  setIsSidebarPinned: (value: boolean) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
};

export const useSidebarStore = create<SidebarStoreType>((set) => ({
  isSidebarPinned: false,
  setIsSidebarPinned: (value) =>
    set(() => ({
      isSidebarPinned: value
    })),

  isSidebarOpen: true,
  setIsSidebarOpen: (value) =>
    set(() => ({
      isSidebarOpen: value
    }))
}));
