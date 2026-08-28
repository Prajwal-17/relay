import { create } from "zustand";
import { devtools } from "zustand/middleware";

type AppStore = {
  isOnboardingComplete: boolean;
  setIsOnboardingComplete: (value: boolean) => void;
};

export const useAppStore = create<AppStore>()(
  devtools((set) => ({
    isOnboardingComplete: false,
    setIsOnboardingComplete: (value) =>
      set(() => ({ isOnboardingComplete: value }), false, "appstore/setIsOnboardingComplete")
  }))
);
