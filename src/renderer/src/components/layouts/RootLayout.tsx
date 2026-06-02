import useAppBootstrap from "@/hooks/useAppBootstrap";
import { useAppStore } from "@/store/appStore";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { Suspense } from "react";
import AppShell from "./AppShell";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const OnboardingFlow = React.lazy(() =>
  import("@/features/onboarding/OnboardingFlow").then((module) => ({
    default: module.OnboardingFlow
  }))
);

const RootLayout = () => {
  const { isBootstrapping } = useAppBootstrap();
  const isOnboardingComplete = useAppStore((state) => state.isOnboardingComplete);

  return (
    <AnimatePresence mode="wait">
      {isBootstrapping ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-background flex h-screen w-full items-center justify-center"
        >
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="text-primary h-10 w-10 animate-spin" />
            <p className="text-muted-foreground animate-pulse text-base font-medium">Loading ...</p>
          </div>
        </motion.div>
      ) : !isOnboardingComplete ? (
        <Suspense
          fallback={
            <div className="bg-background flex h-screen w-full items-center justify-center">
              <Loader2 className="text-primary h-10 w-10 animate-spin" />
            </div>
          }
        >
          <OnboardingFlow key="onboarding" />
        </Suspense>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="h-screen w-full"
        >
          <AppShell />
          <ReactQueryDevtools initialIsOpen={false} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RootLayout;
