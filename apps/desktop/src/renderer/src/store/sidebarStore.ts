import { create } from "zustand";
import { devtools } from "zustand/middleware";

type SidebarStoreType = {
  isSidebarPinned: boolean;
  setIsSidebarPinned: (value: boolean) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
  isDndDragging: boolean;
  setIsDndDragging: (value: boolean) => void;
};

export const useSidebarStore = create<SidebarStoreType>()(
  devtools(
    (set) => ({
      isSidebarPinned: false,
      setIsSidebarPinned: (value) =>
        set(() => ({ isSidebarPinned: value }), false, "sidebar/setIsSidebarPinned"),

      isSidebarOpen: true,
      setIsSidebarOpen: (value) =>
        set(() => ({ isSidebarOpen: value }), false, "sidebar/setIsSidebarOpen"),

      isDndDragging: false,
      setIsDndDragging: (value) =>
        set(() => ({ isDndDragging: value }), false, "sidebar/setIsDndDragging")
    }),
    { name: "sidebar-store" }
  )
);
