import { create } from "zustand";
import { devtools } from "zustand/middleware";

export const PREVIEW_TABS = ["bill", "customer"] as const;
export type PreviewTab = (typeof PREVIEW_TABS)[number];

const PREVIEW_PANEL_STORAGE_KEY = "quickcart-billing-preview-open-v2";

const getInitialPanelState = () => {
  if (typeof window === "undefined") return true;
  const savedValue = window.localStorage.getItem(PREVIEW_PANEL_STORAGE_KEY);
  if (savedValue !== null) return savedValue === "true";
  return true;
};

type PreviewTabStore = {
  tabs: Record<string, PreviewTab>;
  isPanelOpen: boolean;
  setPanelOpen: (isOpen: boolean) => void;
  setActiveTab: (billingTabId: string, tab: PreviewTab) => void;
  getActiveTab: (billingTabId: string) => PreviewTab;
  removeTab: (billingTabId: string) => void;
};

export const usePreviewTabStore = create<PreviewTabStore>()(
  devtools(
    (set, get) => ({
      tabs: {},
      isPanelOpen: getInitialPanelState(),

      setPanelOpen: (isPanelOpen) => {
        window.localStorage.setItem(PREVIEW_PANEL_STORAGE_KEY, String(isPanelOpen));
        set({ isPanelOpen }, false, "previewTab/setPanelOpen");
      },

      setActiveTab: (billingTabId, tab) =>
        set(
          (state) => ({ tabs: { ...state.tabs, [billingTabId]: tab } }),
          false,
          "previewTab/setActiveTab"
        ),

      getActiveTab: (billingTabId) => get().tabs[billingTabId] ?? "bill",

      removeTab: (billingTabId) =>
        set(
          (state) => {
            // eslint-disable-next-line
            const { [billingTabId]: _, ...rest } = state.tabs;
            return { tabs: rest };
          },
          false,
          "previewTab/removeTab"
        )
    }),
    { name: "billing-preview-tab-store" }
  )
);
