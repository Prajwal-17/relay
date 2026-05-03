import { TRANSACTION_TYPE, type TransactionType } from "@shared/types";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const MAX_BILLING_TABS = 8;

export type BillingTabType = {
  id: string;
  type: TransactionType;
  transactionNo: number | null;
  routePath: string;
};

type BillingTabsStore = {
  tabs: BillingTabType[];
  activeTabId: string | null;
  addTab: (
    type: TransactionType,
    routePath: string,
    transactionNo?: number | null,
    deduplicate?: boolean
  ) => BillingTabType | null;
  removeTab: (tabId: string) => string | null;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Omit<BillingTabType, "id">>) => void;
  findTabByRoute: (routePath: string) => BillingTabType | undefined;
  reset: () => void;
};

const sortTabsInPlace = (tabs: BillingTabType[]) => {
  tabs.sort((a, b) => {
    if (a.type === b.type) return 0;
    return a.type === TRANSACTION_TYPE.SALE ? -1 : 1;
  });
};

export const useBillingTabsStore = create<BillingTabsStore>()(
  devtools(
    immer((set, get) => ({
      tabs: [],
      activeTabId: null,

      addTab: (type, routePath, transactionNo = null, deduplicate = true) => {
        const state = get();

        // if tab with same route exists, just activate it (skip when deduplicate=false)
        if (deduplicate) {
          const existing = state.tabs.find((t) => t.routePath === routePath);
          if (existing) {
            set(
              (state) => {
                state.activeTabId = existing.id;
              },
              false,
              "tabs/activateExisting"
            );
            return existing;
          }
        }

        if (state.tabs.length >= MAX_BILLING_TABS) {
          return null;
        }

        const newTab: BillingTabType = {
          id: uuidv4(),
          type,
          transactionNo,
          routePath
        };

        set(
          (state) => {
            state.tabs.push(newTab);
            sortTabsInPlace(state.tabs);
            state.activeTabId = newTab.id;
          },
          false,
          "tabs/addTab"
        );

        return newTab;
      },

      removeTab: (tabId) => {
        let newActiveId: string | null = null;

        set(
          (state) => {
            const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
            if (tabIndex === -1) {
              newActiveId = state.activeTabId;
              return;
            }

            state.tabs.splice(tabIndex, 1);

            if (state.tabs.length > 0) {
              if (state.activeTabId === tabId) {
                const newIndex = Math.min(tabIndex, state.tabs.length - 1);
                state.activeTabId = state.tabs[newIndex].id;
              }
            } else {
              state.activeTabId = null;
            }
            newActiveId = state.activeTabId;
          },
          false,
          "tabs/removeTab"
        );

        return newActiveId;
      },

      setActiveTab: (tabId) => {
        set(
          (state) => {
            state.activeTabId = tabId;
          },
          false,
          "tabs/setActiveTab"
        );
      },

      updateTab: (tabId, updates) => {
        set(
          (state) => {
            const tab = state.tabs.find((t) => t.id === tabId);
            if (tab) {
              Object.assign(tab, updates);
              sortTabsInPlace(state.tabs);
            }
          },
          false,
          "tabs/updateTab"
        );
      },

      findTabByRoute: (routePath) => {
        return get().tabs.find((t) => t.routePath === routePath);
      },

      reset: () => {
        set(
          (state) => {
            state.tabs = [];
            state.activeTabId = null;
          },
          false,
          "tabs/reset"
        );
      }
    })),
    { name: "billing-tabs-store" }
  )
);
