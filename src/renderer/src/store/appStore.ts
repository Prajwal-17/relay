import type { AppConfig } from "@shared/types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface AppStoreConfig extends Omit<AppConfig, "billing"> {
  billing: {
    defaultCustomerId: string | null;
  };
}

type AppStore = {
  isOnboardingComplete: boolean;
  setIsOnboardingComplete: (value: boolean) => void;
  config: AppStoreConfig;
  setConfig: (config: AppConfig) => void;
};

function defaultPreferences() {
  return {
    billing: {
      defaultCustomerId: null
    },
    exports: {
      askBeforeSavingPdf: false,
      defaultPdfLocation: "",
      defaultExportFormat: ""
    }
  };
}

export const useAppStore = create<AppStore>()(
  devtools((set) => ({
    isOnboardingComplete: false,
    setIsOnboardingComplete: (value) =>
      set(
        () => ({
          isOnboardingComplete: value
        }),
        false,
        "appstore/setIsOnboardingComplete"
      ),

    config: defaultPreferences(),
    setConfig: (config) =>
      set(
        () => ({
          config: config
        }),
        false,
        "appstore/setConfig"
      )
  }))
);
