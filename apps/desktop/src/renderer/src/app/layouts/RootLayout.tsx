import { ErrorState } from "@/components/app-ui/ErrorState";
import useAppBootstrap from "@/app/useAppBootstrap";
import { useAppStore } from "@/app/app.store";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { LoaderCircle } from "lucide-react";
import React, { Suspense } from "react";
import AppShell from "./AppShell";

const OnboardingFlow = React.lazy(() =>
  import("@/features/onboarding/OnboardingFlow").then((module) => ({
    default: module.OnboardingFlow
  }))
);

const LoadingState = ({ label = "Loading Relay…" }: { label?: string }) => (
  <div className="bg-background flex h-screen w-full items-center justify-center p-3">
    <div className="border-border bg-card flex min-w-56 flex-col items-center gap-3 rounded-(--radius-panel) border p-4">
      <LoaderCircle className="text-marker size-7 animate-spin" />
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
    </div>
  </div>
);

const RootLayout = () => {
  const { isBootstrapping, hasError, retry, isRetrying } = useAppBootstrap();
  const isOnboardingComplete = useAppStore((state) => state.isOnboardingComplete);

  if (hasError) {
    return (
      <div className="bg-background h-screen w-full">
        <ErrorState
          layout="page"
          title="Relay could not start"
          description="Application data could not be loaded. Check the local service and try again."
          primaryAction={{ label: "Try again", onClick: () => void retry(), loading: isRetrying }}
          secondaryAction={{ label: "Reload Relay", onClick: () => window.location.reload() }}
        />
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
