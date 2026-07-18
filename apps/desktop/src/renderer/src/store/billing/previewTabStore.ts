import { create } from "zustand";
import { devtools } from "zustand/middleware";

export const PREVIEW_TABS = ["bill", "customer"] as const;
export type PreviewTab = (typeof PREVIEW_TABS)[number];

type PreviewTabStore = {
  tabs: Record<string, PreviewTab>;
  setActiveTab: (billingTabId: string, tab: PreviewTab) => void;
  getActiveTab: (billingTabId: string) => PreviewTab;
  removeTab: (billingTabId: string) => void;
};

export const usePreviewTabStore = create<PreviewTabStore>()(
  devtools(
    (set, get) => ({
      tabs: {},

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
