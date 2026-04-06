import { OnboardingFlow } from "@/features/onboarding/OnboardingFlow";
import { useOnboardingStore } from "@/store/onboardingStore";
import { AnimatePresence, motion } from "motion/react";
import AppShell from "./AppShell";

const RootLayout = () => {
  const isOnboardingComplete = useOnboardingStore((state) => state.isOnboardingComplete);

  return (
    <AnimatePresence mode="wait">
      {!isOnboardingComplete ? (
        <OnboardingFlow key="onboarding" />
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="h-screen w-full"
        >
          <AppShell />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RootLayout;
