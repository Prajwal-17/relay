import { Button } from "@/components/ui/button";
import useAppBootstrap from "@/app/useAppBootstrap";
import { useAppStore } from "@/app/app.store";
import { useQueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { LoaderCircle } from "lucide-react";
import React, { Suspense } from "react";
import AppShell from "./AppShell";

const OnboardingFlow = React.lazy(() =>
  import("@/features/onboarding/OnboardingFlow").then((module) => ({
    default: module.OnboardingFlow
  }))
);

const LoadingState = ({ label = "Loading QuickCart…" }: { label?: string }) => (
  <div className="bg-background flex h-screen w-full items-center justify-center p-3">
    <div className="border-border bg-card flex min-w-56 flex-col items-center gap-3 rounded-(--radius-panel) border p-4">
      <LoaderCircle className="text-brand size-7 animate-spin" />
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
    </div>
  </div>
);

const RootLayout = () => {
  const { isBootstrapping, hasError } = useAppBootstrap();
  const isOnboardingComplete = useAppStore((state) => state.isOnboardingComplete);
  const queryClient = useQueryClient();

  if (hasError) {
    return (
      <div className="bg-background flex h-screen w-full items-center justify-center p-3">
        <div className="border-border bg-card flex min-w-64 flex-col items-center gap-3 rounded-(--radius-panel) border p-4 text-center">
          <div>
            <h1 className="text-foreground text-base font-semibold">QuickCart could not start</h1>
            <p className="text-muted-foreground mt-1 text-sm">Failed to load application data.</p>
          </div>
          <Button size="sm" onClick={() => queryClient.invalidateQueries()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isBootstrapping) return <LoadingState />;

  if (!isOnboardingComplete) {
    return (
      <Suspense fallback={<LoadingState label="Preparing setup…" />}>
        <OnboardingFlow />
      </Suspense>
    );
  }

  return (
    <div className="h-screen w-full">
      <AppShell />
      <ReactQueryDevtools initialIsOpen={false} />
    </div>
  );
};

export default RootLayout;
